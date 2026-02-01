import { Clip } from "@/types/editor";
import { useState } from "react";
import { Video, Type, Music, Image as ImageIcon, Search, Palette, Grid, CircleDashed, Target, Plus, X, Box, Film, Sticker, Sparkles, PenTool, LayoutTemplate } from "lucide-react";

interface ResourcesPanelProps {
  onAddClip: (type: Clip['type'], trackId: string, src?: string, options?: Partial<Clip>) => void;
}

const TABS = [
  { id: "media", icon: Video, label: "媒体" },
  { id: "text", icon: Type, label: "文字" },
  { id: "audio", icon: Music, label: "音频" },
  { id: "style", icon: Palette, label: "风格" },
];

const SAMPLE_MEDIA = [
    { type: "video", name: "Big Buck Bunny", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", duration: "10:00" },
    { type: "video", name: "Elephant Dream", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", duration: "10:53" },
    { type: "image", name: "示例图片 1", src: "https://picsum.photos/seed/1/800/600", duration: "Img" },
    { type: "image", name: "示例图片 2", src: "https://picsum.photos/seed/2/800/600", duration: "Img" },
];

const SAMPLE_TEXT = [
    { type: "text", name: "默认文本", src: "输入文本" },
    { type: "text", name: "大标题", src: "HEADING", style: { fontSize: 120, fontWeight: 900 } },
    { type: "text", name: "副标题", src: "Subtitle", style: { fontSize: 60, color: "#aaa" } },
];

const SAMPLE_AUDIO = [
    { type: "audio", name: "Inspiring", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" }, // Mock audio
];

export const ResourcesPanel = ({ onAddClip }: ResourcesPanelProps) => {
  const [activeTab, setActiveTab] = useState("media");

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-white/10">
        
        {/* Search */}
        <div className="p-3 border-b border-white/5">
             <div className="bg-[#1c212b] border border-white/10 rounded flex items-center px-2 py-1.5 gap-2">
                 <Search size={14} className="text-white/30" />
                 <input className="bg-transparent border-none outline-none text-xs text-white placeholder-white/30 w-full" placeholder="" />
             </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] transition
                        ${activeTab === tab.id ? "text-blue-400 bg-white/5" : "text-white/40 hover:text-white/80 hover:bg-white/5"}
                    `}
                >
                    <tab.icon size={16} />
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            
            {activeTab === "media" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_MEDIA.map((item, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onAddClip(item.type as any, "track-video-1", item.src)}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/x-editor-clip",
                                JSON.stringify({ type: item.type, src: item.src })
                              );
                            }}
                            className="group relative aspect-video bg-[#1c212b] rounded overflow-hidden border border-white/5 hover:border-blue-500/50 transition text-left"
                        >
                             {item.type === "video" ? (
                                 <video src={item.src} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" />
                             ) : (
                                 <img src={item.src} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" />
                             )}
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"></div>
                             <div className="absolute top-1 right-1 bg-black/50 rounded px-1 text-[8px] text-white/80">
                                 {item.type === "video" ? <Video size={10} /> : <ImageIcon size={10} />}
                             </div>
                        </button>
                    ))}
                  </div>
                </div>
            )}

            {activeTab === "text" && (
                <div className="space-y-2">
                    {SAMPLE_TEXT.map((item, idx) => (
                        <button 
                             key={idx}
                             onClick={() => onAddClip("text", "track-text", item.src)}
                             draggable
                             onDragStart={(e) => {
                               e.dataTransfer.setData(
                                 "application/x-editor-clip",
                                 JSON.stringify({ type: "text", src: item.src })
                               );
                             }}
                             className="w-full h-16 bg-[#1c212b] border border-white/5 hover:border-purple-500/50 rounded flex items-center justify-center transition group"
                        >
                            <Type size={18} className="text-purple-300" />
                        </button>
                    ))}
                </div>
            )}

            {activeTab === "audio" && (
                <div className="space-y-2">
                     {SAMPLE_AUDIO.map((item, idx) => (
                        <button 
                             key={idx}
                             onClick={() => onAddClip("audio", "track-audio", item.src)}
                             draggable
                             onDragStart={(e) => {
                               e.dataTransfer.setData(
                                 "application/x-editor-clip",
                                 JSON.stringify({ type: "audio", src: item.src })
                               );
                             }}
                             className="w-full p-2 bg-[#1c212b] border border-white/5 hover:border-green-500/50 rounded flex items-center gap-3 transition group text-left"
                        >
                             <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                 <Music size={14} />
                             </div>
                             <span className="text-xs text-white/80">{item.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {activeTab === "style" && (
                <div className="space-y-6">
                    {/* Motion A-Roll Presets */}
                    <div className="space-y-2">
                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">动态背景 (Motion)</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {[{id:'grid', icon:Grid, label:'网格'}, {id:'velocity', icon:Type, label:'急速'}, {id:'curve', icon:CircleDashed, label:'环绕'}, {id:'dots', icon:Target, label:'点阵'}, {id:'plus', icon:Plus, label:'加号'}, {id:'cross', icon:X, label:'叉号'}].map(s => (
                                <button 
                                    key={s.id} 
                                    onClick={() => onAddClip("background", "track-background", undefined, { motionStyle: s.id as any })}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            "application/x-editor-clip",
                                            JSON.stringify({ type: "background", options: { motionStyle: s.id } })
                                        );
                                    }}
                                    className="p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border bg-[#1c212b] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                                >
                                    <s.icon size={18}/> 
                                    <span className="text-[9px] font-bold">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subtitle Style Presets */}
                    <div className="space-y-2">
                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">字幕风格 (Text)</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {[{id:'focus', label:'聚焦 Focus'}, {id:'kinetic', label:'动力 Kinetic'}, {id:'scrapbook', label:'手账 Scrapbook'}, {id:'bubble', label:'气泡 Bubble'}, {id:'impact', label:'冲击 Impact'}, {id:'minimal', label:'极简 Minimal'}].map(style => (
                                <button 
                                    key={style.id} 
                                    onClick={() => onAddClip("text", "track-text", "示例文本", { subtitleStyle: style.id as any })}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            "application/x-editor-clip",
                                            JSON.stringify({ type: "text", src: "示例文本", options: { subtitleStyle: style.id } })
                                        );
                                    }}
                                    className="p-3 rounded-lg text-left transition-all border bg-[#1c212b] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                                >
                                    <span className="text-[10px] font-bold">{style.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visual Style Presets (Placeholder Images) */}
                    <div className="space-y-2">
                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">视觉风格 (Visual)</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {[{id:'cutout-neo', icon:Box, label:'新潮 Neo'}, {id:'cutout-film', icon:Film, label:'胶卷 Film'}, {id:'cutout-paper', icon:Sticker, label:'贴纸 Paper'}, {id:'cutout-float', icon:Sparkles, label:'悬浮 Float'}, {id:'cutout-doodle', icon:PenTool, label:'涂鸦 Doodle'}, {id:'cutout-glass', icon:LayoutTemplate, label:'玻璃 Glass'}].map(s => (
                                <button 
                                    key={s.id} 
                                    onClick={() => onAddClip("image", "track-video-1", "https://picsum.photos/seed/1/800/600", { visualStyle: s.id as any })}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            "application/x-editor-clip",
                                            JSON.stringify({ type: "image", src: "https://picsum.photos/seed/1/800/600", options: { visualStyle: s.id } })
                                        );
                                    }}
                                    className="p-3 rounded-lg flex items-center gap-2 transition-all border bg-[#1c212b] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                                >
                                    <s.icon size={14}/> 
                                    <span className="text-[10px] font-bold">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>

    </div>
  );
};
