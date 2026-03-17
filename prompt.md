El dark mode está forzado a oscuro y no sigue la preferencia del OS.
Revisa estos archivos y muéstramelos completos:

1. src/app/globals.css
2. src/app/layout.tsx
3. src/components/ThemeToggle.tsx

Específicamente busca:
- Si hay una clase "dark" hardcodeada en el <html> o <body>
- Cómo está implementado el tema actualmente
- Si usa next-themes o una implementación custom

No modifiques nada todavía.