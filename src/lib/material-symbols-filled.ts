/**
 * The filled (FILL 1) instance of Material Symbols Rounded, for map pins.
 *
 * Canvas cannot set the FILL axis of the variable icon font that the UI loads
 * (DESIGN.md §6). This loads a second, pinned copy under its own family name
 * so that pins can draw the filled glyph. If the load fails, the caller keeps
 * the outlined glyph.
 */

export const FILLED_ICON_FAMILY = "Material Symbols Rounded Filled";

const FILLED_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400..700,1,0&display=block";

let loading: Promise<boolean> | null = null;

/** Resolves true once the filled icon font is ready to draw with. */
export function loadFilledIconFont(): Promise<boolean> {
  loading ??= (async () => {
    try {
      const css = await (await fetch(FILLED_CSS_URL)).text();
      // The first @font-face is the full-coverage fallback. The later ones are
      // per-script subsets, which do not contain every icon glyph.
      const url = css.match(/src:\s*url\((https:[^)]+\.woff2)\)/)?.[1];
      if (!url) throw new Error("The icon font stylesheet has no font file.");
      const buffer = await (await fetch(url)).arrayBuffer();
      const face = new FontFace(FILLED_ICON_FAMILY, buffer, { weight: "400 700", style: "normal" });
      await face.load();
      document.fonts.add(face);
      return true;
    } catch (error) {
      console.error("Could not load the filled map icon font.", error);
      return false;
    }
  })();
  return loading;
}
