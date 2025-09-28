'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const BACKEND_NAVER_LOGIN_URL = 'http://127.0.0.1:5000/auth/naver/login';
  //process.env.NEXT_PUBLIC_BACKEND_NAVER_LOGIN_URL;

  return (
    <div className='flex flex-col items-center gap-10'>
      {/* 서비스 로고나 이름 */}

      <h1 className='text-4xl font-bold'>V U T L E R</h1>

      <Link href={BACKEND_NAVER_LOGIN_URL || '#'}>
        <Image
          src='/images/naver_login_btn.png'
          alt='네이버 아이디로 로그인'
          width={750}
          height={200}
          sizes='(max-width: 768px) 100vw, 50vw'
          style={{ width: '90%', height: 'auto' }}
          priority
        />
      </Link>
    </div>
  );
}
