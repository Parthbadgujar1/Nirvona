"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  variant = "pill",
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: "pill" | "underline" }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "no-scrollbar flex items-center overflow-x-auto",
        variant === "pill"
          ? "gap-1 rounded-lg bg-ink-100 p-1"
          : "gap-6 border-b border-ink-200",
        className,
      )}
      data-variant={variant}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  variant = "pill",
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  variant?: "pill" | "underline";
}) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:opacity-50 [&_svg]:size-4",
        variant === "pill"
          ? "rounded-md px-3.5 py-1.5 text-ink-600 hover:text-navy-900 data-[state=active]:bg-white data-[state=active]:text-navy-900 data-[state=active]:shadow-sm"
          : "-mb-px border-b-2 border-transparent px-0.5 pb-3 pt-2 text-ink-500 hover:text-navy-800 data-[state=active]:border-ember-500 data-[state=active]:text-navy-900",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-6 outline-none focus-visible:outline-none", className)}
      {...props}
    />
  );
}
