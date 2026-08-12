"use client";
import React from "react";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";

import {
    Sidebar as ShadcnSidebar,
    SidebarContent as ShadcnSidebarContent,
    SidebarFooter as ShadcnSidebarFooter,
    SidebarHeader as ShadcnSidebarHeader,
    SidebarRail as ShadcnSidebarRail,
    useSidebar as useShadcnSidebar,
} from "@/components/ui/sidebar.tsx";

import { cn } from "@/lib/utils.ts";
import {
  useLink,
  useMenu,
  useRefineOptions,
  type TreeMenuItem,
} from "@refinedev/core";
import { ChevronRight, ListIcon, PanelLeft, Search, User, X } from "lucide-react";
import { useKBar } from "kbar";
import { UserInfo } from "./user-info";
import { UserAvatar } from "./user-avatar";
import { Link } from "react-router";

// Purely presentational grouping — doesn't touch Refine's resource tree, so
// routing/breadcrumbs/kbar actions are unaffected. Items not listed here
// (e.g. a future resource nobody's grouped yet) fall through to a trailing
// ungrouped section rather than silently disappearing.
const SIDEBAR_GROUPS: { label: string; items: string[] }[] = [
    { label: "Overview", items: ["dashboard"] },
    { label: "Academics", items: ["subjects", "classes", "grades"] },
    { label: "Operations", items: ["attendance", "assignments", "announcements", "calendar"] },
    { label: "Communication", items: ["messages"] },
];

function groupMenuItems(menuItems: TreeMenuItem[]) {
    const byName = new Map(menuItems.map((item) => [item.name, item]));
    const used = new Set<string>();

    const groups = SIDEBAR_GROUPS.map(({ label, items }) => ({
        label,
        items: items.map((name) => byName.get(name)).filter((x): x is TreeMenuItem => !!x),
    })).filter((g) => g.items.length > 0);

    groups.forEach((g) => g.items.forEach((item) => used.add(item.name)));

    const remaining = menuItems.filter((item) => !used.has(item.name));
    if (remaining.length > 0) groups.push({ label: "", items: remaining });

    return groups;
}


export function Sidebar() {
    const { open } = useShadcnSidebar();
    const { menuItems, selectedKey } = useMenu();
    const groupedItems = groupMenuItems(menuItems as TreeMenuItem[]);

  return (
      <ShadcnSidebar
          collapsible="icon"
          className={cn("border-none", "print:hidden")}

      >
      <ShadcnSidebarRail />
      <SidebarHeader />
      <SidebarSearch />
      <ShadcnSidebarContent
        className={cn(
          "transition-discrete",
          "duration-200",
          "flex",
          "flex-col",
          "gap-1",
          "pt-1",
          "pb-2",
          "border-r",
          "border-border",
          {
            "px-3": open,
            "px-1": !open,
          }
        )}
      >
        {groupedItems.map((group, groupIndex) => (
          <div
            key={group.label || `ungrouped-${groupIndex}`}
            className={cn("flex flex-col gap-1", {
              "border-t border-sidebar-border pt-3 mt-2": groupIndex > 0,
            })}
          >
            {group.label && (
              <span
                className={cn(
                  "ml-3 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80 transition-all duration-200",
                  {
                    "mb-1 h-auto opacity-100": open,
                    "h-0 opacity-0 pointer-events-none overflow-hidden": !open,
                  }
                )}
              >
                {group.label}
              </span>
            )}
            {group.items.map((item: TreeMenuItem) => (
              <SidebarItem
                key={item.key || item.name}
                item={item}
                selectedKey={selectedKey}
              />
            ))}
          </div>
        ))}

      </ShadcnSidebarContent>
          <ShadcnSidebarFooter
              className={cn(
                  "border-t",
                  "border-border",
                  "p-3",
                  "flex",
                  "flex-col",
                  "gap-2"
              )}
          >
              <Link
                  to="/profile"
                  aria-label="Profile & Settings"
                  className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  )}
              >
                  <User className="h-4 w-4 shrink-0" />
                  <span className={cn("transition-all duration-200", { "opacity-0 w-0 overflow-hidden": !open, "opacity-100": open })}>
                      Profile & Settings
                  </span>
              </Link>
              <div className="flex items-center justify-between">
                  <UserInfo />
                  <UserAvatar />
              </div>
          </ShadcnSidebarFooter>
    </ShadcnSidebar>
  );
}

type MenuItemProps = {
  item: TreeMenuItem;
  selectedKey?: string;
};

