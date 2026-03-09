Two changes. Execute in order.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 1 — Update logo to match light background
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open src/design/logo/generate-logo.ts

For ALL icon variants, change:
- rect fill: rgba(255,255,255,0.03) → #0070F3
- rect stroke: rgba(255,255,255,0.07) → #0070F3
- text fill: rgba(255,255,255,0.95) → #FFFFFF

For logo-icon-light.svg specifically:
- rect fill: white → #0070F3
- text fill: #080808 → #FFFFFF

Then run: npm run generate:logo
Confirm: ls public/brand/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 2 — Replace login with Stitch design
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delete app/login/login.module.css completely.
Replace app/login/page.tsx with this design:

FONT:
import { JetBrains_Mono } from 'next/font/google'
const mono = JetBrains_Mono({ 
  subsets: ['latin'], 
  weight: ['400','500','600','700','800'] 
})

LAYOUT — full viewport, background #F5F5F5:
- No split panel. Single centered column.
- Max-width 480px, margin auto, padding 64px 48px
- Vertically: space-between from top to bottom

TOP-LEFT logo row:
- <img src="/brand/logo-icon-default.svg" width="36" height="36" />
- "ARMANDOANALYTICS" — 13px 700, #0D1117, letter-spacing 2px

HEADLINE section (margin-top: auto, ~25% from top):
- "EXECUTE LOGIN" — 48px 800, #0D1117, letter-spacing -1px, font mono
- "ACCESSING TERMINAL INTERFACE V2.04.1" — 11px, rgba(0,0,0,0.3), 
   letter-spacing 3px, uppercase, margin-top 8px

FORM (margin-top 48px):
Fields use bottom-border ONLY — no box:
  Label style: 10px 600, letter-spacing 2px, uppercase, rgba(0,0,0,0.35)
  Input style:
    - background: transparent
    - border: none
    - border-bottom: 1px solid rgba(0,0,0,0.12)
    - padding: 10px 0
    - font: JetBrains Mono 14px, color #0D1117
    - outline: none
    - width: 100%
    - ::placeholder color: rgba(0,0,0,0.2)
    - :focus border-bottom-color: #0070F3

  Field 1: label "01 / USER_EMAIL", type email, placeholder "user@armando.net"
  Field 2: label "02 / ACCESS_KEY", type password, placeholder "• • • • • • • • • • •"

  Gap between fields: 32px

ERROR STATE (hidden by default, show on auth error):
  - Above the button
  - "✕  CREDENCIALES INVÁLIDAS"
  - 10px mono, rgba(220,50,50,0.8), letter-spacing 1px

CTA BUTTON (margin-top 40px):
  - Full width, background #0D1117, color white
  - border-radius: 4px, height: 56px
  - font: JetBrains Mono 13px 700, letter-spacing 2px, uppercase
  - text: "RUN LOGIN QUERY ▸"
  - hover: background #0070F3, transition 0.2s ease
  - loading state: "EXECUTING..." + disabled + opacity 0.5
  - NO box-shadow, NO gradients — flat and confident

RESET LINK (margin-top 20px):
  - "RESET ACCESS CREDENTIALS"
  - 10px, rgba(0,0,0,0.25), letter-spacing 2px, uppercase, text-align center
  - display block
  - onClick: supabase.auth.resetPasswordForEmail(email)

FOOTER (position: fixed, bottom 32px, left 48px):
  - Green dot 6px: background #22C55E, border-radius 50%
    animation: opacity 1→0.4→1, 2s infinite
  - "SYSTEM ACTIVE · V2.0.412-STABLE · NODE_01"
  - 10px mono, rgba(0,0,0,0.2), letter-spacing 1px

AUTH LOGIC:
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const router = useRouter()

async function handleLogin() {
  setLoading(true)
  setError(false)
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setError(true)
    setLoading(false)
    return
  }
  router.push('/dashboard')
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm run build — zero errors.
Commit: git commit -m "feat: login stitch design final + blue logo"