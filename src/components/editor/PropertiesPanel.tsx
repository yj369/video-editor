import { Clip } from "@/types/editor";
import { AlignCenter, AlignLeft, AlignRight, Type, Video, Volume2, Image as ImageIcon, Trash2, Grid, CircleDashed, Target, Plus, X, Box, Film, Sticker, Sparkles, PenTool, LayoutTemplate, Palette, Move } from "lucide-react";
import { analyzeText } from "@/lib/money-energy";

const MOTION_STYLES = [
  { id: "grid", icon: Grid, label: "网格" },
  { id: "velocity", icon: Type, label: "急速" },
  { id: "curve", icon: CircleDashed, label: "环绕" },
  { id: "dots", icon: Target, label: "点阵" },
  { id: "plus", icon: Plus, label: "加号" },
  { id: "cross", icon: X, label: "叉号" },
];

const SUBTITLE_STYLES = [
  { id: "focus", label: "聚焦" },
  { id: "kinetic", label: "动力" },
  { id: "scrapbook", label: "手账" },
  { id: "bubble", label: "气泡" },
  { id: "impact", label: "冲击" },
  { id: "minimal", label: "极简" },
];

const VISUAL_STYLES = [
  { id: "cutout-neo", icon: Box, label: "新潮" },
  { id: "cutout-film", icon: Film, label: "胶卷" },
  { id: "cutout-paper", icon: Sticker, label: "贴纸" },
  { id: "cutout-float", icon: Sparkles, label: "悬浮" },
  { id: "cutout-doodle", icon: PenTool, label: "涂鸦" },
  { id: "cutout-glass", icon: LayoutTemplate, label: "玻璃" },
  { id: "scrapbook", icon: Palette, label: "情绪板" },
  { id: "vogue", icon: Palette, label: "杂志风" },
  { id: "bubble", icon: Sparkles, label: "组件" },
  { id: "dv", icon: Video, label: "老式DV" },
  { id: "ccd", icon: Video, label: "CCD复古" },
  { id: "y2k", icon: Sparkles, label: "Y2K" },
  { id: "impact", icon: Move, label: "红色警示" },
  { id: "soft", icon: Palette, label: "柔光" },
  { id: "dark", icon: Palette, label: "暗调" },
];

interface PropertiesPanelProps {
  clip: Clip | null;
  onUpdate: (id: string, updates: Partial<Clip>) => void;
  onDelete: (id: string) => void;
  selectedCount?: number;
  currentTime?: number;
  onToggleKeyframe?: (clipId: string, property: "x" | "y" | "scale" | "rotation" | "opacity" | "volume", value: number) => void;
  marker?: { id: string; time: number; label?: string; color?: string } | null;
  onMarkerUpdate?: (id: string, updates: Partial<{ time: number; label?: string; color?: string }>) => void;
  onMarkerDelete?: (id: string) => void;
  timelineHeight?: number;
  onTimelineHeightChange?: (height: number) => void;
  autoFitTimeline?: boolean;
  onAutoFitChange?: (auto: boolean) => void;
  previewHeight?: number;
  onPreviewHeightChange?: (height: number) => void;
}

