"use client";

import { animated, useSpring } from "@react-spring/web";
import { useState, type FormEvent } from "react";

import { ButtonHoverFill } from "@/components/ui/button-hover-fill";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

export interface NewsletterFormProps {
  placeholder: string;
  submit: string;
}

/** Figma 5717:1200 "Input / Email with button". No backend yet — submit is a no-op.
 *  Its stroke is not part of the layout in Figma, so the border comes out of the padding.
 *  Focus: the border turns accent and an accent rule draws under the typed line from the
 *  left; the Subscribe button has the site's hover fill. */
export const NewsletterForm = ({ placeholder, submit }: NewsletterFormProps) => {
  const [focused, setFocused] = useState(false);
  const motion = !useMotionOffMarkup();
  const rule = useSpring({ p: focused ? 1 : 0, config: SPRING.calm });
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex h-16 w-110 items-center to-tablet:w-full gap-2 rounded-panel border border-line bg-surface pr-[0.4375rem] pl-[1.4375rem] transition-colors duration-[var(--duration-fast)] ease-entrance focus-within:border-accent hover:border-line-dashed focus-within:hover:border-accent"
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{placeholder}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-ui text-ink outline-none placeholder:text-muted"
        />
        {motion && (
          <animated.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-1 h-px origin-left bg-accent"
            style={{ transform: rule.p.to((p) => `scaleX(${p})`), opacity: rule.p.to((p) => Math.min(1, p * 3)) }}
          />
        )}
      </label>
      <button type="submit" className="flex h-12 shrink-0 items-center rounded-xs bg-ink px-6 text-ui font-medium text-on-dark">
        <ButtonHoverFill variant="dark">{submit}</ButtonHoverFill>
      </button>
    </form>
  );
};
