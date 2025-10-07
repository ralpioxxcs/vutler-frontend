import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // TODO: state 값 검증 로직 추가 (CSRF 방지)

  if (!code) {
    // 코드가 없는 경우 에러 처리
    return NextResponse.redirect(new URL('/login?error=NoCode', request.url));
  }

  try {
    // 백엔드 API로 인가 코드를 전송
    const response = await fetch(
      `${process.env.USER_SERVICE_API_URL}/auth/naver/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }), // 백엔드가 요구하는 형식에 맞게 body 구성
      },
    );

    if (!response.ok) {
      // 백엔드 API 통신 실패 시
      throw new Error('Failed to login with backend');
    }

    // 백엔드로부터 받은 로그인 성공 데이터
    const data = await response.json();
    const { access_token, refresh_token, user_id, email, full_name } = data;

    // 받은 토큰을 httpOnly 쿠키에 저장 (보안상 안전)
    cookies().set('accessToken', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    cookies().set('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });

    // 로그인 성공 후 사용자를 메인 페이지로 리디렉션
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Naver callback error:', error);
    // 에러 발생 시 로그인 페이지로 다시 보냄
    return NextResponse.redirect(
      new URL('/login?error=AuthFailed', request.url),
    );
  }
}
