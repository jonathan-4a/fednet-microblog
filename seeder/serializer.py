import pickle
import networkx as nx


def save(G: nx.DiGraph, path: str = "network") -> None:
    # Save full graph as pickle for migrator
    with open(f"{path}.pkl", "wb") as f:
        pickle.dump(G, f)
    print(f"Blueprint saved to {path}.pkl  ← used by migrator")

    # Save full graph as GEXF — all node types and edge types
    viz = nx.DiGraph()

    for node_id, data in G.nodes(data=True):
        node_type = data.get("node_type", "unknown")

        if node_type == "instance":
            viz.add_node(node_id,
                label=data.get("label", node_id),
                node_type="instance",
            )

        elif node_type == "user":
            viz.add_node(node_id,
                label=data.get("username", node_id),
                node_type="user",
                instance=data.get("instance", ""),
                dominant_topic=data.get("dominant_topic", ""),
                n_following=data.get("n_following", 0),
                n_followers=data.get("n_followers", 0),
            )

        elif node_type == "post":
            viz.add_node(node_id,
                label=data.get("content", "")[:60],
                node_type="post",
                topic=data.get("topic", ""),
                author_id=data.get("author_id", ""),
                has_reply=1 if data.get("reply_to_node") else 0,
            )

    for u, v, data in G.edges(data=True):
        edge_type = data.get("edge_type", "")
        if viz.has_node(u) and viz.has_node(v):
            viz.add_edge(u, v, edge_type=edge_type, label=edge_type)

    nx.write_gexf(viz, f"{path}.gexf")
    print(f"Blueprint saved to {path}.gexf  ← open in Gephi Lite (full network)")


def load(path: str = "network") -> nx.DiGraph:
    with open(f"{path}.pkl", "rb") as f:
        G = pickle.load(f)
    print(f"Blueprint loaded from {path}.pkl")
    return G
