"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveFloppyIcon, UserIcon } from "mage-icons-react/bulk";
import { ReloadIcon } from "mage-icons-react/stroke";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";
import { patch } from "@/lib/apis";
import { toast } from "sonner";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function AccountSettingsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <SettingsNav />
        </div>

        <div className="md:col-span-3">
          <AccountSettings />
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      username: "",
    },
  });

  // Fetch user account data
  const {
    data: userData,
    isLoading,
    error,
    mutate: refreshUserData,
  } = useSWR("/api/account", fetcher);

  // Setup mutation for updating user account
  const { trigger: updateAccount, isMutating: isUpdating } = useSWRMutation(
    "/api/account",
    patch,
    {
      onSuccess: () => {
        toast.success("Account updated successfully");
        refreshUserData();
      },
      onError: (error) => {
        toast.error("Failed to update account");
        console.error("Update error:", error);
      },
    },
  );

  // Update form data when user data is loaded
  useEffect(() => {
    if (userData) {
      setValue("name", userData.name || "");
      setValue("username", userData.username || "");
    }
  }, [userData, setValue]);

  const onSubmit = async (data) => {
    try {
      await updateAccount({
        name: data.name,
        username: data.username,
      });
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center items-center h-40">
          <ReloadIcon className="h-8 w-8 animate-spin" />
          <p className="ml-2 text-lg">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col justify-center items-center h-40">
          <p className="text-lg text-red-600">
            Failed to load account information
          </p>
          <Button onClick={() => refreshUserData()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="account-settings" className="space-y-6">
      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Account Information</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-black">
                {userData?.avatar ? (
                  <img
                    src={userData.avatar || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <Button
                type="button"
                size="sm"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                onClick={() =>
                  toast.info("Profile picture upload not implemented")
                }
              >
                +
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username", { required: "Username is required" })}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-red-500 text-sm">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isUpdating}
              className="flex items-center"
            >
              {isUpdating ? (
                <>
                  <ReloadIcon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveFloppyIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Account Details</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userData?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account Created</p>
              <p className="font-medium">
                {userData?.created
                  ? new Date(userData.created).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
