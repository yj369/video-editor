import { z } from "zod";

export const COMP_NAME = "MyComp";

const ClipSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["video", "audio", "text", "image", "background"]),
  start: z.number(),
  duration: z.number(),
  trackId: z.string(),
  src: z.string().optional(),
  
  // Visuals
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  zIndex: z.number().optional(),
  
  // Text
  fontSize: z.number().optional(),
  color: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  
  // Media
  volume: z.number().optional(),
  speed: z.number().optional(),

  // Transitions (seconds)
  transitions: z
    .object({
      in: z.number().optional(),
      out: z.number().optional(),
      type: z.enum(["fade"]).optional(),
    })
    .optional(),

  // Background config
  backgroundConfig: z
    .object({
      gridSize: z.number(),
      aspectRatio: z.number(),
      lineWidth: z.number(),
      speed: z.number(),
      direction: z.number(),
      gridColor: z.string(),
      bgTopColor: z.string(),
      bgBottomColor: z.string(),
      scanlineOpacity: z.number(),
      vignetteIntensity: z.number(),
      glowIntensity: z.number(),
      pulseSpeed: z.number(),
      noiseOpacity: z.number(),
    })
    .optional(),

  // Keyframes
  keyframes: z
    .object({
      x: z.array(z.object({ time: z.number(), value: z.number() })).optional(),
      y: z.array(z.object({ time: z.number(), value: z.number() })).optional(),
      scale: z.array(z.object({ time: z.number(), value: z.number() })).optional(),
      rotation: z.array(z.object({ time: z.number(), value: z.number() })).optional(),
      opacity: z.array(z.object({ time: z.number(), value: z.number() })).optional(),
      volume: z.array(z.object({ time: z.number(), value: z.number() })).optional(),
    })
    .optional(),

  // Money energy styles
  subtitleStyle: z.enum(["focus", "kinetic", "scrapbook", "bubble", "impact", "minimal"]).optional(),
  visualStyle: z.enum(["cutout-neo", "cutout-film", "cutout-glass", "cutout-paper", "cutout-float", "cutout-doodle", "scrapbook", "vogue", "bubble", "dv", "ccd", "y2k", "impact", "soft", "dark"]).optional(),
  motionStyle: z.enum(["grid", "velocity", "curve", "dots", "plus", "cross"]).optional(),
  sentiment: z.enum(["positive", "negative", "neutral", "worry", "rich", "intro"]).optional(),
  highlightWords: z.array(z.string()).optional(),
});

const TrackSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["video", "audio", "text", "image", "background"]),
  isMuted: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export const DURATION_IN_FRAMES = 1800; // 30s * 60fps
export const VIDEO_WIDTH = 2160;
export const VIDEO_HEIGHT = 3840;
export const VIDEO_FPS = 60;

export const CompositionProps = z.object({
  clips: z.array(ClipSchema),
  tracks: z.array(TrackSchema),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  duration: z.number().optional(),
  bgKeywords: z.array(z.string()).optional(),
  positiveWords: z.array(z.string()).optional(),
  negativeWords: z.array(z.string()).optional(),
  gridDirection: z.enum(["forward", "backward"]).optional(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  clips: [],
  tracks: [],
  width: VIDEO_WIDTH,
  height: VIDEO_HEIGHT,
  fps: VIDEO_FPS,
  duration: DURATION_IN_FRAMES / VIDEO_FPS,
  bgKeywords: [],
  positiveWords: [],
  negativeWords: [],
  gridDirection: "forward",
};
