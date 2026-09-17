# 모멘텀 마케팅 홈페이지

Next.js + TypeScript + Supabase 기반 반응형 단일 페이지와 관리자입니다.

## 실행

```powershell
npm install
# .env.local이 없다면 복사합니다.
Copy-Item .env.example .env.local
# 아래 출력값을 SESSION_SECRET으로 설정합니다.
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

홈페이지: http://localhost:3000 / 관리자: http://localhost:3000/admin

초기 비밀번호는 `0000`입니다. Supabase가 없으면 개발 모드에서 편집 화면을 미리 볼 수 있으나 저장/업로드는 비활성화됩니다. 운영 관리자 로그인에는 Supabase와 SESSION_SECRET 설정이 필요합니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
   문의 접수 기능을 사용하려면 `supabase/inquiries.sql`도 실행합니다.
3. `.env.local`에 다음 값을 입력하고 개발 서버를 재시작합니다.

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
ADMIN_PASSWORD=0000
SESSION_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

4. `/admin`에서 로그인하여 설정을 저장합니다. 첫 저장 시 기본 콘텐츠를 포함한 전체 설정이 생성됩니다.

상품군은 4개로 고정되며 이름, 제목, 설명, 이미지(파일 업로드/HTTPS 주소)를 수정할 수 있습니다. 회사명, 전화, 이메일, 사무실 주소도 관리합니다. 연락처가 비어 있으면 ‘준비 중’으로 표시합니다.

서비스 역할 키는 서버 전용입니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요. RLS는 익명/일반 사용자에게 DB 접근을 허용하지 않습니다. 이미지 업로드는 JPG, PNG, WebP 최대 4MB이며 공개 URL로 표시합니다. 미사용/이전 이미지는 자동 삭제하지 않습니다.

관리자 세션은 HttpOnly 서명 쿠키(8시간), 로그인 제한은 Supabase 함수(15분당 IP별 10회)로 처리합니다. 개발 모드에서 DB 미연결 시 로그인 제한은 작동하지 않습니다. `ADMIN_PASSWORD`로 비밀번호를 변경할 수 있습니다.

## GitHub 업로드

저장소를 생성한 뒤 실행합니다. 기존 git 설정이 있다면 필요한 단계만 적용합니다.

```powershell
git init
git add .
git commit -m "Build marketing website and admin"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

`.env.local`은 git에서 제외합니다. `.env.example`만 공유합니다.

## Vercel 연결

1. Add New Project에서 GitHub 저장소를 선택합니다.
2. Next.js 프리셋, 저장소 루트 디렉터리를 사용합니다.
3. 위 4개 환경변수를 Production 및 필요한 Preview 환경에 등록합니다.
4. Deploy합니다. 환경변수 변경 후에는 재배포합니다.
5. `/admin`에서 저장 후 홈페이지를 새로고침하여 확인합니다.

GitHub 저장소와 Vercel 프로젝트가 연결되어 있으며, 운영 환경변수는 Vercel에서 관리합니다. 문의 기능 업데이트 시 `supabase/inquiries.sql`을 먼저 실행하세요.

## 고객 문의

홈페이지 하단에서 담당자 이름, 휴대폰 번호(010-0000-0000), 이메일 주소, 팩스번호(선택), 문의사항(최대 1,500자)을 접수합니다. 입력은 서버에서도 검증하며, 실패하면 내용을 유지합니다. 같은 요청을 재전송해도 중복 저장되지 않습니다. 발신 IP는 비밀 키 기반 해시로 저장하여 1시간당 5회로 접수를 제한합니다.

관리자 로그인 후 **접수된 문의**(`/admin/inquiries`)에서 최신순 목록, 상세 내용, 미확인 필터, 확인 완료 처리를 사용할 수 있습니다. 한 페이지에 20건씩 표시합니다. 문의 데이터는 공개 API로 조회할 수 없고 관리자 인증 후에만 표시됩니다.

문의 통합 테스트: `npx playwright test tests/inquiries.spec.ts`. 실제 Supabase에 자동 테스트 문의를 생성하고 테스트 종료 시 해당 문의만 삭제합니다. 운영 URL 검증 시 `INQUIRY_TEST_URL` 환경변수를 지정할 수 있습니다.

## 검증 및 파일

```powershell
npm run lint
npm run build
npm test
```

- 기본 콘텐츠: `src/lib/content.ts`
- 스타일: `src/app/globals.css`
- SQL: `supabase/schema.sql`
- 실제 회사명 확정 시 `src/app/layout.tsx`의 SEO 제목/설명도 수정합니다.
- 예시 이미지는 Unsplash 사진으로, 실제 고객 작업물이 아닙니다. 이미지 ID는 `DESIGN.md`에 기록합니다.
- 브라우저 테스트는 Chrome이 설치된 환경에서 Supabase 미연결 개발 모드 기준으로 실행합니다.

[Next.js Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data), [Supabase Storage 업로드](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
