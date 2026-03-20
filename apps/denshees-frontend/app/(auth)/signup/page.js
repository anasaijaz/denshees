"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { EmailIcon } from "mage-icons-react/bulk";
import { ArrowRightIcon } from "mage-icons-react/stroke";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/auth.store";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      terms: false,
    },
  });

  const onSubmit = async (data) => {
    if (!data.terms) {
      toast("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setIsLoading(true);
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`.trim(),
          timezone: userTimeZone,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast(result.message || "Failed to create account");
        return;
      }

      setAuth({ user: result.user, token: result.token });
      router.push("/");
    } catch (error) {
      console.error("Signup error:", error);
      toast("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left section - Feature showcase */}
      <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto md:mx-0 md:ml-auto">
          <h1 className="text-4xl font-bold mb-6 tracking-tight">Denshees</h1>
          <p className="text-xl mb-8">
            Join thousands of businesses using Denshees to scale their outreach.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-black text-white p-2 mt-1">
                <EmailIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Personalized Campaigns
                </h3>
                <p className="text-gray-700">
                  Create highly personalized email sequences that convert.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-black text-white p-2 mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 6V18M6 12H18"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Scheduling</h3>
                <p className="text-gray-700">
                  Send emails at the perfect time with AI-powered scheduling.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-black text-white p-2 mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Reply Detection</h3>
                <p className="text-gray-700">
                  Automatically stop sequences when prospects respond.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-600">Already have an account?</p>
            <Link
              href="/login"
              className="inline-flex items-center mt-2 text-black border-b-2 border-black hover:bg-gray-100 transition-colors"
            >
              Sign in to your account
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right section - Authentication */}
      <div className="flex-1 bg-gray-50 p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Create your account</h2>
            <p className="text-gray-600 mb-8">
              Start your 14-day free trial, no credit card required
            </p>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    aria-invalid={errors.firstName ? "true" : "false"}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    aria-invalid={errors.lastName ? "true" : "false"}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 border-gray-300"
                  {...register("terms", {
                    required: "You must agree to the terms",
                  })}
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-700"
                >
                  I agree to the{" "}
                  <a href="#" className="text-black hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-black hover:underline">
                    Privacy Policy
                  </a>
                </label>
                {errors.terms && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.terms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
