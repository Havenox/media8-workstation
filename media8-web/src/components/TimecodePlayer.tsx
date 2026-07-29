import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Flag, ChevronLeft, ChevronRight, FastForward, Rewind } from 'lucide-react';
import type { WorkstationAsset } from '../types';

import { AuthService } from '../services/api';

interface TimecodePlayerProps {
  asset?: WorkstationAsset;
  onSetInPoint?: (timecode: string, frame: number) => void;
  onSetOutPoint?: (timecode: string, frame: number) => void;
}

export const TimecodePlayer: React.FC<TimecodePlayerProps> = ({ asset, onSetInPoint, onSetOutPoint }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const fps = asset?.FrameRate || 29.97;

  // Convert current seconds to Timecode HH:MM:SS:FF
  const formatTimecode = (seconds: number): string => {
    const totalFrames = Math.floor(seconds * fps);
    const hrs = Math.floor(totalFrames / (3600 * fps));
    const mins = Math.floor((totalFrames % (3600 * fps)) / (60 * fps));
    const secs = Math.floor((totalFrames % (60 * fps)) / fps);
    const frames = Math.floor(totalFrames % fps);

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.playbackRate = 1;
      videoRef.current.play();
      setIsPlaying(true);
      setPlaybackRate(1);
    }
  };

  const stepFrames = (frameDelta: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const frameDuration = 1 / fps;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + frameDelta * frameDuration);
  };

  // Keyboard Shortcuts (J, K, L, Left, Right, I, O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'k' || e.key === 'K' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (videoRef.current) {
          const newRate = Math.max(0.25, playbackRate / 2);
          videoRef.current.playbackRate = newRate;
          setPlaybackRate(newRate);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (videoRef.current) {
          const newRate = Math.min(4, playbackRate * 2);
          videoRef.current.playbackRate = newRate;
          setPlaybackRate(newRate);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepFrames(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepFrames(1);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        if (onSetInPoint) onSetInPoint(formatTimecode(currentTime), Math.floor(currentTime * fps));
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        if (onSetOutPoint) onSetOutPoint(formatTimecode(currentTime), Math.floor(currentTime * fps));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, playbackRate, fps]);

  if (!asset || !asset.StoragePathProxy) {
    return (
      <div className="bg-white rounded-xl aspect-video border border-[#400404]/15 flex flex-col items-center justify-center p-8 text-center shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-[#400404] text-[#FFFBED] border border-[#400404]/20 flex items-center justify-center mb-4 shadow-md">
          <Play className="w-8 h-8 ml-1" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#400404]">
          Nenhuma Mídia de Visualização Selecionada
        </h3>
        <p className="text-xs text-[#5C1212]/80 max-w-sm mt-2 font-medium leading-relaxed">
          Selecione um ativo na barra lateral ou faça a ingestão de um novo link para carregar o player proxy.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#400404]/30 shadow-md flex flex-col relative bg-[#000000]">
      {/* Player Display Container */}
      <div className="relative aspect-video bg-[#000000] flex items-center justify-center group overflow-hidden">
        <video
          ref={videoRef}
          src={AuthService.getProtectedMediaUrl(asset.StoragePathProxy)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain"
        />

        {/* Top Timecode Badge Overlay */}
        <div className="absolute top-4 right-4 bg-[#400404] border border-[#FFFBED]/30 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-[#FFFBED] shadow-xl tracking-widest flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{formatTimecode(currentTime)}</span>
        </div>

        {/* Floating Title & Resolution Overlay */}
        <div className="absolute top-4 left-4 bg-[#400404]/90 backdrop-blur-md border border-[#FFFBED]/30 px-3 py-1.5 rounded-lg text-xs text-[#FFFBED] font-bold flex items-center gap-2 shadow-lg">
          <span className="truncate max-w-[200px]">{asset.Title}</span>
          {asset.Width && asset.Height ? (
            <>
              <span className="text-[#FFFBED]/50">|</span>
              <span className="font-mono text-[#FFFBED]">{asset.Width}x{asset.Height}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Broadcast Control Bar */}
      <div className="p-3.5 bg-[#400404] border-t border-[#FFFBED]/20 flex items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepFrames(-10)}
            title="Voltar 10 Frames"
            className="p-2 rounded-lg bg-[#5C1212] hover:bg-[#7B0A0A] border border-[#FFFBED]/20 text-[#FFFBED] font-bold transition-all cursor-pointer"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrames(-1)}
            title="Voltar 1 Frame (←)"
            className="p-2 rounded-lg bg-[#5C1212] hover:bg-[#7B0A0A] border border-[#FFFBED]/20 text-[#FFFBED] font-bold transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-lg bg-[#FFFBED] text-[#400404] hover:bg-white border border-[#400404] flex items-center justify-center font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => stepFrames(1)}
            title="Avançar 1 Frame (→)"
            className="p-2 rounded-lg bg-[#5C1212] hover:bg-[#7B0A0A] border border-[#FFFBED]/20 text-[#FFFBED] font-bold transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrames(10)}
            title="Avançar 10 Frames"
            className="p-2 rounded-lg bg-[#5C1212] hover:bg-[#7B0A0A] border border-[#FFFBED]/20 text-[#FFFBED] font-bold transition-all cursor-pointer"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timecode Stats & In/Out Cut Triggers */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-[#FFFBED] font-mono bg-[#5C1212] px-3 py-1.5 rounded-lg border border-[#FFFBED]/20 font-bold">
            <span>FPS: <strong>{fps}</strong></span>
            <span className="text-[#FFFBED]/40">|</span>
            <span>Speed: <strong>{playbackRate}x</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetInPoint && onSetInPoint(formatTimecode(currentTime), Math.floor(currentTime * fps))}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-300 text-xs font-mono font-bold text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Flag className="w-4 h-4 fill-current" />
              <span>IN [I]</span>
            </button>

            <button
              onClick={() => onSetOutPoint && onSetOutPoint(formatTimecode(currentTime), Math.floor(currentTime * fps))}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 border border-red-300 text-xs font-mono font-bold text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Flag className="w-4 h-4 fill-current" />
              <span>OUT [O]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
