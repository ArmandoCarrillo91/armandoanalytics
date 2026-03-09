Rewrite app/login/page.tsx and login.module.css completely from scratch.
Simple, centered, responsive. No split panels. No decorative elements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800'] })

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Full viewport, background: #FFFFFF
- Single centered column
- display: flex, align-items: center, justify-content: center, min-height: 100vh

FORM CONTAINER:
- width: 100%, max-width: 380px
- padding: 0 24px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT — top to bottom
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LOGO + NAME (centered, margin-bottom: 40px):
   - <img src="/brand/logo-icon-default.svg" width="40" height="40" />
     display: block, margin: 0 auto 12px
   - "ARMANDOANALYTICS"
     Inter 14px 700, color #0D1117, letter-spacing 2px
     text-align: center

2. FIELDS:

   EMAIL:
   - label: "Email" — Inter 12px 500, color #64748B, margin-bottom 6px
   - input: type email
     width 100%, padding 12px 0
     background transparent, border none
     border-bottom: 1px solid #E2E8F0
     Inter 14px, color #0D1117
     placeholder: "correo@empresa.com", color #CBD5E1
     focus: border-bottom-color #0070F3, outline none
     margin-bottom: 24px

   PASSWORD:
   - label: "Contraseña" — same style as Email
   - input: type password
     same style as email input
     placeholder: "••••••••"

3. ERROR (hidden by default):
   margin-top: 12px, margin-bottom: 12px
   Inter 12px, color #EF4444
   text: "Credenciales incorrectas. Intenta de nuevo."

4. BUTTON (margin-top: 32px):
   width: 100%, height: 48px
   background: #0070F3, color white, border: none
   border-radius: 6px
   Inter 14px 600
   text: "Iniciar sesión"
   hover: background #0056CC, transition 0.2s
   loading: "Iniciando..." + disabled + opacity 0.6
   cursor: pointer

5. FOOTER (margin-top: 48px, text-align: center):
   "Sistema de uso interno. Acceso por invitación."
   Inter 11px, color #94A3B8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState(false)

async function handleLogin() {
  setLoading(true)
  setError(false)
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setError(true)
    setLoading(false)
    return
  }
  router.push('/dashboard')
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NO split panels, NO dark background, NO blue left side
- NO "ACCESS SYSTEM", NO "EXECUTE", NO terminal language
- ONE logo only — inside the form, centered above fields
- CSS Modules only, delete and rewrite login.module.css
- Responsive: works on mobile and desktop
- npm run build — zero errors
