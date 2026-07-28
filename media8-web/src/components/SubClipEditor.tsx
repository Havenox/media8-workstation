import React, { useState } from 'react';
import { Scissors, Trash2, Plus, Download } from 'lucide-react';
import type { TimecodeMarker } from '../types';
import { TimecodeService } from '../services/api';
import { Button } from './ui/button';

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
        CreatedByUserId: '00000000-0000-0000-0000-000000000001',
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
    <div className="bg-white rounded-xl p-5 border border-[#400404]/15 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#400404]/10 pb-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[#400404]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#400404]">
            Sub-clips & Marcadores IN / OUT
          </h3>
        </div>
        <span className="text-[11px] font-mono bg-[#400404] text-[#FFFBED] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
          {markers.length} marcadores
        </span>
      </div>

      {/* New Marker Form */}
      <form onSubmit={handleSaveMarker} className="bg-[#FFFBED] p-4 rounded-xl border border-[#400404]/15 space-y-3">
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-emerald-300">
            <span className="text-emerald-950 font-semibold text-[10px] block uppercase tracking-wider">
              Ponto IN [I]:
            </span>
            <strong className="text-emerald-800 font-bold text-sm">{inPoint || '00:00:00:00'}</strong>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-red-300">
            <span className="text-red-950 font-semibold text-[10px] block uppercase tracking-wider">
              Ponto OUT [O]:
            </span>
            <strong className="text-red-800 font-bold text-sm">{outPoint || '00:00:00:00'}</strong>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#400404] block mb-1">
            Título do corte (ex: Fala do entrevistado):
          </label>
          <input
            type="text"
            required
            placeholder="Digite a descrição do marcador..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-white border border-[#400404]/25 rounded-lg px-3 py-2 text-xs text-[#400404] font-medium placeholder:text-[#5C1212]/50 focus:outline-none focus:ring-2 focus:ring-[#400404]"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#400404]">Cor:</span>
            {['#7B0A0A', '#2563EB', '#16A34A', '#CA8A04'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorHex(color)}
                style={{ backgroundColor: color }}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  colorHex === color ? 'scale-125 ring-2 ring-[#400404] border-white' : 'border-transparent opacity-80 hover:opacity-100'
                } cursor-pointer`}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading || !assetId || !label.trim()}
            size="sm"
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Salvar Corte</span>
          </Button>
        </div>
      </form>

      {/* Markers List */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {markers.length === 0 ? (
          <div className="text-center py-5 text-xs text-[#400404] font-semibold bg-[#FFFBED] border border-dashed border-[#400404]/25 rounded-xl p-4">
            Nenhum marcador de timecode registrado para esta mídia.
          </div>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.MarkerId}
              className="flex items-center justify-between bg-[#FFFBED] hover:bg-white p-3 rounded-xl border border-[#400404]/15 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: marker.ColorHex }}
                />
                <div>
                  <h4 className="text-xs font-bold text-[#400404]">{marker.Label}</h4>
                  <p className="text-[11px] font-mono font-semibold text-[#5C1212]/80 mt-0.5">
                    {marker.InTimecode} ➔ {marker.OutTimecode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  title="Baixar Sub-clip Cortado (ZIP Alta Fidelidade)"
                  className="p-1.5 hover:bg-[#400404]/10 rounded-lg text-[#400404] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteMarker(marker.MarkerId)}
                  title="Excluir Marcador"
                  className="p-1.5 hover:bg-red-100 rounded-lg text-red-700 transition-colors cursor-pointer"
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
