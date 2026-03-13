Tengo dos bugs encadenados en ArmandoAnalytics:

1. Post-login redirige a `/dashboard` en lugar de `/taller/pulso`
2. El sidebar en `/dashboard` muestra "WORKSPACES" vacío y parpadea

Necesito que me muestres el contenido completo de estos archivos sin modificar nada:
- app/auth/callback/route.ts (o donde esté el callback de Supabase)
- app/dashboard/page.tsx (o layout.tsx de esa ruta)
- El componente del Sidebar (busca el archivo que renderiza "WORKSPACES" o "OTROS TENANTS")
- middleware.ts (si existe)

Solo muéstrame el código, no cambies nada todavía.