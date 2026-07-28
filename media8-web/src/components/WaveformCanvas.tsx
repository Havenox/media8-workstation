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
      ctx.strokeStyle = '#FFFBED';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const barWidth = width / peaks.length;
    const centerY = height / 2;

    ctx.fillStyle = '#FFFBED';
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
    <div className="bg-white rounded-xl p-4 border border-[#400404]/15 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#400404]">
          <Volume2 className="w-4 h-4 text-[#400404]" />
          <span>Forma de Onda de Áudio (Waveform Canvas 2D)</span>
        </div>
        <span className="text-xs font-mono font-bold text-[#5C1212] bg-[#FFFBED] border border-[#400404]/15 px-2 py-0.5 rounded-md">
          {durationSeconds ? `${durationSeconds.toFixed(1)}s` : '0.0s'}
        </span>
      </div>

      <div className="relative bg-[#400404] border border-[#400404] rounded-lg overflow-hidden h-16 cursor-pointer">
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
