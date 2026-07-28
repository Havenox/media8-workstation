import React, { useState } from 'react';
import { X, Link2, Upload, AlertCircle } from 'lucide-react';
import { AssetService } from '../services/api';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-wine-vibrant/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-dark-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-wine-vibrant" />
            <h2 className="font-bold text-lg text-cream-soft">Ingestão de Mídia Externa</h2>
          </div>
          <button onClick={onClose} className="text-cream-soft/60 hover:text-cream-soft">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-soft/80 mb-1">Título do Asset</label>
            <input
              type="text"
              required
              placeholder="Ex: Câmera A - Entrevista Principal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-cream-soft placeholder:text-cream-soft/30 focus:outline-none focus:border-wine-vibrant"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-soft/80 mb-1">Nome do Arquivo Original</label>
            <input
              type="text"
              required
              placeholder="Ex: A001_C003_07278K.MOV"
              value={originalFileName}
              onChange={(e) => setOriginalFileName(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-cream-soft placeholder:text-cream-soft/30 focus:outline-none focus:border-wine-vibrant"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-soft/80 mb-1">Link do Google Drive / Storage Externo</label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/file/d/..."
              value={externalSourceUrl}
              onChange={(e) => setExternalSourceUrl(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-cream-soft placeholder:text-cream-soft/30 focus:outline-none focus:border-wine-vibrant"
            />
          </div>

          <div className="text-[11px] text-cream-soft/50 bg-dark-surface p-3 rounded-lg border border-dark-border leading-relaxed">
            💡 <strong>Fluxo Assíncrono:</strong> O Worker .NET 10 processará o download em segundo plano com <code>SKIP LOCKED</code>, gerará o Proxy Web e a camada High Fidelity, e descartará o arquivo RAW original.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-cream-soft/70 hover:text-cream-soft border border-dark-border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-wine-deep hover:bg-wine-warm text-cream-soft font-semibold text-xs px-5 py-2 rounded-lg border border-wine-vibrant shadow-md disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Enfileirando...' : 'Iniciar Ingestão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
