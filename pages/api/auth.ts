import { tokenManager } from '@/lib/auth';

const baseURL = process.env.NEXT_PUBLIC_AUTH_SERVER;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  message?: string;
  access_token?: string;
  refresh_token?: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const url = `${baseURL}/auth/login`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '로그인에 실패했습니다.');
    }

    const result = await response.json();
    
    // Save tokens to localStorage
    if (result.access_token) {
      tokenManager.setToken(result.access_token);
    }
    if (result.refresh_token) {
      tokenManager.setRefreshToken(result.refresh_token);
    }

    return result;
  } catch (err) {
    console.error(`Login error: ${err}`);
    throw err;
  }
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const url = `${baseURL}/auth/register`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }

    return await response.json();
  } catch (err) {
    console.error(`Registration error: ${err}`);
    throw err;
  }
}

export function logout(): void {
  tokenManager.clearTokens();
}
