export interface Tween { kill(): void; }
export interface Context { revert(): void; }
export interface Timeline extends Tween { to(target: unknown, vars: Record<string, unknown>, position?: unknown): Timeline; fromTo(target: unknown, from: Record<string, unknown>, to: Record<string, unknown>, position?: unknown): Timeline; }
export interface GSAP {
  version: string;
  registerPlugin(...plugins: unknown[]): void;
  to(target: unknown, vars: Record<string, unknown>): Tween;
  fromTo(target: unknown, from: Record<string, unknown>, to: Record<string, unknown>): Tween;
  set(target: unknown, vars: Record<string, unknown>): void;
  killTweensOf(target: unknown): void;
  context(callback: () => void, scope?: Element | null): Context;
  timeline(vars?: Record<string, unknown>): Timeline;
  ticker: { add(callback: (time: number) => void): void; remove(callback: (time: number) => void): void; lagSmoothing(threshold: number): void };
}
export const gsap: GSAP;
export const ScrollTrigger: { update(): void; refresh(): void; };

