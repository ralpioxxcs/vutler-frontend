import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body;

  try {
    const response = await axios.post(
      'http://127.0.0.1:5000/auth/login',
      {
        email,
        password,
      }
    );

    const { access_token, refresh_token } = response.data;

    res.setHeader('Set-Cookie', [
      cookie.serialize('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60, // 1 hour
        path: '/',
        sameSite: 'strict',
      }),
      cookie.serialize('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'strict',
      }),
    ]);

    return res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res
        .status(error.response?.status || 500)
        .json({ message: error.response?.data?.message || 'An error occurred' });
    }
    return res.status(500).json({ message: 'An unknown error occurred' });
  }
}
