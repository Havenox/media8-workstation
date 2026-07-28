import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  FolderKanban,
  Play,
  Loader2,
  Trash2,
  Edit,
  Link2,
  Film,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  Calendar as CalendarIcon,
  Clock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Project, ProjectLink, User } from '../types';
import { ProjectService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import { LinkTypeSelect, LinkTypeOption } from '../components/LinkTypeSelect';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

interface ProjectsPageProps {
  currentUser: User;
  users: User[];
  onOpenWorkstation: (project: Project) => void;
}

interface FormLinkItem {
  id: string;
  url: string;
  linkType: LinkTypeOption;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  currentUser,
  onOpenWorkstation,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Infinite Scroll & Pagination States
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  // New Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [briefingText, setBriefingText] = useState('');
  const [externalOrderReference, setExternalOrderReference] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined);
  const [autoIngest, setAutoIngest] = useState<boolean>(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Edit Project Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBriefingText, setEditBriefingText] = useState('');
  const [editExternalOrderReference, setEditExternalOrderReference] = useState('');
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(undefined);
  const [editStatus, setEditStatus] = useState<string>('InProduction');
  const [editAutoIngest, setEditAutoIngest] = useState<boolean>(true);
  const [editLinkItems, setEditLinkItems] = useState<FormLinkItem[]>([]);

  const [linkItems, setLinkItems] = useState<FormLinkItem[]>([
    { id: 'link-1', url: '', linkType: 'Folder' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [triggeringIngestId, setTriggeringIngestId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const today = startOfDay(new Date());

  // Fetch Page 1 on Filter/Search Change
  const fetchInitialProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setCurrentPage(1);
      const res = await ProjectService.getProjects({
        page: 1,
        pageSize: 20,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: searchQuery.trim() || undefined,
      });

      if ('Items' in res) {
        setProjectsList(res.Items);
        setHasNextPage(res.HasNextPage);
        setTotalCount(res.TotalCount);
      } else {
        setProjectsList(res);
        setHasNextPage(false);
        setTotalCount(res.length);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchInitialProjects();
  }, [fetchInitialProjects]);

  // Fetch Next Page for Infinite Scroll
  const fetchNextPage = async () => {
    if (!hasNextPage || isFetchingMore) return;

    try {
      setIsFetchingMore(true);
      const nextPage = currentPage + 1;
      const res = await ProjectService.getProjects({
        page: nextPage,
        pageSize: 20,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: searchQuery.trim() || undefined,
      });

      if ('Items' in res) {
        setProjectsList((prev) => [...prev, ...res.Items]);
        setCurrentPage(nextPage);
        setHasNextPage(res.HasNextPage);
      }
    } catch (err) {
      console.error('Erro ao carregar próxima página:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingMore && !isLoading) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingMore, isLoading, currentPage]);

  // Dynamic Links Handler
  const handleAddLinkField = (isEdit: boolean = false) => {
    const newItem: FormLinkItem = {
      id: `link-${Date.now()}-${Math.random()}`,
      url: '',
      linkType: 'Folder',
    };
    if (isEdit) {
      setEditLinkItems((prev) => [...prev, newItem]);
    } else {
      setLinkItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveLinkField = (id: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditLinkItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      if (linkItems.length === 1) {
        setLinkItems([{ id: 'link-1', url: '', linkType: 'Folder' }]);
        return;
      }
      setLinkItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleLinkChange = (
    id: string,
    field: 'url' | 'linkType',
    value: string,
    isEdit: boolean = false
  ) => {
    if (isEdit) {
      setEditLinkItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    } else {
      setLinkItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    }
  };

  // Quick Deadline Presets
  const setQuickDeadline = (days: number, isEdit: boolean = false) => {
    const target = addDays(new Date(), days);
    if (isEdit) {
      setEditDeadline(target);
    } else {
      setSelectedDeadline(target);
      setIsCalendarOpen(false);
    }
  };

  // Create Project Submit Handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Por favor, informe o Título do Projeto.');
      return;
    }

    if (selectedDeadline && startOfDay(selectedDeadline) < today) {
      setValidationError('O prazo de entrega não pode ser uma data passada.');
      return;
    }

    const validLinks: ProjectLink[] = [];
    for (const item of linkItems) {
      const trimmedUrl = item.url.trim();
      if (trimmedUrl) {
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
          setValidationError(`A URL "${trimmedUrl}" é inválida. Inclua http:// ou https://`);
          return;
        }
        validLinks.push({ Url: trimmedUrl, LinkType: item.linkType });
      }
    }

    try {
      setIsSaving(true);
      await ProjectService.createProject({
        Title: title.trim(),
        BriefingText: briefingText.trim(),
        ExternalOrderReference: externalOrderReference.trim() || undefined,
        Deadline: selectedDeadline ? selectedDeadline.toISOString() : undefined,
        AutoIngest: autoIngest,
        CreatedByUserId: currentUser.UserId,
        Links: validLinks,
      });

      setTitle('');
      setBriefingText('');
      setExternalOrderReference('');
      setSelectedDeadline(undefined);
      setAutoIngest(true);
      setLinkItems([{ id: 'link-1', url: '', linkType: 'Folder' }]);
      setIsCreateModalOpen(false);
      fetchInitialProjects();
    } catch (err: any) {
      setValidationError(
        err.response?.data?.Message || 'Erro ao criar o Projeto. Verifique os dados.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setEditTitle(proj.Title);
    setEditBriefingText(proj.BriefingText || '');
    setEditExternalOrderReference(proj.ExternalOrderReference || '');
    setEditDeadline(proj.Deadline ? new Date(proj.Deadline) : undefined);
    setEditStatus(proj.Status);
    setEditAutoIngest(proj.AutoIngest ?? true);

    const existingLinks: FormLinkItem[] = (proj.Links || []).map((l, idx) => ({
      id: `edit-link-${idx}-${l.ProjectLinkId}`,
      url: l.Url,
      linkType: l.LinkType as any,
    }));

    setEditLinkItems(existingLinks.length > 0 ? existingLinks : [{ id: 'edit-link-1', url: '', linkType: 'Folder' }]);
    setIsEditModalOpen(true);
  };

  // Update Project Submit Handler
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setValidationError(null);

    if (!editTitle.trim()) {
      setValidationError('O título do projeto é obrigatório.');
      return;
    }

    const validLinks: ProjectLink[] = [];
    for (const item of editLinkItems) {
      const trimmedUrl = item.url.trim();
      if (trimmedUrl) {
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
          setValidationError(`A URL "${trimmedUrl}" é inválida. Inclua http:// ou https://`);
          return;
        }
        validLinks.push({ Url: trimmedUrl, LinkType: item.linkType });
      }
    }

    try {
      setIsSaving(true);
      await ProjectService.updateProject(editingProject.ProjectId, {
        Title: editTitle.trim(),
        BriefingText: editBriefingText.trim(),
        ExternalOrderReference: editExternalOrderReference.trim() || undefined,
        Deadline: editDeadline ? editDeadline.toISOString() : undefined,
        Status: editStatus,
        AutoIngest: editAutoIngest,
        Links: validLinks,
      });

      setIsEditModalOpen(false);
      setEditingProject(null);
      fetchInitialProjects();
    } catch (err: any) {
      setValidationError(err.response?.data?.Message || 'Erro ao atualizar o projeto.');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Manual Ingest Handler
  const handleTriggerIngest = async (projectId: string) => {
    try {
      setTriggeringIngestId(projectId);
      setFeedbackMessage(null);
      const res = await ProjectService.triggerProjectIngest(projectId);
      setFeedbackMessage(
        `Ingestão iniciada! ${res.EnqueuedCount} mídias enfileiradas na esteira (${res.SkippedCount} já processadas).`
      );
      fetchInitialProjects();
    } catch (err) {
      alert('Erro ao disparar ingestão das mídias.');
    } finally {
      setTriggeringIngestId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Deseja realmente remover este projeto?')) return;

    try {
      await ProjectService.deleteProject(projectId, true);
      fetchInitialProjects();
    } catch (err) {
      alert('Erro ao remover o projeto.');
    }
  };

  // Subtle Minimalist Status Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="text-[11px] font-medium text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">
            Rascunho
          </span>
        );
      case 'InProduction':
        return (
          <span className="text-[11px] font-medium text-amber-900 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            Em Produção
          </span>
        );
      case 'InReview':
        return (
          <span className="text-[11px] font-medium text-blue-900 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
            Em Revisão
          </span>
        );
      case 'Completed':
        return (
          <span className="text-[11px] font-medium text-emerald-900 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Concluído
          </span>
        );
      case 'Cancelled':
        return (
          <span className="text-[11px] font-medium text-red-900 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium text-[#400404] bg-[#400404]/5 border border-[#400404]/15 px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  // Lucide Vector Icons inheriting parent currentColor smoothly on hover
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'Folder':
        return <FolderKanban className="w-3.5 h-3.5 shrink-0 transition-colors" />;
      case 'Video':
        return <Video className="w-3.5 h-3.5 shrink-0 transition-colors" />;
      case 'Audio':
        return <Music className="w-3.5 h-3.5 shrink-0 transition-colors" />;
      case 'Image':
        return <ImageIcon className="w-3.5 h-3.5 shrink-0 transition-colors" />;
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 shrink-0 transition-colors" />;
      default:
        return <Link2 className="w-3.5 h-3.5 shrink-0 transition-colors" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#400404] tracking-tight">Projetos de Edição</h2>
          <p className="text-xs text-[#5C1212]/80 font-normal mt-0.5">
            Gerencie os projetos locais da estação e atribuições de editores. Total: {totalCount} projetos.
          </p>
        </div>

        {currentUser.Role === 'Admin' && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="group bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 transition-colors" />
            <span>Novo Projeto</span>
          </Button>
        )}
      </div>

      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-medium text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs text-emerald-800 underline font-medium cursor-pointer">Fechar</button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-[#400404]/15 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#400404]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar projetos, briefings ou #CRM Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#FFFBED]/50 text-xs font-normal text-[#400404] border-[#400404]/15 rounded-lg focus:border-[#400404]"
            />
          </div>

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
                    ? 'bg-[#400404] text-[#FFFBED] shadow-xs'
                    : 'bg-[#FFFBED]/60 text-[#400404]/80 hover:bg-[#400404]/5 border border-[#400404]/15'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-xl border border-[#400404]/15 text-center text-[#400404] space-y-3 shadow-xs flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#400404]/70" />
          <p className="text-xs font-medium">Carregando projetos...</p>
        </div>
      ) : projectsList.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#400404]/15 text-center text-[#400404] space-y-3 shadow-xs">
          <FolderKanban className="w-10 h-10 mx-auto text-[#400404]/40" />
          <p className="text-sm font-semibold">Nenhum projeto encontrado nesta categoria.</p>
          <p className="text-xs text-[#5C1212]/70 font-normal">
            Clique no botão "Novo Projeto" acima para cadastrar manualmente um novo trabalho.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projectsList.map((proj) => (
              <div
                key={proj.ProjectId}
                className="bg-white rounded-xl border border-[#400404]/15 shadow-xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-base text-[#400404] truncate tracking-tight">{proj.Title}</h3>
                    {getStatusBadge(proj.Status)}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    {proj.ExternalOrderReference && (
                      <div className="text-[11px] font-mono font-medium text-[#400404] bg-[#400404]/5 px-2 py-0.5 rounded border border-[#400404]/15 inline-block">
                        CRM Ref: #{proj.ExternalOrderReference}
                      </div>
                    )}

                    {proj.Deadline && (
                      <div className="text-[11px] font-medium text-[#400404] bg-[#400404]/5 px-2 py-0.5 rounded border border-[#400404]/15 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#400404]/70 shrink-0" />
                        <span>Prazo: {format(new Date(proj.Deadline), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#5C1212] font-normal line-clamp-3 bg-[#FFFBED]/60 p-3 rounded-lg border border-[#400404]/10 leading-relaxed mb-3">
                    {proj.BriefingText || 'Nenhum briefing especificado.'}
                  </p>

                  {proj.Links && proj.Links.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-[#400404]/10">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-[#400404]/80 uppercase tracking-wider">
                          Links Anexados ({proj.Links.length})
                        </p>

                        <button
                          onClick={() => handleTriggerIngest(proj.ProjectId)}
                          disabled={triggeringIngestId === proj.ProjectId}
                          className="group inline-flex items-center gap-1.5 text-[11px] font-medium text-[#400404] bg-[#FFFBED] hover:bg-[#400404] hover:text-[#FFFBED] border border-[#400404]/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          {triggeringIngestId === proj.ProjectId ? (
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                          ) : (
                            <Zap className="w-3 h-3 text-[#400404] group-hover:text-[#FFFBED] shrink-0 transition-colors" />
                          )}
                          <span>Iniciar Ingestão</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {proj.Links.map((lnk, idx) => (
                          <a
                            key={idx}
                            href={lnk.Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1.5 text-[11px] font-medium bg-[#FFFBED]/80 text-[#400404] px-2.5 py-1 rounded-md border border-[#400404]/15 hover:bg-[#400404] hover:text-[#FFFBED] transition-colors"
                          >
                            {getLinkIcon(lnk.LinkType)}
                            <span className="truncate max-w-[120px]">{lnk.LinkType}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-all shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#400404]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#400404]/80 font-medium font-mono">
                      <Film className="w-3.5 h-3.5 text-[#400404]/60" />
                      <span>{proj.Assets?.length || 0} mídias</span>
                    </div>

                    {currentUser.Role === 'Admin' && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleOpenEditModal(proj)}
                          title="Editar Projeto"
                          className="text-[#400404]/70 hover:text-[#400404] hover:bg-[#400404]/10 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.ProjectId)}
                          title="Excluir Projeto"
                          className="text-red-700/80 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onOpenWorkstation(proj)}
                    size="sm"
                    className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Abrir na Workstation</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div ref={observerTarget} className="py-4 text-center">
            {isFetchingMore && (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#400404]">
                <Loader2 className="w-4 h-4 animate-spin text-[#400404]" />
                <span>Carregando mais 20 projetos...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Criar Novo Projeto */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/25 text-[#400404] max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">Cadastrar Novo Projeto</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
              Cadastre um novo projeto de edição manualmente com links de mídias e chave CRM.
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Título do Projeto *</label>
              <Input
                type="text"
                placeholder="Ex: Campanha Institucional 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white text-xs font-normal text-[#400404] border-[#400404]/20 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#400404]">ID do Pedido (Opcional - CRM Ref)</label>
                <Input
                  type="text"
                  placeholder="Ex: #0254 ou ORD-88492"
                  value={externalOrderReference}
                  onChange={(e) => setExternalOrderReference(e.target.value)}
                  className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#400404]">Prazo de Entrega</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] hover:border-[#400404] transition-colors focus:ring-2 focus:ring-[#400404] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#400404]/70" />
                        {selectedDeadline ? (
                          format(selectedDeadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          <span className="text-gray-400 font-normal">Selecione o prazo...</span>
                        )}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-[#FFFBED] border border-[#400404]/25 shadow-xl rounded-xl overflow-hidden"
                    align="start"
                  >
                    <div className="p-2 border-b border-[#400404]/15 flex items-center gap-1.5 bg-[#400404]/5">
                      <button type="button" onClick={() => setQuickDeadline(0)} className="px-2 py-1 text-[11px] font-medium bg-white text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] rounded border border-[#400404]/20 cursor-pointer transition-colors">Hoje</button>
                      <button type="button" onClick={() => setQuickDeadline(3)} className="px-2 py-1 text-[11px] font-medium bg-white text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] rounded border border-[#400404]/20 cursor-pointer transition-colors">+3 Dias</button>
                      <button type="button" onClick={() => setQuickDeadline(7)} className="px-2 py-1 text-[11px] font-medium bg-white text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] rounded border border-[#400404]/20 cursor-pointer transition-colors">+7 Dias</button>
                      <button type="button" onClick={() => setQuickDeadline(15)} className="px-2 py-1 text-[11px] font-medium bg-white text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] rounded border border-[#400404]/20 cursor-pointer transition-colors">+15 Dias</button>
                    </div>

                    <Calendar
                      selected={selectedDeadline}
                      onSelect={(date) => {
                        if (date && startOfDay(date) < today) return;
                        setSelectedDeadline(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => startOfDay(date) < today}
                    />

                    {selectedDeadline && (
                      <div className="p-2 border-t border-[#400404]/15 flex justify-end bg-white">
                        <button type="button" onClick={() => { setSelectedDeadline(undefined); setIsCalendarOpen(false); }} className="text-[11px] font-medium text-red-700 hover:text-red-900 p-1">Limpar Data</button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Briefing Detalhado & Instruções</label>
              <textarea
                rows={3}
                placeholder="Insira aqui as marcações, observações do cliente e estilo de cortes..."
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs font-normal text-[#400404] focus:outline-none focus:ring-2 focus:ring-[#400404]"
              />
            </div>

            {/* Switch de Ingestão Automática (AutoIngest) */}
            <div className="p-3.5 bg-white border border-[#400404]/15 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#400404] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#400404]" />
                  <span>Ingestão Automática de Mídias</span>
                </p>
                <p className="text-[11px] text-[#5C1212]/80 font-normal mt-0.5">
                  Dispara automaticamente o download e transcodificação ao salvar os links.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoIngest}
                  onChange={(e) => setAutoIngest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#400404]"></div>
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#400404]/15">
              <label className="text-xs font-semibold text-[#400404] block">
                Link dos Arquivos (Google Drive, Mídias, Áudios, PDFs)
              </label>

              <div className="space-y-2.5">
                {linkItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <LinkTypeSelect
                      value={item.linkType}
                      onChange={(val) => handleLinkChange(item.id, 'linkType', val)}
                    />

                    <Input
                      type="url"
                      placeholder="Ex: https://drive.google.com/drive/folders/..."
                      value={item.url}
                      onChange={(e) => handleLinkChange(item.id, 'url', e.target.value)}
                      className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20 flex-1"
                    />

                    {linkItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLinkField(item.id)}
                        className="p-2 text-red-700/80 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleAddLinkField(false)}
                className="group w-full mt-3 py-2 px-4 rounded-xl border border-[#400404]/25 bg-white text-[#400404] font-medium text-xs hover:bg-[#400404] hover:text-[#FFFBED] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 text-[#400404] group-hover:text-[#FFFBED] transition-colors" />
                <span>Adicionar Link</span>
              </button>
            </div>

            <DialogFooter className="pt-4 border-t border-[#400404]/15">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="text-xs font-medium">Cancelar</Button>
              <Button type="submit" disabled={isSaving || !title.trim()} className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs cursor-pointer">
                {isSaving ? (
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

      {/* Modal: Editar Projeto */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/25 text-[#400404] max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">Editar Projeto</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
              Atualize as informações, links e parâmetros de ingestão do projeto.
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Título do Projeto *</label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="bg-white text-xs font-normal text-[#400404] border-[#400404]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#400404]">Status do Projeto</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:ring-2 focus:ring-[#400404]/20 focus:outline-none"
                >
                  <option value="Draft">Rascunho</option>
                  <option value="InProduction">Em Produção</option>
                  <option value="InReview">Em Revisão</option>
                  <option value="Completed">Concluído</option>
                  <option value="Cancelled">Cancelado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#400404]">ID do Pedido (CRM Ref)</label>
                <Input
                  type="text"
                  value={editExternalOrderReference}
                  onChange={(e) => setEditExternalOrderReference(e.target.value)}
                  className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Briefing Detalhado</label>
              <textarea
                rows={3}
                value={editBriefingText}
                onChange={(e) => setEditBriefingText(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs font-normal text-[#400404]"
              />
            </div>

            {/* Switch de Ingestão Automática (Edit) */}
            <div className="p-3.5 bg-white border border-[#400404]/15 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#400404] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#400404]" />
                  <span>Ingestão Automática de Mídias</span>
                </p>
                <p className="text-[11px] text-[#5C1212]/80 font-normal mt-0.5">
                  Dispara a ingestão de links adicionados nesta atualização.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAutoIngest}
                  onChange={(e) => setEditAutoIngest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#400404]"></div>
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#400404]/15">
              <label className="text-xs font-semibold text-[#400404] block">Gerenciar Links do Projeto</label>
              <div className="space-y-2.5">
                {editLinkItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <LinkTypeSelect
                      value={item.linkType}
                      onChange={(val) => handleLinkChange(item.id, 'linkType', val, true)}
                    />

                    <Input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleLinkChange(item.id, 'url', e.target.value, true)}
                      className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20 flex-1"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveLinkField(item.id, true)}
                      className="p-2 text-red-700/80 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleAddLinkField(true)}
                className="group w-full mt-3 py-2 px-4 rounded-xl border border-[#400404]/25 bg-white text-[#400404] font-medium text-xs hover:bg-[#400404] hover:text-[#FFFBED] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#400404] group-hover:text-[#FFFBED] transition-colors" />
                <span>Adicionar Link</span>
              </button>
            </div>

            <DialogFooter className="pt-4 border-t border-[#400404]/15">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="text-xs font-medium">Cancelar</Button>
              <Button type="submit" disabled={isSaving || !editTitle.trim()} className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <span>Salvar Alterações</span>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
