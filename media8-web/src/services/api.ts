import axios from 'axios';
import type { Order, WorkstationAsset, TimecodeMarker, AuthResponse, LoginRequest, User, CreateUserRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching JWT Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('media8_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for handling 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('media8_token');
      localStorage.removeItem('media8_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/Auth/login', credentials);
    if (response.data && response.data.Token) {
      localStorage.setItem('media8_token', response.data.Token);
      localStorage.setItem('media8_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/Auth/me');
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('media8_token');
    localStorage.removeItem('media8_user');
  },
};

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/Users');
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/Users', data);
    return response.data;
  },
};

export const OrderService = {
  getOrders: async (userId?: string, role?: string): Promise<Order[]> => {
    const response = await api.get<Order[]>('/Orders', {
      params: { userId, role },
    });
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/Orders/${id}`);
    return response.data;
  },

  createOrder: async (order: Partial<Order>): Promise<Order> => {
    const response = await api.post<Order>('/Orders', order);
    return response.data;
  },
};

export const AssetService = {
  getAssetsByOrder: async (orderId: string): Promise<WorkstationAsset[]> => {
    const response = await api.get<WorkstationAsset[]>(`/Assets/Order/${orderId}`);
    return response.data;
  },

  getAssetById: async (id: string): Promise<WorkstationAsset> => {
    const response = await api.get<WorkstationAsset>(`/Assets/${id}`);
    return response.data;
  },

  ingestMedia: async (data: {
    OrderId: string;
    Title: string;
    ExternalSourceUrl: string;
    OriginalFileName: string;
  }): Promise<WorkstationAsset> => {
    const response = await api.post<WorkstationAsset>('/Assets/Ingest', data);
    return response.data;
  },
};

export const TimecodeService = {
  getMarkersByAsset: async (assetId: string): Promise<TimecodeMarker[]> => {
    const response = await api.get<TimecodeMarker[]>(`/TimecodeMarkers/Asset/${assetId}`);
    return response.data;
  },

  createMarker: async (marker: Partial<TimecodeMarker>): Promise<TimecodeMarker> => {
    const response = await api.post<TimecodeMarker>('/TimecodeMarkers', marker);
    return response.data;
  },

  deleteMarker: async (id: string): Promise<void> => {
    await api.delete(`/TimecodeMarkers/${id}`);
  },
};
