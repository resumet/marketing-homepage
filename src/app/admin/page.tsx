import type { Metadata } from 'next';
import { authenticated } from '@/lib/auth';
import { isConfigured, readContent } from '@/lib/db';
import { AdminEditor, LoginForm } from '@/components/admin';
export const metadata: Metadata = { title: '사이트 관리자', robots: { index: false, follow: false } };
export default async function AdminPage() { if (!(await authenticated())) return <LoginForm/>; return <AdminEditor initial={await readContent()} configured={isConfigured()}/>; }
