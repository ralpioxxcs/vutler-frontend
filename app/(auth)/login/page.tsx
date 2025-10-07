'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { login } from '@/pages/api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/'); // Redirect to main page on successful login
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    console.log('Redirecting to sign up');
    router.push('/signup');
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <div className='w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold'>V U T L E R</h1>
        </div>
        <form className='space-y-6' onSubmit={handleLogin}>
          <div>
            <label
              htmlFor='email'
              className='text-sm font-medium text-gray-700'
            >
              E-mail 주소
            </label>
            <input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='you@example.com'
            />
          </div>
          <div>
            <label
              htmlFor='password'
              className='text-sm font-medium text-gray-700'
            >
              비밀번호
            </label>
            <input
              id='password'
              name='password'
              type='password'
              autoComplete='current-password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='••••••••'
            />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {isLoading ? '로그인 중...' : '로그인하기'}
            </button>
          </div>
        </form>
        <div className='text-sm text-center'>
          <p className='text-gray-600'>
            계정이 없으신가요?{' '}
            <button
              onClick={handleSignUp}
              className='font-medium text-indigo-600 hover:text-indigo-500'
            >
              가입하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
