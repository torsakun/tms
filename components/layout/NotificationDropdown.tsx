"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { Bell, Check, Circle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define the notification type based on Prisma schema
type Notification = {
  id: string;
  type: "ASSIGNMENT" | "MENTION" | "SYSTEM" | "RUN_STARTED" | "RUN_COMPLETED";
  entityId: string | null;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { name: string | null; email: string } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Poll every 30 seconds
  const { data, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000 }
  );

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    mutate(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          unreadCount: Math.max(0, currentData.unreadCount - 1),
          notifications: currentData.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        };
      },
      false
    );

    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    mutate(); // Revalidate
  };

  const markAllAsRead = async () => {
    mutate(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          unreadCount: 0,
          notifications: currentData.notifications.map((n) => ({ ...n, isRead: true })),
        };
      },
      false
    );

    await fetch("/api/notifications", { method: "PATCH" });
    mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    // If there's an entityId, we can route somewhere. We could enhance this to include projectId.
    // For now, if entityId looks like a case or run, you can customize the routing.
    // Assuming the title/message might contain context, or we can just open it.
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl transition-all duration-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/60 overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm">You have no notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors group flex gap-3 ${
                      !notification.isRead ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {!notification.isRead ? (
                        <Circle className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />
                      ) : (
                        <Circle className="w-2.5 h-2.5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.actor?.name && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500">{notification.actor.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
              In-App Notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
