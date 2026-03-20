"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import { post } from "@/lib/apis";
import CampaignTemplateSelection from "@/components/campaigns/create/template-selection";
import CustomCampaignCreation from "@/components/campaigns/create/custom-campaign";
import TemplateCampaignCreation from "@/components/campaigns/create/template-campaign";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [showCustomCampaignSteps, setShowCustomCampaignSteps] = useState(false);
  const [showTemplateCampaignsSteps, setShowTemplateCampaignsSteps] =
    useState(false);
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState({});
  const [delaySliderValue, setDelaySliderValue] = useState([3]);
  const [followUpsSliderValue, setFollowUpsSliderValue] = useState([3]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const { trigger } = useSWRMutation("/api/campaign/create", post, {
    onSuccess: () => {
      mutate("/api/campaign");
    },
  });

  const { trigger: triggerCampaignTemplate } = useSWRMutation(
    "/api/campaign/template/create",
    post,
    {
      onSuccess: () => {
        mutate("/api/campaign");
      },
    }
  );

  const handleSubmit = async (event) => {
    // event.preventDefault();
    setLoading(true);

    if (
      !title ||
      !desc ||
      !delaySliderValue ||
      !followUpsSliderValue ||
      !time
    ) {
      toast.error("Please fill all the fields!");
      setLoading(false);
      return;
    }

    const apiPromise = trigger({
      title,
      desc,
      max_stage_count: followUpsSliderValue[0] + 1,
      days_interval: delaySliderValue[0],
      email_delivery_period: time,
    });

    const minimumLoadingTimePromise = new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });

    try {
      const [res] = await Promise.all([apiPromise, minimumLoadingTimePromise]);

      setLoading(false);
      toast.success("Campaign created successfully!");
      router.push(`/campaigns/${res.campaign?.id}`);
    } catch (error) {
      console.error("API call failed:", error);
      setLoading(false);
      toast.error("Failed to create campaign!");
    }
  };

  const handleSubmitTemplate = async ({ serviceType }) => {
    setLoading(true);

    if (!serviceType || !title || !desc || !selectedCampaignTemplate?.id) {
      toast.error("Please fill all the fields!");
      setLoading(false);
      return;
    }

    const apiPromise = triggerCampaignTemplate({
      title,
      desc,
      max_stage_count: selectedCampaignTemplate.followUps + 1,
      days_interval: selectedCampaignTemplate.delay,
      email_delivery_period: selectedCampaignTemplate.time,
      serviceType,
    });

    const minimumLoadingTimePromise = new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });

    try {
      const [res] = await Promise.all([apiPromise, minimumLoadingTimePromise]);

      setLoading(false);
      toast.success("Campaign created successfully!");
      router.push(`/campaigns/${res.campaign?.id}`);
    } catch (error) {
      console.error("API call failed:", error);
      setLoading(false);
      toast.error("Failed to create campaign!");
    }
  };

  const goBack = () => {
    setShowCustomCampaignSteps(false);
    setShowTemplateCampaignsSteps(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-gray-600 mt-1">
          Set up a new email outreach campaign
        </p>
      </div>

      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {!showCustomCampaignSteps && !showTemplateCampaignsSteps ? (
          <CampaignTemplateSelection
            onSelectCustom={() => setShowCustomCampaignSteps(true)}
            onSelectTemplate={(item) => {
              setShowTemplateCampaignsSteps(true);
              setSelectedCampaignTemplate(item);
            }}
          />
        ) : showCustomCampaignSteps ? (
          <CustomCampaignCreation
            title={title}
            setTitle={setTitle}
            desc={desc}
            setDesc={setDesc}
            delaySliderValue={delaySliderValue}
            setDelaySliderValue={setDelaySliderValue}
            followUpsSliderValue={followUpsSliderValue}
            setFollowUpsSliderValue={setFollowUpsSliderValue}
            time={time}
            setTime={setTime}
            loading={loading}
            onSubmit={handleSubmit}
            onBack={goBack}
          />
        ) : (
          <TemplateCampaignCreation
            personDetails={selectedCampaignTemplate}
            onComplete={handleSubmitTemplate}
            title={title}
            setTitle={setTitle}
            desc={desc}
            setDesc={setDesc}
            loading={loading}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
