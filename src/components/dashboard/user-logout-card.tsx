import * as React from "react";
import { User, LogOut, Settings, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";

interface UserLogoutCardProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export function UserLogoutCard({
  userName,
  userEmail,
  userAvatar,
}: UserLogoutCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Use session data if available, otherwise fall back to props
  const displayName = userName || session?.user?.name || "User";
  const displayEmail = userEmail || session?.user?.email || "";
  const displayAvatar = userAvatar || session?.user?.image;
  const handleLogout = async () => {
    try {
      await signOut();
      router.navigate({ to: "/" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSettings = () => {
    router.navigate({ to: "/dashboard/settings" });
  };

  return (
    <div className="user-logout-card">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="lg"
            className="user-logout-card__trigger data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full justify-start h-auto p-2"
          >
            <div className="user-logout-card__avatar-container">
              <Avatar className="user-logout-card__avatar h-8 w-8 rounded-lg">
                <AvatarImage
                  src={displayAvatar}
                  alt={displayName}
                  className="user-logout-card__avatar-image"
                />
                <AvatarFallback className="user-logout-card__avatar-fallback rounded-lg">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="user-logout-card__info grid flex-1 text-left text-sm leading-tight">
              <span className="user-logout-card__name truncate font-semibold">{displayName}</span>
              <span className="user-logout-card__email truncate text-xs">{displayEmail}</span>
            </div>
            <ChevronsUpDown className="user-logout-card__chevron ml-auto size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="user-logout-card__dropdown w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="user-logout-card__dropdown-label p-0 font-normal">
            <div className="user-logout-card__dropdown-header flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="user-logout-card__dropdown-avatar h-8 w-8 rounded-lg">
                <AvatarImage
                  src={displayAvatar}
                  alt={displayName}
                  className="user-logout-card__dropdown-avatar-image"
                />
                <AvatarFallback className="user-logout-card__dropdown-avatar-fallback rounded-lg">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="user-logout-card__dropdown-info grid flex-1 text-left text-sm leading-tight">
                <span className="user-logout-card__dropdown-name truncate font-semibold">
                  {displayName}
                </span>
                <span className="user-logout-card__dropdown-email truncate text-xs">
                  {displayEmail}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="user-logout-card__separator" />
          <DropdownMenuItem onClick={handleSettings} className="user-logout-card__settings-item">
            <Settings className="user-logout-card__settings-icon" />
            <span className="user-logout-card__settings-text">Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="user-logout-card__separator" />
          <DropdownMenuItem onClick={handleLogout} className="user-logout-card__logout-item">
            <LogOut className="user-logout-card__logout-icon" />
            <span className="user-logout-card__logout-text">Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
