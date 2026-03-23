"""Shared state definitions for LangGraph agents."""

from typing import Annotated

from langgraph.graph.message import add_messages
from pydantic import BaseModel


class AgentState(BaseModel):
    """Base state that flows through every node in the graph."""

    messages: Annotated[list, add_messages] = []
