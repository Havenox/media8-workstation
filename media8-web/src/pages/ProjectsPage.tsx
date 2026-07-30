import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Crown,
  Scissors,
  Volume2,
  Palette,
  UserPlus,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Archive,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Project, ProjectLink, User } from '../types';
import { ProjectService } from '../services/api';
import { ProtectedImage } from '../components/ui/ProtectedImage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import { LinkTypeSelect, LinkTypeOption } from '../components/LinkTypeSelect';
import { ConfirmModal } from '../components/ui/confirm-modal';
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

export const PAM_ROLES = [
  { id: 'General', label: 'Edição Geral / Lead', icon: Film, badgeColor: 'bg-[#400404] text-[#FFFBED]' },
  { id: 'Decoupage', label: 'Decoupagem & Seleção', icon: Scissors, badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 border' },
  { id: 'AudioTreatment', label: 'Tratamento de Áudio', icon: Volume2, badgeColor: 'bg-blue-100 text-blue-900 border-blue-300 border' },
  { id: 'ColorGrading', label: 'Color Grading', icon: Palette, badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 border' },
  { id: 'MotionGraphics', label: 'Motion Graphics / VFX', icon: Zap, badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 border' },
  { id: 'Reviewer', label: 'Revisão / Controle QC', icon: CheckCircle2, badgeColor: 'bg-stone-100 text-stone-900 border-stone-300 border' },
] as const;

export type PamRoleType = typeof PAM_ROLES[number]['id'];

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

interface FormEditorAssignment {
  UserId: string;
  AssignmentRole: PamRoleType;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  currentUser,
  users = [],
  onOpenWorkstation,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Infinite Scroll & Pagination States
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  // Collapsible Accordion States (Create Modal - Collapsed by default)
  const [isTeamExpanded, setIsTeamExpanded] = useState<boolean>(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState<boolean>(false);

  // Collapsible Accordion States (Edit Modal - Collapsed by default)
  const [editIsTeamExpanded, setEditIsTeamExpanded] = useState<boolean>(false);
  const [editIsLinksExpanded, setEditIsLinksExpanded] = useState<boolean>(false);

  // Section Refs for auto-collapsing on blur / click outside
  const teamSectionRef = useRef<HTMLDivElement | null>(null);
  const linksSectionRef = useRef<HTMLDivElement | null>(null);
  const editTeamSectionRef = useRef<HTMLDivElement | null>(null);
  const editLinksSectionRef = useRef<HTMLDivElement | null>(null);

  // Auto-collapse section when user clicks outside / loses focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (isTeamExpanded && teamSectionRef.current && !teamSectionRef.current.contains(target)) {
        setIsTeamExpanded(false);
      }
      if (isLinksExpanded && linksSectionRef.current && !linksSectionRef.current.contains(target)) {
        setIsLinksExpanded(false);
      }
      if (editIsTeamExpanded && editTeamSectionRef.current && !editTeamSectionRef.current.contains(target)) {
        setEditIsTeamExpanded(false);
      }
      if (editIsLinksExpanded && editLinksSectionRef.current && !editLinksSectionRef.current.contains(target)) {
        setEditIsLinksExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTeamExpanded, isLinksExpanded, editIsTeamExpanded, editIsLinksExpanded]);

  // Open Create Modal (resets accordions to collapsed)
  const handleOpenCreateModal = () => {
    setIsTeamExpanded(false);
    setIsLinksExpanded(false);
    setIsCreateModalOpen(true);
  };

  // New Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [briefingText, setBriefingText] = useState('');
  const [externalOrderReference, setExternalOrderReference] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined);
  const [autoIngest, setAutoIngest] = useState<boolean>(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [leadUserId, setLeadUserId] = useState<string>(currentUser.UserId);
  const [additionalEditors, setAdditionalEditors] = useState<FormEditorAssignment[]>([]);
  const [selectedAddUser, setSelectedAddUser] = useState<string>('');
  const [selectedAddRole, setSelectedAddRole] = useState<PamRoleType>('Decoupage');

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
  const [editLeadUserId, setEditLeadUserId] = useState<string>('');
  const [editAdditionalEditors, setEditAdditionalEditors] = useState<FormEditorAssignment[]>([]);
  const [editSelectedAddUser, setEditSelectedAddUser] = useState<string>('');
  const [editSelectedAddRole, setEditSelectedAddRole] = useState<PamRoleType>('Decoupage');

  const [linkItems, setLinkItems] = useState<FormLinkItem[]>([
    { id: 'link-1', url: '', linkType: 'Folder' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [triggeringIngestId, setTriggeringIngestId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [archiveTargetProject, setArchiveTargetProject] = useState<Project | null>(null);
  const [restoreTargetProject, setRestoreTargetProject] = useState<Project | null>(null);
  const [hardDeleteTargetProject, setHardDeleteTargetProject] = useState<Project | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const today = startOfDay(new Date());

  const handleAddAdditionalEditor = (isEdit: boolean = false) => {
    const targetUserId = isEdit ? editSelectedAddUser : selectedAddUser;
    const targetRole = isEdit ? editSelectedAddRole : selectedAddRole;
    const currentLead = isEdit ? editLeadUserId : leadUserId;

    if (!targetUserId) return;
    if (targetUserId === currentLead) {
      setValidationError('O Editor Responsável já está atribuído como Lead do projeto.');
      return;
    }

    const currentList = isEdit ? editAdditionalEditors : additionalEditors;
    if (currentList.some((e) => e.UserId === targetUserId)) {
      setValidationError('Este usuário já foi adicionado à equipe do projeto.');
      return;
    }

    const newItem: FormEditorAssignment = { UserId: targetUserId, AssignmentRole: targetRole };
    if (isEdit) {
      setEditAdditionalEditors((prev) => [...prev, newItem]);
      setEditSelectedAddUser('');
    } else {
      setAdditionalEditors((prev) => [...prev, newItem]);
      setSelectedAddUser('');
    }
  };

  const handleRemoveAdditionalEditor = (userId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditAdditionalEditors((prev) => prev.filter((e) => e.UserId !== userId));
    } else {
      setAdditionalEditors((prev) => prev.filter((e) => e.UserId !== userId));
    }
  };

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
        LeadUserId: leadUserId || undefined,
        AssignedEditors: additionalEditors,
        Links: validLinks,
      });

      setTitle('');
      setBriefingText('');
      setExternalOrderReference('');
      setSelectedDeadline(undefined);
      setAutoIngest(true);
      setLeadUserId(currentUser.UserId);
      setAdditionalEditors([]);
      setSelectedAddUser('');
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

    const initialLeadId = proj.LeadUserId || proj.AssignedEditors?.find(e => e.IsLead)?.UserId || proj.CreatedByUserId || currentUser.UserId;
    setEditLeadUserId(initialLeadId);

    const initialAddEditors: FormEditorAssignment[] = (proj.AssignedEditors || [])
      .filter(e => e.UserId !== initialLeadId)
      .map(e => ({ UserId: e.UserId, AssignmentRole: e.AssignmentRole || 'General' }));
    setEditAdditionalEditors(initialAddEditors);
    setEditSelectedAddUser('');

    const existingLinks: FormLinkItem[] = (proj.Links || []).map((l, idx) => ({
      id: `edit-link-${idx}-${l.ProjectLinkId}`,
      url: l.Url,
      linkType: l.LinkType as any,
    }));

    setEditLinkItems(existingLinks.length > 0 ? existingLinks : [{ id: 'edit-link-1', url: '', linkType: 'Folder' }]);
    setEditIsTeamExpanded(false);
    setEditIsLinksExpanded(false);
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
        LeadUserId: editLeadUserId || undefined,
        AssignedEditors: editAdditionalEditors,
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
      setErrorMessage('Erro ao disparar ingestão das mídias.');
    } finally {
      setTriggeringIngestId(null);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTargetProject) return;
    try {
      setIsActionLoading(true);
      await ProjectService.deleteProject(archiveTargetProject.ProjectId, true);
      setFeedbackMessage(`Projeto '${archiveTargetProject.Title}' arquivado com sucesso. As mídias do disco foram purgadas.`);
      setArchiveTargetProject(null);
      fetchInitialProjects();
    } catch (err) {
      setErrorMessage('Erro ao arquivar o projeto.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTargetProject) return;
    try {
      setIsActionLoading(true);
      await ProjectService.restoreProject(restoreTargetProject.ProjectId);
      setFeedbackMessage(`Projeto '${restoreTargetProject.Title}' restaurado com sucesso para Em Produção.`);
      setRestoreTargetProject(null);
      fetchInitialProjects();
    } catch (err) {
      setErrorMessage('Erro ao restaurar o projeto.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleHardDeleteConfirm = async () => {
    if (!hardDeleteTargetProject) return;
    try {
      setIsActionLoading(true);
      await ProjectService.deleteProject(hardDeleteTargetProject.ProjectId, false);
      setFeedbackMessage(`Projeto '${hardDeleteTargetProject.Title}' excluído permanentemente.`);
      setHardDeleteTargetProject(null);
      fetchInitialProjects();
    } catch (err) {
      setErrorMessage('Erro ao excluir o projeto permanentemente.');
    } finally {
      setIsActionLoading(false);
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
      case 'Archived':
        return (
          <span className="text-[11px] font-medium text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-full">
            Arquivado
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium text-[#400404] bg-[#400404]/5 border border-[#400404]/15 px-2 py-0.5 rounded-full">
            {status === 'Archived' ? 'Arquivado' : status}
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
    <div className="space-y-4">
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-medium text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs text-emerald-800 underline font-medium cursor-pointer">Fechar</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs text-red-800 underline font-medium cursor-pointer">Fechar</button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-[#400404]/15 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
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

            {currentUser.Role === 'Admin' && (
              <Button
                onClick={handleOpenCreateModal}
                className="group bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4 transition-colors" />
                <span>Novo Projeto</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'InProduction', label: 'Em Produção' },
              { id: 'InReview', label: 'Em Revisão' },
              { id: 'Completed', label: 'Concluídos' },
              { id: 'Draft', label: 'Rascunhos' },
              { id: 'Archived', label: 'Arquivados' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
            {projectsList.map((proj) => {
              const isArchived = proj.IsDeleted || proj.Status === 'Archived' || filterStatus === 'Archived';

              return (
                <div
                  key={proj.ProjectId}
                  className="bg-white rounded-xl border border-[#400404]/15 shadow-xs hover:shadow-sm transition-all p-5 flex flex-col justify-between h-full min-h-[310px]"
                >
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-base text-[#400404] truncate tracking-tight">{proj.Title}</h3>
                      {getStatusBadge(isArchived ? 'Archived' : proj.Status)}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center mb-3 min-h-[24px]">
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

                    <p className="text-xs text-[#5C1212] font-normal line-clamp-2 bg-[#FFFBED]/60 p-2.5 rounded-lg border border-[#400404]/10 leading-relaxed mb-3 min-h-[52px] flex-1">
                      {proj.BriefingText || 'Nenhum briefing especificado.'}
                    </p>

                    <div className="mt-auto">
                      {proj.Links && proj.Links.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#400404]/10 mb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-[#400404]/80 uppercase tracking-wider">
                              Links Anexados ({proj.Links.length})
                            </p>

                            {!isArchived && (
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
                            )}
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
                  </div>

                  <div className="pt-3 border-t border-[#400404]/10 flex items-center justify-between mt-auto shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#400404]/80 font-medium font-mono">
                      <Film className="w-3.5 h-3.5 text-[#400404]/60" />
                      <span>{proj.Assets?.filter(a => a.Status && a.Status.toLowerCase() !== 'pending')?.length || 0} mídias</span>
                    </div>

                    {/* Team Avatar Stack */}
                    {proj.AssignedEditors && proj.AssignedEditors.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center -space-x-2 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity p-0.5 rounded-full"
                            title="Ver equipe de atribuição"
                          >
                            {proj.AssignedEditors.slice(0, 4).map((ed) => {
                              const isLead = ed.IsLead || ed.UserId === proj.LeadUserId;
                              const userAvatar = ed.User?.AvatarUrl;
                              const userName = ed.User?.Name || 'Editor';
                              const firstLetter = userName.charAt(0).toUpperCase();

                              return (
                                <div
                                  key={ed.ProjectEditorId || ed.UserId}
                                  className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#FFFBED] bg-[#400404] ring-2 ring-white shadow-xs overflow-hidden shrink-0 ${
                                    isLead ? 'ring-amber-400 border border-amber-400' : ''
                                  }`}
                                >
                                  {userAvatar ? (
                                    <ProtectedImage src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                  ) : (
                                    firstLetter
                                  )}
                                  {isLead && (
                                    <Crown className="w-2.5 h-2.5 text-amber-400 absolute -top-0.5 -right-0.5 drop-shadow-xs" />
                                  )}
                                </div>
                              );
                            })}

                            {proj.AssignedEditors.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-[#5C1212] text-[#FFFBED] font-mono text-[9px] font-semibold flex items-center justify-center ring-2 ring-white shrink-0">
                                +{proj.AssignedEditors.length - 4}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 bg-white border border-[#400404]/15 shadow-md p-3 rounded-xl space-y-2">
                          <div className="flex items-center justify-between border-b border-[#400404]/10 pb-2">
                            <span className="text-xs font-semibold text-[#400404] tracking-tight flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#400404]/70" />
                              Equipe Atribuída ({proj.AssignedEditors.length})
                            </span>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {proj.AssignedEditors.map((ed) => {
                              const isLead = ed.IsLead || ed.UserId === proj.LeadUserId;
                              const userAvatar = ed.User?.AvatarUrl;
                              const userName = ed.User?.Name || 'Editor Desconhecido';
                              const roleConfig = PAM_ROLES.find((r) => r.id === ed.AssignmentRole) || PAM_ROLES[0];
                              const RoleIcon = roleConfig.icon;

                              return (
                                <div key={ed.ProjectEditorId || ed.UserId} className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 truncate">
                                    <div className={`w-7 h-7 rounded-full bg-[#400404] text-[#FFFBED] font-semibold text-[10px] flex items-center justify-center shrink-0 overflow-hidden ${isLead ? 'ring-2 ring-amber-400' : ''}`}>
                                      {userAvatar ? <ProtectedImage src={userAvatar} alt={userName} className="w-full h-full object-cover" /> : userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                      <p className="font-medium text-[#400404] truncate flex items-center gap-1">
                                        <span>{userName}</span>
                                        {isLead && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${roleConfig.badgeColor}`}>
                                    <RoleIcon className="w-2.5 h-2.5" />
                                    <span>{roleConfig.label}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {currentUser.Role === 'Admin' && (
                      <div className="flex items-center gap-1 ml-1">
                        {!isArchived ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(proj)}
                              title="Editar Projeto"
                              className="text-[#400404]/70 hover:text-[#400404] hover:bg-[#400404]/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setArchiveTargetProject(proj)}
                              title="Arquivar Projeto"
                              className="text-amber-800 hover:text-amber-950 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setRestoreTargetProject(proj)}
                              title="Restaurar Projeto"
                              className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar</span>
                            </button>
                            <button
                              onClick={() => setHardDeleteTargetProject(proj)}
                              title="Deletar Permanentemente"
                              className="text-red-700 hover:text-red-900 p-1.5 rounded-lg hover:bg-red-100/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Deletar</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {!isArchived && (
                    <Button
                      onClick={() => navigate(`/projects/${proj.ProjectId}`, { state: { projectTitle: proj.Title } })}
                      size="sm"
                      className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Abrir Projeto</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
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
              Cadastre um novo projeto de edição manualmente com atribuições de editores, links de mídias e chave CRM.
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

            {/* Seção Retrátil: Equipe */}
            <div ref={teamSectionRef} className="border border-[#400404]/15 rounded-xl bg-white/70 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsTeamExpanded(!isTeamExpanded)}
                className="w-full p-3 bg-[#FFFBED]/80 hover:bg-[#400404]/5 border-b border-[#400404]/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#400404] shrink-0" />
                  <span className="text-xs font-semibold text-[#400404]">Equipe</span>
                  <span className="text-[10px] font-medium bg-[#400404]/10 text-[#400404] px-2 py-0.5 rounded-full">
                    {1 + additionalEditors.length}
                  </span>
                </div>
                {isTeamExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#400404]/70 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#400404]/70 shrink-0" />
                )}
              </button>

              {isTeamExpanded && (
                <div className="p-3.5 space-y-3.5 bg-white">
                  {/* Editor Responsável (Lead Editor) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#400404] flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Editor Responsável (Lead Editor) *</span>
                    </label>
                    <select
                      value={leadUserId}
                      onChange={(e) => setLeadUserId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:ring-2 focus:ring-[#400404]/20 focus:outline-none cursor-pointer"
                    >
                      {users.map((u) => (
                        <option key={u.UserId} value={u.UserId}>
                          {u.Name} ({u.Email}) — {u.Role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Integrantes Adicionais & Funções PAM */}
                  <div className="space-y-2 pt-2 border-t border-[#400404]/10">
                    <label className="text-xs font-semibold text-[#400404] flex items-center justify-between">
                      <span>Integrantes Adicionais (PAM)</span>
                      <span className="text-[10px] text-[#5C1212]/70 font-normal">
                        {additionalEditors.length} integrante(s)
                      </span>
                    </label>

                    {additionalEditors.length > 0 && (
                      <div className="space-y-2 bg-[#FFFBED]/40 p-2.5 rounded-xl border border-[#400404]/15">
                        {additionalEditors.map((ed) => {
                          const matchedUser = users.find((u) => u.UserId === ed.UserId);
                          const roleConfig = PAM_ROLES.find((r) => r.id === ed.AssignmentRole) || PAM_ROLES[0];
                          const RoleIcon = roleConfig.icon;

                          return (
                            <div key={ed.UserId} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-[#400404]/10 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-[#400404] text-[#FFFBED] text-[10px] font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                                  {matchedUser?.AvatarUrl ? (
                                    <ProtectedImage src={matchedUser.AvatarUrl} alt={matchedUser.Name} className="w-full h-full object-cover" />
                                  ) : (
                                    matchedUser?.Name ? matchedUser.Name.charAt(0).toUpperCase() : 'U'
                                  )}
                                </div>
                                <div className="truncate">
                                  <span className="font-medium text-[#400404] truncate block">{matchedUser?.Name || 'Editor'}</span>
                                  <span className="text-[10px] text-[#5C1212]/70 block font-mono">{matchedUser?.Email}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${roleConfig.badgeColor}`}>
                                  <RoleIcon className="w-3 h-3 shrink-0" />
                                  <span>{roleConfig.label}</span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdditionalEditor(ed.UserId, false)}
                                  className="p-1 text-red-700/80 hover:text-red-900 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Remover integrante"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <select
                        value={selectedAddUser}
                        onChange={(e) => setSelectedAddUser(e.target.value)}
                        className="w-full sm:w-1/2 p-2 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:outline-none cursor-pointer"
                      >
                        <option value="">Selecione um editor...</option>
                        {users
                          .filter((u) => u.UserId !== leadUserId && !additionalEditors.some((ae) => ae.UserId === u.UserId))
                          .map((u) => (
                            <option key={u.UserId} value={u.UserId}>
                              {u.Name} ({u.Email})
                            </option>
                          ))}
                      </select>

                      <select
                        value={selectedAddRole}
                        onChange={(e) => setSelectedAddRole(e.target.value as PamRoleType)}
                        className="w-full sm:w-1/3 p-2 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:outline-none cursor-pointer"
                      >
                        {PAM_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddAdditionalEditor(false)}
                        disabled={!selectedAddUser}
                        className="w-full sm:w-auto text-xs font-medium py-2 px-3 border-[#400404]/25 text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] shrink-0 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span>Adicionar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
                        <CalendarIcon className="w-4 h-4 text-[#400404]/70 shrink-0" />
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

            {/* Seção Retrátil: Links dos Materiais */}
            <div ref={linksSectionRef} className="border border-[#400404]/15 rounded-xl bg-white/70 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsLinksExpanded(!isLinksExpanded)}
                className="w-full p-3 bg-[#FFFBED]/80 hover:bg-[#400404]/5 border-b border-[#400404]/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#400404] shrink-0" />
                  <span className="text-xs font-semibold text-[#400404]">Links dos Materiais</span>
                  <span className="text-[10px] font-medium bg-[#400404]/10 text-[#400404] px-2 py-0.5 rounded-full">
                    {linkItems.filter((i) => i.url.trim()).length}
                  </span>
                </div>
                {isLinksExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#400404]/70 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#400404]/70 shrink-0" />
                )}
              </button>

              {isLinksExpanded && (
                <div className="p-3.5 space-y-3 bg-white">
                  <div className="space-y-2.5">
                    {linkItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <LinkTypeSelect
                          value={item.linkType}
                          onChange={(val) => handleLinkChange(item.id, 'linkType', val)}
                        />

                        <Input
                          type="url"
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={item.url}
                          onChange={(e) => handleLinkChange(item.id, 'url', e.target.value)}
                          className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20 flex-1"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveLinkField(item.id)}
                          className="p-2 text-red-700/80 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddLinkField()}
                    className="group w-full py-2 px-4 rounded-xl border border-[#400404]/25 bg-white text-[#400404] font-medium text-xs hover:bg-[#400404] hover:text-[#FFFBED] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#400404] group-hover:text-[#FFFBED] transition-colors shrink-0" />
                    <span>Adicionar Link</span>
                  </button>

                  {/* Switch Minimalista de Ingestão Automática (Abaixo dos Links) */}
                  <div className="p-2.5 bg-[#FFFBED]/50 border border-[#400404]/15 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#400404] shrink-0" />
                      <span className="text-xs font-semibold text-[#400404]">Processar mídias automaticamente</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoIngest}
                        onChange={(e) => setAutoIngest(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#400404]"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-[#400404]/15">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="text-xs font-medium">Cancelar</Button>
              <Button type="submit" disabled={isSaving || !title.trim()} className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <span>Cadastrar Projeto</span>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Projeto Existente */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/25 text-[#400404] max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">Editar Projeto</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
              Atualize as informações, status, atribuições de editores e links deste projeto.
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

            {/* Seção Retrátil: Equipe (Edit Modal) */}
            <div ref={editTeamSectionRef} className="border border-[#400404]/15 rounded-xl bg-white/70 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setEditIsTeamExpanded(!editIsTeamExpanded)}
                className="w-full p-3 bg-[#FFFBED]/80 hover:bg-[#400404]/5 border-b border-[#400404]/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#400404] shrink-0" />
                  <span className="text-xs font-semibold text-[#400404]">Equipe</span>
                  <span className="text-[10px] font-medium bg-[#400404]/10 text-[#400404] px-2 py-0.5 rounded-full">
                    {1 + editAdditionalEditors.length}
                  </span>
                </div>
                {editIsTeamExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#400404]/70 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#400404]/70 shrink-0" />
                )}
              </button>

              {editIsTeamExpanded && (
                <div className="p-3.5 space-y-3.5 bg-white">
                  {/* Editor Responsável (Lead Editor) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#400404] flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Editor Responsável (Lead Editor) *</span>
                    </label>
                    <select
                      value={editLeadUserId}
                      onChange={(e) => setEditLeadUserId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:ring-2 focus:ring-[#400404]/20 focus:outline-none cursor-pointer"
                    >
                      {users.map((u) => (
                        <option key={u.UserId} value={u.UserId}>
                          {u.Name} ({u.Email}) — {u.Role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Integrantes Adicionais & Funções PAM (Edit Modal) */}
                  <div className="space-y-2 pt-2 border-t border-[#400404]/10">
                    <label className="text-xs font-semibold text-[#400404] flex items-center justify-between">
                      <span>Integrantes Adicionais (PAM)</span>
                      <span className="text-[10px] text-[#5C1212]/70 font-normal">
                        {editAdditionalEditors.length} integrante(s)
                      </span>
                    </label>

                    {editAdditionalEditors.length > 0 && (
                      <div className="space-y-2 bg-[#FFFBED]/40 p-2.5 rounded-xl border border-[#400404]/15">
                        {editAdditionalEditors.map((ed) => {
                          const matchedUser = users.find((u) => u.UserId === ed.UserId);
                          const roleConfig = PAM_ROLES.find((r) => r.id === ed.AssignmentRole) || PAM_ROLES[0];
                          const RoleIcon = roleConfig.icon;

                          return (
                            <div key={ed.UserId} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-[#400404]/10 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-[#400404] text-[#FFFBED] text-[10px] font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                                  {matchedUser?.AvatarUrl ? (
                                    <ProtectedImage src={matchedUser.AvatarUrl} alt={matchedUser.Name} className="w-full h-full object-cover" />
                                  ) : (
                                    matchedUser?.Name ? matchedUser.Name.charAt(0).toUpperCase() : 'U'
                                  )}
                                </div>
                                <div className="truncate">
                                  <span className="font-medium text-[#400404] truncate block">{matchedUser?.Name || 'Editor'}</span>
                                  <span className="text-[10px] text-[#5C1212]/70 block font-mono">{matchedUser?.Email}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${roleConfig.badgeColor}`}>
                                  <RoleIcon className="w-3 h-3 shrink-0" />
                                  <span>{roleConfig.label}</span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdditionalEditor(ed.UserId, true)}
                                  className="p-1 text-red-700/80 hover:text-red-900 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Remover integrante"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <select
                        value={editSelectedAddUser}
                        onChange={(e) => setEditSelectedAddUser(e.target.value)}
                        className="w-full sm:w-1/2 p-2 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:outline-none cursor-pointer"
                      >
                        <option value="">Selecione um editor...</option>
                        {users
                          .filter((u) => u.UserId !== editLeadUserId && !editAdditionalEditors.some((ae) => ae.UserId === u.UserId))
                          .map((u) => (
                            <option key={u.UserId} value={u.UserId}>
                              {u.Name} ({u.Email})
                            </option>
                          ))}
                      </select>

                      <select
                        value={editSelectedAddRole}
                        onChange={(e) => setEditSelectedAddRole(e.target.value as PamRoleType)}
                        className="w-full sm:w-1/3 p-2 bg-white border border-[#400404]/20 rounded-lg text-xs font-medium text-[#400404] focus:outline-none cursor-pointer"
                      >
                        {PAM_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddAdditionalEditor(true)}
                        disabled={!editSelectedAddUser}
                        className="w-full sm:w-auto text-xs font-medium py-2 px-3 border-[#400404]/25 text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] shrink-0 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span>Adicionar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Seção Retrátil: Links dos Materiais (Edit Modal) */}
            <div ref={editLinksSectionRef} className="border border-[#400404]/15 rounded-xl bg-white/70 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setEditIsLinksExpanded(!editIsLinksExpanded)}
                className="w-full p-3 bg-[#FFFBED]/80 hover:bg-[#400404]/5 border-b border-[#400404]/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#400404] shrink-0" />
                  <span className="text-xs font-semibold text-[#400404]">Links dos Materiais</span>
                  <span className="text-[10px] font-medium bg-[#400404]/10 text-[#400404] px-2 py-0.5 rounded-full">
                    {editLinkItems.filter((i) => i.url.trim()).length}
                  </span>
                </div>
                {editIsLinksExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#400404]/70 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#400404]/70 shrink-0" />
                )}
              </button>

              {editIsLinksExpanded && (
                <div className="p-3.5 space-y-3 bg-white">
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
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddLinkField(true)}
                    className="group w-full py-2 px-4 rounded-xl border border-[#400404]/25 bg-white text-[#400404] font-medium text-xs hover:bg-[#400404] hover:text-[#FFFBED] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#400404] group-hover:text-[#FFFBED] transition-colors shrink-0" />
                    <span>Adicionar Link</span>
                  </button>

                  {/* Switch Minimalista de Ingestão Automática (Edit - Abaixo dos Links) */}
                  <div className="p-2.5 bg-[#FFFBED]/50 border border-[#400404]/15 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#400404] shrink-0" />
                      <span className="text-xs font-semibold text-[#400404]">Processar mídias automaticamente</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAutoIngest}
                        onChange={(e) => setEditAutoIngest(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#400404]"></div>
                    </label>
                  </div>
                </div>
              )}
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

      {/* Modal de Confirmação de Arquivamento */}
      <ConfirmModal
        isOpen={!!archiveTargetProject}
        onClose={() => setArchiveTargetProject(null)}
        onConfirm={handleArchiveConfirm}
        title="Arquivar Projeto"
        description={`Tem certeza que deseja arquivar o projeto "${archiveTargetProject?.Title}"? Ele não será mais visível na lista ativa.`}
        confirmText="Arquivar Projeto"
        variant="archive"
        isLoading={isActionLoading}
      />

      {/* Modal de Confirmação de Reativação */}
      <ConfirmModal
        isOpen={!!restoreTargetProject}
        onClose={() => setRestoreTargetProject(null)}
        onConfirm={handleRestoreConfirm}
        title="Reativar Projeto"
        description={`Tem certeza que deseja reativar o projeto "${restoreTargetProject?.Title}"? Ele voltará a ser visível na lista ativa.`}
        confirmText="Reativar"
        variant="restore"
        isLoading={isActionLoading}
      />

      {/* Modal de Exclusão Permanente */}
      <ConfirmModal
        isOpen={!!hardDeleteTargetProject}
        onClose={() => setHardDeleteTargetProject(null)}
        onConfirm={handleHardDeleteConfirm}
        title="Excluir Permanentemente"
        description={`Tem certeza que deseja excluir permanentemente "${hardDeleteTargetProject?.Title}"? Esta ação é irreversível.`}
        confirmText="Excluir Permanentemente"
        variant="danger"
        countdownSeconds={3}
        isLoading={isActionLoading}
      />
    </div>
  );
};
