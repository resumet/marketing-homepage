import 'server-only';
import { defaults, validateContent, type SiteContent } from './content';
export const isConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
class SupabaseError extends Error {
  constructor(public readonly code: string | undefined, message: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}
export async function supabase(path: string, init: RequestInit = {}) {
  if (!isConfigured()) throw new Error('Supabase 연결을 먼저 설정해주세요.');
  const response = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...init, cache: 'no-store', headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, ...init.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const code = typeof body?.code === 'string' ? body.code : undefined;
    console.error('Supabase request failed:', response.status, code);
    const needsSchema = code === 'PGRST205' || code === 'PGRST202' || code === '42P01';
    throw new SupabaseError(code, needsSchema
      ? 'Supabase 초기화가 필요합니다. SQL Editor에서 supabase/schema.sql 전체를 실행한 뒤 다시 시도해주세요.'
      : '데이터 연결에 실패했습니다. Supabase URL과 서버 전용 키를 확인해주세요.');
  }
  return response;
}
export async function readContent(): Promise<SiteContent> {
  if (!isConfigured()) return structuredClone(defaults);
  let response: Response;
  try {
    response = await supabase('/rest/v1/site_content?id=eq.1&select=data');
  } catch (error) {
    // A new project has no content table until schema.sql is applied.
    // Only this setup state uses defaults; auth/network/data errors remain visible.
    if (error instanceof SupabaseError && error.code === 'PGRST205') {
      return structuredClone(defaults);
    }
    throw error;
  }
  const rows = await response.json();
  return rows.length ? validateContent(rows[0].data) : structuredClone(defaults);
}
export async function writeContent(data: SiteContent) {
  await supabase('/rest/v1/site_content?on_conflict=id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }) });
}
