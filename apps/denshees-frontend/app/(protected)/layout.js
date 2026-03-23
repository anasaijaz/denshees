"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import AgentChat from "@/components/agent-chat";
import useAuthStore from "@/store/auth.store";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !user)) {
      clearAuth();
      router.push("/login");
    } else if (mounted && isAuthenticated && user && !user.isSetup) {
      router.push("/onboarding");
    }
  }, [mounted, isAuthenticated, user, clearAuth, router]);

  if (!mounted || !isAuthenticated || !user || !user.isSetup) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 relative overflow-hidden">
        <Sidebar onWidthChange={setSidebarWidth} />
        <main
          className="absolute top-0 right-0 h-full overflow-y-auto bg-gray-50 p-4 md:p-6 pb-20 md:pb-6 transition-all duration-300"
          style={{
            width:
              sidebarWidth === 0 ? "100%" : `calc(100% - ${sidebarWidth}px)`,
            left: sidebarWidth === 0 ? "0" : `${sidebarWidth}px`,
          }}
        >
          {children}
        </main>
      </div>
      <AgentChat />
    </div>
  );
}
