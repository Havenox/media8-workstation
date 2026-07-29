import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Project, WorkstationAsset, TimecodeMarker } from '../types';
import { TimecodePlayer } from '../components/TimecodePlayer';
import { WaveformCanvas } from '../components/WaveformCanvas';
import { SubClipEditor } from '../components/SubClipEditor';
import { TimecodeService, ProjectService } from '../services/api';
import { Film, Zap, FileCode, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';

interface WorkstationPageProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onRefreshProjects: () => void;
}

export const WorkstationPage: React.FC<WorkstationPageProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onRefreshProjects,
}) => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  const [selectedAsset, setSelectedAsset] = useState<WorkstationAsset | undefined>(undefined);
  const [markers, setMarkers] = useState<TimecodeMarker[]>([]);
  const [isTriggeringIngest, setIsTriggeringIngest] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [inPoint, setInPoint] = useState('00:00:00:00');
  const [outPoint, setOutPoint] = useState('00:00:00:00');
  const [inFrame, setInFrame] = useState(0);
  const [outFrame, setOutFrame] = useState(0);

  // Sync project selection with URL parameter /workstation/:projectId
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find((p) => p.ProjectId === projectId);
      if (found && found.ProjectId !== activeProject?.ProjectId) {
        onSelectProject(found);
      }
    }
  }, [projectId, projects]);

  // Set default asset when project changes
  useEffect(() => {
    if (activeProject && activeProject.Assets && activeProject.Assets.length > 0) {
      setSelectedAsset(activeProject.Assets[0]);
    } else {
      setSelectedAsset(undefined);
    }
  }, [activeProject]);

  // Load markers for selected asset
  const loadMarkers = async (assetId: string) => {
    try {
      const data = await TimecodeService.getMarkersByAsset(assetId);
      setMarkers(data);
    } catch (err) {
      console.error('Error loading markers:', err);
    }
  };

  useEffect(() => {
    if (selectedAsset) {
      loadMarkers(selectedAsset.AssetId);
    } else {
      setMarkers([]);
    }
  }, [selectedAsset]);

  // Trigger Ingest Handler
  const handleTriggerIngest = async () => {
    if (!activeProject) return;

    try {
      setIsTriggeringIngest(true);
      setFeedbackMsg(null);
      const res = await ProjectService.triggerProjectIngest(activeProject.ProjectId);
      setFeedbackMsg(`Disparo concluído: ${res.EnqueuedCount} novas mídias enfileiradas.`);
      onRefreshProjects();
    } catch (err) {
      setFeedbackMsg('Erro ao disparar ingestão das mídias.');
    } finally {
      setIsTriggeringIngest(false);
    }
  };

  const handleMarkerAdded = () => {
    if (selectedAsset) {
      loadMarkers(selectedAsset.AssetId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-[#400404]/15 shadow-xs">
        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#400404]">Projeto Ativo:</label>
            <select
              value={activeProject?.ProjectId || ''}
              onChange={(e) => {
                const proj = projects.find((p) => p.ProjectId === e.target.value);
                if (proj) {
                  onSelectProject(proj);
                  navigate(`/workstation/${proj.ProjectId}`);
                }
              }}
              className="p-2 bg-[#FFFBED] border border-[#400404]/20 rounded-xl text-xs font-semibold text-[#400404] focus:outline-none focus:ring-2 focus:ring-[#400404]"
            >
              {projects.length === 0 && <option value="">Nenhum projeto</option>}
              {projects.map((p) => (
                <option key={p.ProjectId} value={p.ProjectId}>
                  {p.Title} ({p.Status})
                </option>
              ))}
            </select>
          </div>

          {activeProject && (
            <Button
              onClick={handleTriggerIngest}
              disabled={isTriggeringIngest}
              className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs py-2 px-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isTriggeringIngest ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enfileirando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Iniciar Ingestão de Mídias</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Workstation Layout */}
      {!activeProject ? (
        <div className="bg-white rounded-xl border border-[#400404]/15 p-12 text-center shadow-xs">
          <Film className="w-12 h-12 text-[#400404]/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#400404]">Nenhum Projeto Selecionado</h3>
          <p className="text-xs text-[#5C1212]/80 mt-1 max-w-md mx-auto font-normal">
            Selecione um projeto na lista acima ou acesse a página de Projetos para abrir a workstation PAM.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center Column: Player & Subclip Markers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Container */}
            <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-xs space-y-4">
              {selectedAsset ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#400404]/10 pb-2">
                    <span className="text-xs font-semibold text-[#400404]">{selectedAsset.Title}</span>
                    <span className="text-[10px] font-mono text-[#5C1212]/80">{selectedAsset.TimecodeStart || '00:00:00:00'}</span>
                  </div>

                  <TimecodePlayer
                    videoUrl={selectedAsset.StoragePathProxy || selectedAsset.ExternalSourceUrl}
                    fps={selectedAsset.FrameRate || 24}
                    onTimeUpdate={(tc, frame) => {
                      // Opcional: Atualizar posições de scrubbing
                    }}
                  />

                  <WaveformCanvas
                    waveformPath={selectedAsset.WaveformJsonPath}
                    durationSeconds={selectedAsset.DurationSeconds || 0}
                  />
                </>
              ) : (
                <div className="p-12 text-center text-xs text-[#5C1212]/80 font-normal italic">
                  Nenhum asset ingerido para este projeto. Clique em "Iniciar Ingestão de Mídias" para processar os links anexados.
                </div>
              )}
            </div>

            {/* SubClip & Timecode Markers Editor */}
            {selectedAsset && (
              <SubClipEditor
                assetId={selectedAsset.AssetId}
                inPoint={inPoint}
                outPoint={outPoint}
                inFrame={inFrame}
                outFrame={outFrame}
                markers={markers}
                onMarkerAdded={handleMarkerAdded}
              />
            )}
          </div>

          {/* Right Column: Asset List for Active Project */}
          <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-xs space-y-4 h-fit">
            <h3 className="text-xs font-semibold text-[#400404] uppercase font-mono tracking-wider border-b border-[#400404]/10 pb-2">
              Mídias Ingeridas ({activeProject.Assets?.length || 0})
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {!activeProject.Assets || activeProject.Assets.length === 0 ? (
                <p className="text-xs text-[#5C1212]/80 italic py-4 text-center font-normal">Nenhum asset processado ainda.</p>
              ) : (
                activeProject.Assets.map((asset) => {
                  const isSelected = selectedAsset?.AssetId === asset.AssetId;
                  return (
                    <button
                      key={asset.AssetId}
                      onClick={() => setSelectedAsset(asset)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#400404] text-[#FFFBED] border-[#400404] font-semibold shadow-xs'
                          : 'bg-[#FFFBED]/60 border-[#400404]/15 text-[#400404] hover:border-[#400404]/40 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{asset.Title}</span>
                        <span className="text-[10px] opacity-80 uppercase font-mono">{asset.Status}</span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 line-clamp-1 font-normal">
                        {asset.OriginalFileName}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
