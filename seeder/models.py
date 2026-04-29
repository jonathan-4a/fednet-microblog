from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np


@dataclass
class VirtualInstance:
    index: int   # 0, 1, 2 … M-1
    name:  str   # "instance_1", "instance_2"


@dataclass
class VirtualUser:
    node_id:        str              # "u_0001"
    username:       str              # "user_0001"
    instance:       VirtualInstance
    author_id:      str              # original did:plc:xxx from Bluesky dataset
    dominant_topic: str              # most frequent topic in this author's posts
    personality:    np.ndarray       # shape (K,) topic distribution — derived from real posts
    following:      List[str] = field(default_factory=list)  # node_ids this user follows
    followers:      List[str] = field(default_factory=list)  # node_ids that follow this user


@dataclass
class VirtualPost:
    node_id:    str           # "p_000001"
    author_id:  str           # user node_id
    content:    str           # real Bluesky post text
    topic:      str           # topic label
    confidence: float         # classifier confidence
    created_at: str           # ISO 8601 timestamp
    uri:        str           # original at:// URI from Bluesky
    reply_to:   Optional[str] # at:// URI of parent post, or None
