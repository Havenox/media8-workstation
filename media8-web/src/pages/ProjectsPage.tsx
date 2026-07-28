import React, { useState } from 'react';
import {
  Plus,
  Search,
  FolderKanban,
  Play,
  Loader2,
  Trash2,
  Link2,
  Film,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  FileCode,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { Project, ProjectLink, User } from '../types';
import { ProjectService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

interface ProjectsPageProps {
  projects: Project[];
  currentUser: User;
  users: User[];
  onRefreshProjects: () => void;
  onOpenWorkstation: (project: Project) => void;
}

interface FormLinkItem {
  id: string;
  url: string;
  linkType: 'Folder' | 'Video' | 'Audio' | 'Image' | 'PDF' | 'Other';
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
  const [linkItems, setLinkItems] = useState<FormLinkItem[]>([
    { id: 'link-1', url: '', linkType: 'Folder' },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dynamic Links Handler
  const handleAddLinkField = () => {
    setLinkItems((prev) => [
      ...prev,
      { id: `link-${Date.now()}-${Math.random()}`, url: '', linkType: 'Folder' },
    ]);
  };

  const handleRemoveLinkField = (id: string) => {
    if (linkItems.length === 1) {
      // Clear instead of removing last
      setLinkItems([{ id: 'link-1', url: '', linkType: 'Folder' }]);
      return;
    }
    setLinkItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLinkChange = (id: string, field: 'url' | 'linkType', value: string) => {
    setLinkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Create Project Submit Handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Por favor, informe o Título do Projeto.');
      return;
    }

    // Validate URLs
    const validLinks: ProjectLink[] = [];
    for (const item of linkItems) {
      const trimmedUrl = item.url.trim();
      if (trimmedUrl) {
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
          setValidationError(`A URL "${trimmedUrl}" é inválida. Certifique-se de incluir http:// ou https://`);
          return;
        }
        validLinks.push({
          Url: trimmedUrl,
          LinkType: item.linkType,
        });
      }
    }

    try {
      setIsCreating(true);
      await ProjectService.createProject({
        Title: title.trim(),
        BriefingText: briefingText.trim(),
        ExternalOrderReference: externalOrderReference.trim() || undefined,
        CreatedByUserId: currentUser.UserId,
        Links: validLinks,
      });

      // Reset form
      setTitle('');
      setBriefingText('');
      setExternalOrderReference('');
      setLinkItems([{ id: 'link-1', url: '', linkType: 'Folder' }]);
      setIsCreateModalOpen(false);
      onRefreshProjects();
    } catch (err: any) {
      setValidationError(
        err.response?.data?.Message || 'Erro ao criar o Projeto. Verifique os dados informados.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Deseja realmente remover este projeto?')) return;

    try {
      await ProjectService.deleteProject(projectId, true); // Soft Delete
      onRefreshProjects();
    } catch (err) {
      alert('Erro ao remover o projeto.');
    }
  };

  const filteredProjects = projects.filter((proj) => {
    if (proj.IsDeleted) return false;
    const matchesStatus = filterStatus === 'ALL' || proj.Status === filterStatus;
    const matchesSearch =
      proj.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.BriefingText && proj.BriefingText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (proj.ExternalOrderReference &&
        proj.ExternalOrderReference.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="secondary" className="bg-gray-200 text-gray-900 border-gray-400 font-bold">Rascunho</Badge>;
      case 'InProduction':
        return <Badge className="bg-amber-200 text-amber-950 border-amber-400 font-bold">Em Produção</Badge>;
      case 'InReview':
        return <Badge className="bg-blue-200 text-blue-950 border-blue-400 font-bold">Em Revisão</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-200 text-emerald-950 border-emerald-400 font-bold">Concluído</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive" className="font-bold">Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="font-bold">{status}</Badge>;
    }
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'Folder':
        return <FolderKanban className="w-3.5 h-3.5 text-amber-800" />;
      case 'Video':
        return <Video className="w-3.5 h-3.5 text-blue-800" />;
      case 'Audio':
        return <Music className="w-3.5 h-3.5 text-purple-800" />;
      case 'Image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-800" />;
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 text-red-800" />;
      default:
        return <Link2 className="w-3.5 h-3.5 text-[#400404]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#400404]">Projetos de Edição</h2>
          <p className="text-xs text-[#5C1212] font-semibold mt-0.5">
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
      <div className="bg-white p-4 rounded-xl border border-[#400404]/20 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#400404] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar projetos, briefings ou #CRM Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#FFFBED] text-xs font-medium text-[#400404] border-[#400404]/25"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  filterStatus === tab.id
                    ? 'bg-[#400404] text-[#FFFBED] shadow-sm'
                    : 'bg-[#FFFBED] text-[#400404] hover:bg-[#400404]/10 border border-[#400404]/20'
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
          <div className="col-span-full bg-white p-12 rounded-xl border border-[#400404]/20 text-center text-[#400404] space-y-3 shadow-sm">
            <FolderKanban className="w-10 h-10 mx-auto text-[#400404]" />
            <p className="text-sm font-bold">Nenhum projeto encontrado nesta categoria.</p>
            <p className="text-xs text-[#5C1212] font-semibold">
              Clique no botão "Novo Projeto" acima para cadastrar manualmente um novo trabalho.
            </p>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.ProjectId}
              className="bg-white rounded-xl border border-[#400404]/20 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-[#400404] truncate">{proj.Title}</h3>
                  {getStatusBadge(proj.Status)}
                </div>

                {proj.ExternalOrderReference && (
                  <div className="text-xs font-mono font-bold text-purple-950 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 inline-block mb-3">
                    CRM Order Ref: #{proj.ExternalOrderReference}
                  </div>
                )}

                {/* Briefing snippet */}
                <p className="text-xs text-[#400404] font-medium line-clamp-3 bg-[#FFFBED] p-3 rounded-lg border border-[#400404]/15 leading-relaxed mb-3">
                  {proj.BriefingText || 'Nenhum briefing especificado.'}
                </p>

                {/* Project Links Badge List */}
                {proj.Links && proj.Links.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-[#400404] uppercase">Links Anexados:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.Links.map((lnk, idx) => (
                        <a
                          key={idx}
                          href={lnk.Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#FFFBED] text-[#400404] px-2 py-0.5 rounded border border-[#400404]/20 hover:bg-[#400404] hover:text-[#FFFBED] transition-colors"
                        >
                          {getLinkIcon(lnk.LinkType)}
                          <span className="truncate max-w-[120px]">{lnk.LinkType}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#400404]/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#400404] font-bold font-mono">
                    <Film className="w-4 h-4 text-[#400404]" />
                    <span>{proj.Assets?.length || 0} mídias</span>
                  </div>

                  {currentUser.Role === 'Admin' && (
                    <button
                      onClick={() => handleDeleteProject(proj.ProjectId)}
                      title="Excluir Projeto"
                      className="text-red-700 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/30 text-[#400404] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#400404]">Cadastrar Novo Projeto</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212] font-semibold">
              Cadastre um novo projeto de edição manualmente na Workstation. Metadados comerciais poderão ser vinculados futuramente.
            </DialogDescription>
          </DialogHeader>

          {validationError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs font-bold text-red-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            {/* Campo: Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#400404]">Título do Projeto *</label>
              <Input
                type="text"
                placeholder="Ex: Campanha Institucional 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white text-xs font-medium text-[#400404]"
              />
            </div>

            {/* Campo: ID do Pedido / CRM Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#400404]">ID do Pedido (Opcional - Alias do CRM)</label>
              <Input
                type="text"
                placeholder="Ex: #0254 ou ORD-88492"
                value={externalOrderReference}
                onChange={(e) => setExternalOrderReference(e.target.value)}
                className="bg-white text-xs font-mono font-medium text-[#400404]"
              />
            </div>

            {/* Campo: Briefing Detalhado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#400404]">Briefing Detalhado & Instruções</label>
              <textarea
                rows={3}
                placeholder="Insira aqui as marcações, observações do cliente e estilo de cortes desejado..."
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#400404]/25 rounded-lg text-xs font-medium text-[#400404] focus:outline-none focus:ring-2 focus:ring-[#400404]"
              />
            </div>

            {/* Campo: Links dos Arquivos (Dinâmico com Múltiplas Caixas) */}
            <div className="space-y-2 pt-2 border-t border-[#400404]/15">
              <label className="text-xs font-bold text-[#400404] block">
                Link dos Arquivos (Google Drive, Mídias, Áudios, PDFs)
              </label>

              <div className="space-y-2.5">
                {linkItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    {/* Dropdown Seletor de Tipo */}
                    <select
                      value={item.linkType}
                      onChange={(e) =>
                        handleLinkChange(item.id, 'linkType', e.target.value)
                      }
                      className="p-2 bg-white border border-[#400404]/25 rounded-lg text-xs font-bold text-[#400404] focus:outline-none focus:ring-2 focus:ring-[#400404] shrink-0"
                    >
                      <option value="Folder">📁 Pasta Drive</option>
                      <option value="Video">🎬 Vídeo</option>
                      <option value="Audio">🎵 Áudio</option>
                      <option value="Image">🖼️ Imagem</option>
                      <option value="PDF">📄 PDF</option>
                      <option value="Other">🔗 Outro</option>
                    </select>

                    {/* Input da URL */}
                    <Input
                      type="url"
                      placeholder="Ex: https://drive.google.com/drive/folders/..."
                      value={item.url}
                      onChange={(e) => handleLinkChange(item.id, 'url', e.target.value)}
                      className="bg-white text-xs font-mono font-medium text-[#400404] flex-1"
                    />

                    {/* Botão Excluir Linha de Link */}
                    {linkItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLinkField(item.id)}
                        className="p-2 text-red-700 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        title="Remover Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Botão "+ ADICIONAR LINK" com Estilização das Prints 2 & 3 */}
              <button
                type="button"
                onClick={handleAddLinkField}
                className="w-full mt-3 py-2.5 px-4 rounded-xl border-2 border-[#400404] bg-[#FFFBED] text-[#400404] font-bold text-xs hover:bg-[#400404] hover:text-[#FFFBED] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>+ ADICIONAR LINK</span>
              </button>
            </div>

            <DialogFooter className="pt-4 border-t border-[#400404]/15">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs font-bold"
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
