"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import type React from "react";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Track, Clip } from "@/types/editor";
import { TimelineTrack } from "./TimelineTrack";
import { formatTime } from "@/lib/utils";

interface TimelineProps {
  tracks: Track[];
  clips: Clip[];
  duration: number; // Total seconds
  currentTime: number; // Seconds
  selectedClipIds?: string[];
  markers?: Array<{ id: string; time: number; label?: string; color?: string }>;
  selectedMarkerId?: string | null;
  pixelsPerSecond: number;
  colors: {
      bg: string;
      panelBg: string;
      border: string;
      text: string;
      textSecondary: string;
      accent: string;
      trackBg: string;
      trackBorder: string;
  };
  onSeek: (time: number) => void;
  onClipUpdate: (clipId: string, updates: Partial<Clip>, options?: { commit?: boolean }) => void;
  onClipsUpdate: (
    updates: Array<{ id: string; updates: Partial<Clip> }>,
    options?: { commit?: boolean }
  ) => void;
  onAddTrack: () => void;
  onSelectClip: (clipId: string | null, event?: React.PointerEvent) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: (clipId?: string) => void;
  onMarkerAdd: (time: number) => void;
  onMarkerSelect: (markerId: string | null) => void;
  onDropClip: (data: { type: Clip["type"]; src?: string; options?: Partial<Clip> }, trackId: string, time: number) => void;
}

