import Link from 'next/link';
export default function NotFound() { return <main className="error-page"><h1>페이지를 찾을 수 없습니다.</h1><Link href="/" className="button primary">홈페이지로 돌아가기</Link></main>; }
