'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle } from '@phosphor-icons/react';

export function InquiryForm() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const submission = useRef<string | null>(null);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    submission.current ??= crypto.randomUUID();
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submission.current, name: fields.get('name'), phone, email: fields.get('email'), fax: fields.get('fax'), message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '문의 접수에 실패했습니다.');
      setSuccess(result.success);
      form.reset();
      setPhone('');
      setMessage('');
      submission.current = null;
    } catch (error) {
      setError(error instanceof Error ? error.message : '연결이 끊겼습니다. 다시 시도해주세요.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return <div className="inquiry-section">
    <div className="inquiry-intro"><p className="eyebrow">Start a conversation</p><h3>어떤 성장을<br/>함께 만들까요?</h3><p>담당자 정보와 문의 내용을 남겨주세요.<br/>내용을 확인한 후 연락드리겠습니다.</p></div>
    {success ? <div className="inquiry-success" role="status"><CheckCircle size={40}/><h3>문의해주셔서 감사합니다.</h3><p>{success}</p><button type="button" className="button primary" onClick={() => setSuccess('')}>새 문의 작성</button></div> :
      <form className="inquiry-form" onSubmit={submit} aria-label="프로젝트 문의 폼">
        <fieldset disabled={pending}>
          <div className="inquiry-fields">
            <div><label htmlFor="inquiry-name">담당자 이름 <span>필수</span></label><input id="inquiry-name" name="name" autoComplete="name" required maxLength={80} placeholder="담당자 이름을 입력해주세요"/></div>
            <div><label htmlFor="inquiry-phone">휴대폰 번호 <span>필수</span></label><input id="inquiry-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required pattern="010-[0-9]{4}-[0-9]{4}" maxLength={13} placeholder="010-0000-0000" value={phone} onChange={event => { const digits = event.target.value.replace(/\D/g, '').slice(0, 11); setPhone(digits.length > 7 ? `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}` : digits.length > 3 ? `${digits.slice(0,3)}-${digits.slice(3)}` : digits); }}/></div>
            <div><label htmlFor="inquiry-email">이메일 주소 <span>필수</span></label><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@company.com"/></div>
            <div><label htmlFor="inquiry-fax">팩스번호 <span>선택</span></label><input id="inquiry-fax" name="fax" type="tel" maxLength={30} placeholder="02-0000-0000"/></div>
          </div>
          <label htmlFor="inquiry-message">문의사항 <span>필수</span></label><textarea id="inquiry-message" name="message" required maxLength={1500} rows={7} value={message} onChange={e => setMessage(e.target.value)} placeholder="필요한 서비스, 프로젝트 일정 등 궁금한 내용을 자유롭게 남겨주세요." aria-describedby="inquiry-counter"/>
          <p className="field-hint inquiry-counter" id="inquiry-counter">{message.length.toLocaleString()} / 1,500자</p>
          <div className="inquiry-submit"><p>입력하신 연락처는 문의 답변을 위해 사용됩니다.</p><button className="button primary" type="submit">{pending ? '접수 중…' : '문의하기'}<ArrowUpRight size={20}/></button></div>
        </fieldset>
        {error && <p className="notice error" role="alert">{error}</p>}
      </form>}
  </div>;
}
