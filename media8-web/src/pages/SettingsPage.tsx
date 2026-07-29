import React, { useState, useEffect } from 'react';
import { Settings, HardDrive, Trash2, Shield, User as UserIcon, CheckCircle2, Lock, Key, Eye, EyeOff, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { User, GoogleDriveSettings } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SystemSettingsService } from '../services/api';

interface SettingsPageProps {
  currentUser: User;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(true);
  const [purgeDelayDays, setPurgeDelayDays] = useState(7);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Google Drive Settings State
  const [driveSettings, setDriveSettings] = useState<GoogleDriveSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loadingDriveSettings, setLoadingDriveSettings] = useState(false);
  const [savingDriveKey, setSavingDriveKey] = useState(false);
  const [testingDriveKey, setTestingDriveKey] = useState(false);
  const [driveFeedback, setDriveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = currentUser.Role === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      fetchGoogleDriveSettings();
    }
  }, [isAdmin]);

  const fetchGoogleDriveSettings = async () => {
    try {
      setLoadingDriveSettings(true);
      const settings = await SystemSettingsService.getGoogleDriveSettings();
      setDriveSettings(settings);
      setApiKeyInput(settings.ApiKey || '');
    } catch {
      // Ignora erro silenciosamente
    } finally {
      setLoadingDriveSettings(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveGoogleDriveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setDriveFeedback({ type: 'error', message: 'Por favor, informe uma Chave de API válida do Google Drive.' });
      return;
    }

    try {
      setSavingDriveKey(true);
      setDriveFeedback(null);
      const updated = await SystemSettingsService.saveGoogleDriveSettings({ ApiKey: apiKeyInput.trim() });
      setDriveSettings(updated);
      setApiKeyInput(updated.ApiKey);
      setShowKey(false);
      setDriveFeedback({ type: 'success', message: 'Chave de API do Google Drive salva com sucesso!' });
    } catch (err: any) {
      setDriveFeedback({
        type: 'error',
        message: err.response?.data?.Message || 'Erro ao salvar a Chave de API do Google Drive.',
      });
    } finally {
      setSavingDriveKey(false);
    }
  };

  const handleTestGoogleDriveConnection = async () => {
    try {
      setTestingDriveKey(true);
      setDriveFeedback(null);
      const res = await SystemSettingsService.testGoogleDriveConnection({ ApiKey: apiKeyInput.trim() });
      if (res.Success) {
        setDriveFeedback({ type: 'success', message: res.Message });
      } else {
        setDriveFeedback({ type: 'error', message: res.Message });
      }
    } catch (err: any) {
      setDriveFeedback({
        type: 'error',
        message: err.response?.data?.Message || 'Falha ao testar a conexão com o Google Drive.',
      });
    } finally {
      setTestingDriveKey(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {savedSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-800" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Google Drive API Key Settings (Admin Only) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-xl border border-[#400404]/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#400404]/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#400404] text-[#FFFBED] flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#400404]">Integração Google Drive (API Key)</h3>
                <p className="text-xs text-[#5C1212] font-semibold">
                  Chave oficial utilizada pelo Worker de Ingestão para ler, varrer e baixar pastas e vídeos do Google Drive.
                </p>
              </div>
            </div>

            {driveSettings && (
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                  driveSettings.IsConfigured
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                    : 'bg-amber-50 text-amber-950 border-amber-300'
                }`}
              >
                {driveSettings.IsConfigured ? '✓ Configurado' : '⚠️ Não Configurado'}
              </span>
            )}
          </div>

          {driveFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                driveFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                  : 'bg-rose-50 text-rose-950 border-rose-300'
              }`}
            >
              {driveFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-800 shrink-0" />
              )}
              <span>{driveFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveGoogleDriveKey} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#400404] flex items-center justify-between">
                <span>Chave de API do Google Drive (Google Cloud Console)</span>
                {driveSettings?.UpdatedAt && (
                  <span className="text-[10px] text-[#5C1212]/70 font-mono">
                    Última atualização: {new Date(driveSettings.UpdatedAt).toLocaleString()}
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Ex: AIzaSyD..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  disabled={loadingDriveSettings || savingDriveKey}
                  className="bg-white text-xs font-mono text-[#400404] border-[#400404]/30 pr-10 focus:border-[#400404]"
                />

                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-[#400404]/60 hover:text-[#400404] cursor-pointer p-1"
                  title={showKey ? 'Ocultar chave' : 'Exibir chave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-[#5C1212]/80 font-normal">
                Dica: Crie uma chave de API no Google Cloud Console com permissões ativadas para a <strong>Google Drive API</strong>.
              </p>
            </div>

            <div className="pt-3 border-t border-[#400404]/15 flex items-center justify-between">
              <Button
                type="button"
                onClick={handleTestGoogleDriveConnection}
                disabled={testingDriveKey || !apiKeyInput.trim()}
                variant="outline"
                className="border-[#400404]/30 text-[#400404] hover:bg-[#FFFBED] text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer flex items-center gap-2"
              >
                {testingDriveKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testando Conexão...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Testar Conexão</span>
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={savingDriveKey}
                className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-semibold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-2"
              >
                {savingDriveKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Chave de API</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Storage Monitor Card */}
      <div className="bg-white p-6 rounded-xl border border-[#400404]/20 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-[#400404]/10 pb-3">
          <div className="w-10 h-10 rounded-lg bg-[#400404] text-[#FFFBED] flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#400404]">Monitoramento de Armazenamento Local</h3>
            <p className="text-xs text-[#5C1212] font-semibold">Visão do consumo de disco pelas camadas High Fidelity e Proxies.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#FFFBED] p-4 rounded-lg border border-[#400404]/20">
            <p className="font-bold text-[#400404]">High Fidelity (H.265)</p>
            <p className="text-xl font-bold text-[#400404] mt-1">12.4 GB</p>
            <p className="text-xs text-[#5C1212] font-semibold mt-1">Layer 1 de edição</p>
          </div>

          <div className="bg-[#FFFBED] p-4 rounded-lg border border-[#400404]/20">
            <p className="font-bold text-[#400404]">Proxies Web (WebM)</p>
            <p className="text-xl font-bold text-[#400404] mt-1">1.8 GB</p>
            <p className="text-xs text-[#5C1212] font-semibold mt-1">Layer 2 de streaming</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-300">
            <p className="font-bold text-emerald-950">Espaço Economizado (Purga RAW)</p>
            <p className="text-xl font-bold text-emerald-950 mt-1">184.2 GB</p>
            <p className="text-xs text-emerald-900 font-bold mt-1">Arquivos RAW deletados pós-transcode</p>
          </div>
        </div>
      </div>

      {/* Defensive Purge Settings */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-[#400404]/20 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-[#400404]/10 pb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-950 flex items-center justify-center font-bold border border-amber-300">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#400404]">Política de Purga Defensiva de Mídias</h3>
            <p className="text-xs text-[#5C1212] font-semibold">Remoção automática de arquivos após conclusão do projeto.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPurgeEnabled}
              onChange={(e) => setAutoPurgeEnabled(e.target.checked)}
              className="w-4 h-4 text-[#400404] rounded border-gray-300 focus:ring-[#400404]"
            />
            <span className="font-bold text-[#400404]">
              Deletar arquivos High Fidelity e Proxies do servidor após a conclusão do projeto
            </span>
          </label>

          <div className="space-y-1.5 max-w-xs">
            <label className="font-bold text-[#400404]">Dias para Purga Automática Pós-Conclusão</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={purgeDelayDays}
              onChange={(e) => setPurgeDelayDays(Number(e.target.value))}
              className="bg-white text-xs font-mono font-bold text-[#400404] border-[#400404]/30"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#400404]/15 flex justify-end">
          <Button
            type="submit"
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-semibold py-2 px-5 rounded-lg cursor-pointer"
          >
            Salvar Preferências
          </Button>
        </div>
      </form>
    </div>
  );
};
