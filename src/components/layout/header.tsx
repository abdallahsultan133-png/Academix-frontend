import { UserAvatar } from "@/components/layout/user-avatar.tsx";
import { NotificationsBell } from "@/components/layout/notifications-bell.tsx";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  useActiveAuthProvider,
  useLogout,
  useRefineOptions,
} from "@refinedev/core";
import { Link } from "react-router";
import { LogOutIcon, UserIcon } from "lucide-react";

export const Header = () => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-end",
        "z-40"
      )}
    >
      <ThemeToggle />
      <NotificationsBell />
      <UserDropdown />
    </header>
  );
}

function MobileHeader() {
    const { open } = useSidebar();
    const { title } = useRefineOptions();

    return (
        <header
            className={cn(
                "sticky",
                "top-0",
                "flex",
                "h-12",
                "shrink-0",
                "items-center",
                "gap-2",
                "border-b",
                "border-border",
                "bg-sidebar",
                "pr-3",
                "justify-between",
                "z-40"
            )}
        >

            <SidebarTrigger
                className={cn(
                    "text-muted-foreground",
                    "rotate-180",
                    "ml-1",
                    "rounded-md",
                    "transition-all",
                    "duration-200",
                    "hover:bg-black/10",
                    "dark:hover:bg-white/10"
                )}
            />


            {/* Show title only when mobile sidebar is open */}
            <div
                className={cn(
                    "flex",
                    "items-center",
                    "gap-2",
                    "transition-opacity",
                    "duration-200",
                    {
                        "opacity-100": open,
                        "opacity-0": !open,
                    }
                )}
            >
                <h2 className="font-display bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-sm font-extrabold tracking-tight text-transparent">
                    {title.text}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle className={cn("h-8", "w-8")} />
                <NotificationsBell />
                <UserDropdown />
            </div>


        </header>
    );
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open account menu">
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
            <UserIcon className="h-4 w-4" />
            Profile & Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
          }}
        >
          <LogOutIcon
            className={cn("text-destructive", "hover:text-destructive")}
          />
          <span className={cn("text-destructive", "hover:text-destructive")}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";
