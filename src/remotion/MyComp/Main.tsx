import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";
import { MotionARoll, BRollLayer, SubtitleLayer } from "./Styles";

loadFont();

// Use loose typing to prevent validation crashes during preview
export const Main = ({
  clips,
  tracks,
  bgKeywords,
  positiveWords,
  negativeWords,
  gridDirection,
}: {
  clips: any[];
  tracks: any[];
  bgKeywords?: string[];
  positiveWords?: string[];
  negativeWords?: string[];
  gridDirection?: "forward" | "backward";
}) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const time = frame / fps;
  const baseWidth = 360;
  const baseHeight = 640;
  const scale = Math.min(width / baseWidth, height / baseHeight);
  const offsetX = (width - baseWidth * scale) / 2;
  const offsetY = (height - baseHeight * scale) / 2;

  if (!clips || !Array.isArray(clips)) {
      return (
          <AbsoluteFill style={{ backgroundColor: "#000", alignItems: 'center', justifyContent: 'center' }}>
              <h2 style={{ color: '#ef4444', fontFamily: 'sans-serif', zIndex: 10 }}>No Clips Data Found</h2>
          </AbsoluteFill>
      )
  }

  const trackMap = new Map<string, { isMuted?: boolean; isHidden?: boolean; isLocked?: boolean }>();
  if (Array.isArray(tracks)) {
      tracks.forEach((track) => {
          trackMap.set(track.id, {
              isMuted: Boolean(track.isMuted),
              isHidden: Boolean(track.isHidden),
              isLocked: Boolean(track.isLocked),
          });
      });
  }

  const NoiseOverlay = ({ opacity = 0.05 }: { opacity?: number }) => (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: opacity,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
  );

  const CyberGrid = ({ frame, config }: { frame: number; config: any }) => {
      const {
          gridSize,
          aspectRatio,
          lineWidth,
          speed,
          direction,
          gridColor,
          bgTopColor,
          bgBottomColor,
          scanlineOpacity,
          vignetteIntensity,
          glowIntensity,
          pulseSpeed,
          noiseOpacity,
      } = config;

      const gridWidth = gridSize * aspectRatio;
      const gridHeight = gridSize;

      const rad = (direction * Math.PI) / 180;
      const moveX = Math.sin(rad) * speed;
      const moveY = -Math.cos(rad) * speed;
      const offsetX = (frame * moveX) % gridWidth;
      const offsetY = (frame * moveY) % gridHeight;

      const pulse = pulseSpeed > 0
        ? 1 + Math.sin(frame * pulseSpeed * 0.1) * 0.2 * glowIntensity
        : 1;
      const currentGlow = glowIntensity * pulse;

      return (
        <AbsoluteFill style={{ backgroundColor: bgBottomColor }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to bottom, ${bgTopColor}, ${bgBottomColor})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-100%',
              width: '300%',
              height: '300%',
              backgroundImage: `
                linear-gradient(${gridColor} ${lineWidth}px, transparent ${lineWidth}px),
                linear-gradient(90deg, ${gridColor} ${lineWidth}px, transparent ${lineWidth}px)
              `,
              backgroundSize: `${gridWidth}px ${gridHeight}px`,
              backgroundPosition: `${offsetX}px ${offsetY}px`,
              filter: currentGlow > 0 ? `drop-shadow(0 0 ${currentGlow * 10}px ${gridColor})` : 'none',
              opacity: 0.8,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle, transparent ${100 - vignetteIntensity * 100}%, #000 120%)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
              backgroundSize: '100% 2px, 3px 100%',
              pointerEvents: 'none',
              opacity: scanlineOpacity,
            }}
          />
          <NoiseOverlay opacity={noiseOpacity} />
        </AbsoluteFill>
      );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=VT323&display=swap');
          .font-handwriting { font-family: 'Caveat', cursive; }
          .font-digital { font-family: 'VT323', monospace; }
        `}</style>
        {clips.map((clip, index) => {
          const trackState = trackMap.get(clip.trackId);
          if (trackState?.isHidden && clip.type !== "audio") {
              return null;
          }

        // Safe access to properties
        const start = Number(clip.start) || 0;
        const duration = Number(clip.duration) || 0;
        
        const from = Math.round(start * fps);
        const durationInFrames = Math.round(duration * fps);
        
        if (durationInFrames <= 0) return null;

        const resolveKeyframe = (keyframes: Array<{ time: number; value: number }> | undefined, fallback: number) => {
            if (!keyframes || keyframes.length === 0) return fallback;
            const sorted = [...keyframes].sort((a, b) => a.time - b.time);
            if (time <= sorted[0].time) return sorted[0].value;
            const last = sorted[sorted.length - 1];
            if (time >= last.time) return last.value;
            for (let i = 0; i < sorted.length - 1; i++) {
                const left = sorted[i];
                const right = sorted[i + 1];
                if (time >= left.time && time <= right.time) {
                    const progress = (time - left.time) / Math.max(0.0001, right.time - left.time);
                    return interpolate(progress, [0, 1], [left.value, right.value], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                }
            }
            return fallback;
        };

        // Visual properties with defaults
        const x = resolveKeyframe(clip.keyframes?.x, (clip.x !== undefined && clip.x !== null) ? Number(clip.x) : baseWidth / 2);
        const y = resolveKeyframe(clip.keyframes?.y, (clip.y !== undefined && clip.y !== null) ? Number(clip.y) : baseHeight / 2);
        const w = clip.width ? Number(clip.width) : undefined;
        const h = clip.height ? Number(clip.height) : undefined;
        const scale = resolveKeyframe(clip.keyframes?.scale, Number(clip.scale) || 1);
        const rotation = resolveKeyframe(clip.keyframes?.rotation, Number(clip.rotation) || 0);
        const baseOpacity = resolveKeyframe(clip.keyframes?.opacity, clip.opacity !== undefined ? Number(clip.opacity) : 1);
        const zIndex = Number(clip.zIndex) || index; // Fallback to index if no zIndex

        const transitionIn = Number(clip.transitions?.in) || 0;
        const transitionOut = Number(clip.transitions?.out) || 0;
        const transitionType = clip.transitions?.type ?? "fade";
        const clipStart = start;
        const clipEnd = start + duration;
        const fadeIn = transitionIn > 0 && transitionType === "fade"
          ? Math.min(1, Math.max(0, (time - clipStart) / transitionIn))
          : 1;
        const fadeOut = transitionOut > 0 && transitionType === "fade"
          ? Math.min(1, Math.max(0, (clipEnd - time) / transitionOut))
          : 1;
        const transitionOpacity = fadeIn * fadeOut;
        const opacity = baseOpacity * transitionOpacity;

        const style: React.CSSProperties = {
            position: "absolute",
            left: x,
            top: y,
            width: w,
            height: h,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
            opacity: opacity,
            zIndex: zIndex,
        };

        const keyframedVolume = resolveKeyframe(clip.keyframes?.volume, Number(clip.volume) || 1);
        const volume = trackState?.isMuted ? 0 : keyframedVolume * transitionOpacity;

        // Determine if we should use the new style components
        // For background:
        const overlayStyle: React.CSSProperties = {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity,
            zIndex,
            pointerEvents: "none",
        };

        if (clip.type === "background" && clip.motionStyle) {
             return (
                <Sequence key={clip.id} from={from} durationInFrames={durationInFrames} layout="none">
                    <div style={overlayStyle}>
                        <MotionARoll
                          style={clip.motionStyle}
                          frame={frame - from}
                          fps={fps}
                          bgKeywords={bgKeywords}
                          gridDirection={gridDirection}
                        />
                    </div>
                </Sequence>
             );
        }

        // For text:
        if (clip.type === "text" && clip.subtitleStyle) {
             return (
                <Sequence key={clip.id} from={from} durationInFrames={durationInFrames} layout="none">
                    <div style={overlayStyle}>
                        <SubtitleLayer 
                            text={clip.src} 
                            frame={frame - from} 
                            style={clip.subtitleStyle} 
                            highlightWords={clip.highlightWords}
                            event={clip.sentiment}
                            positiveWords={positiveWords}
                            negativeWords={negativeWords}
                        />
                    </div>
                </Sequence>
             );
        }

        // For visual (image/video) with style:
        if ((clip.type === "image" || clip.type === "video") && clip.visualStyle && clip.src) {
             return (
                <Sequence key={clip.id} from={from} durationInFrames={durationInFrames} layout="none">
                    <div style={overlayStyle}>
                        <BRollLayer 
                            src={clip.src} 
                            frame={frame - from} 
                            style={clip.visualStyle} 
                            event={clip.sentiment}
                            positiveWords={positiveWords}
                            negativeWords={negativeWords}
                        />
                    </div>
                </Sequence>
             );
        }

        return (
          <Sequence
            key={clip.id}
            from={from}
            durationInFrames={durationInFrames}
            layout="none" 
          >
            {clip.type === "background" && clip.backgroundConfig ? (
                <CyberGrid frame={frame} config={clip.backgroundConfig} />
            ) : clip.type === "video" && clip.src ? (
                 <Video 
                    src={clip.src}
                    volume={volume}
                    style={{
                        ...style,
                        objectFit: "cover",
                        backgroundColor: "#1f2937", // Gray placeholder if loading
                    }}
                 />
            ) : clip.type === "image" && clip.src ? (
                <Img 
                    src={clip.src}
                    style={{
                        ...style,
                        objectFit: "cover",
                    }}
                />
            ) : clip.type === "text" ? (
                <div style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: clip.textAlign === "center" ? "center" : clip.textAlign === "right" ? "flex-end" : "flex-start",
                    fontSize: Number(clip.fontSize) || 40,
                    color: clip.color || "white",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    textAlign: (clip.textAlign as any) || "left",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.2,
                }}>
                    {clip.src}
                </div>
            ) : clip.type === "audio" && clip.src ? (
                <Audio 
                    src={clip.src}
                    volume={volume}
                />
            ) : null}
          </Sequence>
        );
        })}
      </div>
    </AbsoluteFill>
  );
};
