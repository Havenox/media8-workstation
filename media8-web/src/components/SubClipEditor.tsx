import React, { useState } from 'react';
import { Scissors, Trash2, Plus, Download } from 'lucide-react';
import type { TimecodeMarker } from '../types';
import { TimecodeService } from '../services/api';

interface SubClipEditorProps {
  assetId?: string;
  markers: TimecodeMarker[];
  inPoint: string;
  outPoint: string;
  inFrame: number;
  outFrame: number;
  onMarkerCreated: () => void;
}

export const SubClipEditor: React.FC<SubClipEditorProps> = ({
  assetId,
  markers,
  inPoint,
  outPoint,
  inFrame,
  outFrame,
  onMarkerCreated,
}) => {
  const [label, setLabel] = useState('');
  const [notes] = useState('');
  const [colorHex, setColorHex] = useState('#7B0A0A');
  const [loading, setLoading] = useState(false);

  const handleSaveMarker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !label) return;

    try {
      setLoading(true);
      await TimecodeService.createMarker({
        AssetId: assetId,
        InTimecode: inPoint || '00:00:00:00',
        OutTimecode: outPoint || '00:00:00:00',
        InFrame: inFrame,
        OutFrame: outFrame,
        Label: label,
        Notes: notes,
        ColorHex: colorHex,
        CreatedByUserId: '00000000-0000-0000-0000-000000000001', // SuperAdmin System ID
      });
      setLabel('');
      onMarkerCreated();
    } catch (err) {
      console.error('Error saving marker:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMarker = async (id: string) => {
    try {
      await TimecodeService.deleteMarker(id);
      onMarkerCreated();
    } catch (err) {
      console.error('Error deleting marker:', err);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-wine-vibrant/30 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-dark-border pb-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-wine-vibrant" />
          <h3 className="font-bold text-sm text-cream-soft">Sub-clips & Marcadores IN / OUT</h3>
        </div>
        <span className="text-xs font-mono bg-dark-bg border border-dark-border px-2.5 py-1 rounded-md text-cream-soft/70">
          {markers.length} cortes
        </span>
      </div>

      {/* New Marker Form */}
      <form onSubmit={handleSaveMarker} className="bg-dark-surface p-4 rounded-xl border border-dark-border space-y-3">
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-dark-bg p-2 rounded border border-dark-border">
            <span className="text-cream-soft/50 text-[10px] block uppercase">Ponto IN:</span>
            <strong className="text-green-400">{inPoint || '00:00:00:00'}</strong>
          </div>
          <div className="bg-dark-bg p-2 rounded border border-dark-border">
            <span className="text-cream-soft/50 text-[10px] block uppercase">Ponto OUT:</span>
            <strong className="text-red-400">{outPoint || '00:00:00:00'}</strong>
          </div>
        </div>

        <div>
          <input
            type="text"
            required
            placeholder="Rótulo do corte (ex: Fala sobre o lançamento)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-cream-soft placeholder:text-cream-soft/30 focus:outline-none focus:border-wine-vibrant"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cream-soft/60">Cor:</span>
            {['#7B0A0A', '#2563EB', '#16A34A', '#CA8A04'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorHex(color)}
                style={{ backgroundColor: color }}
                className={`w-5 h-5 rounded-full border ${colorHex === color ? 'ring-2 ring-cream-soft border-white' : 'border-transparent'}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !assetId || !label}
            className="flex items-center gap-1.5 bg-wine-deep hover:bg-wine-warm text-cream-soft font-semibold text-xs px-4 py-1.5 rounded-lg border border-wine-vibrant disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Salvar Corte</span>
          </button>
        </div>
      </form>

      {/* Markers List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {markers.length === 0 ? (
          <div className="text-center py-6 text-xs text-cream-soft/40 italic">
            Nenhum marcador de timecode registrado para esta mídia.
          </div>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.MarkerId}
              className="flex items-center justify-between bg-dark-surface hover:bg-dark-bg p-3 rounded-lg border border-dark-border transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: marker.ColorHex }}
                />
                <div>
                  <h4 className="text-xs font-semibold text-cream-soft">{marker.Label}</h4>
                  <p className="text-[11px] font-mono text-cream-soft/60 mt-0.5">
                    {marker.InTimecode} ➔ {marker.OutTimecode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  title="Baixar Sub-clip Cortado (ZIP Alta Fidelidade)"
                  className="p-1.5 hover:bg-wine-deep/40 rounded text-cream-soft/80 hover:text-cream-soft"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteMarker(marker.MarkerId)}
                  title="Excluir Marcador"
                  className="p-1.5 hover:bg-red-950/60 rounded text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
