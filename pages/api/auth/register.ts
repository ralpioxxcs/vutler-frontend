import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVER;
  if (!USER_SERVICE_URL) {
    console.error('USER_SERVICE_URL is not defined in environment variables');
    return res.status(500).json({ message: 'Internal server configuration error' });
  }

  try {
    const response = await fetch(`${USER_SERVICE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred' });
  }
}
