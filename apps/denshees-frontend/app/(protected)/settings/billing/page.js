"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CreditCardIcon, ZapIcon, EmailIcon } from "mage-icons-react/bulk";
import { ReloadIcon } from "mage-icons-react/stroke";
import { SettingsNav } from "@/components/settings/settings-nav";
import { CreditsDisplay } from "@/components/credits-display";
import useAuthStore from "@/store/auth.store";
import useSWRMutation from "swr/mutation";
import { post } from "@/lib/apis";
import { toast } from "sonner";

export default function BillingSettingsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <SettingsNav />
        </div>

        <div className="md:col-span-3">
          <BillingSettings />
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  const { user } = useAuthStore();
  const [emailCredits, setEmailCredits] = useState([100]);
  const [aiCredits, setAiCredits] = useState([50]);

  const emailCreditPrice = 0.1; // $0.1 per email credit
  const aiCreditPrice = 0.1; // $0.1 per AI credit

  const emailCreditCost = emailCredits[0] * emailCreditPrice;
  const aiCreditCost = aiCredits[0] * aiCreditPrice;

  const currentEmailCredits = user?.credits || 0;
  const currentAiCredits = user?.ai_credits || 0;

  // SWR mutation for creating payments
  const { trigger: createPayment, isMutating: isProcessingPayment } =
    useSWRMutation("/api/payments/create", post, {
      onSuccess: (data) => {
        toast.success("Redirecting to payment page...");
        console.log("Payment created:", data);

        // Redirect to payment link if provided
        if (data.payment_link) {
          window.location.href = data.payment_link;
        }
      },
      onError: (error) => {
        console.error("Payment error:", error);
        toast.error("Failed to initiate payment. Please try again.");
      },
    });

  const handleBuyCredits = async (creditType, quantity) => {
    try {
      const paymentData = {
        creditType: creditType, // 'email' or 'ai'
        quantity: quantity,
        userInfo: {
          customer_id: user?.id || user?.email,
          email: user?.email,
          id: user?.id,
          name: user?.name || "User",
          city: "Unknown", // You can collect this from user or use a default
          country: "US", // You can collect this from user or use a default
          state: "Unknown", // You can collect this from user or use a default
          street: "Unknown", // You can collect this from user or use a default
          zipcode: "00000", // You can collect this from user or use a default
        },
      };

      await createPayment(paymentData);
    } catch (error) {
      console.error("Error initiating payment:", error);
    }
  };

  return (
    <div id="billing-settings" className="space-y-6">
      {/* Current Credits Display */}
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Current Credits</h2>
        <CreditsDisplay user={user} />
      </div>

      {/* Credit Pricing Calculator */}
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Purchase Credits</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Credits */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <EmailIcon className="h-5 w-5" />
              Email Credits
            </h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Number of Credits</Label>
                  <Badge variant="outline" className="font-mono">
                    {emailCredits[0]} credits
                  </Badge>
                </div>
                <Slider
                  value={emailCredits}
                  onValueChange={setEmailCredits}
                  max={1000}
                  min={10}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>10 credits</span>
                  <span>1000 credits</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Price per credit:</span>
                  <span className="font-mono">
                    ${emailCreditPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Cost:</span>
                  <span className="font-mono text-green-600">
                    ${emailCreditCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => handleBuyCredits("email", emailCredits[0])}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <ReloadIcon className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Buy {emailCredits[0]} Email Credits
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Credits */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ZapIcon className="h-5 w-5" />
              AI Credits
            </h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Number of Credits</Label>
                  <Badge variant="outline" className="font-mono">
                    {aiCredits[0]} credits
                  </Badge>
                </div>
                <Slider
                  value={aiCredits}
                  onValueChange={setAiCredits}
                  max={500}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>5 credits</span>
                  <span>500 credits</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Price per credit:</span>
                  <span className="font-mono">${aiCreditPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Cost:</span>
                  <span className="font-mono text-green-600">
                    ${aiCreditCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => handleBuyCredits("ai", aiCredits[0])}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <ReloadIcon className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Buy {aiCredits[0]} AI Credits
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Usage Information */}
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">How Credits Work</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <EmailIcon className="h-4 w-4" />
              Email Credits
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 1 credit = 1 email sent</li>
              <li>• Used for campaign emails</li>
              <li>• No expiration date</li>
              <li>• $0.10 per credit</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ZapIcon className="h-4 w-4" />
              AI Credits
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 1 credit = 1 AI personalization</li>
              <li>• Used for AI-powered content</li>
              <li>• No expiration date</li>
              <li>• $0.10 per credit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
