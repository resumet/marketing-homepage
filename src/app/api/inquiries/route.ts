import { createHmac } from 'node:crypto';
import { supabase } from '@/lib/db';
import { validateInquiry } from '@/lib/inquiry';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: '올바른 요청 형식이 아닙니다.' }, { status: 415 });
  }
  let data;
  try {
    if (Number(request.headers.get('content-length')) > 16000) throw new Error('입력 내용이 너무 깁니다.');
    const body = await request.text();
    if (body.length > 16000) throw new Error('입력 내용이 너무 깁니다.');
    data = validateInquiry(JSON.parse(body));
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? '입력 내용을 확인해주세요.' : error instanceof Error ? error.message : '입력 내용을 확인해주세요.' }, { status: 400 });
  }
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) throw new Error('Missing server secret');
    const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const result = await supabase('/rest/v1/rpc/submit_inquiry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: data.id, sender_name: data.name, sender_phone: data.phone, sender_email: data.email, sender_fax: data.fax, inquiry_message: data.message, sender_key: createHmac('sha256', secret).update(ip).digest('hex') }),
    });
    const status = await result.json();
    if (status === 'rate_limited') return Response.json({ error: '문의가 여러 번 접수되었습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 });
    if (status !== 'accepted') throw new Error('Unexpected submission response');
    return Response.json({ success: '문의가 접수되었습니다. 남겨주신 연락처로 답변드리겠습니다.' }, { status: 201 });
  } catch {
    return Response.json({ error: '지금은 문의를 접수할 수 없습니다. 잠시 후 다시 시도해주세요. 입력 내용은 유지됩니다.' }, { status: 503 });
  }
}
