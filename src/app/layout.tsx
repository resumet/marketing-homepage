import type { Metadata } from 'next';
import localFont from 'next/font/local';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
const pretendard = localFont({ src: '../../node_modules/pretendard/dist/web/variable/woff2-dynamic-subset/PretendardVariable.subset.91.woff2', variable: '--font-pretendard', display: 'swap', fallback: ['Pretendard Variable', 'Arial'] });
export const metadata: Metadata = { title: '모멘텀 | 브랜드의 다음을 만드는 마케팅 파트너', description: '브랜딩, 퍼포먼스 광고, 콘텐츠 마케팅, 웹사이트 제작. 브랜드의 가능성을 비즈니스의 성장으로 연결합니다.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body className={pretendard.variable}>{children}</body></html>; }
