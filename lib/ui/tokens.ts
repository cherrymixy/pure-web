// PURE design tokens for TypeScript (canvas, charts, /dev/tokens). Same values as styles/tokens.css,
// both read from Figma (Design System page 70:1520) in STEP 20. Components style with the CSS variables.

export const PRIMITIVES = {
  "neutral/0": "#ffffff",
  "neutral/50": "#f6f7f7",
  "neutral/100": "#f2f2f2",
  "neutral/150": "#e9eded",
  "neutral/200": "#d8dcdd",
  "neutral/300": "#c3cbcc",
  "neutral/400": "#a0abad",
  "neutral/500": "#8a9698",
  "neutral/600": "#5f6b6d",
  "neutral/700": "#3d4a4d",
  "neutral/800": "#2c3335",
  "neutral/850": "#232829",
  "neutral/900": "#1a1e1f",
  "neutral/950": "#0f1213",
  "neutral/1000": "#000000",
  "sage/50": "#e8f0f1",
  "sage/100": "#d3e2e4",
  "sage/200": "#a9c2c7",
  "sage/300": "#8fb3b9",
  "sage/400": "#789ba2",
  "sage/500": "#5f8189",
  "sage/600": "#4a666c",
  "sage/700": "#33474b",
  "sage/800": "#1e2a2c",
  "sage/900": "#142023",
  "red/50": "#fdecec",
  "red/400": "#ff6b6e",
  "red/500": "#e5484d",
  "red/900": "#3a1517",
  "blue/300": "#7fa8fa",
  "blue/500": "#3b79f6",
  "green/400": "#4cc38a",
  "green/500": "#2fa36b",
  "alpha/black-06": "#0000000f",
  "alpha/black-35": "#00000059",
  "alpha/black-55": "#0000008c",
  "alpha/white-08": "#ffffff14"
} as const;

/** Light mode, resolved values from get_variable_defs */
export const SEMANTIC = {
  "bg/canvas": "#f2f2f2",
  "bg/surface": "#ffffff",
  "bg/surface-raised": "#ffffff",
  "bg/surface-muted": "#e9eded",
  "bg/brand": "#789ba2",
  "bg/brand-subtle": "#e8f0f1",
  "bg/brand-glow": "#a9c2c7",
  "bg/inverse": "#1a1e1f",
  "bg/disabled": "#d8dcdd",
  "bg/error-subtle": "#fdecec",
  "bg/overlay": "#00000059",
  "text/primary": "#1a1e1f",
  "text/secondary": "#8a9698",
  "text/tertiary": "#a0abad",
  "text/brand": "#789ba2",
  "text/link": "#3d4a4d",
  "text/on-brand": "#ffffff",
  "text/on-inverse": "#ffffff",
  "text/disabled": "#8a9698",
  "text/error": "#e5484d",
  "icon/primary": "#1a1e1f",
  "icon/secondary": "#8a9698",
  "icon/brand": "#789ba2",
  "icon/on-brand": "#ffffff",
  "icon/on-inverse": "#ffffff",
  "border/default": "#d8dcdd",
  "border/strong": "#1a1e1f",
  "border/error": "#e5484d",
  "status/live": "#3b79f6",
  "status/success": "#2fa36b",
  "status/error": "#e5484d",
  "effect/shadow": "#0000000f"
} as const;

export const TYPOGRAPHY = {
  "title-l": { figma: "PURE/Title/L", size: 30, lineHeight: 38, weight: 500 },
  "title-m": { figma: "PURE/Title/M", size: 22, lineHeight: 29, weight: 500 },
  "title-s": { figma: "PURE/Title/S", size: 18, lineHeight: 24, weight: 500 },
  "header": { figma: "PURE/Header", size: 16, lineHeight: 22, weight: 500 },
  "body-l-strong": { figma: "PURE/Body/L Strong", size: 16, lineHeight: 22, weight: 500 },
  "body-l": { figma: "PURE/Body/L", size: 16, lineHeight: 22, weight: 400 },
  "body-m": { figma: "PURE/Body/M", size: 15, lineHeight: 22, weight: 400 },
  "body-s": { figma: "PURE/Body/S", size: 13, lineHeight: 18, weight: 400 },
  "label-m": { figma: "PURE/Label/M", size: 14, lineHeight: 20, weight: 500 },
  "label-s": { figma: "PURE/Label/S", size: 13, lineHeight: 18, weight: 500 },
  "caption": { figma: "PURE/Caption", size: 11, lineHeight: 14, weight: 400 },
  "display": { figma: "PURE/Display", size: 30, lineHeight: 38, weight: 400 },
} as const;

export const FONT_FAMILY = "Google Sans Flex";

export const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const RADIUS = {"xs": 8, "sm": 12, "md": 16, "lg": 20, "xl": 28, "full": 999} as const;

export const EFFECTS = {
  "shadow-card": { figma: "PURE/Shadow/Card", css: "0 4px 16px 0 #0000000f" },
  "shadow-float": { figma: "PURE/Shadow/Float", css: "0 8px 28px 0 #0000001f" },
  "blur-overlay": { figma: "PURE/Blur/Overlay", css: "50px", todo: "Figma BACKGROUND_BLUR radius 50 → CSS blur() value to confirm" },
} as const;

/** CSS variable for a Figma variable name: "bg/surface" → "var(--bg-surface)" */
export const cssVar = (figmaName: string) => `var(--${figmaName.replace(/\//g, "-")})`;
