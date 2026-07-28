import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Flag, ChevronLeft, ChevronRight, FastForward, Rewind } from 'lucide-react';
import type { WorkstationAsset } from '../types';

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
      <div className="glass-panel rounded-2xl aspect-video border border-wine-vibrant/30 flex flex-col items-center justify-center p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wine-deep/60 to-wine-vibrant/30 border border-wine-vibrant/40 flex items-center justify-center mb-4 shadow-lg">
          <Play className="w-8 h-8 text-wine-vibrant opacity-80 ml-1" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-cream-soft">Nenhuma Mídia de Visualização Selecionada</h3>
        <p className="text-xs text-cream-soft/60 max-w-sm mt-1.5 leading-relaxed">
          Selecione um ativo da Order na barra lateral ou faça o ingest de um novo link para carregar o player proxy broadcast.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-wine-vibrant/40 shadow-2xl flex flex-col relative">
      {/* Player Display Container */}
      <div className="relative aspect-video bg-[#080000] flex items-center justify-center group overflow-hidden">
        <video
          ref={videoRef}
          src={asset.StoragePathProxy}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain"
        />

        {/* Top Timecode Badge Overlay */}
        <div className="absolute top-4 right-4 bg-[#0A0101]/90 backdrop-blur-md border border-wine-vibrant/60 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-cream-soft shadow-xl tracking-widest flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-wine-vibrant'}`} />
          <span>{formatTimecode(currentTime)}</span>
        </div>

        {/* Floating Title & Resolution Overlay */}
        <div className="absolute top-4 left-4 bg-[#0A0101]/90 backdrop-blur-md border border-wine-vibrant/40 px-3 py-1.5 rounded-xl text-[11px] text-cream-soft/80 flex items-center gap-2 shadow-lg">
          <span className="font-semibold text-cream-soft truncate max-w-[200px]">{asset.Title}</span>
          {asset.Width && asset.Height ? (
            <>
              <span className="text-wine-vibrant">|</span>
              <span className="font-mono text-cream-soft/60">{asset.Width}x{asset.Height}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Broadcast Control Bar */}
      <div className="p-3.5 bg-[#0D0101] border-t border-wine-vibrant/30 flex items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepFrames(-10)}
            title="Voltar 10 Frames"
            className="p-2 rounded-xl bg-wine-deep/40 hover:bg-wine-deep border border-wine-vibrant/40 text-cream-soft/80 hover:text-cream-soft transition-all cursor-pointer"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => stepFrames(-1)}
            title="Voltar 1 Frame (←)"
            className="p-2 rounded-xl bg-wine-deep/40 hover:bg-wine-deep border border-wine-vibrant/40 text-cream-soft/80 hover:text-cream-soft transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-wine-deep to-wine-vibrant hover:from-wine-warm hover:to-wine-vibrant border border-wine-vibrant/60 flex items-center justify-center text-cream-soft shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-cream-soft" /> : <Play className="w-4 h-4 text-cream-soft ml-0.5" />}
          </button>

          <button
            onClick={() => stepFrames(1)}
            title="Avançar 1 Frame (→)"
            className="p-2 rounded-xl bg-wine-deep/40 hover:bg-wine-deep border border-wine-vibrant/40 text-cream-soft/80 hover:text-cream-soft transition-all cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => stepFrames(10)}
            title="Avançar 10 Frames"
            className="p-2 rounded-xl bg-wine-deep/40 hover:bg-wine-deep border border-wine-vibrant/40 text-cream-soft/80 hover:text-cream-soft transition-all cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timecode Stats & In/Out Cut Triggers */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-cream-soft/60 font-mono bg-[#140101] px-3 py-1.5 rounded-xl border border-wine-vibrant/20">
            <span>FPS: <strong className="text-cream-soft">{fps}</strong></span>
            <span className="text-wine-vibrant/40">|</span>
            <span>Speed: <strong className="text-cream-soft">{playbackRate}x</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetInPoint && onSetInPoint(formatTimecode(currentTime), Math.floor(currentTime * fps))}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-xs font-mono font-bold text-emerald-200 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-emerald-400" />
              <span>IN [I]</span>
            </button>

            <button
              onClick={() => onSetOutPoint && onSetOutPoint(formatTimecode(currentTime), Math.floor(currentTime * fps))}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 text-xs font-mono font-bold text-red-200 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-red-400" />
              <span>OUT [O]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
