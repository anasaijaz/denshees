"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  XAxis,
} from "recharts";

const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function isActiveDay(date, activeDays) {
  if (!activeDays || !Array.isArray(activeDays) || activeDays.length === 0)
    return true;
  const dayName = DAY_NAMES[date.weekday - 1];
  return activeDays.map((d) => d.toLowerCase()).includes(dayName);
}

function snapToActiveDay(date, activeDays) {
  for (let i = 0; i < 14; i++) {
    const candidate = date.plus({ days: i });
    if (isActiveDay(candidate, activeDays)) return candidate;
  }
  return date;
}

function calculateFutureEmails(contacts, campaign) {
  const today = DateTime.now().startOf("day");
  const futureCounts = {};
  const daysInterval = campaign?.daysInterval || 1;
  const maxStageCount = campaign?.maxStageCount || 1;
  const activeDays = campaign?.activeDays;

  // Total daily capacity = sum of each credential's dailyLimit (default 20 each)
  const creds = campaign?.campaignEmailCredentials || [];
  const totalDailyCapacity =
    creds.length > 0
      ? creds.reduce(
          (sum, c) => sum + (c.emailCredential?.dailyLimit || 20),
          0,
        )
      : null;

  (contacts || []).forEach((contact) => {
    if (["COMPLETED", "REPLIED", "BOUNCED"].includes(contact.status)) return;
    const currentStage = contact.stage || 0;
    const remainingStages = maxStageCount - currentStage;
    if (remainingStages <= 0) return;

    let baseDate;
    if (!contact.sentAt) {
      baseDate = snapToActiveDay(today, activeDays);
    } else {
      const lastSent = (
        typeof contact.sentAt === "number"
          ? DateTime.fromMillis(contact.sentAt)
          : DateTime.fromISO(contact.sentAt)
      ).startOf("day");
      const daysSinceLast = Math.floor(today.diff(lastSent, "days").days);
      if (daysSinceLast >= daysInterval) {
        baseDate = snapToActiveDay(today, activeDays);
      } else {
        baseDate = snapToActiveDay(
          today.plus({ days: daysInterval - daysSinceLast }),
          activeDays,
        );
      }
    }

    for (let i = 0; i < remainingStages; i++) {
      const emailDate = snapToActiveDay(
        baseDate.plus({ days: i * daysInterval }),
        activeDays,
      );
      const dateStr = emailDate.toISODate();
      futureCounts[dateStr] = (futureCounts[dateStr] || 0) + 1;
    }
  });

  // Cap each day by totalDailyCapacity and carry overflow to the next active day
  if (totalDailyCapacity) {
    const sortedDates = Object.keys(futureCounts).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i];
      const count = futureCounts[dateStr] || 0;
      if (count > totalDailyCapacity) {
        futureCounts[dateStr] = totalDailyCapacity;
        const overflow = count - totalDailyCapacity;
        const nextDate = snapToActiveDay(
          DateTime.fromISO(dateStr).plus({ days: 1 }),
          activeDays,
        );
        const nextStr = nextDate.toISODate();
        futureCounts[nextStr] = (futureCounts[nextStr] || 0) + overflow;
        if (!sortedDates.includes(nextStr)) {
          const insertAt = sortedDates.findIndex((d) => d > nextStr);
          sortedDates.splice(insertAt === -1 ? sortedDates.length : insertAt, 0, nextStr);
        }
      }
    }
  }

  return futureCounts;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const emails = payload.find((p) => p.dataKey === "emails")?.value || 0;
  const replies = payload.find((p) => p.dataKey === "replies")?.value || 0;
  if (emails === 0 && replies === 0) return null;
  return (
    <div className="bg-white border border-black text-[10px] font-mono px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="font-bold mb-0.5">{label}</div>
      {emails > 0 && <div>{emails} emails</div>}
      {replies > 0 && <div className="text-green-600">{replies} replies</div>}
    </div>
  );
};

const EmailTimelineChart = ({ contacts, campaign, dailyStatsRaw }) => {
  const { data, maxCount } = useMemo(() => {
    const today = DateTime.now().startOf("day");

    const pastMap = {};
    const repliesMap = {};
    (dailyStatsRaw?.stats || []).forEach((row) => {
      pastMap[row.day] = row.sent || 0;
      repliesMap[row.day] = row.replies || 0;
    });

    const futureMap = calculateFutureEmails(contacts, campaign);

    const rows = [];
    for (let offset = 0; offset <= 30; offset++) {
      const date = today.plus({ days: offset });
      const dateStr = date.toISODate();
      const isToday = offset === 0;

      const emails = isToday
        ? (pastMap[dateStr] || 0) + (futureMap[dateStr] || 0)
        : futureMap[dateStr] || 0;
      const replies = isToday ? repliesMap[dateStr] || 0 : 0;

      rows.push({
        label: isToday ? "Today" : date.toFormat("d MMM"),
        emails,
        replies,
      });
    }

    const maxCount = Math.max(1, ...rows.map((r) => r.emails + r.replies));
    return {
      data: rows.map((r) => ({
        ...r,
        bg: maxCount - r.emails - r.replies,
      })),
      maxCount,
    };
  }, [contacts, campaign, dailyStatsRaw]);

  return (
    <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap="0%"
          barGap={0}
        >
          <XAxis hide dataKey="label" />
          <YAxis hide domain={[0, maxCount]} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="emails"
            stackId="s"
            fill="#000000"
            stroke="#9ca3af"
            strokeWidth={1}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="emails"
              content={({ x, y, width, height, value }) => {
                if (!value || value === 0 || height < 12) return null;
                const cx = x + width / 2;
                const cy = y + height / 2;
                return (
                  <text
                    x={cx}
                    y={cy}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(-90, ${cx}, ${cy})`}
                    fontSize={7}
                    fontFamily="monospace"
                  >
                    {value}
                  </text>
                );
              }}
            />
          </Bar>
          <Bar
            dataKey="replies"
            stackId="s"
            fill="#22c55e"
            stroke="#9ca3af"
            strokeWidth={1}
            isAnimationActive={false}
          />
          <Bar
            dataKey="bg"
            stackId="s"
            fill="#e5e7eb"
            stroke="#9ca3af"
            strokeWidth={1}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="bg"
              content={({ x, y, width, height, value }) => {
                if (value !== maxCount || height < 16) return null;
                const cx = x + width / 2;
                const cy = y + height / 2;
                return (
                  <text
                    x={cx}
                    y={cy}
                    fill="#9ca3af"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(-90, ${cx}, ${cy})`}
                    fontSize={7}
                    fontFamily="monospace"
                  >
                    No emails scheduled
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmailTimelineChart;
