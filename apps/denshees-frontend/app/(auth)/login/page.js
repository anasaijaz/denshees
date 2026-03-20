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

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast(result.message || "Invalid email or password");
        return;
      }

      setAuth({ user: result.user, token: result.token });
      router.push(result.user.isSetup ? "/" : "/onboarding");
    } catch (error) {
      console.error("Login error:", error);
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
            Streamline your email outreach campaigns with precision and
            efficiency.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-black text-white p-2 mt-1">
                <EmailIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Automated Follow-ups</h3>
                <p className="text-gray-700">
                  Schedule and send personalized follow-up emails automatically.
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
                <h3 className="font-semibold text-lg">Campaign Analytics</h3>
                <p className="text-gray-700">
                  Track open rates, responses, and campaign performance in
                  real-time.
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
                <h3 className="font-semibold text-lg">Email Verification</h3>
                <p className="text-gray-700">
                  Ensure deliverability with built-in email verification tools.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-600">
              Don&#39;t have an account yet?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center mt-2 text-black border-b-2 border-black hover:bg-gray-100 transition-colors"
            >
              Create an account
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right section - Authentication */}
      <div className="flex-1 bg-gray-50 p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-8">
              Sign in to your account to continue
            </p>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
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

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
