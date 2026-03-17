'use client'

import { useState } from 'react'

export default function InfoTooltip({ text, corner = false }: { text: string; corner?: boolean }) {
  const [show, setShow] = useState(false)

  const icon = (
    <svg
      className="w-3 h-3 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-help"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  )

  const tooltip = show && (
    <div className="absolute top-full mt-2 right-0 z-50 w-[280px] bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-lg p-3 shadow-lg">
      <p className="text-xs leading-relaxed" style={{ color: 'var(--taller-ink)' }}>{text}</p>
    </div>
  )

  if (corner) {
    return (
      <div
        className="absolute top-3 right-3"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {icon}
        {tooltip}
      </div>
    )
  }

  return (
    <span
      className="relative inline-flex items-center ml-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {icon}
      {tooltip}
    </span>
  )
}
