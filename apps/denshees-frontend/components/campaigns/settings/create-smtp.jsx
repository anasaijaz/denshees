"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { post } from "@/lib/apis";
import { EmailIcon } from "mage-icons-react/bulk";
import { ChevronLeftIcon } from "mage-icons-react/stroke";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import GmailSVG from "@/assets/emails/gmail.svg";
import GodaddySVG from "@/assets/emails/godaddy.svg";
import SESSVG from "@/assets/emails/ses.svg";
import SendGridSVG from "@/assets/emails/sendgrid.svg";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const EmailLogo = ({ src, alt = "Email Logo" }) => {
  return (
    <div className="flex items-center justify-center w-14 h-14 rounded-full overflow-hidden bg-gray-100">
      <Image src={src || "/placeholder.svg"} alt={alt} width={40} height={40} />
    </div>
  );
};

// Component to select provider
const ProviderSelection = ({ onSelect }) => {
  const providers = [
    {
      name: "Gmail",
      logo: <EmailLogo src={GmailSVG} />,
      defaults: {
        host: "smtp.gmail.com",
        port: 465,
        imap_host: "imap.gmail.com",
        secure: true,
      },
    },
    {
      name: "SendGrid",
      logo: <EmailLogo src={SendGridSVG} />,
      defaults: {
        host: "smtp.sendgrid.net",
        port: 587,
        imap_host: "imap.sendgrid.net",
        secure: true,
      },
    },
    {
      name: "SES",
      logo: <EmailLogo src={SESSVG} />,
      defaults: {
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 587,
        imap_host: "email-imap.us-east-1.amazonaws.com",
        secure: true,
      },
    },
    {
      name: "Godaddy",
      logo: <EmailLogo src={GodaddySVG} />,
      defaults: {
        host: "smtp.secureserver.net",
        port: 465,
        imap_host: "imap.secureserver.net",
        secure: true,
      },
    },
    {
      name: "Custom",
      logo: (
        <div className="flex items-center justify-center w-14 h-14 rounded-full overflow-hidden bg-gray-100">
          <EmailIcon />
        </div>
      ),
      defaults: {
        host: "",
        port: 587,
        imap_host: "",
        secure: false,
      },
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-8">
      {providers.map((provider) => (
        <div
          key={provider.name}
          onClick={() => onSelect(provider)}
          className="flex flex-col items-center cursor-pointer"
        >
          {provider.logo}
          <p>{provider.name}</p>
        </div>
      ))}
    </div>
  );
};

// Component for loading spinner
const LoadingSpinner = () => (
  <div role="status">
    <svg
      aria-hidden="true"
      className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
    <span className="sr-only">Loading...</span>
  </div>
);

// Component for email credential form
const EmailCredentialForm = ({
  provider,
  onSubmit,
  loading,
  setSelectedProvider,
}) => {
  const [isCustomIMAP, setIsCustomIMAP] = useState(false);

  const { host, port, imap_host, secure } = provider.defaults;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center justify-start gap-4 pb-4">
        <ChevronLeftIcon
          className="w-8 h-8 p-1 rounded-full cursor-pointer hover:bg-neutral-200"
          onClick={() => setSelectedProvider(null)}
        />
        <p className="text-sm ">
          Setting up <u>{provider.name}</u> account
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input name="email" placeholder="test@gmail.com" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>
                {provider.name === "Gmail" ? "App password" : "Password"}
              </Label>
              {provider.name === "Gmail" && (
                <Link
                  href={
                    "https://webease.tech/blogs/here-s-how-to-create-google-app-password"
                  }
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  How to create App Password
                </Link>
              )}
            </div>
            <Input
              name="password"
              placeholder={
                provider.name === "Gmail" ? "app-paasword" : "password"
              }
            />
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Host</Label>
            <Input
              name="host"
              defaultValue={host}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <Label>Port</Label>
            <Input
              name="port"
              type="number"
              defaultValue={port}
              placeholder="587"
            />
          </div>
          <div>
            <Label>Imap Host</Label>
            <Input
              name="imap_host"
              type="text"
              defaultValue={imap_host}
              placeholder="imap.google.com"
            />
          </div>
          <div className=" flex items-center gap-2">
            <input type="checkbox" name="secure" defaultChecked={secure} />
            <Label>Secure Connection (SSL/TLS)</Label>
          </div>
        </div>

        {/* Custom IMAP Settings */}
        <div className="flex items-start gap-2 mt-4">
          <input
            type="checkbox"
            checked={isCustomIMAP}
            onChange={() => setIsCustomIMAP(!isCustomIMAP)}
          />
          <Label>I have different IMAP settings</Label>
        </div>
        {isCustomIMAP && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>IMAP Email</Label>
              <Input name="imapEmail" placeholder="imap-email" />
            </div>
            <div>
              <Label>IMAP Password</Label>
              <Input name="imapPassword" placeholder="imap-password" />
            </div>
          </div>
        )}

        <Button type="submit" className="flex items-center gap-2 mt-4">
          {loading && <LoadingSpinner />}
          Setup New Account
        </Button>
      </div>
    </form>
  );
};

const CreateSMTP = () => {
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const { trigger } = useSWRMutation("/api/imap/create", post, {
    onSuccess: () => {
      toast("Email Created");
      mutate("/api/google_apps");
    },
    onError: () => {
      toast("Invalid credentials");
    },
  });

  const handleCreateEmailCredentials = async (event) => {
    event.preventDefault();
    setLoading(true);

    const {
      email,
      password,
      imapEmail,
      imapPassword,
      port,
      host,
      secure,
      imap_host,
    } = event.target.elements;
    const values = {
      username: email.value,
      password: password.value,
      imapEmail: imapEmail?.value || email.value,
      imapPassword: imapPassword?.value || password.value,
      port: Number.parseInt(port.value),
      host: host.value,
      secure: secure.checked,
      imap_host: imap_host.value,
    };

    const credentials = z.object({
      username: z.string().min(4),
      password: z.string().min(4),
      host: z.string().min(1),
      port: z.number().min(1),
      secure: z.boolean(),
    });

    try {
      credentials.parse(values);
      await trigger(values);
      email.value = "";
      password.value = "";
      if (imapEmail && imapPassword) {
        imapEmail.value = "";
        imapPassword.value = "";
      }
    } catch (error) {
      console.log({ error });
      // toast("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {selectedProvider ? (
          <motion.div
            key="email-credential-form"
            initial={{ x: "-20%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-20%", opacity: 0 }}
            transition={{
              type: "tween",
              duration: 0.5,
              ease: "circInOut",
            }}
          >
            <EmailCredentialForm
              provider={selectedProvider}
              onSubmit={handleCreateEmailCredentials}
              loading={loading}
              setSelectedProvider={setSelectedProvider}
            />
          </motion.div>
        ) : (
          <motion.div
            key="provider-selection"
            initial={{ x: "50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "50%", opacity: 0 }}
            transition={{
              type: "tween",
              duration: 0.5,
              ease: "circInOut",
            }}
          >
            <ProviderSelection onSelect={setSelectedProvider} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateSMTP;
