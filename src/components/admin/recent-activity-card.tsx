"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import {
  Activity, Award, CalendarClock, ChevronDown, IdCard, KeyRound, ShoppingCart, UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/states";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types";

const ICON = {
  purchase: ShoppingCart,
  exam: CalendarClock,
  result: Award,
  credential: KeyRound,
  "admit-card": IdCard,
  student: UserPlus,
} as const;

const VISIBLE_GROUPS = 6;

interface Group {
  key: string;
  type: ActivityItem["type"];
  action: string;
  target: string;
  actors: string[];
  /** Newest event in the group (the feed is newest-first). */
  at: string;
}

/**
 * Bursts of identical events (e.g. 20 sign-ups in the same minute) collapse into
 * ONE row - "Riya, Arun and 18 others registered" - instead of 20 near-identical
 * lines that push everything else off the card.
 */
function groupEvents(items: ActivityItem[]): Group[] {
  const groups: Group[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.type === item.type && last.action === item.action && last.target === item.target) {
      last.actors.push(item.actor);
    } else {
      groups.push({
        key: item.id,
        type: item.type,
        action: item.action,
        target: item.target,
        actors: [item.actor],
        at: item.at,
      });
    }
  }
  return groups;
}

function who(actors: string[]): { lead: string; rest: string } {
  if (actors.length === 1) return { lead: actors[0], rest: "" };
  if (actors.length === 2) return { lead: `${actors[0]} and ${actors[1]}`, rest: "" };
  return { lead: `${actors[0]}, ${actors[1]}`, rest: ` and ${actors.length - 2} others` };
}

/** Wording that only makes sense for one person ("was issued an admit card", "as a new student"). */
const pluralTarget = (target: string, count: number) =>
  count > 1 ? target.replace(/^as a new student$/, "as new students") : target;
const pluralAction = (action: string, count: number) =>
  count > 1 ? action.replace(/^was issued an admit card for$/, "were issued admit cards for") : action;

export function RecentActivityCard({
  items,
  loading,
}: {
  items: ActivityItem[] | undefined;
  loading: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const now = new Date();
  const groups = groupEvents(items ?? []);
  const visible = expanded ? groups : groups.slice(0, VISIBLE_GROUPS);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-5">
        <div className="flex items-center gap-2.5">
          <Activity className="size-4 text-ember-600" aria-hidden />
          <h2 className="font-display text-base font-semibold text-navy-900">Recent activity</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-success-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-500/60" />
            <span className="relative inline-flex size-2 rounded-full bg-success-500" />
          </span>
          Live
        </span>
      </div>

      {loading ? (
        <div className="p-5">
          <LoadingState label="Loading activity" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-sm font-semibold text-navy-900">No activity yet</p>
          <p className="mt-1 text-xs text-ink-500">
            Sign-ups, purchases, admit cards and results will appear here as they happen.
          </p>
        </div>
      ) : (
        // A fixed maximum height keeps the card the same size as its neighbour;
        // anything beyond it scrolls instead of stretching the page.
        <ul className={cn("divide-y divide-ink-100 overflow-y-auto nv-scroll", expanded ? "max-h-[26rem]" : "")}>
          {visible.map((group) => {
            const Icon = ICON[group.type];
            const { lead, rest } = who(group.actors);
            return (
              <li key={group.key} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    group.actors.length > 1 ? "bg-navy-50 text-navy-700" : "bg-canvas text-ink-500",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 text-sm leading-snug text-ink-700">
                  <span className="font-semibold text-navy-900">{lead}</span>
                  {rest && (
                    <span className="font-semibold text-navy-900" title={group.actors.join(", ")}>
                      {rest}
                    </span>
                  )}{" "}
                  {pluralAction(group.action, group.actors.length)}{" "}
                  <span className="font-medium text-navy-900">
                    {pluralTarget(group.target, group.actors.length)}
                  </span>
                </p>
                <time
                  dateTime={group.at}
                  className="mt-0.5 shrink-0 whitespace-nowrap text-xs text-ink-400"
                  title={new Date(group.at).toLocaleString()}
                >
                  {relativeTime(group.at, now)}
                </time>
              </li>
            );
          })}
        </ul>
      )}

      {groups.length > VISIBLE_GROUPS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-ink-100 py-3 text-xs font-semibold text-royal-700 transition-colors hover:bg-canvas"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : `Show ${groups.length - VISIBLE_GROUPS} more`}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} aria-hidden />
        </button>
      )}

      <div className="mt-auto border-t border-ink-100 p-4">
        <Button asChild variant="secondary" size="sm" block>
          <Link to="/admin/notifications">Open notification log</Link>
        </Button>
      </div>
    </Card>
  );
}
