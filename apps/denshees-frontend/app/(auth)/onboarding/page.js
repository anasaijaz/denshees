"use client";

import useAuthStore from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailIcon, InboxIcon } from "mage-icons-react/bulk";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  ExchangeAIcon,
} from "mage-icons-react/stroke";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    icon: EmailIcon,
    title: "Automated Email Sending",
    description:
      "Set up powerful email campaigns that send automatically on your schedule. Configure sending limits, delays, and follow-ups to reach your audience at the perfect time — all hands-free.",
  },
  {
    icon: ExchangeAIcon,
    title: "Spintax Variables",
    description:
      "Make every email unique with spintax support. Use {Hello|Hi|Hey} syntax to create dynamic variations that improve deliverability and bypass spam filters effortlessly.",
  },
  {
    icon: InboxIcon,
    title: "IMAP Inbox Receiver",
    description:
      "Connect your IMAP inbox to automatically track replies, detect bounces, and keep your campaign data in sync. Know exactly who's engaging with your outreach in real time.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
    if (mounted && user?.isSetup) {
      router.push("/");
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
      const token = stored?.state?.token;

      const res = await fetch("/api/auth/complete-setup", {
        method: "POST",
        headers: { Authorization: token },
      });

      if (!res.ok) {
        toast("Failed to complete setup");
        return;
      }

      updateUser({ isSetup: true });
      router.push("/");
    } catch (error) {
      console.error("Setup error:", error);
      toast("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated || user?.isSetup) {
    return null;
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const Icon = step.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="w-full max-w-lg text-center">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-8 bg-black"
                  : i < currentStep
                    ? "w-2 bg-black"
                    : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Icon + Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
              exit: {},
            }}
          >
            <motion.div
              className="flex justify-center mb-8"
              variants={{
                hidden: { y: 30, opacity: 0 },
                visible: { y: 0, opacity: 1 },
                exit: { y: -30, opacity: 0 },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-black text-white p-4 border border-black shadow-[4px_4px_0px_0px_rgba(128,128,128,1)]">
                <Icon className="w-8 h-8" />
              </div>
            </motion.div>

            <motion.h1
              className="text-3xl font-bold mb-4 tracking-tight"
              variants={{
                hidden: { y: 30, opacity: 0 },
                visible: { y: 0, opacity: 1 },
                exit: { y: -30, opacity: 0 },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {step.title}
            </motion.h1>

            <motion.p
              className="text-gray-600 text-lg mb-12 leading-relaxed"
              variants={{
                hidden: { y: 30, opacity: 0 },
                visible: { y: 0, opacity: 1 },
                exit: { y: -30, opacity: 0 },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {step.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setDirection(-1);
                setCurrentStep(currentStep - 1);
              }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>
          )}

          {isLastStep ? (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? "Setting up..." : "Complete"}
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                setDirection(1);
                setCurrentStep(currentStep + 1);
              }}
            >
              Next
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Step count */}
        <p className="text-sm text-gray-400 mt-8">
          {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}
