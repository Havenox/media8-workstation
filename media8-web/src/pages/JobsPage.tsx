import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, Clock, AlertTriangle, Play, Server, FileText } from 'lucide-react';
import type { MediaProcessingJob } from '../types';
import { JobService } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<MediaProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mockJobs: MediaProcessingJob[] = [
    {
      JobId: 'job-001-ingest',
      AssetId: 'asset-101',
      JobType: 'IngestDownload',
      Status: 'Completed',
      Priority: 10,
      Attempts: 1,
      MaxAttempts: 3,
      LockedByWorkerId: 'ingestion-worker-1',
      CreatedAt: new Date(Date.now() - 3600000).toISOString(),
      UpdatedAt: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      JobId: 'job-002-proxy',
      AssetId: 'asset-101',
      JobType: 'GenerateProxy',
      Status: 'Processing',
      Priority: 8,
      Attempts: 1,
      MaxAttempts: 3,
      LockedByWorkerId: 'transcoder-worker-1',
      CreatedAt: new Date(Date.now() - 1800000).toISOString(),
      UpdatedAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      JobId: 'job-003-waveform',
      AssetId: 'asset-101',
      JobType: 'ExtractWaveform',
      Status: 'Pending',
      Priority: 5,
      Attempts: 0,
      MaxAttempts: 3,
      CreatedAt: new Date(Date.now() - 900000).toISOString(),
      UpdatedAt: new Date(Date.now() - 900000).toISOString(),
    },
  ];

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await JobService.getJobs();
      setJobs(data.length > 0 ? data : mockJobs);
    } catch {
      setJobs(mockJobs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary" className="bg-amber-200 text-amber-950 border-amber-400 font-bold">Pendente</Badge>;
      case 'Processing':
        return <Badge className="bg-blue-200 text-blue-950 border-blue-400 font-bold animate-pulse">Em Processamento</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-200 text-emerald-950 border-emerald-400 font-bold">Concluído</Badge>;
      case 'Failed':
        return <Badge variant="destructive" className="font-bold">Falhou</Badge>;
      default:
        return <Badge variant="outline" className="font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#400404]">Esteira de Ingestão & Jobs</h2>
          <p className="text-xs text-[#5C1212] font-semibold mt-0.5">
            Monitoramento em tempo real da fila assíncrona de processamento de vídeos (SKIP LOCKED).
          </p>
        </div>

        <Button
          onClick={fetchJobs}
          disabled={isLoading}
          className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-semibold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Fila</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#400404]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#5C1212]">Total de Jobs</p>
            <p className="text-2xl font-bold text-[#400404] mt-1">{jobs.length}</p>
            <p className="text-xs text-[#400404] font-bold font-mono mt-1">Fila PostgreSQL</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFFBED] border border-[#400404]/20 flex items-center justify-center text-[#400404]">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50 p-5 rounded-xl border border-blue-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-950">Em Processamento</p>
            <p className="text-2xl font-bold text-blue-950 mt-1">
              {jobs.filter((j) => j.Status === 'Processing').length}
            </p>
            <p className="text-xs text-blue-900 font-bold mt-1">Workers ativos</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-950">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-950">Concluídos</p>
            <p className="text-2xl font-bold text-emerald-950 mt-1">
              {jobs.filter((j) => j.Status === 'Completed').length}
            </p>
            <p className="text-xs text-emerald-900 font-bold mt-1">Purga RAW ativada</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-950">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50 p-5 rounded-xl border border-amber-300 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-950">Pendentes</p>
            <p className="text-2xl font-bold text-amber-950 mt-1">
              {jobs.filter((j) => j.Status === 'Pending').length}
            </p>
            <p className="text-xs text-amber-900 font-bold mt-1">aguardando worker</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-950">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-[#400404]/20 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#400404]/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#400404]">Tarefas da Esteira (`MediaProcessingJobs`)</h3>
          <span className="text-xs font-mono font-bold text-[#400404]">SKIP LOCKED Queue Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#400404]">
            <thead className="bg-[#400404] text-[#FFFBED] uppercase font-mono font-bold border-b border-[#400404]">
              <tr>
                <th className="p-3.5">ID do Job</th>
                <th className="p-3.5">Tipo de Tarefa</th>
                <th className="p-3.5">Prioridade</th>
                <th className="p-3.5">Tentativas</th>
                <th className="p-3.5">Worker Atribuído</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#400404]/15">
              {jobs.map((job) => (
                <tr key={job.JobId} className="hover:bg-[#FFFBED] transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#400404]">{job.JobId}</td>
                  <td className="p-3.5 font-bold text-[#400404]">{job.JobType}</td>
                  <td className="p-3.5 font-mono font-bold">{job.Priority}</td>
                  <td className="p-3.5 font-mono font-bold">{job.Attempts}/{job.MaxAttempts}</td>
                  <td className="p-3.5 font-mono font-bold text-[#5C1212]">
                    {job.LockedByWorkerId || 'Aguardando'}
                  </td>
                  <td className="p-3.5">{getStatusBadge(job.Status)}</td>
                  <td className="p-3.5 text-right">
                    {job.Status === 'Failed' && (
                      <Button size="sm" variant="outline" className="text-xs text-red-700 border-red-400 font-bold">
                        Tentar Novamente
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
