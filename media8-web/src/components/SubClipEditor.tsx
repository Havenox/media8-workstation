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
        CreatedByUserId: '00000000-0000-0000-0000-000000000001', // Admin System ID
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
    <div className="glass-panel rounded-2xl p-5 border border-wine-vibrant/30 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-wine-vibrant/20 pb-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-wine-vibrant" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-cream-soft">Sub-clips & Marcadores IN / OUT</h3>
        </div>
        <span className="text-[11px] font-mono bg-[#140101] border border-wine-vibrant/40 px-2.5 py-0.5 rounded-full text-cream-soft/80 shadow-inner">
          {markers.length} marcadores
        </span>
      </div>

      {/* New Marker Form */}
      <form onSubmit={handleSaveMarker} className="bg-[#100101] p-4 rounded-xl border border-wine-vibrant/30 space-y-3 shadow-inner">
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-[#140101] p-2.5 rounded-xl border border-emerald-950/80">
            <span className="text-cream-soft/50 text-[10px] block uppercase tracking-wider">Ponto IN [I]:</span>
            <strong className="text-emerald-400 font-bold">{inPoint || '00:00:00:00'}</strong>
          </div>
          <div className="bg-[#140101] p-2.5 rounded-xl border border-red-950/80">
            <span className="text-cream-soft/50 text-[10px] block uppercase tracking-wider">Ponto OUT [O]:</span>
            <strong className="text-red-400 font-bold">{outPoint || '00:00:00:00'}</strong>
          </div>
        </div>

        <div>
          <input
            type="text"
            required
            placeholder="Título do corte (ex: Fala do entrevistado sobre o projeto)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-[#140101] border border-wine-vibrant/40 rounded-xl px-3 py-2 text-xs text-cream-soft placeholder:text-cream-soft/30 focus:outline-none focus:border-wine-vibrant focus:ring-1 focus:ring-wine-vibrant transition-all"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cream-soft/60">Cor:</span>
            {['#7B0A0A', '#2563EB', '#16A34A', '#CA8A04'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorHex(color)}
                style={{ backgroundColor: color }}
                className={`w-4 h-4 rounded-full border transition-transform ${colorHex === color ? 'scale-125 ring-2 ring-cream-soft border-white' : 'border-transparent opacity-70 hover:opacity-100'} cursor-pointer`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !assetId || !label}
            className="flex items-center gap-1.5 bg-gradient-to-r from-wine-deep to-wine-vibrant hover:from-wine-warm hover:to-wine-vibrant text-cream-soft font-semibold text-xs px-3.5 py-1.5 rounded-xl border border-wine-vibrant/50 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Salvar Corte</span>
          </button>
        </div>
      </form>

      {/* Markers List */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {markers.length === 0 ? (
          <div className="text-center py-6 text-xs text-cream-soft/40 italic bg-[#100101] border border-dashed border-wine-vibrant/20 rounded-xl p-4">
            Nenhum marcador de timecode registrado para esta mídia.
          </div>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.MarkerId}
              className="flex items-center justify-between bg-[#100101] hover:bg-[#140101] p-3 rounded-xl border border-wine-vibrant/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: marker.ColorHex }}
                />
                <div>
                  <h4 className="text-xs font-semibold text-cream-soft group-hover:text-cream-soft">{marker.Label}</h4>
                  <p className="text-[11px] font-mono text-cream-soft/60 mt-0.5">
                    {marker.InTimecode} ➔ {marker.OutTimecode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  title="Baixar Sub-clip Cortado (ZIP Alta Fidelidade)"
                  className="p-1.5 hover:bg-wine-deep/50 rounded-lg text-cream-soft/70 hover:text-cream-soft transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteMarker(marker.MarkerId)}
                  title="Excluir Marcador"
                  className="p-1.5 hover:bg-red-950/60 rounded-lg text-red-400/80 hover:text-red-300 transition-all cursor-pointer"
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
