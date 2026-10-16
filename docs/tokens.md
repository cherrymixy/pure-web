# Design tokens — Figma ↔ CSS

Source: Figma `xp0RmyE9WwsNFAF5kE88OX`, page **Design System** (`70:1520`), section 파운데이션. Read 2026-10-17 with `get_variable_defs` (F / Color `458:4287`, F / Typography `458:4812`, F / Spacing & Radius `458:4878`, F / Effect `458:4947`) and `get_design_context` (Spacing `458:4884`). Light mode only.

Files: `styles/tokens.css` (CSS variables + Tailwind `@theme inline`), `lib/ui/tokens.ts` (TS mirror). Naming: Figma `a/b` → CSS `--a-b`; Tailwind utility via `--color-a-b` etc.

## Color — primitives

| Figma | CSS | Value |
|---|---|---|
| `neutral/0` | `--neutral-0` | `#ffffff` |
| `neutral/50` | `--neutral-50` | `#f6f7f7` |
| `neutral/100` | `--neutral-100` | `#f2f2f2` |
| `neutral/150` | `--neutral-150` | `#e9eded` |
| `neutral/200` | `--neutral-200` | `#d8dcdd` |
| `neutral/300` | `--neutral-300` | `#c3cbcc` |
| `neutral/400` | `--neutral-400` | `#a0abad` |
| `neutral/500` | `--neutral-500` | `#8a9698` |
| `neutral/600` | `--neutral-600` | `#5f6b6d` |
| `neutral/700` | `--neutral-700` | `#3d4a4d` |
| `neutral/800` | `--neutral-800` | `#2c3335` |
| `neutral/850` | `--neutral-850` | `#232829` |
| `neutral/900` | `--neutral-900` | `#1a1e1f` |
| `neutral/950` | `--neutral-950` | `#0f1213` |
| `neutral/1000` | `--neutral-1000` | `#000000` |
| `sage/50` | `--sage-50` | `#e8f0f1` |
| `sage/100` | `--sage-100` | `#d3e2e4` |
| `sage/200` | `--sage-200` | `#a9c2c7` |
| `sage/300` | `--sage-300` | `#8fb3b9` |
| `sage/400` | `--sage-400` | `#789ba2` |
| `sage/500` | `--sage-500` | `#5f8189` |
| `sage/600` | `--sage-600` | `#4a666c` |
| `sage/700` | `--sage-700` | `#33474b` |
| `sage/800` | `--sage-800` | `#1e2a2c` |
| `sage/900` | `--sage-900` | `#142023` |
| `red/50` | `--red-50` | `#fdecec` |
| `red/400` | `--red-400` | `#ff6b6e` |
| `red/500` | `--red-500` | `#e5484d` |
| `red/900` | `--red-900` | `#3a1517` |
| `blue/300` | `--blue-300` | `#7fa8fa` |
| `blue/500` | `--blue-500` | `#3b79f6` |
| `green/400` | `--green-400` | `#4cc38a` |
| `green/500` | `--green-500` | `#2fa36b` |
| `alpha/black-06` | `--alpha-black-06` | `#0000000f` |
| `alpha/black-35` | `--alpha-black-35` | `#00000059` |
| `alpha/black-55` | `--alpha-black-55` | `#0000008c` |
| `alpha/white-08` | `--alpha-white-08` | `#ffffff14` |

## Color — semantic (Light)

Values as resolved by Figma; the primitive each one aliases isn't exposed by the API, so CSS keeps the hex value.

