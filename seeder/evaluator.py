#!/usr/bin/env python3
"""
evaluator.py — Offline simulation evaluation of the personalization pipeline.

Implements exactly what Section 3.4 / 4.4 of the paper describes:

  - 10-fold stratified 80/20 post split (every post seeds exactly once)
  - Agent interest profiles: personality vector × topic centroids
  - Content seeding protocol: 100 target agents × 20 seeds (10 in-graph, 10 out-of-graph)
  - Three ranking conditions per fold: chronological, random, personalized
  - Logistic engagement simulation; profile updates per Eq 3.1
  - Composite score per Eq 3.2: score(i) = r(i) · f(i) · (1 + ε·g(i))
  - PPR-based cross-instance discovery (Eq 3.3) with personalized vs random baseline
  - Output: results/agent_precision.csv, results/fold_reachability.csv,
            results/fold_recovery.csv

Usage:
    python evaluator.py [--pkl network.pkl] [--out results]
"""

from __future__ import annotations

import argparse
import csv
import os
import pickle
import sys
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple

import numpy as np

import config

# ── Paper constants ─────────────────────────────────────────────────────────

ATTENTION_LIMIT     = 40      # max posts read per session (§3.4.3)
N_TARGET_AGENTS     = 100     # evaluation target agents (§3.4.2)
N_SEEDS_INGRAPH     = 10      # in-graph seeds per target (§3.4.4)
N_SEEDS_OUTGRAPH    = 10      # out-of-graph seeds per target (§3.4.4)
N_FOLDS             = 10      # cross-validation folds (§3.4.1)
MIN_ENGAGEMENTS     = 5       # engagements before personalized ranking activates (§5.1)
SEED_RELEVANCE_THR  = 0.20    # minimum cosine sim for a post to be a valid seed
DISCOVERY_THR       = 0.20    # cosine sim threshold for cross-instance suggestions (§3.3.5)
LOGISTIC_K          = 10.0    # engagement curve steepness (§3.4.3)
LOGISTIC_THETA      = 0.30    # engagement curve midpoint (§3.4.3)
PPR_BETA            = 0.15    # teleport probability for Personalized PageRank (§3.3.5)
PPR_ITERS           = 40      # power-iteration steps
PPR_TOP_INSTANCES   = 5       # number of top-PPR instances to query for discovery
EPSILON             = 0.10    # engagement signal weight in composite score (Eq 3.2)
FRESHNESS_HALF_DAYS = 7.0     # exponential decay half-life in days (§3.3.4)

# Engagement action weights: follow > boost > reply > like (§3.3.3)
ACTION_TYPES   = ["follow", "boost", "reply", "like"]
ACTION_WEIGHTS = {"follow": 1.0, "boost": 0.7, "reply": 0.5, "like": 0.3}
ACTION_PRIOR   = [0.05, 0.15, 0.20, 0.60]   # P(action type | engaged)

EMBED_CACHE = "embeddings_cache.npz"


# ── Embedding ────────────────────────────────────────────────────────────────

