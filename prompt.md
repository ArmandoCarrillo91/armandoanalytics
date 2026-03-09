Rewrite the entire dashboard layout and login with this design system.
Source: the aa-logo-A.html file — same aesthetic, inverted for the system.

DESIGN SYSTEM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN = dark (as is)
DASHBOARD SYSTEM = white (inverted)

COLOR TOKENS — add to globals.css as CSS variables:

/* Dark (login) */
--bg: #080808;
--surface: rgba(255,255,255,0.03);
--border-dark: rgba(255,255,255,0.07);
--text-primary: rgba(255,255,255,0.95);
--text-secondary: rgba(255,255,255,0.40);
--text-dim: rgba(255,255,255,0.18);

/* Light (system) */
--bg-light: #FFFFFF;
--bg-canvas: #FAFAFA;
--border-light: #EAEAEA;
--text-black: #111111;
--text-gray: #6B7280;
--text-muted: #A1A1AA;
--accent: #0070F3;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT — globals.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body {
  margin: 0; padding: 0;
  font-family: 'Inter', sans-serif;
}

.dot-grid {
  background-image: radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN PAGE — app/login/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keep current structure. Update colors only:

background: #080808
Card: no card — centered form on dark background

Logo SVG (inline, centered, margin-bottom 24px):
<svg width="52" height="52" viewBox="0 0 52 52" fill="none">
  <rect x=".5" y=".5" width="51" height="51" rx="13" 
    stroke="rgba(255,255,255,0.08)" fill="rgba(255,255,255,0.03)"/>
  <text x="26" y="26" text-anchor="middle" dominant-baseline="central"
    font-size="30" font-weight="800" fill="rgba(255,255,255,0.95)"
    font-family="Inter, sans-serif">A</text>
</svg>

Brand name: "armandoanalytics" — Inter 18px 700, 
  color rgba(255,255,255,0.95), letter-spacing -0.5px, text-align center

Labels: rgba(255,255,255,0.40), 11px, letter-spacing 1px
Inputs: 
  background: rgba(255,255,255,0.04)
  border: 1px solid rgba(255,255,255,0.08)
  border-radius: 8px
  padding: 11px 14px
  color: rgba(255,255,255,0.95)
  font-size: 13px
  focus: border-color rgba(255,255,255,0.25)
  
Button "Sign in":
  background: rgba(255,255,255,0.95)
  color: #000000
  border-radius: 8px
  height: 44px
  font-size: 13px, font-weight: 700
  hover: opacity 0.85

Footer "Internal system · Access by invitation only.":
  color: rgba(255,255,255,0.18), font-size: 11px, text-align center

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DASHBOARD LAYOUT — app/dashboard/layout.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full white system — inverted from login.

SIDEBAR (220px):
  background: #FFFFFF
  border-right: 1px solid #EAEAEA

  Logo section (padding 16px):
    SVG icon (28px):
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#0070F3"/>
        <text x="14" y="14" text-anchor="middle" dominant-baseline="central"
          font-size="16" font-weight="800" fill="white"
          font-family="Inter, sans-serif">A</text>
      </svg>
    Brand: "armandoanalytics" — Inter 13px 500, #111111, letter-spacing -0.3px

  Nav section:
    Label "WORKSPACES" — 10px 500, #A1A1AA, letter-spacing 1.5px, uppercase
    padding: 0 16px, margin-bottom 6px

    Nav items:
      padding: 8px 16px
      font-size: 13px
      Active: font-weight 500, color #111111, background #F4F4F5, 
              border-left: 2px solid #0070F3
      Inactive: font-weight 400, color #6B7280, border-left: 2px solid transparent
      Hover: background #F4F4F5

  Footer (border-top 1px solid #EAEAEA, padding 12px 16px):
    Initials circle: 28px, background #111111, white text, 10px 500, border-radius 50%
    Email: 12px, #6B7280, truncate

TOPBAR (48px):
  background: #FFFFFF
  border-bottom: 1px solid #EAEAEA
  padding: 0 20px
  Left: workspace name — Inter 14px 500, #111111
  Right: "+" button — 28px, border 1px solid #EAEAEA, border-radius 6px, color #6B7280

CANVAS:
  background: #FAFAFA
  className="dot-grid"
  padding: 24px
  overflow-y: auto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DASHBOARD PAGE — app/dashboard/taller/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Empty for now:
export default function TallerPage() {
  return <div />
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLEAN UP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delete if they exist:
- components/taller/TallerDashboard.tsx
- components/taller/KPIStrip.tsx
- components/taller/FlujoDiarioChart.tsx
- components/taller/GastosCategoriaChart.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm run build — zero errors