export const PropertiesPanel = ({
  clip,
  onUpdate,
  onDelete,
  selectedCount,
  currentTime,
  onToggleKeyframe,
  marker,
  onMarkerUpdate,
  onMarkerDelete,
  timelineHeight,
  onTimelineHeightChange,
  autoFitTimeline,
  onAutoFitChange,
  previewHeight,
  onPreviewHeightChange,
}: PropertiesPanelProps) => {
  if (!clip && marker) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="text-sm font-semibold text-white/90">标记点</div>
          <button onClick={() => onMarkerDelete?.(marker.id)} className="text-white/40 hover:text-red-400 transition">
            <Trash2 size={14} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="bg-[#1c212b] rounded p-2 border border-white/5">
            <label className="text-[10px] text-white/40 block mb-1">时间 (s)</label>
            <input
              type="number"
              step="0.1"
              value={marker.time}
              onChange={(e) => onMarkerUpdate?.(marker.id, { time: Number(e.target.value) })}
              className="w-full bg-transparent text-xs text-white outline-none font-mono"
            />
          </div>
          <div className="bg-[#1c212b] rounded p-2 border border-white/5">
            <label className="text-[10px] text-white/40 block mb-1">标签</label>
            <input
              type="text"
              value={marker.label ?? ""}
              onChange={(e) => onMarkerUpdate?.(marker.id, { label: e.target.value })}
              className="w-full bg-transparent text-xs text-white outline-none"
              placeholder="输入标记说明..."
            />
          </div>
          <div className="bg-[#1c212b] rounded p-2 border border-white/5">
            <label className="text-[10px] text-white/40 block mb-1">颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={marker.color ?? "#facc15"}
                onChange={(e) => onMarkerUpdate?.(marker.id, { color: e.target.value })}
                className="w-5 h-5 rounded overflow-hidden border-none outline-none p-0 bg-transparent"
              />
              <span className="text-xs font-mono">{marker.color ?? "#facc15"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="text-sm font-semibold text-white/90">编辑器设置</div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">布局 / Layout</h3>
            
            <div className="bg-[#1c212b] rounded p-3 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">自动调整时间线</label>
                <button
                  onClick={() => onAutoFitChange?.(!autoFitTimeline)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${autoFitTimeline ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoFitTimeline ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block">时间线高度 (px)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={Math.round(timelineHeight ?? 0)}
                    onChange={(e) => onTimelineHeightChange?.(Number(e.target.value))}
                    className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 font-mono"
                  />
                  <span className="text-[10px] text-white/20 font-mono">PX</span>
                </div>
                <p className="text-[9px] text-white/20 italic mt-1">* 调整此值将自动改变预览窗口大小</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/5">
                <label className="text-[10px] text-white/40 block">预览区高度 (px)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={Math.round(previewHeight ?? 0)}
                    onChange={(e) => onPreviewHeightChange?.(Number(e.target.value))}
                    className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 font-mono"
                  />
                  <span className="text-[10px] text-white/20 font-mono">PX</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-10 text-white/10 gap-2">
            <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                <span className="text-lg">?</span>
            </div>
            <p className="text-[10px]">选择片段以编辑特定属性</p>
          </div>
        </div>
      </div>
    );
  }

  const isVisual = ["video", "image", "text"].includes(clip.type);
  const isText = clip.type === "text";
  const isMediaVisual = clip.type === "image" || clip.type === "video";
  const isAudio = clip.type === "audio" || clip.type === "video";
  const frameTime = currentTime ?? 0;
  const hasKeyframe = (property: "x" | "y" | "scale" | "rotation" | "opacity" | "volume") => {
    const list = clip.keyframes?.[property];
    if (!list || list.length === 0) return false;
    return list.some((kf) => Math.abs(kf.time - frameTime) < 1 / 60);
  };

  const KeyframeButton = ({
    property,
    value,
  }: {
    property: "x" | "y" | "scale" | "rotation" | "opacity" | "volume";
    value: number;
  }) => (
    <button
      onClick={() => onToggleKeyframe?.(clip.id, property, value)}
      className={`ml-auto h-5 w-5 flex items-center justify-center rounded border ${
        hasKeyframe(property) ? "border-yellow-400 text-yellow-400" : "border-white/20 text-white/40 hover:text-white/70"
      }`}
      title="关键帧"
      type="button"
    >
      <span className="block h-2.5 w-2.5 rotate-45 border border-current"></span>
    </button>
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                {clip.type === "video" && <Video size={16} className="text-blue-400" />}
                {clip.type === "audio" && <Volume2 size={16} className="text-green-400" />}
                {clip.type === "text" && <Type size={16} className="text-purple-400" />}
                {clip.type === "image" && <ImageIcon size={16} className="text-yellow-400" />}
                <span>{clip.name}</span>
                </div>
                {selectedCount && selectedCount > 1 && (
                    <div className="text-[10px] text-white/40 mt-1">已选择 {selectedCount} 个片段</div>
                )}
            </div>
            <button onClick={() => onDelete(clip.id)} className="text-white/40 hover:text-red-400 transition">
                <Trash2 size={14} />
            </button>
        </div>

        {/* Basic Timing */}
        <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">时间 / Timing</h3>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1">开始 (s)</label>
                    <input 
                        type="number" step="0.1" 
                        value={clip.start}
                        onChange={(e) => onUpdate(clip.id, { start: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs text-white outline-none font-mono"
                    />
                </div>
                <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1">时长 (s)</label>
                    <input 
                        type="number" step="0.1" 
                        value={clip.duration}
                        onChange={(e) => onUpdate(clip.id, { duration: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs text-white outline-none font-mono"
                    />
                </div>
            </div>
        </div>

        {/* Text Content */}
        {isText && (
            <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">文本内容 / Content</h3>
                <textarea 
                    rows={3}
                    value={clip.src}
                    onChange={(e) => {
                        const newText = e.target.value;
                        const { highlights, sentiment } = analyzeText(newText);
                        onUpdate(clip.id, { 
                            src: newText,
                            highlightWords: highlights,
                            sentiment: sentiment
                        });
                    }}
                    className="w-full bg-[#1c212b] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-purple-500/50 resize-none"
                    placeholder="输入文本..."
                />
            </div>
        )}

        {/* Money Energy Styles */}
        {isBackground && (
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">动态背景 / Motion</h3>
            <div className="grid grid-cols-3 gap-2">
              {MOTION_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdate(clip.id, { motionStyle: style.id as any })}
                  className={`p-2 rounded border flex flex-col items-center justify-center gap-1 text-[9px] transition ${
                    clip.motionStyle === style.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-[#1c212b] text-white/40 border-white/5 hover:text-white hover:border-white/20"
                  }`}
                >
                  <style.icon size={14} />
                  <span className="font-bold">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(isText) && (
            <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mt-2">情感 / Sentiment</h3>
                <div className="flex bg-[#1c212b] rounded border border-white/5 p-1 gap-1">
                    {[
                        {id:'neutral', label:'中性', color:'text-gray-400'},
                        {id:'positive', label:'积极', color:'text-amber-400'},
                        {id:'negative', label:'消极', color:'text-rose-400'},
                        {id:'rich', label:'富足', color:'text-emerald-400'}
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => onUpdate(clip.id, { sentiment: s.id as any })}
                            className={`flex-1 py-1 text-[10px] rounded ${clip.sentiment === s.id ? 'bg-white/10 text-white' : s.color} hover:bg-white/5`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mt-2">高亮词 / Keywords</h3>
                <input 
                    type="text" 
                    placeholder="输入高亮词，用逗号分隔"
                    className="w-full bg-[#1c212b] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-purple-500/50"
                    value={clip.highlightWords?.join(", ") || ""}
                    onChange={(e) => onUpdate(clip.id, { highlightWords: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) })}
                />
            </div>
        )}

        {isText && (
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">字幕风格 / Text</h3>
            <div className="grid grid-cols-3 gap-2">
              {SUBTITLE_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdate(clip.id, { subtitleStyle: style.id as any })}
                  className={`p-2 rounded border text-[10px] font-bold transition ${
                    clip.subtitleStyle === style.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-[#1c212b] text-white/40 border-white/5 hover:text-white hover:border-white/20"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(clip.type === "image" || clip.type === "video") && (
            <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mt-2">情感 / Sentiment</h3>
                <div className="flex bg-[#1c212b] rounded border border-white/5 p-1 gap-1">
                    {[
                        {id:'neutral', label:'中性', color:'text-gray-400'},
                        {id:'positive', label:'积极', color:'text-amber-400'},
                        {id:'negative', label:'消极', color:'text-rose-400'}
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => onUpdate(clip.id, { sentiment: s.id as any })}
                            className={`flex-1 py-1 text-[10px] rounded ${clip.sentiment === s.id ? 'bg-white/10 text-white' : s.color} hover:bg-white/5`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {isMediaVisual && (
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">视觉风格 / Visual</h3>
            <div className="grid grid-cols-2 gap-2">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdate(clip.id, { visualStyle: style.id as any })}
                  className={`p-2 rounded border flex items-center gap-2 text-[10px] transition ${
                    clip.visualStyle === style.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-[#1c212b] text-white/40 border-white/5 hover:text-white hover:border-white/20"
                  }`}
                >
                  <style.icon size={12} />
                  <span className="font-bold">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Visual Transform */}
        {isVisual && (
            <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">变换 / Transform</h3>
                
                <div className="grid grid-cols-2 gap-2">
                     <div className="bg-[#1c212b] rounded p-2 border border-white/5 flex items-center gap-2">
                        <span className="text-[10px] text-white/40">X</span>
                        <input 
                            type="number" 
                            value={clip.x ?? 0}
                            onChange={(e) => onUpdate(clip.id, { x: Number(e.target.value) })}
                            className="w-full bg-transparent text-xs text-white outline-none font-mono text-right"
                        />
                        <KeyframeButton property="x" value={Number(clip.x ?? 0)} />
                     </div>
                     <div className="bg-[#1c212b] rounded p-2 border border-white/5 flex items-center gap-2">
                        <span className="text-[10px] text-white/40">Y</span>
                        <input 
                            type="number" 
                            value={clip.y ?? 0}
                            onChange={(e) => onUpdate(clip.id, { y: Number(e.target.value) })}
                            className="w-full bg-transparent text-xs text-white outline-none font-mono text-right"
                        />
                        <KeyframeButton property="y" value={Number(clip.y ?? 0)} />
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                     <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                        <label className="text-[10px] text-white/40 block mb-1 flex items-center gap-2">
                          <span>缩放 Scale</span>
                          <KeyframeButton property="scale" value={Number(clip.scale ?? 1)} />
                        </label>
                        <input 
                            type="number" step="0.1"
                            value={clip.scale ?? 1}
                            onChange={(e) => onUpdate(clip.id, { scale: Number(e.target.value) })}
                            className="w-full bg-transparent text-xs text-white outline-none font-mono"
                        />
                     </div>
                     <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                        <label className="text-[10px] text-white/40 block mb-1 flex items-center gap-2">
                          <span>旋转 Rotation</span>
                          <KeyframeButton property="rotation" value={Number(clip.rotation ?? 0)} />
                        </label>
                        <input 
                            type="number" 
                            value={clip.rotation ?? 0}
                            onChange={(e) => onUpdate(clip.id, { rotation: Number(e.target.value) })}
                            className="w-full bg-transparent text-xs text-white outline-none font-mono"
                        />
                     </div>
                </div>

                <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1">层级 Z-Index</label>
                    <input 
                        type="number" step="1"
                        value={clip.zIndex ?? 0}
                        onChange={(e) => onUpdate(clip.id, { zIndex: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs text-white outline-none font-mono"
                    />
                </div>

                <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1 flex items-center gap-2">
                        <span>不透明度 Opacity</span>
                        <span className="ml-auto text-white/50">{Math.round((clip.opacity ?? 1) * 100)}%</span>
                        <KeyframeButton property="opacity" value={Number(clip.opacity ?? 1)} />
                    </label>
                    <input 
                        type="range" min="0" max="1" step="0.01"
                        value={clip.opacity ?? 1}
                        onChange={(e) => onUpdate(clip.id, { opacity: Number(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                </div>
            </div>
        )}

        {/* Text Style */}
        {isText && (
             <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">样式 / Style</h3>
                
                <div className="grid grid-cols-2 gap-2">
                     <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                        <label className="text-[10px] text-white/40 block mb-1">字号 Size</label>
                        <input 
                            type="number" 
                            value={clip.fontSize ?? 40}
                            onChange={(e) => onUpdate(clip.id, { fontSize: Number(e.target.value) })}
                            className="w-full bg-transparent text-xs text-white outline-none font-mono"
                        />
                     </div>
                     <div className="bg-[#1c212b] rounded p-2 border border-white/5 relative">
                        <label className="text-[10px] text-white/40 block mb-1">颜色 Color</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color"
                                value={clip.color ?? "#ffffff"}
                                onChange={(e) => onUpdate(clip.id, { color: e.target.value })}
                                className="w-4 h-4 rounded overflow-hidden border-none outline-none p-0 bg-transparent"
                            />
                            <span className="text-xs font-mono">{clip.color ?? "#ffffff"}</span>
                        </div>
                     </div>
                </div>

                <div className="flex bg-[#1c212b] rounded border border-white/5 p-1">
                    {[
                        { val: "left", icon: AlignLeft }, 
                        { val: "center", icon: AlignCenter }, 
                        { val: "right", icon: AlignRight }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => onUpdate(clip.id, { textAlign: opt.val as any })}
                            className={`flex-1 py-1 flex justify-center rounded ${clip.textAlign === opt.val ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"}`}
                        >
                            <opt.icon size={14} />
                        </button>
                    ))}
                </div>
             </div>
        )}


        {/* Transitions */}
        <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">转场 / Transition</h3>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1">淡入 (s)</label>
                    <input 
                        type="number" step="0.1" min="0"
                        value={clip.transitions?.in ?? 0}
                        onChange={(e) => onUpdate(clip.id, { transitions: { ...clip.transitions, in: Number(e.target.value) } })}
                        className="w-full bg-transparent text-xs text-white outline-none font-mono"
                    />
                </div>
                <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1">淡出 (s)</label>
                    <input 
                        type="number" step="0.1" min="0"
                        value={clip.transitions?.out ?? 0}
                        onChange={(e) => onUpdate(clip.id, { transitions: { ...clip.transitions, out: Number(e.target.value) } })}
                        className="w-full bg-transparent text-xs text-white outline-none font-mono"
                    />
                </div>
            </div>
        </div>

        {/* Audio Properties */}
        {isAudio && (
            <div className="space-y-3">
                 <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">音频 / Audio</h3>
                 <div className="bg-[#1c212b] rounded p-2 border border-white/5">
                    <label className="text-[10px] text-white/40 block mb-1 flex items-center gap-2">
                        <span>音量 Volume</span>
                        <span className="ml-auto text-white/50">{Math.round((clip.volume ?? 1) * 100)}%</span>
                        <KeyframeButton property="volume" value={Number(clip.volume ?? 1)} />
                    </label>
                    <input 
                        type="range" min="0" max="2" step="0.05"
                        value={clip.volume ?? 1}
                        onChange={(e) => onUpdate(clip.id, { volume: Number(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500"
                    />
                </div>
            </div>
        )}
    </div>
  );
};
