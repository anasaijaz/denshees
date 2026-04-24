"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export function PersonalizationForm({ onSave, onCancel, form, setForm, lastPersonalization = {} }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <motion.form
      initial={{ x: "-10%" }}
      animate={{ x: 0 }}
      exit={{ x: "10%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="flex gap-2 z-10 items-center justify-between">
        <p className="text-sm text-gray-700 font-medium">Add Personalization</p>
        <div className="h-[1px] flex-grow bg-black/20" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="label" className="w-24">
            Label
          </Label>
          <Input
            id="label"
            placeholder="e.g. Company"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
            className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="value" className="w-24">
            Value
          </Label>
          <Input
            id="value"
            placeholder="e.g. Acme Inc"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
            className="border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </motion.form>
  );
}
