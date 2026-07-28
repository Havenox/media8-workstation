import React, { useState } from 'react';
import { X, Link2, Upload, AlertCircle } from 'lucide-react';
import { AssetService } from '../services/api';
import { Button } from './ui/button';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({ isOpen, onClose, orderId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [externalSourceUrl, setExternalSourceUrl] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !externalSourceUrl || !originalFileName) {
      setError('Por favor preencha todos os campos requeridos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await AssetService.ingestMedia({
        OrderId: orderId,
        Title: title,
        ExternalSourceUrl: externalSourceUrl,
        OriginalFileName: originalFileName,
      });
      onSuccess();
      onClose();
      setTitle('');
      setExternalSourceUrl('');
      setOriginalFileName('');
    } catch (err: any) {
      setError(err.response?.data?.Message || 'Falha ao enfileirar ingestão de mídia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFBED] w-full max-w-lg rounded-2xl border border-[#400404]/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#400404]">
        <div className="flex items-center justify-between border-b border-[#400404]/15 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#400404]" />
            <h2 className="font-bold text-lg text-[#400404]">Ingestão de Mídia Externa</h2>
          </div>
          <button onClick={onClose} className="text-[#400404] hover:opacity-75 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-900 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#400404] mb-1">Título do Asset *</label>
            <input
              type="text"
              required
              placeholder="Ex: Câmera A - Entrevista Principal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#400404]/20 rounded-lg px-3 py-2 text-xs text-[#400404] font-medium placeholder:text-[#5C1212]/50 focus:outline-none focus:ring-2 focus:ring-[#400404]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#400404] mb-1">Nome do Arquivo Original *</label>
            <input
              type="text"
              required
              placeholder="Ex: A001_C003_07278K.MOV"
              value={originalFileName}
              onChange={(e) => setOriginalFileName(e.target.value)}
              className="w-full bg-white border border-[#400404]/20 rounded-lg px-3 py-2 text-xs text-[#400404] font-mono font-medium placeholder:text-[#5C1212]/50 focus:outline-none focus:ring-2 focus:ring-[#400404]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#400404] mb-1">Link do Google Drive / Storage *</label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/file/d/..."
              value={externalSourceUrl}
              onChange={(e) => setExternalSourceUrl(e.target.value)}
              className="w-full bg-white border border-[#400404]/20 rounded-lg px-3 py-2 text-xs text-[#400404] font-mono font-medium placeholder:text-[#5C1212]/50 focus:outline-none focus:ring-2 focus:ring-[#400404]"
            />
          </div>

          <div className="text-xs text-amber-950 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200 leading-relaxed">
            💡 <strong>Fluxo Assíncrono:</strong> O Worker .NET 10 processará o download em segundo plano com <code>SKIP LOCKED</code>, gerará o Proxy Web e a camada High Fidelity, e descartará o arquivo RAW original.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#400404]/15">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              <span>{loading ? 'Enfileirando...' : 'Iniciar Ingestão'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
