const getResource = (name: string) => {
  // Resolves the path relative to THIS file, regardless of browser URL depth
  return new URL(`../common/assets/${name}`, import.meta.url).href
}
