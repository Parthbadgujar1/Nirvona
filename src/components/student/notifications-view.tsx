"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell, BellOff, CheckCheck, CreditCard, IdCard, Info, Mail, MessageSquare, Monitor, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { relativeTime, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

const TODAY = new Date("2026-09-05T12:00:00Z");

const TYPE_META: Record<AppNotification["type"], { icon: typeof Bell; tone: string; href: string }> = {
  exam: { icon: Monitor, tone: "bg-royal-50 text-royal-600", href: "/student/exams" },
  result: { icon: Trophy, tone: "bg-success-50 text-success-600", href: "/student/results" },
  payment: { icon: CreditCard, tone: "bg-ember-50 text-ember-600", href: "/student/payments" },
  "admit-card": { icon: IdCard, tone: "bg-saffron-100 text-saffron-600", href: "/student/admit-card" },
  general: { icon: Info, tone: "bg-ink-100 text-ink-500", href: "/student/dashboard" },
};

const CHANNEL_ICON = {
  whatsapp: MessageSquare,
  sms: MessageSquare,
  email: Mail,
  portal: Bell,
};

export function NotificationsView() {
  const notifications = useAsync(() => studentService.notifications(), []);
  const [read, setRead] = React.useState<string[]>([]);

  if (notifications.status === "error") return <ErrorState onRetry={notifications.reload} />;
  if (notifications.status === "loading" || !notifications.data) {
    return <LoadingState label="Loading notifications" />;
  }

  const items = notifications.data.map((n) => ({ ...n, read: n.read || read.includes(n.id) }));
  const unread = items.filter((n) => !n.read);

  const render = (list: typeof items) =>
    list.length === 0 ? (
      <EmptyState
        icon={BellOff}
        title="Nothing here"
        description="You are all caught up. New notifications about exams, admit cards and results appear here."
      />
    ) : (
      <ul className="space-y-3">
        {list.map((item) => {
          const meta = TYPE_META[item.type];
          const Icon = meta.icon;
          const ChannelIcon = CHANNEL_ICON[item.channel];
          return (
            <li key={item.id}>
              <Card
                className={cn(
                  "flex gap-4 p-5 transition-colors",
                  !item.read && "border-l-4 border-l-ember-500 bg-ember-50/20",
                )}
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-navy-900">
                      {item.title}
                    </h3>
                    <span className="shrink-0 text-xs text-ink-400">
                      {relativeTime(item.createdAt, TODAY)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="neutral" size="sm">
                      <ChannelIcon aria-hidden />
                      {item.channel === "portal" ? "Portal" : item.channel.toUpperCase()}
                    </Badge>
                    <span className="text-2xs text-ink-400">{formatDateTime(item.createdAt)}</span>
                    <Button asChild variant="ghost" size="xs" className="ml-auto">
                      <Link href={meta.href}>Open</Link>
                    </Button>
                    {!item.read && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setRead((r) => [...r, item.id])}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Exam reminders, admit card releases, result announcements and payment confirmations."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Notifications" }]}
        actions={
          unread.length > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setRead(items.map((i) => i.id));
                toast.success("All notifications marked as read");
              }}
            >
              <CheckCheck />
              Mark all as read
            </Button>
          )
        }
      />

      <Tabs defaultValue="all">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="all">
            All ({items.length})
          </TabsTrigger>
          <TabsTrigger variant="underline" value="unread">
            Unread ({unread.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">{render(items)}</TabsContent>
        <TabsContent value="unread">{render(unread)}</TabsContent>
      </Tabs>
    </div>
  );
}
