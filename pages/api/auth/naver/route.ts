import { NextResponse } from 'next/server';

export async function GET() {
  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
  const NAVER_CALLBACK_URL = process.env.NAVER_CALLBACK_URL;
  // CSRF 공격 방지를 위한 상태 값 (실제로는 랜덤 문자열 생성 로직 필요)
  const state = 'YOUR_UNIQUE_STATE_STRING';

  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_CALLBACK_URL}&state=${state}`;

  // 사용자를 네이버 인증 URL로 리디렉션
  return NextResponse.redirect(naverAuthUrl);
}
