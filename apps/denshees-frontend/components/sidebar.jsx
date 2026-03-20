"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  EmailIcon,
  ChecklistNoteIcon,
  SettingsIcon,
  QuestionMarkCircleIcon,
  MessageSquareIcon,
} from "mage-icons-react/bulk";
import { ChevronLeftIcon, ChevronRightIcon } from "mage-icons-react/stroke";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/auth.store";

const sidebarLinks = [
  {
    label: "Dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
  },
  {
    label: "Campaigns",
    icon: EmailIcon,
    href: "/campaigns",
  },
  {
    label: "Lists",
    icon: ChecklistNoteIcon,
    href: "/lists",
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    href: "/settings",
  },
];

const supportLinks = [
  {
    label: "Support",
    icon: QuestionMarkCircleIcon,
    href: "mailto:anaz.aijaz@gmail.com",
  },
  {
    label: "Contact",
    icon: MessageSquareIcon,
    href: "mailto:anaz.aijaz@gmail.com",
  },
];

export function Sidebar({ onWidthChange }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update parent component when width changes
  useEffect(() => {
    if (isMobile) {
      onWidthChange?.(0);
    } else {
      const width = collapsed ? 70 : 240;
      onWidthChange?.(width);
    }
  }, [collapsed, isMobile, onWidthChange]);

  // Check if a link is active based on the current pathname
  const isActive = (href) => {
    // Exact match for dashboard
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    // For other routes, check if pathname starts with the href (for nested routes)
    return href !== "/dashboard" && pathname.startsWith(href);
  };

  // Mobile bottom bar
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black">
        <nav className="flex items-center justify-between">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center py-4 px-3 text-xs transition-colors  min-w-[60px]",
                isActive(link.href)
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <link.icon className="w-5 h-5 mb-1" />
              <span>{link.label}</span>
            </Link>
          ))}
          {supportLinks.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 text-xs transition-colors rounded-lg min-w-[60px]",
                isActive(link.href)
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <link.icon className="w-5 h-5 mb-1" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full flex-col border-r border-black bg-white transition-all duration-300 overflow-hidden hidden md:flex",
        collapsed ? "w-[70px]" : "w-[240px]",
      )}
    >
      <div className="flex flex-col flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between mb-4 px-4">
          {!collapsed && (
            <h2 className="text-sm font-bold truncate">
              Welcome, {user?.name?.split(" ")[0] || "User"}
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </Button>
        </div>

        <nav>
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center py-3 px-4 text-sm group transition-colors whitespace-nowrap",
                isActive(link.href)
                  ? "bg-black text-white"
                  : "hover:bg-gray-100",
              )}
            >
              <link.icon
                className={cn("w-5 h-5 shrink-0", collapsed ? "mr-0" : "mr-3")}
              />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <div>
            {supportLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center py-3 px-4 text-sm group transition-colors whitespace-nowrap",
                  isActive(link.href)
                    ? "bg-black text-white"
                    : "hover:bg-gray-100",
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    collapsed ? "mr-0" : "mr-3",
                  )}
                />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
