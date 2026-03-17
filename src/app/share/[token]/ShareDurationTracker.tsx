'use client'

import { useEffect, useRef } from 'react'

export default function ShareDurationTracker({ token }: { token: string }) {
  const start = useRef(Date.now())
  const sent = useRef(false)

  useEffect(() => {
    const sessionId = crypto.randomUUID().slice(0, 16)
    const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'

    function sendDuration() {
      if (sent.current) return
      sent.current = true
      const seconds = Math.round((Date.now() - start.current) / 1000)
      navigator.sendBeacon(
        '/api/share/view',
        new Blob(
          [JSON.stringify({ token, sessionId, durationSeconds: seconds, deviceType: device })],
          { type: 'application/json' }
        )
      )
    }

    window.addEventListener('beforeunload', sendDuration)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendDuration()
    })

    return () => {
      window.removeEventListener('beforeunload', sendDuration)
      sendDuration()
    }
  }, [token])

  return null
}
