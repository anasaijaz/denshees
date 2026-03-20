"use client";

import { useState, useEffect } from "react";
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
import useSWRMutation from "swr/mutation";
import { patch } from "@/lib/apis";
import { mutate } from "swr";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2Icon } from "mage-icons-react/bulk";
import { AnimatePresence, motion } from "framer-motion";
import { PersonalizationForm } from "./personalization-form";

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

const EditLeadDialog = ({ open = false, setOpen, lead = null, campaign }) => {
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

  // Setup mutation for updating a lead
  const { trigger: updateLead, isMutating } = useSWRMutation(
    lead ? `/api/lead/update?lead=${lead.id}` : null,
    patch,
    {
      onSuccess: () => {
        toast.success("Lead updated successfully");
        mutate(`/api/contacts/paginatedapi?campaign=${campaign}`);
        setOpen(false);
      },
      onError: () => {
        toast.error("Failed to update lead");
      },
    },
  );

  // Populate form when lead data changes
  useEffect(() => {
    if (lead) {
      setLeadData({
        name: lead.name || "",
        email: lead.email || "",
      });

      // Handle personalization - could be JSON string or object
      try {
        let parsedPersonalization = {};

        if (lead.personalization) {
          if (typeof lead.personalization === "string") {
            // It's a JSON string, parse it
            parsedPersonalization = JSON.parse(lead.personalization);
          } else if (typeof lead.personalization === "object") {
            // It's already an object, use it directly
            parsedPersonalization = lead.personalization;
          }
        }

        setPersonalization(parsedPersonalization);
      } catch (error) {
        console.error("Error parsing personalization:", error);
        setPersonalization({});
      }
    } else {
      // Reset form when no lead
      setLeadData({ name: "", email: "" });
      setPersonalization({});
    }
    setFormError(null);
  }, [lead]);

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

      // Update the lead via API
      await updateLead({
        email: leadData.email,
        name: leadData.name,
        personalization: JSON.stringify(personalization),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.errors[0].message);
      } else {
        setFormError("An error occurred. Please try again.");
        console.error("Error updating lead:", error);
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

  const handleClose = () => {
    setOpen(false);
    setShowPersonalization(false);
    setPersonalizeForm({ label: "", value: "" });
    setFormError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead information and personalization data
          </DialogDescription>
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
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    placeholder="John Doe"
                    value={leadData.name}
                    onChange={handleInputChange}
                    required
                    className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={leadData.email}
                    onChange={handleInputChange}
                    required
                    className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
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
                  onClick={handleClose}
                  disabled={isMutating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Updating..." : "Update Lead"}
                </Button>
              </DialogFooter>
            </motion.form>
          ) : (
            <PersonalizationForm
              onSave={handlePersonalizationSave}
              onCancel={handlePersonalizationCancel}
              form={personalizeForm}
              setForm={setPersonalizeForm}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadDialog;
