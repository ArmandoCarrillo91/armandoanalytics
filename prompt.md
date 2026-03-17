CONTEXTO — ArmandoAnalytics (AA) + Energy Cycle Studio
Estoy buildando una plataforma SaaS multi-tenant de BI llamada ArmandoAnalytics (AA). Uno de los tenants activos es Energy Cycle Studio (estudio de ciclismo indoor).
El stack es:

Next.js (frontend)
Supabase (PostgreSQL + Auth + RLS) — base de datos de AA
La DB de Energy es una base de datos separada (también Postgres, también en Supabase) que conectamos como tenant externo

Ya tenemos avanzado el tenant de Energy en AA. Necesito que me respondas lo siguiente para poder continuar:

¿Cómo está configurada actualmente la conexión a la DB de Energy? ¿Hay un db_schema registrado en la tabla de AA, una connection string en variables de entorno, o un cliente Supabase separado instanciado?
¿Existe ya una página /dashboard/energy o similar? ¿Qué hay en ella actualmente?
¿Hay algún archivo Python en el proyecto, o el proyecto es 100% JavaScript/TypeScript?
¿Qué librerías de charting están instaladas? ¿Está echarts y echarts-for-react en el package.json?
¿Hay alguna API route (/api/...) que ya consulte la DB de Energy?

Por favor revisa el proyecto y respóndeme estas 5 preguntas antes de hacer cualquier cambio. No toques nada todavía.