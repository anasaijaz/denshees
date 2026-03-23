# Denshees Agents

AI agents built with [LangGraph](https://langchain-ai.github.io/langgraph/) to help Denshees users work faster.

## Setup

```bash
cd apps/agents

# Create a virtual environment & install deps
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"

# Configure secrets
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

## Run

```bash
# Ask the agent something
python -m src "Find leads in the tech industry"

# Run tests
pytest
```

## Project structure

```
src/
  config.py    — env loading
  state.py     — LangGraph state schema
  tools.py     — tools the agent can call
  agent.py     — graph definition (nodes + edges)
  __main__.py  — CLI entry-point
tests/
  test_agent.py
```
