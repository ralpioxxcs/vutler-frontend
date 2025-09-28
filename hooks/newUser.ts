import axios from 'axios';

const apiClient = axios.create({
  //baseURL: process.env.NEXT_PUBLIC_USER_SERVICE_API_URL,
  baseURL: "http://127.0.0.1:5000",
  withCredentials: true,
});

export const getMyInfo = async () => {
  const { data } = await apiClient.get('/users/me');
  return data;
};
