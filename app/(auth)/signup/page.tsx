'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/pages/api/auth';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordCheck) {
      setError('패스워드가 일치하지 않습니다.');
      return;
    }

    try {
      await register({ email, password, username });
      // Handle successful registration
      console.log('Registration successful');
      router.push('/login'); // Redirect to login page after successful registration
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <div className='w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold'>V U T L E R</h1>
          <p className='mt-2 text-gray-600'>계정을 생성합니다.</p>
        </div>
        <form className='space-y-6' onSubmit={handleSignUp}>
          <div>
            <label
              htmlFor='username'
              className='text-sm font-medium text-gray-700'
            >
              이름
            </label>
            <input
              id='username'
              name='username'
              type='text'
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='your_username'
            />
          </div>
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='••••••••'
            />
          </div>
          <div>
            <label
              htmlFor='passwordCheck'
              className='text-sm font-medium text-gray-700'
            >
              비밀번호 확인
            </label>
            <input
              id='passwordCheck'
              name='passwordCheck'
              type='password'
              required
              value={passwordCheck}
              onChange={(e) => setPasswordCheck(e.target.value)}
              className='w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='••••••••'
            />
          </div>
          {error && <p className='text-sm text-red-500'>{error}</p>}
          <div>
            <button
              type='submit'
              className='w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              가입하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
