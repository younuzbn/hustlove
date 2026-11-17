"use client";

// Newsletter envelope — a blue envelope in 3D perspective, coloured like the security cube
// (sides 500 → 700, flap like the cube's top face, thin light edges), with stacked layers
// behind it for thickness. It turns to face the cursor: anywhere over the newsletter section
// the face swings toward the pointer (fine pointers, >1024px), and eases back to its rest
// pose (-3° roll, 14° pitch, -20° yaw) when the pointer leaves. It stays in place — no
// float, no lift. Motion off: the static rest pose.

import { animated, to, useSpring } from "@react-spring/web";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { useInViewFlag } from "@/hooks/use-in-view-flag";
import { useMotionOff, useMotionOffMarkup } from "@/hooks/use-motion-off";

/** Rest pose (degrees). */
const REST = { roll: -3, pitch: 14, yaw: -20 };
/** Cursor tilt: how far the face turns toward a pointer at the reach distance (degrees). */
const TILT = { yaw: 28, pitch: 20, roll: 4 };
/** Pointer offset (px from the envelope centre) that gives the full tilt. */
const REACH = 520;
/** Thickness: layers stacked behind the face, 0.125rem apart. */
const DEPTH = [1, 2, 3, 4, 5];

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

const pose = (pitch: number, yaw: number, roll: number) =>
  `rotateX(${pitch}deg) rotateY(${yaw}deg) rotate(${roll}deg)`;

export const NewsletterEnvelope = ({ caption }: { caption: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const animate = !useMotionOffMarkup();
  const motionOff = useMotionOff();
  const live = animate && !motionOff;
  const inView = useInViewFlag(ref, live);
  const [tilt, tiltApi] = useSpring(() => ({ ...REST, config: { tension: 110, friction: 20 } }));

  // The face turns toward the cursor while it is over the section.
  useEffect(() => {
    const el = ref.current;
    const section = el?.closest("section");
    if (!el || !section || !live || !inView) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / REACH);
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / REACH);
      tiltApi.start({ yaw: nx * TILT.yaw, pitch: -ny * TILT.pitch, roll: -nx * TILT.roll });
    };
    const onLeave = () => tiltApi.start(REST);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      tiltApi.start(REST);
    };
  }, [live, inView, tiltApi]);

  return (
    <div ref={ref} className="relative h-[16.875rem] w-100 perspective-[56rem]">
      <animated.div
        className="absolute inset-0 transform-3d"
        style={{
          transform: animate
            ? to([tilt.pitch, tilt.yaw, tilt.roll], pose)
            : pose(REST.pitch, REST.yaw, REST.roll),
        }}
      >
        {DEPTH.map((d) => (
          <span
            key={d}
            className="absolute inset-0 rounded-xl bg-envelope-edge"
            style={{ transform: `translateZ(${-d * 0.125}rem)` }}
          />
        ))}
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-envelope-edge">
          <Image src="/assets/newsletter/envelope.svg" alt="" width={400} height={270} className="absolute inset-0 size-full" />
          <p className="absolute top-[14.5625rem] left-21.5 text-body-s whitespace-nowrap text-on-dark">{caption}</p>
        </div>
      </animated.div>
    </div>
  );
};
