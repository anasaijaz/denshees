"use client";

import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import StatCard from "@/components/campaigns/analytics/stat-card";
import EmailTimelineChart from "@/components/campaigns/analytics/email-timeline-chart";
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

const AnalyticsDashboard = ({ campaignId, campaign }) => {

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

      {/* Email send / schedule timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch min-h-[140px]">
        <div className="lg:col-span-4 h-full">
          <EmailTimelineChart
            contacts={contacts}
            campaign={campaign}
            dailyStatsRaw={dailyStatsRaw}
          />
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
