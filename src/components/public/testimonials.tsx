"use client";

import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/states";
import { Avatar } from "@/components/ui/avatar";
import { TESTIMONIALS } from "@/data/site";

export function Testimonials() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-nv">
        <SectionHeading
          eyebrow="Student voices"
          title="What changes when you can see the data"
          description="Six students and one parent on what the analytics actually told them to do differently."
        />

        <StaggerGroup className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <StaggerItem key={item.name}>
              <figure className="flex h-full flex-col rounded-xl border border-ink-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Quote className="size-6 text-ember-200" aria-hidden />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-600">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
                  <Avatar name={item.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-900">{item.name}</p>
                    <p className="text-xs text-ink-500">{item.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xs font-bold text-ember-600">{item.result}</p>
                    <p className="text-2xs text-ink-400">{item.program}</p>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
