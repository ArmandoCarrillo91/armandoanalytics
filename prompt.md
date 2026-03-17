Implementa el sistema de share links en ArmandoAnalytics.
Tenemos dos tablas nuevas en Supabase de AA:

share_links:
  id, tenant_id, dashboard_slug, created_by, recipient_email, 
  recipient_name, token, type (public/personal), expires_at, 
  created_at, view_count, last_viewed_at

share_link_views:
  id, share_link_id, viewed_at, duration_seconds, device_type, 
  country, session_id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 1 — Crea src/components/SharePopover.tsx

Client Component. Recibe: dashboardSlug, tenantId, tenantName, dashboardName

UI exactamente así:
- Botón "Compartir" en el topbar con ícono de share
- Al hacer clic abre un popover (posición: absolute, top: 56px, right: 16px, 
  width: 340px) con overlay oscuro detrás que cierra al hacer clic fuera

Dentro del popover:

SECCIÓN 1 — Link activo:
- Input con el link generado: aa.mx/share/{token}
- Botón "Copiar" que copia al clipboard y cambia a "✓ Copiado" por 2s
- 4 opciones de share en grid 2x2:
  WhatsApp (abre wa.me con el link), Email (abre mailto con el link),
  QR (muestra un QR simple generado con qrcode.react o CSS), 
  Más opciones (usa navigator.share si disponible)

SECCIÓN 2 — Invitación personal (tab o sección debajo):
- Input email del destinatario
- Input nombre (opcional)  
- Select expiración: 24 horas / 7 días / 30 días / Sin expiración
- Botón "Generar link personal"
- Al hacer submit: POST /api/share/create con los datos

SECCIÓN 3 — Footer del popover:
- "X visitas · creado hace Xh" 
- Select de expiración para el link público actual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 2 — Crea src/app/api/share/create/route.ts

POST. Recibe: tenantId, dashboardSlug, type, recipientEmail, 
recipientName, expiresIn (horas, null = sin expiración)

1. Verifica sesión del usuario
2. Inserta en share_links con:
   - token: generado con crypto.randomUUID().slice(0,16)
   - created_by: user.id
   - expires_at: NOW() + expiresIn horas (si aplica)
3. Retorna el token y el link completo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 3 — Crea src/app/api/share/view/route.ts

POST. Recibe: token, sessionId, durationSeconds, deviceType

1. Busca el share_link por token
2. Verifica que no esté expirado
3. Inserta en share_link_views
4. Incrementa view_count en share_links
5. Actualiza last_viewed_at
6. Retorna los datos del dashboard (tenantId, dashboardSlug)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 4 — Crea src/app/share/[token]/page.tsx

Server Component. Recibe el token de la URL.

1. Llama a /api/share/view para registrar la visita
2. Si el link no existe o expiró: muestra página de error simple
3. Si es válido: renderiza el dashboard en modo lectura
   - Sin sidebar, sin topbar de AA
   - Solo el contenido del dashboard
   - Banner sutil al pie: "Vista compartida · Energy Cycle Studio"
   - Registra duración con un useEffect en el cliente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 5 — Agrega SharePopover al topbar de Energy

En src/app/dashboard/(tenants)/energy/page.tsx agrega el botón 
SharePopover con:
  dashboardSlug="summary"
  tenantId={tenantId} (obtenlo del fetch de tenant)
  tenantName="Energy Cycle Studio"
  dashboardName="Summary"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 6 — Actualiza la tab "Links compartidos" en UsuariosView.tsx

Fetch real de share_links WHERE tenant_id = tenant seleccionado
JOIN share_link_views para el conteo real de visitas
Columnas: Dashboard, Tipo (pill público/personal), Destinatario, 
Expira, Visitas totales, Último acceso

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTILOS:
- Mismo sistema de variables CSS del proyecto
- Pills: público=#E6F1FB/#0C447C, personal=#EEEDFE/#3C3489
- El popover tiene box-shadow: 0 4px 24px rgba(0,0,0,0.12)
- Overlay: rgba(0,0,0,0.25)

RESTRICCIONES:
- No toques Taller
- Archivos máximo 200 líneas
- Corre npm run build al final y reporta errores
- Muéstrame cada archivo antes de pasar al siguiente