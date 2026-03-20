"use client";
import { InformationCircleIcon } from "mage-icons-react/bulk";
import { ChevronLeftIcon } from "mage-icons-react/stroke";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import Stepper from "@/components/campaigns/create/stepper";

const IntroductionStep = ({ title, setTitle, desc, setDesc }) => (
  <div className="flex flex-col items-center justify-evenly w-full gap-6 p-4">
    <div className="w-full">
      <Label htmlFor="title" className="text-right pb-2 text-md">
        Title
      </Label>
      <Input
        placeholder="Campaign title"
        name="title"
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-black"
      />
    </div>
    <div className="w-full">
      <Label htmlFor="desc" className="text-right pb-2 text-md">
        Description
      </Label>
      <Textarea
        placeholder="Campaign description"
        name="desc"
        id="desc"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        className="border-black min-h-[150px]"
      />
    </div>
  </div>
);

const SettingsStep = ({
  delaySliderValue,
  setDelaySliderValue,
  followUpsSliderValue,
  setFollowUpsSliderValue,
  time,
  setTime,
}) => (
  <div className="flex flex-col items-start justify-center gap-8 w-full p-4">
    <div className="flex flex-col items-center justify-evenly w-full gap-8">
      <div className="w-full">
        <Label htmlFor="frequency" className="text-right pb-2 text-md">
          Number of email follow-ups to each contact: {followUpsSliderValue}
        </Label>
        <div className="flex items-center justify-start w-full">
          <p className="py-2 pr-2">0</p>
          <Slider
            value={followUpsSliderValue}
            onValueChange={(e) => setFollowUpsSliderValue(e)}
            min={0}
            max={10}
            step={1}
            className="w-[60%] py-4 cursor-pointer"
          />
          <p className="p-2">10</p>
        </div>
      </div>
      <div className="w-full">
        <Label htmlFor="frequency" className="text-right pb-2 text-md">
          Delay between Email follow-ups to each contact (In Days):{" "}
          {delaySliderValue}
        </Label>
        <div className="flex items-center justify-start w-full">
          <p className="py-2 pr-2">1</p>
          <Slider
            value={delaySliderValue}
            onValueChange={(e) => setDelaySliderValue(e)}
            min={1}
            max={8}
            step={1}
            className="w-[60%] py-4 cursor-pointer"
          />
          <p className="p-2">8</p>
        </div>
      </div>
    </div>
    <div className="w-full md:w-[60%] flex items-center justify-start gap-4">
      <Select value={time} onValueChange={(value) => setTime(value)}>
        <SelectTrigger className="w-full text-md border-black">
          <SelectValue
            className="font-bold"
            placeholder="When should the emails be sent?"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select time of the day...</SelectLabel>
            <SelectItem value="MORNING">6 AM - 12 PM</SelectItem>
            <SelectItem value="EVENING">12 PM - 6 PM</SelectItem>
            <SelectItem value="NIGHT">6 PM - 12 AM</SelectItem>
            <SelectItem value="MIDNIGHT">12 AM - 6 AM</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  </div>
);

function ReviewStep({
  title,
  desc,
  delaySliderValue,
  followUpsSliderValue,
  time,
}) {
  const getTimeLabel = (timeValue) => {
    switch (timeValue) {
      case "MORNING":
        return "6 AM - 12 PM";
      case "EVENING":
        return "12 PM - 6 PM";
      case "NIGHT":
        return "6 PM - 12 AM";
      case "MIDNIGHT":
        return "12 AM - 6 AM";
      default:
        return timeValue;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full p-4 border border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-xl font-bold">Campaign Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-lg font-semibold">Title:</p>
          <p className="text-md bg-gray-50 p-2 rounded border border-gray-200">
            {title}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold">Description:</p>
          <p className="text-md bg-gray-50 p-2 rounded border border-gray-200">
            {desc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-lg font-semibold">Number of email follow-ups:</p>
          <p className="text-md bg-gray-50 p-2 rounded border border-gray-200">
            {followUpsSliderValue}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold">Delay between follow-ups:</p>
          <p className="text-md bg-gray-50 p-2 rounded border border-gray-200">
            {delaySliderValue} days
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-lg font-semibold">Scheduled Time of the day:</p>
        <p className="text-md bg-gray-50 p-2 rounded border border-gray-200">
          {getTimeLabel(time)}
        </p>
      </div>
    </div>
  );
}

export default function CustomCampaignCreation({
  title,
  setTitle,
  desc,
  setDesc,
  delaySliderValue,
  setDelaySliderValue,
  followUpsSliderValue,
  setFollowUpsSliderValue,
  time,
  setTime,
  loading,
  onSubmit,
  onBack,
}) {
  return (
    <div className="relative">
      <div className="flex w-full items-center mb-6">
        <div className="flex-[0.1]">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-full cursor-pointer border border-black"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-[0.8]">
          <h2 className="text-2xl font-bold text-center">
            Create Custom Campaign
          </h2>
        </div>
        <div className="flex-[0.1]"></div>
      </div>

      <Stepper
        loading={loading}
        steps={[
          {
            label: "Introduction",
            content: (
              <IntroductionStep
                title={title}
                setTitle={setTitle}
                desc={desc}
                setDesc={setDesc}
              />
            ),
          },
          {
            label: "Settings",
            content: (
              <SettingsStep
                delaySliderValue={delaySliderValue}
                setDelaySliderValue={setDelaySliderValue}
                followUpsSliderValue={followUpsSliderValue}
                setFollowUpsSliderValue={setFollowUpsSliderValue}
                time={time}
                setTime={setTime}
              />
            ),
          },
          {
            label: "Review & Submit",
            content: (
              <ReviewStep
                title={title}
                desc={desc}
                delaySliderValue={delaySliderValue}
                followUpsSliderValue={followUpsSliderValue}
                time={time}
              />
            ),
          },
        ]}
        onComplete={onSubmit}
      />
    </div>
  );
}
