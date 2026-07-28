import React, { useState, useEffect } from 'react';
import type { Project, WorkstationAsset, TimecodeMarker } from '../types';
import { TimecodePlayer } from '../components/TimecodePlayer';
import { WaveformCanvas } from '../components/WaveformCanvas';
import { SubClipEditor } from '../components/SubClipEditor';
import { IngestModal } from '../components/IngestModal';
import { TimecodeService } from '../services/api';
import { Film, Plus, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [selectedAsset, setSelectedAsset] = useState<WorkstationAsset | undefined>(undefined);
  const [markers, setMarkers] = useState<TimecodeMarker[]>([]);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  const [inPoint, setInPoint] = useState('00:00:00:00');
  const [outPoint, setOutPoint] = useState('00:00:00:00');
  const [inFrame, setInFrame] = useState(0);
  const [outFrame, setOutFrame] = useState(0);

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

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#400404] text-[#FFFBED] flex items-center justify-center font-bold">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#5C1212]/60">Estação PAM de Pré-edição</p>
            <h2 className="text-lg font-bold text-[#400404]">
              {activeProject ? activeProject.Title : 'Nenhum Projeto Selecionado'}
            </h2>
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={activeProject?.ProjectId || ''}
            onChange={(e) => {
              const proj = projects.find((p) => p.ProjectId === e.target.value);
              if (proj) onSelectProject(proj);
            }}
            className="p-2 text-xs bg-[#FFFBED] border border-[#400404]/20 rounded-lg text-[#400404] font-semibold focus:outline-none focus:ring-2 focus:ring-[#400404]/30 min-w-[220px]"
          >
            <option value="" disabled>Selecione um Projeto...</option>
            {projects.map((p) => (
              <option key={p.ProjectId} value={p.ProjectId}>
                {p.Title} ({p.Assets?.length || 0} mídias)
              </option>
            ))}
          </select>

          {activeProject && (
            <Button
              onClick={() => setIsIngestModalOpen(true)}
              className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ingestão de Mídia</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Workstation 3-Column Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Column 1: Media Explorer & Briefing */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Media Assets List */}
          <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#400404]/10 pb-2">
              <h3 className="text-xs font-bold text-[#400404] uppercase">Mídias do Projeto</h3>
              <span className="text-[10px] text-[#5C1212]/60 font-mono">
                {activeProject?.Assets?.length || 0} itens
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {!activeProject?.Assets || activeProject.Assets.length === 0 ? (
                <div className="text-center py-6 text-[#5C1212]/50 text-xs italic">
                  Nenhuma mídia cadastrada neste projeto. Clique em "+ Ingestão de Mídia" para enviar.
                </div>
              ) : (
                activeProject.Assets.map((asset) => (
                  <div
                    key={asset.AssetId}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedAsset?.AssetId === asset.AssetId
                        ? 'bg-[#400404] text-[#FFFBED] border-[#400404] shadow-sm'
                        : 'bg-[#FFFBED] border-[#400404]/15 text-[#400404] hover:bg-white'
                    }`}
                  >
                    <div className="font-semibold truncate">{asset.Title}</div>
                    <div className="text-[10px] opacity-70 flex justify-between mt-1 font-mono">
                      <span className="truncate max-w-[110px]">{asset.OriginalFileName}</span>
                      <span className="uppercase font-bold">{asset.Status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Briefing Inspector */}
          {activeProject && (
            <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm space-y-2">
              <div className="flex items-center gap-2 border-b border-[#400404]/10 pb-2">
                <FileCode className="w-4 h-4 text-[#400404]" />
                <h4 className="text-xs font-bold text-[#400404] uppercase">Briefing do Projeto</h4>
              </div>
              <p className="text-xs text-[#5C1212]/80 bg-[#FFFBED] p-3 rounded-lg border border-[#400404]/15 leading-relaxed max-h-44 overflow-y-auto">
                {activeProject.BriefingText || 'Nenhum briefing especificado.'}
              </p>
            </div>
          )}
        </div>

        {/* Column 2: Timecode Player & Waveform Canvas */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <TimecodePlayer
            asset={selectedAsset}
            onSetInPoint={(tc, frame) => {
              setInPoint(tc);
              setInFrame(frame);
            }}
            onSetOutPoint={(tc, frame) => {
              setOutPoint(tc);
              setOutFrame(frame);
            }}
          />

          <WaveformCanvas durationSeconds={selectedAsset?.DurationSeconds} />
        </div>

        {/* Column 3: Markers & Sub-clip Editor */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <SubClipEditor
            assetId={selectedAsset?.AssetId}
            markers={markers}
            inPoint={inPoint}
            outPoint={outPoint}
            inFrame={inFrame}
            outFrame={outFrame}
            onMarkerCreated={() => selectedAsset && loadMarkers(selectedAsset.AssetId)}
          />
        </div>
      </div>

      {/* Ingest Modal */}
      {activeProject && (
        <IngestModal
          isOpen={isIngestModalOpen}
          onClose={() => setIsIngestModalOpen(false)}
          orderId={activeProject.ProjectId}
          onSuccess={onRefreshProjects}
        />
      )}
    </div>
  );
};
