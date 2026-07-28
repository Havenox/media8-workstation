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

export interface ProjectLink {
  ProjectLinkId?: string;
  ProjectId?: string;
  Url: string;
  LinkType: 'Folder' | 'Video' | 'Audio' | 'Image' | 'PDF' | 'Other';
}

export interface WorkstationAsset {
  AssetId: string;
  ProjectId: string;
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

export interface ProjectEditor {
  ProjectEditorId: string;
  ProjectId: string;
  UserId: string;
  AssignedAt: string;
  User?: User;
}

export interface Project {
  ProjectId: string;
  Title: string;
  BriefingText?: string;
  ExternalOrderReference?: string;
  Deadline?: string;
  Status: 'Draft' | 'InProduction' | 'InReview' | 'Completed' | 'Cancelled';
  AutoIngest?: boolean;
  IsDeleted?: boolean;
  CreatedByUserId: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUser?: User;
  AssignedEditors?: ProjectEditor[];
  Assets?: WorkstationAsset[];
  Links?: ProjectLink[];
}

export interface PagedResult<T> {
  Items: T[];
  Page: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
  HasNextPage: boolean;
}

export interface MediaProcessingJob {
  JobId: string;
  AssetId: string;
  JobType: 'IngestDownload' | 'GenerateHighFidelity' | 'GenerateProxy' | 'ExtractWaveform' | 'CutSubClip';
  Status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  Priority: number;
  Attempts: number;
  MaxAttempts: number;
  ErrorMessage?: string;
  LockedByWorkerId?: string;
  LockedAt?: string;
  CreatedAt: string;
  UpdatedAt: string;
  Asset?: WorkstationAsset;
}
