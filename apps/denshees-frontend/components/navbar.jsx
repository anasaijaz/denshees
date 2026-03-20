"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SettingsIcon, UserIcon } from "mage-icons-react/bulk";
import { LogoutIcon } from "mage-icons-react/stroke";
import useAuthStore from "@/store/auth.store";
import { CreditsDisplay } from "@/components/credits-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import densheesPNG from "@/assets/logos/denshees.png";

export function Navbar() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  console.log(user);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <header className="border-b border-black bg-white">
      <div className="flex h-12 md:h-16 items-center justify-between px-3 md:px-6">
        <Link href="/" className="hidden md:flex items-center">
          <Image
            src={densheesPNG}
            alt="Denshees Logo"
            width={80}
            height={80}
            className="mr-2"
          />
        </Link>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <CreditsDisplay user={user} />

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 border border-black flex items-center justify-center bg-gray-100">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar || "/placeholder.svg"}
                      alt="User avatar"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 border-b border-gray-200">
                  <p className="font-medium">{user?.name || "User"}</p>
                  <p className="text-sm text-gray-600 truncate">
                    {user?.email || ""}
                  </p>
                </div>

                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogoutIcon className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
