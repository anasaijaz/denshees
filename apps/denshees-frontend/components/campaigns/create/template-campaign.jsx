"use client";

import { useState } from "react";
import { ChevronLeftIcon } from "mage-icons-react/stroke";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export default function TemplateCampaignCreation({
  personDetails,
  onComplete,
  title,
  setTitle,
  desc,
  setDesc,
  loading,
  onBack,
}) {
  const [serviceType, setServiceType] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({ serviceType });
  };

  const getTimeLabel = (timeValue) => {
    switch (timeValue) {
      case "MORNING":
        return "Morning (6 AM - 12 PM)";
      case "EVENING":
        return "Afternoon (12 PM - 6 PM)";
      case "NIGHT":
        return "Evening (6 PM - 12 AM)";
      case "MIDNIGHT":
        return "Night (12 AM - 6 AM)";
      default:
        return timeValue;
    }
  };

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
            {personDetails.name} Inspired Campaign
          </h2>
        </div>
        <div className="flex-[0.1]"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/3 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="flex flex-col items-center">
            <div className="relative mb-4 w-32 h-32 rounded-full overflow-hidden border-4 border-black">
              <Image
                src={personDetails.src || "/placeholder.svg"}
                alt={personDetails.name}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-xl font-bold mb-2">{personDetails.name}</h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              {personDetails.description}
            </p>

            <div className="w-full border-t border-gray-200 pt-4">
              <h4 className="font-bold mb-4 text-center">Template Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-black p-3 text-center">
                  <p className="text-sm text-gray-600">Follow-ups</p>
                  <p className="text-xl font-bold">{personDetails.followUps}</p>
                </div>
                <div className="border-2 border-black p-3 text-center">
                  <p className="text-sm text-gray-600">Delay (days)</p>
                  <p className="text-xl font-bold">{personDetails.delay}</p>
                </div>
                <div className="border-2 border-black p-3 text-center col-span-2">
                  <p className="text-sm text-gray-600">Send time</p>
                  <p className="text-lg font-bold">
                    {getTimeLabel(personDetails.time)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-2/3 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold mb-4">Campaign Information</h3>

            <div>
              <Label htmlFor="title" className="text-md font-medium">
                Campaign Title
              </Label>
              <Input
                id="title"
                placeholder="Enter campaign title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-black mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="desc" className="text-md font-medium">
                Campaign Description
              </Label>
              <Textarea
                id="desc"
                placeholder="Enter campaign description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="border-black mt-1 min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="serviceType" className="text-md font-medium">
                What are you offering?
              </Label>
              <Select
                value={serviceType}
                onValueChange={setServiceType}
                required
              >
                <SelectTrigger id="serviceType" className="border-black mt-1">
                  <SelectValue placeholder="Select your service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="freelancing">
                      Freelancing Services
                    </SelectItem>
                    <SelectItem value="coaching">
                      Coaching/Consulting
                    </SelectItem>
                    <SelectItem value="product">Digital Product</SelectItem>
                    <SelectItem value="saas">SaaS Product</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                This will personalize your email templates
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full py-2 text-lg"
                disabled={loading || !serviceType || !title || !desc}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Creating Campaign...
                  </div>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