function SidebarItem({ item, selectedKey }: MenuItemProps) {
  const { open } = useShadcnSidebar();

  if (item.meta?.group) {
    return <SidebarItemGroup item={item} selectedKey={selectedKey} />;
  }

  if (item.children && item.children.length > 0) {
    if (open) {
      return <SidebarItemCollapsible item={item} selectedKey={selectedKey} />;
    }
    return <SidebarItemDropdown item={item} selectedKey={selectedKey} />;
  }

  return <SidebarItemLink item={item} selectedKey={selectedKey} />;
}

function SidebarItemGroup({ item, selectedKey }: MenuItemProps) {
  const { children } = item;
  const { open } = useShadcnSidebar();

  return (
    <div className={cn("border-t", "border-sidebar-border", "pt-4")}>
      <span
        className={cn(
          "ml-3",
          "block",
          "text-xs",
          "font-semibold",
          "uppercase",
          "text-muted-foreground",
          "transition-all",
          "duration-200",
          {
            "h-8": open,
            "h-0": !open,
            "opacity-0": !open,
            "opacity-100": open,
            "pointer-events-none": !open,
            "pointer-events-auto": open,
          }
        )}
      >
        {getDisplayName(item)}
      </span>
      {children && children.length > 0 && (
        <div className={cn("flex", "flex-col")}>
          {children.map((child: TreeMenuItem) => (
            <SidebarItem
              key={child.key || child.name}
              item={child}
              selectedKey={selectedKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarItemCollapsible({ item, selectedKey }: MenuItemProps) {
  const { name, children } = item;

  const chevronIcon = (
    <ChevronRight
      className={cn(
        "h-4",
        "w-4",
        "shrink-0",
        "text-muted-foreground",
        "transition-transform",
        "duration-200",
        "group-data-[state=open]:rotate-90"
      )}
    />
  );

  return (
    <Collapsible key={`collapsible-${name}`} className={cn("w-full", "group")}>
      <CollapsibleTrigger asChild>
        <SidebarButton item={item} rightIcon={chevronIcon} />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("ml-6", "flex", "flex-col", "gap-2")}>
        {children?.map((child: TreeMenuItem) => (
          <SidebarItem
            key={child.key || child.name}
            item={child}
            selectedKey={selectedKey}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarItemDropdown({ item, selectedKey }: MenuItemProps) {
  const { children } = item;
  const Link = useLink();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarButton item={item} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        {children?.map((child: TreeMenuItem) => {
          const { key: childKey } = child;
          const isSelected = childKey === selectedKey;

          return (
            <DropdownMenuItem key={childKey || child.name} asChild>
              <Link
                to={child.route || ""}
                className={cn("flex w-full items-center gap-2", {
                  "bg-accent text-accent-foreground": isSelected,
                })}
              >
                <ItemIcon
                  icon={child.meta?.icon ?? child.icon}
                  isSelected={isSelected}
                />
                <span>{getDisplayName(child)}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarItemLink({ item, selectedKey }: MenuItemProps) {
  const isSelected = item.key === selectedKey;

  return <SidebarButton item={item} isSelected={isSelected} asLink={true} />;
}

function SidebarSearch() {
    const { query } = useKBar();
    const { open, isMobile } = useShadcnSidebar();

    if (!open) {
        return (
            <div className="border-b border-border px-1 py-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => query.toggle()}
                            aria-label="Search the project"
                            className="flex w-full items-center justify-center rounded-md py-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    {!isMobile && <TooltipContent side="right">Search (Ctrl+K)</TooltipContent>}
                </Tooltip>
            </div>
        );
    }

    return (
        <div className="border-b border-border px-3 py-2.5">
            <button
                type="button"
                onClick={() => query.toggle()}
                aria-label="Search the project"
                className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">Search anything...</span>
                <kbd className="rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                    Ctrl K
                </kbd>
            </button>
        </div>
    );
}

function SidebarHeader() {
    const { title } = useRefineOptions();
    const { open, openMobile, isMobile, setOpenMobile, toggleSidebar } =
        useShadcnSidebar();

    const [hover, setHover] = React.useState(false);

    return (
        <ShadcnSidebarHeader
            className={cn(
                "p-0",
                "h-16",
                "border-b",
                "border-border",
                "flex-row",
                "items-center",
                "justify-between",
                "overflow-hidden"
            )}
        >
            <div
                className={cn(
                    "whitespace-nowrap",
                    "flex",
                    "flex-row",
                    "h-full",
                    "items-center",
                    "justify-start",
                    "gap-2",
                    "transition-discrete",
                    "duration-200",
                    {
                        "pl-3": !open,
                        "pl-5": open,
                    }
                )}
            >

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            onMouseEnter={() => {
                                if (!isMobile && !open) {
                                    setHover(true);
                                }
                            }}
                            onMouseLeave={() => {
                                if (!isMobile && !open) {
                                    setHover(false);
                                }
                            }}
                            onClick={() => toggleSidebar()}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm [&>svg]:h-4 [&>svg]:w-4"
                        >
                            {!isMobile && hover && !open ? (
                                <PanelLeft />
                            ) : (
                                title.icon
                            )}
                        </div>
                    </TooltipTrigger>

                    {!isMobile && !open && (
                        <TooltipContent side="right">
                            Open sidebar
                        </TooltipContent>
                    )}
                </Tooltip>


                <h2
                    className={cn(
                        "font-display bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-base font-extrabold tracking-tight text-transparent",
                        "transition-opacity",
                        "duration-200",
                        {
                            "opacity-0": !open && !openMobile,
                            "opacity-100": open || openMobile,
                        }
                    )}
                >
                    {title.text}
                </h2>

            </div>


            {isMobile && (
                <button
                    type="button"
                    onClick={() => setOpenMobile(false)}
                    aria-label="Close sidebar"
                    className={cn(
                        "group mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        "border border-sidebar-border bg-sidebar-accent/40 text-muted-foreground shadow-sm",
                        "transition-all duration-200 ease-out",
                        "hover:border-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground hover:shadow-md",
                        "active:scale-90",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                >
                    <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" strokeWidth={2.5} />
                </button>
            )}

        </ShadcnSidebarHeader>
    );
}

function getDisplayName(item: TreeMenuItem) {
  return item.meta?.label ?? item.label ?? item.name;
}

type IconProps = {
  icon: React.ReactNode;
  isSelected?: boolean;
  isHovered?: boolean;
};

function ItemIcon({ icon, isSelected, isHovered }: IconProps) {
  return (
    <div
      className={cn(
        // Driven by `isHovered`, which each SidebarButton tracks in its own
        // local state from its own onMouseEnter/onMouseLeave — not CSS
        // group-hover. Keeping this per-instance-React-state rather than a
        // shared `.group` class name guarantees hovering one item can never
        // visually affect any other item's icon, no matter how Tailwind's
        // selector engine happens to scope a repeated class name.
        "w-4 origin-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:transition-all [&>svg]:duration-300",
        {
          "text-muted-foreground": !isSelected,
          "text-sidebar-primary-foreground": isSelected,
          "-translate-y-0.5 scale-125 -rotate-12 [&>svg]:fill-current/25": isHovered,
        }
      )}
    >
      {icon ?? <ListIcon />}
    </div>
  );
}

type SidebarButtonProps = React.ComponentProps<typeof Button> & {
  item: TreeMenuItem;
  isSelected?: boolean;
  rightIcon?: React.ReactNode;
  asLink?: boolean;
  onClick?: () => void;
};

function SidebarButton({
   item,
   isSelected = false,
   rightIcon,
   asLink = false,
   className,
   onClick,
   ...props
}: SidebarButtonProps) {
    const Link = useLink();
    const { open } = useShadcnSidebar();
    const [isHovered, setIsHovered] = React.useState(false);

    const buttonContent = (
        <>
            <ItemIcon
                icon={item.meta?.icon ?? item.icon}
                isSelected={isSelected}
                isHovered={isHovered}
            />

            <span
                className={cn("tracking-[-0.00875rem]", {
                    "flex-1": rightIcon,
                    "text-left": rightIcon,
                    "line-clamp-1": !rightIcon,
                    truncate: !rightIcon,
                    "font-normal": !isSelected,
                    "font-semibold": isSelected,
                    "text-sidebar-primary-foreground": isSelected,
                    "text-foreground": !isSelected,
                })}
            >
        {getDisplayName(item)}
      </span>

            {rightIcon}
        </>
    );


    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>

                    <Button
                        asChild={!!(asLink && item.route)}
                        variant="ghost"
                        size="lg"
                        aria-label={getDisplayName(item)}
                        className={cn(
                            "flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm",
                            {
                                "bg-sidebar-primary": isSelected,
                                "hover:!bg-sidebar-primary/90": isSelected,
                                "text-sidebar-primary-foreground": isSelected,
                                "hover:text-sidebar-primary-foreground": isSelected,
                            },
                            className
                        )}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        {...props}
                    >

                        {asLink && item.route ? (

                            <Link
                                to={item.route}
                                className="flex w-full items-center gap-2"
                            >
                                {buttonContent}
                            </Link>

                        ) : (

                            buttonContent

                        )}

                    </Button>

                </TooltipTrigger>


                {!open && (
                    <TooltipContent side="right">
                        {getDisplayName(item)}
                    </TooltipContent>
                )}


            </Tooltip>
        </TooltipProvider>
    );
}

Sidebar.displayName = "Sidebar";
