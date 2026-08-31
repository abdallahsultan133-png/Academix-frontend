"use client";

import * as React from "react";

import {
  useGetIdentity,
  useLink,
  useRefineOptions,
} from "@refinedev/core";
import { useKBar } from "kbar";
import { useLocation } from "react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronsUpDown,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessagesSquare,
  PanelLeftClose,
  ScrollText,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarFooter as ShadcnSidebarFooter,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarRail as ShadcnSidebarRail,
  useSidebar as useShadcnSidebar,
} from "@/components/ui/sidebar.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { cn } from "@/lib/utils.ts";
import { APP_NAME, APP_TAGLINE } from "@/constants";
import { ROLE_LABEL, STAFF_ROLES, ADMIN_ROLES } from "@/lib/roles";
import { UserRole, type User } from "@/types";
import { UserAvatar } from "./user-avatar";
import { AccountMenu } from "./account-menu";

// ─────────────────────────────────────────────────────────────────────────────
// Navigation manifest
//
// An explicit, role-aware map of the *actual* routes registered in App.tsx.
// Refine's useMenu() only knows about `resources` (9 flat entries, shown to
// every role identically) — that's what made the old sidebar feel generic.
// This manifest also surfaces the real guarded routes (/users,
// /admin/departments, /admin/audit-logs, /parent, /ai-assistant) and gates each
// one with the SAME role list as its <RequireRole> wrapper. It grants nothing:
// route guards remain the single source of truth for access.
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Roles allowed to *see* the link. Omitted = every authenticated role. Mirrors the route's <RequireRole>. */
  roles?: UserRole[];
  /** Per-role label overrides — cosmetic only, the route never changes. */
  labelByRole?: Partial<Record<UserRole, string>>;
  /** Live unread counter that feeds this item's badge. */
  badge?: "messages";
  /** Exact pathname match only (Dashboard, so it isn't "active" on every route). */
  exact?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
      {
        label: "Children",
        to: "/parent",
        icon: HeartHandshake,
        roles: [UserRole.PARENT, ...ADMIN_ROLES],
      },
      { label: "Activity", to: "/activity", icon: Activity },
    ],
  },
  {
    label: "Teaching",
    items: [
      {
        label: "Classes",
        to: "/classes",
        icon: GraduationCap,
        labelByRole: {
          [UserRole.STUDENT]: "My Classes",
          [UserRole.TEACHER]: "My Classes",
        },
      },
      { label: "Subjects", to: "/subjects", icon: BookOpen },
      { label: "People", to: "/users", icon: Users, roles: ADMIN_ROLES },
      {
        label: "Departments",
        to: "/admin/departments",
        icon: Building2,
        roles: ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Assignments", to: "/assignments", icon: FileText },
      { label: "Attendance", to: "/attendance", icon: UserCheck },
      {
        label: "Grades",
        to: "/grades",
        icon: BarChart3,
        labelByRole: { [UserRole.STUDENT]: "My Grades" },
      },
      {
        label: "Insights",
        to: "/insights",
        icon: LineChart,
        roles: [UserRole.STUDENT, ...STAFF_ROLES],
      },
      { label: "Calendar", to: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone },
      { label: "Messages", to: "/messages", icon: MessagesSquare, badge: "messages" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "AI Assistant", to: "/ai-assistant", icon: Sparkles, roles: STAFF_ROLES },
      { label: "Audit Log", to: "/admin/audit-logs", icon: ScrollText, roles: ADMIN_ROLES },
    ],
  },
];

function useNavGroups(role?: UserRole): NavGroup[] {
  return React.useMemo(() => {
    return NAV.map((group) => ({
      label: group.label,
      items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
    })).filter((group) => group.items.length > 0);
  }, [role]);
}

function isRouteActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { data: identity } = useGetIdentity<User>();
  const role = identity?.role;
  const groups = useNavGroups(role);
  const { pathname } = useLocation();

  // The one badge backed by a real endpoint. Poll gently; refetch is cheap
  // ({ count } only) and mirrors the notification bell's cadence.
  const { data: unread } = useApiQuery<{ count: number }>("/messages/unread-count", {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const badges = { messages: unread?.count ?? 0 };

  return (
    <ShadcnSidebar collapsible="icon" className={cn("border-none", "print:hidden")}>
      <ShadcnSidebarRail />
      <BrandHeader />
      <SidebarSearch />

      <ShadcnSidebarContent
        className={cn(
          "flex flex-col gap-0 border-r border-sidebar-border bg-sidebar px-2.5 py-3",
          "[scrollbar-width:thin] [scrollbar-color:var(--sidebar-border)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border",
        )}
      >
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {groups.map((group, index) => (
            <NavSection key={group.label} label={group.label} first={index === 0}>
              {group.items.map((item) => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  role={role}
                  active={isRouteActive(pathname, item.to, item.exact)}
                  badge={item.badge ? badges[item.badge] : 0}
                />
              ))}
            </NavSection>
          ))}
        </nav>
      </ShadcnSidebarContent>

      <AccountFooter role={role} />
    </ShadcnSidebar>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
function NavSection({
  label,
  first,
  children,
}: {
  label: string;
  first: boolean;
  children: React.ReactNode;
}) {
  const { open, isMobile } = useShadcnSidebar();
  const showLabel = open || isMobile;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        // Horizontal rule between groups. Expanded: a hairline above the group
        // label. Collapsed: a short centred tick (a full-width rule reads as
        // noise at icon width).
        !first && showLabel && "mt-3 border-t border-sidebar-border pt-3",
        !first && !showLabel && "mt-2",
      )}
    >
      {showLabel ? (
        <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
          {label}
        </p>
      ) : (
        !first && (
          <div aria-hidden="true" className="mx-auto mb-1 h-px w-6 rounded-full bg-sidebar-border" />
        )
      )}
      <ul aria-label={label} className="flex flex-col gap-0.5">
        {children}
      </ul>
    </div>
  );
}

