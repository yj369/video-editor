"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clip } from "@/types/editor";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

interface TimelineClipProps {
  clip: Clip;
  pixelsPerSecond: number;
  height: number;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect?: (event: React.PointerEvent) => void;
  onResize?: (clipId: string, updates: Partial<Clip>, options?: { commit?: boolean }) => void;
  onContextMenu?: (clipId: string, event: React.MouseEvent) => void;
}

const waveformCache = new Map<string, number[]>();

const useAudioPeaks = (src?: string, sampleCount = 80) => {
  const [peaks, setPeaks] = useState<number[] | null>(null);

  useEffect(() => {
    if (!src) {
      setPeaks(null);
      return;
    }

    if (waveformCache.has(src)) {
      setPeaks(waveformCache.get(src) ?? null);
      return;
    }

    let cancelled = false;
    const decode = async () => {
      try {
        const res = await fetch(src);
        const buffer = await res.arrayBuffer();
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(buffer);
        const channel = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(channel.length / sampleCount);
        const peaksData = new Array(sampleCount).fill(0).map((_, i) => {
          const start = i * blockSize;
          const end = Math.min(channel.length, start + blockSize);
          let max = 0;
          for (let j = start; j < end; j++) {
            const v = Math.abs(channel[j]);
            if (v > max) max = v;
          }
          return max;
        });
        waveformCache.set(src, peaksData);
        if (!cancelled) {
          setPeaks(peaksData);
        }
        ctx.close();
      } catch {
        if (!cancelled) setPeaks(null);
      }
    };

    decode();
    return () => {
      cancelled = true;
    };
  }, [src, sampleCount]);

  return peaks;
};

