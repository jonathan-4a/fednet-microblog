from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

import config
import networkx as nx
import numpy as np
from loader import AuthorData, DataLoader
from models import VirtualInstance, VirtualPost, VirtualUser


def _prefixed_username(counter: int) -> str:
    p = getattr(config, "USERNAME_PREFIX", "") or ""
    return f"{p}_user_{counter:04d}" if p else f"user_{counter:04d}"


def _prefixed_post_id(counter: int) -> str:
    p = getattr(config, "USERNAME_PREFIX", "") or ""
    return f"p_{p}_{counter:06d}" if p else f"p_{counter:06d}"


def _sample_post_created_at() -> str:
    """Return an ISO 8601 timestamp for a random time within the last DAYS_BACK_FOR_POSTS."""
    days_back = config.DAYS_BACK_FOR_POSTS
    sec_ago = np.random.uniform(0, max(1, days_back) * 24 * 3600)
    t = datetime.now(timezone.utc) - timedelta(seconds=sec_ago)
    return t.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _sample_n_follows(avg: float, exponent: float) -> int:
    """
    Sample number of accounts a user follows from a discrete power law (Zipf).
    P(k) ∝ k^{-exponent} for k = 1, 2, 3, …
    """
    k_max = max(1, int(avg * 20))
    ks = np.arange(1, k_max + 1, dtype=float)
    weights = ks ** (-exponent)
    weights /= weights.sum()
    return int(np.random.choice(ks, p=weights))


def _interest_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two personality vectors, clipped to [0, 1]."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-10 or norm_b < 1e-10:
        return 0.0
    return float(np.clip(np.dot(a, b) / (norm_a * norm_b), 0.0, 1.0))


class InstanceDistributor:
    def distribute(self, n_users: int, n_instances: int) -> List[int]:
        proportions = np.random.dirichlet([config.INSTANCE_ALPHA] * n_instances)
        counts = np.random.multinomial(n_users, proportions)
        return counts.tolist()


class UserFactory:
    def __init__(self):
        self._counter = 0

    def create_from_authors(
        self,
        authors: List[AuthorData],
        instances: List[VirtualInstance],
        counts: List[int],
    ) -> List[VirtualUser]:
        """Maps each AuthorData to a VirtualUser and assigns it to an instance."""
        users = []
        author_iter = iter(authors)

        for instance, count in zip(instances, counts):
            for _ in range(count):
                self._counter += 1
                author = next(author_iter)
                username = _prefixed_username(self._counter)
                users.append(
                    VirtualUser(
                        node_id=f"u_{self._counter:04d}",
                        username=username,
                        instance=instance,
                        author_id=author.author_id,
                        dominant_topic=author.dominant_topic,
                        personality=author.personality,
                    )
                )

        return users


class PostFactory:
    def __init__(self):
        self._counter = 0

    def create_for_user(
        self,
        user: VirtualUser,
        author_data: AuthorData,
    ) -> List[VirtualPost]:
        posts = []
        for raw in author_data.posts:
            self._counter += 1
            posts.append(
                VirtualPost(
                    node_id=_prefixed_post_id(self._counter),
                    author_id=user.node_id,
                    content=raw["text"],
                    topic=raw["topic"],
                    confidence=float(raw["topic_confidence"]),
                    created_at=_sample_post_created_at(),
                    uri=str(raw["uri"]),
                    reply_to=(
                        str(raw["reply_to"])
                        if raw.get("reply_to") and str(raw["reply_to"]) != "nan"
                        else None
                    ),
                )
            )
        return posts


class FollowGraphBuilder:
    """
    Builds a preferential-attachment follow graph biased toward agents with
    more followers AND similar interest profiles (§3.4.2).

    Edge weight = popularity × (1 + interest_similarity)
    where popularity is drawn from a Zipf distribution (heavy-tailed in-degree)
    and interest_similarity is the cosine similarity of personality vectors.
    """

    def build(self, all_users: List[VirtualUser]) -> List[Tuple[str, str]]:
        n = len(all_users)
        user_index = {u.node_id: i for i, u in enumerate(all_users)}
        user_map = {u.node_id: u for u in all_users}

        popularity = np.random.zipf(config.POPULARITY_ZIPF_EXPONENT, n).astype(float)
        popularity /= popularity.sum()

        follows = []

        for user in all_users:
            n_follows = _sample_n_follows(
                avg=config.AVG_FOLLOWS,
                exponent=config.FOLLOW_POWER_LAW_EXPONENT,
            )
            n_follows = min(n_follows, n - 1)

            n_local = int(round(n_follows * config.LOCAL_BIAS))
            n_cross = n_follows - n_local

            local_candidates = [
                u for u in all_users
                if u.instance.index == user.instance.index and u.node_id != user.node_id
            ]
            cross_candidates = [
                u for u in all_users if u.instance.index != user.instance.index
            ]

            def get_weights(candidates: List[VirtualUser]) -> np.ndarray:
                """Combine popularity and interest-profile similarity."""
                pop = np.array([popularity[user_index[u.node_id]] for u in candidates])
                sim = np.array([
                    _interest_similarity(user.personality, u.personality)
                    for u in candidates
                ])
                w = pop * (1.0 + sim)
                s = w.sum()
                return w / s if s > 0 else np.ones(len(candidates)) / len(candidates)

            chosen: set = set()

            if local_candidates and n_local > 0:
                k = min(n_local, len(local_candidates))
                idxs = np.random.choice(
                    len(local_candidates), size=k, replace=False,
                    p=get_weights(local_candidates),
                )
                for i in idxs:
                    chosen.add(local_candidates[i].node_id)

            if cross_candidates and n_cross > 0:
                k = min(n_cross, len(cross_candidates))
                idxs = np.random.choice(
                    len(cross_candidates), size=k, replace=False,
                    p=get_weights(cross_candidates),
                )
                for i in idxs:
                    chosen.add(cross_candidates[i].node_id)

            for target_id in chosen:
                follows.append((user.node_id, target_id))
                user.following.append(target_id)
                user_map[target_id].followers.append(user.node_id)

        return follows


