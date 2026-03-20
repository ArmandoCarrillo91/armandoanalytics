import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Caché en memoria — vive mientras la instancia de Node esté activa
const cache = new Map<string, { client: SupabaseClient; cachedAt: number }>()
const TTL_MS = 1000 * 60 * 5 // 5 minutos

export function getTenantClientCached(
  slug: string,
  dbUrl: string,
  dbAnonKey: string
): SupabaseClient {
  const cached = cache.get(slug)
  const now = Date.now()

  if (cached && now - cached.cachedAt < TTL_MS) {
    return cached.client
  }

  const client = createClient(dbUrl, dbAnonKey)
  cache.set(slug, { client, cachedAt: now })
  return client
}

export function invalidateTenantCache(slug: string) {
  cache.delete(slug)
}