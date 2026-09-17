import { authenticated } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { randomUUID } from 'node:crypto';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  if (!(await authenticated())) return Response.json({ error: '다시 로그인해주세요.' }, { status: 401 });
  if (Number(request.headers.get('content-length')) > 4500000) return Response.json({ error: '4MB 이하 이미지를 선택해주세요.' }, { status: 413 });
  try {
    const form = await request.formData(); const file = form.get('file');
    if (!(file instanceof File) || file.size > 4194304 || file.size === 0) throw new Error('4MB 이하 이미지를 선택해주세요.');
    const data = Buffer.from(await file.arrayBuffer());
    const mime = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff ? 'image/jpeg' : data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : '';
    if (!mime || mime !== file.type) throw new Error('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
    const name = `${randomUUID()}.${mime.split('/')[1]}`;
    await supabase(`/storage/v1/object/product-images/${name}`, { method: 'POST', headers: { 'Content-Type': mime }, body: data });
    return Response.json({ url: `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${name}` });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : '업로드하지 못했습니다.' }, { status: 400 }); }
}
