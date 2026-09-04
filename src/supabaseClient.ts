import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'

// Singleton — stored on window so hot-reloads don't create a second instance
const GLOBAL_KEY = '__fib_supabase__'

function getClient() {
  if (typeof window !== 'undefined' && (window as any)[GLOBAL_KEY]) {
    return (window as any)[GLOBAL_KEY]
  }
  const client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    { auth: { storageKey: `sb-${projectId}-fib` } }   // unique key avoids collision with Make's own client
  )
  if (typeof window !== 'undefined') {
    (window as any)[GLOBAL_KEY] = client
  }
  return client
}

export const supabase = getClient()

/**
 * Save a landing-page lead to the `leads` table.
 * Requires the table + RLS policy to exist (run in Supabase SQL Editor):
 *
 *   create table if not exists leads (
 *     id           bigserial    primary key,
 *     contact_info text         not null,
 *     created_at   timestamptz  not null default now()
 *   );
 *   alter table leads enable row level security;
 *   create policy "anon insert" on leads for insert to anon with check (true);
 */
export async function saveLead(contactInfo: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .insert({ contact_info: contactInfo.trim() })

  if (error) throw new Error(error.message)
}