export const TimelineClip = ({ clip, pixelsPerSecond, height, isSelected, isLocked, onSelect, onResize, onContextMenu }: TimelineClipProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: clip.id,
    data: {
      type: "clip",
      clip,
    },
    disabled: !onResize || Boolean(isLocked),
  });

  const [localUpdates, setLocalUpdates] = useState<Partial<Clip> | null>(null);
  const effectiveClip = localUpdates ? { ...clip, ...localUpdates } : clip;

  const width = effectiveClip.duration * pixelsPerSecond;
  const left = effectiveClip.start * pixelsPerSecond;
  const transitionInWidth = (effectiveClip.transitions?.in ?? 0) * pixelsPerSecond;
  const transitionOutWidth = (effectiveClip.transitions?.out ?? 0) * pixelsPerSecond;
  const keyframeTimes = useMemo(() => {
    const times = new Set<number>();
    const keyframes = effectiveClip.keyframes ?? {};
    Object.values(keyframes).forEach((list) => {
      list?.forEach((kf) => times.add(kf.time));
    });
    return Array.from(times).filter((t) => t >= effectiveClip.start && t <= effectiveClip.start + effectiveClip.duration);
  }, [effectiveClip.keyframes, effectiveClip.start, effectiveClip.duration]);

  const peaks = useAudioPeaks(effectiveClip.type === "audio" ? effectiveClip.src : undefined);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!waveformRef.current || !peaks) return;
    const canvas = waveformRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const mid = rect.height / 2;
    const barWidth = rect.width / peaks.length;
    peaks.forEach((peak, i) => {
      const barHeight = Math.max(2, peak * rect.height);
      ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    });
  }, [peaks, width, height]);

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
  };

  const bgColor = useMemo(() => {
    switch (effectiveClip.type) {
      case "background": return "bg-[#0f172a]";
      case "video": return "bg-[#3b82f6]";
      case "audio": return "bg-[#10b981]";
      case "text": return "bg-[#a855f7]";
      default: return "bg-[#6b7280]";
    }
  }, [effectiveClip.type]);

  const handleResizeStart = (e: React.PointerEvent, edge: "left" | "right") => {
      e.stopPropagation();
      e.preventDefault();
      if (isLocked) return;
      
      // Capture pointer for smoother tracking outside element
      e.currentTarget.setPointerCapture(e.pointerId);
      
      const startX = e.clientX;
      const startDuration = clip.duration;
      const startStartTime = clip.start;
      let finalUpdates: Partial<Clip> = {};

      const onPointerMove = (moveEvent: PointerEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaSeconds = deltaX / pixelsPerSecond;

          if (edge === "right") {
              const newDuration = Math.max(0.1, startDuration + deltaSeconds);
              finalUpdates = { duration: newDuration };
              setLocalUpdates(finalUpdates);
          } else {
              // Left edge resizing changes start time AND duration
              const newStart = Math.min(startStartTime + deltaSeconds, startStartTime + startDuration - 0.1);
              const newDuration = Math.max(0.1, startDuration - (newStart - startStartTime));
              finalUpdates = { start: newStart, duration: newDuration };
              setLocalUpdates(finalUpdates);
          }
      };

      const onPointerUp = (upEvent: PointerEvent) => {
          if (Object.keys(finalUpdates).length > 0) {
              onResize?.(clip.id, finalUpdates, { commit: true });
          }
          setLocalUpdates(null);
          // Release capture inside the component context if possible, or just standard cleanup
          // React event target might be lost, but window listener is robust.
          // Note: setPointerCapture auto releases on up/cancel usually.
          
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(() => {
        const { onPointerDown, ...rest } = listeners || {};
        return rest;
      })()}
      {...attributes}
      onPointerDown={(e) => {
        if (isLocked) return;
        onSelect?.(e);
        listeners?.onPointerDown?.(e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(clip.id, e);
      }}
      className={`absolute top-0 rounded-md border-[2px] ${
        isSelected ? "border-white z-20" : "border-transparent"
      } ${bgColor} ${
        isDragging ? "opacity-50 z-50 cursor-grabbing scale-105" : "opacity-90 cursor-grab hover:brightness-110"
      } ${isLocked ? "cursor-not-allowed opacity-60" : ""} shadow-md flex items-center px-2 overflow-hidden whitespace-nowrap text-[10px] text-white font-medium select-none group`}
    >
      {clip.type !== "audio" && (
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "22px 100%" }}></div>
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35))" }}></div>
        </div>
      )}

      {clip.type === "audio" && (
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          {peaks ? (
            <canvas ref={waveformRef} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 6px)" }} />
          )}
        </div>
      )}

      {/* Resize Handles */}
      {isSelected && !isLocked && (
        <>
          <div 
            onPointerDown={(e) => handleResizeStart(e, "left")}
            className="absolute left-0 top-0 bottom-0 w-3 bg-transparent cursor-w-resize hover:bg-white/10 flex items-center justify-center z-30"
          >
             <div className="h-4 w-1 bg-white rounded-full shadow-sm"></div>
          </div>
          <div 
            onPointerDown={(e) => handleResizeStart(e, "right")}
            className="absolute right-0 top-0 bottom-0 w-3 bg-transparent cursor-e-resize hover:bg-white/10 flex items-center justify-center z-30"
          >
             <div className="h-4 w-1 bg-white rounded-full shadow-sm"></div>
          </div>
        </>
      )}

      <div className="w-full truncate pl-2 pointer-events-none">{effectiveClip.name}</div>

      {transitionInWidth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: transitionInWidth, background: "linear-gradient(90deg, rgba(255,255,255,0.25), transparent)" }}
        />
      )}
      {transitionOutWidth > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0"
          style={{ width: transitionOutWidth, background: "linear-gradient(270deg, rgba(255,255,255,0.25), transparent)" }}
        />
      )}

      {keyframeTimes.map((t) => (
        <div
          key={`${clip.id}-${t}`}
          className="absolute bottom-1 h-1.5 w-1.5 bg-white/90 rounded-full shadow-sm"
          style={{ left: Math.max(2, (t - clip.start) * pixelsPerSecond - 1) }}
        />
      ))}
    </div>
  );
};