// ── Item ─────────────────────────────────────────────────────────────────────
function NavItemRow({
  item,
  role,
  active,
  badge,
}: {
  item: NavItem;
  role?: UserRole;
  active: boolean;
  badge: number;
}) {
  const Link = useLink();
  const { open, isMobile, setOpenMobile } = useShadcnSidebar();
  const collapsed = !open && !isMobile;
  const Icon = item.icon;
  const label = (role && item.labelByRole?.[role]) || item.label;

  const body = (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      aria-label={badge > 0 ? `${label}, ${badge} unread` : label}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
      className={cn(
        "group/nav relative flex h-9 items-center rounded-lg text-[13px] outline-none",
        "transition-[background-color,color] duration-150 ease-out",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
        collapsed ? "w-9 justify-center px-0" : "gap-3 px-2.5",
        active
          ? "bg-sidebar-accent font-medium text-foreground ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.06]"
          : "text-muted-foreground hover:bg-sidebar-accent/55 hover:text-foreground",
      )}
    >
      {/* Accent indicator — high-contrast, monochrome, sits on the sidebar edge */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute rounded-full bg-foreground transition-all duration-200 ease-out",
          collapsed
            ? "left-0 top-1/2 h-4 -translate-y-1/2"
            : "-left-2.5 top-1/2 h-5 -translate-y-1/2",
          active ? "w-[3px] opacity-100" : "w-[3px] opacity-0",
        )}
      />

      <Icon
        className={cn(
          "h-[17px] w-[17px] shrink-0 transition-colors duration-150",
          active ? "text-foreground" : "text-muted-foreground group-hover/nav:text-foreground",
        )}
        strokeWidth={active ? 2.25 : 2}
      />

      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}

      {!collapsed && badge > 0 && (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sidebar-accent px-1 text-[11px] font-semibold tabular-nums text-foreground ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {collapsed && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-foreground ring-2 ring-sidebar"
        />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>{body}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {label}
            {badge > 0 && (
              <span className="rounded bg-primary-foreground/15 px-1 text-[10px] font-semibold tabular-nums">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{body}</li>;
}

// ── Brand ────────────────────────────────────────────────────────────────────
function BrandHeader() {
  const { title } = useRefineOptions();
  const { open, isMobile, toggleSidebar, setOpenMobile } = useShadcnSidebar();
  const expanded = open || isMobile;

  const mark = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm [&>svg]:h-[18px] [&>svg]:w-[18px]">
      {title.icon}
    </span>
  );

  return (
    <ShadcnSidebarHeader className="h-14 flex-row items-center gap-2.5 border-b border-sidebar-border bg-sidebar px-3">
      {expanded ? (
        <>
          {mark}
          <div className="min-w-0 flex-1 leading-none">
            <p className="truncate text-[13px] font-semibold tracking-tight text-sidebar-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{APP_TAGLINE}</p>
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              aria-label="Close navigation menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar (Ctrl+B)"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar (Ctrl+B)"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm outline-none transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>svg]:h-[18px] [&>svg]:w-[18px]"
            >
              {title.icon}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      )}
    </ShadcnSidebarHeader>
  );
}

// ── Search ───────────────────────────────────────────────────────────────────
function SidebarSearch() {
  const { query } = useKBar();
  const { open, isMobile } = useShadcnSidebar();
  const collapsed = !open && !isMobile;

  if (collapsed) {
    return (
      <div className="border-b border-sidebar-border bg-sidebar px-2.5 py-2">
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => query.toggle()}
              aria-label="Search (Ctrl+K)"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <Search className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Search (Ctrl+K)</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="border-b border-sidebar-border bg-sidebar px-3 py-2.5">
      <button
        type="button"
        onClick={() => query.toggle()}
        aria-label="Search"
        className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        {/* Keyboard hint is desktop-only — touch devices have no Ctrl key.
            md (768px) matches the app's mobile breakpoint (useIsMobile). */}
        <kbd className="hidden rounded border border-sidebar-border bg-sidebar px-1.5 py-px font-mono text-[10px] font-medium text-muted-foreground md:inline-block">
          Ctrl K
        </kbd>
      </button>
    </div>
  );
}

// ── Account ──────────────────────────────────────────────────────────────────
function AccountFooter({ role }: { role?: UserRole }) {
  const { open, isMobile, setOpenMobile } = useShadcnSidebar();
  const collapsed = !open && !isMobile;
  const { data: user } = useGetIdentity<User>();

  return (
    <ShadcnSidebarFooter className="border-t border-sidebar-border bg-sidebar p-2.5">
      <AccountMenu
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        contentClassName="w-[--radix-dropdown-menu-trigger-width]"
        onNavigate={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg text-left outline-none",
            "transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            "data-[state=open]:bg-sidebar-accent",
            collapsed ? "justify-center p-1" : "p-1.5",
          )}
        >
          <UserAvatar className="h-8 w-8 rounded-lg" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
                  {user?.name ?? "Account"}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {role ? ROLE_LABEL[role] : user?.email}
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </AccountMenu>
    </ShadcnSidebarFooter>
  );
}

Sidebar.displayName = "Sidebar";
