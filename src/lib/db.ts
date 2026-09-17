import 'server-only';
import { defaults, validateContent, type SiteContent } from './content';
export const isConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function supabase(path: string, init: RequestInit = {}) {
  if (!isConfigured()) throw new Error('Supabase 연결을 먼저 설정해주세요.');
  const response = await fetch(`${process.env.SUPABASE_URL}${path}`, { ...init, cache: 'no-store', headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, ...init.headers } });
  if (!response.ok) { console.error('Supabase request failed:', response.status); throw new Error('데이터 연결에 실패했습니다. Supabase 설정과 초기화 SQL을 확인해주세요.'); }
  return response;
}
export async function readContent(): Promise<SiteContent> {
  if (!isConfigured()) return structuredClone(defaults);
  const response = await supabase('/rest/v1/site_content?id=eq.1&select=data');
  const rows = await response.json();
  return rows.length ? validateContent(rows[0].data) : structuredClone(defaults);
}
export async function writeContent(data: SiteContent) {
  await supabase('/rest/v1/site_content?on_conflict=id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }) });
}
