import axios from 'axios';
import type {
  Project,
  WorkstationAsset,
  TimecodeMarker,
  AuthResponse,
  LoginRequest,
  User,
  CreateUserRequest,
  MediaProcessingJob,
  ProjectLink,
  PagedResult,
  ProjectStats,
  UserStats,
  UpdateUserRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
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
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/Users/Stats');
    return response.data;
  },

  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }): Promise<PagedResult<User>> => {
    const response = await api.get<PagedResult<User>>('/Users', { params });
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/Users', data);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/Users/${id}`, data);
    return response.data;
  },

  uploadAvatar: async (id: string, file: File | Blob): Promise<{ AvatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file, 'avatar.webp');
    const response = await api.post<{ AvatarUrl: string }>(`/Users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const ProjectService = {
  getProjects: async (params?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PagedResult<Project> | Project[]> => {
    const response = await api.get('/Projects', { params });
    return response.data;
  },

  getProjectStats: async (): Promise<ProjectStats> => {
    const response = await api.get<ProjectStats>('/Projects/Stats');
    return response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/Projects/${id}`);
    return response.data;
  },

  createProject: async (projectData: {
    Title: string;
    BriefingText?: string;
    ExternalOrderReference?: string;
    Deadline?: string;
    AutoIngest?: boolean;
    CreatedByUserId: string;
    LeadUserId?: string;
    AssignedEditors?: { UserId: string; AssignmentRole: string; IsLead?: boolean }[];
    Links?: ProjectLink[];
  }): Promise<Project> => {
    const response = await api.post<Project>('/Projects', projectData);
    return response.data;
  },

  updateProject: async (id: string, projectData: {
    Title: string;
    BriefingText?: string;
    ExternalOrderReference?: string;
    Deadline?: string;
    Status: string;
    AutoIngest?: boolean;
    LeadUserId?: string;
    AssignedEditors?: { UserId: string; AssignmentRole: string; IsLead?: boolean }[];
    Links?: ProjectLink[];
  }): Promise<Project> => {
    const response = await api.put<Project>(`/Projects/${id}`, projectData);
    return response.data;
  },

  triggerProjectIngest: async (id: string): Promise<{ EnqueuedCount: number; SkippedCount: number; TotalLinks: number }> => {
    const response = await api.post(`/Projects/${id}/TriggerIngest`);
    return response.data;
  },

  deleteProject: async (id: string, soft: boolean = true): Promise<void> => {
    await api.delete(`/Projects/${id}`, {
      params: { soft },
    });
  },
};

export const AssetService = {
  getAssetsByProject: async (projectId: string): Promise<WorkstationAsset[]> => {
    const response = await api.get<WorkstationAsset[]>(`/Assets/Project/${projectId}`);
    return response.data;
  },

  getAssetById: async (id: string): Promise<WorkstationAsset> => {
    const response = await api.get<WorkstationAsset>(`/Assets/${id}`);
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
    try {
      const response = await api.get<MediaProcessingJob[]>('/Jobs');
      return response.data;
    } catch {
      return [];
    }
  },
};
