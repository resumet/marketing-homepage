export type InquiryInput = {
  id: string;
  name: string;
  phone: string;
  email: string;
  fax: string;
  message: string;
};
export type Inquiry = InquiryInput & { created_at: string; is_read: boolean };
export const inquiryIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateInquiry(input: unknown): InquiryInput {
  if (!input || typeof input !== 'object') throw new Error('입력 내용을 확인해주세요.');
  const data = input as Record<string, unknown>;
  const value = (key: string) => typeof data[key] === 'string' ? data[key].trim() : '';
  const result = { id: value('id'), name: value('name'), phone: value('phone'), email: value('email'), fax: value('fax'), message: value('message') };
  if (!inquiryIdPattern.test(result.id)) throw new Error('페이지를 새로고침한 뒤 다시 문의해주세요.');
  if (!result.name || result.name.length > 80) throw new Error('담당자 이름을 80자 이내로 입력해주세요.');
  if (!/^010-\d{4}-\d{4}$/.test(result.phone)) throw new Error('휴대폰 번호는 010-0000-0000 형태로 입력해주세요.');
  if (result.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error('올바른 이메일 주소를 입력해주세요.');
  if (result.fax && !/^[+\d][\d\s()-]{5,29}$/.test(result.fax)) throw new Error('팩스번호 형식을 확인해주세요.');
  if (!result.message || result.message.length > 1500) throw new Error('문의사항은 1자 이상 1,500자 이하로 입력해주세요.');
  return result;
}