class NetworkSimulator:
    def simulate(self) -> nx.DiGraph:
        np.random.seed(config.SEED)

        # 1. Load dataset and sample authors
        loader = DataLoader(config.CSV_PATH)
        authors = loader.load()

        # 2. Create instances
        instances = [
            VirtualInstance(index=i, name=f"instance_{i+1}")
            for i in range(config.NUM_INSTANCES)
        ]

        # 3. Distribute users across instances
        counts = InstanceDistributor().distribute(len(authors), config.NUM_INSTANCES)

        # 4. Create users mapped to authors
        all_users = UserFactory().create_from_authors(authors, instances, counts)

        # 5. Create posts for each user
        post_factory = PostFactory()
        author_map = {a.author_id: a for a in authors}
        all_posts: List[VirtualPost] = []
        for user in all_users:
            all_posts.extend(post_factory.create_for_user(user, author_map[user.author_id]))

        # 6. Build follow graph (preferential attachment + interest similarity)
        follows = FollowGraphBuilder().build(all_users)

        # 7. Build NetworkX DiGraph
        G = nx.DiGraph()

        for inst in instances:
            G.add_node(
                f"inst_{inst.index}",
                node_type="instance",
                label=inst.name,
                instance_index=inst.index,
            )

        for user in all_users:
            G.add_node(
                user.node_id,
                node_type="user",
                label=user.username,
                username=user.username,
                instance=user.instance.name,
                instance_idx=user.instance.index,
                author_id=user.author_id,
                dominant_topic=user.dominant_topic,
                personality=",".join(f"{v:.4f}" for v in user.personality),
                n_following=len(user.following),
                n_followers=len(user.followers),
                following=",".join(user.following),
                followers=",".join(user.followers),
            )

        uri_to_node = {post.uri: post.node_id for post in all_posts if post.uri}

        for post in all_posts:
            reply_to_node = uri_to_node.get(post.reply_to) if post.reply_to else None
            G.add_node(
                post.node_id,
                node_type="post",
                label=post.content[:50],
                content=post.content,
                topic=post.topic,
                confidence=post.confidence,
                created_at=post.created_at,
                uri=post.uri,
                reply_to_node=reply_to_node or "",
                author_id=post.author_id,
            )

        for user in all_users:
            G.add_edge(user.node_id, f"inst_{user.instance.index}", edge_type="MEMBER_OF")

        for follower_id, target_id in follows:
            G.add_edge(follower_id, target_id, edge_type="FOLLOWS")

        for post in all_posts:
            G.add_edge(post.author_id, post.node_id, edge_type="POSTED")
            reply_to_node = uri_to_node.get(post.reply_to) if post.reply_to else None
            if reply_to_node:
                G.add_edge(post.node_id, reply_to_node, edge_type="REPLY_TO")

        return G

    def summary(self, G: nx.DiGraph):
        users = [n for n, d in G.nodes(data=True) if d.get("node_type") == "user"]
        posts = [n for n, d in G.nodes(data=True) if d.get("node_type") == "post"]
        follows = [(u, v) for u, v, d in G.edges(data=True) if d.get("edge_type") == "FOLLOWS"]
        replies = [(u, v) for u, v, d in G.edges(data=True) if d.get("edge_type") == "REPLY_TO"]

        print("\n══════════════════════════════════════")
        print("  NETWORK BLUEPRINT SUMMARY")
        print("══════════════════════════════════════")
        print(f"  Users:   {len(users)}")
        print(f"  Posts:   {len(posts)}")
        print(f"  Follows: {len(follows)}")
        print(f"  Replies: {len(replies)}")

        print("\n  Users per instance:")
        instance_counts = Counter(G.nodes[u]["instance"] for u in users)
        for inst, count in sorted(instance_counts.items()):
            print(f"    {inst}: {count} users")

        print("\n  Topic distribution:")
        topic_counts = Counter(G.nodes[u]["dominant_topic"] for u in users)
        for topic, count in sorted(topic_counts.items()):
            print(f"    {topic:<35} {count} users")

        follow_counts = [G.nodes[u]["n_following"] for u in users]
        follower_counts = [G.nodes[u]["n_followers"] for u in users]
        print("\n  Follow stats:")
        print(f"    Avg follows per user:   {np.mean(follow_counts):.1f}")
        print(f"    Max follows:            {max(follow_counts)}")
        print(f"    Avg followers per user: {np.mean(follower_counts):.1f}")
        print(f"    Max followers:          {max(follower_counts)}")
        print("══════════════════════════════════════\n")
