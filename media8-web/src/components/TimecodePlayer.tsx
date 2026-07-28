import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Flag, ArrowLeft, ArrowRight } from 'lucide-react';
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
      <div className="glass-panel rounded-2xl aspect-video border border-wine-vibrant/30 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-wine-deep/40 border border-wine-vibrant/40 flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-wine-vibrant opacity-60" />
        </div>
        <h3 className="text-base font-semibold text-cream-soft">Nenhuma Mídia de Visualização Selecionada</h3>
        <p className="text-xs text-cream-soft/50 max-w-sm mt-1">
          Selecione uma mídia da Order ou faça a ingestão de um novo link para carregar o player proxy.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-wine-vibrant/40 shadow-2xl flex flex-col">
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={asset.StoragePathProxy}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain"
        />

        {/* Timecode Overlay */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-wine-vibrant/50 px-3 py-1.5 rounded-lg text-sm font-mono text-cream-soft shadow-lg tracking-widest">
          {formatTimecode(currentTime)}
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-dark-surface border-t border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-wine-deep hover:bg-wine-warm border border-wine-vibrant flex items-center justify-center text-cream-soft shadow-md"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => stepFrames(-1)}
            title="Voltar 1 Frame (Seta Esquerda)"
            className="p-2 rounded-lg bg-dark-bg border border-dark-border text-cream-soft/80 hover:text-cream-soft"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrames(1)}
            title="Avançar 1 Frame (Seta Direita)"
            className="p-2 rounded-lg bg-dark-border text-cream-soft/80 hover:text-cream-soft"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-cream-soft/60 font-mono">
            FPS: <strong className="text-cream-soft">{fps}</strong> | Speed: <strong className="text-cream-soft">{playbackRate}x</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetInPoint && onSetInPoint(formatTimecode(currentTime), Math.floor(currentTime * fps))}
              className="px-3 py-1.5 bg-dark-bg border border-wine-vibrant/60 hover:bg-wine-deep/40 text-xs font-mono font-bold text-cream-soft rounded-lg flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5 text-green-400" />
              <span>IN (I)</span>
            </button>
            <button
              onClick={() => onSetOutPoint && onSetOutPoint(formatTimecode(currentTime), Math.floor(currentTime * fps))}
              className="px-3 py-1.5 bg-dark-bg border border-wine-vibrant/60 hover:bg-wine-deep/40 text-xs font-mono font-bold text-cream-soft rounded-lg flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5 text-red-400" />
              <span>OUT (O)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
