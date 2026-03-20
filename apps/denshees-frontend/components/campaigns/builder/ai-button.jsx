"use client";

import { useState } from "react";
import { StarsCIcon } from "mage-icons-react/bulk";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { post } from "@/lib/apis";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Icons for enhancement types
const enhancementTypes = [
  {
    value: "POLITE",
    label: "Make It More Polite",
    icon: "🙏",
  },
  {
    value: "GRAMMAR",
    label: "Correct Grammatical Mistakes",
    icon: "📝",
  },
  {
    value: "PROFESSIONAL",
    label: "Make It More Professional",
    icon: "👔",
  },
  {
    value: "HUMOUR",
    label: "Add Subtle Humor",
    icon: "😄",
  },
  {
    value: "INFORMAL",
    label: "Make It More Informal",
    icon: "👋",
  },
];

const AIButton = ({ text, updateText, setLoading }) => {
  const { trigger } = useSWRMutation(`/api/ai/enhance`, post);
  const [selected, setSelected] = useState("");

  const enhanceText = async () => {
    if (selected.length === 0) {
      toast("Please select an enhancement type");
      return;
    }

    if (text.length > 3000) {
      toast(
        "Text is too long. Please upgrade your plan to support more than 3000 characters.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await trigger({ type: selected, text });
      toast.success("Text enhanced successfully");
      updateText(response.enhancedText);
    } catch (error) {
      toast.error("Error enhancing text");
      console.error("AI enhancement error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full sm:w-[280px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <SelectValue placeholder="Select enhancement type" />
        </SelectTrigger>
        <SelectContent className="border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <SelectGroup>
            {enhancementTypes.map((type) => (
              <SelectItem
                key={type.value}
                value={type.value}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{type.icon}</span>
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        onClick={enhanceText}
        disabled={selected.length === 0}
        className="flex items-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <StarsCIcon className="w-4 h-4" />
        Enhance with AI
      </Button>
    </div>
  );
};

export default AIButton;
