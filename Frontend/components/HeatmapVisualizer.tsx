import React, { useEffect, useRef, useState } from 'react';
import { HeatmapPoint } from '../types';

interface HeatmapVisualizerProps {
  imageUrl: string;
  points: HeatmapPoint[];
  interactive?: boolean;
  onPointClick?: (point: HeatmapPoint) => void;
  className?: string;
}

const HeatmapVisualizer: React.FC<HeatmapVisualizerProps> = ({ 
  imageUrl, 
  points, 
  interactive = false,
  onPointClick,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle Image Load to set aspect ratio correctly
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Update state only if dimensions actually change to prevent loop
    if (img.naturalWidth !== dimensions.w || img.naturalHeight !== dimensions.h) {
        setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    }
    setImageLoaded(true);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onPointClick || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp values 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onPointClick({ x: clampedX, y: clampedY });
  };

  useEffect(() => {
    // Only render heatmap in analysis mode (non-interactive)
    if (!imageLoaded || interactive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas resolution to match image
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.w, dimensions.h);

    if (points.length === 0) return;

    // --- WEATHER MAP STYLE ALGORITHM ---
    
    // 1. Draw "Heat" (Alpha Channel Accumulation)
    // We use larger, softer circles to create "zones" like a weather map
    const radius = Math.max(dimensions.w, dimensions.h) * 0.05; // 5% of map size
    
    points.forEach(point => {
      const xPx = (point.x / 100) * dimensions.w;
      const yPx = (point.y / 100) * dimensions.h;

      ctx.beginPath();
      ctx.arc(xPx, yPx, radius, 0, 2 * Math.PI);
      
      // Gradient from opaque to transparent
      const gradient = ctx.createRadialGradient(xPx, yPx, 0, xPx, yPx, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,0.8)');  // High density center
      gradient.addColorStop(0.5, 'rgba(0,0,0,0.3)'); // Mid falloff
      gradient.addColorStop(1, 'rgba(0,0,0,0)');    // Edge

      ctx.fillStyle = gradient;
      // Use 'screen' or 'lighter' to accumulate density
      ctx.globalCompositeOperation = 'screen'; 
      ctx.fill();
    });

    // 2. Colorize based on Density Thresholds (Iso-bands)
    const imageData = ctx.getImageData(0, 0, dimensions.w, dimensions.h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]; // The accumulated "heat"

      // Reset pixel to transparent first
      let r = 0, g = 0, b = 0, a = 0;

      // Weather Map Color Scale (Thresholding)
      if (alpha < 20) {
        // Too faint, ignore (Transparent)
        a = 0;
      } else if (alpha < 60) {
        // Low Density: Blue/Cyan
        r = 0; g = 191; b = 255; a = 140; 
      } else if (alpha < 110) {
        // Moderate Density: Green
        r = 50; g = 205; b = 50; a = 160;
      } else if (alpha < 160) {
        // High Density: Yellow
        r = 255; g = 215; b = 0; a = 180;
      } else if (alpha < 210) {
        // Very High Density: Orange
        r = 255; g = 140; b = 0; a = 200;
      } else {
        // Extreme Density: Red
        r = 255; g = 0; b = 0; a = 220;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }

    ctx.putImageData(imageData, 0, 0);
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

  }, [points, dimensions, imageLoaded, interactive]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg bg-slate-100 border border-gray-300 ${className} ${interactive ? 'cursor-crosshair' : ''}`}
      style={{ width: '100%', userSelect: 'none' }}
      onClick={handleClick}
    >
        {/* Base Image */}
        <img 
            src={imageUrl} 
            onLoad={handleImageLoad}
            alt="Map Base" 
            className="w-full h-auto block pointer-events-none"
        />
        
        {/* Heatmap Layer (Canvas) - Only visible in Analysis Mode */}
        {!interactive && (
          <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'multiply' }} 
          />
        )}

        {/* Interactive Markers Layer */}
        {interactive && points.map((p, idx) => (
            <div 
                key={idx}
                className="absolute w-5 h-5 bg-red-600 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center"
                style={{ 
                    left: `${p.x}%`, 
                    top: `${p.y}%` 
                }}
            >
              {/* Pulse effect for the latest point */}
              {idx === points.length - 1 && (
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              )}
              <span className="text-[9px] font-bold text-white">{idx + 1}</span>
            </div>
        ))}
    </div>
  );
};

export default HeatmapVisualizer;