#!/usr/bin/env python3
"""
Load network.pkl and push it to running API instances (Docker fednet: instance1 … instanceN).

Phases: register users → login → Follow activities → Create activities (posts), in dependency
order for reply threads. Matches register_users.py URL rules (instance_1 → http://instance1).
"""

from __future__ import annotations

import argparse
import pickle
import sys

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import networkx as nx
import requests

from config import DEFAULT_PASSWORD

ACTIVITY_CONTEXT = [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
]

TIMEOUT = 30
POST_THROTTLE_S = 0.05
MAX_INSTANCE_WORKERS = 4


def instance_url(name: str) -> str:
    return "http://" + name.replace("_", "", 1)


def actor_url(instance_name: str, username: str) -> str:
    return f"{instance_url(instance_name)}/u/{username}"


def note_url(instance_name: str, username: str, guid: str) -> str:
    return f"{instance_url(instance_name)}/u/{username}/statuses/{guid}"


def register(base_url: str, username: str, display_name: str) -> bool:
    r = requests.post(
        f"{base_url}/api/auth/register",
        json={
            "username": username,
            "password": DEFAULT_PASSWORD,
            "displayName": display_name,
        },
        timeout=TIMEOUT,
    )
    if r.status_code == 201:
        return True
    if r.status_code == 409:
        return True
    print(f"  ✗ register {username} @ {base_url}: {r.status_code}")
    return False


def login(base_url: str, username: str, password: str) -> str | None:
    r = requests.post(
        f"{base_url}/api/auth/login",
        json={"username": username, "password": password},
        timeout=TIMEOUT,
    )
    if r.status_code != 200:
        print(f"  ✗ login {username} @ {base_url}: {r.status_code}")
        return None
    token = r.json().get("token")
    if not token:
        print(f"  ✗ login {username}: no token in response")
        return None
    return token


