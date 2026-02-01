"use client";

import { useDroppable } from "@dnd-kit/core";
import type React from "react";
import { Track, Clip } from "@/types/editor";
import { TimelineClip } from "./TimelineClip";
import { Eye, EyeOff, Lock, Unlock, Volume2, VolumeX } from "lucide-react";

interface TimelineTrackProps {
  track: Track;
  clips: Clip[];
  timelineWidth: number;
  pixelsPerSecond: number;
  trackHeaderWidth: number;
  selectedClipIds?: string[];
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
  onClearSelection: () => void;
  onSelectClip: (clipId: string | null, event?: React.PointerEvent) => void;
  onResizeClip: (clipId: string, updates: Partial<Clip>, options?: { commit?: boolean }) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
  onClipContextMenu: (clipId: string, event: React.MouseEvent) => void;
  onDropClip: (data: { type: Clip["type"]; src?: string; options?: Partial<Clip> }, trackId: string, time: number) => void;
}

export const TimelineTrack = ({
  track,
  clips,
  timelineWidth,
  pixelsPerSecond,
  trackHeaderWidth,
  selectedClipIds,
  colors,
  onClearSelection,
  onSelectClip,
  onResizeClip,
  onTrackUpdate,
  onClipContextMenu,
  onDropClip,
}: TimelineTrackProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: track.id,
    data: {
      type: "track",
      track,
    },
    disabled: Boolean(track.isLocked),
  });

  const isMuted = Boolean(track.isMuted);
  const isHidden = Boolean(track.isHidden);
  const isLocked = Boolean(track.isLocked);
  const selectedSet = selectedClipIds ? new Set(selectedClipIds) : new Set<string>();
  const trackTypeLabel = track.type === "background" ? "网格" : track.type;

  return (
    <div 
        className="flex transition-colors group relative" 
        style={{ 
            borderBottom: `1px solid ${colors.trackBorder}`, 
            backgroundColor: colors.trackBg 
        }}
    >
      {/* Track Header */}
      <div
        className="flex-none p-2 flex flex-col justify-center transition-colors z-20 sticky left-0 border-r"
        style={{ 
            width: trackHeaderWidth,
            backgroundColor: colors.panelBg,
            borderColor: colors.trackBorder,
            opacity: isHidden ? 0.7 : 1
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${track.type === "audio" ? "bg-emerald-400" : track.type === "text" ? "bg-purple-400" : track.type === "background" ? "bg-cyan-400" : track.type === "image" ? "bg-yellow-400" : "bg-blue-400"}`} />
          <div className="text-xs font-medium truncate transition-colors" style={{ color: colors.text }}>{track.label}</div>
        </div>
        <div className="text-[9px] uppercase mt-0.5" style={{ color: colors.textSecondary }}>{trackTypeLabel}</div>
        <div className="mt-2 flex items-center gap-1" style={{ color: colors.textSecondary }}>
          <button
            className={`p-1 rounded hover:bg-white/10 ${isMuted ? "text-emerald-400" : ""}`}
            onClick={() => onTrackUpdate(track.id, { isMuted: !isMuted })}
            title={isMuted ? "取消静音" : "静音"}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <button
            className={`p-1 rounded hover:bg-white/10 ${isHidden ? "text-yellow-400" : ""}`}
            onClick={() => onTrackUpdate(track.id, { isHidden: !isHidden })}
            title={isHidden ? "显示" : "隐藏"}
          >
            {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button
            className={`p-1 rounded hover:bg-white/10 ${isLocked ? "text-red-400" : ""}`}
            onClick={() => onTrackUpdate(track.id, { isLocked: !isLocked })}
            title={isLocked ? "解锁" : "锁定"}
          >
            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        </div>
      </div>

      {/* Track Content */}
      <div
        ref={setNodeRef}
        className={`relative h-11 my-1 mx-0 transition-colors ${
          isOver ? "bg-white/5 ring-1 ring-blue-500/50" : ""
        } ${isLocked ? "opacity-70" : ""} ${isHidden ? "opacity-60" : ""}`}
        style={{ width: timelineWidth }} // Ensure track is wide enough
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            onClearSelection();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (isLocked) return;
          const payload = e.dataTransfer.getData("application/x-editor-clip");
          if (!payload) return;
          const data = JSON.parse(payload) as { type: Clip["type"]; src?: string; options?: Partial<Clip> };
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const time = Math.max(0, x / pixelsPerSecond);
          onDropClip(data, track.id, time);
        }}
      >
        {clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            height={40}
            isSelected={selectedSet.has(clip.id)}
            isLocked={isLocked}
            onSelect={(event) => onSelectClip(clip.id, event)}
            onResize={onResizeClip}
            onContextMenu={onClipContextMenu}
          />
        ))}
      </div>
    </div>
  );
};
