"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "mage-icons-react/stroke";

export default function Stepper({ steps, onComplete, loading = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="w-full">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-black ${
                index <= currentStep
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              {index < currentStep ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                index + 1
              )}
            </div>
            <div
              className={`hidden sm:block text-sm font-medium ml-2 ${
                index <= currentStep ? "text-black" : "text-gray-500"
              }`}
            >
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`hidden sm:block w-12 h-1 mx-2 ${
                  index < currentStep ? "bg-black" : "bg-gray-300"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-8 min-h-[300px]">{steps[currentStep].content}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="border-black"
        >
          Previous
        </Button>
        <Button
          id="tour-stepper-next"
          onClick={handleNext}
          disabled={loading}
          className="border-black"
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
              Processing...
            </div>
          ) : isLastStep ? (
            "Complete"
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}
