import React, { useRef, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

interface WaveformCanvasProps {
  peaks?: number[];
  durationSeconds?: number;
  onSeek?: (ratio: number) => void;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ peaks = [], durationSeconds = 0, onSeek }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (peaks.length === 0) {
      // Draw placeholder empty waveform line
      ctx.strokeStyle = '#3a0a0a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const barWidth = width / peaks.length;
    const centerY = height / 2;

    ctx.fillStyle = '#7b0a0a';
    peaks.forEach((peak, index) => {
      const barHeight = peak * (height / 2);
      const x = index * barWidth;
      ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth - 0.5), barHeight);
    });
  }, [peaks]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onSeek) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio);
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-wine-vibrant/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cream-soft/80">
          <Volume2 className="w-4 h-4 text-wine-vibrant" />
          <span>Forma de Onda de Áudio (Waveform Canvas 2D)</span>
        </div>
        <span className="text-[11px] text-cream-soft/50 font-mono">
          {durationSeconds ? `${durationSeconds.toFixed(1)}s` : '0.0s'}
        </span>
      </div>

      <div className="relative bg-dark-bg border border-dark-border rounded-lg overflow-hidden h-16 cursor-pointer">
        <canvas
          ref={canvasRef}
          width={800}
          height={64}
          onClick={handleClick}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
