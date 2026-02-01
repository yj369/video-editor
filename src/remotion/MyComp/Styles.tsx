import { useMemo } from 'react';
import { Sparkles, AlertCircle, Star, MessageCircle, Paperclip, Calendar, Activity } from 'lucide-react';
import { Easing, interpolate } from 'remotion';
import { THEME_CONFIG, NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS } from "@/lib/money-energy";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const buildHighlightMap = (text: string, highlightWords: string[]) => {
    if (!highlightWords || highlightWords.length === 0) return [];
    const map = new Array(text.length).fill("");
    highlightWords.forEach((word) => {
        if (!word) return;
        const start = text.indexOf(word);
        if (start < 0) return;
        for (let i = 0; i < word.length && start + i < map.length; i += 1) {
            map[start + i] = word;
        }
    });
    return map;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildKineticParts = (text: string, highlightWords: string[]) => {
    if (!highlightWords || highlightWords.length === 0) return [{ text, isHighlight: false }];
    const filtered = highlightWords.filter(Boolean);
    if (filtered.length === 0) return [{ text, isHighlight: false }];
    const highlightSet = new Set(filtered);
    const regex = new RegExp(`(${filtered.map(escapeRegExp).join("|")})`, "g");
    return text
        .split(regex)
        .filter((part) => part.length > 0)
        .map((part) => ({ text: part, isHighlight: highlightSet.has(part) }));
};

const splitImpactChunks = (text: string) =>
    text.split(/([，、])/).filter((chunk) => chunk && !["，", "、"].includes(chunk));

const PLUS_GRID = Array.from({ length: 110 }, (_, i) => i);

const getWordSentimentWithConfig = (
    word: string,
    clipEvent?: string,
    positiveWords?: string[],
    negativeWords?: string[],
) => {
    if (!word) return "neutral";
    const negative = negativeWords && negativeWords.length > 0 ? negativeWords : NEGATIVE_KEYWORDS;
    const positive = positiveWords && positiveWords.length > 0 ? positiveWords : POSITIVE_KEYWORDS;
    if (negative.some((k) => word.includes(k))) return "negative";
    if (positive.some((k) => word.includes(k))) return "positive";
    if (clipEvent === "intro") return "positive";
    return "neutral";
};

// ==========================================
// 🎬 Motion Backgrounds (A-Roll)
// ==========================================
export const MotionARoll = ({
    style,
    activeText,
    frame,
    fps,
    bgKeywords,
    gridDirection = "forward",
}: {
    style?: string;
    activeText?: string;
    frame: number;
    fps: number;
    bgKeywords?: string[];
    gridDirection?: "forward" | "backward";
}) => {
    if (style === 'grid') {
        const size = 80;
        const secondsPerLoop = 2;
        const pixelsPerFrame = size / Math.max(1, fps * secondsPerLoop);
        const direction = gridDirection === "backward" ? -1 : 1;
        const offset = (frame * pixelsPerFrame * direction) % size;
        return (
            <div className="absolute inset-0 bg-[#09090b] overflow-hidden perspective-[500px] z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b] z-10 pointer-events-none"></div>
                <div 
                    className="absolute inset-[-100%] w-[300%] h-[300%] origin-center" 
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`, 
                        backgroundSize: `${size}px ${size}px`, 
                        transform: 'rotateX(60deg)',
                        backgroundPosition: `0 ${offset}px`,
                    }} 
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none z-0"></div>
            </div>
        );
    }
    if (style === 'velocity') { 
        const words = bgKeywords && bgKeywords.length > 0 ? bgKeywords : THEME_CONFIG.keywords; 
        return (
            <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden flex flex-col justify-center gap-12 rotate-[-10deg] scale-125 z-0">
                {[0, 1, 2, 3].map((row) => {
                    const direction = row % 2 === 0 ? -1 : 1;
                    const speed = row % 2 === 0 ? 3 : 4;
                    const offset = (frame * speed * direction) % 1000; // Loop offset
                    return (
                        <div key={row} className="relative w-full whitespace-nowrap opacity-10">
                            <div 
                                className="inline-block text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500" 
                                style={{ 
                                    WebkitTextStroke: '2px rgba(255,255,255,0.2)',
                                    transform: `translateX(${offset}px)`
                                }}
                            >
                                {(words.join(" • ") + " • ").repeat(5)}
                            </div>
                        </div>
                    );
                })}
            </div>
        ); 
    }
    if (style === 'curve') { 
        const words = bgKeywords && bgKeywords.length > 0 ? bgKeywords : THEME_CONFIG.keywords;
        const loopText = (words.slice(0, 3).join(" • ") + " • ").repeat(3); 
        const rotation = frame * 0.5;
        return (
            <div className="absolute inset-0 bg-neutral-900 overflow-hidden flex items-center justify-center z-0">
                <div className="relative w-[300px] h-[300px] opacity-20" style={{ transform: `rotate(${rotation}deg)` }}>
                    <svg viewBox="0 0 300 300" className="w-full h-full">
                        <defs><path id="circlePath" d="M 150, 150 m -100, 0 a 100,100 0 1,1 200,0 a 100,100 0 1,1 -200,0" /></defs>
                        <text fill="white" fontSize="24" fontWeight="bold" letterSpacing="4"><textPath href="#circlePath">{loopText}</textPath></text>
                    </svg>
                </div>
                <div className="absolute w-[180px] h-[180px] rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-[10px] h-[10px] bg-white/20 rounded-full"></div>
                </div>
            </div>
        ); 
    }
    if (style === 'dots') {
        const offset = (frame * 0.5) % 100;
        return (
            <div className="absolute inset-0 bg-[#f4f4f5] overflow-hidden z-0">
                <div 
                    className="absolute inset-[-50%] w-[200%] h-[200%] opacity-20" 
                    style={{
                        backgroundImage: 'radial-gradient(#27272a 1.5px, transparent 1.5px)', 
                        backgroundSize: '24px 24px', 
                        transform: 'rotate(-15deg)',
                        backgroundPosition: `${offset}px ${offset}px`
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white opacity-80"></div>
            </div>
        );
    }
    if (style === 'plus') { 
        // Static pluses for now to save render cost, maybe animate opacity
        return (
            <div className="absolute inset-0 bg-neutral-900 overflow-hidden z-0">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] pointer-events-none z-0" style={{ transform: `rotate(${frame}deg)` }}>
                    <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_270deg,rgba(255,255,255,0.4)_360deg)]"></div>
                </div>
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-11 gap-0 z-10 mix-blend-overlay">
                    {PLUS_GRID.map((i) => (
                        <div key={i} className="flex items-center justify-center text-white/30 text-[10px] font-thin">+</div>
                    ))}
                </div>
            </div>
        ); 
    }
    if (style === 'cross') { 
        const pan = (frame * 0.5) % 100;
        return (
            <div className="absolute inset-0 bg-[#e5e5e5] overflow-hidden flex items-center justify-center z-0">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 5L15 15M15 5L5 15' stroke='black' stroke-width='1'/%3E%3C/svg%3E")`, 
                    backgroundSize: '30px 30px',
                    transform: `translate(${-pan}px, ${-pan}px)`
                }}></div>
                <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10L50 50M50 10L10 50' stroke='black' stroke-width='4'/%3E%3C/svg%3E")`, 
                    backgroundSize: '120px 120px',
                    transform: `translate(${pan}px, ${pan}px)`
                }}></div>
            </div>
        ); 
    }
    return <div className="absolute inset-0 bg-black z-0" />;
}

