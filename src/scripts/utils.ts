import type {Point} from "@/model/base.ts";

export const baseUrl = import.meta.env.BASE_URL

export const getResource = (name: string) => {
  // Resolves the path relative to THIS file, regardless of browser URL depth
  return new URL(`../common/assets/${name}`, import.meta.url).href
}

export const generateGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export enum Mod {
  None = 0,
  Shift = 1 << 0,
  Alt = 1 << 1,
  Ctrl = 1 << 2,
  Meta = 1 << 3,
}

export function getModMask(e: PointerEvent): Mod {
  return (e.shiftKey ? Mod.Shift : Mod.None)
    | (e.altKey ? Mod.Alt : Mod.None)
    | (e.ctrlKey ? Mod.Ctrl : Mod.None)
    | (e.metaKey ? Mod.Meta : Mod.None)
}

export function pointOffsetRad(pt: Point, rot: number, dist: number) {
  return {x: pt.x + dist * Math.sin(rot), y: pt.y - dist * Math.cos(rot)}
}

export function isModPressed(e: PointerEvent, mod: Mod): boolean {
  return (getModMask(e) & mod) !== Mod.None;
}

export const getModString = (mask: Mod): string => {
  const mods = [];
  if (mask & Mod.Shift) mods.push('Shift');
  if (mask & Mod.Alt) mods.push('Alt');
  if (mask & Mod.Ctrl) mods.push('Ctrl');
  if (mask & Mod.Meta) mods.push('Meta');
  return mods.join('+');
}

type CtxMethod = (...args: any[]) => any;

export function withCanvasCallCounters<T>(
  ctx: CanvasRenderingContext2D,
  methods: Array<keyof CanvasRenderingContext2D>,
  run: () => T,
) {
  const counts = new Map<string, number>();
  const originals = new Map<string, CtxMethod>();

  const bump = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1);

  for (const m of methods) {
    const name = String(m);
    const original = (ctx as any)[m] as CtxMethod | undefined;
    if (typeof original !== 'function') continue;

    originals.set(name, original);
    (ctx as any)[m] = function (...args: any[]) {
      bump(name);
      return original.apply(this, args);
    };
  }

  try {
    return {result: run(), counts};
  } finally {
    // restore originals
    for (const [name, original] of originals) {
      (ctx as any)[name] = original;
    }
  }
}