| Figma | CSS | Tailwind | Value |
|---|---|---|---|
| `bg/canvas` | `--bg-canvas` | `bg-bg-canvas` | `#f2f2f2` |
| `bg/surface` | `--bg-surface` | `bg-bg-surface` | `#ffffff` |
| `bg/surface-raised` | `--bg-surface-raised` | `bg-bg-surface-raised` | `#ffffff` |
| `bg/surface-muted` | `--bg-surface-muted` | `bg-bg-surface-muted` | `#e9eded` |
| `bg/brand` | `--bg-brand` | `bg-bg-brand` | `#789ba2` |
| `bg/brand-subtle` | `--bg-brand-subtle` | `bg-bg-brand-subtle` | `#e8f0f1` |
| `bg/brand-glow` | `--bg-brand-glow` | `bg-bg-brand-glow` | `#a9c2c7` |
| `bg/inverse` | `--bg-inverse` | `bg-bg-inverse` | `#1a1e1f` |
| `bg/disabled` | `--bg-disabled` | `bg-bg-disabled` | `#d8dcdd` |
| `bg/error-subtle` | `--bg-error-subtle` | `bg-bg-error-subtle` | `#fdecec` |
| `bg/overlay` | `--bg-overlay` | `bg-bg-overlay` | `#00000059` |
| `text/primary` | `--text-primary` | `text-text-primary` | `#1a1e1f` |
| `text/secondary` | `--text-secondary` | `text-text-secondary` | `#8a9698` |
| `text/tertiary` | `--text-tertiary` | `text-text-tertiary` | `#a0abad` |
| `text/brand` | `--text-brand` | `text-text-brand` | `#789ba2` |
| `text/link` | `--text-link` | `text-text-link` | `#3d4a4d` |
| `text/on-brand` | `--text-on-brand` | `text-text-on-brand` | `#ffffff` |
| `text/on-inverse` | `--text-on-inverse` | `text-text-on-inverse` | `#ffffff` |
| `text/disabled` | `--text-disabled` | `text-text-disabled` | `#8a9698` |
| `text/error` | `--text-error` | `text-text-error` | `#e5484d` |
| `icon/primary` | `--icon-primary` | `text-icon-primary` | `#1a1e1f` |
| `icon/secondary` | `--icon-secondary` | `text-icon-secondary` | `#8a9698` |
| `icon/brand` | `--icon-brand` | `text-icon-brand` | `#789ba2` |
| `icon/on-brand` | `--icon-on-brand` | `text-icon-on-brand` | `#ffffff` |
| `icon/on-inverse` | `--icon-on-inverse` | `text-icon-on-inverse` | `#ffffff` |
| `border/default` | `--border-default` | `border-border-default` | `#d8dcdd` |
| `border/strong` | `--border-strong` | `border-border-strong` | `#1a1e1f` |
| `border/error` | `--border-error` | `border-border-error` | `#e5484d` |
| `status/live` | `--status-live` | `bg-status-live` | `#3b79f6` |
| `status/success` | `--status-success` | `bg-status-success` | `#2fa36b` |
| `status/error` | `--status-error` | `bg-status-error` | `#e5484d` |
| `effect/shadow` | `--effect-shadow` | `shadow-effect-shadow` | `#0000000f` |

## Typography — Google Sans Flex (font file: STEP 21)

| Figma style | Tailwind | Size / line-height | Weight |
|---|---|---|---|
| `PURE/Title/L` | `text-title-l` | 30 / 38 px | 500 |
| `PURE/Title/M` | `text-title-m` | 22 / 29 px | 500 |
| `PURE/Title/S` | `text-title-s` | 18 / 24 px | 500 |
| `PURE/Header` | `text-header` | 16 / 22 px | 500 |
| `PURE/Body/L Strong` | `text-body-l-strong` | 16 / 22 px | 500 |
| `PURE/Body/L` | `text-body-l` | 16 / 22 px | 400 |
| `PURE/Body/M` | `text-body-m` | 15 / 22 px | 400 |
| `PURE/Body/S` | `text-body-s` | 13 / 18 px | 400 |
| `PURE/Label/M` | `text-label-m` | 14 / 20 px | 500 |
| `PURE/Label/S` | `text-label-s` | 13 / 18 px | 500 |
| `PURE/Caption` | `text-caption` | 11 / 14 px | 400 |
| `PURE/Display` | `text-display` | 30 / 38 px | 400 |

## Spacing — 4 px grid

Not Figma variables: the Spacing frame documents `space/N` = N px. Tailwind `--spacing: 4px`, so `p-4` = 16 px.

| Figma | CSS | Tailwind |
|---|---|---|
| `space/4` | `--space-4` | `p-1` / `gap-1` |
| `space/8` | `--space-8` | `p-2` / `gap-2` |
| `space/12` | `--space-12` | `p-3` / `gap-3` |
| `space/16` | `--space-16` | `p-4` / `gap-4` |
| `space/20` | `--space-20` | `p-5` / `gap-5` |
| `space/24` | `--space-24` | `p-6` / `gap-6` |
| `space/32` | `--space-32` | `p-8` / `gap-8` |
| `space/40` | `--space-40` | `p-10` / `gap-10` |
| `space/48` | `--space-48` | `p-12` / `gap-12` |

## Radius

| Figma | CSS / Tailwind | Value |
|---|---|---|
| `radius/xs` | `--radius-xs` / `rounded-xs` | 8 px |
| `radius/sm` | `--radius-sm` / `rounded-sm` | 12 px |
| `radius/md` | `--radius-md` / `rounded-md` | 16 px |
| `radius/lg` | `--radius-lg` / `rounded-lg` | 20 px |
| `radius/xl` | `--radius-xl` / `rounded-xl` | 28 px |
| `radius/full` | `--radius-full` / `rounded-full` | 999 px |

## Effect

| Figma | CSS / Tailwind | Value |
|---|---|---|
| `PURE/Shadow/Card` | `--pure-shadow-card` / `shadow-card` | DROP_SHADOW `#0000000F` (0, 4) blur 16 spread 0 |
| `PURE/Shadow/Float` | `--pure-shadow-float` / `shadow-float` | DROP_SHADOW `#0000001F` (0, 8) blur 28 spread 0 |
| `PURE/Blur/Overlay` | `--pure-blur-overlay` / `backdrop-blur-overlay` | BACKGROUND_BLUR radius 50 — **TODO:** CSS `blur(50px)` or `blur(25px)`? |

## Not in scope

- Dark mode (light only, CLAUDE.md).
- Icon tokens use the `icon/*` colors above; icon set (Material Symbols Round) is STEP 21.
