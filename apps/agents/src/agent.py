"""ReAct agent wired with OpenAI and tool-calling.

The graph follows a Reason → Act → Observe loop:
  agent (LLM) → should_continue? → tools → agent → ...
until the LLM produces a final response with no tool calls.
"""

import src.config  # noqa: F401  — loads .env

from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode
from langsmith import traceable

from src.state import AgentState
from src.tools import (
    add_lead_to_list,
    create_campaign,
    create_lead_list,
    delete_contact,
    delete_lead_list,
    get_campaign_activities,
    get_campaign_contacts,
    get_campaign_daily_stats,
    get_campaign_detail,
    get_campaign_pitches,
    get_campaign_stats,
    get_dashboard_stats,
    get_inbox,
    get_lead_list_items,
    get_lead_timeline,
    import_contacts_to_campaign,
    list_campaigns,
    list_email_credentials,
    list_lead_lists,
    remove_lead_from_list,
    update_campaign,
    update_contact,
    update_lead_in_list,
    update_lead_list,
    update_pitch,
)

SYSTEM_PROMPT = """\
You are Denshees AI — an assistant that helps users manage their email outreach campaigns.

You can:
• List, create, update, and delete lead lists and their items
• Add, update, or remove leads from a list
• Create, update, and inspect campaigns (title, stages, interval, delivery hours, tracking)
• Import contacts into a campaign, search/update/delete contacts
• Get campaign performance stats (sent, opens, replies) and daily analytics
• View campaign activities for any date
• View and update pitch templates for each campaign stage
• View a contact's full timeline (emails sent, opens, replies)
• Check the inbox for unreplied messages
• View connected email accounts
• Get overall dashboard stats

Rules:
• Always confirm destructive actions (delete, remove) before executing.
• When you need an ID you don't have, list the resources first.
• Keep responses concise and actionable.
• You may only access data belonging to the current user.
"""

tools = [
    # Lead lists
    list_lead_lists,
    create_lead_list,
    update_lead_list,
    delete_lead_list,
    get_lead_list_items,
    add_lead_to_list,
    remove_lead_from_list,
    update_lead_in_list,
    # Campaigns
    list_campaigns,
    create_campaign,
    get_campaign_detail,
    update_campaign,
    # Contacts in a campaign
    import_contacts_to_campaign,
    get_campaign_contacts,
    update_contact,
    delete_contact,
    # Pitches
    get_campaign_pitches,
    update_pitch,
    # Analytics
    get_campaign_stats,
    get_campaign_daily_stats,
    get_campaign_activities,
    get_dashboard_stats,
    # Timeline & inbox
    get_lead_timeline,
    get_inbox,
    # Email credentials
    list_email_credentials,
]


@traceable(run_type="llm", name="get_llm")
def _get_llm():
    return ChatOpenAI(model="gpt-4o-mini", temperature=0).bind_tools(tools)


# -- Nodes -------------------------------------------------------------------

@traceable(name="reason")
def reason(state: AgentState, config: RunnableConfig) -> dict:
    """Reason step: LLM sees the full history + system prompt and decides what to do."""
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state.messages
    response = _get_llm().invoke(messages, config=config)
    return {"messages": [response]}


@traceable(name="should_continue")
def should_continue(state: AgentState) -> str:
    """Route back to tools when the LLM wants to act, otherwise finish."""
    last = state.messages[-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "act"
    return END


# -- Graph -------------------------------------------------------------------

builder = StateGraph(AgentState)

builder.add_node("reason", reason)
builder.add_node("act", ToolNode(tools))

builder.set_entry_point("reason")
builder.add_conditional_edges("reason", should_continue, {"act": "act", END: END})
builder.add_edge("act", "reason")  # observe tool results → reason again

graph = builder.compile(checkpointer=MemorySaver())
