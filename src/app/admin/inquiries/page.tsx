import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { authenticated } from '@/lib/auth';
import { supabase } from '@/lib/db';
import type { Inquiry } from '@/lib/inquiry';
import { InquiryItem, RefreshInquiries } from '@/components/inquiry-inbox';
import { logout } from '@/app/actions';

export const metadata: Metadata = { title: '접수된 문의 | 관리자', robots: { index: false, follow: false } };

export default async function InquiryPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  if (!(await authenticated())) redirect('/admin');
  const query = await searchParams;
  const page = Math.max(1, Math.min(100000, Number.parseInt(query.page || '1', 10) || 1));
  const unreadOnly = query.filter === 'unread';
  let inquiries: Inquiry[] = [];
  let count = 0;
  let error = '';
  try {
    const response = await supabase(`/rest/v1/inquiries?select=id,name,phone,email,fax,message,created_at,is_read&order=created_at.desc,id.desc&limit=20&offset=${(page - 1) * 20}${unreadOnly ? '&is_read=eq.false' : ''}`, { headers: { Prefer: 'count=exact' } });
    inquiries = await response.json();
    count = Number(response.headers.get('content-range')?.split('/')[1] || 0);
  } catch {
    error = '문의 목록을 불러오지 못했습니다. Supabase 연결과 supabase/inquiries.sql 실행 여부를 확인한 뒤 새로고침해주세요.';
  }
  const pageHref = (n: number) => `/admin/inquiries?page=${n}${unreadOnly ? '&filter=unread' : ''}`;
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="wordmark" href="/">m<span className="brand-dot">.</span><span>Website manager</span></Link><div className="sidebar-label">콘텐츠 관리</div><nav aria-label="관리 메뉴"><Link href="/admin">사이트 설정</Link><Link className="active" href="/admin/inquiries" aria-current="page">접수된 문의</Link></nav><Link className="preview-link" href="/" target="_blank">홈페이지 보기</Link><form action={logout}><button className="logout">로그아웃</button></form></aside><main className="admin-main"><header className="admin-heading"><div><p className="eyebrow">문의 관리</p><h1>접수된 문의</h1><p>고객이 남긴 연락처와 문의 내용을 확인하세요. 접수 시각은 한국 시간입니다.</p></div><RefreshInquiries/></header><nav className="inquiry-filters" aria-label="문의 필터"><Link href="/admin/inquiries" aria-current={!unreadOnly ? 'page' : undefined}>전체 문의</Link><Link href="/admin/inquiries?filter=unread" aria-current={unreadOnly ? 'page' : undefined}>미확인 문의</Link></nav>{error ? <p className="notice error" role="alert">{error}</p> : <><p className="inquiry-count">{count.toLocaleString()}건의 {unreadOnly ? '미확인 ' : ''}문의</p>{inquiries.length ? <div className="inquiry-list">{inquiries.map(inquiry => <InquiryItem key={inquiry.id} inquiry={inquiry}/>)}</div> : <div className="inquiry-empty">{unreadOnly ? '미확인 문의가 없습니다.' : '접수된 문의가 없습니다.'}</div>}<nav className="inquiry-pagination" aria-label="문의 페이지">{page > 1 && <Link href={pageHref(page - 1)}>이전</Link>}<span>{page} / {Math.max(1, Math.ceil(count / 20))}</span>{page * 20 < count && <Link href={pageHref(page + 1)}>다음</Link>}</nav></>}</main></div>;
}
