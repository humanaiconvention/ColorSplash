import React, { useRef, useState, useEffect } from 'react';
import { PixelData } from '../types';

interface PixelGridProps {
  grid: PixelData[];
  gridSize: number; // e.g., 32
  activeColorIndex: number;
  onPaintPixels: (indices: number[]) => void; // Changed from single index to array
  palette: string[];
  hintPixelIndex: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Memoized Pixel component to prevent re-rendering all pixels when only one changes
interface PixelProps {
  index: number;
  colorIndex: number;
  isColored: boolean;
  isActiveColor: boolean; 
  isHint: boolean;
  gridSize: number;
  paletteColor: string;
}

const Pixel = React.memo(({ 
  index, 
  colorIndex, 
  isColored, 
  isActiveColor, 
  isHint, 
  gridSize, 
  paletteColor,
}: PixelProps) => {
  // Determine cell appearance
  let bgColor = '#f1f5f9'; // slate-100
  let content: React.ReactNode = colorIndex + 1;
  let textClass = 'text-slate-300 font-normal';

  if (isColored) {
     bgColor = paletteColor;
     content = ''; // Hide number when colored
  } else if (isHint) {
    bgColor = '#fef08a'; // Yellow-200
    textClass = 'text-slate-800 font-black animate-pulse scale-125';
  } else if (isActiveColor) {
    // TARGET NUMBERS: Make them pop!
    textClass = 'text-slate-600 font-black scale-110';
    bgColor = '#ffffff'; // Pure white background for active cells
  } else {
     // Inactive numbers
     textClass = 'text-slate-300 font-medium scale-90';
  }

  // Adjusted Font Size Logic for larger grids
  let fontSize = 'text-xs';
  if (gridSize > 64) fontSize = 'text-[6px]';
  else if (gridSize > 40) fontSize = 'text-[8px]';
  else if (gridSize > 25) fontSize = 'text-[10px]';

  return (
    <div
      // We rely on parent math-based hit testing for events now
      data-pixel-index={index}
      className={`
        flex items-center justify-center select-none transition-colors duration-200
        ${!isColored ? 'border-[0.5px] border-slate-200' : ''}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {!isColored && (
        <span 
          className={`
            ${fontSize} leading-none select-none transition-all duration-300
            ${textClass}
          `}
        >
          {content}
        </span>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.isColored === next.isColored &&
    prev.isActiveColor === next.isActiveColor &&
    prev.isHint === next.isHint &&
    prev.colorIndex === next.colorIndex &&
    prev.paletteColor === next.paletteColor
  );
});

export const PixelGrid: React.FC<PixelGridProps> = ({ 
  grid, 
  gridSize, 
  activeColorIndex, 
  onPaintPixels,
  palette,
  hintPixelIndex,
  difficulty
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Calculate Brush Radius based on Difficulty
  // We use approximate screen pixels for tolerance
  const BRUSH_RADIUS_PX = React.useMemo(() => {
     switch(difficulty) {
        case 'easy': return 25;   // Large, forgiving
        case 'medium': return 12; // Standard
        case 'hard': return 4;    // Precise (almost point)
        default: return 12;
     }
  }, [difficulty]);

  const INTERPOLATION_STEP_PX = 5; // Step size for drag interpolation
  const PINCH_DEADZONE = 10; // Pixels change required to trigger zoom

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'paint' | 'move'>('paint');
  
  // Controls State
  const [showControls, setShowControls] = useState(false);
  const [isObstructed, setIsObstructed] = useState(false); // New state for fade out
  const controlsTimeoutRef = useRef<number | null>(null);
  const [controlsPos, setControlsPos] = useState({ x: 16, y: 16 });
  const isDraggingControls = useRef(false);
  const controlsDragOffset = useRef({ x: 0, y: 0 });
  
  // Dragging / Painting Logic State
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Pinch / Multi-touch State
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const prevPinchDist = useRef<number | null>(null);
  const prevPinchCenter = useRef<{ x: number; y: number } | null>(null);

  // Auto-revert mode timer
  const resetModeTimerRef = useRef<number | null>(null);

  const startModeResetTimer = () => {
    if (resetModeTimerRef.current) {
        window.clearTimeout(resetModeTimerRef.current);
    }
    // Revert to paint mode after 3 seconds of inactivity
    resetModeTimerRef.current = window.setTimeout(() => {
        setMode('paint');
    }, 3000);
  };

  const cancelModeResetTimer = () => {
    if (resetModeTimerRef.current) {
        window.clearTimeout(resetModeTimerRef.current);
        resetModeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => cancelModeResetTimer();
  }, []);

  const activateControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
        // Only hide if not currently dragging controls
        if (!isDraggingControls.current) {
            setShowControls(false);
        }
    }, 2500);
  };

  // Reset zoom logic
  const handleReset = () => {
    cancelModeResetTimer();
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMode('paint');
    activateControls();
  };

  // Auto-reset view when grid changes (new game)
  useEffect(() => {
    handleReset();
  }, [grid]);

  const handleZoom = (delta: number) => {
    activateControls();
    setZoom(prev => {
      const newZoom = Math.min(Math.max(prev + delta, 1), 5); // Clamp between 1x and 5x
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      } 
      return newZoom;
    });
  };

  // --- Controls Dragging ---
  const handleControlsDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingControls.current = true;
    activateControls();
    
    controlsDragOffset.current = {
        x: e.clientX - controlsPos.x,
        y: e.clientY - controlsPos.y
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleControlsMove = (e: React.PointerEvent) => {
    if (isDraggingControls.current) {
        e.stopPropagation();
        e.preventDefault();
        activateControls(); // Keep visible while dragging
        setControlsPos({
            x: e.clientX - controlsDragOffset.current.x,
            y: e.clientY - controlsDragOffset.current.y
        });
    }
  };

  const handleControlsUp = (e: React.PointerEvent) => {
    if (isDraggingControls.current) {
        e.stopPropagation();
        isDraggingControls.current = false;
        activateControls(); // Triggers timeout to eventually hide
    }
  };

  // --- Math Helpers for Hit Testing ---
  
  // Helper: Get all grid indices within a screen-space radius
  const getIndicesFromBrush = (clientX: number, clientY: number): number[] => {
      if (!containerRef.current) return [];
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      // Grid coordinate of the center
      const cx = w / 2;
      const cy = h / 2;
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      
      // Helper to transform screen to unscaled div coordinates
      const toGrid = (sx: number, sy: number) => {
          const gx = (sx - pan.x - cx) / zoom + cx;
          const gy = (sy - pan.y - cy) / zoom + cy;
          return { x: gx, y: gy };
      };

      // Calculate grid bounds of the brush (for optimization)
      // centerWorld is in CSS pixels relative to the unscaled content div (0 to W)
      const centerWorld = toGrid(rawX, rawY);
      
      // Convert to actual Grid Indices (0 to gridSize)
      const centerGrid = {
          x: centerWorld.x * (gridSize / w),
          y: centerWorld.y * (gridSize / h)
      };
      
      // Radius in grid units
      // 1 screen pixel = 1/zoom world pixels.
      // 1 world pixel = gridSize / w grid units.
      const scaleFactor = (gridSize / w) / zoom;
      const radiusGrid = BRUSH_RADIUS_PX * scaleFactor;
      
      const indices: number[] = [];
      const rSq = radiusGrid * radiusGrid;
      
      const minCol = Math.max(0, Math.floor(centerGrid.x - radiusGrid));
      const maxCol = Math.min(gridSize - 1, Math.ceil(centerGrid.x + radiusGrid));
      const minRow = Math.max(0, Math.floor(centerGrid.y - radiusGrid));
      const maxRow = Math.min(gridSize - 1, Math.ceil(centerGrid.y + radiusGrid));

      for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
              // Check distance
              const dx = c + 0.5 - centerGrid.x; // +0.5 to measure from center of cell
              const dy = r + 0.5 - centerGrid.y;
              if (dx*dx + dy*dy <= rSq) {
                  indices.push(r * gridSize + c);
              }
          }
      }
      
      // Fallback: If brush is too small (deep zoom) and misses center, pick the center pixel
      if (indices.length === 0) {
          const col = Math.floor(centerGrid.x);
          const row = Math.floor(centerGrid.y);
          if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
              indices.push(row * gridSize + col);
          }
      }
      
      return indices;
  };

  // --- Input Handlers ---

  const handlePointerDown = (e: React.PointerEvent) => {
    activateControls();
    cancelModeResetTimer();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch Check
    if (activePointers.current.size === 2) {
        const points = Array.from(activePointers.current.values()) as { x: number; y: number }[];
        prevPinchDist.current = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        prevPinchCenter.current = { 
            x: (points[0].x + points[1].x) / 2, 
            y: (points[0].y + points[1].y) / 2 
        };
        return;
    }

    // Single touch logic
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    
    // Paint immediately if 1 finger and paint mode
    if (activePointers.current.size === 1 && mode === 'paint') {
      const indices = getIndicesFromBrush(e.clientX, e.clientY);
      if (indices.length > 0) {
        onPaintPixels(indices);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') activateControls();
    if (activePointers.current.size > 0) cancelModeResetTimer();

    // --- PROXIMITY CHECK FOR CONTROLS FADING ---
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Approximate controls center (offset from top-left anchor)
      const cx = controlsPos.x + 26; // Half width
      const cy = controlsPos.y + 50; // Half height (approx)
      
      const dist = Math.hypot(x - cx, y - cy);
      // Fade if within 120px, in paint mode, and NOT currently dragging the controls themselves
      const shouldObstruct = dist < 120 && mode === 'paint' && !isDraggingControls.current;
      
      if (shouldObstruct !== isObstructed) {
          setIsObstructed(shouldObstruct);
      }
    }
    
    // Update pointer cache
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // --- PINCH / 2-FINGER PAN LOGIC ---
    if (activePointers.current.size === 2) {
        const points = Array.from(activePointers.current.values()) as { x: number; y: number }[];
        const p1 = points[0];
        const p2 = points[1];
        
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        if (prevPinchDist.current && prevPinchCenter.current) {
            // Zoom Delta
            const distDelta = dist - prevPinchDist.current;
            // Deadzone check for zoom to prevent accidental jitter
            if (Math.abs(distDelta) > PINCH_DEADZONE) {
                // Scaling factor
                handleZoom(distDelta * 0.005); 
            }

            // Pan Delta
            const dx = center.x - prevPinchCenter.current.x;
            const dy = center.y - prevPinchCenter.current.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        }

        prevPinchDist.current = dist;
        prevPinchCenter.current = center;
        return;
    }

    // --- SINGLE FINGER LOGIC ---
    if (!isDragging.current || activePointers.current.size !== 1) return;

    if (mode === 'move') {
      // PANNING LOGIC
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    } else {
      // PAINTING LOGIC (With Fluid Interpolation and Brush)
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      // Interpolate screen coordinates to fill gaps between touch events
      const dist = Math.hypot(currentX - lastPos.current.x, currentY - lastPos.current.y);
      const steps = Math.ceil(dist / INTERPOLATION_STEP_PX);
      
      const indicesToPaint = new Set<number>();
      
      // Interpolate steps
      for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const lx = lastPos.current.x + (currentX - lastPos.current.x) * t;
          const ly = lastPos.current.y + (currentY - lastPos.current.y) * t;
          
          const indices = getIndicesFromBrush(lx, ly);
          indices.forEach(idx => indicesToPaint.add(idx));
      }
      
      // Also include current exact position to be safe
      const currentIndices = getIndicesFromBrush(currentX, currentY);
      currentIndices.forEach(idx => indicesToPaint.add(idx));

      if (indicesToPaint.size > 0) {
          onPaintPixels(Array.from(indicesToPaint));
      }
      
      lastPos.current = { x: currentX, y: currentY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    
    // Clean up capture
    if (e.target instanceof HTMLElement) {
       try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    }

    // Start timer if interaction is done
    if (activePointers.current.size === 0) {
        isDragging.current = false;
        prevPinchDist.current = null;
        startModeResetTimer();
    } else if (activePointers.current.size === 1) {
        // If dropped from 2 fingers to 1, reset drag anchor for the remaining finger
        const remaining = activePointers.current.values().next().value as { x: number; y: number } | undefined;
        if (remaining) {
           lastPos.current = { x: remaining.x, y: remaining.y };
        }
        prevPinchDist.current = null;
        prevPinchCenter.current = null;
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    activateControls();
    if (e.ctrlKey) {
      e.preventDefault();
      cancelModeResetTimer();
      const delta = -e.deltaY * 0.01;
      handleZoom(delta);
      startModeResetTimer(); // Debounced reset
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[600px] aspect-square">
      
      {/* --- Controls Overlay (Draggable) --- */}
      <div 
        className={`absolute z-30 flex flex-col gap-2 transition-opacity duration-300 touch-none cursor-move ${showControls ? (isObstructed ? 'opacity-20' : 'opacity-100') : 'opacity-0 pointer-events-none'}`}
        style={{ 
            left: controlsPos.x, 
            top: controlsPos.y,
        }}
        onPointerDown={handleControlsDown}
        onPointerMove={handleControlsMove}
        onPointerUp={handleControlsUp}
      >
        {/* Grip Handle visual */}
        <div className="flex justify-center pb-1 cursor-move">
            <div className="w-12 h-1.5 bg-black/20 rounded-full backdrop-blur-sm"></div>
        </div>

        <div className="bg-white/90 backdrop-blur shadow-2xl rounded-2xl p-1.5 pointer-events-auto flex flex-col gap-1 border border-slate-200">
           <button 
             onClick={(e) => { e.stopPropagation(); cancelModeResetTimer(); handleZoom(0.5); startModeResetTimer(); }}
             onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button click
             className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors font-bold text-xl active:bg-indigo-100"
             title="Zoom In"
           >
             +
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); cancelModeResetTimer(); handleZoom(-0.5); startModeResetTimer(); }}
             onPointerDown={(e) => e.stopPropagation()}
             className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors font-bold text-xl active:bg-indigo-100"
             title="Zoom Out"
           >
             -
           </button>
           {zoom > 1 && (
             <button 
               onClick={(e) => { e.stopPropagation(); handleReset(); }}
               onPointerDown={(e) => e.stopPropagation()}
               className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors active:bg-red-100"
               title="Reset View"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </button>
           )}
        </div>

        {zoom > 1 && (
          <div className="bg-white/90 backdrop-blur shadow-2xl rounded-2xl p-1.5 pointer-events-auto border border-slate-200 mt-1">
            <button
               onClick={(e) => { 
                   e.stopPropagation(); 
                   const newMode = mode === 'paint' ? 'move' : 'paint';
                   setMode(newMode);
                   if (newMode === 'move') {
                       startModeResetTimer();
                   } else {
                       cancelModeResetTimer();
                   }
               }}
               onPointerDown={(e) => e.stopPropagation()}
               className={`
                 w-10 h-10 flex items-center justify-center rounded-xl transition-colors font-bold text-xl
                 ${mode === 'paint' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}
               `}
               title={mode === 'paint' ? "Current: Paint Mode" : "Current: Move Mode"}
            >
              {mode === 'paint' ? '🖌️' : '✋'}
            </button>
          </div>
        )}
      </div>

      {/* --- Main Grid Container --- */}
      <div 
        className="w-full h-full bg-slate-200 shadow-xl rounded-lg overflow-hidden border-4 border-slate-200 touch-none cursor-crosshair relative z-10"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <div 
          className="origin-center transition-transform duration-75 ease-out w-full h-full bg-white"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div 
            className="grid w-full h-full"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
          >
            {grid.map((pixel, i) => (
              <Pixel
                key={i}
                index={i}
                colorIndex={pixel.colorIndex}
                isColored={pixel.isColored}
                isActiveColor={pixel.colorIndex === activeColorIndex}
                isHint={i === hintPixelIndex}
                gridSize={gridSize}
                paletteColor={palette[pixel.colorIndex]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};