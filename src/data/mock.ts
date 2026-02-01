import { Clip, Project, Track } from "@/types/editor";

export const MOCK_TRACKS: Track[] = [
  { id: "track-text", label: "文字层", type: "text", isMuted: false, isHidden: false, isLocked: false },
  { id: "track-video-1", label: "视频轨道 1", type: "video", isMuted: false, isHidden: false, isLocked: false },
  { id: "track-video-2", label: "视频轨道 2", type: "video", isMuted: false, isHidden: false, isLocked: false },
  { id: "track-audio", label: "音频轨道", type: "audio", isMuted: false, isHidden: false, isLocked: false },
];

export const MOCK_CLIPS: Clip[] = [
  {
    id: "clip-1",
    name: "开场标题",
    type: "text",
    start: 0,
    duration: 3,
    trackId: "track-text",
    src: "Remotion Editor",
    x: 960, // Center of 1920
    y: 540, // Center of 1080
    width: 800,
    height: 200,
    fontSize: 80,
    color: "#ffffff",
    textAlign: "center",
    scale: 1,
    opacity: 1,
    rotation: 0,
    zIndex: 10 // Higher zIndex
  },
  {
    id: "clip-2",
    name: "示例视频 A",
    type: "video",
    start: 0,
    duration: 4,
    trackId: "track-video-1",
    scale: 1,
    x: 960,
    y: 540,
    width: 1920,
    height: 1080,
    opacity: 1,
    rotation: 0,
    volume: 1,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    zIndex: 1 // Lower zIndex
  },
  {
    id: "clip-3",
    name: "背景音乐",
    type: "audio",
    start: 0,
    duration: 10,
    trackId: "track-audio",
    volume: 0.5,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "演示项目 01",
    lastModified: Date.now(),
    duration: 30,
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: MOCK_TRACKS,
    clips: MOCK_CLIPS,
  },
];
