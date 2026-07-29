import React, { useState, useEffect } from 'react';
import { FolderKanban, Clock, Video, CheckCircle2, Plus, Play, ArrowRight, Loader2 } from 'lucide-react';
import type { Project, ProjectStats, User } from '../types';
import { ProjectService } from '../services/api';
import { Button } from '../components/ui/button';

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
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const data = await ProjectService.getProjectStats();
        setStats(data);
      } catch (err) {
        console.error('Erro ao carregar estatísticas do dashboard:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="text-[10px] font-medium text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">Rascunho</span>;
      case 'InProduction':
        return <span className="text-[10px] font-medium text-amber-900 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Em Produção</span>;
      case 'InReview':
        return <span className="text-[10px] font-medium text-blue-900 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Em Revisão</span>;
      case 'Completed':
        return <span className="text-[10px] font-medium text-emerald-900 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Concluído</span>;
      default:
        return <span className="text-[10px] font-medium text-[#400404] bg-[#400404]/5 border border-[#400404]/15 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Actions Row */}
      <div className="flex justify-end items-center gap-3">
        <Button
          onClick={() => onNavigateTab('projects')}
          className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </Button>
      </div>

      {/* 4 Stat Summary Cards (Dados Consolidados do Endpoint GET /api/v1/Projects/Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5C1212]">Total de Projetos</p>
            <p className="text-2xl font-bold text-[#400404] mt-1 tracking-tight">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#400404]/60" /> : (stats?.TotalCount ?? projects.length)}
            </p>
            <p className="text-[11px] text-emerald-800 font-medium mt-1">Produtora Ativa</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFFBED] border border-[#400404]/15 flex items-center justify-center text-[#400404]">
            <FolderKanban className="w-5 h-5 text-[#400404]/80" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5C1212]">Em Produção</p>
            <p className="text-2xl font-bold text-[#400404] mt-1 tracking-tight">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#400404]/60" /> : (stats?.InProductionCount ?? 0)}
            </p>
            <p className="text-[11px] text-amber-800 font-medium mt-1">sendo editados</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-900">
            <Video className="w-5 h-5 text-amber-900/80" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5C1212]">Em Revisão</p>
            <p className="text-2xl font-bold text-[#400404] mt-1 tracking-tight">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#400404]/60" /> : (stats?.InReviewCount ?? 0)}
            </p>
            <p className="text-[11px] text-blue-800 font-medium mt-1">aprovação final</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-900">
            <Clock className="w-5 h-5 text-blue-900/80" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5C1212]">Concluídos</p>
            <p className="text-2xl font-bold text-[#400404] mt-1 tracking-tight">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin text-[#400404]/60" /> : (stats?.CompletedCount ?? 0)}
            </p>
            <p className="text-[11px] text-emerald-800 font-medium mt-1">Purga RAW liberada</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-900/80" />
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="bg-white rounded-xl border border-[#400404]/15 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#400404]/10 pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#400404] tracking-tight">Projetos Recentes</h3>
            <p className="text-xs text-[#5C1212]/80 font-normal">Últimos trabalhos de edição registrados na estação.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigateTab('projects')}
            className="text-xs font-medium flex items-center gap-1.5 cursor-pointer text-[#400404] border-[#400404]/20 rounded-lg hover:bg-[#400404] hover:text-[#FFFBED] transition-colors"
          >
            <span>Ver Todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-xs text-[#400404] font-normal italic text-center py-6 bg-[#FFFBED]/60 rounded-xl border border-[#400404]/15">Nenhum projeto encontrado.</p>
          ) : (
            projects.slice(0, 5).map((proj) => (
              <div
                key={proj.ProjectId}
                className="p-4 rounded-xl bg-[#FFFBED]/60 border border-[#400404]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#400404]/30 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#400404]">{proj.Title}</span>
                    {getStatusBadge(proj.Status)}
                  </div>
                  <p className="text-xs text-[#5C1212]/90 font-normal mt-1 line-clamp-1">
                    {proj.BriefingText || 'Sem briefing estipulado.'}
                  </p>
                </div>

                <Button
                  onClick={() => onOpenWorkstation(proj)}
                  size="sm"
                  className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 self-start sm:self-center cursor-pointer shrink-0 shadow-xs"
                >
                  <Play className="w-3 h-3 fill-current" />
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
