import React, { useState, useEffect } from 'react';
import type { User, Project } from './types';
import { AuthService, ProjectService, UserService } from './services/api';
import { LoginPage } from './components/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WorkstationPage } from './pages/WorkstationPage';
import { JobsPage } from './pages/JobsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Mock Fallback Projects for Demonstration
  const mockProjects: Project[] = [
    {
      ProjectId: 'proj-101',
      Title: 'Vídeo Institucional Media 8 - 2026',
      BriefingText: 'Roteiro de 60 segundos com foco em cortes dinâmicos de backstage, depoimentos curtos e encerramento com motion logo.',
      ExternalOrderReference: 'ORD-9981',
      Status: 'InProduction',
      CreatedByUserId: 'user-admin',
      CreatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      UpdatedAt: new Date().toISOString(),
      Assets: [
        {
          AssetId: 'asset-01',
          ProjectId: 'proj-101',
          Title: 'Take 01 - Backstage Câmera A (4K)',
          OriginalFileName: 'A001_C001_0728_RAW.MOV',
          ExternalSourceUrl: 'https://drive.google.com/file/d/sample1',
          StoragePathProxy: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          FileSizeBytes: 1540000000,
          MimeType: 'video/mp4',
          DurationSeconds: 15.0,
          FrameRate: 29.97,
          Width: 3840,
          Height: 2160,
          AudioChannels: 2,
          TimecodeStart: '00:01:10:00',
          Status: 'Ready',
          CreatedAt: new Date().toISOString(),
        },
      ],
    },
  ];

  // Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('media8_token');
      const savedUserStr = localStorage.getItem('media8_user');

      if (!token) {
        setIsInitializing(false);
        return;
      }

      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setCurrentUser({
            UserId: parsed.UserId,
            Name: parsed.Name,
            Email: parsed.Email,
            Role: parsed.Role || 'Admin',
            CreatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      try {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
      } catch {
        // Keeps cached user or forces login
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, []);

  // Listen for unauthorized 401 events
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      localStorage.removeItem('media8_token');
      localStorage.removeItem('media8_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Fetch Projects and Users for Dashboard & System Context
  const loadProjects = async () => {
    try {
      const res = await ProjectService.getProjects({ limit: 5 });
      const itemsList = Array.isArray(res) ? res : (res?.Items || []);

      if (itemsList.length > 0) {
        setProjects(itemsList);
        if (!activeProject) setActiveProject(itemsList[0]);
      } else {
        setProjects(mockProjects);
        if (!activeProject) setActiveProject(mockProjects[0]);
      }
    } catch {
      setProjects(mockProjects);
      if (!activeProject) setActiveProject(mockProjects[0]);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await UserService.getUsers();
      setUsers(data);
    } catch {
      if (currentUser) {
        setUsers([currentUser]);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadUsers();
    }
  }, [currentUser]);

  const handleOpenWorkstationForProject = (project: Project) => {
    setActiveProject(project);
    setActiveTab('workstation');
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-[#400404] flex flex-col items-center justify-center text-[#FFFBED]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#FFFBED]" />
        <p className="text-sm font-semibold tracking-wide">Carregando Media 8 Workstation...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <MainLayout
      currentUser={currentUser}
      onLogout={() => {
        AuthService.logout();
        setCurrentUser(null);
      }}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'dashboard' && (
        <DashboardPage
          projects={projects}
          currentUser={currentUser}
          onNavigateTab={setActiveTab}
          onOpenWorkstation={handleOpenWorkstationForProject}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectsPage
          currentUser={currentUser}
          users={users}
          onOpenWorkstation={handleOpenWorkstationForProject}
        />
      )}

      {activeTab === 'workstation' && (
        <WorkstationPage
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          onRefreshProjects={loadProjects}
        />
      )}

      {activeTab === 'jobs' && <JobsPage />}

      {activeTab === 'users' && (
        <UsersPage
          users={users}
          projects={projects}
          currentUser={currentUser}
          onRefreshUsers={loadUsers}
        />
      )}

      {activeTab === 'settings' && <SettingsPage currentUser={currentUser} />}
    </MainLayout>
  );
}

export default App;
