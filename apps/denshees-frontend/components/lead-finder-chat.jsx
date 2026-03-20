"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CancelIcon,
  SearchIcon,
  BuildingBIcon,
  UsersIcon,
  EmailIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
} from "mage-icons-react/bulk";
import {
  ReloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "mage-icons-react/stroke";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// ── Pipeline step display config ───────────────────────────
const SEARCH_STEPS = [
  {
    id: "search-company",
    label: "Searching company",
    icon: BuildingBIcon,
    description: "Matching domain to business",
  },
  {
    id: "find-employees",
    label: "Finding employees",
    icon: UsersIcon,
    description: "Fetching prospects from company",
  },
];

// ── Shared status icon ─────────────────────────────────────
function StepStatus({ status }) {
  if (!status) {
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  }
  switch (status) {
    case "EXECUTING":
    case "REATTEMPTING":
    case "WAITING_TO_EXECUTE":
      return <ReloadIcon className="w-4 h-4 text-blue-500 animate-spin" />;
    case "COMPLETED":
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    case "FAILED":
    case "CRASHED":
    case "SYSTEM_FAILURE":
    case "INTERRUPTED":
      return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
    case "QUEUED":
      return (
        <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-dashed animate-pulse" />
      );
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  }
}

// ── Pipeline progress (reusable for both phases) ───────────
function PipelineProgress({ steps, runs, tag }) {
  return (
    <div className="space-y-3 py-2">
      {steps.map((step, index) => {
        const run = runs?.find(
          (r) => r.taskIdentifier === step.id && r.tags?.includes(tag),
        );
        const Icon = step.icon;
        const isActive =
          run?.status === "EXECUTING" || run?.status === "REATTEMPTING";
        const isCompleted = run?.status === "COMPLETED";
        const isFailed =
          run?.status === "FAILED" ||
          run?.status === "CRASHED" ||
          run?.status === "SYSTEM_FAILURE";

        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <StepStatus status={run?.status} />
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-6 mt-1 ${
                    isCompleted ? "bg-green-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 -mt-0.5">
              <div
                className={`text-sm font-medium ${
                  isActive
                    ? "text-blue-600"
                    : isCompleted
                      ? "text-green-600"
                      : isFailed
                        ? "text-red-600"
                        : "text-gray-500"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {step.label}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              {isFailed && (
                <p className="text-xs text-red-500 mt-0.5">Step failed</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Employee picker with select all / none ─────────────────
function EmployeePicker({
  employees,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
}) {
  const [expanded, setExpanded] = useState(true);
  const allSelected = selected.length === employees.length;
  const noneSelected = selected.length === 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-700">
          {employees.length} employees found — {selected.length} selected
        </span>
        {expanded ? (
          <ChevronUpIcon className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      {expanded && (
        <>
          {/* Select all / none */}
          <div className="flex gap-2 px-3 py-1.5 border-b border-gray-100">
            <button
              onClick={onSelectAll}
              className={`text-xs font-medium ${
                allSelected ? "text-gray-400" : "text-blue-600 hover:underline"
              }`}
              disabled={allSelected}
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={onSelectNone}
              className={`text-xs font-medium ${
                noneSelected ? "text-gray-400" : "text-blue-600 hover:underline"
              }`}
              disabled={noneSelected}
            >
              Select none
            </button>
          </div>

          <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-50">
            {employees.map((emp) => {
              const isChecked = selected.includes(emp.prospectId);
              const name =
                emp.fullName ||
                [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
                "Unknown";

              return (
                <label
                  key={emp.prospectId}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggle(emp.prospectId)}
                    className="h-3.5 w-3.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {name}
                    </p>
                    {emp.jobTitle && (
                      <p className="text-[11px] text-gray-400 truncate">
                        {emp.jobTitle}
                      </p>
                    )}
                  </div>
                  {emp.department && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                      {emp.department}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Final enriched results ─────────────────────────────────
function EnrichedResults({ employees, contacts }) {
  const contactMap = new Map((contacts ?? []).map((c) => [c.prospectId, c]));

  const merged = employees.map((emp) => ({
    ...emp,
    ...(contactMap.get(emp.prospectId) || {}),
  }));

  const withEmail = merged.filter(
    (m) =>
      (m.professionalEmails?.length ?? 0) > 0 ||
      (m.personalEmails?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-2">
      <div className="border border-green-200 bg-green-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircleIcon className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">
            Enrichment Complete
          </span>
        </div>
        <p className="text-xs text-gray-600">
          <strong>{withEmail.length}</strong> of {merged.length} have verified
          emails
        </p>
      </div>

      <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {merged.map((lead) => {
          const name =
            lead.fullName ||
            [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
            "Unknown";
          const emails = [
            ...(lead.professionalEmails ?? []),
            ...(lead.personalEmails ?? []),
          ];

          return (
            <div key={lead.prospectId} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-800 truncate">
                  {name}
                </span>
              </div>
              {lead.jobTitle && (
                <p className="text-[11px] text-gray-400 ml-5">
                  {lead.jobTitle}
                </p>
              )}
              {emails.length > 0 ? (
                <div className="ml-5 mt-0.5">
                  {emails.map((email, i) => (
                    <p key={i} className="text-[11px] text-blue-600 truncate">
                      {email}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 ml-5 mt-0.5">
                  No email found
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
// Phase 1: search domain → show employees
// Phase 2: user picks employees → enrich
// Phase 3: show results

const PHASE = {
  IDLE: "IDLE",
  SEARCHING: "SEARCHING",
  PICKING: "PICKING",
  ENRICHING: "ENRICHING",
  DONE: "DONE",
};

export default function LeadFinderChat({ listId } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [error, setError] = useState(null);

  // Phase 1 state
  const [searchRun, setSearchRun] = useState(null); // { tag, publicToken, runId }
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Phase 2 state (picking)
  const [selected, setSelected] = useState([]);

  // Phase 3 state
  const [enrichRun, setEnrichRun] = useState(null); // { tag, publicToken, runId }
  const [enrichedContacts, setEnrichedContacts] = useState([]);

  // Add-to-list state
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);

  const messagesEndRef = useRef(null);

  // ── Realtime: search phase ─────────────────────────────
  const { runs: searchRuns } = useRealtimeRunsWithTag(searchRun?.tag ?? [], {
    enabled: !!searchRun,
    accessToken: searchRun?.publicToken,
  });

  const mainSearchRun = searchRuns?.find(
    (r) =>
      r.taskIdentifier === "find-leads-from-domain" &&
      r.tags?.includes(searchRun?.tag),
  );

  // When search completes → move to PICKING
  useEffect(() => {
    if (!mainSearchRun) return;
    if (mainSearchRun.status === "COMPLETED" && mainSearchRun.output) {
      const out = mainSearchRun.output;
      setCompany(out.company);
      setEmployees(out.employees ?? []);
      setSelected((out.employees ?? []).map((e) => e.prospectId)); // default all selected
      setPhase(PHASE.PICKING);
    }
    if (
      mainSearchRun.status === "FAILED" ||
      mainSearchRun.status === "CRASHED"
    ) {
      setError("Failed to search for employees. Please try again.");
      setPhase(PHASE.IDLE);
    }
  }, [mainSearchRun]);

  // ── Realtime: enrich phase ─────────────────────────────
  const { runs: enrichRuns } = useRealtimeRunsWithTag(enrichRun?.tag ?? [], {
    enabled: !!enrichRun,
    accessToken: enrichRun?.publicToken,
  });

  const mainEnrichRun = enrichRuns?.find(
    (r) =>
      r.taskIdentifier === "enrich-emails" && r.tags?.includes(enrichRun?.tag),
  );

  // When enrich completes → move to DONE
  useEffect(() => {
    if (!mainEnrichRun) return;
    if (mainEnrichRun.status === "COMPLETED" && mainEnrichRun.output) {
      setEnrichedContacts(mainEnrichRun.output.contacts ?? []);
      setPhase(PHASE.DONE);
    }
    if (
      mainEnrichRun.status === "FAILED" ||
      mainEnrichRun.status === "CRASHED"
    ) {
      setError("Email enrichment failed. Please try again.");
      setPhase(PHASE.PICKING); // allow retry
    }
  }, [mainEnrichRun]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, searchRuns, enrichRuns, isOpen]);

  // ── Handlers ───────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setPhase(PHASE.SEARCHING);
    setError(null);
    setEmployees([]);
    setCompany(null);
    setSelected([]);
    setEnrichedContacts([]);
    setEnrichRun(null);

    try {
      const res = await fetch("/api/lead/find-from-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start search");
      }
      const { runId, tag, publicToken } = await res.json();
      setSearchRun({ runId, tag, publicToken });
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.IDLE);
    }
  };

  const handleToggle = useCallback((prospectId) => {
    setSelected((prev) =>
      prev.includes(prospectId)
        ? prev.filter((id) => id !== prospectId)
        : [...prev, prospectId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected(employees.map((e) => e.prospectId));
  }, [employees]);

  const handleSelectNone = useCallback(() => {
    setSelected([]);
  }, []);

  const handleEnrich = async () => {
    if (selected.length === 0) return;

    setPhase(PHASE.ENRICHING);
    setError(null);

    try {
      const res = await fetch("/api/lead/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start enrichment");
      }
      const { runId, tag, publicToken } = await res.json();
      setEnrichRun({ runId, tag, publicToken });
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.PICKING);
    }
  };

  const handleReset = () => {
    setPhase(PHASE.IDLE);
    setDomain("");
    setError(null);
    setSearchRun(null);
    setEnrichRun(null);
    setCompany(null);
    setEmployees([]);
    setSelected([]);
    setEnrichedContacts([]);
    setIsAddingToList(false);
    setAddedToList(false);
  };

  // ── Add enriched leads to list ─────────────────────────
  const handleAddToList = async () => {
    if (!listId || enrichedContacts.length === 0) return;

    setIsAddingToList(true);
    const contactMap = new Map(
      (enrichedContacts ?? []).map((c) => [c.prospectId, c]),
    );
    const selectedEmployees = employees.filter((e) =>
      selected.includes(e.prospectId),
    );

    let added = 0;
    let failed = 0;

    for (const emp of selectedEmployees) {
      const contact = contactMap.get(emp.prospectId) || {};
      const emails = [
        ...(contact.professionalEmails ?? []),
        ...(contact.personalEmails ?? []),
      ];
      const name =
        emp.fullName ||
        [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
        "Unknown";

      try {
        await fetch(`/api/lead-lists/${listId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email: emails[0] || "",
            company: company?.name || domain || "",
            website: emp.linkedinUrl || "",
            personalization: {
              ...(emp.jobTitle ? { job_title: emp.jobTitle } : {}),
              ...(emp.department ? { department: emp.department } : {}),
              ...(emails.length > 1 ? { all_emails: emails.join(", ") } : {}),
            },
          }),
        });
        added++;
      } catch {
        failed++;
      }
    }

    setIsAddingToList(false);
    setAddedToList(true);

    if (added > 0) {
      toast.success(`Added ${added} lead${added !== 1 ? "s" : ""} to list`);
      // Trigger SWR revalidation for the list items
      if (typeof window !== "undefined") {
        const { mutate } = await import("swr");
        mutate(`/api/lead-lists/${listId}/items`);
      }
    }
    if (failed > 0) {
      toast.error(`Failed to add ${failed} lead${failed !== 1 ? "s" : ""}`);
    }
  };

  const isRunning = phase === PHASE.SEARCHING || phase === PHASE.ENRICHING;

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black text-white px-4 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        >
          <SearchIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Find Leads</span>
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[560px] bg-white border border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black text-white shrink-0">
            <div className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">Lead Finder</span>
              {isRunning && (
                <ReloadIcon className="w-3.5 h-3.5 animate-spin text-blue-400" />
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-800 rounded p-1 transition-colors"
            >
              <CancelIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* IDLE: welcome */}
            {phase === PHASE.IDLE && !error && (
              <div className="text-center py-6">
                <BuildingBIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Enter a company domain to find leads with verified emails.
                </p>
              </div>
            )}

            {/* SEARCHING: realtime progress */}
            {phase === PHASE.SEARCHING && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">
                    Searching leads for{" "}
                    <span className="font-semibold text-gray-700">
                      {domain}
                    </span>
                  </p>
                </div>
                <PipelineProgress
                  steps={SEARCH_STEPS}
                  runs={searchRuns}
                  tag={searchRun?.tag}
                />
              </div>
            )}

            {/* PICKING: company info + employee list */}
            {phase === PHASE.PICKING && (
              <div className="space-y-3">
                {company && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-gray-800">
                      {company.name || domain}
                    </p>
                    {company.industry && (
                      <p className="text-xs text-gray-400">
                        {company.industry}
                      </p>
                    )}
                  </div>
                )}

                {employees.length > 0 ? (
                  <>
                    <p className="text-xs text-gray-500">
                      Select the employees you want to enrich with verified
                      emails:
                    </p>
                    <EmployeePicker
                      employees={employees}
                      selected={selected}
                      onToggle={handleToggle}
                      onSelectAll={handleSelectAll}
                      onSelectNone={handleSelectNone}
                    />
                    <Button
                      onClick={handleEnrich}
                      disabled={selected.length === 0}
                      className="w-full"
                      size="sm"
                    >
                      <EmailIcon className="w-4 h-4 mr-2" />
                      Enrich {selected.length} employee
                      {selected.length !== 1 ? "s" : ""}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <UsersIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">
                      No employees found for this domain.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ENRICHING: progress for enrich step */}
            {phase === PHASE.ENRICHING && (
              <div className="space-y-3">
                {company && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-gray-800">
                      {company.name || domain}
                    </p>
                  </div>
                )}
                <PipelineProgress
                  steps={[
                    {
                      id: "enrich-emails",
                      label: "Enriching emails",
                      icon: EmailIcon,
                      description: `Verifying emails for ${selected.length} employee${selected.length !== 1 ? "s" : ""}`,
                    },
                  ]}
                  runs={enrichRuns}
                  tag={enrichRun?.tag}
                />
              </div>
            )}

            {/* DONE: enriched results */}
            {phase === PHASE.DONE && (
              <div className="space-y-3">
                {company && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-gray-800">
                      {company.name || domain}
                    </p>
                    {company.industry && (
                      <p className="text-xs text-gray-400">
                        {company.industry}
                      </p>
                    )}
                  </div>
                )}
                <EnrichedResults
                  employees={employees.filter((e) =>
                    selected.includes(e.prospectId),
                  )}
                  contacts={enrichedContacts}
                />

                {/* Add to List button */}
                {listId && !addedToList && (
                  <Button
                    onClick={handleAddToList}
                    disabled={isAddingToList}
                    className="w-full"
                    size="sm"
                  >
                    {isAddingToList ? (
                      <>
                        <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                        Adding to list...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add {selected.length} lead
                        {selected.length !== 1 ? "s" : ""} to list
                      </>
                    )}
                  </Button>
                )}
                {listId && addedToList && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-green-700 font-medium">
                      <CheckCircleIcon className="w-3.5 h-3.5 inline mr-1" />
                      Leads added to list
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 shrink-0">
            {phase === PHASE.IDLE || phase === PHASE.SEARCHING ? (
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. stripe.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={phase === PHASE.SEARCHING}
                  className="text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!domain.trim() || phase === PHASE.SEARCHING}
                >
                  {phase === PHASE.SEARCHING ? (
                    <ReloadIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SearchIcon className="w-4 h-4" />
                  )}
                </Button>
              </form>
            ) : (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <SearchIcon className="w-4 h-4 mr-2" />
                New Search
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
