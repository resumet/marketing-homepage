'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markInquiry } from '@/app/admin/inquiries/actions';
import type { Inquiry } from '@/lib/inquiry';

export function RefreshInquiries() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="button primary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? '불러오는 중…' : '새로고침'}</button>;
}

export function InquiryItem({ inquiry }: { inquiry: Inquiry }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  return <details className="inquiry-item">
    <summary><span className={`inquiry-badge ${inquiry.is_read ? 'read' : ''}`}>{inquiry.is_read ? '확인 완료' : '새 문의'}</span><strong>{inquiry.name}</strong><span className="inquiry-preview">{inquiry.message}</span><time dateTime={inquiry.created_at}>{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(inquiry.created_at))}</time></summary>
    <div className="inquiry-detail"><dl><div><dt>담당자 이름</dt><dd>{inquiry.name}</dd></div><div><dt>휴대폰 번호</dt><dd><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></dd></div><div><dt>이메일 주소</dt><dd><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></dd></div><div><dt>팩스번호</dt><dd>{inquiry.fax || '미입력'}</dd></div></dl><h2>문의사항</h2><p className="inquiry-message">{inquiry.message}</p><button className="button primary" disabled={pending} onClick={() => { setError(''); startTransition(async () => { try { const result = await markInquiry(inquiry.id, !inquiry.is_read); if (result.error) setError(result.error); } catch { setError('연결이 끊겼습니다. 다시 시도해주세요.'); } }); }}>{pending ? '저장 중…' : inquiry.is_read ? '미확인으로 변경' : '확인 완료로 표시'}</button>{error && <p className="notice error" role="alert">{error}</p>}</div>
  </details>;
}
