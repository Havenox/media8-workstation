import React from 'react';
import { FolderKanban, Clock, Video, CheckCircle2, Plus, Play, Activity, HardDrive, ArrowRight } from 'lucide-react';
import type { Project, User } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface DashboardPageProps {
  projects: Project[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onOpenWorkstation: (project: Project) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  currentUser,
  onNavigateTab,
  onOpenWorkstation,
}) => {
  const inProductionProjects = projects.filter((p) => p.Status === 'InProduction');
  const inReviewProjects = projects.filter((p) => p.Status === 'InReview');
  const completedProjects = projects.filter((p) => p.Status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#400404]">
            Olá, {currentUser.Name}! 👋
          </h2>
          <p className="text-xs text-[#5C1212]/70 mt-0.5">
            Visão geral da plataforma Media 8 Workstation PAM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => onNavigateTab('projects')}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs py-2.5 px-4 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </Button>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#5C1212]/70">Total de Projetos</p>
            <p className="text-2xl font-bold text-[#400404] mt-1">{projects.length}</p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Produtora Ativa</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFFBED] border border-[#400404]/20 flex items-center justify-center text-[#400404]">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-900/70">Em Produção</p>
            <p className="text-2xl font-bold text-amber-950 mt-1">{inProductionProjects.length}</p>
            <p className="text-[11px] text-amber-800 mt-1">sendo editados</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-900/70">Em Revisão</p>
            <p className="text-2xl font-bold text-blue-950 mt-1">{inReviewProjects.length}</p>
            <p className="text-[11px] text-blue-800 mt-1">apravação final</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-900/70">Concluídos</p>
            <p className="text-2xl font-bold text-emerald-950 mt-1">{completedProjects.length}</p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Purga RAW liberada</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-900">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="bg-white rounded-xl border border-[#400404]/15 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#400404]/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#400404]">Projetos Recentes</h3>
            <p className="text-xs text-[#5C1212]/70">Últimos trabalhos de edição registrados na estação.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigateTab('projects')}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver Todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-xs text-[#5C1212]/50 italic text-center py-6">Nenhum projeto encontrado.</p>
          ) : (
            projects.slice(0, 5).map((proj) => (
              <div
                key={proj.ProjectId}
                className="p-4 rounded-xl bg-[#FFFBED] border border-[#400404]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#400404]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#400404]">{proj.Title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {proj.Status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#5C1212]/70 mt-1 line-clamp-1">
                    {proj.BriefingText || 'Sem briefing estipulado.'}
                  </p>
                </div>

                <Button
                  onClick={() => onOpenWorkstation(proj)}
                  size="sm"
                  className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 self-start sm:self-center cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Abrir na Workstation</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
