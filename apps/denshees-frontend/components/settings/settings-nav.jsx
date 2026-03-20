"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Email Settings", href: "/settings" },
    { name: "Account", href: "/settings/account" },
    { name: "Billing", href: "/settings/billing" },

    // { name: "Preferences", href: "/settings/preferences" },
    // { name: "API Keys", href: "/settings/api-keys" },
    // { name: "Billing", href: "/settings/billing" },
  ];

  return (
    <div className="border border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block p-2 transition-colors",
                isActive ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