// ==========================================
// 🖼️ B-Roll Layers (Visual Styles)
// ==========================================
export const BRollLayer = ({
    src,
    event,
    style,
    frame,
    positiveWords,
    negativeWords,
}: {
    src: string;
    event?: string;
    style?: string;
    frame: number;
    positiveWords?: string[];
    negativeWords?: string[];
}) => {
    const stickers = { positive: Sparkles, negative: AlertCircle, neutral: Star };
    const StickerIcon = event === 'positive' ? stickers.positive : (event === 'negative' ? stickers.negative : stickers.neutral);
    
    // Animation progress (0 to 1 over 30 frames for entry)
    const enterProgress = Math.min(1, frame / 30);
    const scale = interpolate(enterProgress, [0, 1], [0.9, 1], { extrapolateRight: 'clamp' });
    const opacity = enterProgress;

    // Continuous animations
    const floatY = Math.sin(frame * 0.05) * 10;
    const slowRotate = Math.sin(frame * 0.02) * 2;

    if (style === 'cutout-neo') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `scale(${scale})` }}>
                <div className="relative w-[280px] aspect-[4/5] group" style={{ transform: `rotate(${1 + slowRotate}deg)` }}>
                    <div className={`absolute top-3 left-3 w-full h-full border-4 border-black ${event === 'negative' ? 'bg-rose-400' : 'bg-amber-400'}`}></div>
                    <div className="relative w-full h-full border-4 border-black bg-white overflow-hidden">
                        <img src={src} className="w-full h-full object-cover grayscale contrast-125" alt="neo" />
                        <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 font-mono text-xs font-bold border-b-4 border-r-4 border-white">
                            图示.01
                        </div>
                        <div className="absolute bottom-4 right-4 bg-white border-2 border-black p-2 rounded-full shadow-[4px_4px_0_black]">
                            <StickerIcon size={24} className="text-black" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (style === 'cutout-film') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `translateY(${(1-enterProgress)*20}px)` }}>
                <div className="relative w-[300px] bg-[#1a1a1a] py-4 px-2 shadow-2xl flex flex-col gap-2 items-center" style={{ transform: `rotate(${1 + slowRotate}deg)` }}>
                    <div className="absolute left-1 top-0 bottom-0 w-4 flex flex-col justify-between py-2">
                        {Array.from({length:8}).map((_, i) => <div key={i} className="w-2 h-3 bg-white/10 rounded-sm"></div>)}
                    </div>
                    <div className="absolute right-1 top-0 bottom-0 w-4 flex flex-col justify-between py-2">
                        {Array.from({length:8}).map((_, i) => <div key={i} className="w-2 h-3 bg-white/10 rounded-sm"></div>)}
                    </div>
                    <div className="w-[85%] aspect-video bg-gray-800 overflow-hidden border border-white/10 relative">
                        <img src={src} className="w-full h-full object-cover opacity-90" style={{ transform: `scale(${1 + frame * 0.001})` }} alt="film" />
                        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-orange-500 tracking-widest">录制中 ●</div>
                    </div>
                    <div className="w-[85%] aspect-video bg-gray-800 overflow-hidden border border-white/10 relative opacity-40">
                        <img src={src} className="w-full h-full object-cover grayscale blur-[1px]" alt="film-prev" />
                    </div>
                </div>
            </div>
        )
    }

    if (style === 'cutout-glass') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `scale(${scale})` }}>
                <div className="relative w-[280px] h-[350px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-20 overflow-hidden" style={{ transform: `rotateX(${Math.sin(frame*0.05)*2}deg) rotateY(${Math.cos(frame*0.05)*2}deg)` }}>
                        <img src={src} className="w-full h-full object-cover opacity-90 mix-blend-overlay" style={{ transform: `scale(${1.1 + Math.sin(frame*0.01)*0.05})` }} alt="glass" />
                        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                            <div className="text-white/60 text-[10px] font-mono tracking-[0.2em] uppercase mb-1">状态</div>
                            <div className="text-white text-xl font-bold flex items-center gap-2">
                                <Activity size={18} className="text-emerald-400" />
                                {event === 'positive' ? '能量飙升' : (event === 'negative' ? '能量流失' : '平稳运行')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (style === 'cutout-paper') { 
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `rotate(${-2 + enterProgress * 2}deg) scale(${scale})` }}>
                <div className="relative w-[70%] aspect-[3/4] drop-shadow-[10px_10px_0_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-white p-2" style={{ clipPath: 'polygon(2% 0, 100% 2%, 98% 100%, 0 98%)' }}>
                        <div className="w-full h-full overflow-hidden relative grayscale contrast-125" style={{ clipPath: 'polygon(0 0, 100% 5%, 95% 100%, 5% 95%)' }}>
                            <img src={src} className="w-full h-full object-cover" alt="paper-cut" />
                        </div>
                    </div>
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 rotate-2 backdrop-blur-sm shadow-sm mix-blend-multiply ${event === 'negative' ? 'bg-rose-400/80' : 'bg-yellow-400/80'}`}></div>
                </div>
            </div>
        ); 
    }
    
    if (style === 'cutout-float') { 
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `translateY(${floatY}px)` }}>
                <div className="relative w-[280px] h-[280px]">
                    <div className="absolute inset-0 rounded-full border-[8px] border-white overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] bg-sky-200">
                        <img src={src} className="w-full h-full object-cover scale-110" alt="float" />
                    </div>
                    <div className="absolute -top-4 -right-2 bg-white p-2 rounded-full shadow-lg">
                        <StickerIcon size={24} className={event === 'negative' ? THEME_CONFIG.accentColor : THEME_CONFIG.primaryColor} fill="currentColor" />
                    </div>
                </div>
            </div>
        ); 
    }
    
    if (style === 'cutout-doodle') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `rotate(${1 + slowRotate}deg)` }}>
                <div className="relative w-[280px] aspect-[4/5] group">
                    <div className="absolute inset-0 bg-white border-4 border-black rounded-sm transform rotate-1 shadow-[8px_8px_0px_rgba(0,0,0,1)]"></div>
                    <div className="absolute inset-3 border-2 border-black overflow-hidden bg-gray-100">
                        <img src={src} className="w-full h-full object-cover grayscale contrast-125" alt="doodle" />
                    </div>
                    <div className="absolute -bottom-8 -left-6 bg-yellow-300 text-black px-4 py-3 font-handwriting text-sm transform -rotate-3 shadow-md border border-black/10">
                        <span className="font-bold block text-xs opacity-50 mb-1">注意：</span>
                        <span className="font-black text-lg">{event === 'negative' ? '千万别这样！' : '重点知识！'}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (style === 'scrapbook') { 
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `translateY(${50 - enterProgress*50}px) scale(${scale})` }}>
                <div className="relative w-[80%] max-w-[300px] bg-[#f8f8f6] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] rotate-[-2deg]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black/80 -rotate-1 backdrop-blur-sm shadow-sm z-20 mix-blend-overlay opacity-90"></div>
                    <div className="absolute -top-2 right-4 text-gray-400 rotate-12 z-20 drop-shadow-md"><Paperclip size={40} strokeWidth={1.5} /></div>
                    <div className="aspect-[3/4] overflow-hidden border border-gray-200 grayscale-[0.2] contrast-110">
                        <img src={src} className="w-full h-full object-cover" alt="moodboard" />
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                        <div className="font-serif italic text-gray-500 text-sm">图例. 01</div>
                        <div className="font-handwriting text-xs px-2 py-1 bg-black text-white transform -rotate-1">#{event === 'normal' ? '日常' : (event === 'positive' ? '高能' : '警惕')}</div>
                    </div>
                </div>
            </div>
        ); 
    }

    if (style === 'vogue') { 
        return (
            <div className="absolute inset-0 z-10" style={{ opacity }}>
                <div className="absolute inset-x-8 top-28 bottom-48 border border-white/20 p-2">
                    <div className="w-full h-full overflow-hidden relative grayscale-[0.8] contrast-125">
                        <img src={src} className="w-full h-full object-cover" style={{ transform: `scale(${1.1 + frame * 0.0005})` }} alt="editorial" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                </div>
                <div className="absolute top-10 left-8 right-8 flex justify-between items-end border-b border-white/30 pb-2">
                    <span className="text-4xl font-serif font-black tracking-tighter text-white">聚焦</span>
                    <span className="text-[10px] font-mono tracking-widest text-white/70 mb-1">第01期</span>
                </div>
                <div className="absolute bottom-20 left-8 text-white/60 text-[10px] font-mono leading-tight"><p>独家专访</p><p>成长的艺术</p></div>
            </div>
        ); 
    }

    if (style === 'bubble') { 
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ opacity, transform: `scale(${scale})` }}>
                <div className="w-64 aspect-square bg-white/10 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/20 p-4 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                    <div className="flex justify-between items-center text-white/80 px-2">
                        <div className="flex items-center gap-2 text-xs font-medium"><Calendar size={12} /> 今天</div>
                        <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]"></div>
                    </div>
                    <div className="flex-1 rounded-[2rem] overflow-hidden relative shadow-inner group">
                        <img src={src} className="w-full h-full object-cover" alt="widget" />
                    </div>
                </div>
            </div>
        ); 
    }
    
    // Filters (Fullscreen)
    let filterStyle: any = { opacity: 0.9 }; 
    let overlay = null;
    if (style === 'dv') {
        const pulse = 0.6 + Math.sin(frame * 0.2) * 0.4;
        const pulseScale = 0.85 + pulse * 0.25;
        filterStyle = { opacity: 0.85, filter: 'contrast(1.1) sepia(0.2)' };
        overlay = (
            <>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_3px] pointer-events-none opacity-40"></div>
                <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
                    <div className="w-2 h-2 bg-red-500 rounded-full" style={{ opacity: pulse, transform: `scale(${pulseScale})` }}></div>
                    <span className="text-white/90 font-mono text-[10px] tracking-widest uppercase">录制</span>
                </div>
            </>
        );
    }
    else if (style === 'ccd') { filterStyle = { filter: 'contrast(1.05) brightness(1.1) saturate(1.1)' }; overlay = <div className="absolute bottom-8 right-6 font-mono text-yellow-500/80 text-sm font-bold tracking-widest z-20 drop-shadow-sm font-digital">'08 24</div>; }
    else if (style === 'y2k') { filterStyle = { filter: 'contrast(1.2) saturate(1.3)', mixBlendMode: 'normal' }; overlay = <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-pink-500/20 mix-blend-overlay"></div>; }
    else if (style === 'impact') { filterStyle = { filter: 'grayscale(100%) contrast(1.4)', opacity: 0.6 }; overlay = <div className="absolute inset-0 bg-neutral-900/50 mix-blend-multiply"></div>; }
    else if (style === 'soft') { filterStyle = { filter: 'brightness(1.05) saturate(0.8) contrast(0.9)', opacity: 1 }; overlay = <div className="absolute inset-0 bg-white/10 mix-blend-screen"></div>; }
    else if (style === 'dark') { filterStyle = { filter: 'brightness(0.6) grayscale(0.4)', opacity: 1 }; }
    
    return (
        <div className="absolute inset-0 z-10" style={{ opacity }}>
            <img src={src} className="w-full h-full object-cover" style={{ ...filterStyle, transform: `scale(${1 + frame * 0.001})` }} alt="b-roll" />
            {overlay}
        </div>
    )
}

// ==========================================
// 📝 Subtitle Styles
// ==========================================
export const SubtitleLayer = ({
    text,
    frame,
    highlightWords = [],
    style,
    event,
    positiveWords,
    negativeWords,
}: {
    text: string;
    frame: number;
    highlightWords?: string[];
    style?: string;
    event?: string;
    positiveWords?: string[];
    negativeWords?: string[];
}) => {
    const highlightKey = highlightWords.join("|");
    const characters = useMemo(() => text.split(""), [text]);
    const highlightMap = useMemo(() => buildHighlightMap(text, highlightWords), [text, highlightKey]);
    const focusWords = useMemo(() => (highlightWords.length > 0 ? highlightWords : [text]), [text, highlightKey]);
    const kineticParts = useMemo(() => buildKineticParts(text, highlightWords), [text, highlightKey]);
    const impactParts = useMemo(
        () =>
            splitImpactChunks(text).map((chunk) => ({
                chunk,
                highlightWord: highlightWords.find((word) => chunk.includes(word)),
            })),
        [text, highlightKey]
    );
    
    if (style === 'focus') {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center relative z-40">
                 <div className="flex flex-col gap-4 items-center">
                    {focusWords.map((word, idx) => {
                        const delay = idx * 10;
                        const progress = Math.min(1, Math.max(0, (frame - delay) / 8));
                        const show = frame > delay;
                        const scale = show ? 1 + (1 - progress) * 2 : 3;
                        const opacity = progress;
                        
                        const sentiment = getWordSentimentWithConfig(word, event, positiveWords, negativeWords);
                        let colorClass = "text-white";
                        if (sentiment === 'negative') colorClass = THEME_CONFIG.accentColor;
                        else if (sentiment === 'positive') colorClass = THEME_CONFIG.primaryColor;
                        
                        return (
                            <div key={idx} style={{ opacity, transform: `scale(${scale})`, filter: `blur(${(1-progress)*10}px)`}} className={`font-black text-5xl md:text-6xl tracking-tighter drop-shadow-2xl ${colorClass}`}>
                                {word}
                            </div>
                        )
                    })}
                 </div>
                 <div className="absolute bottom-24 px-8 text-center" style={{ opacity: Math.min(0.8, Math.max(0, (frame - 20) / 20)) }}>
                     <p className="text-white/60 text-xs font-light tracking-widest uppercase border-t border-white/20 pt-2">{text}</p>
                 </div>
            </div>
        )
    }

    if (style === 'kinetic') {
        return (
            <div className="w-full h-full flex flex-col justify-center items-start px-8 relative z-30 gap-1">
                {kineticParts.map((part, idx) => {
                    const delay = idx * 5; 
                    const progress = Math.min(1, Math.max(0, (frame - delay) / 10)); 
                    const x = (1 - progress) * -50;
                    
                    if (part.isHighlight) { 
                        const sentiment = getWordSentimentWithConfig(part.text, event, positiveWords, negativeWords);
                        let textColor = "text-black";
                        if (sentiment === 'negative') textColor = THEME_CONFIG.accentColor.replace('text-', 'text-'); // Tailwind conflict? No, these are valid classes
                        else if (sentiment === 'positive') textColor = THEME_CONFIG.primaryColor.replace('text-', 'text-');

                        return (
                            <div key={idx} style={{ opacity: progress, transform: `translateX(${x}px)` }} className={`bg-white px-4 py-2 font-black text-4xl shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-2 origin-left border-2 border-black ${textColor}`}>
                                {part.text}
                            </div>
                        )
                    } else { 
                        return (
                            <div key={idx} style={{ opacity: progress, transform: `translateX(${x}px)` }} className="max-w-full">
                                <span className="text-white/90 text-xl font-bold drop-shadow-md bg-black/50 px-2 py-1 leading-normal box-decoration-clone">
                                    {part.text}
                                </span>
                            </div> 
                        )
                    }
                })}
            </div>
        )
    }

    if (style === 'scrapbook') {
        return (
            <div className="w-full h-full flex flex-col justify-end items-center px-6 pb-36 relative z-30">
                <div className="relative bg-[#FFFBF0] border-2 border-gray-800 p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-wrap justify-center items-baseline gap-x-1.5 gap-y-3" style={{ maxWidth: '95%', transform: frame < 5 ? 'translateY(2rem) rotate(1deg)' : 'translateY(0) rotate(0)', opacity: frame < 5 ? 0 : 1 }}>
                    {characters.map((char, index) => {
                        const currentHighlightWord = highlightMap[index];
                        const isHighlight = Boolean(currentHighlightWord);
                        const delay = index * 2; 
                        const progress = Math.min(1, Math.max(0, (frame - delay) / 8));
                        let scale = isHighlight ? (progress < 0.8 ? progress * 1.4 : 1.25) : progress; 
                        let y = isHighlight ? (1 - progress) * 2 : (1 - progress) * 10;
                        
                        let wordColor = 'text-black';
                        let highlightBg = 'bg-yellow-300';
                        if (isHighlight) {
                            const sentiment = getWordSentimentWithConfig(currentHighlightWord, event, positiveWords, negativeWords);
                            if (sentiment === 'negative') { wordColor = THEME_CONFIG.accentColor; highlightBg = THEME_CONFIG.accentBg; } 
                            else if (sentiment === 'positive') { wordColor = THEME_CONFIG.primaryColor; highlightBg = THEME_CONFIG.primaryBg; } 
                            else { wordColor = THEME_CONFIG.neutralColor; highlightBg = THEME_CONFIG.neutralBg; }
                        }
                        return (
                            <span key={index} className={`relative font-serif leading-none ${isHighlight ? `font-black text-3xl md:text-4xl ${wordColor}` : 'text-xl md:text-2xl text-gray-800'}`} style={{ opacity: progress, transform: `translateY(${y}px) scale(${scale})`, display: 'inline-block' }}>
                                {char} 
                                {isHighlight && progress > 0.8 && <span className={`absolute bottom-1 left-0 w-full h-[40%] -z-10 mix-blend-multiply rounded-full transform -rotate-2 ${highlightBg} opacity-30`}></span>}
                            </span>
                        )
                    })}
                </div>
            </div>
        );
    }

    if (style === 'bubble') {
        const bubbleProgress = interpolate(frame, [5, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        });
        const bubbleScale = interpolate(bubbleProgress, [0, 1], [0.5, 1]);
        const bubbleTranslate = interpolate(bubbleProgress, [0, 1], [80, 0]);
        return (
            <div className="w-full h-full flex flex-col justify-center items-center px-8 pb-20 relative z-30">
                <div
                    className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 relative"
                    style={{ opacity: bubbleProgress, transform: `translateY(${bubbleTranslate}px) scale(${bubbleScale})` }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-500 flex items-center justify-center shrink-0 text-white shadow-lg"><MessageCircle size={20} /></div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">新消息</span>
                            <p className="text-lg md:text-xl text-gray-800 leading-relaxed font-sans font-medium">
                                {characters.map((char, index) => { 
                                    const currentHighlightWord = highlightMap[index];
                                    const isHighlight = Boolean(currentHighlightWord);
                                    let colorClass = "";
                                    if (isHighlight) {
                                        const sentiment = getWordSentimentWithConfig(currentHighlightWord, event, positiveWords, negativeWords);
                                        if (sentiment === 'negative') colorClass = "text-rose-500 font-black";
                                        else if (sentiment === 'positive') colorClass = "text-amber-500 font-black";
                                        else colorClass = "text-indigo-500 font-black";
                                    }
                                    return <span key={index} className={colorClass}>{char}</span> 
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (style === 'impact') {
        const barScale = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
        const marqueeOffset = -((frame * 2) % 400);
        return (
            <div className="w-full h-full flex flex-col justify-center items-center px-4 relative z-30">
                 <div
                     className="absolute top-20 w-full h-12 bg-black flex items-center justify-center overflow-hidden"
                     style={{ transform: `rotate(-3deg) scaleX(${barScale})`, transformOrigin: "left center" }}
                 >
                     <div className="flex gap-4 whitespace-nowrap text-white font-black uppercase tracking-widest text-xs" style={{ transform: `translateX(${marqueeOffset}px)` }}>高能预警 /// 重点关注 /// 高能预警 /// 重点关注 ///</div>
                 </div>
                <div className="flex flex-wrap justify-center gap-2 text-center max-w-[95%]">
                    {impactParts.map((part, i) => { 
                        const currentHighlightWord = part.highlightWord;
                        const isHighlight = Boolean(currentHighlightWord);
                        const delay = i * 5; 
                        const progress = clamp((frame - delay) / 10);
                        const translateY = (1 - progress) * 40;
                        const rotate = isHighlight ? -2 : 0;
                        let bgClass = "bg-white text-black"; 
                        if (currentHighlightWord) {
                            const sentiment = getWordSentimentWithConfig(currentHighlightWord, event, positiveWords, negativeWords);
                            if (sentiment === 'negative') bgClass = `${THEME_CONFIG.accentBg} text-white`;
                            else if (sentiment === 'positive') bgClass = `${THEME_CONFIG.primaryBg} text-white`;
                            else bgClass = "bg-black text-white";
                        }
                        return (
                            <div
                                key={i}
                                className={`${isHighlight ? `${bgClass} px-4 py-2 shadow-[4px_4px_0_black]` : 'text-black bg-white px-2 py-1 shadow-sm'}`}
                                style={{ opacity: progress, transform: `translateY(${translateY}px) rotate(${rotate}deg)` }}
                            >
                                <span className={`font-black tracking-tighter ${isHighlight ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>{part.chunk}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }

    if (style === 'minimal') {
        return (
            <div className="w-full h-full flex flex-col justify-end items-center pb-20 px-4 relative z-30">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-xl max-w-[95%]">
                    <p className="text-center leading-relaxed">
                        {characters.map((char, index) => { 
                            const currentHighlightWord = highlightMap[index];
                            const isHighlight = Boolean(currentHighlightWord);
                            const opacity = Math.min(1, Math.max(0, (frame - index * 1) / 10));
                            
                            let colorClass = "text-gray-100 font-medium"; 
                            if (isHighlight) {
                                const sentiment = getWordSentimentWithConfig(currentHighlightWord, event, positiveWords, negativeWords);
                                if (sentiment === 'negative') colorClass = "font-black text-rose-400 drop-shadow-[0_2px_10px_rgba(244,63,94,0.5)]";
                                else if (sentiment === 'positive') colorClass = "font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]";
                                else colorClass = "font-black text-white drop-shadow-md";
                            }

                            return <span key={index} className={`text-lg md:text-2xl ${colorClass}`} style={{ opacity }}>{char}</span> 
                        })}
                    </p>
                </div>
            </div>
        )
    }

    // Default Fallback
    return (
        <div style={{
            position: "absolute",
            left: "50%",
            top: "80%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            fontSize: 40,
            color: "white",
            fontFamily: "sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            width: "90%",
        }}>
            {text}
        </div>
    );
};
