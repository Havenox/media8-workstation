import React, { useState } from 'react';
import { Plus, Search, Filter, FolderKanban, Users, Play, Calendar, ExternalLink, Loader2, CheckCircle2, Clock, FileText, Film } from 'lucide-react';
import type { Project, User } from '../types';
import { ProjectService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

interface ProjectsPageProps {
  projects: Project[];
  currentUser: User;
  users: User[];
  onRefreshProjects: () => void;
  onOpenWorkstation: (project: Project) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  currentUser,
  users,
  onRefreshProjects,
  onOpenWorkstation,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [briefingText, setBriefingText] = useState('');
  const [externalOrderReference, setExternalOrderReference] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsCreating(true);
      await ProjectService.createProject({
        Title: title.trim(),
        BriefingText: briefingText.trim(),
        ExternalOrderReference: externalOrderReference.trim() || undefined,
        CreatedByUserId: currentUser.UserId,
        Status: 'InProduction',
      });

      setTitle('');
      setBriefingText('');
      setExternalOrderReference('');
      setIsCreateModalOpen(false);
      onRefreshProjects();
    } catch (err) {
      alert('Erro ao criar o Projeto. Verifique a conexão com a API.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter((proj) => {
    const matchesStatus = filterStatus === 'ALL' || proj.Status === filterStatus;
    const matchesSearch =
      proj.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.BriefingText && proj.BriefingText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">Rascunho</Badge>;
      case 'InProduction':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300">Em Produção</Badge>;
      case 'InReview':
        return <Badge className="bg-blue-100 text-blue-900 border-blue-300">Em Revisão</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">Concluído</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#400404]">Projetos de Edição</h2>
          <p className="text-xs text-[#5C1212]/70 mt-0.5">
            Gerencie os projetos locais da estação e atribuições de editores.
          </p>
        </div>

        {currentUser.Role === 'Admin' && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs py-2.5 px-4 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </Button>
        )}
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#5C1212]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar projetos ou briefings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#FFFBED]/40 text-xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'InProduction', label: 'Em Produção' },
              { id: 'InReview', label: 'Em Revisão' },
              { id: 'Completed', label: 'Concluídos' },
              { id: 'Draft', label: 'Rascunhos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  filterStatus === tab.id
                    ? 'bg-[#400404] text-[#FFFBED] font-semibold shadow-sm'
                    : 'bg-[#FFFBED] text-[#400404] hover:bg-[#400404]/10 border border-[#400404]/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-[#400404]/15 text-center text-[#5C1212]/60 space-y-3">
            <FolderKanban className="w-10 h-10 mx-auto text-[#400404]/30" />
            <p className="text-sm font-semibold">Nenhum projeto encontrado nesta categoria.</p>
            <p className="text-xs">Clique no botão "Novo Projeto" acima para cadastrar manualmente um novo trabalho.</p>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.ProjectId}
              className="bg-white rounded-xl border border-[#400404]/15 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-[#400404] truncate">{proj.Title}</h3>
                  {getStatusBadge(proj.Status)}
                </div>

                {proj.ExternalOrderReference && (
                  <div className="text-[11px] font-mono text-purple-950 bg-purple-100/60 px-2 py-0.5 rounded border border-purple-200 inline-block mb-3">
                    CRM Order Ref: #{proj.ExternalOrderReference}
                  </div>
                )}

                {/* Briefing snippet */}
                <p className="text-xs text-[#5C1212]/80 line-clamp-3 bg-[#FFFBED] p-3 rounded-lg border border-[#400404]/10">
                  {proj.BriefingText || 'Nenhum briefing especificado.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#400404]/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#5C1212]/70 font-mono">
                  <Film className="w-3.5 h-3.5 text-[#400404]" />
                  <span>{proj.Assets?.length || 0} mídias</span>
                </div>

                <Button
                  onClick={() => onOpenWorkstation(proj)}
                  size="sm"
                  className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Abrir na Workstation</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Criar Novo Projeto Manual */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#400404]">Cadastrar Novo Projeto</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/70">
              Cadastre um novo projeto de edição manualmente na Workstation. Metadados comerciais poderão ser vinculados futuramente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Título do Projeto *</label>
              <Input
                type="text"
                placeholder="Ex: Campanha Institucional 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Código de Referência da Order Externa (Opcional)</label>
              <Input
                type="text"
                placeholder="Ex: ORD-88492 (se vindo do CRM)"
                value={externalOrderReference}
                onChange={(e) => setExternalOrderReference(e.target.value)}
                className="bg-white text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Briefing & Instruções de Roteiro</label>
              <textarea
                rows={4}
                placeholder="Insira aqui as marcações, observações do cliente e estilo de cortes desejado..."
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs text-[#400404] focus:outline-none focus:ring-2 focus:ring-[#400404]/30"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <span>Criar Projeto</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
