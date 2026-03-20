"use client";

import { useEffect, useRef, useState } from "react";
import useSWRMutation from "swr/mutation";
import dynamic from "next/dynamic";
import { patch } from "@/lib/apis";
import { mutate } from "swr";
import { Input } from "@/components/ui/input";
import { InformationCircleIcon, SaveFloppyIcon } from "mage-icons-react/bulk";
import { AnimatePresence, motion } from "framer-motion";
import AIButton from "@/components/campaigns/builder/ai-button";

// Dynamically import JoditEditor to avoid SSR issues
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

const UpdateTemplate = ({ message, stage, campaign, subject }) => {
  const subjectRef = useRef(null);

  const [text, updateText] = useState(message);
  const [subjectValue, updateSubjectValue] = useState(subject);
  const [loading, setLoading] = useState(false);

  const { trigger } = useSWRMutation(
    `/api/pitches/update?pitch=${stage.id}`,
    patch,
    {
      onSuccess: () => {
        mutate(`/api/pitches?campaign=${campaign}`);
      },
    },
  );

  useEffect(() => {
    handleSaveTemplate();
  }, [text]);

  useEffect(() => {
    updateText(message);
    updateSubjectValue(subject);
  }, [stage, message, subject]);

  const handleSaveTemplate = () => {
    trigger({
      message: text,
      subject: subjectValue,
    });
  };

  return (
    <div className="relative flex flex-col justify-start items-start gap-4">
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute top-0 bottom-0 right-0 left-0 z-10 bg-white/90 flex flex-col items-center justify-center border border-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              role="status"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                <p className="text-lg font-medium mb-2">Enhancing your email</p>
                <div className="flex justify-center">
                  <div className="animate-pulse flex space-x-1">
                    <div className="h-2 w-2 bg-black rounded-full"></div>
                    <div className="h-2 w-2 bg-black rounded-full"></div>
                    <div className="h-2 w-2 bg-black rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-left w-full text-sm font-medium">
        To: contacts in campaign
      </p>

      <div className="w-full">
        <label htmlFor="subject" className="block text-sm font-medium mb-1">
          Subject Line
        </label>
        <Input
          id="subject"
          ref={subjectRef}
          value={subjectValue}
          onChange={(event) => updateSubjectValue(event.target.value)}
          placeholder="Subject"
          className="w-full border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          onBlur={handleSaveTemplate}
        />
      </div>

      <div className="w-full">
        <label htmlFor="email-body" className="block text-sm font-medium mb-1">
          Email Body
        </label>
        <div className="border border-black h-[400px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <TemplateEditor
            value={text}
            onSave={(value) => {
              updateText(value);
            }}
          />
        </div>
      </div>

      <div className="flex justify-start items-center gap-4 mt-2 w-full">
        <AIButton text={text} updateText={updateText} setLoading={setLoading} />
      </div>

      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 border-t border-gray-200 pt-4">
        <div className="flex items-start gap-2 text-xs text-gray-700">
          <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>
              Available variables:{" "}
              <code className="bg-gray-100 px-1 py-0.5 border border-gray-300">
                {"{{name}}"}
              </code>{" "}
              and{" "}
              <code className="bg-gray-100 px-1 py-0.5 border border-gray-300">
                {"{{email}}"}
              </code>
            </p>
            <p>We are working on adding more variables soon!</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <SaveFloppyIcon className="w-4 h-4" />
          <span>Templates are autosaved</span>
        </div>
      </div>
    </div>
  );
};

const TemplateEditor = ({ value, onSave }) => {
  const editor = useRef(null);

  const config = {
    readonly: false,
    placeholder: "Start typing your email content...",
    height: "400px",
    width: "100%",
    fullSize: false,
    disablePlugins: [
      "add-new-line",
      "iframe",
      "table",
      "audio",
      "video",
      "speech-recognize",
    ],
    events: {
      afterInit: (instance) => {
        instance.editor.style.height = "100%";
      },
    },
    theme: "default",
    style: {
      font: "16px Arial",
    },
  };

  if (typeof window === "undefined") return null;

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        tabIndex={1}
        onBlur={(newContent) => onSave(newContent)}
      />
    </div>
  );
};

export default UpdateTemplate;
