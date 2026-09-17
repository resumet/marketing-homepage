import 'server-only';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
const localSecret = randomBytes(32).toString('hex');
function secret() {
  const key = process.env.SESSION_SECRET;
  if (key && key.length >= 32) return key;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET을 32자 이상으로 설정해주세요.');
  return localSecret;
}
function signature(value: string) { return createHmac('sha256', secret()).update(value).digest('hex'); }
export function equal(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export async function authenticated() {
  const token = (await cookies()).get('momentum_session')?.value;
  if (!token) return false;
  const [expires, sig] = token.split('.');
  return Boolean(expires && sig && Number(expires) > Date.now() && equal(sig, signature(expires)));
}
export async function createSession() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  (await cookies()).set('momentum_session', `${expires}.${signature(expires)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 });
}
