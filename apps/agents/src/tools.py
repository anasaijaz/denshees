"""Tools for the Denshees agent — calls the Next.js backend APIs.

Every tool receives `auth_token` from the LangGraph RunnableConfig,
which is the user's JWT token forwarded from the frontend.
"""

import json
import os

import httpx
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langsmith import traceable

BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:3000")


def _headers(config: RunnableConfig) -> dict:
    return {"Authorization": config["configurable"]["auth_token"]}


async def _get(path: str, config: RunnableConfig, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:
        r = await client.get(path, headers=_headers(config), params=params)
        r.raise_for_status()
        return r.json()


async def _post(path: str, config: RunnableConfig, body: dict) -> dict:
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:
        r = await client.post(path, headers=_headers(config), json=body)
        r.raise_for_status()
        return r.json()


async def _patch(path: str, config: RunnableConfig, body: dict, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:
        r = await client.patch(path, headers=_headers(config), json=body, params=params)
        r.raise_for_status()
        return r.json()


async def _delete(path: str, config: RunnableConfig) -> dict:
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:
        r = await client.delete(path, headers=_headers(config))
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# Lead-list items
# ---------------------------------------------------------------------------


@tool
@traceable(name="add_lead_to_list")
async def add_lead_to_list(
    list_id: str,
    name: str,
    email: str,
    company: str = "",
    website: str = "",
    config: RunnableConfig = None,
) -> str:
    """Add a single lead to a lead list. Requires list_id, name, and email."""
    data = await _post(
        f"/api/lead-lists/{list_id}/items",
        config,
        {"name": name, "email": email, "company": company, "website": website},
    )
    return json.dumps(data, default=str)


@tool
@traceable(name="remove_lead_from_list")
async def remove_lead_from_list(
    list_id: str,
    item_id: str,
    config: RunnableConfig = None,
) -> str:
    """Remove a lead from a lead list by its list ID and item ID."""
    data = await _delete(f"/api/lead-lists/{list_id}/items/{item_id}", config)
    return json.dumps(data, default=str)


@tool
@traceable(name="update_lead_in_list")
async def update_lead_in_list(
    list_id: str,
    item_id: str,
    name: str | None = None,
    email: str | None = None,
    company: str | None = None,
    website: str | None = None,
    config: RunnableConfig = None,
) -> str:
    """Update fields on a lead list item. Pass only the fields to change."""
    body = {}
    if name is not None:
        body["name"] = name
    if email is not None:
        body["email"] = email
    if company is not None:
        body["company"] = company
    if website is not None:
        body["website"] = website

    if not body:
        return "Nothing to update — provide at least one field."

    data = await _patch(f"/api/lead-lists/{list_id}/items/{item_id}", config, body)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Campaign stats
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_campaign_stats")
async def get_campaign_stats(
    campaign_id: str,
    config: RunnableConfig = None,
) -> str:
    """Get stats (sent, opens, replies, total recipients) for a campaign."""
    data = await _get(f"/api/analysis/campaign/{campaign_id}", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Create campaign
# ---------------------------------------------------------------------------


@tool
@traceable(name="create_campaign")
async def create_campaign(
    title: str,
    description: str,
    max_stage_count: int = 3,
    days_interval: int = 2,
    email_delivery_period: str = "9:00-17:00",
    config: RunnableConfig = None,
) -> str:
    """Create a new email outreach campaign with default pitch templates."""
    data = await _post(
        "/api/campaign/create",
        config,
        {
            "title": title,
            "max_stage_count": max_stage_count,
            "days_interval": days_interval,
            "desc": description,
            "email_delivery_period": email_delivery_period,
        },
    )
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Pitches
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_campaign_pitches")
async def get_campaign_pitches(
    campaign_id: str,
    config: RunnableConfig = None,
) -> str:
    """List all pitch templates (stages) for a campaign. Use before updating."""
    data = await _get("/api/pitches", config, params={"campaign": campaign_id})
    return json.dumps(data, default=str)


@tool
@traceable(name="update_pitch")
async def update_pitch(
    pitch_id: str,
    subject: str | None = None,
    message: str | None = None,
    config: RunnableConfig = None,
) -> str:
    """Update the subject and/or message of a pitch template."""
    body = {}
    if subject is not None:
        body["subject"] = subject
    if message is not None:
        body["message"] = message

    if not body:
        return "Nothing to update — provide subject and/or message."

    data = await _patch("/api/pitches/update", config, body, params={"pitch": pitch_id})
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Convenience: list user's campaigns & lead lists
# ---------------------------------------------------------------------------


@tool
@traceable(name="list_campaigns")
async def list_campaigns(config: RunnableConfig = None) -> str:
    """List all campaigns for the current user."""
    data = await _get("/api/campaign", config)
    return json.dumps(data, default=str)


@tool
@traceable(name="list_lead_lists")
async def list_lead_lists(config: RunnableConfig = None) -> str:
    """List all lead lists for the current user."""
    data = await _get("/api/lead-lists", config)
    return json.dumps(data, default=str)


@tool
@traceable(name="get_lead_list_items")
async def get_lead_list_items(
    list_id: str,
    config: RunnableConfig = None,
) -> str:
    """Get all items in a lead list."""
    data = await _get(f"/api/lead-lists/{list_id}/items", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Lead-list CRUD
# ---------------------------------------------------------------------------


@tool
@traceable(name="create_lead_list")
async def create_lead_list(
    name: str,
    description: str = "",
    config: RunnableConfig = None,
) -> str:
    """Create a new lead list."""
    data = await _post("/api/lead-lists", config, {"name": name, "description": description})
    return json.dumps(data, default=str)


@tool
@traceable(name="update_lead_list")
async def update_lead_list(
    list_id: str,
    name: str | None = None,
    description: str | None = None,
    config: RunnableConfig = None,
) -> str:
    """Update a lead list's name and/or description."""
    body = {}
    if name is not None:
        body["name"] = name
    if description is not None:
        body["description"] = description
    if not body:
        return "Nothing to update — provide name and/or description."
    data = await _patch(f"/api/lead-lists/{list_id}", config, body)
    return json.dumps(data, default=str)


@tool
@traceable(name="delete_lead_list")
async def delete_lead_list(
    list_id: str,
    config: RunnableConfig = None,
) -> str:
    """Delete a lead list. This is destructive — confirm with user first."""
    data = await _delete(f"/api/lead-lists/{list_id}", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Campaign detail & update
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_campaign_detail")
async def get_campaign_detail(
    campaign_id: str,
    config: RunnableConfig = None,
) -> str:
    """Get full details for a campaign including email credentials."""
    data = await _get(f"/api/campaign/{campaign_id}", config)
    return json.dumps(data, default=str)


@tool
@traceable(name="update_campaign")
async def update_campaign(
    campaign_id: str,
    title: str | None = None,
    description: str | None = None,
    status: str | None = None,
    max_stage_count: int | None = None,
    days_interval: int | None = None,
    email_delivery_period: str | None = None,
    is_tracking_enabled: bool | None = None,
    config: RunnableConfig = None,
) -> str:
    """Update a campaign's settings. Pass only the fields to change."""
    body = {}
    if title is not None:
        body["title"] = title
    if description is not None:
        body["desc"] = description
    if status is not None:
        body["status"] = status
    if max_stage_count is not None:
        body["max_stage_count"] = max_stage_count
    if days_interval is not None:
        body["days_interval"] = days_interval
    if email_delivery_period is not None:
        body["email_delivery_period"] = email_delivery_period
    if is_tracking_enabled is not None:
        body["isTrackingEnabled"] = is_tracking_enabled
    if not body:
        return "Nothing to update — provide at least one field."
    data = await _patch(f"/api/campaign/{campaign_id}", config, body)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Contacts / leads in a campaign
# ---------------------------------------------------------------------------


@tool
@traceable(name="import_contacts_to_campaign")
async def import_contacts_to_campaign(
    campaign_id: str,
    contacts: list[dict],
    config: RunnableConfig = None,
) -> str:
    """Import contacts into a campaign. Each contact needs name and email, personalization is optional.

    contacts example: [{"name": "Jane", "email": "jane@co.com", "personalization": "Met at conf"}]
    """
    data = await _post(
        "/api/contacts/import",
        config,
        {"contacts": contacts, "campaign": campaign_id},
    )
    return json.dumps(data, default=str)


@tool
@traceable(name="get_campaign_contacts")
async def get_campaign_contacts(
    campaign_id: str,
    page: int = 1,
    search: str = "",
    config: RunnableConfig = None,
) -> str:
    """Get paginated contacts for a campaign. Returns 15 per page."""
    params = {"campaign": campaign_id, "page": str(page)}
    if search:
        params["search"] = search
    data = await _get("/api/contacts/paginatedapi", config, params=params)
    return json.dumps(data, default=str)


@tool
@traceable(name="update_contact")
async def update_contact(
    lead_id: str,
    email: str | None = None,
    name: str | None = None,
    personalization: str | None = None,
    config: RunnableConfig = None,
) -> str:
    """Update a campaign contact/lead's info."""
    body = {}
    if email is not None:
        body["email"] = email
    if name is not None:
        body["name"] = name
    if personalization is not None:
        body["personalization"] = personalization
    if not body:
        return "Nothing to update — provide at least one field."
    data = await _patch("/api/lead/update", config, body, params={"lead": lead_id})
    return json.dumps(data, default=str)


@tool
@traceable(name="delete_contact")
async def delete_contact(
    lead_id: str,
    config: RunnableConfig = None,
) -> str:
    """Delete a contact/lead from a campaign. Confirm with user first."""
    data = await _delete(f"/api/lead/delete/{lead_id}", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Campaign daily stats & activities
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_campaign_daily_stats")
async def get_campaign_daily_stats(
    campaign_id: str,
    config: RunnableConfig = None,
) -> str:
    """Get daily aggregated stats (sent, opens, replies) for a campaign heatmap."""
    data = await _get(f"/api/analysis/campaign/{campaign_id}/daily-stats", config)
    return json.dumps(data, default=str)


@tool
@traceable(name="get_campaign_activities")
async def get_campaign_activities(
    campaign_id: str,
    date: str = "",
    config: RunnableConfig = None,
) -> str:
    """Get campaign activities for a specific day (YYYY-MM-DD). Defaults to today."""
    params = {}
    if date:
        params["date"] = date
    data = await _get(f"/api/analysis/campaign/{campaign_id}/activities", config, params=params)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_dashboard_stats")
async def get_dashboard_stats(config: RunnableConfig = None) -> str:
    """Get overall dashboard stats: total contacts, campaigns, emails sent, responses, opens, replies."""
    data = await _get("/api/dashboard/stats", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Lead timeline
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_lead_timeline")
async def get_lead_timeline(
    lead_id: str,
    config: RunnableConfig = None,
) -> str:
    """Get the full timeline for a campaign contact — messages sent, opened, and replies."""
    data = await _get(f"/api/timeline/{lead_id}", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------


@tool
@traceable(name="get_inbox")
async def get_inbox(
    campaign_id: str,
    config: RunnableConfig = None,
) -> str:
    """Get inbox (unreplied messages) for a campaign."""
    data = await _get(f"/api/inbox/{campaign_id}", config)
    return json.dumps(data, default=str)


# ---------------------------------------------------------------------------
# Email credentials
# ---------------------------------------------------------------------------


@tool
@traceable(name="list_email_credentials")
async def list_email_credentials(config: RunnableConfig = None) -> str:
    """List all connected email accounts/credentials for the current user."""
    data = await _get("/api/google_apps", config)
    return json.dumps(data, default=str)
