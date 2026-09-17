'use server';
import { cookies, headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authenticated, createSession, equal } from '@/lib/auth';
import { isConfigured, supabase, writeContent } from '@/lib/db';
import { validateContent } from '@/lib/content';
export type ActionResult = { error?: string; success?: string };
export async function login(_: ActionResult, form: FormData): Promise<ActionResult> {
  const password = String(form.get('password') || '');
  try {
    if (isConfigured()) {
      const h = await headers();
      const ip = h.get('x-vercel-forwarded-for') || h.get('x-forwarded-for')?.split(',')[0] || 'shared';
      const key = createHash('sha256').update(ip).digest('hex');
      const result = await supabase('/rest/v1/rpc/allow_admin_attempt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempt_key: key }) });
      if (!(await result.json())) return { error: '로그인 시도가 많습니다. 15분 후 다시 시도해주세요.' };
    } else if (process.env.NODE_ENV === 'production') return { error: 'Supabase 연결을 설정한 후 로그인할 수 있습니다.' };
    if (password.length > 200 || !equal(password, process.env.ADMIN_PASSWORD || '0000')) return { error: '비밀번호가 올바르지 않습니다.' };
    await createSession();
  } catch (error) { return { error: error instanceof Error ? error.message : '로그인에 실패했습니다.' }; }
  redirect('/admin');
}
export async function logout() { (await cookies()).delete('momentum_session'); redirect('/admin'); }
export async function saveContent(input: unknown): Promise<ActionResult> {
  try {
    if (!(await authenticated())) return { error: '로그인이 만료되었습니다. 다시 로그인해주세요.' };
    await writeContent(validateContent(input));
    revalidatePath('/'); revalidatePath('/admin');
    return { success: '저장했습니다. 홈페이지에 변경 사항이 반영되었습니다.' };
  } catch (error) { return { error: error instanceof Error ? error.message : '저장하지 못했습니다. 다시 시도해주세요.' }; }
}
