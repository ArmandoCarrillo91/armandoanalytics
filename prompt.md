Three focused changes to app/login/page.tsx and login.module.css.
Apply Elon Musk principle: remove everything that isn't necessary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 1 — Remove unnecessary text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delete these elements completely:
- Subline "ACCESSING TERMINAL INTERFACE V2.04.1" — remove, says nothing useful
- "RESET ACCESS CREDENTIALS" link — move to only show AFTER a failed login attempt
- Footer "SYSTEM ACTIVE · V2.0.412-STABLE · NODE_01" — remove, irrelevant to the user

What stays: logo, headline, two fields, one button.
That's it. Nothing else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 2 — Headline color → navy blue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"EXECUTE LOGIN" headline:
FROM: color #0D1117
TO:   color #0D3B7A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 3 — Button color → navy blue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"RUN LOGIN QUERY ▸" button:
FROM: background #0D1117
TO:   background #0D3B7A
hover: background #0a2f63

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 4 — Logo: center + move down
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Logo row:
- text-align: center
- justify-content: center  
- margin-top: 48px
- margin-bottom: 48px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 5 — Font headline → Geist
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Geist, Geist_Mono } from 'next/font/google'
const geist = Geist({ subsets: ['latin'] })
const mono = Geist_Mono({ subsets: ['latin'] })

- Headline "EXECUTE LOGIN": geist.className, weight 800
- Labels, button, placeholders: mono.className
- Root wrapper: geist.className

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Final page should have exactly:
logo → headline → email field → password field → button
Nothing else visible by default.

