export interface User {
  UserId: string;
  Name: string;
  Email: string;
  Role: 'Admin' | 'Editor';
  CreatedAt: string;
}

export interface AuthResponse {
  Token: string;
  UserId: string;
  Name: string;
  Email: string;
  Role: 'Admin' | 'Editor';
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface CreateUserRequest {
  Name: string;
  Email: string;
  Password: string;
  Role: 'Admin' | 'Editor';
}

export interface WorkstationAsset {
  AssetId: string;
  OrderId: string;
  Title: string;
  OriginalFileName: string;
  ExternalSourceUrl: string;
  StoragePathHighFidelity?: string;
  StoragePathProxy?: string;
  WaveformJsonPath?: string;
  FileSizeBytes: number;
  MimeType: string;
  DurationSeconds: number;
  FrameRate: number;
  Width: number;
  Height: number;
  AudioChannels: number;
  TimecodeStart: string;
  Status: 'Pending' | 'Downloading' | 'Transcoding' | 'Ready' | 'Failed';
  CreatedAt: string;
  Markers?: TimecodeMarker[];
}

export interface TimecodeMarker {
  MarkerId: string;
  AssetId: string;
  InTimecode: string;
  OutTimecode: string;
  InFrame: number;
  OutFrame: number;
  Label: string;
  Notes?: string;
  ColorHex: string;
  CreatedByUserId: string;
  CreatedAt: string;
  CreatedByUser?: User;
}

export interface OrderEditor {
  OrderEditorId: string;
  OrderId: string;
  UserId: string;
  AssignedAt: string;
  User?: User;
}

export interface Order {
  OrderId: string;
  Title: string;
  BriefingText?: string;
  Status: 'Draft' | 'InProduction' | 'InReview' | 'Completed' | 'Cancelled';
  CreatedByUserId: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUser?: User;
  AssignedEditors?: OrderEditor[];
  Assets?: WorkstationAsset[];
}
