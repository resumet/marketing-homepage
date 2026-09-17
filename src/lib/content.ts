export type Product = { id: number; title: string; category: string; description: string; image: string };
export type SiteContent = { company: string; phone: string; email: string; address: string; products: Product[] };
export const defaults: SiteContent = {
  company: '모멘텀', phone: '', email: '', address: '',
  products: [
    { id: 1, title: '브랜드의 이유를 만듭니다.', category: '브랜딩', description: '브랜드가 지닌 고유한 가치를 발견하고 고객의 언어로 정리합니다. 브랜드 전략부터 네이밍, 비주얼 아이덴티티까지 일관된 경험을 설계합니다.', image: '/images/branding.jpg' },
    { id: 2, title: '클릭을 넘어, 비즈니스의 성장으로.', category: '퍼포먼스 광고', description: '목표와 고객 여정에 맞는 매체를 선택합니다. 검색 광고와 소셜 광고를 운영하고, 데이터를 바탕으로 소재와 랜딩 페이지를 지속적으로 개선합니다.', image: '/images/performance.jpg' },
    { id: 3, title: '지나치지 못할 이야기를 만듭니다.', category: '콘텐츠 마케팅', description: '고객이 궁금해하는 이야기에서 시작합니다. 소셜 콘텐츠, 브랜드 사진과 영상, 채널 운영을 연결해 오래 기억되는 브랜드를 만듭니다.', image: '/images/content.jpg' },
    { id: 4, title: '좋은 첫인상을, 다음 행동으로.', category: '웹사이트 제작', description: '브랜드의 개성과 사용자의 목적을 함께 담습니다. 기획, 반응형 디자인, 개발까지 연결해 방문이 문의로 이어지는 웹사이트를 제작합니다.', image: '/images/web.jpg' },
  ],
};
export function validateContent(input: unknown): SiteContent {
  if (!input || typeof input !== 'object') throw new Error('입력 내용을 확인해주세요.');
  const value = input as SiteContent;
  for (const field of ['company', 'phone', 'email', 'address'] as const) {
    if (typeof value[field] !== 'string' || value[field].length > 300) throw new Error('회사 정보는 300자 이내로 입력해주세요.');
  }
  if (!value.company.trim()) throw new Error('회사명을 입력해주세요.');
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new Error('이메일 형식을 확인해주세요.');
  if (value.phone && !/^[+\d\s()\-]{5,30}$/.test(value.phone)) throw new Error('전화번호 형식을 확인해주세요.');
  if (!Array.isArray(value.products) || value.products.length !== 4) throw new Error('상품군은 4개여야 합니다.');
  const products = value.products.map((p, i) => {
    if (p.id !== i + 1) throw new Error('상품 순서가 올바르지 않습니다.');
    for (const key of ['title', 'category', 'description', 'image'] as const) {
      if (typeof p[key] !== 'string' || !p[key].trim() || p[key].length > (key === 'description' ? 3000 : 1000)) throw new Error('상품의 모든 항목을 올바르게 입력해주세요.');
    }
    if (!/^\/images\/[a-zA-Z0-9._-]+$/.test(p.image)) {
      try { if (new URL(p.image).protocol !== 'https:') throw new Error(); } catch { throw new Error('이미지는 HTTPS 주소를 사용해주세요.'); }
    }
    return { id: p.id, title: p.title.trim(), category: p.category.trim(), description: p.description.trim(), image: p.image.trim() };
  });
  return { company: value.company.trim(), phone: value.phone.trim(), email: value.email.trim(), address: value.address.trim(), products };
}
