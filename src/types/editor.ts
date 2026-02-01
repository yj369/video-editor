export type Clip = {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "image" | "background";
  start: number; // Start time in seconds on the timeline
  duration: number; // Duration in seconds
  src?: string; // Content source (text value or file path)
  trackId: string;
  
  // Visual Properties
  x?: number; // Position X (percent 0-100 or pixels)
  y?: number; // Position Y
  width?: number; 
  height?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;

  // Text Specific
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  
  // Audio/Video Specific
  volume?: number;
  speed?: number;

  // Transitions (seconds)
  transitions?: {
    in?: number;
    out?: number;
    type?: "fade";
  };

  // Background config
  backgroundConfig?: {
    gridSize: number;
    aspectRatio: number;
    lineWidth: number;
    speed: number;
    direction: number;
    gridColor: string;
    bgTopColor: string;
    bgBottomColor: string;
    scanlineOpacity: number;
    vignetteIntensity: number;
    glowIntensity: number;
    pulseSpeed: number;
    noiseOpacity: number;
  };

  // Money Energy Styles
  subtitleStyle?: "focus" | "kinetic" | "scrapbook" | "bubble" | "impact" | "minimal";
  visualStyle?: "cutout-neo" | "cutout-film" | "cutout-glass" | "cutout-paper" | "cutout-float" | "cutout-doodle" | "scrapbook" | "vogue" | "bubble" | "dv" | "ccd" | "y2k" | "impact" | "soft" | "dark";
  motionStyle?: "grid" | "velocity" | "curve" | "dots" | "plus" | "cross";
  sentiment?: "positive" | "negative" | "neutral" | "worry" | "rich" | "intro";
  highlightWords?: string[];

  // Keyframes (timeline time in seconds)
  keyframes?: {
    x?: Array<{ time: number; value: number }>;
    y?: Array<{ time: number; value: number }>;
    scale?: Array<{ time: number; value: number }>;
    rotation?: Array<{ time: number; value: number }>;
    opacity?: Array<{ time: number; value: number }>;
    volume?: Array<{ time: number; value: number }>;
  };
};

export type Track = {
  id: string;
  label: string;
  type: "video" | "audio" | "text" | "image" | "background";
  isMuted?: boolean;
  isHidden?: boolean;
  isLocked?: boolean;
};

export type Project = {
  id: string;
  name: string;
  lastModified: number;
  duration: number; // Total duration in seconds
  width: number;
  height: number;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  markers?: Array<{
    id: string;
    time: number;
    label?: string;
    color?: string;
  }>;
};
