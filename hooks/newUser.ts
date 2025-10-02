import axios from 'axios';
import { tokenManager } from '@/lib/auth';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_SERVER,
  withCredentials: true,
});

// Add request interceptor to include Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getMyInfo = async () => {
  const { data } = await apiClient.get('/users/profile');
  return data;
};
