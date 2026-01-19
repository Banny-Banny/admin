This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음을 추가하세요:

```bash
NEXT_PUBLIC_API_BASE_URL=https://be-production-8aa2.up.railway.app
```

로컬 개발 시 백엔드가 다른 포트에서 실행 중이면 해당 포트로 변경하세요:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 개발 서버 실행

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 인증 기능

### 관리자 로그인

- 첫 화면 접속 시 관리자 로그인 페이지가 표시됩니다
- 이메일과 비밀번호로 로그인할 수 있습니다
- 로그인 성공 시 인증 토큰이 자동으로 저장되고 관리자 대시보드로 이동합니다
- 인증 토큰은 localStorage에 저장되며, 이후 API 요청에 자동으로 포함됩니다
- 토큰이 만료되면 자동으로 갱신됩니다

### 로그아웃

- Header 컴포넌트의 로그아웃 버튼을 클릭하여 로그아웃할 수 있습니다
- 로그아웃 시 저장된 인증 토큰이 삭제되고 로그인 페이지로 이동합니다

### 인증 상태 관리

- React Context API를 사용하여 전역 인증 상태를 관리합니다
- `useAuth()` 훅을 통해 인증 상태와 로그인/로그아웃 함수에 접근할 수 있습니다

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# admin
