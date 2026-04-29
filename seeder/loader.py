"""
loader.py
─────────
Loads the labeled CSV, samples NUM_USERS authors evenly across topics,
and builds a content bank per user ready for the simulator.
"""

import random
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

import config


@dataclass
class AuthorData:
    """All data for one sampled author from the CSV."""
    author_id: str                        # original did:plc:xxx
    dominant_topic: str                   # topic they post about most
    personality: np.ndarray               # shape (K,) topic distribution
    posts: List[Dict] = field(default_factory=list)  # list of post dicts


class DataLoader:
    """
    Loads labeled_posts.csv and samples NUM_USERS authors.

    Selection strategy:
    - Filter authors with fewer than MIN_POSTS_PER_AUTHOR posts
    - Sample evenly across all topics so every topic is represented
    - Each author's personality is derived from their real post topic distribution
    """

    def __init__(self, csv_path: str = config.CSV_PATH):
        self.csv_path = csv_path
        self.df = None
        self.topics = None
        self.topic_index = None
        self.authors: List[AuthorData] = []

    def load(self) -> List[AuthorData]:
        print(f"Loading dataset from {self.csv_path}...")
        self.df = pd.read_csv(self.csv_path)

        # Drop rows with missing required fields
        self.df = self.df.dropna(subset=["text", "author", "topic"])
        self.df = self.df[self.df["text"].str.strip() != ""]

        # Get all topics sorted
        self.topics = sorted(self.df["topic"].unique().tolist())
        self.topic_index = {t: i for i, t in enumerate(self.topics)}
        K = len(self.topics)

        print(f"  Total posts:   {len(self.df):,}")
        print(f"  Total authors: {self.df['author'].nunique():,}")
        print(f"  Topics ({K}):  {self.topics}")

        # Step 1: Filter authors with enough posts
        author_counts = self.df.groupby("author").size()
        good_authors  = author_counts[author_counts >= config.MIN_POSTS_PER_AUTHOR].index
        df_filtered   = self.df[self.df["author"].isin(good_authors)]

        print(f"\n  Authors with >= {config.MIN_POSTS_PER_AUTHOR} posts: {len(good_authors):,}")

        # Step 2: Find each author's dominant topic
        author_dominant = (
            df_filtered.groupby("author")["topic"]
            .agg(lambda x: x.value_counts().index[0])
        )

        # Step 3: Sample evenly across topics
        n_per_topic = config.NUM_USERS // K
        remainder   = config.NUM_USERS % K

        print(f"\n  Sampling {config.NUM_USERS} users (~{n_per_topic} per topic)...")

        random.seed(config.SEED)
        selected_authors = []

        for i, topic in enumerate(self.topics):
            # candidates whose dominant topic is this
            candidates = author_dominant[author_dominant == topic].index.tolist()

            # give one extra user to first `remainder` topics
            n = n_per_topic + (1 if i < remainder else 0)
            n = min(n, len(candidates))

            sampled = random.sample(candidates, n)
            selected_authors.extend(sampled)

        print(f"  Selected {len(selected_authors)} authors")

        # Step 4: Build AuthorData for each selected author
        df_selected = self.df[self.df["author"].isin(selected_authors)]

        for author_id in selected_authors:
            author_posts = df_selected[df_selected["author"] == author_id]

            # Build personality vector from real topic distribution
            topic_counts = author_posts["topic"].value_counts()
            personality  = np.zeros(K)
            for topic, count in topic_counts.items():
                if topic in self.topic_index:
                    personality[self.topic_index[topic]] = count
            # Normalize to sum to 1
            total = personality.sum()
            if total > 0:
                personality /= total

            dominant_topic = self.topics[int(np.argmax(personality))]

            posts = author_posts[[
                "text", "topic", "topic_confidence",
                "created_at", "uri", "reply_to"
            ]].to_dict("records")

            self.authors.append(AuthorData(
                author_id=author_id,
                dominant_topic=dominant_topic,
                personality=personality,
                posts=posts,
            ))

        self._print_summary()
        return self.authors

    def _print_summary(self):
        from collections import Counter
        topic_dist = Counter(a.dominant_topic for a in self.authors)
        total_posts = sum(len(a.posts) for a in self.authors)

        print("\n  ── Author selection summary ──")
        print(f"  Total authors selected: {len(self.authors)}")
        print(f"  Total posts loaded:     {total_posts:,}")
        print(f"  Avg posts per author:   {total_posts / max(len(self.authors), 1):.1f}")
        print("\n  Dominant topic distribution:")
        for topic, count in sorted(topic_dist.items()):
            print(f"    {topic:<35} {count} users")
