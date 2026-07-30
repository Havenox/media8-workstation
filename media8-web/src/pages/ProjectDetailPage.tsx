import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Grid,
  List as ListIcon,
  Film,
  Video,
  Music,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Info,
  Sparkles,
  Clock,
  HardDrive,
  Link2,
  Play,
  Zap,
  RefreshCw,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type { Project, WorkstationAsset, ProjectLink, User } from '../types';
import { ProjectService } from '../services/api';
import { ProtectedImage } from '../components/ui/ProtectedImage';
import { Button } from '../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

interface ProjectDetailPageProps {
  currentUser?: User;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaFilter, setMediaFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<WorkstationAsset | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await ProjectService.getProjectById(projectId);
        if (data) {
          setProject(data);
          if (data.Assets && data.Assets.length > 0) {
            setSelectedAsset(data.Assets[0]);
          }
        } else {
          setError('Projeto não encontrado no sistema.');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar detalhes do projeto.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaIcon = (mimeType?: string, fileName?: string) => {
    const mime = (mimeType || '').toLowerCase();
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';

    if (mime.startsWith('video/') || ['mp4', 'mov', 'mkv', 'avi'].includes(ext)) {
      return <Video className="w-4 h-4 text-purple-700" />;
    }
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-700" />;
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac'].includes(ext)) {
      return <Music className="w-4 h-4 text-blue-700" />;
    }
    return <FileText className="w-4 h-4 text-amber-700" />;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Completed':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Concluído</span>;
      case 'InReview':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Em Revisão</span>;
      case 'InProduction':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Em Produção</span>;
      default:
        return <span className="bg-[#400404]/10 text-[#400404] border border-[#400404]/20 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Rascunho</span>;
    }
  };

  const calculateSavings = (asset: WorkstationAsset) => {
    const raw = asset.FileSizeBytesRaw || asset.FileSizeBytes || 0;
    const proxy = asset.FileSizeBytesProxy || 0;
    if (raw <= 0 || proxy <= 0) return null;
    const saved = Math.max(0, raw - proxy);
    const pct = Math.round((saved / raw) * 100);
    return { savedBytes: saved, percentage: pct };
  };

  if (isLoading) {
    return (
      <div className="bg-white p-16 rounded-xl border border-[#400404]/15 text-center text-[#400404] space-y-4 shadow-xs flex flex-col items-center justify-center my-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#400404]/80" />
        <p className="text-sm font-semibold tracking-wide">Carregando detalhes do projeto...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white p-12 rounded-xl border border-[#400404]/15 text-center text-[#400404] space-y-4 shadow-xs max-w-xl mx-auto my-8">
        <AlertCircle className="w-10 h-10 mx-auto text-red-600" />
        <h2 className="text-base font-bold">Não foi possível exibir o projeto</h2>
        <p className="text-xs text-[#5C1212]/80">{error || 'Projeto indisponível'}</p>
        <Button
          onClick={() => navigate('/projects')}
          className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-medium px-4 py-2 rounded-xl"
        >
          Voltar para Projetos
        </Button>
      </div>
    );
  }

  const filteredAssets = (project.Assets || []).filter((asset) => {
    if (mediaFilter === 'ALL') return true;
    const mime = (asset.MimeType || '').toLowerCase();
    const ext = (asset.OriginalFileName || '').split('.').pop()?.toLowerCase() || '';

    if (mediaFilter === 'VIDEO') return mime.startsWith('video/') || ['mp4', 'mov', 'mkv', 'avi'].includes(ext);
    if (mediaFilter === 'IMAGE') return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    if (mediaFilter === 'AUDIO') return mime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac'].includes(ext);
    if (mediaFilter === 'DOC') return ['pdf', 'doc', 'docx', 'txt', 'md', 'json'].includes(ext) || mime.contains('pdf') || mime.startsWith('text/');
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#400404]/80 hover:text-[#400404] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projetos</span>
            </Link>
            <span className="text-[#400404]/30">/</span>
            {getStatusBadge(project.Status)}
            {project.ExternalOrderReference && (
              <span className="text-[11px] font-mono font-semibold bg-[#400404]/5 text-[#400404] px-2 py-0.5 rounded border border-[#400404]/15">
                #ID: {project.ExternalOrderReference}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#400404] tracking-tight">
            {project.Title}
          </h1>

          {project.BriefingText && (
            <p className="text-xs text-[#5C1212]/80 font-normal leading-relaxed max-w-3xl">
              {project.BriefingText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => navigate(`/workstation/${project.ProjectId}`)}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Abrir Workstation PAM</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Layout (2/3 Left Media Pool + 1/3 Right Panels) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Media Pool (8 Cols) */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-xs space-y-3">
            {/* Media Pool Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#400404]/10">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#400404]" />
                <h2 className="text-sm font-bold text-[#400404] tracking-tight">Media Pool</h2>
                <span className="text-xs font-semibold bg-[#400404]/10 text-[#400404] px-2 py-0.5 rounded-full">
                  {filteredAssets.length} mídias
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FFFBED]/80 p-1 rounded-lg border border-[#400404]/15">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#400404] text-[#FFFBED] shadow-xs'
                      : 'text-[#400404]/70 hover:bg-[#400404]/10'
                  }`}
                  title="Visualização em Grade"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#400404] text-[#FFFBED] shadow-xs'
                      : 'text-[#400404]/70 hover:bg-[#400404]/10'
                  }`}
                  title="Visualização em Lista"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'VIDEO', label: 'Vídeos' },
                { id: 'IMAGE', label: 'Imagens' },
                { id: 'AUDIO', label: 'Áudios' },
                { id: 'DOC', label: 'Documentos' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setMediaFilter(pill.id)}
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    mediaFilter === pill.id
                      ? 'bg-[#400404] text-[#FFFBED]'
                      : 'bg-[#FFFBED]/60 text-[#400404]/80 hover:bg-[#400404]/10 border border-[#400404]/15'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Assets List/Grid Body */}
            {filteredAssets.length === 0 ? (
              <div className="py-12 text-center text-[#400404]/70 space-y-2">
                <Film className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">Nenhuma mídia encontrada neste filtro.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.AssetId === asset.AssetId;
                  const isOrphaned = asset.ProjectLinkId && project.Links
                    ? !project.Links.some((l) => l.ProjectLinkId === asset.ProjectLinkId)
                    : false;

                  return (
                    <div
                      key={asset.AssetId}
                      onClick={() => setSelectedAsset(asset)}
                      className={`relative group bg-[#FFFBED]/40 rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#400404] ring-2 ring-[#400404]/20 shadow-md bg-white'
                          : 'border-[#400404]/15 hover:border-[#400404]/40 hover:shadow-xs'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video bg-[#400404]/5 rounded-lg overflow-hidden flex items-center justify-center border border-[#400404]/10 mb-2.5">
                        {asset.StoragePathProxy && (asset.MimeType?.startsWith('image/') || asset.OriginalFileName?.match(/\.(webp|jpg|jpeg|png)$/i)) ? (
                          <ProtectedImage
                            src={asset.StoragePathProxy}
                            alt={asset.Title || asset.OriginalFileName}
                            className="w-full h-full object-cover"
                          />
                        ) : asset.StoragePathProxy && asset.MimeType?.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center bg-[#400404]/90 text-[#FFFBED]">
                            <Play className="w-8 h-8 fill-current opacity-80 group-hover:scale-110 transition-transform" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#400404]/60">
                            {getMediaIcon(asset.MimeType, asset.OriginalFileName)}
                            <span className="text-[10px] font-semibold uppercase">
                              {(asset.OriginalFileName || '').split('.').pop()}
                            </span>
                          </div>
                        )}

                        {/* Duration Badge */}
                        {asset.DurationSeconds && asset.DurationSeconds > 0 && (
                          <div className="absolute bottom-1.5 right-1.5 bg-[#400404]/90 text-[#FFFBED] font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                            {Math.floor(asset.DurationSeconds / 60).toString().padStart(2, '0')}:
                            {Math.floor(asset.DurationSeconds % 60).toString().padStart(2, '0')}
                          </div>
                        )}

                        {/* Orphaned Warning Icon "(i)" Badge */}
                        {isOrphaned && (
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                                  title="Atenção: Link de Origem Removido"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-3 bg-[#FFFBED] border border-[#400404]/20 shadow-xl rounded-xl space-y-1.5">
                                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                                  <span>Link de Origem Removido</span>
                                </div>
                                <p className="text-[11px] text-[#400404]/80 leading-snug font-normal">
                                  O link de origem que deu origem a este arquivo foi removido do projeto. Se você excluir esta mídia do banco, ela <strong>não poderá ser restaurada</strong> ou re-ingerida automaticamente.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>

                      {/* Asset Card Information */}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#400404] truncate tracking-tight">
                          {asset.Title || asset.OriginalFileName}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-[#5C1212]/70 font-mono">
                          <span className="truncate max-w-[120px]">
                            {asset.Width && asset.Height ? `${asset.Width}x${asset.Height}` : formatBytes(asset.FileSizeBytesProxy || asset.FileSizeBytes)}
                          </span>
                          <span>{asset.FrameRate ? `${asset.FrameRate}fps` : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Mode */
              <div className="divide-y divide-[#400404]/10 border border-[#400404]/15 rounded-xl overflow-hidden bg-white">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.AssetId === asset.AssetId;
                  const isOrphaned = asset.ProjectLinkId && project.Links
                    ? !project.Links.some((l) => l.ProjectLinkId === asset.ProjectLinkId)
                    : false;

                  return (
                    <div
                      key={asset.AssetId}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#400404]/10 font-semibold' : 'hover:bg-[#FFFBED]/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2 bg-[#400404]/5 rounded-lg border border-[#400404]/10 shrink-0">
                          {getMediaIcon(asset.MimeType, asset.OriginalFileName)}
                        </div>

                        <div className="truncate space-y-0.5">
                          <p className="text-xs font-bold text-[#400404] truncate">
                            {asset.Title || asset.OriginalFileName}
                          </p>
                          <p className="text-[10px] text-[#5C1212]/70 font-mono">
                            {asset.OriginalFileName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-[#400404]/80 shrink-0">
                        <span>{formatBytes(asset.FileSizeBytesProxy || asset.FileSizeBytes)}</span>
                        {asset.DurationSeconds && (
                          <span>{Math.floor(asset.DurationSeconds)}s</span>
                        )}

                        {isOrphaned && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3 bg-[#FFFBED] border border-[#400404]/20 shadow-xl rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                                <span>Link de Origem Removido</span>
                              </div>
                              <p className="text-[11px] text-[#400404]/80 leading-snug font-normal">
                                O link de origem desta mídia foi removido do projeto. Se excluída, ela não poderá ser recuperada automaticamente.
                              </p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Intelligence Inspection & Attached Links (4 Cols) */}
        <div className="md:col-span-4 space-y-4">
          {/* Top Panel: AI Intelligence & Inspection */}
          <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#400404]/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-[#400404] tracking-tight uppercase">
                  IA Intelligence & Inspeção
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold border border-amber-300">
                Media8 AI
              </span>
            </div>

            {!selectedAsset ? (
              <div className="py-8 text-center text-[#400404]/70 space-y-2 bg-[#FFFBED]/50 p-4 rounded-xl border border-[#400404]/10">
                <Sparkles className="w-7 h-7 mx-auto text-amber-600/60" />
                <p className="text-xs font-semibold text-[#400404]">Nenhuma Mídia Selecionada</p>
                <p className="text-[11px] text-[#5C1212]/70 font-normal leading-relaxed">
                  Selecione um arquivo no Media Pool para visualizar o relatório de economia de espaço, métricas técnicas e dados de IA.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Asset Title Header */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#400404] leading-tight">
                    {selectedAsset.Title || selectedAsset.OriginalFileName}
                  </p>
                  <p className="text-[10px] text-[#5C1212]/70 font-mono truncate">
                    ID: {selectedAsset.AssetId}
                  </p>
                </div>

                {/* Storage Metrics & Economy */}
                <div className="bg-[#FFFBED] p-3.5 rounded-xl border border-[#400404]/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#400404] flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-[#400404]" />
                      Análise de Armazenamento
                    </span>

                    {calculateSavings(selectedAsset) && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                        -{calculateSavings(selectedAsset)?.percentage}% economia
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[9px] text-[#5C1212]/70 font-semibold uppercase block">RAW</span>
                      <span className="text-xs font-mono font-bold text-[#400404]">
                        {formatBytes(selectedAsset.FileSizeBytesRaw || selectedAsset.FileSizeBytes)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[9px] text-[#5C1212]/70 font-semibold uppercase block">Master HF</span>
                      <span className="text-xs font-mono font-bold text-[#400404]">
                        {formatBytes(selectedAsset.FileSizeBytesHighFidelity)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[9px] text-[#5C1212]/70 font-semibold uppercase block">Proxy Web</span>
                      <span className="text-xs font-mono font-bold text-[#400404]">
                        {formatBytes(selectedAsset.FileSizeBytesProxy)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-2 bg-[#FFFBED]/40 p-3.5 rounded-xl border border-[#400404]/15">
                  <p className="text-[11px] font-bold text-[#400404]">Especificações Técnicas</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[10px] text-[#5C1212]/70 block font-sans">Resolução</span>
                      <span className="font-semibold text-[#400404]">
                        {selectedAsset.Width && selectedAsset.Height ? `${selectedAsset.Width}x${selectedAsset.Height}` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[10px] text-[#5C1212]/70 block font-sans">Taxa de Quadros</span>
                      <span className="font-semibold text-[#400404]">
                        {selectedAsset.FrameRate ? `${selectedAsset.FrameRate} fps` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[10px] text-[#5C1212]/70 block font-sans">Canais de Áudio</span>
                      <span className="font-semibold text-[#400404]">
                        {selectedAsset.AudioChannels ? `${selectedAsset.AudioChannels} ch` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#400404]/10">
                      <span className="text-[10px] text-[#5C1212]/70 block font-sans">Timecode</span>
                      <span className="font-semibold text-[#400404]">
                        {selectedAsset.TimecodeStart || '00:00:00:00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel: Attached Source Links */}
          <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#400404]/10">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#400404]" />
                <h3 className="text-xs font-bold text-[#400404] tracking-tight uppercase">
                  Links Anexados ({project.Links?.length || 0})
                </h3>
              </div>
            </div>

            {(!project.Links || project.Links.length === 0) ? (
              <p className="text-xs text-[#5C1212]/70 py-3 text-center">Nenhum link de origem cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {project.Links.map((lnk, idx) => (
                  <a
                    key={lnk.ProjectLinkId || idx}
                    href={lnk.Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-[#FFFBED]/60 hover:bg-[#400404]/5 rounded-xl border border-[#400404]/15 transition-colors group text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Link2 className="w-3.5 h-3.5 text-[#400404]/70 shrink-0" />
                      <span className="font-medium text-[#400404] truncate max-w-[170px]">{lnk.LinkType || 'Link de Origem'}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#400404]/50 group-hover:text-[#400404] transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
