"use client";

import { useState } from "react";
import {
  EmailIcon,
  UserIcon,
  MessageSquareIcon,
  PhoneIcon,
  CalendarIcon,
  CheckSquareIcon,
  DotsHorizontalSquareIcon,
  AeroplaneIcon,
  CancelIcon,
} from "mage-icons-react/bulk";
import { ArrowRightIcon } from "mage-icons-react/stroke";
import { LinkedinIcon } from "mage-icons-react/social-color";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTime } from "luxon";

const ACTIVITY_ICONS = {
  STAGE_CHANGE: ArrowRightIcon,
  NOTE: MessageSquareIcon,
  EMAIL_SENT: EmailIcon,
  EMAIL_OPENED: EmailIcon,
  REPLY: EmailIcon,
  CALL: PhoneIcon,
  MEETING: CalendarIcon,
  LINKEDIN: LinkedinIcon,
  TASK: CheckSquareIcon,
  OTHER: DotsHorizontalSquareIcon,
};

const ACTIVITY_COLORS = {
  STAGE_CHANGE: "bg-blue-100 text-blue-700",
  NOTE: "bg-yellow-100 text-yellow-700",
  EMAIL_SENT: "bg-gray-100 text-gray-700",
  EMAIL_OPENED: "bg-indigo-100 text-indigo-700",
  REPLY: "bg-purple-100 text-purple-700",
  CALL: "bg-green-100 text-green-700",
  MEETING: "bg-orange-100 text-orange-700",
  LINKEDIN: "bg-blue-100 text-blue-700",
  TASK: "bg-teal-100 text-teal-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const ACTIVITY_TYPES = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TASK", label: "Task" },
  { value: "OTHER", label: "Other" },
];

export default function DealDetailPanel({
  open,
  onClose,
  deal,
  stages,
  activities,
  onStageChange,
  onAddActivity,
}) {
  const [activityType, setActivityType] = useState("NOTE");
  const [activityDescription, setActivityDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deal) return null;

  const lead = deal.expand?.lead;
  const currentStage = stages.find((s) => s.id === deal.stage);

  const handleStageChange = (newStageId) => {
    if (newStageId !== deal.stage) {
      onStageChange(deal.id, deal.stage, newStageId);
    }
  };

  const handleAddActivity = async () => {
    if (!activityDescription.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddActivity({
        deal: deal.id,
        campaign: deal.campaign,
        type: activityType,
        description: activityDescription.trim(),
      });
      setActivityDescription("");
      setActivityType("NOTE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[420px] sm:w-[480px] border-l-black border-l-2 p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-black bg-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Lead Details</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Lead info card */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                {(lead?.name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {lead?.name || "Unknown"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {lead?.email || "-"}
                </p>
              </div>
            </div>

            {/* Stage selector */}
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Pipeline Stage
              </label>
              <Select value={deal.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="h-8 border-black text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black"
                      style={{
                        backgroundColor: currentStage?.color || "#6B7280",
                      }}
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stage.color || "#6B7280" }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lead email status */}
            <div className="mt-3 flex gap-3 text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">Status:</span>{" "}
                {lead?.status || "PENDING"}
              </div>
              <div>
                <span className="font-medium text-gray-700">Stage:</span>{" "}
                {lead?.stage || 0}/
                {lead?.expand?.campaign?.max_stage_count || "-"}
              </div>
              <div>
                <span className="font-medium text-gray-700">Opened:</span>{" "}
                {lead?.opened ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {/* Add activity */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="h-7 w-[110px] border-black text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-400">Log an activity</span>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Add a note, log a call..."
                className="border-black text-sm min-h-[60px] resize-none"
                rows={2}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleAddActivity}
                disabled={!activityDescription.trim() || isSubmitting}
                className="h-7 text-xs"
              >
                <AeroplaneIcon className="w-3 h-3 mr-1" />
                Log Activity
              </Button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Activity Timeline
            </h4>

            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No activities yet
              </p>
            ) : (
              <div className="space-y-0">
                {activities.map((activity, idx) => {
                  const Icon =
                    ACTIVITY_ICONS[activity.type] || DotsHorizontalSquareIcon;
                  const colorClass =
                    ACTIVITY_COLORS[activity.type] ||
                    "bg-gray-100 text-gray-700";

                  return (
                    <div key={activity.id} className="flex gap-3 relative">
                      {/* Timeline line */}
                      {idx < activities.length - 1 && (
                        <div className="absolute left-[13px] top-[28px] bottom-0 w-px bg-gray-200" />
                      )}

                      {/* Icon */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                      >
                        <Icon className="w-[13px] h-[13px]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">
                            {activity.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {DateTime.fromISO(activity.created).toRelative()}
                          </span>
                        </div>

                        {/* Stage change details */}
                        {activity.type === "STAGE_CHANGE" && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  activity.expand?.from_stage?.color || "#ccc",
                              }}
                            />
                            <span>
                              {activity.expand?.from_stage?.name || "—"}
                            </span>
                            <ArrowRightIcon className="w-[10px] h-[10px]" />
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  activity.expand?.to_stage?.color || "#ccc",
                              }}
                            />
                            <span>
                              {activity.expand?.to_stage?.name || "—"}
                            </span>
                          </div>
                        )}

                        {activity.description && (
                          <p
                            className="text-xs text-gray-600 mt-1 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: activity.description,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
