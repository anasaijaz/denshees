"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSWRMutation from "swr/mutation";
import { patch } from "@/lib/apis";
import { mutate } from "swr";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { InformationCircleIcon, CalendarIcon } from "mage-icons-react/bulk";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CampaignSettingsForm = ({ campaign, campaignData }) => {
  const [ignoreVerification, setIgnoreVerification] = useState(false);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [delaySliderValue, setDelaySliderValue] = useState([3]);
  const [followUpsSliderValue, setFollowUpsSliderValue] = useState([3]);
  const [activeDays, setActiveDays] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ];

  useEffect(() => {
    if (campaignData) {
      setIgnoreVerification(campaignData.ignoreVerification);
      setIsTrackingEnabled(campaignData.isTrackingEnabled || false);
      setTitle(campaignData.title);
      setDesc(campaignData.desc);
      setDelaySliderValue([campaignData.daysInterval]);
      setFollowUpsSliderValue([campaignData.maxStageCount]);
      setTime(campaignData.emailDeliveryPeriod || "");
      setActiveDays(campaignData.activeDays || []);
    }
  }, [campaignData]);

  const { trigger } = useSWRMutation(`/api/campaign/${campaign}`, patch);

  const handleDayToggle = useCallback((dayId) => {
    setActiveDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (
      !title ||
      !desc ||
      !delaySliderValue ||
      !followUpsSliderValue ||
      !time ||
      activeDays.length === 0
    ) {
      toast.error(
        "Please fill all the fields and select at least one active day!",
      );
      setLoading(false);
      return;
    }

    try {
      await trigger({
        title,
        desc,
        max_stage_count: followUpsSliderValue[0],
        days_interval: delaySliderValue[0],
        email_delivery_period: time,
        ignore_verification: ignoreVerification,
        isTrackingEnabled: isTrackingEnabled,
        active_days: activeDays,
      });

      toast.success("Campaign updated successfully!");
      mutate(`/api/campaign/${campaign}`);
    } catch (error) {
      toast.error("Failed to update campaign");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Campaign Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label htmlFor="title" className="mb-2 block">
              Campaign Title
            </Label>
            <Input
              name="title"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <Label htmlFor="desc" className="mb-2 block">
              Description
            </Label>
            <Input
              name="desc"
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Email Sequence Settings</h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-2">
              <Label htmlFor="followups" className="mr-2">
                Number of email follow-ups to each contact:{" "}
                {followUpsSliderValue}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InformationCircleIcon className="w-4 h-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm">
                      You cannot update this at the moment.
                      <br />
                      This feature will be launched soon!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center">
              <span className="mr-4">0</span>
              <Slider
                disabled={true}
                value={followUpsSliderValue}
                min={0}
                max={10}
                step={1}
                className={cn("w-full max-w-md cursor-not-allowed")}
              />
              <span className="ml-4">10</span>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Label htmlFor="delay" className="mr-2">
                Delay between email follow-ups (in days): {delaySliderValue}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InformationCircleIcon className="w-4 h-4 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm">
                      You cannot update this at the moment.
                      <br />
                      This feature will be launched soon!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center">
              <span className="mr-4">1</span>
              <Slider
                disabled={true}
                value={delaySliderValue}
                min={1}
                max={8}
                step={1}
                className={cn("w-full max-w-md cursor-not-allowed")}
              />
              <span className="ml-4">8</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="time" className="mb-2 block">
                Email Delivery Time
              </Label>
              <div className="flex items-center">
                <Select
                  key={time} // Force re-render when time changes
                  value={time}
                  onValueChange={(value) => setTime(value)}
                >
                  <SelectTrigger className="w-full border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <SelectValue placeholder="When should the emails be sent?" />
                  </SelectTrigger>
                  <SelectContent className="border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <SelectGroup>
                      <SelectLabel>Select time of the day...</SelectLabel>
                      <SelectItem value="MORNING">6 AM - 12 PM</SelectItem>
                      <SelectItem value="EVENING">12 PM - 6 PM</SelectItem>
                      <SelectItem value="NIGHT">6 PM - 12 AM</SelectItem>
                      <SelectItem value="MIDNIGHT">12 AM - 6 AM</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InformationCircleIcon className="w-4 h-4 ml-2 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-sm">
                        This is according to your local timezone!
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="ignore-verification"
                checked={ignoreVerification}
                onCheckedChange={setIgnoreVerification}
                className="mt-1"
              />
              <div>
                <Label htmlFor="ignore-verification" className="mb-1 block">
                  Send emails to unverified contacts
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-gray-500 cursor-help">
                        Warning: This can hurt the deliverability of your email
                        account
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-sm">
                        Will ignore verification status and send emails to all
                        contacts.
                        <br />
                        This may increase bounce rates and affect your email
                        reputation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Email Tracking Option */}
          <div className="flex items-start space-x-2 pt-2 border-t border-gray-200">
            <div>
              <Checkbox
                id="email-tracking"
                checked={isTrackingEnabled}
                onCheckedChange={setIsTrackingEnabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email-tracking" className="mb-1 block">
                Enable Email Tracking
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-500 cursor-help">
                      Track when recipients open your emails
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm">
                      Adds a tracking pixel to your emails to monitor when they
                      are opened.
                      <br />
                      This helps you understand recipient engagement with your
                      campaign.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Campaign Schedule Section */}
        <h3 className="text-lg font-semibold mb-4 mt-8 pt-6 border-t border-gray-200">
          Campaign Schedule
        </h3>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Select the days of the week when this campaign should be active.
            Emails will only be sent on selected days.
          </p>
          <div className="flex flex-wrap gap-3 max-w-full">
            {daysOfWeek.map((day) => (
              <div
                key={day.id}
                className={`border p-2 md:p-3 transition-all text-center flex-1 min-w-[100px] max-w-[140px] cursor-pointer ${
                  activeDays.includes(day.id)
                    ? "border-black bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-gray-200 hover:border-gray-300 bg-white text-black"
                }`}
                onClick={() => {
                  const checked = !activeDays.includes(day.id);
                  return checked
                    ? setActiveDays([...activeDays, day.id])
                    : setActiveDays(activeDays.filter((id) => id !== day.id));
                }}
              >
                <div className="flex flex-col items-center space-y-1 md:space-y-2">
                  <span className="text-xs md:text-sm font-medium truncate w-full text-center">
                    {day.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {activeDays.length === 0 && (
            <div className="mt-4 p-3 border border-red-200 bg-red-50">
              <p className="text-sm text-red-600">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Please select at least one day for the campaign to be active.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="px-8">
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </>
          ) : (
            "Update Campaign"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CampaignSettingsForm;
