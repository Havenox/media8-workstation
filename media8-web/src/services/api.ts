import axios from 'axios';
import type { Project, WorkstationAsset, TimecodeMarker, AuthResponse, LoginRequest, User, CreateUserRequest, MediaProcessingJob } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

export const ProjectService = {
  getProjects: async (userId?: string, role?: string): Promise<Project[]> => {
    const response = await api.get<Project[]>('/Orders', {
      params: { userId, role },
    });
    return response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/Orders/${id}`);
    return response.data;
  },

  createProject: async (project: Partial<Project>): Promise<Project> => {
    const response = await api.post<Project>('/Orders', project);
    return response.data;
  },
};

// Compatibility Alias for legacy code
export const OrderService = {
  getOrders: ProjectService.getProjects,
  getOrderById: ProjectService.getProjectById,
  createOrder: ProjectService.createProject,
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

export const JobService = {
  getJobs: async (): Promise<MediaProcessingJob[]> => {
    // Endpoint mock fallback when offline
    try {
      const response = await api.get<MediaProcessingJob[]>('/Jobs');
      return response.data;
    } catch {
      return [];
    }
  },
};
