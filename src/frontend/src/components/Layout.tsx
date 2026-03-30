import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Bell,
  ChevronDown,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import type { Page } from "../App";
import { UserRole } from "../backend";
import type { backendInterface } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: ReactNode;
  actor: backendInterface;
  currentPage: string;
  navigate: (page: Page) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  userRole?: UserRole;
}

const baseNavItems = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "projects", label: "Projects", icon: FolderKanban },
  { name: "invoices", label: "Invoices", icon: FileText },
  { name: "clients", label: "Clients", icon: Users },
  { name: "reports", label: "Reports", icon: TrendingUp },
  { name: "settings", label: "Settings", icon: Settings },
];

function onEnter(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") fn();
  };
}

export default function Layout({
  children,
  actor,
  currentPage,
  navigate,
  darkMode,
  toggleDarkMode,
  userRole,
}: LayoutProps) {
  const { identity, clear } = useInternetIdentity();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const qc = useQueryClient();

  const userId = identity?.getPrincipal();

  const navItems = [
    ...baseNavItems,
    ...(userRole === UserRole.admin
      ? [{ name: "users", label: "User Management", icon: Shield }]
      : []),
  ];

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId?.toString()],
    queryFn: async () => {
      if (!userId) return [];
      return await actor.getNotificationsByUser(userId);
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: bigint) => actor.markNotificationAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pageName =
    navItems.find((n) => currentPage.startsWith(n.name))?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-[#0B1220] dark:bg-[#0B1220] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={onEnter(() => setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col bg-gradient-to-b from-[#0E1626] to-[#0B1220] border-r border-[#223047] transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#223047]">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">ProTrack</span>
          <button
            type="button"
            className="ml-auto lg:hidden text-[#94A3B8]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ name, label, icon: Icon }) => {
            const active =
              currentPage === name || currentPage.startsWith(`${name}-`);
            return (
              <button
                type="button"
                key={name}
                data-ocid={`nav.${name}.link`}
                onClick={() => {
                  navigate({ name } as Page);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/5",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    active ? "text-blue-400" : "text-[#94A3B8]",
                  )}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-[#223047] pt-4">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-[#223047] bg-[#0E1626]">
          <button
            type="button"
            className="lg:hidden text-[#94A3B8]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-lg">{pageName}</h1>
          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-[#94A3B8] hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-[#141E2E] border border-[#223047] rounded-xl shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-[#223047]">
                    <span className="text-white font-semibold">
                      Notifications
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[#94A3B8] text-sm p-4 text-center">
                        No notifications
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          type="button"
                          key={n.id.toString()}
                          className={cn(
                            "w-full text-left px-4 py-3 border-b border-[#223047]/50 hover:bg-white/5",
                            !n.read && "bg-blue-600/5",
                          )}
                          onClick={() => markRead.mutate(n.id)}
                        >
                          <p
                            className={cn(
                              "text-sm font-medium",
                              n.read ? "text-[#94A3B8]" : "text-white",
                            )}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {userId?.toString().slice(0, 2).toUpperCase() ?? "U"}
                </div>
                {userRole && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium hidden sm:block",
                      userRole === UserRole.admin
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400",
                    )}
                  >
                    {userRole}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-[#141E2E] border border-[#223047] rounded-xl shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-[#223047]">
                    <p className="text-xs text-[#94A3B8]">Principal</p>
                    <p className="text-white text-xs font-mono truncate">
                      {userId?.toString().slice(0, 20)}...
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid="nav.sign_out.button"
                    onClick={clear}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