def load_or_compute_embeddings(
    post_ids: List[str],
    post_texts: List[str],
    cache_path: str = EMBED_CACHE,
) -> np.ndarray:
    """
    Returns (N, 384) float32 array of all-MiniLM-L6-v2 embeddings, using a
    disk cache so the model only runs once per dataset.
    """
    if os.path.exists(cache_path):
        print(f"Loading embeddings from cache: {cache_path}")
        data = np.load(cache_path, allow_pickle=True)
        cached_ids = data["ids"].tolist()
        if cached_ids == post_ids:
            return data["embeddings"].astype(np.float32)
        print("Cache mismatch — recomputing embeddings.")

    print(f"Computing embeddings for {len(post_ids)} posts using all-MiniLM-L6-v2 …")
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        sys.exit(
            "sentence-transformers not installed. "
            "Run: pip install sentence-transformers"
        )

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(
        post_texts,
        batch_size=512,
        show_progress_bar=True,
        normalize_embeddings=True,
    ).astype(np.float32)

    np.savez_compressed(
        cache_path,
        ids=np.array(post_ids, dtype=object),
        embeddings=embeddings,
    )
    print(f"Embeddings cached to {cache_path}")
    return embeddings


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two unit vectors (both already normalized)."""
    return float(np.clip(np.dot(a, b), -1.0, 1.0))


def _freshness(created_at: str) -> float:
    """Exponential freshness decay f(i) = exp(-λ·Δt_days), λ = ln(2)/halflife."""
    try:
        t = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        delta_days = (datetime.now(timezone.utc) - t).total_seconds() / 86400.0
        lam = np.log(2.0) / FRESHNESS_HALF_DAYS
        return float(np.exp(-lam * delta_days))
    except Exception:
        return 0.5


def _composite_score(relevance: float, freshness: float, engagement: float) -> float:
    """Eq 3.2: score(i) = r(i) · f(i) · (1 + ε·g(i))."""
    r = max(0.0, relevance)
    g = np.log1p(max(0.0, engagement))
    return r * freshness * (1.0 + EPSILON * g)


def _update_profile(p: np.ndarray, e: np.ndarray, w: float) -> np.ndarray:
    """Eq 3.1: p ← (p + w·eᵢ) / ‖p + w·eᵢ‖"""
    updated = p + w * e
    norm = np.linalg.norm(updated)
    return updated / norm if norm > 1e-10 else p


def _engage_prob(sim: float) -> float:
    """Eq 3.4: P(engage|sim) = σ(k·(sim − θ))."""
    return 1.0 / (1.0 + np.exp(-LOGISTIC_K * (sim - LOGISTIC_THETA)))


# ── Graph data extraction ────────────────────────────────────────────────────

def extract_graph_data(G) -> Tuple[
    Dict[str, dict],   # users
    Dict[str, dict],   # posts
    Dict[str, List[str]],  # user_id -> [post_ids]
    Dict[str, List[str]],  # user_id -> [following user_ids]
]:
    users: Dict[str, dict] = {}
    posts: Dict[str, dict] = {}
    user_posts: Dict[str, List[str]] = defaultdict(list)
    user_follows: Dict[str, List[str]] = defaultdict(list)

    for nid, d in G.nodes(data=True):
        nt = d.get("node_type")
        if nt == "user":
            users[nid] = d
        elif nt == "post":
            posts[nid] = d

    for nid, d in G.nodes(data=True):
        if d.get("node_type") == "user":
            following_str = d.get("following", "")
            if following_str:
                user_follows[nid] = [f for f in following_str.split(",") if f and f in users]

    for nid, d in posts.items():
        aid = d.get("author_id", "")
        if aid and aid in users:
            user_posts[aid].append(nid)

    return users, posts, user_posts, user_follows


# ── Topic centroids & agent profiles ────────────────────────────────────────

def compute_topic_centroids(
    post_ids: List[str],
    post_data: Dict[str, dict],
    embeddings: np.ndarray,
    pid_to_idx: Dict[str, int],
) -> Dict[str, np.ndarray]:
    """Average embedding per topic, normalized."""
    topic_vecs: Dict[str, List[np.ndarray]] = defaultdict(list)
    for pid in post_ids:
        topic = post_data[pid].get("topic", "")
        if topic and pid in pid_to_idx:
            topic_vecs[topic].append(embeddings[pid_to_idx[pid]])

    centroids: Dict[str, np.ndarray] = {}
    for topic, vecs in topic_vecs.items():
        c = np.mean(vecs, axis=0)
        norm = np.linalg.norm(c)
        centroids[topic] = c / norm if norm > 1e-10 else c
    return centroids


def build_agent_profiles(
    users: Dict[str, dict],
    topic_centroids: Dict[str, np.ndarray],
    topics: List[str],
) -> Dict[str, np.ndarray]:
    """
    Profile p = normalized weighted sum of topic centroids.
    Weights come from the agent's personality vector (derived from real post
    topic distributions in loader.py). Falls back to Dirichlet(α=0.5) if
    personality is missing.
    """
    rng = np.random.RandomState(config.SEED)
    K = len(topics)
    profiles: Dict[str, np.ndarray] = {}
    dim = next(iter(topic_centroids.values())).shape[0] if topic_centroids else 384

    for uid, u in users.items():
        personality_str = u.get("personality", "")
        if personality_str:
            try:
                weights = np.array([float(x) for x in personality_str.split(",")])
            except ValueError:
                weights = rng.dirichlet([0.5] * K)
        else:
            weights = rng.dirichlet([0.5] * K)

        if len(weights) < K:
            weights = np.pad(weights, (0, K - len(weights)))
        weights = weights[:K]
        total = weights.sum()
        if total > 1e-10:
            weights = weights / total

        p = np.zeros(dim, dtype=np.float32)
        for i, topic in enumerate(topics):
            if topic in topic_centroids and i < len(weights):
                p += float(weights[i]) * topic_centroids[topic]

        norm = np.linalg.norm(p)
        profiles[uid] = (p / norm).astype(np.float32) if norm > 1e-10 else p

    return profiles


# ── Stratified 10-fold split ─────────────────────────────────────────────────

def make_stratified_folds(
    post_ids: List[str],
    post_data: Dict[str, dict],
    n_folds: int = N_FOLDS,
    seed: int = config.SEED,
) -> List[Tuple[List[str], List[str]]]:
    """
    Returns list of (consumption_ids, seeding_ids) tuples, one per fold.
    Every post appears in the seeding partition exactly once (§3.4.1).
    Split is stratified by topic.
    """
    rng = np.random.RandomState(seed)
    topic_buckets: Dict[str, List[str]] = defaultdict(list)
    for pid in post_ids:
        topic = post_data[pid].get("topic", "unknown")
        topic_buckets[topic].append(pid)

    # Shuffle each bucket independently
    for bucket in topic_buckets.values():
        rng.shuffle(bucket)

    folds: List[Tuple[List[str], List[str]]] = []
    for fold_k in range(n_folds):
        consumption: List[str] = []
        seeding: List[str] = []
        for bucket in topic_buckets.values():
            n = len(bucket)
            start = int(fold_k * n / n_folds)
            end = int((fold_k + 1) * n / n_folds)
            seeding.extend(bucket[start:end])
            consumption.extend(bucket[:start] + bucket[end:])
        folds.append((consumption, seeding))

    return folds


# ── Seed assignment ───────────────────────────────────────────────────────────

def assign_seeds(
    target_id: str,
    seeding_set: Set[str],
    user_follows: Dict[str, List[str]],
    user_posts: Dict[str, List[str]],
    profiles: Dict[str, np.ndarray],
    post_data: Dict[str, dict],
    embeddings: np.ndarray,
    pid_to_idx: Dict[str, int],
    rng: np.random.RandomState,
) -> Tuple[List[str], List[str]]:
    """
    For a target agent, assign:
      - N_SEEDS_INGRAPH seed posts from in-graph agents (agents target follows)
      - N_SEEDS_OUTGRAPH seed posts from out-of-graph agents (agents target does NOT follow)

    Each seed post is from the seeding_set and has cosine sim > SEED_RELEVANCE_THR
    to the target's profile.
    """
    profile_t = profiles[target_id]
    target_instance = user_follows.get(target_id, [])
    following_set: Set[str] = set(user_follows.get(target_id, []))

    # Candidate in-graph: agents target follows
    # Candidate out-of-graph: agents target does NOT follow, from different instances
    target_inst_idx = None
    # We'll identify instance by looking up user data later

    def relevant_posts_from(uid: str) -> List[str]:
        """Posts in seeding_set by uid with sim > threshold to target profile."""
        result = []
        for pid in user_posts.get(uid, []):
            if pid not in seeding_set or pid not in pid_to_idx:
                continue
            sim = _cosine(profile_t, embeddings[pid_to_idx[pid]])
            if sim >= SEED_RELEVANCE_THR:
                result.append(pid)
        return result

    # In-graph seeds
    in_graph_agents = list(following_set)
    rng.shuffle(in_graph_agents)
    in_seeds: List[str] = []
    for agent_id in in_graph_agents:
        if len(in_seeds) >= N_SEEDS_INGRAPH:
            break
        cands = relevant_posts_from(agent_id)
        if cands:
            in_seeds.append(rng.choice(cands))

    # Out-of-graph seeds
    all_user_ids = list(user_posts.keys())
    rng.shuffle(all_user_ids)
    out_seeds: List[str] = []
    for agent_id in all_user_ids:
        if len(out_seeds) >= N_SEEDS_OUTGRAPH:
            break
        if agent_id == target_id or agent_id in following_set:
            continue
        cands = relevant_posts_from(agent_id)
        if cands:
            out_seeds.append(rng.choice(cands))

    return in_seeds, out_seeds


# ── Agent session simulation ─────────────────────────────────────────────────

def simulate_session(
    target_id: str,
    timeline_pool: List[str],   # post_ids available on timeline
    in_seed_ids: Set[str],      # in-graph seeds (subset of timeline_pool)
    profile: np.ndarray,
    condition: str,             # "chronological" | "random" | "personalized"
    post_data: Dict[str, dict],
    embeddings: np.ndarray,
    pid_to_idx: Dict[str, int],
    rng: np.random.RandomState,
) -> Tuple[float, float, np.ndarray]:
    """
    Simulate one agent session.

    Returns:
        reachability      — fraction of in-graph seeds consumed (in [0,1])
        consumed_precision — mean cosine sim of read posts to initial profile
        updated_profile   — profile after engagement-driven updates
    """
    if not timeline_pool:
        return 0.0, 0.0, profile

    # Precompute sims and freshness scores for ranking
    sims = {}
    fresh = {}
    for pid in timeline_pool:
        if pid not in pid_to_idx:
            continue
        sims[pid] = _cosine(profile, embeddings[pid_to_idx[pid]])
        fresh[pid] = _freshness(post_data[pid].get("created_at", ""))

    valid_pool = [p for p in timeline_pool if p in sims]

    # Sort pool by condition
    if condition == "chronological":
        # newest first
        ordered = sorted(
            valid_pool,
            key=lambda p: post_data[p].get("created_at", ""),
            reverse=True,
        )
    elif condition == "random":
        ordered = valid_pool.copy()
        rng.shuffle(ordered)
    elif condition == "personalized":
        # Use composite score; chronological until MIN_ENGAGEMENTS
        # (We start chronological, switch after threshold — approximated
        #  here by applying relevance ordering for the whole session since
        #  profile is pre-built from personality; see §5.1 note.)
        ordered = sorted(
            valid_pool,
            key=lambda p: _composite_score(sims[p], fresh[p], 0.0),
            reverse=True,
        )
    else:
        raise ValueError(f"Unknown condition: {condition}")

    # Read up to ATTENTION_LIMIT posts
    to_read = ordered[:ATTENTION_LIMIT]

    seeds_consumed = 0
    precision_sum = 0.0
    p = profile.copy()
    n_engaged = 0

    for pid in to_read:
        sim = _cosine(p, embeddings[pid_to_idx[pid]])
        precision_sum += max(0.0, sim)

        if pid in in_seed_ids:
            seeds_consumed += 1

        # Engagement probability
        if rng.random() < _engage_prob(sim):
            # Sample action type
            action_idx = rng.choice(len(ACTION_TYPES), p=ACTION_PRIOR)
            w = ACTION_WEIGHTS[ACTION_TYPES[action_idx]]
            p = _update_profile(p, embeddings[pid_to_idx[pid]], w)
            n_engaged += 1

    n_read = len(to_read)
    reachability = seeds_consumed / N_SEEDS_INGRAPH if N_SEEDS_INGRAPH > 0 else 0.0
    consumed_precision = precision_sum / n_read if n_read > 0 else 0.0

    return reachability, consumed_precision, p


# ── Personalized PageRank ────────────────────────────────────────────────────

def compute_ppr(
    target_id: str,
    user_ids: List[str],
    user_follows: Dict[str, List[str]],
    beta: float = PPR_BETA,
    n_iter: int = PPR_ITERS,
) -> Dict[str, float]:
    """
    Power-iteration PPR per Eq 3.3: π = β·e_u + (1−β)·Wᵀ·π
    W is row-stochastic: W[i,j] = 1/out_deg(i) if i follows j.
    Returns {user_id: ppr_score}.
    """
    n = len(user_ids)
    if n == 0 or target_id not in {u for u in user_ids}:
        return {}

    idx: Dict[str, int] = {uid: i for i, uid in enumerate(user_ids)}

    # Build Wᵀ column by column (row i of Wᵀ = column i of W)
    # Wᵀ[j, i] = 1/out_deg(i) if i follows j
    WT = np.zeros((n, n), dtype=np.float32)
    for uid in user_ids:
        i = idx[uid]
        neighbors = [f for f in user_follows.get(uid, []) if f in idx]
        deg = len(neighbors)
        if deg > 0:
            for nb in neighbors:
                j = idx[nb]
                WT[j, i] = 1.0 / deg

    u_i = idx[target_id]
    e_u = np.zeros(n, dtype=np.float32)
    e_u[u_i] = 1.0

    pi = e_u.copy()
    for _ in range(n_iter):
        pi = beta * e_u + (1.0 - beta) * (WT @ pi)

    return {user_ids[i]: float(pi[i]) for i in range(n)}


# ── Cross-instance discovery ─────────────────────────────────────────────────

def cross_instance_recovery(
    target_id: str,
    out_seed_ids: List[str],
    ppr_scores: Dict[str, float],
    users: Dict[str, dict],
    user_posts: Dict[str, List[str]],
    user_follows: Dict[str, List[str]],
    profiles: Dict[str, np.ndarray],
    post_data: Dict[str, dict],
    embeddings: np.ndarray,
    pid_to_idx: Dict[str, int],
    rng: np.random.RandomState,
) -> Tuple[float, float]:
    """
    Evaluate cross-instance discovery (§3.3.5 / §3.4.5).

    Personalized condition: query public timelines of top-PPR instances,
    filter by sim(p, eᵢ) > DISCOVERY_THR and social proof.
    Baseline: random sample from same instance timelines.

    Returns (personalized_recovery, baseline_recovery).
    """
    if not out_seed_ids:
        return 0.0, 0.0

    out_seed_set = set(out_seed_ids)
    following_set: Set[str] = set(user_follows.get(target_id, []))
    profile_t = profiles[target_id]
    target_instance = users[target_id].get("instance", "")

    # Rank instances by sum of PPR scores of their users
    instance_scores: Dict[str, float] = defaultdict(float)
    for uid, score in ppr_scores.items():
        inst = users.get(uid, {}).get("instance", "")
        if inst and inst != target_instance:
            instance_scores[inst] += score

    top_instances = sorted(
        instance_scores, key=instance_scores.get, reverse=True
    )[:PPR_TOP_INSTANCES]

    if not top_instances:
        return 0.0, 0.0

    # Collect public-timeline posts from top instances (not from followed users)
    public_posts: List[str] = []
    for uid, u in users.items():
        if u.get("instance", "") in top_instances and uid not in following_set and uid != target_id:
            for pid in user_posts.get(uid, []):
                if pid in pid_to_idx:
                    public_posts.append(pid)

    if not public_posts:
        return 0.0, 0.0

    # ── Personalized filter ──────────────────────────────────────────────────
    # A post surfaces if sim(p_T, eᵢ) > DISCOVERY_THR AND social proof:
    # at least one person in T's follow graph also has sim > DISCOVERY_THR
    # (proxy for "at least one interaction from someone in follow graph")

    follower_profiles = {uid: profiles[uid] for uid in following_set if uid in profiles}

    personalized_surface: Set[str] = set()
    for pid in public_posts:
        e = embeddings[pid_to_idx[pid]]
        if _cosine(profile_t, e) < DISCOVERY_THR:
            continue
        # Social proof: any follower also finds this relevant
        social_proof = any(
            _cosine(fp, e) >= DISCOVERY_THR for fp in follower_profiles.values()
        )
        if social_proof:
            personalized_surface.add(pid)

    pers_found = len(out_seed_set & personalized_surface)
    pers_recovery = pers_found / N_SEEDS_OUTGRAPH

    # ── Baseline: random sample of N_SAMPLE posts ────────────────────────────
    N_SAMPLE = min(len(public_posts), 50)
    sample_idxs = rng.choice(len(public_posts), size=N_SAMPLE, replace=False)
    sampled = {public_posts[i] for i in sample_idxs}
    base_found = len(out_seed_set & sampled)
    base_recovery = base_found / N_SEEDS_OUTGRAPH

    return pers_recovery, base_recovery


# ── Main evaluation loop ──────────────────────────────────────────────────────

def run_evaluation(pkl_path: str = "network.pkl", out_dir: str = "results") -> None:
    import networkx as nx

    os.makedirs(out_dir, exist_ok=True)

    # ── Load graph ───────────────────────────────────────────────────────────
    print(f"Loading network from {pkl_path} …")
    with open(pkl_path, "rb") as f:
        G: nx.DiGraph = pickle.load(f)

    users, post_data, user_posts, user_follows = extract_graph_data(G)
    all_post_ids = list(post_data.keys())
    print(f"  {len(users)} users, {len(all_post_ids)} posts")

    # ── Embeddings ───────────────────────────────────────────────────────────
    texts = [post_data[pid].get("content", "") for pid in all_post_ids]
    embeddings = load_or_compute_embeddings(all_post_ids, texts)
    pid_to_idx = {pid: i for i, pid in enumerate(all_post_ids)}

    # ── Topic centroids & agent profiles ────────────────────────────────────
    topics = sorted({post_data[pid].get("topic", "") for pid in all_post_ids} - {""})
    print(f"  {len(topics)} topics: {topics}")
    topic_centroids = compute_topic_centroids(all_post_ids, post_data, embeddings, pid_to_idx)
    profiles = build_agent_profiles(users, topic_centroids, topics)
    print(f"  Built {len(profiles)} agent profiles")

    # ── Folds ────────────────────────────────────────────────────────────────
    folds = make_stratified_folds(all_post_ids, post_data)
    print(f"  Created {len(folds)} stratified folds")

    # ── Select target agents ─────────────────────────────────────────────────
    # Pick agents with enough followees who have posts in the dataset
    rng_select = np.random.RandomState(config.SEED)
    eligible = [
        uid for uid in users
        if len(user_follows.get(uid, [])) >= N_SEEDS_INGRAPH
        and len(user_posts.get(uid, [])) > 0
    ]
    if len(eligible) < N_TARGET_AGENTS:
        print(f"  Warning: only {len(eligible)} eligible agents (need {N_TARGET_AGENTS})")
    rng_select.shuffle(eligible)
    target_agents = eligible[:N_TARGET_AGENTS]
    print(f"  Selected {len(target_agents)} target agents")

    # ── All user ids for PPR ─────────────────────────────────────────────────
    user_id_list = list(users.keys())

    # ── Output writers ───────────────────────────────────────────────────────
    prec_path = os.path.join(out_dir, "agent_precision.csv")
    reach_path = os.path.join(out_dir, "fold_reachability.csv")
    recov_path = os.path.join(out_dir, "fold_recovery.csv")

    prec_rows:  List[dict] = []
    reach_rows: List[dict] = []
    recov_rows: List[dict] = []

    conditions = ["chronological", "random", "personalized"]

    # ── Main loop ─────────────────────────────────────────────────────────────
    for fold_k, (consumption_ids, seeding_ids) in enumerate(folds):
        print(f"\n── Fold {fold_k + 1}/{N_FOLDS} "
              f"(consumption={len(consumption_ids)}, seeding={len(seeding_ids)}) ──")

        seeding_set = set(seeding_ids)
        rng_fold = np.random.RandomState(config.SEED + fold_k * 1000)

        fold_reach: Dict[str, List[float]] = {c: [] for c in conditions}
        fold_pers_recov: List[float] = []
        fold_base_recov: List[float] = []

        for t_idx, target_id in enumerate(target_agents):
            rng_agent = np.random.RandomState(config.SEED + fold_k * 1000 + t_idx)

            # Assign seeds
            in_seeds, out_seeds = assign_seeds(
                target_id=target_id,
                seeding_set=seeding_set,
                user_follows=user_follows,
                user_posts=user_posts,
                profiles=profiles,
                post_data=post_data,
                embeddings=embeddings,
                pid_to_idx=pid_to_idx,
                rng=rng_agent,
            )
            in_seed_set = set(in_seeds)

            # Build timeline pool: posts from followed users (within consumption set)
            # plus in-graph seeds (from seeding set — these ARE federated to the target)
            following_set = set(user_follows.get(target_id, []))
            timeline_pool: List[str] = []
            for uid in following_set:
                for pid in user_posts.get(uid, []):
                    if pid in consumption_ids or pid in in_seed_set:
                        if pid in pid_to_idx:
                            timeline_pool.append(pid)
            # Add in-graph seeds explicitly (they may not be in consumption set)
            for pid in in_seeds:
                if pid not in timeline_pool and pid in pid_to_idx:
                    timeline_pool.append(pid)

            # Run three conditions
            agent_prec_row = {"fold": fold_k, "agent_id": target_id}
            for cond in conditions:
                reach, prec, _ = simulate_session(
                    target_id=target_id,
                    timeline_pool=timeline_pool,
                    in_seed_ids=in_seed_set,
                    profile=profiles[target_id].copy(),
                    condition=cond,
                    post_data=post_data,
                    embeddings=embeddings,
                    pid_to_idx=pid_to_idx,
                    rng=rng_agent,
                )
                fold_reach[cond].append(reach)
                short = cond[:5]  # "chron", "rando", "perso"
                agent_prec_row[f"{short}_precision"] = round(prec, 6)

            prec_rows.append(agent_prec_row)

            # Cross-instance discovery (PPR)
            ppr_scores = compute_ppr(target_id, user_id_list, user_follows)
            pers_rec, base_rec = cross_instance_recovery(
                target_id=target_id,
                out_seed_ids=out_seeds,
                ppr_scores=ppr_scores,
                users=users,
                user_posts=user_posts,
                user_follows=user_follows,
                profiles=profiles,
                post_data=post_data,
                embeddings=embeddings,
                pid_to_idx=pid_to_idx,
                rng=rng_agent,
            )
            fold_pers_recov.append(pers_rec)
            fold_base_recov.append(base_rec)

            if (t_idx + 1) % 10 == 0:
                print(
                    f"  [{fold_k+1}/{N_FOLDS}] {t_idx+1}/{len(target_agents)} agents … "
                    f"reach_pers={np.mean(fold_reach['personalized']):.3f}  "
                    f"recov_pers={np.mean(fold_pers_recov):.3f}"
                )

        # Fold-level aggregates
        reach_rows.append({
            "fold": fold_k,
            "random_reachability":       round(float(np.mean(fold_reach["random"])), 6),
            "chron_reachability":        round(float(np.mean(fold_reach["chronological"])), 6),
            "pers_reachability":         round(float(np.mean(fold_reach["personalized"])), 6),
        })
        recov_rows.append({
            "fold": fold_k,
            "baseline_recovery":   round(float(np.mean(fold_base_recov)), 6),
            "pers_recovery":       round(float(np.mean(fold_pers_recov)), 6),
        })

        print(
            f"  Fold {fold_k+1} done — "
            f"reach: rand={reach_rows[-1]['random_reachability']:.3f}  "
            f"chron={reach_rows[-1]['chron_reachability']:.3f}  "
            f"pers={reach_rows[-1]['pers_reachability']:.3f}  |  "
            f"recov: base={recov_rows[-1]['baseline_recovery']:.3f}  "
            f"pers={recov_rows[-1]['pers_recovery']:.3f}"
        )

    # ── Write CSVs ───────────────────────────────────────────────────────────
    with open(prec_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["fold", "agent_id",
                                          "chron_precision", "rando_precision", "perso_precision"])
        w.writeheader()
        w.writerows(prec_rows)

    with open(reach_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["fold", "random_reachability",
                                          "chron_reachability", "pers_reachability"])
        w.writeheader()
        w.writerows(reach_rows)

    with open(recov_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["fold", "baseline_recovery", "pers_recovery"])
        w.writeheader()
        w.writerows(recov_rows)

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n══════════════════════════════════════")
    print("  EVALUATION SUMMARY")
    print("══════════════════════════════════════")
    rand_r   = [r["random_reachability"] for r in reach_rows]
    chron_r  = [r["chron_reachability"]  for r in reach_rows]
    pers_r   = [r["pers_reachability"]   for r in reach_rows]
    base_rec = [r["baseline_recovery"]   for r in recov_rows]
    pers_rec = [r["pers_recovery"]       for r in recov_rows]

    chron_prec = [r["chron_precision"] for r in prec_rows]
    rando_prec = [r["rando_precision"] for r in prec_rows]
    perso_prec = [r["perso_precision"] for r in prec_rows]

    print(f"  Content Reachability  — "
          f"Random: {np.mean(rand_r):.3f}  "
          f"Chron: {np.mean(chron_r):.3f}  "
          f"Pers: {np.mean(pers_r):.3f}")
    print(f"  Consumed Precision    — "
          f"Random: {np.mean(rando_prec):.3f}  "
          f"Chron: {np.mean(chron_prec):.3f}  "
          f"Pers: {np.mean(perso_prec):.3f}")
    print(f"  Cross-inst Recovery   — "
          f"Baseline: {np.mean(base_rec):.3f}  "
          f"Pers: {np.mean(pers_rec):.3f}")
    print(f"\n  Results written to {out_dir}/")
    print("══════════════════════════════════════")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run personalization evaluation")
    parser.add_argument("--pkl", default="network.pkl", help="Path to network.pkl")
    parser.add_argument("--out", default="results", help="Output directory for CSVs")
    args = parser.parse_args()

    run_evaluation(pkl_path=args.pkl, out_dir=args.out)
