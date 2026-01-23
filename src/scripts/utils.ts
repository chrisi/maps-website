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
