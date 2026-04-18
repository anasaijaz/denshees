"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, CancelIcon } from "mage-icons-react/stroke";
import { KeyIcon } from "mage-icons-react/bulk";
import blogImage from "@/assets/screenshots/app-password-blog.webp";

export default function AppPasswordModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black p-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-black p-1.5">
              <KeyIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold">Set Up Your App Password</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 border border-transparent hover:border-black transition-colors"
          >
            <CancelIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Blog cover image */}
        <div className="w-full aspect-video relative border-b-2 border-black overflow-hidden">
          <Image
            src={blogImage}
            alt="How to create a Google App Password"
            fill
            className="object-cover"
          />
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            Before you start sending, connect an email account using a{" "}
            <strong>Google App Password</strong>. It&apos;s a one-time setup that
            lets Denshees send emails securely from your own inbox.
          </p>
          <p className="text-sm text-gray-500">
            Read our step-by-step guide to set it up in under 2 minutes.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-4 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} className="border-black">
            Skip for now
          </Button>
          <a
            href="https://webease.tech/blogs/here-s-how-to-create-google-app-password"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2">
              Read the guide
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