def post_outbox(
    base_url: str, username: str, token: str, activity: dict[str, Any]
) -> tuple[bool, int]:
    r = requests.post(
        f"{base_url}/u/{username}/outbox",
        json=activity,
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    return (r.status_code in (200, 202), r.status_code)


def build_create_activity(
    instance_name: str,
    username: str,
    post_node_id: str,
    content: str,
    published: str,
    in_reply_to: str | None,
) -> dict[str, Any]:
    au = actor_url(instance_name, username)
    nu = note_url(instance_name, username, post_node_id)
    note: dict[str, Any] = {
        "@context": ACTIVITY_CONTEXT,
        "id": nu,
        "type": "Note",
        "published": published,
        "attributedTo": au,
        "content": content,
        "to": ["https://www.w3.org/ns/activitystreams#Public"],
        "cc": [f"{au}/followers"],
        "url": nu,
    }
    if in_reply_to:
        note["inReplyTo"] = in_reply_to
    return {
        "@context": ACTIVITY_CONTEXT,
        "type": "Create",
        "id": f"{nu}#create",
        "actor": au,
        "object": note,
    }


def build_follow_activity(follower_instance: str, follower_username: str, target_actor: str, fid: str) -> dict[str, Any]:
    au = actor_url(follower_instance, follower_username)
    return {
        "@context": ACTIVITY_CONTEXT,
        "type": "Follow",
        "id": f"{au}/follows/{fid}",
        "actor": au,
        "object": target_actor,
    }


def order_posts(G: nx.DiGraph) -> list[str]:
    post_ids = [n for n, d in G.nodes(data=True) if d.get("node_type") == "post"]
    post_set = set(post_ids)
    by_id = {p: G.nodes[p] for p in post_ids}
    done: set[str] = set()
    ordered: list[str] = []
    remaining = set(post_ids)

    def ready(pid: str) -> bool:
        parent = (by_id[pid].get("reply_to_node") or "").strip()
        if not parent:
            return True
        if parent not in post_set:
            return True
        return parent in done

    while remaining:
        layer = [p for p in remaining if ready(p)]
        if not layer:
            for p in list(remaining):
                ordered.append(p)
                done.add(p)
                remaining.remove(p)
            break
        for p in layer:
            ordered.append(p)
            done.add(p)
            remaining.remove(p)
    return ordered


def _inject_posts_for_instance(
    instance: str,
    posts: list[tuple[str, dict[str, Any]]],
    G: nx.DiGraph,
    user_by_node: dict[str, dict[str, Any]],
    tokens: dict[str, str],
) -> tuple[int, int]:
    ok, bad = 0, 0
    base = instance_url(instance)
    for post_id, pdata in posts:
        author = pdata.get("author_id")
        if not author or author not in user_by_node:
            bad += 1
            continue
        u = user_by_node[author]
        uname = u["username"]
        token = tokens.get(uname)
        if not token:
            bad += 1
            continue
        parent = (pdata.get("reply_to_node") or "").strip()
        in_reply = None
        if parent and G.has_node(parent):
            pd = G.nodes[parent]
            aid = pd.get("author_id")
            if aid and aid in user_by_node:
                pu = user_by_node[aid]
                pinst = pu["instance"]
                pun = pu["username"]
                in_reply = note_url(pinst, pun, parent)
        act = build_create_activity(
            instance,
            uname,
            post_id,
            pdata.get("content") or "",
            pdata.get("created_at") or "",
            in_reply,
        )
        good, code = post_outbox(base, uname, token, act)
        if good:
            ok += 1
        else:
            bad += 1
            print(f"  ✗ post {post_id} -> {code}")
        time.sleep(POST_THROTTLE_S)
    return ok, bad


def _inject_follows_chunk(
    items: list[tuple[str, str, str, str, str]],
    tokens: dict[str, str],
) -> tuple[int, int]:
    ok, bad = 0, 0
    for i, (follower_id, target_id, follower_inst, follower_un, target_actor) in enumerate(items):
        token = tokens.get(follower_un)
        base = instance_url(follower_inst)
        if not token:
            bad += 1
            continue
        act = build_follow_activity(follower_inst, follower_un, target_actor, f"{i}")
        good, code = post_outbox(base, follower_un, token, act)
        if good:
            ok += 1
        else:
            bad += 1
            if bad <= 20:
                print(f"  ✗ follow {follower_un} -> {target_actor}: {code}")
    return ok, bad


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed network.pkl onto fednet instances")
    parser.add_argument("--pkl", default="network.pkl")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Load pickle and print counts only; no HTTP requests",
    )
    parser.add_argument("--skip-register", action="store_true")
    parser.add_argument("--skip-follows", action="store_true")
    parser.add_argument("--skip-posts", action="store_true")
    parser.add_argument("--register-concurrency", type=int, default=100)
    parser.add_argument("--follow-concurrency", type=int, default=32)
    args = parser.parse_args()

    try:
        with open(args.pkl, "rb") as f:
            G: nx.DiGraph = pickle.load(f)
    except OSError as e:
        print(f"Cannot read {args.pkl}: {e}", file=sys.stderr)
        sys.exit(1)

    users = [(nid, d) for nid, d in G.nodes(data=True) if d.get("node_type") == "user"]
    user_by_node = {nid: d for nid, d in users}
    n_posts = sum(1 for _, d in G.nodes(data=True) if d.get("node_type") == "post")
    n_follows = sum(
        1 for _, _, d in G.edges(data=True) if d.get("edge_type") == "FOLLOWS"
    )

    if args.dry_run:
        print("Dry run — no requests sent.")
        print(f"  Users: {len(users)}, posts: {n_posts}, follow edges: {n_follows}")
        by_inst: dict[str, int] = defaultdict(int)
        for _, d in users:
            by_inst[d["instance"]] += 1
        for inst in sorted(by_inst.keys()):
            print(f"    {inst}: {by_inst[inst]} users")
        return

    if not args.skip_register:
        by_instance: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for nid, d in users:
            by_instance[d["instance"]].append(d)
        print("=== Register ===")
        for inst, ulist in sorted(by_instance.items()):
            base = instance_url(inst)
            print(f"[{inst}] registering {len(ulist)} users ...")

            def reg_one(ud: dict[str, Any]) -> bool:
                return register(base, ud["username"], ud["username"])

            with ThreadPoolExecutor(max_workers=args.register_concurrency) as pool:
                results = list(pool.map(reg_one, ulist))
            print(
                f"[{inst}] ✓ {sum(results)} ok, ✗ {sum(1 for r in results if not r)} failed"
            )

    print("=== Login ===")
    tokens: dict[str, str] = {}
    for nid, d in users:
        base = instance_url(d["instance"])
        t = login(base, d["username"], DEFAULT_PASSWORD)
        if t:
            tokens[d["username"]] = t
    print(f"Logged in {len(tokens)} / {len(users)} users")
    if len(tokens) < len(users):
        print("Warning: some logins failed; follows/posts for those users will fail.")

    if not args.skip_follows:
        print("=== Follows ===")
        follow_edges = [
            (u, v, G.edges[u, v])
            for u, v, d in G.edges(data=True)
            if d.get("edge_type") == "FOLLOWS"
        ]
        chunks: list[list[tuple[str, str, str, str, str]]] = [[] for _ in range(max(1, args.follow_concurrency))]
        for i, (follower_id, target_id, _) in enumerate(follow_edges):
            fu = user_by_node.get(follower_id)
            tu = user_by_node.get(target_id)
            if not fu or not tu:
                continue
            target_actor = actor_url(tu["instance"], tu["username"])
            chunks[i % len(chunks)].append(
                (follower_id, target_id, fu["instance"], fu["username"], target_actor)
            )
        total_ok = total_bad = 0
        with ThreadPoolExecutor(max_workers=args.follow_concurrency) as pool:
            futs = [
                pool.submit(_inject_follows_chunk, ch, tokens)
                for ch in chunks
                if ch
            ]
            for fut in as_completed(futs):
                o, b = fut.result()
                total_ok += o
                total_bad += b
        print(f"Follows: ✓ {total_ok} ok, ✗ {total_bad} failed (edge count {len(follow_edges)})")

    if not args.skip_posts:
        print("=== Posts ===")
        post_ids = order_posts(G)
        by_inst: dict[str, list[tuple[str, dict[str, Any]]]] = defaultdict(list)
        for pid in post_ids:
            d = G.nodes[pid]
            inst = user_by_node[d["author_id"]]["instance"]
            by_inst[inst].append((pid, d))

        workers = min(MAX_INSTANCE_WORKERS, max(1, len(by_inst)))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futs = {
                pool.submit(
                    _inject_posts_for_instance,
                    inst,
                    plist,
                    G,
                    user_by_node,
                    tokens,
                ): inst
                for inst, plist in sorted(by_inst.items())
            }
            total_ok = total_bad = 0
            for fut in as_completed(futs):
                inst = futs[fut]
                o, b = fut.result()
                total_ok += o
                total_bad += b
                print(f"[{inst}] posts ✓ {o} ok, ✗ {b} failed")
        print(f"Posts total: ✓ {total_ok} ok, ✗ {total_bad} failed")

    print("Done.")


if __name__ == "__main__":
    main()
