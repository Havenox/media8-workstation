export interface User {
  UserId: string;
  Name: string;
  Email: string;
  Role: 'Admin' | 'Editor';
  AvatarUrl?: string;
  AssignedProjectsCount?: number;
  CreatedAt: string;
}

export interface AuthResponse {
  Token: string;
  UserId: string;
  Name: string;
  Email: string;
  Role: 'Admin' | 'Editor';
  AvatarUrl?: string;
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
  AvatarUrl?: string;
}

export interface UpdateUserRequest {
  Name: string;
  Email: string;
  Role: 'Admin' | 'Editor';
  Password?: string;
  AvatarUrl?: string;
}

export interface UserStats {
  TotalUsers: number;
  AdminCount: number;
  EditorCount: number;
}

export interface ProjectStats {
  TotalCount: number;
  InProductionCount: number;
  InReviewCount: number;
  CompletedCount: number;
  DraftCount: number;
  CancelledCount: number;
}

export interface ProjectLink {
  ProjectLinkId?: string;
  ProjectId?: string;
  Url: string;
  LinkType: 'Folder' | 'Video' | 'Audio' | 'Image' | 'PDF' | 'Other';
}

export interface ProjectEditor {
  ProjectEditorId?: string;
  ProjectId?: string;
  UserId: string;
  AssignmentRole: 'General' | 'Decoupage' | 'AudioTreatment' | 'ColorGrading' | 'MotionGraphics' | 'Reviewer';
  IsLead?: boolean;
  AssignedAt?: string;
  User?: User;
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
}

export interface Project {
  ProjectId: string;
  Title: string;
  BriefingText?: string;
  ExternalOrderReference?: string;
  Deadline?: string;
  Status: 'Draft' | 'InProduction' | 'InReview' | 'Completed' | 'Cancelled';
  AutoIngest?: boolean;
  CreatedByUserId: string;
  LeadUserId?: string;
  CreatedAt: string;
  UpdatedAt: string;
  AssignedEditors?: ProjectEditor[];
  Assets?: WorkstationAsset[];
  Links?: ProjectLink[];
}

export interface CreateProjectRequest {
  Title: string;
  BriefingText?: string;
  ExternalOrderReference?: string;
  Deadline?: string;
  AutoIngest?: boolean;
  CreatedByUserId: string;
  LeadUserId?: string;
  AssignedEditors?: ProjectEditor[];
  Links?: ProjectLink[];
}

export interface UpdateProjectRequest {
  Title: string;
  BriefingText?: string;
  ExternalOrderReference?: string;
  Deadline?: string;
  Status: string;
  AutoIngest?: boolean;
  LeadUserId?: string;
  AssignedEditors?: ProjectEditor[];
  Links?: ProjectLink[];
}

export interface PagedResult<T> {
  Items: T[];
  TotalCount: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
  HasNextPage: boolean;
}
