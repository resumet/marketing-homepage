'use server';

import { authenticated } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { inquiryIdPattern } from '@/lib/inquiry';
import { revalidatePath } from 'next/cache';

export async function markInquiry(id: string, isRead: boolean) {
  if (!(await authenticated())) return { error: '로그인이 만료되었습니다. 다시 로그인해주세요.' };
  if (!inquiryIdPattern.test(id) || typeof isRead !== 'boolean') return { error: '올바른 요청이 아닙니다.' };
  try {
    const response = await supabase(`/rest/v1/inquiries?id=eq.${id}&select=id`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ is_read: isRead }),
    });
    if (!(await response.json()).length) return { error: '문의 내역을 찾을 수 없습니다.' };
    revalidatePath('/admin/inquiries');
    return { success: true };
  } catch { return { error: '확인 상태를 저장하지 못했습니다. 다시 시도해주세요.' }; }
}
