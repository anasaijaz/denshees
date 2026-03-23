"""Smoke test for the agent graph structure."""

from src.agent import graph


def test_graph_compiles():
    """The compiled graph should expose the expected node names."""
    node_names = set(graph.nodes.keys())
    assert "reason" in node_names
    assert "act" in node_names
