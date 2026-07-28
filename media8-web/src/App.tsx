import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import type { User, Project } from './types';
import { AuthService, ProjectService, UserService } from './services/api';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WorkstationPage } from './pages/WorkstationPage';
import { JobsPage } from './pages/JobsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  user: User | null;
  allowedRoles?: string[];
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ user, allowedRoles, children }) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.Role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Mock Fallback Projects for Demonstration
const MOCK_PROJECTS: Project[] = [
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

export function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const navigate = useNavigate();

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
            AvatarUrl: parsed.AvatarUrl,
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
      navigate('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  // Fetch Projects and Users for System Context
  const loadProjects = useCallback(async () => {
    try {
      const res = await ProjectService.getProjects({ limit: 5 });
      const itemsList = Array.isArray(res) ? res : (res?.Items || []);

      if (itemsList.length > 0) {
        setProjects(itemsList);
        setActiveProject((prev) => prev || itemsList[0]);
      } else {
        setProjects(MOCK_PROJECTS);
        setActiveProject((prev) => prev || MOCK_PROJECTS[0]);
      }
    } catch {
      setProjects(MOCK_PROJECTS);
      setActiveProject((prev) => prev || MOCK_PROJECTS[0]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await UserService.getUsers();
      const userItems = Array.isArray(data) ? data : (data as any)?.Items || [];
      setUsers(userItems);
    } catch {
      if (currentUser) {
        setUsers([currentUser]);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadUsers();
    }
  }, [currentUser, loadProjects, loadUsers]);

  const handleOpenWorkstationForProject = (project: Project) => {
    setActiveProject(project);
    navigate(`/workstation/${project.ProjectId}`);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-[#400404] flex flex-col items-center justify-center text-[#FFFBED]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#FFFBED]" />
        <p className="text-sm font-semibold tracking-wide">Carregando Media 8 Workstation...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Route: /login */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                navigate('/');
              }}
            />
          )
        }
      />

      {/* Protected Routes Layout */}
      <Route
        element={
          <RequireAuth user={currentUser}>
            {currentUser && (
              <AppLayout
                currentUser={currentUser}
                onLogout={() => {
                  AuthService.logout();
                  setCurrentUser(null);
                  navigate('/login');
                }}
              />
            )}
          </RequireAuth>
        }
      >
        <Route
          path="/"
          element={
            currentUser && (
              <DashboardPage
                projects={projects}
                currentUser={currentUser}
                onNavigateTab={(tab) => navigate(tab === 'dashboard' ? '/' : `/${tab}`)}
                onOpenWorkstation={handleOpenWorkstationForProject}
              />
            )
          }
        />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route
          path="/projects"
          element={
            currentUser && (
              <ProjectsPage
                currentUser={currentUser}
                users={users}
                onOpenWorkstation={handleOpenWorkstationForProject}
              />
            )
          }
        />
        <Route
          path="/workstation"
          element={
            <WorkstationPage
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onRefreshProjects={loadProjects}
            />
          }
        />
        <Route
          path="/workstation/:projectId"
          element={
            <WorkstationPage
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onRefreshProjects={loadProjects}
            />
          }
        />
        <Route path="/jobs" element={<JobsPage />} />
        <Route
          path="/users"
          element={
            currentUser && (
              <RequireAuth user={currentUser} allowedRoles={['Admin']}>
                <UsersPage
                  users={users}
                  projects={projects}
                  currentUser={currentUser}
                  onRefreshUsers={loadUsers}
                  onUpdateCurrentUser={(updated) => {
                    setCurrentUser(updated);
                    localStorage.setItem('media8_user', JSON.stringify(updated));
                  }}
                />
              </RequireAuth>
            )
          }
        />
        <Route path="/settings" element={currentUser && <SettingsPage currentUser={currentUser} />} />
        <Route path="/config" element={<Navigate to="/settings" replace />} />
        <Route path="/storage" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