export const Timeline = ({
  tracks,
  clips,
  duration,
  currentTime,
  selectedClipIds,
  markers = [],
  selectedMarkerId,
  pixelsPerSecond,
  colors,
  onSeek,
  onClipUpdate,
  onClipsUpdate,
  onAddTrack,
  onSelectClip,
  onTrackUpdate,
  onSplit,
  onDuplicate,
  onDelete,
  onMarkerAdd,
  onMarkerSelect,
  onDropClip,
}: TimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const trackHeaderWidth = 120;
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);

  // Measure timeline width based on duration and zoom
  const timelineWidth = Math.max(duration * pixelsPerSecond, 1000);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    })
  );

  const handleDragStart = (event: any) => {
    if (event.active.data.current?.type === "clip") {
      onSelectClip(event.active.data.current.clip.id);
    }
  };

  const openContextMenu = (clipId: string, event: React.MouseEvent) => {
    if (!selectedClipIds?.includes(clipId)) {
      onSelectClip(clipId);
    }
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      clipId,
    });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const onClose = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", onClose);
    window.addEventListener("contextmenu", onClose);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onClose);
      window.removeEventListener("contextmenu", onClose);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  const snapPoints = useMemo(() => {
      const points = new Set<number>();
      points.add(0);
      points.add(duration);
      points.add(currentTime);
      markers.forEach((marker) => points.add(marker.time));
      clips.forEach((clip) => {
          points.add(clip.start);
          points.add(clip.start + clip.duration);
      });
      return Array.from(points);
  }, [clips, duration, currentTime, markers]);

  const getSnapDelta = (start: number, clipDuration: number, points: number[], thresholdSeconds: number) => {
      let bestDelta = 0;
      let bestDistance = thresholdSeconds + 1;
      for (const point of points) {
          const leftDelta = point - start;
          const rightDelta = point - (start + clipDuration);
          const leftDist = Math.abs(leftDelta);
          const rightDist = Math.abs(rightDelta);
          if (leftDist < bestDistance) {
              bestDistance = leftDist;
              bestDelta = leftDelta;
          }
          if (rightDist < bestDistance) {
              bestDistance = rightDist;
              bestDelta = rightDelta;
          }
      }
      return bestDistance <= thresholdSeconds ? bestDelta : 0;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (!active.data.current || active.data.current.type !== "clip") return;
    
    const clip = active.data.current.clip as Clip;
    const deltaSeconds = delta.x / pixelsPerSecond;

    const selectedSet = new Set(selectedClipIds ?? []);
    const isMultiDrag = selectedSet.size > 1 && selectedSet.has(clip.id);

    let newStart = Math.max(0, clip.start + deltaSeconds);
    let newTrackId = clip.trackId;

    if (over && over.data.current?.type === "track") {
        const targetTrack = tracks.find((t) => t.id === over.id);
        if (!targetTrack?.isLocked) {
          newTrackId = over.id as string;
        }
    }

    const snapThreshold = 8 / pixelsPerSecond;
    const selectedEdgePoints = new Set<number>();
    if (isMultiDrag) {
      clips.forEach((item) => {
        if (selectedSet.has(item.id)) {
          selectedEdgePoints.add(item.start);
          selectedEdgePoints.add(item.start + item.duration);
        }
      });
    }
    const points = snapPoints.filter((point) => {
      if (isMultiDrag) {
        return !selectedEdgePoints.has(point);
      }
      return point !== clip.start && point !== clip.start + clip.duration;
    });
    const snapDelta = getSnapDelta(newStart, clip.duration, points, snapThreshold);
    newStart = Math.max(0, newStart + snapDelta);

    if (isMultiDrag) {
      const finalDelta = newStart - clip.start;
      const updates = clips
        .filter((item) => selectedSet.has(item.id))
        .map((item) => ({
          id: item.id,
          updates: { start: Math.max(0, item.start + finalDelta), trackId: newTrackId },
        }));
      onClipsUpdate(updates, { commit: true });
      return;
    }

    onClipUpdate(clip.id, {
        start: newStart,
        trackId: newTrackId,
    }, { commit: true });
  };

  // Scrubbing Logic
  const handleRulerInteract = (e: React.MouseEvent | MouseEvent) => {
      if(!rulerRef.current) return;
      
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const relativeX = clickX - trackHeaderWidth;
      const newTime = Math.max(0, relativeX) / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
      if(isScrubbing) {
          const onMove = (e: MouseEvent) => handleRulerInteract(e);
          const onUp = () => setIsScrubbing(false);
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
          return () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
          }
      }
  }, [isScrubbing, pixelsPerSecond, duration]); 

  // Generate dynamic ruler ticks based on zoom level
  const renderRuler = () => {
      const ticks = [];
      const step = pixelsPerSecond < 20 ? 10 : pixelsPerSecond < 60 ? 5 : 1; // Seconds per major tick
      const totalTicks = Math.ceil(duration / step);

      for (let i = 0; i <= totalTicks; i++) {
          const time = i * step;
          const left = trackHeaderWidth + time * pixelsPerSecond;
          ticks.push(
              <div key={i} className="absolute top-0 bottom-0 flex flex-col items-start pl-1" style={{ left, borderLeft: `1px solid ${colors.border}` }}>
                  <span className="text-[9px] font-mono select-none" style={{ color: colors.textSecondary }}>{formatTime(time)}</span>
                  <div className="h-1.5 w-px mt-auto" style={{ backgroundColor: colors.border }}></div>
              </div>
          );
          
          // Minor ticks
          const minorCount = 5;
          const minorStep = step / minorCount;
          for(let j=1; j<minorCount; j++) {
              const minorTime = time + (j * minorStep);
              if(minorTime > duration) break;
              ticks.push(
                  <div key={`${i}-${j}`} className="absolute bottom-0 h-1 w-px" style={{ left: trackHeaderWidth + minorTime * pixelsPerSecond, backgroundColor: colors.border }}></div>
              );
          }
      }
      return ticks;
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full select-none relative overflow-hidden" style={{ backgroundColor: colors.bg }} ref={containerRef}>
        
        {/* Playhead (Fixed Overlay) */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto relative custom-scrollbar">
            <div style={{ width: timelineWidth + trackHeaderWidth, minHeight: '100%' }} className="relative">
                
                {/* 1. Ruler */}
                <div 
                    ref={rulerRef}
                    className="h-6 sticky top-0 z-20 cursor-pointer relative"
                    style={{ 
                        paddingLeft: trackHeaderWidth,
                        backgroundColor: colors.panelBg,
                        borderBottom: `1px solid ${colors.border}`
                    }}
                    onMouseDown={(e) => {
                        setIsScrubbing(true);
                        handleRulerInteract(e);
                    }}
                    onDoubleClick={(e) => {
                        const rect = rulerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const clickX = e.clientX - rect.left - trackHeaderWidth;
                        const markerTime = Math.max(0, clickX) / pixelsPerSecond;
                        onMarkerAdd(markerTime);
                    }}
                >
                    <div 
                        className="absolute left-0 top-0 h-full flex items-center px-2 text-[10px] tracking-wider" 
                        style={{ 
                            width: trackHeaderWidth,
                            backgroundColor: colors.panelBg,
                            borderRight: `1px solid ${colors.border}`,
                            color: colors.textSecondary
                        }}
                    >
                      轨道
                    </div>
                    {renderRuler()}
                </div>

                {/* 2. Playhead Line */}
                <div 
                    className="absolute top-0 bottom-0 w-px z-30 pointer-events-none"
                    style={{ left: trackHeaderWidth + currentTime * pixelsPerSecond, backgroundColor: colors.accent }}
                >
                    <div className="absolute -top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" style={{ borderTopColor: colors.accent }} />
                </div>

                {/* Markers */}
                {markers.map((marker) => {
                  const left = trackHeaderWidth + marker.time * pixelsPerSecond;
                  const color = marker.color ?? colors.accent;
                  const isSelected = selectedMarkerId === marker.id;
                  return (
                    <div
                      key={marker.id}
                      className="absolute top-0 bottom-0 z-20"
                      style={{ left }}
                    >
                      <div
                        className="absolute top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent"
                        style={{ borderTop: `8px solid ${color}` }}
                      />
                      <div
                        className="absolute top-0 bottom-0"
                        style={{ width: isSelected ? 2 : 1, backgroundColor: color, opacity: isSelected ? 1 : 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkerSelect(marker.id);
                          onSelectClip(null);
                        }}
                      />
                    </div>
                  );
                })}


                {/* 3. Tracks */}
                <div className="py-2 space-y-2 px-2">
                              {tracks.map((track) => (
                                <TimelineTrack
                                  key={track.id}
                                  track={track}
                                  clips={clips.filter((c) => c.trackId === track.id)}
                                  timelineWidth={timelineWidth}
                                  pixelsPerSecond={pixelsPerSecond} // Pass zoom level
                                  trackHeaderWidth={trackHeaderWidth}
                                  selectedClipIds={selectedClipIds}
                                  colors={colors}
                                  onClearSelection={() => {
                                    onSelectClip(null);
                                    onMarkerSelect(null);
                                  }}
                                  onSelectClip={onSelectClip}
                                  onResizeClip={onClipUpdate}
                                  onTrackUpdate={onTrackUpdate}
                                  onClipContextMenu={openContextMenu}
                                  onDropClip={onDropClip}
                                />
                              ))}                    
                    {/* Add Track Button (Inline) */}
                    <button 
                        onClick={onAddTrack}
                        className="mt-2 text-xs border border-dashed px-4 py-1 rounded"
                        style={{ 
                            marginLeft: trackHeaderWidth,
                            borderColor: colors.border,
                            color: colors.textSecondary
                        }}
                    >
                        + 添加轨道
                    </button>
                </div>
            </div>
        </div>

        <DragOverlay>
            {/* Removed yellow overlay as per user request */}
        </DragOverlay>
      </div>
      {contextMenu && (
        <div
          className="fixed z-50 rounded shadow-xl text-xs min-w-[140px]"
          style={{ 
              left: contextMenu.x, 
              top: contextMenu.y,
              backgroundColor: colors.panelBg,
              border: `1px solid ${colors.border}`,
              color: colors.text
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onSplit();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 hover:opacity-80"
            style={{ backgroundColor: 'transparent' }}
          >
            拆分
          </button>
          <button
            onClick={() => {
              onDuplicate();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 hover:opacity-80"
          >
            复制
          </button>
          <button
            onClick={() => {
              onDelete(contextMenu.clipId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 hover:opacity-80 text-red-500"
          >
            删除
          </button>
        </div>
      )}
    </DndContext>
  );
};
