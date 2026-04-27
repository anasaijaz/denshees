"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { post } from "@/lib/apis";
import { mutate } from "swr";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2Icon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from "mage-icons-react/bulk";
import { AnimatePresence, motion } from "framer-motion";
import { PersonalizationForm } from "./personalization-form";
import fetcher from "@/lib/fetcher";
import instance from "@/lib/axios";

/**
 * Extract unique personalization variable names from pitch messages and subjects.
 * Matches patterns like {{variable}} and {{variable|"fallback"}}
 */
function extractVariablesFromPitches(pitches) {
  if (!pitches?.length) return [];
  const variableRegex = /\{\{(\w+)(?:\|[^}]*)?\}\}/g;
  const vars = new Set();
  for (const pitch of pitches) {
    const texts = [pitch.message, pitch.subject, pitch.dynamic_subject].filter(
      Boolean,
    );
    for (const text of texts) {
      let match;
      while ((match = variableRegex.exec(text)) !== null) {
        vars.add(match[1]);
      }
    }
  }
  // Filter out built-in variables that are already covered by the name/email fields
  const builtIn = new Set(["name", "email"]);
  return [...vars].filter((v) => !builtIn.has(v));
}

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

const VERIFY_RESULT_CONFIG = {
  ok:          { label: "Valid",       badgeClass: "bg-green-100 text-green-800 border-green-300",   Icon: CheckCircleIcon,        btnClass: "border-green-600 text-green-700 bg-green-50 hover:bg-green-100" },
  catch_all:   { label: "Catch-all",   badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300", Icon: ExclamationTriangleIcon, btnClass: "border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100" },
  unknown:     { label: "Unknown",     badgeClass: "bg-gray-100 text-gray-700 border-gray-300",       Icon: ExclamationTriangleIcon, btnClass: "border-gray-400 text-gray-600 bg-gray-50 hover:bg-gray-100" },
  invalid:     { label: "Invalid",     badgeClass: "bg-red-100 text-red-800 border-red-300",          Icon: ExclamationCircleIcon,   btnClass: "border-red-600 text-red-700 bg-red-50 hover:bg-red-100" },
  disposable:  { label: "Disposable",  badgeClass: "bg-orange-100 text-orange-800 border-orange-300", Icon: ExclamationCircleIcon,   btnClass: "border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100" },
  unverified:  { label: "Unverified",  badgeClass: "bg-gray-100 text-gray-700 border-gray-300",       Icon: ExclamationTriangleIcon, btnClass: "border-gray-400 text-gray-600 bg-gray-50 hover:bg-gray-100" },
  error:       { label: "Error",       badgeClass: "bg-red-100 text-red-800 border-red-300",          Icon: ExclamationCircleIcon,   btnClass: "border-red-600 text-red-700 bg-red-50 hover:bg-red-100" },
};

const AddLeadDialog = ({ open = false, setOpen, campaign, onSuccess }) => {
  const [leadData, setLeadData] = useState({
    name: "",
    email: "",
  });
  const [formError, setFormError] = useState(null);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [personalization, setPersonalization] = useState({});
  const [personalizeForm, setPersonalizeForm] = useState({
    label: "",
    value: "",
  });
  const [verifyStatus, setVerifyStatus] = useState(null); // null | "loading" | result object
  const defaultsApplied = useRef(false);

  // Fetch user account to check if MillionVerifier key is configured
  const { data: accountData } = useSWR(open ? "/api/account" : null, fetcher);
  const hasVerifierKey = !!accountData?.millionVerifierApiKey;

  // Reset verification when email changes
  useEffect(() => {
    setVerifyStatus(null);
  }, [leadData.email]);

  const handleVerifyEmail = async () => {
    if (!leadData.email) return;
    setVerifyStatus("loading");
    try {
      const res = await instance.get(
        `/api/verify-email?email=${encodeURIComponent(leadData.email)}`,
      );
      setVerifyStatus(res);
    } catch {
      setVerifyStatus({ result: "error" });
      toast.error("Email verification failed");
    }
  };

  // Fetch pitches to extract personalization variables
  const { data: pitchesData } = useSWR(
    campaign ? `/api/pitches?campaign=${campaign}` : null,
    fetcher,
  );

  // Fetch contacts to get the last personalization as default
  const { data: contactsData } = useSWR(
    open && campaign ? `/api/contacts?campaign=${campaign}` : null,
    fetcher,
  );

  const lastPersonalization = useMemo(() => {
    if (!contactsData?.length) return {};
    const withP = contactsData.filter(
      (c) => c.personalization && Object.keys(c.personalization).length > 0,
    );
    if (!withP.length) return {};
    return withP[withP.length - 1].personalization;
  }, [contactsData]);

  useEffect(() => {
    if (!open) {
      defaultsApplied.current = false;
      setVerifyStatus(null);
    }
  }, [open]);

  // Extract unique variable names from all pitch messages/subjects
  const suggestedVariables = useMemo(
    () => extractVariablesFromPitches(pitchesData?.items),
    [pitchesData],
  );

  // Variables that haven't been added yet
  const unusedVariables = useMemo(
    () => suggestedVariables.filter((v) => !personalization.hasOwnProperty(v)),
    [suggestedVariables, personalization],
  );

  console.log(pitchesData);

  const { trigger, isMutating } = useSWRMutation("/api/contacts/import", post, {
    onSuccess: () => {
      const addedEmail = leadData.email;
      setOpen(false);
      mutate(`/api/contacts/paginatedapi?campaign=${campaign}`);
      toast.success("Lead added successfully");
      onSuccess?.({ email: addedEmail });
    },
    onError: () => {
      toast.error("Error adding lead");
    },
  });

  const handleInputChange = (e) => {
    setLeadData({
      ...leadData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate the form data
      leadSchema.parse(leadData);
      setFormError(null);

      // Add the lead
      await trigger({
        contacts: [
          {
            ...leadData,
            personalization: personalization,
          },
        ],
        campaign,
      });

      // Reset form
      setLeadData({ name: "", email: "" });
      setPersonalization({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.errors[0].message);
      } else {
        setFormError("An error occurred. Please try again.");
      }
    }
  };

  const handlePersonalizationSave = (data) => {
    setPersonalization((prev) => ({
      ...prev,
      [data.label]: data.value,
    }));
    setShowPersonalization(false);
    setPersonalizeForm({ label: "", value: "" });
  };

  const handlePersonalizationCancel = () => {
    setShowPersonalization(false);
    setPersonalizeForm({ label: "", value: "" });
  };

  const handleDeletePersonalization = (labelToDelete) => {
    setPersonalization((prev) => {
      const { [labelToDelete]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSuggestionClick = (variable) => {
    setPersonalizeForm({ label: variable, value: lastPersonalization[variable] || "" });
    setShowPersonalization(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Add Lead</DialogTitle>
          <DialogDescription>Add a new lead to your campaign</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showPersonalization ? (
            <motion.form
              initial={{ x: "10%" }}
              animate={{ x: 0 }}
              exit={{ x: "-10%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={leadData.name}
                    onChange={handleInputChange}
                    required
                    className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={leadData.email}
                      onChange={handleInputChange}
                      required
                      className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    {hasVerifierKey && (() => {
                      const resultKey = verifyStatus && verifyStatus !== "loading" ? verifyStatus.result : null;
                      const config = resultKey ? VERIFY_RESULT_CONFIG[resultKey] : null;
                      const ResultIcon = config?.Icon;
                      return (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={config ? undefined : handleVerifyEmail}
                          disabled={!leadData.email || verifyStatus === "loading"}
                          className={`shrink-0 w-24 h-10 justify-center border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition-colors ${config ? config.btnClass + " border pointer-events-none" : ""}`}
                        >
                          {verifyStatus === "loading" ? (
                            <span className="animate-pulse">...</span>
                          ) : ResultIcon ? (
                            <>
                              <ResultIcon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </>
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>

                {formError && (
                  <div className="text-red-700 text-sm border border-black p-2">
                    {formError}
                  </div>
                )}

                {/* Personalization Section */}
                {Object.entries(personalization).length > 0 && (
                  <div className="mt-4 p-4 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <h4 className="text-sm font-medium mb-2">
                      Personalizations:
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(personalization).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div className="flex gap-2">
                            <span className="font-medium">{label}:</span>
                            <span>{value}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeletePersonalization(label)}
                            type="button"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Personalization Variables */}
                {unusedVariables.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Variables used in pitches:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unusedVariables.map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => handleSuggestionClick(variable)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-black rounded-md bg-gray-50 hover:bg-black hover:text-white transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <span>{`{{${variable}}}`}</span>
                          <span className="text-[10px] opacity-60">+</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPersonalization(true)}
                  >
                    Add Personalization
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Adding..." : "Add Lead"}
                </Button>
              </DialogFooter>
            </motion.form>
          ) : (
            <PersonalizationForm
              onSave={handlePersonalizationSave}
              onCancel={handlePersonalizationCancel}
              form={personalizeForm}
              setForm={setPersonalizeForm}
              lastPersonalization={lastPersonalization}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;
