"use client";
import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { format, isToday, isYesterday } from "date-fns";
import {
  EmailIcon,
  EyeIcon,
  MessageSquareIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ClockIcon,
  AeroplaneIcon,
  UserCheckIcon,
} from "mage-icons-react/bulk";
import {
  ReloadIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
} from "mage-icons-react/stroke";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import fetcher from "@/lib/fetcher";

// ─── Per‑day fetcher key builder ────────────────────
function dayKey(campaignId, date) {
  if (!campaignId || !date) return null;
  const d = format(date, "yyyy-MM-dd");
  return `/api/analysis/campaign/${campaignId}/activities?date=${d}`;
}

// ─── Hook: fetch a single day's activities ──────────
function useDayActivities(campaignId, date) {
  const { data, error, isLoading } = useSWR(dayKey(campaignId, date), fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  return {
    activities: data?.activities || [],
    summary: data?.summary || { total: 0, sent: 0, opened: 0, replied: 0 },
    error,
    isLoading,
  };
}

// ─── Main Export ────────────────────────────────────
export function CampaignActivities({ campaignId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch lightweight daily stats for the calendar heat‑map
  const { data: dailyStatsData } = useSWR(
    campaignId ? `/api/analysis/campaign/${campaignId}/daily-stats` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const dailyStats = dailyStatsData?.stats || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
      {/* Left: Selected day's activities */}
      <div className="lg:col-span-2 flex">
        <DayCard campaignId={campaignId} day={selectedDate} />
      </div>

      {/* Right: Calendar */}
      <div className="flex flex-col gap-4">
        <ActivityCalendar
          dailyStats={dailyStats}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          campaignId={campaignId}
        />
      </div>
    </div>
  );
}

// ─── Day Card (loads its own data) ──────────────────
function DayCard({ campaignId, day }) {
  const { activities, summary, isLoading, error } = useDayActivities(
    campaignId,
    day,
  );

  const label = isToday(day)
    ? "Today"
    : isYesterday(day)
      ? "Yesterday"
      : format(day, "EEEE");

  return (
    <div className="border border-black bg-white h-full w-full flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black bg-stone-50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-neutral-500" />
          <span className="font-semibold text-sm text-neutral-800">
            {label}
          </span>
          <span className="text-xs text-neutral-400">
            {format(day, "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1.5"></div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-5 text-neutral-400">
            <ReloadIcon className="h-4 w-4 animate-spin mr-2" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : error ? (
          <p className="text-xs text-red-400 text-center py-4">
            Could not load activities
          </p>
        ) : activities.length === 0 ? (
          <p className="text-xs text-neutral-300 text-center py-4 select-none">
            No activity on this day
          </p>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full text-left cursor-pointer group/stack flex-1 flex flex-col">
                <div className="flex items-stretch gap-6">
                  {/* Left: Big bold stat numbers */}
                  <div className="flex flex-col justify-center gap-1 min-w-[90px]">
                    <div>
                      <p className="text-6xl font-black text-neutral-900 leading-none tracking-tighter">
                        {summary.sent}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
                        Sent
                      </p>
                    </div>
                    <div>
                      <p className="text-6xl font-black text-neutral-900 leading-none tracking-tighter">
                        {summary.opened}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
                        Opened
                      </p>
                    </div>
                    <div>
                      <p className="text-6xl font-black text-neutral-900 leading-none tracking-tighter">
                        {summary.replied}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
                        Replies
                      </p>
                    </div>
                  </div>

                  {/* Right: Single stacked card with 3D depth */}
                  <div className="flex-1 relative pb-3">
                    {/* Third layer (smallest, furthest back) */}
                    {activities.length > 2 && (
                      <div
                        className="absolute border border-neutral-300 bg-neutral-50/80 transition-transform duration-300 delay-150 group-hover/stack:scale-95 origin-top"
                        style={{
                          top: 0,
                          bottom: 2,
                          left: 16,
                          right: 16,
                          boxShadow: "0px 1px 0px 0px rgba(0,0,0,0.03)",
                        }}
                      />
                    )}
                    {/* Second layer */}
                    {activities.length > 1 && (
                      <div
                        className="absolute border border-neutral-500 bg-stone-50 transition-transform duration-300 delay-75 group-hover/stack:scale-[0.97] origin-top"
                        style={{
                          top: 0,
                          bottom: 18,
                          left: 8,
                          right: 8,
                          boxShadow: "0px 1px 0px 0px rgba(0,0,0,0.04)",
                        }}
                      />
                    )}

                    {/* Front card (only one with data) */}
                    {(() => {
                      const activity = activities[0];
                      const { headerBg, arrowIcon, arrowBg } = getActivityStyle(
                        activity.type,
                      );
                      return (
                        <div
                          className="relative border border-black bg-white p-0 flex flex-col justify-between min-h-[200px] transition-all duration-300 group-hover/stack:shadow-md"
                          style={{
                            boxShadow: "0px 2px 0px 0px rgba(0,0,0,0.06)",
                          }}
                        >
                          {/* Header: avatar + name (colored by type) */}
                          <div
                            className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${headerBg}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 text-sm font-bold text-white uppercase">
                              {(
                                activity.recipientName ||
                                activity.recipientEmail ||
                                "?"
                              ).charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-neutral-800 truncate">
                                {activity.recipientName ||
                                  activity.recipientEmail}
                              </p>
                              <span className="text-xs text-neutral-400 flex items-center gap-1">
                                {format(new Date(activity.timestamp), "h:mm a")}
                              </span>
                            </div>
                            {/* Direction arrow */}
                            <div
                              className={`h-6 w-6 rounded-full ${arrowBg} flex items-center justify-center shrink-0`}
                            >
                              {arrowIcon}
                            </div>
                          </div>

                          {/* Body: content */}
                          <div className="px-4 pt-3 pb-4 flex-1">
                            {/* Subject */}
                            {activity.subject && (
                              <p className="text-sm text-neutral-600 leading-snug line-clamp-2 italic">
                                &ldquo;{activity.subject}&rdquo;
                              </p>
                            )}
                            {/* Body */}
                            {activity.body && (
                              <p className="text-xs text-neutral-400 leading-snug line-clamp-3 mt-2">
                                {activity.body
                                  .replace(/<[^>]*>/g, "")
                                  .slice(0, 180)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* "View all" hint — pinned to bottom */}
                <div className="mt-auto pt-3">
                  {activities.length > 1 && (
                    <p className="text-xs text-neutral-400 text-center group-hover/stack:text-neutral-600 transition-colors">
                      +{activities.length - 1} more · Click to view all
                    </p>
                  )}
                  {activities.length === 1 && (
                    <p className="text-xs text-neutral-400 text-center group-hover/stack:text-neutral-600 transition-colors">
                      Click to expand
                    </p>
                  )}
                </div>
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {label} — {format(day, "MMM d, yyyy")}
                </DialogTitle>
                <DialogDescription>
                  {activities.length} activit
                  {activities.length === 1 ? "y" : "ies"} on this day
                </DialogDescription>
              </DialogHeader>

              <div className="relative pl-6 mt-4">
                {/* Vertical timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-neutral-200" />
                <div className="space-y-2.5">
                  {activities.map((activity, idx) => (
                    <TimelineItem
                      key={`dialog-${activity.timestamp}-${idx}`}
                      activity={activity}
                    />
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// ─── Timeline Item ──────────────────────────────────
function TimelineItem({ activity }) {
  const { icon, dotBg, dotBorder } = getActivityStyle(activity.type);

  return (
    <div className="relative flex items-start gap-3 group">
      {/* Timeline dot */}
      <div
        className={`absolute -left-6 top-1.5 h-[16px] w-[16px] rounded-full border-[1.5px] ${dotBorder} ${dotBg} flex items-center justify-center z-10`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 border border-neutral-100 bg-white px-3 py-2.5 rounded-sm transition-colors group-hover:bg-stone-50 group-hover:border-neutral-300">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-neutral-800">
            {activity.type}
          </span>
          <span className="text-xs text-neutral-400 flex items-center gap-1 shrink-0">
            <ClockIcon className="h-3 w-3" />
            {format(new Date(activity.timestamp), "h:mm a")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <UserCheckIcon className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
          <p className="text-xs text-neutral-500 truncate">
            {activity.recipientName || activity.recipientEmail}
          </p>
        </div>
        {activity.subject && (
          <p className="text-xs text-neutral-400 mt-1 truncate italic">
            &ldquo;{activity.subject}&rdquo;
          </p>
        )}
        {activity.body && (
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
            {activity.body.replace(/<[^>]*>/g, "").slice(0, 200)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Sidebar with heat‑map ────────────────
function ActivityCalendar({
  dailyStats,
  selectedDate,
  onSelectDate,
  campaignId,
}) {
  const { summary } = useDayActivities(campaignId, selectedDate);
  // Build a map: date string → total_activity from the PB view
  const activeDates = useMemo(() => {
    const map = new Map();
    dailyStats.forEach((row) => {
      // row.day comes as "YYYY-MM-DD" or full ISO
      const key = row.day?.split(" ")[0] || row.day;
      map.set(key, row.total_activity || 0);
    });
    return map;
  }, [dailyStats]);

  // Determine thresholds for low / medium / high buckets
  const { lowDates, medDates, highDates } = useMemo(() => {
    const counts = Array.from(activeDates.values());
    if (counts.length === 0)
      return { lowDates: [], medDates: [], highDates: [] };

    const max = Math.max(...counts);
    const lowThreshold = Math.ceil(max * 0.33);
    const highThreshold = Math.ceil(max * 0.66);

    const low = [];
    const med = [];
    const high = [];

    activeDates.forEach((count, key) => {
      const date = new Date(key + "T00:00:00");
      if (count >= highThreshold) high.push(date);
      else if (count >= lowThreshold) med.push(date);
      else low.push(date);
    });

    return { lowDates: low, medDates: med, highDates: high };
  }, [activeDates]);

  const modifiers = useMemo(
    () => ({
      activityLow: lowDates,
      activityMed: medDates,
      activityHigh: highDates,
    }),
    [lowDates, medDates, highDates],
  );

  const modifiersStyles = {
    activityLow: {
      backgroundColor: "#f0fdf4", // emerald-50
      fontWeight: 600,
    },
    activityMed: {
      backgroundColor: "#d1fae5", // emerald-100
      fontWeight: 700,
    },
    activityHigh: {
      backgroundColor: "#a7f3d0", // emerald-200
      fontWeight: 700,
    },
  };

  return (
    <div className="border border-black bg-white flex-1 flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-black bg-stone-50">
        <CalendarIcon className="h-4 w-4 text-neutral-500" />
        <span className="font-semibold text-sm text-neutral-800">
          Activity Calendar
        </span>
      </div>
      <div className="flex justify-center py-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          classNames={{
            day_selected:
              "ring-2 ring-neutral-800 ring-offset-1 font-bold text-neutral-900 hover:bg-transparent focus:bg-transparent",
          }}
          className="!p-2"
        />
      </div>
      {/* Selected day numbers */}
      <div className="px-4 pb-2 flex items-center justify-center gap-4 text-xs text-neutral-500 border-t border-neutral-100 pt-2">
        <span>{summary.sent} sent</span>
        <span>{summary.opened} opened</span>
        <span>{summary.replied} replied</span>
      </div>
      {/* Heat‑map legend */}
      <div className="px-4 pb-3 flex items-center gap-3 text-xs text-neutral-400 pt-1">
        <span className="text-neutral-500 font-medium">Activity:</span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#f0fdf4" }}
          />
          Low
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#d1fae5" }}
          />
          Med
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#a7f3d0" }}
          />
          High
        </span>
      </div>
    </div>
  );
}

// ─── Activity style helpers ────────────────────────
function getActivityStyle(type) {
  switch (type) {
    case "Email sent":
      return {
        icon: <AeroplaneIcon className="h-2 w-2 text-blue-500" />,
        dotBg: "bg-blue-50",
        dotBorder: "border-blue-300",
        headerBg: "bg-blue-50 border-blue-100",
        arrowIcon: <ArrowUpRightIcon className="h-3.5 w-3.5 text-blue-600" />,
        arrowBg: "bg-blue-100",
      };
    case "Email opened":
      return {
        icon: <EyeIcon className="h-2 w-2 text-amber-500" />,
        dotBg: "bg-amber-50",
        dotBorder: "border-amber-300",
        headerBg: "bg-amber-50 border-amber-100",
        arrowIcon: <ArrowUpRightIcon className="h-3.5 w-3.5 text-amber-600" />,
        arrowBg: "bg-amber-100",
      };
    case "Reply received":
      return {
        icon: <MessageSquareIcon className="h-2 w-2 text-emerald-500" />,
        dotBg: "bg-emerald-50",
        dotBorder: "border-emerald-300",
        headerBg: "bg-emerald-50 border-emerald-100",
        arrowIcon: (
          <ArrowDownLeftIcon className="h-3.5 w-3.5 text-emerald-600" />
        ),
        arrowBg: "bg-emerald-100",
      };
    default:
      return {
        icon: <EmailIcon className="h-2 w-2 text-neutral-500" />,
        dotBg: "bg-neutral-50",
        dotBorder: "border-neutral-300",
        headerBg: "bg-stone-50 border-neutral-100",
        arrowIcon: (
          <ArrowUpRightIcon className="h-3.5 w-3.5 text-neutral-500" />
        ),
        arrowBg: "bg-neutral-100",
      };
  }
}

// ─── Skeleton ──────────────────────────────────────
function ActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="border border-neutral-200 bg-white rounded-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-stone-50">
            <div className="h-4 w-32 bg-neutral-200 animate-pulse rounded" />
            <div className="h-4 w-16 bg-neutral-200 animate-pulse rounded" />
          </div>
          <div className="p-3 space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-start gap-3 pl-6">
                <div className="h-4 w-4 rounded-full bg-neutral-200 animate-pulse" />
                <div className="flex-1 border border-neutral-100 p-3 rounded-sm">
                  <div className="h-3.5 w-24 bg-neutral-200 animate-pulse rounded mb-2" />
                  <div className="h-3 w-36 bg-neutral-200 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border border-neutral-200 bg-white rounded-sm h-80 animate-pulse" />
        <div className="border border-neutral-200 bg-white rounded-sm h-44 animate-pulse" />
      </div>
    </div>
  );
}
