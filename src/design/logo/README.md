# Logo System — armandoanalytics

Single source of truth: `generate-logo.ts`

## Variants

| File | Size | Use case |
|------|------|----------|
| `logo-icon-default.svg` | 52x52 | Primary icon on dark backgrounds |
| `logo-icon-outline.svg` | 52x52 | Transparent backgrounds where border visibility matters |
| `logo-icon-light.svg` | 52x52 | Light/white backgrounds |
| `logo-icon-elevated.svg` | 52x52 | Cards or elevated surfaces |
| `logo-icon-navbar.svg` | 34x34 | Sidebar and navbar |
| `logo-icon-favicon.svg` | 32x32 | Browser favicon |
| `logo-wordmark.svg` | 320x52 | Full brand name, hero sections, footer |

## Design Tokens — Gray Alpha Palette

```
Background  #080808
White       rgba(255,255,255,0.95)
Gray Hi     rgba(255,255,255,0.65)
Gray Mid    rgba(255,255,255,0.40)
Gray Dim    rgba(255,255,255,0.18)
Border      rgba(255,255,255,0.07)
Surface     rgba(255,255,255,0.03)
Font        JetBrains Mono, 800 weight
```

## Regenerate

```bash
npm run generate:logo
```

## Rule

**NEVER edit SVG files directly.** Edit `generate-logo.ts` and regenerate.
