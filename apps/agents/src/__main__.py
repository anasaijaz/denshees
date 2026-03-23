"""CLI entry-point: run the agent from the terminal."""

import asyncio
import sys

from langchain_core.messages import HumanMessage

from src.agent import graph
from src.state import AgentState


async def main() -> None:
    query = " ".join(sys.argv[1:]) or "Hello, what can you help me with?"
    result = await graph.ainvoke(AgentState(messages=[HumanMessage(content=query)]))
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
