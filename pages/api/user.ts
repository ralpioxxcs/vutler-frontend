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
  },
);

export interface UpdateUserProfileRequest {
  full_name?: string;
}

export const updateUserProfile = async (data: UpdateUserProfileRequest) => {
  const response = await apiClient.patch('/users/profile', data);
  return response.data;
};

export interface AddDeviceRequest {
  device_id: string;
  display_name: string;
  device_name: string;
  device_type: string;
  manufacturer: string;
  model: string;
  ip_address: string;
  port: string;
  role: string;
}

export interface AddDeviceResponse {
  added_at: string;
  device_id: string;
  device_name: string;
  device_type: string;
  display_name: string;
  id: string;
  ip_address: string;
  manufacturer: string;
  model: string;
  port: number;
  role: string;
  user_id: string;
}

export const addUserDevice = async (
  data: AddDeviceRequest,
): Promise<AddDeviceResponse> => {
  const response = await apiClient.post('/users/me/devices', data);
  return response.data;
};

export interface UserDevice {
  added_at: string;
  device_id: string;
  device_name: string;
  device_type: string;
  display_name: string;
  id: string;
  ip_address: string;
  manufacturer: string;
  model: string;
  port: number;
  role: string;
  user_id: string;
}

export const getUserDevices = async (): Promise<UserDevice[]> => {
  const response = await apiClient.get('/users/me/devices');

  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  if (response.data && Array.isArray(response.data.devices)) {
    return response.data.devices;
  }

  if (response.data && Array.isArray(response.data.items)) {
    return response.data.items;
  }

  return [];
};

export interface MediaMetadata {
  album_name: string | null;
  artist: string | null;
  images: Array<{ url: string }>;
  title: string | null;
}

export interface MediaStatus {
  content_id: string | null;
  current_time: number;
  duration: number | null;
  is_playing: boolean;
  media_metadata: MediaMetadata;
  player_state: string;
  volume: number;
}

export interface DeviceStatusData {
  deviceId: string;
  isConnected: boolean;
  media: MediaStatus;
}

export interface DeviceStatusResponse {
  data: DeviceStatusData;
  status: string;
}

export const getDeviceStatus = async (
  deviceId: string,
): Promise<DeviceStatusResponse> => {
  const response = await apiClient.get(
    `/users/me/devices/${deviceId}/status`,
  );
  return response.data;
};
