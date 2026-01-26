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
  None  = 0,
  Shift = 1 << 0,
  Alt   = 1 << 1,
  Ctrl  = 1 << 2,
  Meta  = 1 << 3,
}

export function getModMask(e: PointerEvent): Mod {
  return (e.shiftKey ? Mod.Shift : Mod.None)
    | (e.altKey ? Mod.Alt : Mod.None)
    | (e.ctrlKey ? Mod.Ctrl : Mod.None)
    | (e.metaKey ? Mod.Meta : Mod.None)
}
