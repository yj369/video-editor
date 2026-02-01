"use client";

import { Clip } from "@/types/editor";
import { useMemo, useRef, useState } from "react";

interface PreviewOverlayProps {
  clip: Clip | null;
  projectWidth: number;
  projectHeight: number;
  containerWidth: number;
  containerHeight: number;
  onUpdate: (id: string, updates: Partial<Clip>, options?: { commit?: boolean }) => void;
}

type DragMode = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | "rotate";

export const PreviewOverlay = ({
  clip,
  projectWidth,
  projectHeight,
  containerWidth,
  containerHeight,
  onUpdate,
}: PreviewOverlayProps) => {
  const lastUpdatesRef = useRef<Partial<Clip> | null>(null);
  const dragPointerRef = useRef<{ id: number; el: Element } | null>(null);
  const [dragState, setDragState] = useState<{
    startX: number;
    startY: number;
    startClip: { x: number; y: number; w: number; h: number; r: number };
    mode: DragMode;
  } | null>(null);

  // 1. Calculate Scale & Offsets (Map Video -> Screen)
  const { scale, offsetX, offsetY } = useMemo(() => {
    if (!projectWidth || !projectHeight || !containerWidth || !containerHeight) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }
    const scaleX = containerWidth / projectWidth;
    const scaleY = containerHeight / projectHeight;
    const scale = Math.min(scaleX, scaleY);
    const displayedWidth = projectWidth * scale;
    const displayedHeight = projectHeight * scale;
    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;
    return { scale, offsetX, offsetY };
  }, [projectWidth, projectHeight, containerWidth, containerHeight]);

  if (!clip || !["video", "image", "text"].includes(clip.type)) return null;

  // Clip Data
  const clipX = clip.x ?? projectWidth / 2;
  const clipY = clip.y ?? projectHeight / 2;
  const clipW = clip.width ? Number(clip.width) : 0;
  const clipH = clip.height ? Number(clip.height) : 0;
  const clipR = clip.rotation ?? 0;

  // Screen Geometry
  const screenX = offsetX + clipX * scale;
  const screenY = offsetY + clipY * scale;
  const screenW = clipW * scale;
  const screenH = clipH * scale;

  const computeUpdates = (clientX: number, clientY: number, state: NonNullable<typeof dragState>) => {
    const { startX, startY, mode, startClip } = state;
    const dxScreen = clientX - startX;
    const dyScreen = clientY - startY;
    const dx = dxScreen / scale;
    const dy = dyScreen / scale;
    let updates: Partial<Clip> = {};

    if (mode === "move") {
      updates = {
        x: startClip.x + dx,
        y: startClip.y + dy,
      };
      return updates;
    }

    if (mode === "rotate") {
      const centerX = offsetX + startClip.x * scale;
      const centerY = offsetY + startClip.y * scale;
      const startAngle = Math.atan2(startY - centerY, startX - centerX);
      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);
      const deltaDeg = (currentAngle - startAngle) * (180 / Math.PI);
      updates = {
        rotation: (startClip.r + deltaDeg) % 360,
      };
      return updates;
    }

    const rad = (-startClip.r * Math.PI) / 180;
    const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);

    let dLeft = 0;
    let dRight = 0;
    let dTop = 0;
    let dBottom = 0;

    if (mode.includes("e")) dRight = localDx;
    if (mode.includes("w")) dLeft = -localDx;
    if (mode.includes("s")) dBottom = localDy;
    if (mode.includes("n")) dTop = -localDy;

    const finalW = Math.max(1, startClip.w + dRight + dLeft);
    const finalH = Math.max(1, startClip.h + dTop + dBottom);
    const shiftX = (dRight - dLeft) / 2;
    const shiftY = (dBottom - dTop) / 2;

    const radFwd = (startClip.r * Math.PI) / 180;
    const globalShiftX = shiftX * Math.cos(radFwd) - shiftY * Math.sin(radFwd);
    const globalShiftY = shiftX * Math.sin(radFwd) + shiftY * Math.cos(radFwd);

    updates = {
      width: finalW,
      height: finalH,
      x: startClip.x + globalShiftX,
      y: startClip.y + globalShiftY,
    };
    return updates;
  };

  const handlePointerDown = (e: React.PointerEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragPointerRef.current = { id: e.pointerId, el: e.currentTarget };
    const nextState = {
      startX: e.clientX,
      startY: e.clientY,
      mode,
      startClip: { x: clipX, y: clipY, w: clipW, h: clipH, r: clipR },
    };
    setDragState(nextState);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!nextState) return;
      const updates = computeUpdates(moveEvent.clientX, moveEvent.clientY, nextState);
      lastUpdatesRef.current = updates;
      onUpdate(clip.id, updates, { commit: false });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (nextState) {
        const updates = computeUpdates(upEvent.clientX, upEvent.clientY, nextState);
        lastUpdatesRef.current = updates;
        onUpdate(clip.id, updates, { commit: true });
      }
      setDragState(null);
      lastUpdatesRef.current = null;
      if (dragPointerRef.current) {
        try {
          dragPointerRef.current.el.releasePointerCapture(dragPointerRef.current.id);
        } catch {}
        dragPointerRef.current = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const Handle = ({ mode, cursor, style }: { mode: DragMode; cursor: string; style?: React.CSSProperties }) => (
    <div
      onPointerDown={(e) => handlePointerDown(e, mode)}
      className="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm z-50 pointer-events-auto"
      style={{
        cursor,
        transform: "translate(-50%, -50%)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        ...style,
      }}
    />
  );

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ width: containerWidth, height: containerHeight }}
    >
      <div
        className="absolute border-2 border-blue-500 pointer-events-none"
        style={{
          left: screenX,
          top: screenY,
          width: screenW,
          height: screenH,
          transform: `translate(-50%, -50%) rotate(${clipR}deg)`,
        }}
      >
        {/* Fill area for dragging */}
        <div 
            className="absolute inset-0 cursor-move pointer-events-auto opacity-0 hover:opacity-10 transition-opacity bg-blue-500"
            onPointerDown={(e) => handlePointerDown(e, "move")}
        />

        {/* Pivot */}
        <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Resize Handles */}
        <Handle mode="nw" cursor="nw-resize" style={{ left: 0, top: 0 }} />
        <Handle mode="n" cursor="n-resize" style={{ left: "50%", top: 0 }} />
        <Handle mode="ne" cursor="ne-resize" style={{ left: "100%", top: 0 }} />
        <Handle mode="w" cursor="w-resize" style={{ left: 0, top: "50%" }} />
        <Handle mode="e" cursor="e-resize" style={{ left: "100%", top: "50%" }} />
        <Handle mode="sw" cursor="sw-resize" style={{ left: 0, top: "100%" }} />
        <Handle mode="s" cursor="s-resize" style={{ left: "50%", top: "100%" }} />
        <Handle mode="se" cursor="se-resize" style={{ left: "100%", top: "100%" }} />

        {/* Rotation Handle */}
        <div 
            className="absolute left-1/2 -top-8 w-px h-8 bg-blue-500 -translate-x-1/2 pointer-events-none"
        />
        <div
            onPointerDown={(e) => handlePointerDown(e, "rotate")}
            className="absolute left-1/2 -top-8 w-4 h-4 bg-white border border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-grab pointer-events-auto z-50 flex items-center justify-center shadow-sm"
        >
            <div className="w-1 h-1 bg-blue-500 rounded-full" />
        </div>

      </div>
    </div>
  );
};
