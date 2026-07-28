import React, { useState } from 'react';
import { Settings, HardDrive, Trash2, Shield, User as UserIcon, CheckCircle2, Lock } from 'lucide-react';
import type { User } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface SettingsPageProps {
  currentUser: User;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(true);
  const [purgeDelayDays, setPurgeDelayDays] = useState(7);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-[#400404]">Configurações & Purga de Storage</h2>
        <p className="text-xs text-[#5C1212]/70 mt-0.5">
          Gerenciamento de armazenamento em disco, regras de purga defensiva de arquivos RAW e dados de perfil.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Storage Monitor Card */}
      <div className="bg-white p-6 rounded-xl border border-[#400404]/15 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-[#400404]/10 pb-3">
          <div className="w-10 h-10 rounded-lg bg-[#400404] text-[#FFFBED] flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#400404]">Monitoramento de Armazenamento Local</h3>
            <p className="text-xs text-[#5C1212]/70">Visão do consumo de disco pelas camadas High Fidelity e Proxies.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#FFFBED] p-4 rounded-lg border border-[#400404]/15">
            <p className="font-semibold text-[#5C1212]/70">High Fidelity (H.265)</p>
            <p className="text-xl font-bold text-[#400404] mt-1">12.4 GB</p>
            <p className="text-[10px] text-[#5C1212]/60 mt-1">Layer 1 de edição</p>
          </div>

          <div className="bg-[#FFFBED] p-4 rounded-lg border border-[#400404]/15">
            <p className="font-semibold text-[#5C1212]/70">Proxies Web (WebM)</p>
            <p className="text-xl font-bold text-[#400404] mt-1">1.8 GB</p>
            <p className="text-[10px] text-[#5C1212]/60 mt-1">Layer 2 de streaming</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <p className="font-semibold text-emerald-900/80">Espaço Economizado (Purga RAW)</p>
            <p className="text-xl font-bold text-emerald-950 mt-1">184.2 GB</p>
            <p className="text-[10px] text-emerald-700 mt-1">Arquivos RAW deletados pós-transcode</p>
          </div>
        </div>
      </div>

      {/* Defensive Purge Settings */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-[#400404]/15 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-[#400404]/10 pb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#400404]">Política de Purga Defensiva de Mídias</h3>
            <p className="text-xs text-[#5C1212]/70">Remoção automática de arquivos após conclusão do projeto.</p>
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
            <span className="font-semibold text-[#400404]">
              Deletar arquivos High Fidelity e Proxies do servidor após a conclusão do projeto
            </span>
          </label>

          <div className="space-y-1.5 max-w-xs">
            <label className="font-semibold text-[#400404]">Dias para Purga Automática Pós-Conclusão</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={purgeDelayDays}
              onChange={(e) => setPurgeDelayDays(Number(e.target.value))}
              className="bg-white text-xs font-mono"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#400404]/10 flex justify-end">
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
