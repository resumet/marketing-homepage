'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { ArrowUpRight, Check, FloppyDisk, SignOut, UploadSimple } from '@phosphor-icons/react';
import { login, logout, saveContent, type ActionResult } from '@/app/actions';
import type { Product, SiteContent } from '@/lib/content';
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return <main className="login-page"><Link href="/" className="wordmark">m<span className="brand-dot">.</span></Link><section className="login-panel"><p className="eyebrow">Website manager</p><h1>관리자 로그인</h1><p>브랜드의 새로운 소식을 관리하세요.</p><form action={action}><label htmlFor="password">비밀번호</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={200} autoFocus placeholder="비밀번호를 입력하세요"/>{state.error && <p className="notice error" role="alert">{state.error}</p>}<button className="button primary" disabled={pending}>{pending ? '로그인 중…' : '로그인'}<ArrowUpRight size={20}/></button></form><Link href="/" className="back-link">홈페이지로 돌아가기</Link></section></main>;
}
export function AdminEditor({ initial, configured }: { initial: SiteContent; configured: boolean }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [tab, setTab] = useState<'products' | 'company'>('products');
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const dirty = JSON.stringify(content) !== saved;
  const product = content.products[selected];
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  function updateProduct(field: keyof Product, value: string) { setContent(old => ({ ...old, products: old.products.map((p, i) => i === selected ? { ...p, [field]: value } : p) })); setMessage({}); }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 4194304 || !['image/jpeg','image/png','image/webp'].includes(file.type)) { setMessage({ error: '4MB 이하의 JPG, PNG, WebP 파일을 선택해주세요.' }); return; }
    const productId = product.id;
    setUploading(true); setMessage({});
    try { const form = new FormData(); form.append('file', file); const response = await fetch('/api/upload', { method: 'POST', body: form }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setContent(old => ({ ...old, products: old.products.map(p => p.id === productId ? { ...p, image: result.url } : p) })); setMessage({ success: '이미지를 업로드했습니다. 변경 사항 저장을 눌러 적용해주세요.' }); } catch (error) { setMessage({ error: error instanceof Error ? error.message : '업로드에 실패했습니다.' }); } finally { setUploading(false); }
  }
  function save() { const snapshot = structuredClone(content); startTransition(async () => { try { const result = await saveContent(snapshot); setMessage(result); if (result.success) setSaved(JSON.stringify(snapshot)); } catch { setMessage({ error: '연결이 끊겼습니다. 입력 내용을 유지했으니 다시 저장해주세요.' }); } }); }
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="wordmark" href="/">m<span className="brand-dot">.</span><span>Website manager</span></Link><div className="sidebar-label">콘텐츠 관리</div><nav aria-label="관리 메뉴"><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>상품군 관리 <span>4</span></button><button className={tab === 'company' ? 'active' : ''} onClick={() => setTab('company')}>회사 정보</button><Link href="/admin/inquiries">접수된 문의</Link></nav><Link href="/" target="_blank" rel="noreferrer" className="preview-link">홈페이지 보기 <ArrowUpRight size={18}/></Link><form action={logout}><button className="logout"><SignOut size={18}/> 로그아웃</button></form></aside><main className="admin-main"><header className="admin-heading"><div><p className="eyebrow">사이트 설정</p><h1>{tab === 'products' ? '상품군 관리' : '회사 정보'}</h1><p>{tab === 'products' ? '네 가지 서비스의 이미지와 소개를 편집하세요.' : '고객이 연락할 수 있는 회사 정보를 설정하세요.'}</p></div><button onClick={save} className="button primary" disabled={pending || uploading || !configured || !dirty}><FloppyDisk size={19}/>{pending ? '저장 중…' : '변경 사항 저장'}</button></header>{!configured && <div className="notice">미리보기 모드입니다. Supabase 연결 후 저장과 이미지 업로드를 사용할 수 있습니다.</div>}<div className="save-state">{dirty ? '저장하지 않은 변경 사항이 있습니다.' : <><Check size={16}/> 변경 사항 없음</>}</div>{message.error && <div className="notice error" role="alert">{message.error}</div>}{message.success && <div className="notice success" role="status">{message.success}</div>}
      {tab === 'products' ? <><div className="product-tabs" role="tablist" aria-label="상품 선택">{content.products.map((p, i) => <button key={p.id} id={`tab-${i}`} role="tab" aria-selected={selected === i} aria-controls="product-panel" className={selected === i ? 'active' : ''} onClick={() => setSelected(i)}>0{p.id}<span>{p.category}</span></button>)}</div><section id="product-panel" role="tabpanel" aria-labelledby={`tab-${selected}`} className="editor-panel"><div className="image-editor"><label>대표 이미지</label><div className="admin-image"><Image key={product.image} src={/^https:\/\//.test(product.image) || /^\/images\/[\w.-]+$/.test(product.image) ? product.image : '/images/branding.jpg'} alt={`${product.category} 미리보기`} fill unoptimized sizes="480px"/></div><label className={`upload-button ${!configured || uploading ? 'disabled' : ''}`}><UploadSimple size={20}/>{uploading ? '업로드 중…' : '새 이미지 업로드'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!configured || uploading || pending} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/></label><p className="field-hint">JPG, PNG, WebP / 최대 4MB / 가로형 이미지 권장</p><label htmlFor="image-url">또는 이미지 주소</label><input id="image-url" value={product.image} onChange={e => updateProduct('image', e.target.value)} maxLength={1000} placeholder="https://…" disabled={pending || uploading}/></div><fieldset className="text-editor" disabled={pending}><label htmlFor="category">상품군 이름</label><input id="category" value={product.category} onChange={e => updateProduct('category', e.target.value)} maxLength={60}/><label htmlFor="title">제목</label><input id="title" value={product.title} onChange={e => updateProduct('title', e.target.value)} maxLength={150}/><label htmlFor="description">상세 설명</label><textarea id="description" rows={9} value={product.description} onChange={e => updateProduct('description', e.target.value)} maxLength={3000}/><p className="field-hint">{product.description.length.toLocaleString()} / 3,000자</p><div className="editor-tip">저장한 내용은 홈페이지 서비스 영역에 바로 반영됩니다.</div></fieldset></section></> : <fieldset className="company-editor" disabled={pending}>{([{ key: 'company', label: '회사명', placeholder: '모멘텀', type: 'text' }, { key: 'phone', label: '연락처', placeholder: '02-1234-5678', type: 'tel' }, { key: 'email', label: '이메일 주소', placeholder: 'hello@your-company.com', type: 'email' }, { key: 'address', label: '사무실 주소', placeholder: '도로명 주소와 상세 주소를 입력하세요', type: 'text' }] as const).map(f => <div key={f.key}><label htmlFor={f.key}>{f.label}</label><input id={f.key} type={f.type} value={content[f.key]} placeholder={f.placeholder} maxLength={300} onChange={e => { setContent(old => ({ ...old, [f.key]: e.target.value })); setMessage({}); }}/></div>)}<p className="field-hint">연락처가 비어 있으면 홈페이지에 ‘준비 중’으로 표시됩니다.</p></fieldset>}
    </main></div>;
}
