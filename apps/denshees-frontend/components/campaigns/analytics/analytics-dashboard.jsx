"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { DateTime } from "luxon";
import fetcher from "@/lib/fetcher";
import StatCard from "@/components/campaigns/analytics/stat-card";
import EmailProgressBar from "@/components/campaigns/analytics/email-progress-bar";
import DailyAnalysisChart from "@/components/campaigns/analytics/daily-analysis-chart";
import MessageInbox from "@/components/campaigns/analytics/message-inbox";
import {
  EmailIcon,
  CheckCircleIcon,
  AeroplaneIcon,
  EyeIcon,
  MessageSquareIcon,
} from "mage-icons-react/bulk";
import PieChart from "@/components/campaigns/analytics/pie-chart";
import { CampaignActivities } from "./recent-activities";

// Helper function to calculate days passed
function daysPassed(dateString) {
  const pastDate = DateTime.fromFormat(dateString, "yyyy MM dd");
  if (!pastDate.isValid) return 0;

  const today = DateTime.now().startOf("day");
  const pastDateAtMidnight = pastDate.startOf("day");
  const diffDays = today.diff(pastDateAtMidnight, "days").days;

  return Math.floor(diffDays);
}

// Helper function to get next schedule
function getNextSchedule(days, interval) {
  if (days > interval) return "Today";
  else return `in ${interval - days} Days`;
}

// Helper function to get latest sent date
function getLatestSentAt(data) {
  if (!data || data.length === 0) return null;

  const dates = data
    .map((item) => {
      if (!item.sentAt) return null;
      const dt =
        typeof item.sentAt === "number"
          ? DateTime.fromMillis(item.sentAt)
          : DateTime.fromISO(item.sentAt);
      return dt.isValid ? dt.toFormat("yyyy MM dd") : null;
    })
    .filter((item) => item !== null);

  if (dates.length === 0) return null;

  const latestDate = dates.reduce(
    (maxDate, currentDate) => (currentDate > maxDate ? currentDate : maxDate),
    dates[0],
  );

  const count = dates.filter((date) => date === latestDate).length;

  return { latestDate, count };
}

const AnalyticsDashboard = ({ campaignId, campaign }) => {
  const [sentAt, setSentAt] = useState(null);

  // Fetch campaign contacts
  const { data: contactsData, isLoading: contactsLoading } = useSWR(
    campaignId ? `/api/contacts?campaign=${campaignId}` : null,
    fetcher,
  );

  // Fetch daily stats data
  const { data: dailyStatsRaw, isLoading: dailyAnalysisLoading } = useSWR(
    campaignId ? `/api/analysis/campaign/${campaignId}/daily-stats` : null,
    fetcher,
  );

  // Transform daily-stats shape to match what DailyAnalysisChart expects
  const dailyAnalysisData = dailyStatsRaw?.stats?.map((row) => ({
    date: row.day,
    opened: row.opens,
    emails_sent: row.sent,
  }));

  // Fetch today's analysis data
  const { data: todayAnalysisData, isLoading: todayAnalysisLoading } = useSWR(
    campaignId ? `/api/today_analysis/${campaignId}` : null,
    fetcher,
  );

  // Calculate stats
  useEffect(() => {
    if (contactsData) {
      setSentAt(getLatestSentAt(contactsData));
    }
  }, [contactsData]);

  if (contactsLoading || dailyAnalysisLoading || todayAnalysisLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="border border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-medium">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Calculate stats from data
  const contacts = contactsData || [];
  const totalContacts = contacts.length;
  const verifiedContacts = contacts.filter(
    (c) => c.verified === "VERIFIED",
  ).length;
  const emailsSent = contacts.reduce(
    (sum, contact) => sum + (contact.stage || 0),
    0,
  );
  const emailsOpened = contacts.filter((c) => c.opened > 0).length;
  const emailsReplied = contacts.filter((c) => c.status === "REPLIED").length;

  // Calculate completion percentage
  const maxPossibleEmails = totalContacts * (campaign?.maxStageCount || 1);
  const completionPercentage =
    maxPossibleEmails > 0 ? (emailsSent / maxPossibleEmails) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Leads"
          value={totalContacts}
          icon={<EmailIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Verified"
          value={verifiedContacts}
          icon={<CheckCircleIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Emails Sent"
          value={emailsSent}
          icon={<AeroplaneIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Emails Opened"
          value={emailsOpened}
          icon={<EyeIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Replies"
          value={emailsReplied}
          icon={<MessageSquareIcon className="w-6 h-6" />}
        />
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-4">
          <EmailProgressBar
            totalEmails={maxPossibleEmails}
            sentEmails={emailsSent}
            openedEmails={emailsOpened}
            repliedEmails={emailsReplied}
          >
            <p className="text-sm text-center font-medium z-20 relative w-fit mx-auto select-none">
              {completionPercentage >= 100
                ? "Email campaign completed"
                : sentAt
                  ? `Next email scheduled ${getNextSchedule(
                      daysPassed(sentAt.latestDate),
                      campaign?.daysInterval || 1,
                    )}`
                  : "Emails are yet to be sent!"}
            </p>
          </EmailProgressBar>
        </div>
        <div className="border border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
          <p className="text-sm font-medium mb-2">Campaign Progress</p>
          <div className="w-full h-6 border border-black bg-white relative">
            <div
              className="absolute top-0 left-0 bottom-0 bg-gray-200 transition-all duration-1000"
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            ></div>
            <p className="text-xs absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-medium">
              {Math.round(completionPercentage)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts and Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-medium mb-4">Daily Activity</h3>

          {totalContacts > 0 ? (
            <DailyAnalysisChart
              campaignId={campaignId}
              dailyData={dailyAnalysisData}
              todayData={todayAnalysisData}
            />
          ) : (
            <p className="text-center py-12 text-gray-500">
              Add leads to this campaign to see daily progress.
            </p>
          )}
        </div>

        <MessageInbox campaignId={campaignId} />
      </div>

      <CampaignActivities campaignId={campaignId} />
    </div>
  );
};

export default AnalyticsDashboard;
