"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Check, CheckCircle2, Info, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

type Notification = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
  info: <Info className="h-4 w-4 shrink-0 text-sky-500" />,
};

const SEVERITY_BADGE: Record<string, "error" | "warning" | "info"> = {
  critical: "error",
  warning: "warning",
  info: "info",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  async function load() {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/notifications?limit=100${filter === "unread" ? "&unreadOnly=true" : ""}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { items: Notification[]; unreadCount: number } };
        setItems(json.data.items);
        setUnreadCount(json.data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.authToken, filter]);

  async function handleClick(n: Notification) {
    if (!n.isRead && user?.authToken) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
      await fetch(`/api/v1/notifications/${n.id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
      }).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  }

  async function handleMarkAllRead() {
    if (!user?.authToken) return;
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/v1/notifications/mark-all-read", {
      method: "POST",
      headers: { Authorization: `Bearer ${user.authToken}` },
    }).catch(() => undefined);
  }

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-blue" />
            Notifications
          </h1>
          <p className="app-page-lead">Every update relevant to your role, in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => { void handleMarkAllRead(); }} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-sm font-medium text-slate-700">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-xs text-slate-400">You'll see updates here as they happen across the platform.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { void handleClick(n); }}
                  className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                    n.isRead ? "" : "bg-blue-50/30"
                  }`}
                >
                  {SEVERITY_ICON[n.severity]}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                      <Badge variant={SEVERITY_BADGE[n.severity]} className="capitalize">{n.severity}</Badge>
                      {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-label="Unread" />}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">{n.message}</span>
                    <span className="mt-1.5 block text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
