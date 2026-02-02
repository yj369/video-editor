import { Clip } from "@/types/editor";
import { useMemo, useState } from "react";
import { Type } from "lucide-react";

interface ResourcesPanelProps {
  onAddClip: (type: Clip['type'], trackId: string, src?: string, options?: Partial<Clip>) => void;
}

const SAMPLE_TEXT = [
    { type: "text", name: "默认文本", src: "输入文本" },
    { type: "text", name: "大标题", src: "HEADING", style: { fontSize: 120, fontWeight: 900 } },
    { type: "text", name: "副标题", src: "Subtitle", style: { fontSize: 60, color: "#aaa" } },
];

export const ResourcesPanel = ({ onAddClip }: ResourcesPanelProps) => {
  const [customText, setCustomText] = useState("");
  const canAdd = useMemo(() => customText.trim().length > 0, [customText]);
  const handleAddCustom = () => {
      const value = customText.trim();
      if (!value) return;
      onAddClip("text", "text", value);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1f22] border-r border-white/10 text-[#bcbec4]">

        <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <Type size={14} />
                文本资源
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">自定义文本</label>
                    <textarea
                        className="w-full min-h-[120px] bg-[#1c212b] border border-white/10 rounded p-3 text-xs text-white/80 outline-none focus:border-purple-500/50 resize-y"
                        placeholder="输入你要展示的字幕内容..."
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        disabled={!canAdd}
                        className={`w-full py-2 rounded text-[11px] font-bold transition border ${canAdd ? "bg-white/10 text-white border-white/20 hover:bg-white/20" : "bg-white/5 text-white/30 border-white/5 cursor-not-allowed"}`}
                    >
                        添加到字幕轨道
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">快捷文本</div>
                    {SAMPLE_TEXT.map((item, idx) => (
                        <button 
                             key={idx}
                             onClick={() => onAddClip("text", "text", item.src)}
                             draggable
                             onDragStart={(e) => {
                               e.dataTransfer.setData(
                                 "application/x-editor-clip",
                                 JSON.stringify({ type: "text", src: item.src })
                               );
                             }}
                             className="w-full h-12 px-4 bg-[#1c212b] border border-white/5 hover:border-purple-500/50 rounded flex items-center justify-start transition group"
                        >
                            <Type size={16} className="text-purple-300 mr-3" />
                            <span className="text-xs text-white/80">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

        </div>

    </div>
  );
};
