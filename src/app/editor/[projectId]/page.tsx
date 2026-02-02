// @ts-nocheck

"use client";

import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useParams } from "next/navigation";
import { Play, Pause, RefreshCw, Star, Crown, MessageCircle, AlertCircle, Type, Target, Image as ImageIcon, Shuffle, Video, Film, Grid, Move, CircleDashed, Paperclip, Calendar, Scissors, Sparkles, Sticker, Plus, X, ThumbsUp, Activity, Save, Box, PenTool, LayoutTemplate, Film as FilmIcon, Clock, Settings, Wand2, Trash2, ImageOff, ChevronDown, ChevronUp, Dices, Moon, Sun, Music } from 'lucide-react';
import { Timeline } from "@/components/editor/Timeline";
import { PreviewOverlay } from "@/components/editor/PreviewOverlay";
import { ResourcesPanel } from "@/components/editor/ResourcesPanel";
import { useRendering } from "@/helpers/use-rendering";
import { COMP_NAME, VIDEO_FPS } from "@/types/constants";
import type { Clip, Track } from "@/types/editor";

// ========================================== 
// 🎨 主题配置 (WebStorm / IntelliJ Style)
// ========================================== 
const THEME_CONFIG = {
    dark: {
        mode: 'dark',
        bg: '#1e1f22',           // Main background (WebStorm Editor Bg)
        panelBg: '#2b2d30',
        border: '#393b40',
        text: '#bcbec4',
        textSecondary: '#7c7f88',
        accent: '#3574f0',
        trackBg: '#1e1f22',
        trackBorder: '#393b40',
        buttonBg: '#35373b',
        buttonHover: '#3e4145',
        inputBg: '#2b2d30'
    },
    light: {
        mode: 'light',
        bg: '#f2f2f2',
        panelBg: '#ffffff',
        border: '#ebecf0',
        text: '#1f1f1f',
        textSecondary: '#6c707e',
        accent: '#3574f0',
        trackBg: '#ffffff',
        trackBorder: '#ebecf0',
        buttonBg: '#ffffff',
        buttonHover: '#f5f5f5',
        inputBg: '#ffffff'
    }
};

// ========================================== 
// 🎨 默认数据
// ========================================== 
const DEFAULT_THEME_CONFIG = {
    primaryColor: "text-amber-500", 
    primaryBg: "bg-amber-500",
    accentColor: "text-rose-600", 
    accentBg: "bg-rose-500",
    neutralColor: "text-indigo-600",
    neutralBg: "bg-indigo-500",
    hudTitle: "能量指数",
    hudIcon: Crown,
    stickers: { positive: Sparkles, negative: AlertCircle, neutral: Star }
};

const DEFAULT_NEGATIVE_KEYWORDS = ['漏', '损耗', '存不住', '轻视', '过期', '废弃', '忽略', '叹气', '抱怨', '掏空', '心疼', '智商税', '陷阱', '伪勤奋', '没做成', '忙', '团团转', '暗漏', '关不紧', '大主见', '贪小利', '错失', '强撑', '面子'];
const DEFAULT_POSITIVE_KEYWORDS = ['财库', '开源', '变富', '财神', '新财', '丰盛', '福气', '越来越富', '磁场', '财富', '能量', '高手', '心流', '聚焦', '刀刃', '配得感', '禄勋', '气场', '通透', '稳住'];
const DEFAULT_BG_KEYWORDS = ["搞钱", "能量", "发财", "暴富", "上岸", "财运", "搞钱", "能量"];

const DEFAULT_STOCK_IMAGES = [
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1584620067644-de8263152579?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop", 
];
const DEFAULT_AUDIO: string[] = [];

const FPS = 60;
const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 640;

const IDB_NAME = "remotion-editor";
const IDB_VERSION = 2;
const IDB_STORE = "local-images";
const IDB_AUDIO_STORE = "local-audios";
const IDB_REF_PREFIX = "idb://";
const IDB_AUDIO_REF_PREFIX = "idb-audio://";

type LocalImageRecord = {
    id: string;
    projectId: string;
    name: string;
    type: string;
    size: number;
    createdAt: number;
    data: Blob;
};

type LocalAudioRecord = {
    id: string;
    projectId: string;
    name: string;
    type: string;
    size: number;
    duration: number;
    createdAt: number;
    data: Blob;
};

type MediaItem = {
    ref: string;
    src: string;
    isLocal?: boolean;
};

type AudioItem = {
    ref: string;
    src: string;
    name: string;
    duration?: number;
    isLocal?: boolean;
};

const isIdbRef = (value: string) => value.startsWith(IDB_REF_PREFIX);
const getIdFromRef = (value: string) => value.slice(IDB_REF_PREFIX.length);
const isAudioRef = (value: string) => value.startsWith(IDB_AUDIO_REF_PREFIX);
const getAudioIdFromRef = (value: string) => value.slice(IDB_AUDIO_REF_PREFIX.length);

let imageDbPromise: Promise<IDBDatabase> | null = null;

const getImageDb = () => {
    if (imageDbPromise) return imageDbPromise;
    if (typeof window === "undefined" || !("indexedDB" in window)) {
        return Promise.reject(new Error("IndexedDB is not available."));
    }
    imageDbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                const store = db.createObjectStore(IDB_STORE, { keyPath: "id" });
                store.createIndex("projectId", "projectId", { unique: false });
            } else {
                const store = request.transaction?.objectStore(IDB_STORE);
                if (store && !store.indexNames.contains("projectId")) {
                    store.createIndex("projectId", "projectId", { unique: false });
                }
            }
            if (!db.objectStoreNames.contains(IDB_AUDIO_STORE)) {
                const audioStore = db.createObjectStore(IDB_AUDIO_STORE, { keyPath: "id" });
                audioStore.createIndex("projectId", "projectId", { unique: false });
            } else {
                const audioStore = request.transaction?.objectStore(IDB_AUDIO_STORE);
                if (audioStore && !audioStore.indexNames.contains("projectId")) {
                    audioStore.createIndex("projectId", "projectId", { unique: false });
                }
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
    });
    return imageDbPromise;
};

const saveLocalImageRecord = async (record: LocalImageRecord) => {
    const db = await getImageDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("Failed to save image to IndexedDB."));
    });
};

const loadLocalImageRecords = async (projectId: string) => {
    const db = await getImageDb();
    return new Promise<LocalImageRecord[]>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        if (store.indexNames.contains("projectId")) {
            const index = store.index("projectId");
            const request = index.getAll(projectId);
            request.onsuccess = () => resolve((request.result ?? []) as LocalImageRecord[]);
            request.onerror = () => reject(request.error ?? new Error("Failed to load images from IndexedDB."));
            return;
        }
        const request = store.getAll();
        request.onsuccess = () => {
            const results = (request.result ?? []) as LocalImageRecord[];
            resolve(results.filter((record) => record.projectId === projectId));
        };
        request.onerror = () => reject(request.error ?? new Error("Failed to load images from IndexedDB."));
    });
};

const saveLocalAudioRecord = async (record: LocalAudioRecord) => {
    const db = await getImageDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_AUDIO_STORE, "readwrite");
        const store = tx.objectStore(IDB_AUDIO_STORE);
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("Failed to save audio to IndexedDB."));
    });
};

const loadLocalAudioRecords = async (projectId: string) => {
    const db = await getImageDb();
    return new Promise<LocalAudioRecord[]>((resolve, reject) => {
        const tx = db.transaction(IDB_AUDIO_STORE, "readonly");
        const store = tx.objectStore(IDB_AUDIO_STORE);
        if (store.indexNames.contains("projectId")) {
            const index = store.index("projectId");
            const request = index.getAll(projectId);
            request.onsuccess = () => resolve((request.result ?? []) as LocalAudioRecord[]);
            request.onerror = () => reject(request.error ?? new Error("Failed to load audios from IndexedDB."));
            return;
        }
        const request = store.getAll();
        request.onsuccess = () => {
            const results = (request.result ?? []) as LocalAudioRecord[];
            resolve(results.filter((record) => record.projectId === projectId));
        };
        request.onerror = () => reject(request.error ?? new Error("Failed to load audios from IndexedDB."));
    });
};

const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read image."));
        reader.readAsDataURL(blob);
    });

const decodeAudioDuration = async (blob: Blob) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    try {
        const buffer = await blob.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(buffer);
        return audioBuffer.duration;
    } finally {
        ctx.close();
    }
};

const makeId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `clip_${Math.random().toString(16).slice(2)}`;
};

const hashString = (input = "") => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const DEFAULT_SUBTITLE_STYLE = "scrapbook";
const DEFAULT_MOTION_STYLE = "plus";
const DEFAULT_CUTOUT_STYLE = "cutout-neo";
const DEFAULT_BROLL_STYLE = "scrapbook";

const SUBTITLE_STYLES = ["focus", "kinetic", "scrapbook", "bubble", "impact", "minimal"];
const MOTION_STYLES = ["grid", "velocity", "curve", "dots", "plus", "cross"];
const CUTOUT_STYLES = ["cutout-neo", "cutout-film", "cutout-paper", "cutout-float", "cutout-doodle", "cutout-glass"];
const BROLL_STYLES = ["scrapbook", "vogue", "bubble", "dv", "ccd", "y2k", "soft", "impact", "dark"];

const EXPORT_PRESETS = [
    { id: "1080p", label: "1080x1920", width: 1080, height: 1920 },
    { id: "2k", label: "2K · 1440x2560", width: 1440, height: 2560 },
    { id: "4k", label: "4K · 2160x3840", width: 2160, height: 3840 },
] as const;
type ExportPresetId = (typeof EXPORT_PRESETS)[number]["id"];

const DEFAULT_TEXT = `其实很多[姐妹]私信问我
为什么自己明明很[节约]
却总感觉[存不住钱]
其实玄学里常说[财库]财库
除了要[开源]
更重要的是把“[漏]”给堵住`;

const SRT_EXAMPLE = `1
00:00:00,000 --> 00:00:02,500
其实很多[姐妹]私信问我

2
00:00:02,500 --> 00:00:05,000
为什么自己明明很[节约]
却总感觉[存不住钱]

3
00:00:05,000 --> 00:00:08,200
其实玄学里常说[财库]财库
除了要[开源]`;

const timeToSeconds = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [h, m, s] = timeStr.replace(',', '.').split(':');
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
};

type ScriptItem = {
    id: string;
    text: string;
    duration: number; // seconds
    start: number; // seconds
    highlight: string[];
    event: string;
    bgImage: string | null;
    isSRT: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
    opacity: number;
    trackId: string;
    subtitleStyle: string;
    motionStyle: string;
    cutoutStyle: string;
    brollStyle: string;
};

// ========================================== 
// 🖼️ 组件：视觉元素 (使用 React.memo 优化性能)
// ========================================== 
const MotionARoll = memo(({ style, isPlaying, bgKeywords, gridDirection = 'forward' }) => {
    const plusData = useMemo(() => {
        if (style !== 'plus') return [];
        return Array.from({ length: 110 }).map((_, i) => {
            const seed = i * 13 + 7;
            return {
                id: i,
                isActive: pseudoRandom(seed) > 0.95,
                animDelay: pseudoRandom(seed + 1) * 5
            };
        });
    }, [style]);

    const crossData = useMemo(() => {
        if (style !== 'cross') return [];
        return [...Array(3)].map((_, i) => {
            const seed = i * 19 + 11;
            return {
                id: i,
                left: pseudoRandom(seed) * 100,
                top: pseudoRandom(seed + 1) * 100,
                delay: i * -1.5
            };
        });
    }, [style]);

    if (style === 'grid') {
        const size = 80;
        return (
            <div className="absolute inset-0 bg-[#09090b] overflow-hidden perspective-[600px] z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b] z-10 pointer-events-none"></div>
                <div 
                    className="absolute inset-[-100%] w-[300%] h-[300%] origin-center" 
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: `${size}px ${size}px`,
                        transform: 'rotateX(60deg)',
                        animation: isPlaying 
                            ? `gridMove${gridDirection === 'forward' ? 'Fwd' : 'Bwd'} 2s linear infinite` 
                            : 'none'
                    }} 
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-900/30 to-transparent pointer-events-none z-0"></div>
                <style>{`
                    @keyframes gridMoveFwd { 0% { background-position: 0 0; } 100% { background-position: 0 ${size}px; } } 
                    @keyframes gridMoveBwd { 0% { background-position: 0 0; } 100% { background-position: 0 -${size}px; } } 
                `}</style>
            </div>
        );
    }
    
    if (style === 'velocity') {
        const words = bgKeywords.length > 0 ? bgKeywords : ["HELLO", "WORLD"];
        return (
            <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden flex flex-col justify-center gap-12 rotate-[-10deg] scale-125 z-0">
                {[0, 1, 2, 3].map((row) => (
                    <div key={row} className="relative w-full whitespace-nowrap opacity-10">
                        <div 
                            className="inline-block text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500" 
                            style={{
                                WebkitTextStroke: '2px rgba(255,255,255,0.2)', 
                                animation: `marquee ${row % 2 === 0 ? '15s' : '20s'} linear infinite ${row % 2 === 0 ? '' : 'reverse'}`, 
                                animationPlayState: isPlaying ? 'running' : 'paused' 
                            }}
                        >
                            {(words.join(" • ") + " • ").repeat(5)}
                        </div>
                    </div>
                ))}
                <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
            </div>
        );
    }
    
    if (style === 'curve') { 
        const loopText = (bgKeywords.slice(0, 3).join(" • ") + " • ").repeat(3); 
        return (
            <div className="absolute inset-0 bg-neutral-900 overflow-hidden flex items-center justify-center z-0">
                <div className="relative w-[300px] h-[300px] animate-[spin_30s_linear_infinite] opacity-20">
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
        return (
            <div className="absolute inset-0 bg-[#f4f4f5] overflow-hidden z-0">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-20" style={{backgroundImage: 'radial-gradient(#27272a 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', transform: 'rotate(-15deg)', animation: isPlaying ? 'panDots 60s linear infinite' : 'none'}}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white opacity-80"></div>
                <style>{`@keyframes panDots { 0% { background-position: 0 0; } 100% { background-position: 100px 100px; } }`}</style>
            </div>
        );
    }
    
    if (style === 'plus') { 
        return (
            <div className="absolute inset-0 bg-neutral-900 overflow-hidden z-0">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-[spin_8s_linear_infinite] pointer-events-none z-0">
                    <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_270deg,rgba(255,255,255,0.4)_360deg)]"></div>
                </div>
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-11 gap-0 z-10 mix-blend-overlay">
                    {Array.from({length:110}).map((_, i) => (<div key={i} className="flex items-center justify-center text-white/30 text-[10px] font-thin transition-opacity duration-500">+</div>))}
                </div>
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-11 gap-0 z-20 pointer-events-none">
                    {plusData.map((item, i) => (item.isActive && (<div key={`h-${i}`} className="flex items-center justify-center text-white font-bold text-xs animate-[ping_2s_ease-out_infinite]" style={{ gridColumn: (i % 10) + 1, gridRow: Math.floor(i / 10) + 1, animationDelay: `${item.animDelay}s` }}>+</div>)))}
                </div>
            </div>
        ); 
    }
    
    if (style === 'cross') { 
        return (
            <div className="absolute inset-0 bg-[#e5e5e5] overflow-hidden flex items-center justify-center z-0">
                <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-10 animate-[panCross_60s_linear_infinite]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 5L15 15M15 5L5 15' stroke='black' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '30px 30px'}}></div>
                <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-20 animate-[panCross_30s_linear_infinite_reverse]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10L50 50M50 10L10 50' stroke='black' stroke-width='4'/%3E%3C/svg%3E")`, backgroundSize: '120px 120px'}}></div>
                {crossData.map((item) => (
                    <div key={item.id} className="absolute text-[200px] font-black text-black/5 leading-none animate-[flyX_4s_linear_infinite]" style={{ left: `${item.left}%`, top: `${item.top}%`, animationDelay: `${item.delay}s`, filter: 'blur(2px)' }}>X</div>
                ))}
                <style>{`@keyframes panCross { 0% { transform: translate(0, 0); } 100% { transform: translate(-100px, -100px); } } @keyframes flyX { 0% { transform: translateY(120vh) rotate(0deg) scale(0.5); opacity: 0; } 50% { opacity: 0.1; } 100% { transform: translateY(-120vh) rotate(180deg) scale(1.5); opacity: 0; } }`}</style>
            </div>
        ); 
    }
    
    return <div className="absolute inset-0 bg-black z-0" />;
});

// 使用 memo 优化 B-Roll
const BRollLayer = memo(({ src, event, isActive, style }) => {
    const StickerIcon = event === 'positive' ? DEFAULT_THEME_CONFIG.stickers.positive : (event === 'negative' ? DEFAULT_THEME_CONFIG.stickers.negative : DEFAULT_THEME_CONFIG.stickers.neutral);
    const randSeed = useMemo(() => hashString(`${src ?? ""}-${style}-${event}`), [src, style, event]);
    const randId = useMemo(() => Math.floor(pseudoRandom(randSeed) * 9), [randSeed]);
    const randBars = useMemo(() => Array.from({length: 15}).map((_, i) => pseudoRandom(randSeed + i + 1) > 0.5), [randSeed]);

    // 核心修改：如果没有图片，直接返回 null，不渲染任何内容（透出下层 MotionARoll）
    if (!src) return null;

    if (style === 'cutout-neo') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 z-10 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}><div className="relative w-[280px] aspect-[4/5] group hover:rotate-1 transition-transform duration-500"><div className={`absolute top-3 left-3 w-full h-full border-4 border-black ${event === 'negative' ? 'bg-rose-400' : 'bg-amber-400'}`}></div><div className="relative w-full h-full border-4 border-black bg-white overflow-hidden"><img src={src} className="w-full h-full object-cover grayscale contrast-125" alt="neo" onError={(e) => e.target.src='https://placehold.co/600x800/EEE/31343C?text=No+Image'}/><div className="absolute top-0 left-0 bg-black text-white px-3 py-1 font-mono text-xs font-bold border-b-4 border-r-4 border-white">FIG.0{randId}</div><div className="absolute bottom-4 right-4 bg-white border-2 border-black p-2 rounded-full shadow-[4px_4px_0_black] animate-bounce"><StickerIcon size={24} className="text-black" /></div></div></div></div>; }
    if (style === 'cutout-film') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 z-10 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}><div className="relative w-[300px] bg-[#1a1a1a] py-4 px-2 shadow-2xl flex flex-col gap-2 items-center transform rotate-1"><div className="absolute left-1 top-0 bottom-0 w-4 flex flex-col justify-between py-2">{[...Array(8)].map((_, i) => <div key={i} className="w-2 h-3 bg-white/10 rounded-sm"></div>)}</div><div className="absolute right-1 top-0 bottom-0 w-4 flex flex-col justify-between py-2">{[...Array(8)].map((_, i) => <div key={i} className="w-2 h-3 bg-white/10 rounded-sm"></div>)}</div><div className="w-[85%] aspect-video bg-gray-800 overflow-hidden border border-white/10 relative group"><img src={src} className="w-full h-full object-cover opacity-90 transition-transform duration-[8000ms] group-hover:scale-110" alt="film" onError={(e) => e.target.src='https://placehold.co/600x400/EEE/31343C?text=No+Image'} /><div className="absolute bottom-1 right-2 text-[10px] font-mono text-orange-500 tracking-widest animate-pulse">REC ●</div></div><div className="w-[85%] aspect-video bg-gray-800 overflow-hidden border border-white/10 relative opacity-40"><img src={src} className="w-full h-full object-cover grayscale blur-[1px]" alt="film-prev" /></div></div></div>; }
    if (style === 'cutout-glass') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 z-10 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}><div className="relative w-[280px] h-[350px] group perspective-[1000px]"><div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-20 overflow-hidden transform transition-transform duration-500 group-hover:rotate-x-2 group-hover:rotate-y-2"><div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] animate-[shimmer_5s_infinite]"></div><img src={src} className="w-full h-full object-cover opacity-90 transition-transform duration-[10s] group-hover:scale-110 mix-blend-overlay" alt="glass" /><div className="absolute inset-0 rounded-[2.5rem] border border-white/30 pointer-events-none"></div><div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6"><div className="text-white/60 text-[10px] font-mono tracking-[0.2em] uppercase mb-1">Status</div><div className="text-white text-xl font-bold flex items-center gap-2"><Activity size={18} className="text-emerald-400" />{event === 'positive' ? 'High Energy' : 'Stable'}</div></div></div></div></div>; }
    if (style === 'cutout-paper') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 z-10 ${isActive ? 'opacity-100 rotate-[-2deg] scale-100' : 'opacity-0 rotate-12 scale-50'}`}><div className="relative w-[70%] aspect-[3/4] drop-shadow-[10px_10px_0_rgba(0,0,0,0.5)]"><div className="absolute inset-0 bg-white p-2" style={{ clipPath: 'polygon(2% 0, 100% 2%, 98% 100%, 0 98%)' }}><div className="w-full h-full overflow-hidden relative grayscale contrast-125" style={{ clipPath: 'polygon(0 0, 100% 5%, 95% 100%, 5% 95%)' }}><img src={src} className="w-full h-full object-cover" alt="paper-cut" /></div></div><div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 rotate-2 backdrop-blur-sm shadow-sm mix-blend-multiply ${event === 'negative' ? 'bg-rose-400/80' : 'bg-yellow-400/80'}`}></div><div className="absolute -bottom-6 -right-6 w-20 h-20 bg-black text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-[spin_10s_linear_infinite]"><span className="font-black text-xs text-center leading-none -rotate-12">LOOK<br/>HERE</span></div></div></div>; }
    if (style === 'cutout-float') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 z-10 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}><div className="relative w-[280px] h-[280px] animate-[float_4s_ease-in-out_infinite]"><div className="absolute inset-0 rounded-full border-[8px] border-white overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] bg-sky-200"><img src={src} className="w-full h-full object-cover scale-110" alt="float" /><div className="absolute top-4 left-4 w-12 h-6 bg-white/40 rounded-full blur-md rotate-[-45deg]"></div></div><div className="absolute -top-4 -right-2 bg-white p-2 rounded-full shadow-lg animate-bounce"><StickerIcon size={24} className={event === 'negative' ? DEFAULT_THEME_CONFIG.accentColor : DEFAULT_THEME_CONFIG.primaryColor} fill="currentColor" /></div></div><style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }`}</style></div>; }
    if (style === 'cutout-doodle') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 z-10 ${isActive ? 'opacity-100 rotate-1' : 'opacity-0 rotate-[-5deg]'}`}><div className="relative w-[280px] aspect-[4/5] group"><div className="absolute inset-0 bg-white border-4 border-black rounded-sm transform rotate-1 shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-transform group-hover:rotate-0"></div><div className="absolute inset-3 border-2 border-black overflow-hidden bg-gray-100"><img src={src} className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500" alt="doodle" /></div><svg className="absolute -top-6 -left-6 w-[120%] h-[120%] pointer-events-none overflow-visible z-20" viewBox="0 0 200 200"><path d="M20,20 C50,10 150,10 180,20 C200,40 200,160 180,180 C150,190 50,190 20,180 C0,160 0,40 20,20" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="10 5" strokeLinecap="round" className="animate-[draw_2s_ease-out_forwards]" /><path d="M180,150 Q220,150 210,180" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowhead)" /></svg><div className="absolute -bottom-8 -left-6 bg-yellow-300 text-black px-4 py-3 font-handwriting text-sm transform -rotate-3 shadow-md border border-black/10"><span className="font-bold block text-xs opacity-50 mb-1">NOTE:</span><span className="font-black text-lg">{event === 'negative' ? 'Don\'t!' : 'Point!'}</span><div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/40 rotate-2 backdrop-blur-sm"></div></div></div><style>{`@keyframes draw { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }`}</style></div>; }
    
    // --- B-Roll Styles ---
    if (style === 'scrapbook') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}><div className="relative w-[80%] max-w-[300px] bg-[#f8f8f6] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] rotate-[-2deg] transition-transform duration-[8000ms] hover:rotate-0 hover:scale-105"><div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black/80 -rotate-1 backdrop-blur-sm shadow-sm z-20 mix-blend-overlay opacity-90" style={{maskImage: 'url(https://www.transparenttextures.com/patterns/black-scales.png)'}}></div><div className="absolute -top-2 right-4 text-gray-400 rotate-12 z-20 drop-shadow-md"><Paperclip size={40} strokeWidth={1.5} /></div><div className="aspect-[3/4] overflow-hidden border border-gray-200 grayscale-[0.2] contrast-110"><img src={src} className="w-full h-full object-cover" alt="moodboard" /></div><div className="mt-3 flex justify-between items-end"><div className="font-serif italic text-gray-500 text-sm">Fig. {randId}</div><div className="font-handwriting text-xs px-2 py-1 bg-black text-white transform -rotate-1">#{event}</div></div><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40 pointer-events-none mix-blend-multiply"></div></div></div>; }
    if (style === 'vogue') { return <div className={`absolute inset-0 transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`}><div className="absolute inset-x-8 top-28 bottom-48 border border-white/20 p-2"><div className="w-full h-full overflow-hidden relative grayscale-[0.8] contrast-125 hover:grayscale-0 transition-all duration-1000"><img src={src} className="w-full h-full object-cover scale-110" alt="editorial" /><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div></div></div><div className="absolute top-10 left-8 right-8 flex justify-between items-end border-b border-white/30 pb-2"><span className="text-4xl font-serif font-black tracking-tighter text-white">FOCUS</span><span className="text-[10px] font-mono tracking-widest text-white/70 mb-1">VOL. 01</span></div><div className="absolute bottom-20 left-8 text-white/60 text-[10px] font-mono leading-tight"><p>EXCLUSIVE INTERVIEW</p><p>THE ART OF GROWTH</p></div><div className="absolute bottom-20 right-8"><div className="flex h-8 gap-[2px] opacity-80">{[...randBars].map((isThick, i) => <div key={i} className={`w-[${isThick ? '2px' : '4px'}] bg-white h-full`}></div>)}</div></div></div>; }
    if (style === 'bubble') { return <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}><div className="w-64 aspect-square bg-white/10 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/20 p-4 flex flex-col gap-3 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div><div className="flex justify-between items-center text-white/80 px-2"><div className="flex items-center gap-2 text-xs font-medium"><Calendar size={12} /> Today</div><div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]"></div></div><div className="flex-1 rounded-[2rem] overflow-hidden relative shadow-inner group"><img src={src} className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-110" alt="widget" /><div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div><div className="absolute bottom-3 left-4 text-white font-medium text-sm">Mindset</div></div></div></div>; }
    let filterStyle = { opacity: 0.9 }; 
    let overlay = null;
    if (style === 'dv') { filterStyle = { opacity: 0.85, filter: 'contrast(1.1) sepia(0.2)' }; overlay = ( <><div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_3px] pointer-events-none opacity-40"></div><div className="absolute top-6 left-6 flex items-center gap-2 z-20"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><span className="text-white/90 font-mono text-[10px] tracking-widest uppercase">REC</span></div></> ); }
    else if (style === 'ccd') { filterStyle = { filter: 'contrast(1.05) brightness(1.1) saturate(1.1)' }; overlay = <div className="absolute bottom-8 right-6 font-mono text-yellow-500/80 text-sm font-bold tracking-widest z-20 drop-shadow-sm font-digital">'08 24</div>; }
    else if (style === 'y2k') { filterStyle = { filter: 'contrast(1.2) saturate(1.3)', mixBlendMode: 'normal' }; overlay = <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-pink-500/20 mix-blend-overlay"></div>; }
    else if (style === 'impact') { filterStyle = { filter: 'grayscale(100%) contrast(1.4)', opacity: 0.6 }; overlay = <div className="absolute inset-0 bg-neutral-900/50 mix-blend-multiply"></div>; }
    else if (style === 'soft') { filterStyle = { filter: 'brightness(1.05) saturate(0.8) contrast(0.9)', opacity: 1 }; overlay = <div className="absolute inset-0 bg-white/10 mix-blend-screen"></div>; }
    else if (style === 'dark') { filterStyle = { filter: 'brightness(0.6) grayscale(0.4)', opacity: 1 }; }
    return <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`}><img src={src} className={`w-full h-full object-cover transition-transform duration-[10000ms] ${isActive ? 'scale-110' : 'scale-100'}`} style={filterStyle} alt="b-roll" onError={(e) => e.target.src='https://placehold.co/600x800/EEE/31343C?text=No+Image'}/>{overlay}</div>;
});

const FocusText = ({ text, frame, highlightWords, event, getSentiment }) => {
    const wordsToShow = highlightWords.length > 0 ? highlightWords : [text];
    return <div className="w-full h-full flex flex-col justify-center items-center relative z-40"><div className="flex flex-col gap-4 items-center">{wordsToShow.map((word, idx) => { const delay = idx * 10; const progress = Math.min(1, Math.max(0, (frame - delay) / 8)); const show = frame > delay; const scale = show ? 1 + (1 - progress) * 2 : 3; const opacity = progress; const sentiment = getSentiment(word); let colorClass = "text-white"; if (sentiment === 'negative') colorClass = DEFAULT_THEME_CONFIG.accentColor; else if (sentiment === 'positive') colorClass = DEFAULT_THEME_CONFIG.primaryColor; return (<div key={idx} style={{ opacity, transform: `scale(${scale})`, filter: `blur(${(1-progress)*10}px)`}} className={`font-black text-5xl md:text-6xl tracking-tighter drop-shadow-2xl ${colorClass}`}>{word}</div>) })}</div><div className="absolute bottom-24 px-8 text-center" style={{ opacity: Math.min(0.8, Math.max(0, (frame - 20) / 20)) }}><p className="text-white/60 text-xs font-light tracking-widest uppercase border-t border-white/20 pt-2">{text}</p></div></div>;
}
const KineticText = ({ text, frame, highlightWords, event, getSentiment }) => {
    const parts = []; if (!highlightWords || highlightWords.length === 0) { parts.push({ text: text, isHighlight: false }); } else { const regex = new RegExp(`(${highlightWords.join('|')})`, 'g'); const split = text.split(regex); split.forEach(part => { if (!part) return; parts.push({ text: part, isHighlight: highlightWords.includes(part) }); }); } 
    return <div className="w-full h-full flex flex-col justify-center items-start px-8 relative z-30 gap-1">{parts.map((part, idx) => { const delay = idx * 5; const progress = Math.min(1, Math.max(0, (frame - delay) / 10)); const x = (1 - progress) * -50; if (part.isHighlight) { const sentiment = getSentiment(part.text); let textColor = "text-black"; if (sentiment === 'negative') textColor = DEFAULT_THEME_CONFIG.accentColor.replace('text-', 'text-'); else if (sentiment === 'positive') textColor = DEFAULT_THEME_CONFIG.primaryColor.replace('text-', 'text-'); return (<div key={idx} style={{ opacity: progress, transform: `translateX(${x}px)` }} className={`bg-white px-4 py-2 font-black text-4xl shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-2 origin-left border-2 border-black ${textColor}`}>{part.text}</div>) } else { return (<div key={idx} style={{ opacity: progress, transform: `translateX(${x}px)` }} className="max-w-full"><span className="text-white/90 text-xl font-bold drop-shadow-md bg-black/50 px-2 py-1 leading-normal box-decoration-clone">{part.text}</span></div>) } })}</div>;
}
const ScrapbookText = ({ text, frame, highlightWords, event, getSentiment }) => {
    return <div className="w-full h-full flex flex-col justify-end items-center px-6 pb-36 relative z-30"><div className={`relative bg-[#FFFBF0] border-2 border-gray-800 p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-wrap justify-center items-baseline gap-x-1.5 gap-y-3 ${frame < 5 ? 'translate-y-8 opacity-0 rotate-1' : 'translate-y-0 opacity-100 rotate-0'} transition-all duration-500`} style={{ maxWidth: '95%' }}>{text.split('').map((char, index) => { const currentHighlightWord = highlightWords.find(w => text.indexOf(w) <= index && text.indexOf(w) + w.length > index); const isHighlight = !!currentHighlightWord; const delay = index * 2; const progress = Math.min(1, Math.max(0, (frame - delay) / 8)); let scale = isHighlight ? (progress < 0.8 ? progress * 1.4 : 1.25) : progress; let y = isHighlight ? (1 - progress) * 2 : (1 - progress) * 10; let wordColor = 'text-black'; let highlightBg = 'bg-yellow-300'; if (isHighlight) { const sentiment = getSentiment(currentHighlightWord); if (sentiment === 'negative') { wordColor = DEFAULT_THEME_CONFIG.accentColor; highlightBg = DEFAULT_THEME_CONFIG.accentBg; } else if (sentiment === 'positive') { wordColor = DEFAULT_THEME_CONFIG.primaryColor; highlightBg = DEFAULT_THEME_CONFIG.primaryBg; } else { wordColor = DEFAULT_THEME_CONFIG.neutralColor; highlightBg = DEFAULT_THEME_CONFIG.neutralBg; } } return (<span key={index} className={`relative font-serif leading-none ${isHighlight ? `font-black text-3xl md:text-4xl ${wordColor}` : 'text-xl md:text-2xl text-gray-800'}`} style={{ opacity: progress, transform: `translateY(${y}px) scale(${scale})`, display: 'inline-block' }}>{char} {isHighlight && progress > 0.8 && <span className={`absolute bottom-1 left-0 w-full h-[40%] -z-10 mix-blend-multiply rounded-full transform -rotate-2 ${highlightBg} opacity-30`}></span>}</span>) })}</div></div>;
}
const BubbleText = ({ text, frame, highlightWords, event, getSentiment }) => { const show = frame > 5; return <div className="w-full h-full flex flex-col justify-center items-center px-8 pb-20 relative z-30"><div className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 relative transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-500 flex items-center justify-center shrink-0 text-white shadow-lg"><MessageCircle size={20} /></div><div className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">新消息</span><p className="text-lg md:text-xl text-gray-800 leading-relaxed font-sans font-medium">{text.split('').map((char, index) => { const currentHighlightWord = highlightWords.find(w => text.indexOf(w) <= index && text.indexOf(w) + w.length > index); const isHighlight = !!currentHighlightWord; let colorClass = ""; if (isHighlight) { const sentiment = getSentiment(currentHighlightWord); if (sentiment === 'negative') colorClass = "text-rose-500 font-black"; else if (sentiment === 'positive') colorClass = "text-amber-500 font-black"; else colorClass = "text-indigo-500 font-black"; } return <span key={index} className={colorClass}>{char}</span> })}</p></div></div></div></div>; }
const ImpactText = ({ text, frame, highlightWords, event, getSentiment }) => { return <div className="w-full h-full flex flex-col justify-center items-center px-4 relative z-30"><div className={`absolute top-20 w-full h-12 bg-black -rotate-3 flex items-center justify-center overflow-hidden transition-transform duration-500 ${frame < 5 ? 'scale-x-0' : 'scale-x-100'}`}><div className="flex gap-4 animate-marquee whitespace-nowrap text-white font-black uppercase tracking-widest text-xs">高能预警 /// 重点关注 /// 高能预警 /// 重点关注 ///</div></div><div className="flex flex-wrap justify-center gap-2 text-center max-w-[95%]">{text.split(/([，、])/).map((chunk, i) => { if (['，','、'].includes(chunk)) return null; const currentHighlightWord = highlightWords.find(w => chunk.includes(w)); const isHighlight = !!currentHighlightWord; const delay = i * 5; const show = frame > delay; let bgClass = "bg-white text-black"; if (isHighlight) { const sentiment = getSentiment(currentHighlightWord); if (sentiment === 'negative') bgClass = `${DEFAULT_THEME_CONFIG.accentBg} text-white`; else if (sentiment === 'positive') bgClass = `${DEFAULT_THEME_CONFIG.primaryBg} text-white`; else bgClass = "bg-black text-white"; } return ( <div key={i} className={`transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${isHighlight ? `${bgClass} px-4 py-2 shadow-[4px_4px_0_black] transform rotate-[-2deg]` : 'text-black bg-white px-2 py-1 shadow-sm'}`}> <span className={`font-black tracking-tighter ${isHighlight ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>{chunk}</span> </div> ) })}</div></div>; }
const MinimalText = ({ text, frame, highlightWords, event, getSentiment }) => { return <div className="w-full h-full flex flex-col justify-end items-center pb-20 px-4 relative z-30"><div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-xl max-w-[95%] transition-all duration-500"><p className="text-center leading-relaxed">{text.split('').map((char, index) => { const currentHighlightWord = highlightWords.find(w => text.indexOf(w) <= index && text.indexOf(w) + w.length > index); const isHighlight = !!currentHighlightWord; const opacity = Math.min(1, Math.max(0, (frame - index * 1) / 10)); let colorClass = "text-gray-100 font-medium"; if (isHighlight) { const sentiment = getSentiment(currentHighlightWord); if (sentiment === 'negative') colorClass = "font-black text-rose-400 drop-shadow-[0_2px_10px_rgba(244,63,94,0.5)]"; else if (sentiment === 'positive') colorClass = "font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]"; else colorClass = "font-black text-white drop-shadow-md"; } return <span key={index} className={`text-lg md:text-2xl transition-all duration-300 ${colorClass}`} style={{ opacity }}>{char}</span> })}</p></div></div>; }

// ========================================== 
// 🎞️ 组件：媒体选择器弹窗 (取代下拉菜单)
// ========================================== 
const MediaPickerModal = ({ isOpen, onClose, images, onSelect, onAddImage, onRemove }: { isOpen: boolean; onClose: () => void; images: MediaItem[]; onSelect: (ref: string) => void; onAddImage: (url: string) => void; onRemove: () => void; }) => { 
    const [customUrl, setCustomUrl] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><ImageIcon size={18}/> 选择素材</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-3 gap-3">
                        {images.map((img, i) => (
                            <div key={`${img.ref}-${i}`} className="aspect-[9/16] relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-amber-500 hover:ring-2 hover:ring-amber-200 transition-all" onClick={() => onSelect(img.ref)}>
                                <img src={img.src} className="w-full h-full object-cover" alt={`stock-${i}`} />
                                {img.isLocal && (
                                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                                        本地
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-3">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 text-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
                            placeholder="或输入图片 URL..."
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                        />
                        <button 
                            onClick={() => { if(customUrl) { onAddImage(customUrl); onSelect(customUrl); } }}
                            className="bg-black text-white text-xs px-4 py-2 rounded font-bold hover:bg-gray-800"
                        >
                            使用
                        </button>
                    </div>
                    <button 
                        onClick={onRemove}
                        className="w-full py-2 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 text-xs rounded font-bold border border-transparent hover:border-red-200 flex items-center justify-center gap-2 transition-all"
                    >
                        <Trash2 size={14}/> 移除图片 (留空/仅背景)
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 主程序 ---
export default function App() {
  const params = useParams();
  const projectId = typeof params?.projectId === "string" ? params.projectId : "default";
  const storageKey = useMemo(() => `remotion-editor:${projectId}:v1`, [projectId]);

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const theme = THEME_CONFIG[themeMode];

  const [config, setConfig] = useState({
      positiveWords: DEFAULT_POSITIVE_KEYWORDS,
      negativeWords: DEFAULT_NEGATIVE_KEYWORDS,
      bgKeywords: DEFAULT_BG_KEYWORDS,
      images: DEFAULT_STOCK_IMAGES,
      audios: DEFAULT_AUDIO
  });

  const [scriptData, setScriptData] = useState<ScriptItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [tracks, setTracks] = useState<Track[]>([
      { id: "background", label: "背景", type: "background" },
      { id: "cutout", label: "抠像", type: "image" },
      { id: "broll", label: "空镜", type: "image" },
      { id: "audio", label: "音频", type: "audio" },
      { id: "text", label: "字幕", type: "text" },
  ]);
  const [layerClips, setLayerClips] = useState<Clip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); 
  const [gridDirection, setGridDirection] = useState('forward');
  const [exportPreset, setExportPreset] = useState<ExportPresetId>("2k");
  
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [isSRTMode, setIsSRTMode] = useState(false);
  
  const [activeSubtitleStyle, setActiveSubtitleStyle] = useState(DEFAULT_SUBTITLE_STYLE);
  const [activeCutoutStyle, setActiveCutoutStyle] = useState(DEFAULT_CUTOUT_STYLE); 
  const [activeBrollStyle, setActiveBrollStyle] = useState(DEFAULT_BROLL_STYLE); 
  const [activeMotionStyle, setActiveMotionStyle] = useState(DEFAULT_MOTION_STYLE); 

  // Media Picker State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [markers, setMarkers] = useState<Array<{ id: string; time: number; label?: string; color?: string }>>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasStoredState, setHasStoredState] = useState(false);
  const persistTimeoutRef = useRef<number | null>(null);
  const localImageInputRef = useRef<HTMLInputElement | null>(null);
  const localAudioInputRef = useRef<HTMLInputElement | null>(null);
  const [localImageDataUrls, setLocalImageDataUrls] = useState<Record<string, string>>({});
  const [localAudioDataUrls, setLocalAudioDataUrls] = useState<Record<string, string>>({});
  const [localAudioMeta, setLocalAudioMeta] = useState<Record<string, { name: string; duration: number }>>({});

  useEffect(() => {
      if (typeof window === "undefined") return;
      try {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) {
              setHasStoredState(false);
              setHasLoaded(true);
              return;
          }
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object") {
              setHasStoredState(false);
              setHasLoaded(true);
              return;
          }
          setHasStoredState(true);

          if (parsed.themeMode === "dark" || parsed.themeMode === "light") {
              setThemeMode(parsed.themeMode);
          }

          if (parsed.config && typeof parsed.config === "object") {
              setConfig({
                  positiveWords: Array.isArray(parsed.config.positiveWords) ? parsed.config.positiveWords : DEFAULT_POSITIVE_KEYWORDS,
                  negativeWords: Array.isArray(parsed.config.negativeWords) ? parsed.config.negativeWords : DEFAULT_NEGATIVE_KEYWORDS,
                  bgKeywords: Array.isArray(parsed.config.bgKeywords) ? parsed.config.bgKeywords : DEFAULT_BG_KEYWORDS,
                  images: Array.isArray(parsed.config.images) ? parsed.config.images : DEFAULT_STOCK_IMAGES,
                  audios: Array.isArray(parsed.config.audios) ? parsed.config.audios : DEFAULT_AUDIO,
              });
          }

          if (Array.isArray(parsed.scriptData)) setScriptData(parsed.scriptData);
          if (Array.isArray(parsed.tracks)) {
              const nextTracks = [...parsed.tracks];
              if (!nextTracks.some((track) => track.id === "audio")) {
                  nextTracks.splice(3, 0, { id: "audio", label: "音频", type: "audio" });
              }
              setTracks(nextTracks);
          }
          if (Array.isArray(parsed.layerClips)) setLayerClips(parsed.layerClips);
          if (Array.isArray(parsed.markers)) setMarkers(parsed.markers);

          const availableIds = new Set<string>([
              ...(Array.isArray(parsed.scriptData) ? parsed.scriptData : []).map((item) => item?.id).filter(Boolean),
              ...(Array.isArray(parsed.layerClips) ? parsed.layerClips : []).map((clip) => clip?.id).filter(Boolean),
          ]);

          if (Array.isArray(parsed.selectedClipIds)) {
              setSelectedClipIds(parsed.selectedClipIds.filter((id) => availableIds.has(id)));
          }

          if (typeof parsed.selectedMarkerId === "string") {
              const markerIds = new Set(
                  (Array.isArray(parsed.markers) ? parsed.markers : []).map((marker) => marker?.id).filter(Boolean)
              );
              setSelectedMarkerId(markerIds.has(parsed.selectedMarkerId) ? parsed.selectedMarkerId : null);
          }

          if (typeof parsed.activeTab === "string" && ["editor", "storyboard", "style", "settings", "resources"].includes(parsed.activeTab)) {
              setActiveTab(parsed.activeTab);
          }

          if (parsed.gridDirection === "forward" || parsed.gridDirection === "backward") {
              setGridDirection(parsed.gridDirection);
          }

          if (typeof parsed.exportPreset === "string" && EXPORT_PRESETS.some((preset) => preset.id === parsed.exportPreset)) {
              setExportPreset(parsed.exportPreset);
          }

          if (typeof parsed.inputText === "string") setInputText(parsed.inputText);
          if (typeof parsed.isSRTMode === "boolean") setIsSRTMode(parsed.isSRTMode);
          if (typeof parsed.activeSubtitleStyle === "string") setActiveSubtitleStyle(parsed.activeSubtitleStyle);
          if (typeof parsed.activeCutoutStyle === "string") setActiveCutoutStyle(parsed.activeCutoutStyle);
          if (typeof parsed.activeBrollStyle === "string") setActiveBrollStyle(parsed.activeBrollStyle);
          if (typeof parsed.activeMotionStyle === "string") setActiveMotionStyle(parsed.activeMotionStyle);
      } catch (error) {
          console.warn("Failed to load editor state from localStorage.", error);
          setHasStoredState(false);
      } finally {
          setHasLoaded(true);
      }
  }, [storageKey]);

  useEffect(() => {
      if (!hasLoaded) return;
      if (typeof window === "undefined") return;
      if (!("indexedDB" in window)) return;
      let cancelled = false;
      const load = async () => {
          try {
              const records = await loadLocalImageRecords(projectId);
              const nextMap: Record<string, string> = {};
              for (const record of records) {
                  try {
                      const dataUrl = await blobToDataUrl(record.data);
                      if (dataUrl) nextMap[record.id] = dataUrl;
                  } catch (error) {
                      console.warn("Failed to decode local image.", error);
                  }
              }
              if (!cancelled) {
                  setLocalImageDataUrls(nextMap);
              }
          } catch (error) {
              console.warn("Failed to load local images from IndexedDB.", error);
          }
      };
      load();
      return () => {
          cancelled = true;
      };
  }, [hasLoaded, projectId]);

  useEffect(() => {
      if (!hasLoaded) return;
      if (typeof window === "undefined") return;
      if (!("indexedDB" in window)) return;
      let cancelled = false;
      const load = async () => {
          try {
              const records = await loadLocalAudioRecords(projectId);
              const nextMap: Record<string, string> = {};
              const nextMeta: Record<string, { name: string; duration: number }> = {};
              for (const record of records) {
                  try {
                      const dataUrl = await blobToDataUrl(record.data);
                      if (dataUrl) {
                          nextMap[record.id] = dataUrl;
                      }
                      nextMeta[record.id] = { name: record.name, duration: record.duration };
                  } catch (error) {
                      console.warn("Failed to decode local audio.", error);
                  }
              }
              if (!cancelled) {
                  setLocalAudioDataUrls(nextMap);
                  setLocalAudioMeta(nextMeta);
              }
          } catch (error) {
              console.warn("Failed to load local audios from IndexedDB.", error);
          }
      };
      load();
      return () => {
          cancelled = true;
      };
  }, [hasLoaded, projectId]);

  useEffect(() => {
      if (!hasLoaded) return;
      if (typeof window === "undefined") return;
      if (persistTimeoutRef.current) {
          window.clearTimeout(persistTimeoutRef.current);
      }
      persistTimeoutRef.current = window.setTimeout(() => {
          try {
              const payload = {
                  version: 1,
                  savedAt: Date.now(),
                  themeMode,
                  config,
                  scriptData,
                  tracks,
                  layerClips,
                  markers,
                  selectedClipIds,
                  selectedMarkerId,
                  activeTab,
                  gridDirection,
                  exportPreset,
                  inputText,
                  isSRTMode,
                  activeSubtitleStyle,
                  activeCutoutStyle,
                  activeBrollStyle,
                  activeMotionStyle,
              };
              window.localStorage.setItem(storageKey, JSON.stringify(payload));
          } catch (error) {
              console.warn("Failed to save editor state to localStorage.", error);
          }
      }, 250);
      return () => {
          if (persistTimeoutRef.current) {
              window.clearTimeout(persistTimeoutRef.current);
          }
      };
  }, [
      hasLoaded,
      storageKey,
      themeMode,
      config,
      scriptData,
      tracks,
      layerClips,
      markers,
      selectedClipIds,
      selectedMarkerId,
      activeTab,
      gridDirection,
      exportPreset,
      inputText,
      isSRTMode,
      activeSubtitleStyle,
      activeCutoutStyle,
      activeBrollStyle,
      activeMotionStyle,
  ]);

  const getWordSentiment = (word) => {
      if (!word) return 'neutral';
      if (config.negativeWords.some(k => word.includes(k))) return 'negative';
      if (config.positiveWords.some(k => word.includes(k))) return 'positive';
      return 'neutral'; 
  };

  const resolveImageRef = useCallback(
      (value: string | null) => {
          if (!value) return null;
          if (!isIdbRef(value)) return value;
          const id = getIdFromRef(value);
          return localImageDataUrls[id] ?? null;
      },
      [localImageDataUrls]
  );

  const resolveAudioRef = useCallback(
      (value: string | null) => {
          if (!value) return null;
          if (!isAudioRef(value)) return value;
          const id = getAudioIdFromRef(value);
          return localAudioDataUrls[id] ?? null;
      },
      [localAudioDataUrls]
  );

  const formatDuration = (value?: number) => {
      if (typeof value !== "number" || Number.isNaN(value)) return "--:--";
      const safe = Math.max(0, Math.floor(value));
      const minutes = Math.floor(safe / 60);
      const seconds = safe % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getAudioName = (ref: string) => {
      if (isAudioRef(ref)) {
          const id = getAudioIdFromRef(ref);
          return localAudioMeta[id]?.name ?? "本地音频";
      }
      const trimmed = ref.split("?")[0];
      const name = trimmed.split("/").pop();
      return name ? decodeURIComponent(name) : "音频";
  };

  const getAudioDuration = (ref: string) => {
      if (!isAudioRef(ref)) return undefined;
      const id = getAudioIdFromRef(ref);
      return localAudioMeta[id]?.duration;
  };

  const mediaItems = useMemo(() => {
      return config.images
          .map((ref) => {
              const src = resolveImageRef(ref);
              if (!src) return null;
              return { ref, src, isLocal: isIdbRef(ref) } as MediaItem;
          })
          .filter(Boolean) as MediaItem[];
  }, [config.images, resolveImageRef]);

  const audioItems = useMemo(() => {
      return config.audios
          .map((ref) => {
              const src = resolveAudioRef(ref);
              if (!src) return null;
              return {
                  ref,
                  src,
                  name: getAudioName(ref),
                  duration: getAudioDuration(ref),
                  isLocal: isAudioRef(ref),
              } as AudioItem;
          })
          .filter(Boolean) as AudioItem[];
  }, [config.audios, resolveAudioRef, localAudioMeta]);

  const remoteImagesValue = useMemo(() => {
      return config.images.filter((img) => !isIdbRef(img)).join("\n");
  }, [config.images]);

  const remoteAudiosValue = useMemo(() => {
      return config.audios.filter((audio) => !isAudioRef(audio)).join("\n");
  }, [config.audios]);

  const parseScript = (rawText): ScriptItem[] => {
      const srtRegex = /(\d+)\s*\n(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*\n([\s\S]*?)(?=\n\s*\n|$)/g;
      const srtMatches = [...rawText.matchAll(srtRegex)];

      const baseClip = {
          x: PREVIEW_WIDTH / 2,
          y: PREVIEW_HEIGHT / 2,
          width: Math.round(PREVIEW_WIDTH * 0.9),
          height: Math.round(PREVIEW_HEIGHT * 0.6),
          scale: 1,
          rotation: 0,
          opacity: 1,
          trackId: "text",
          subtitleStyle: DEFAULT_SUBTITLE_STYLE,
          motionStyle: DEFAULT_MOTION_STYLE,
          cutoutStyle: DEFAULT_CUTOUT_STYLE,
          brollStyle: DEFAULT_BROLL_STYLE,
      };

      const buildItem = (params: Omit<ScriptItem, "id" | "bgImage" | "isSRT"> & { isSRT: boolean }) => {
          return {
              id: makeId(),
              bgImage: null,
              ...baseClip,
              ...params,
          };
      };

      let parsed: ScriptItem[] = [];
      if (srtMatches.length > 0) {
          parsed = srtMatches.map((match) => {
              const start = Math.max(0, timeToSeconds(match[2]));
              const end = Math.max(start, timeToSeconds(match[3]));
              const rawContent = match[4].trim();
              const highlight: string[] = [];
              const cleanText = rawContent.replace(/\s*\[(.*?)\]\s*/g, (match, p1) => { highlight.push(p1); return p1; }).replace(/\n/g, ' ');
              let event = 'normal';
              if (config.negativeWords.some(k => rawContent.includes(k))) event = 'negative';
              else if (config.positiveWords.some(k => rawContent.includes(k))) event = 'positive';
              const durationSeconds = Math.max(0.5, end - start);
              return buildItem({
                  text: cleanText,
                  duration: durationSeconds,
                  start,
                  highlight,
                  event,
                  isSRT: true,
              });
          });
      } else {
          let cursor = 0;
          parsed = rawText.split('\n').filter(line => line.trim() !== '').map((line) => {
              const highlight: string[] = [];
              const cleanText = line.replace(/\s*\[(.*?)\]\s*/g, (match, p1) => { highlight.push(p1); return p1; });
              let event = 'normal';
              if (config.negativeWords.some(k => line.includes(k))) event = 'negative';
              else if (config.positiveWords.some(k => line.includes(k))) event = 'positive';
              const baseFrames = Math.max(40, line.length * 6);
              const durationSeconds = (baseFrames + 20) / FPS;
              const item = buildItem({
                  text: cleanText,
                  duration: durationSeconds,
                  start: cursor,
                  highlight,
                  event,
                  isSRT: false,
              });
              cursor += durationSeconds;
              return item;
          });
      }

      if (parsed.length > 0) {
          parsed[0].bgImage = config.images[0] ?? null;
      }
      return parsed;
  };

  const buildLayerClips = (items: ScriptItem[]) => {
      const getLayerZIndex = (trackId: string) => {
          if (trackId === "background") return 0;
          if (trackId === "broll") return 10;
          if (trackId === "cutout") return 20;
          return 0;
      };
      return items.flatMap((item) => ([ 
          {
              id: `${item.id}::bg`,
              name: "动态背景",
              type: "background",
              start: item.start,
              duration: item.duration,
              trackId: "background",
              zIndex: getLayerZIndex("background"),
              motionStyle: item.motionStyle ?? DEFAULT_MOTION_STYLE,
              sentiment: item.event === "normal" ? "neutral" : item.event,
          },
          {
              id: `${item.id}::cutout`,
              name: "抠像",
              type: "image",
              start: item.start,
              duration: item.duration,
              trackId: "cutout",
              zIndex: getLayerZIndex("cutout"),
              visualStyle: item.cutoutStyle ?? DEFAULT_CUTOUT_STYLE,
              src: item.bgImage ?? null,
              sentiment: item.event === "normal" ? "neutral" : item.event,
          },
          {
              id: `${item.id}::broll`,
              name: "空镜",
              type: "image",
              start: item.start,
              duration: item.duration,
              trackId: "broll",
              zIndex: getLayerZIndex("broll"),
              visualStyle: item.brollStyle ?? DEFAULT_BROLL_STYLE,
              src: item.bgImage ?? null,
              sentiment: item.event === "normal" ? "neutral" : item.event,
          },
      ]));
  };

  useEffect(() => {
      if (!hasLoaded || hasStoredState) return;
      if (projectId.startsWith("new-")) {
          setInputText("");
          setScriptData([]);
          setLayerClips([]);
          setCurrentTime(0);
          setSelectedClipIds([]);
          setIsSRTMode(false);
          return;
      }
      const initialScript = parseScript(DEFAULT_TEXT);
      setScriptData(initialScript);
      setLayerClips(buildLayerClips(initialScript));
      setCurrentTime(0);
      setSelectedClipIds([]);
  }, [hasLoaded, hasStoredState, projectId]); 

  const autoTagKeywords = () => {
      let newText = inputText.replace(/\</g, '').replace(/\>/g, '');
      const allKeywords = [...config.positiveWords, ...config.negativeWords];
      allKeywords.sort((a, b) => b.length - a.length).forEach(keyword => {
          if (!keyword) return;
          const regex = new RegExp(keyword, 'g');
          newText = newText.replace(regex, `[${keyword}]`);
      });
      newText = newText.replace(/<</g, '<').replace(/>>/g, '>');
      setInputText(newText);
  };

  const handleSaveScript = () => {
      const newScript = parseScript(inputText);
      setScriptData(newScript);
      setLayerClips((prev) => {
          const preserved = prev.filter((clip) => !clip.id.includes("::"));
          return [...preserved, ...buildLayerClips(newScript)];
      });
      setCurrentTime(0);
      setSelectedClipIds([]);
      setIsPlaying(false);
      if (newScript.length > 0 && newScript[0].isSRT) setIsSRTMode(true);
      else setIsSRTMode(false);
      setActiveTab('storyboard'); 
  };

  const insertSRTExample = () => {
      setInputText(SRT_EXAMPLE);
      const newScript = parseScript(SRT_EXAMPLE);
      setScriptData(newScript);
      setLayerClips((prev) => {
          const preserved = prev.filter((clip) => !clip.id.includes("::"));
          return [...preserved, ...buildLayerClips(newScript)];
      });
      setCurrentTime(0);
      setSelectedClipIds([]);
      setIsPlaying(false);
      setIsSRTMode(true);
      setActiveTab('storyboard');
  };

  const handleImageSelect = (newUrl) => {
      if (editingImageIndex === null) return;
      const updated = [...scriptData];
      const targetId = updated[editingImageIndex]?.id;
      updated[editingImageIndex] = { ...updated[editingImageIndex], bgImage: newUrl };
      setScriptData(updated);
      if (targetId) {
          setLayerClips((prev) =>
              prev.map((clip) => {
                  if (!clip.id.startsWith(`${targetId}::`)) return clip;
                  return { ...clip, src: newUrl };
              })
          );
      }
      setIsMediaModalOpen(false);
  };

  const handleImageRemove = () => {
      if (editingImageIndex === null) return;
      const updated = [...scriptData];
      const targetId = updated[editingImageIndex]?.id;
      updated[editingImageIndex] = { ...updated[editingImageIndex], bgImage: null };
      setScriptData(updated);
      if (targetId) {
          setLayerClips((prev) =>
              prev.map((clip) => {
                  if (!clip.id.startsWith(`${targetId}::`)) return clip;
                  return { ...clip, src: null };
              })
          );
      }
      setIsMediaModalOpen(false);
  };

  const addImageToLibrary = (url) => {
      if (!url || isIdbRef(url)) return;
      setConfig((prev) => {
          if (prev.images.includes(url)) return prev;
          return { ...prev, images: [url, ...prev.images] };
      });
  };

  const handleLocalImages = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const newRefs: string[] = [];
      for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          const id = makeId();
          try {
              await saveLocalImageRecord({
                  id,
                  projectId,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  createdAt: Date.now(),
                  data: file,
              });
              const dataUrl = await blobToDataUrl(file);
              if (dataUrl) {
                  setLocalImageDataUrls((prev) => ({ ...prev, [id]: dataUrl }));
              }
              newRefs.push(`${IDB_REF_PREFIX}${id}`);
          } catch (error) {
              console.warn("Failed to save local image.", error);
          }
      }
      if (newRefs.length > 0) {
          setConfig((prev) => {
              const existing = new Set(prev.images);
              const uniqueRefs = newRefs.filter((ref) => !existing.has(ref));
              if (uniqueRefs.length === 0) return prev;
              return { ...prev, images: [...uniqueRefs, ...prev.images] };
          });
      }
      if (localImageInputRef.current) {
          localImageInputRef.current.value = "";
      }
  };

  const handleLocalAudios = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const newRefs: string[] = [];
      for (const file of Array.from(files)) {
          if (!file.type.startsWith("audio/")) continue;
          const id = makeId();
          let duration = 0;
          try {
              duration = await decodeAudioDuration(file);
          } catch (error) {
              console.warn("Failed to decode audio duration.", error);
          }
          const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 5;
          try {
              await saveLocalAudioRecord({
                  id,
                  projectId,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  duration: safeDuration,
                  createdAt: Date.now(),
                  data: file,
              });
              const dataUrl = await blobToDataUrl(file);
              if (dataUrl) {
                  setLocalAudioDataUrls((prev) => ({ ...prev, [id]: dataUrl }));
              }
              setLocalAudioMeta((prev) => ({ ...prev, [id]: { name: file.name, duration: safeDuration } }));
              newRefs.push(`${IDB_AUDIO_REF_PREFIX}${id}`);
          } catch (error) {
              console.warn("Failed to save local audio.", error);
          }
      }
      if (newRefs.length > 0) {
          setConfig((prev) => {
              const existing = new Set(prev.audios);
              const uniqueRefs = newRefs.filter((ref) => !existing.has(ref));
              if (uniqueRefs.length === 0) return prev;
              return { ...prev, audios: [...uniqueRefs, ...prev.audios] };
          });
      }
      if (localAudioInputRef.current) {
          localAudioInputRef.current.value = "";
      }
  };

  const addAudioClipAtTime = (ref: string, start: number) => {
      if (!ref) return;
      const duration = getAudioDuration(ref) ?? 5;
      const name = getAudioName(ref);
      const newClip: Clip = {
          id: makeId(),
          name,
          type: "audio",
          start,
          duration: Math.max(0.5, duration),
          trackId: "audio",
          src: ref,
          volume: 1,
      };
      setLayerClips((prev) => [...prev, newClip]);
  };

  const clips: Clip[] = useMemo(() => {
      const textClips = scriptData.map((item, index) => ({
          id: item.id,
          name: item.text ? item.text.slice(0, 12) : `Line ${index + 1}`,
          type: "text",
          start: item.start,
          duration: item.duration,
          src: item.text,
          trackId: item.trackId || "text",
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          scale: item.scale,
          rotation: item.rotation,
          opacity: item.opacity,
          zIndex: 80,
          subtitleStyle: item.subtitleStyle ?? DEFAULT_SUBTITLE_STYLE,
          highlightWords: item.highlight ?? [],
          sentiment: item.event === "normal" ? "neutral" : item.event ?? "neutral",
      }));

      return [...layerClips, ...textClips];
  }, [layerClips, scriptData]);

  const timelineClips = useMemo(() => {
      return clips.map((clip) => {
          if (clip.type !== "audio" || !clip.src || !isAudioRef(clip.src)) return clip;
          const resolvedSrc = resolveAudioRef(clip.src);
          return resolvedSrc ? { ...clip, src: resolvedSrc } : clip;
      });
  }, [clips, resolveAudioRef]);

  const totalDuration = useMemo(() => {
      const scriptMax = scriptData.reduce((max, item) => Math.max(max, item.start + item.duration), 0);
      const layerMax = layerClips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
      return Math.max(scriptMax, layerMax);
  }, [scriptData, layerClips]);

  const exportPresetConfig = useMemo(() => {
      return EXPORT_PRESETS.find((preset) => preset.id === exportPreset) ?? EXPORT_PRESETS[0];
  }, [exportPreset]);

  const exportClips = useMemo(() => {
      return clips.map((clip) => {
          let resolvedSrc = clip.src ?? undefined;
          if (clip.src && isIdbRef(clip.src)) {
              resolvedSrc = resolveImageRef(clip.src) ?? undefined;
          } else if (clip.src && isAudioRef(clip.src)) {
              resolvedSrc = resolveAudioRef(clip.src) ?? undefined;
          }
          return {
              ...clip,
              src: resolvedSrc,
          };
      });
  }, [clips, resolveImageRef, resolveAudioRef]);

  const exportInputProps = useMemo(() => {
      return {
          clips: exportClips,
          tracks,
          width: exportPresetConfig.width,
          height: exportPresetConfig.height,
          fps: VIDEO_FPS,
          duration: Math.max(1, totalDuration),
          bgKeywords: config.bgKeywords,
          positiveWords: config.positiveWords,
          negativeWords: config.negativeWords,
          gridDirection,
      };
  }, [exportClips, tracks, exportPresetConfig, totalDuration, config.bgKeywords, config.positiveWords, config.negativeWords, gridDirection]);

  const {
      renderMedia,
      state: renderState,
      undo: resetRender,
  } = useRendering(COMP_NAME, exportInputProps);

  const currentLineIndex = useMemo(() => {
      if (!scriptData.length) return -1;
      for (let i = 0; i < scriptData.length; i += 1) {
          const item = scriptData[i];
          if (currentTime >= item.start && currentTime < item.start + item.duration) {
              return i;
          }
      }
      if (currentTime >= totalDuration) return Math.max(0, scriptData.length - 1);
      return -1;
  }, [currentTime, scriptData, totalDuration]);

  const currentItem = currentLineIndex >= 0 ? scriptData[currentLineIndex] : null;

  const findActiveLayerClip = (trackId: string) => {
      let candidate: Clip | null = null;
      for (const clip of layerClips) {
          if (clip.trackId !== trackId) continue;
          if (currentTime >= clip.start && currentTime < clip.start + clip.duration) {
              if (!candidate || clip.start > candidate.start) {
                  candidate = clip;
              }
          }
      }
      return candidate;
  };

  const activeBackgroundClip = useMemo(() => findActiveLayerClip("background"), [layerClips, currentTime]);
  const activeCutoutClip = useMemo(() => findActiveLayerClip("cutout"), [layerClips, currentTime]);
  const activeBrollClip = useMemo(() => findActiveLayerClip("broll"), [layerClips, currentTime]);

  const effectiveMotionStyle = activeBackgroundClip?.motionStyle ?? activeMotionStyle;
  const effectiveCutoutStyle = activeCutoutClip?.visualStyle ?? activeCutoutStyle;
  const effectiveBrollStyle = activeBrollClip?.visualStyle ?? activeBrollStyle;
  const effectiveCutoutSrc = resolveImageRef(activeCutoutClip?.src ?? null);
  const effectiveBrollSrc = resolveImageRef(activeBrollClip?.src ?? null);

  const selectedClip = useMemo(() => {
      if (selectedClipIds.length > 0) {
          const clip = clips.find((c) => c.id === selectedClipIds[0]) ?? null;
          return clip && clip.type === "text" ? clip : null;
      }
      return null;
  }, [clips, selectedClipIds]);

  const selectedItem = useMemo(() => {
      if (selectedClipIds.length === 0) return null;
      return scriptData.find((item) => item.id === selectedClipIds[0]) ?? null;
  }, [scriptData, selectedClipIds]);

  const selectedLayerClip = useMemo(() => {
      if (selectedClipIds.length === 0) return null;
      return layerClips.find((clip) => clip.id === selectedClipIds[0]) ?? null;
  }, [layerClips, selectedClipIds]);

  const activeSubtitleItems = useMemo(() => {
      if (!scriptData.length) return [];
      return scriptData.filter((item) => {
          if (currentTime < item.start || currentTime >= item.start + item.duration) return false;
          const track = tracks.find((t) => t.id === (item.trackId || "text"));
          if (track?.isHidden) return false;
          return true;
      });
  }, [currentTime, scriptData, tracks]);

  const getSubtitleBoxStyle = useCallback((item: ScriptItem, index: number) => {
      const width = item.width ?? PREVIEW_WIDTH;
      const height = item.height ?? PREVIEW_HEIGHT;
      const x = item.x ?? PREVIEW_WIDTH / 2;
      const y = item.y ?? PREVIEW_HEIGHT / 2;
      const scale = item.scale ?? 1;
      const rotation = item.rotation ?? 0;
      const opacity = item.opacity ?? 1;
      return {
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
          transformOrigin: "center center",
          opacity,
          zIndex: 60 + index,
          pointerEvents: "none",
      } as React.CSSProperties;
  }, []);

  useEffect(() => {
      if (totalDuration > 0 && currentTime > totalDuration) {
          setCurrentTime(totalDuration);
      }
  }, [currentTime, totalDuration]);

  useEffect(() => {
      if (selectedLayerClip) {
          if (selectedLayerClip.trackId === "background") {
              setActiveMotionStyle(selectedLayerClip.motionStyle ?? DEFAULT_MOTION_STYLE);
          } else if (selectedLayerClip.trackId === "cutout") {
              setActiveCutoutStyle(selectedLayerClip.visualStyle ?? DEFAULT_CUTOUT_STYLE);
          } else if (selectedLayerClip.trackId === "broll") {
              setActiveBrollStyle(selectedLayerClip.visualStyle ?? DEFAULT_BROLL_STYLE);
          }
          return;
      }
      const source = selectedItem ?? currentItem;
      if (!source) return;
      setActiveSubtitleStyle(source.subtitleStyle ?? DEFAULT_SUBTITLE_STYLE);
  }, [currentItem, selectedItem, selectedLayerClip]);

  const updateCurrentItemStyles = (updates: Partial<ScriptItem>) => {
      if (selectedLayerClip) {
          setLayerClips((prev) =>
              prev.map((clip) => {
                  if (clip.id !== selectedLayerClip.id) return clip;
                  if (selectedLayerClip.trackId === "background") {
                      return { ...clip, motionStyle: updates.motionStyle ?? clip.motionStyle };
                  }
                  if (selectedLayerClip.trackId === "cutout") {
                      return { ...clip, visualStyle: updates.cutoutStyle ?? clip.visualStyle };
                  }
                  if (selectedLayerClip.trackId === "broll") {
                      return { ...clip, visualStyle: updates.brollStyle ?? clip.visualStyle };
                  }
                  return clip;
              })
          );
          return;
      }
      const targetId = selectedItem?.id ?? currentItem?.id;
      if (!targetId) return;
      setScriptData((prev) =>
          prev.map((item) => (item.id === targetId ? { ...item, ...updates } : item))
      );
  };

  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const randomizeItemStyles = (item: ScriptItem) => ({
      ...item,
      subtitleStyle: pickRandom(SUBTITLE_STYLES),
      motionStyle: item.motionStyle,
      cutoutStyle: item.cutoutStyle,
      brollStyle: item.brollStyle,
  });

  const handleShuffleAll = () => {
      setScriptData((prev) => prev.map((item) => randomizeItemStyles(item)));
      setLayerClips((prev) =>
          prev.map((clip) => {
              if (clip.trackId === "background") {
                  return { ...clip, motionStyle: pickRandom(MOTION_STYLES) };
              }
              if (clip.trackId === "cutout") {
                  return { ...clip, visualStyle: pickRandom(CUTOUT_STYLES) };
              }
              if (clip.trackId === "broll") {
                  return { ...clip, visualStyle: pickRandom(BROLL_STYLES) };
              }
              return clip;
          })
      );
  };

  const handleShuffleCurrent = () => {
      if (selectedLayerClip) {
          if (selectedLayerClip.trackId === "background") {
              updateCurrentItemStyles({ motionStyle: pickRandom(MOTION_STYLES) });
          } else if (selectedLayerClip.trackId === "cutout") {
              updateCurrentItemStyles({ cutoutStyle: pickRandom(CUTOUT_STYLES) });
          } else if (selectedLayerClip.trackId === "broll") {
              updateCurrentItemStyles({ brollStyle: pickRandom(BROLL_STYLES) });
          }
          return;
      }
      const source = selectedItem ?? currentItem;
      if (!source) return;
      updateCurrentItemStyles({ subtitleStyle: pickRandom(SUBTITLE_STYLES) });
  };

  // --- 动画循环 ---
  const requestRef = useRef();
  const animate = () => {
    if (!scriptData || scriptData.length === 0) { setIsPlaying(false); return; }
    setCurrentTime((prev) => {
        const next = prev + 1 / FPS;
        if (next > totalDuration) {
            setIsPlaying(false);
            return totalDuration;
        }
        return next;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => { 
      if (isPlaying) requestRef.current = requestAnimationFrame(animate); 
      else cancelAnimationFrame(requestRef.current); 
      return () => cancelAnimationFrame(requestRef.current); 
  }, [isPlaying, scriptData, totalDuration]);

  const handleReset = () => { setIsPlaying(false); setCurrentTime(0); };

  useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
          if (e.key !== "Delete" && e.key !== "Backspace") return;
          const target = e.target as HTMLElement | null;
          if (target) {
              const tag = target.tagName.toLowerCase();
              if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
          }
          handleDelete();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedClipIds, currentItem, layerClips, scriptData]);

  const pixelsPerSecond = 80;

  const handleSeek = (time: number) => {
      const next = Math.max(0, Math.min(time, totalDuration));
      setCurrentTime(next);
  };

  const handleClipUpdate = (clipId: string, updates: Partial<Clip>, options?: { commit?: boolean }) => {
      if (layerClips.some((clip) => clip.id === clipId)) {
          setLayerClips((prev) =>
              prev.map((clip) => {
                  if (clip.id !== clipId) return clip;
                  return {
                      ...clip,
                      ...updates,
                      start: typeof updates.start === "number" ? Math.max(0, updates.start) : clip.start,
                      duration: typeof updates.duration === "number" ? Math.max(0.1, updates.duration) : clip.duration,
                      trackId: typeof updates.trackId === "string" ? updates.trackId : clip.trackId,
                  };
              })
          );
          return;
      }
      setScriptData((prev) => {
          return prev.map((item) => {
              if (item.id !== clipId) return item;
              const { src, ...rest } = updates;
              const nextText = typeof src === "string" ? src : item.text;
              return {
                  ...item,
                  ...rest,
                  text: nextText,
                  start: typeof updates.start === "number" ? Math.max(0, updates.start) : item.start,
                  duration: typeof updates.duration === "number" ? Math.max(0.1, updates.duration) : item.duration,
                  trackId: typeof updates.trackId === "string" ? updates.trackId : item.trackId,
              };
          });
      });
  };

  const handleClipsUpdate = (updates: Array<{ id: string; updates: Partial<Clip> }>, options?: { commit?: boolean }) => {
      const layerIds = new Set(layerClips.map((clip) => clip.id));
      const layerUpdates = updates.filter((entry) => layerIds.has(entry.id));
      const textUpdates = updates.filter((entry) => !layerIds.has(entry.id));

      if (layerUpdates.length > 0) {
          setLayerClips((prev) =>
              prev.map((clip) => {
                  const match = layerUpdates.find((entry) => entry.id === clip.id);
                  if (!match) return clip;
                  const next = match.updates;
                  return {
                      ...clip,
                      ...next,
                      start: typeof next.start === "number" ? Math.max(0, next.start) : clip.start,
                      duration: typeof next.duration === "number" ? Math.max(0.1, next.duration) : clip.duration,
                      trackId: typeof next.trackId === "string" ? next.trackId : clip.trackId,
                  };
              })
          );
      }

      if (textUpdates.length > 0) {
          setScriptData((prev) => {
              return prev.map((item) => {
                  const match = textUpdates.find((entry) => entry.id === item.id);
                  if (!match) return item;
                  const next = match.updates;
                  const { src, ...rest } = next;
                  const nextText = typeof src === "string" ? src : item.text;
                  return {
                      ...item,
                      ...rest,
                      text: nextText,
                      start: typeof next.start === "number" ? Math.max(0, next.start) : item.start,
                      duration: typeof next.duration === "number" ? Math.max(0.1, next.duration) : item.duration,
                      trackId: typeof next.trackId === "string" ? next.trackId : item.trackId,
                  };
              });
          });
      }
  };

  const handleSelectClip = (clipId: string | null, event?: React.PointerEvent) => {
      if (!clipId) {
          setSelectedClipIds([]);
          return;
      }
      // Removed auto-seek behavior (setCurrentTime) on select as it was jarring for users
      
      const isMulti = event?.shiftKey || event?.metaKey || event?.ctrlKey;
      if (!isMulti) {
          setSelectedClipIds([clipId]);
          return;
      }
      setSelectedClipIds((prev) => {
          if (prev.includes(clipId)) {
              return prev.filter((id) => id !== clipId);
          }
          return [...prev, clipId];
      });
  };

  const handleAddTrack = () => {
      const newTrack: Track = {
          id: `track_${Date.now()}`,
          label: `轨道 ${tracks.length + 1}`,
          type: "text",
      };
      setTracks((prev) => [...prev, newTrack]);
  };

  const handleTrackUpdate = (trackId: string, updates: Partial<Track>) => {
      setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track)));
  };

  const handleSplit = () => {
      const targetId = selectedClipIds[0] ?? currentItem?.id;
      if (!targetId) return;
      let newId: string | null = null;
      setScriptData((prev) => {
          const index = prev.findIndex((item) => item.id === targetId);
          if (index === -1) return prev;
          const item = prev[index];
          const splitTime = Math.min(Math.max(currentTime, item.start), item.start + item.duration);
          if (splitTime <= item.start || splitTime >= item.start + item.duration) return prev;
          newId = makeId();
          const first = { ...item, duration: splitTime - item.start };
          const second = { ...item, id: newId, start: splitTime, duration: item.start + item.duration - splitTime };
          const next = [...prev];
          next.splice(index, 1, first, second);
          return next;
      });
      if (newId) {
          setSelectedClipIds([newId]);
      }
  };

  const handleDuplicate = () => {
      const targetId = selectedClipIds[0] ?? currentItem?.id;
      if (!targetId) return;
      let newId: string | null = null;
      setScriptData((prev) => {
          const index = prev.findIndex((item) => item.id === targetId);
          if (index === -1) return prev;
          const item = prev[index];
          newId = makeId();
          const duplicate = { ...item, id: newId, start: item.start + item.duration };
          const next = [...prev];
          next.splice(index + 1, 0, duplicate);
          return next;
      });
      if (newId) {
          setSelectedClipIds([newId]);
      }
  };

  const handleDelete = (clipId?: string) => {
      const idsToDelete = clipId
          ? [clipId]
          : (selectedClipIds.length > 0 ? selectedClipIds : (currentItem ? [currentItem.id] : []));
      if (idsToDelete.length === 0) return;
      const layerIdSet = new Set(layerClips.map((clip) => clip.id));
      const layerIds = idsToDelete.filter((id) => layerIdSet.has(id));
      const textIds = idsToDelete.filter((id) => !layerIdSet.has(id));
      if (layerIds.length > 0) {
          setLayerClips((prev) => prev.filter((clip) => !layerIds.includes(clip.id)));
      }
      if (textIds.length > 0) {
          setScriptData((prev) => prev.filter((item) => !textIds.includes(item.id)));
      }
      setSelectedClipIds([]);
  };

  const handleMarkerAdd = (time: number) => {
      const id = `marker_${Date.now()}`;
      setMarkers((prev) => [...prev, { id, time }]);
      setSelectedMarkerId(id);
  };

  const handleMarkerSelect = (markerId: string | null) => {
      setSelectedMarkerId(markerId);
  };

  const handleDropClip = (data: { type: Clip["type"]; src?: string; options?: Partial<Clip> }, trackId: string, time: number) => {
      const duration = 2;
      const layerZIndex = trackId === "background" ? 0 : trackId === "broll" ? 10 : trackId === "cutout" ? 20 : 0;
      if (trackId === "text") {
          const text = data.src ?? "新字幕";
          const newItem: ScriptItem = {
              id: makeId(),
              text,
              duration,
              start: time,
              highlight: [],
              event: "normal",
              bgImage: null,
              isSRT: false,
              x: PREVIEW_WIDTH / 2,
              y: PREVIEW_HEIGHT / 2,
              width: Math.round(PREVIEW_WIDTH * 0.9),
              height: Math.round(PREVIEW_HEIGHT * 0.6),
              scale: 1,
              rotation: 0,
              opacity: 1,
              trackId,
              subtitleStyle: data.options?.subtitleStyle ?? activeSubtitleStyle,
              motionStyle: data.options?.motionStyle ?? activeMotionStyle,
              cutoutStyle: data.options?.cutoutStyle ?? activeCutoutStyle,
              brollStyle: data.options?.brollStyle ?? activeBrollStyle,
          };
          setScriptData((prev) => [...prev, newItem]);
          return;
      }

      if (trackId === "background") {
          const newClip: Clip = {
              id: makeId(),
              name: "动态背景",
              type: "background",
              start: time,
              duration,
              trackId,
              zIndex: layerZIndex,
              motionStyle: data.options?.motionStyle ?? activeMotionStyle,
          };
          setLayerClips((prev) => [...prev, newClip]);
          return;
      }

      if (trackId === "cutout") {
          const newClip: Clip = {
              id: makeId(),
              name: "抠像",
              type: "image",
              start: time,
              duration,
              trackId,
              zIndex: layerZIndex,
              visualStyle: data.options?.visualStyle ?? activeCutoutStyle,
              src: data.src ?? config.images[0] ?? null,
          };
          setLayerClips((prev) => [...prev, newClip]);
          return;
      }

      if (trackId === "broll") {
          const newClip: Clip = {
              id: makeId(),
              name: "空镜",
              type: "image",
              start: time,
              duration,
              trackId,
              zIndex: layerZIndex,
              visualStyle: data.options?.visualStyle ?? activeBrollStyle,
              src: data.src ?? config.images[0] ?? null,
          };
          setLayerClips((prev) => [...prev, newClip]);
          return;
      }

      if (trackId === "audio") {
          const src = data.src ?? "";
          if (!src) return;
          const clipDuration = typeof data.options?.duration === "number" ? data.options.duration : undefined;
          const clipName = typeof data.options?.name === "string" ? data.options.name : getAudioName(src);
          const newClip: Clip = {
              id: makeId(),
              name: clipName,
              type: "audio",
              start: time,
              duration: Math.max(0.5, clipDuration ?? getAudioDuration(src) ?? 5),
              trackId,
              src,
              volume: 1,
          };
          setLayerClips((prev) => [...prev, newClip]);
      }
  };

  const handleAddResourceClip = useCallback(
      (type: Clip["type"], trackId: string, src?: string, options?: Partial<Clip>) => {
          handleDropClip({ type, src, options }, trackId, currentTime);
      },
      [currentTime, handleDropClip]
  );
  
  return (
    <div className="h-screen w-screen flex overflow-hidden transition-colors duration-200" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=VT323&display=swap');
        .font-handwriting { font-family: 'Caveat', cursive; }
        .font-digital { font-family: 'VT323', monospace; }
        .storyboard-scroll::-webkit-scrollbar { width: 4px; }
        .storyboard-scroll::-webkit-scrollbar-track { background: transparent; }
        .storyboard-scroll::-webkit-scrollbar-thumb { background: ${themeMode === 'dark' ? '#393b40' : '#d1d5db'}; border-radius: 2px; }
        .storyboard-scroll::-webkit-scrollbar-thumb:hover { background: ${themeMode === 'dark' ? '#4e5157' : '#9ca3af'}; }
        
        /* Custom inputs for theme */
        .theme-input { background-color: ${theme.inputBg}; border-color: ${theme.border}; color: ${theme.text}; }
        .theme-input:focus { border-color: ${theme.accent}; }
        .theme-button { background-color: ${theme.buttonBg}; border: 1px solid ${theme.border}; color: ${theme.text}; }
        .theme-button:hover { background-color: ${theme.buttonHover}; }
      `}</style>

      {/* 弹窗：素材选择器 */}
      <MediaPickerModal 
          isOpen={isMediaModalOpen} 
          onClose={() => setIsMediaModalOpen(false)}
          images={mediaItems}
          onSelect={handleImageSelect}
          onAddImage={addImageToLibrary}
          onRemove={handleImageRemove}
      />

      {/* 左侧：预览区 (占据左侧) */}
      <div 
        className="w-1/3 min-w-[400px] h-full flex items-center justify-center relative p-4 border-r transition-colors duration-200"
        style={{ backgroundColor: theme.mode === 'dark' ? '#18191b' : '#e0e0e0', borderColor: theme.border }}
      >
          <div className="relative w-[360px] h-[640px] shrink-0 rounded-[20px] overflow-hidden shadow-2xl border-[8px] bg-black ring-1 ring-gray-900/10" style={{ borderColor: theme.mode === 'dark' ? '#000' : '#333' }}>
                {activeBackgroundClip && (
                    <MotionARoll style={effectiveMotionStyle} activeText={currentItem?.text} isPlaying={isPlaying} bgKeywords={config.bgKeywords} gridDirection={gridDirection} />
                )}
                {activeBrollClip && (
                    <div className="absolute inset-0 z-10">
                        <BRollLayer 
                            key={`${currentLineIndex}-broll-${effectiveBrollStyle}-${effectiveBrollSrc}`}
                            src={effectiveBrollSrc} 
                            event={currentItem?.event} 
                            isActive={true} 
                            style={effectiveBrollStyle} 
                        />
                    </div>
                )}
                {activeCutoutClip && (
                    <div className="absolute inset-0 z-20">
                        <BRollLayer 
                            key={`${currentLineIndex}-cutout-${effectiveCutoutStyle}-${effectiveCutoutSrc}`}
                            src={effectiveCutoutSrc} 
                            event={currentItem?.event} 
                            isActive={true} 
                            style={effectiveCutoutStyle} 
                        />
                    </div>
                )}
                {activeSubtitleItems.map((item, index) => {
                    const frame = Math.max(0, Math.floor((currentTime - item.start) * FPS));
                    const subtitleStyle = item.subtitleStyle ?? activeSubtitleStyle;
                    return (
                        <div key={item.id} style={getSubtitleBoxStyle(item, index)}>
                            {subtitleStyle === 'focus' && <FocusText text={item.text} frame={frame} highlightWords={item.highlight ?? []} event={item.event} getSentiment={getWordSentiment} />}
                            {subtitleStyle === 'kinetic' && <KineticText text={item.text} frame={frame} highlightWords={item.highlight ?? []} event={item.event} getSentiment={getWordSentiment} />}
                            {subtitleStyle === 'scrapbook' && <ScrapbookText text={item.text} frame={frame} highlightWords={item.highlight ?? []} event={item.event} getSentiment={getWordSentiment} />}
                            {subtitleStyle === 'bubble' && <BubbleText text={item.text} frame={frame} highlightWords={item.highlight ?? []} event={item.event} getSentiment={getWordSentiment} />}
                            {subtitleStyle === 'impact' && <ImpactText text={item.text} frame={frame} highlightWords={item.highlight ?? []} event={item.event} getSentiment={getWordSentiment} />}
                            {subtitleStyle === 'minimal' && <MinimalText text={item.text} frame={frame} highlightWords={item.highlight ?? []} event={item.event} getSentiment={getWordSentiment} />}
                        </div>
                    );
                })}
                <PreviewOverlay
                    clip={selectedClip}
                    projectWidth={PREVIEW_WIDTH}
                    projectHeight={PREVIEW_HEIGHT}
                    containerWidth={PREVIEW_WIDTH}
                    containerHeight={PREVIEW_HEIGHT}
                    onUpdate={handleClipUpdate}
                />
          </div>
          
          {/* 播放控制条 */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full border shadow-xl z-50 backdrop-blur-md"
            style={{ 
                backgroundColor: theme.mode === 'dark' ? 'rgba(43, 45, 48, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                borderColor: theme.border 
            }}
          >
               <button onClick={() => setIsPlaying(!isPlaying)} style={{ color: theme.text }} className="hover:text-amber-500 transition-colors">
                   {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
               </button>
               <div className="w-px h-4" style={{ backgroundColor: theme.border }}></div>
               <button onClick={handleReset} style={{ color: theme.textSecondary }} className="hover:text-current transition-colors"><RefreshCw size={16} /></button>
               <span className="text-xs font-mono min-w-[40px] text-center" style={{ color: theme.textSecondary }}>{currentLineIndex >= 0 ? currentLineIndex + 1 : 0}/{scriptData?.length || 0}</span>
          </div>
      </div>

      {/* 右侧：操作区 (上下布局) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors duration-200" style={{ backgroundColor: theme.bg }}>
           
           {/* 右上：控制面板 */}
           <div className="h-[60%] flex flex-col p-4 overflow-hidden border-b transition-colors duration-200" style={{ borderColor: theme.border }}>
               {/* 顶部标签页 & 主题切换 */}
               <div className="flex justify-between items-center mb-4 shrink-0 gap-4">
                   <div className="flex flex-1 rounded-xl p-1 shadow-sm border transition-colors" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
                       {['editor', 'storyboard', 'style', 'settings', 'resources'].map(tab => (
                           <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)} 
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === tab ? 'shadow' : 'hover:bg-opacity-80'}`}
                                style={{ 
                                    backgroundColor: activeTab === tab ? (theme.mode === 'dark' ? '#4e5157' : '#e5e7eb') : 'transparent',
                                    color: activeTab === tab ? theme.text : theme.textSecondary 
                                }}
                           >
                               {tab === 'editor' && "1. 脚本"}
                               {tab === 'storyboard' && "2. 分镜"}
                               {tab === 'style' && "3. 风格"}
                               {tab === 'settings' && "4. 配置"}
                               {tab === 'resources' && "5. 资源"}
                           </button>
                       ))}
                   </div>
                   
                   {/* Theme Toggle */}
                   <button 
                       onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
                       className="p-2 rounded-xl border shadow-sm transition-all hover:scale-105"
                       style={{ backgroundColor: theme.panelBg, borderColor: theme.border, color: theme.text }}
                       title={themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                   >
                       {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                   </button>
               </div>

               {/* 内容区域 */}
               <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
                   {/* 1. 脚本编辑器 */}
                   {activeTab === 'editor' && (
                       <div className="flex-1 flex flex-col rounded-xl border overflow-hidden shadow-sm h-full transition-colors" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
                           <div className="p-3 border-b flex flex-wrap justify-between items-center gap-2 shrink-0 transition-colors" style={{ borderColor: theme.border, backgroundColor: theme.mode === 'dark' ? '#252629' : '#f9fafb' }}>
                               <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.textSecondary }}>
                                   脚本内容 
                                   {isSRTMode && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold">SRT模式</span>}
                               </h2>
                               <div className="flex gap-2">
                                   <button onClick={autoTagKeywords} className="px-2 py-1.5 rounded-md font-bold text-[10px] flex items-center gap-1 border transition-colors theme-button"><Wand2 size={10}/> 自动标注</button>
                                   <button onClick={insertSRTExample} className="p-1.5 rounded flex items-center gap-1 text-[10px] theme-button"><Clock size={12}/> SRT</button>
                               </div>
                           </div>
                           <textarea 
                                className="flex-1 w-full p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none transition-colors"
                                style={{ backgroundColor: theme.panelBg, color: theme.text }}
                                placeholder="在此输入普通文本或 SRT 字幕..." 
                                value={inputText} 
                                onChange={(e) => setInputText(e.target.value)} 
                           />
                           <div className="p-4 border-t shrink-0 transition-colors" style={{ borderColor: theme.border, backgroundColor: theme.mode === 'dark' ? '#252629' : '#f9fafb' }}>
                               <button onClick={handleSaveScript} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2"><Save size={16} /> 保存并去分镜</button>
                           </div>
                       </div>
                   )}

                   {/* 2. 分镜 (Storyboard) */}
                   {activeTab === 'storyboard' && (
                       <div className="flex-1 flex flex-col rounded-xl border overflow-hidden shadow-sm h-full transition-colors" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
                           <div className="p-3 border-b flex justify-between items-center shrink-0 transition-colors" style={{ borderColor: theme.border, backgroundColor: theme.mode === 'dark' ? '#252629' : '#f9fafb' }}>
                               <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.textSecondary }}><FilmIcon size={14}/> 视觉排期</h2>
                               <span className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: theme.bg, color: theme.textSecondary }}>点击图片更换 / 移除</span>
                           </div>
                           <div className="flex-1 overflow-y-auto storyboard-scroll p-2 space-y-2">
                               {scriptData.length === 0 && <div className="text-center py-10 text-xs" style={{ color: theme.textSecondary }}>请先在“脚本”页输入内容并保存。</div>}
                               {scriptData.map((item, index) => {
                                   const resolvedBg = resolveImageRef(item.bgImage ?? null);
                                   const hasImage = !!resolvedBg;
                                   const isActive = index === currentLineIndex && isPlaying;
                                   return (
                                       <div key={index} 
                                            className="flex gap-3 p-2 rounded-lg border transition-all relative"
                                            style={{
                                                backgroundColor: isActive ? (theme.mode === 'dark' ? '#2c241b' : '#fffbeb') : theme.panelBg,
                                                borderColor: isActive ? '#f59e0b' : theme.border 
                                            }}
                                        >
                                           <div className="flex flex-col gap-1 w-[60px] shrink-0 items-center">
                                               <div className="text-[10px] font-mono" style={{ color: theme.textSecondary }}>#{index + 1}</div>
                                               <div 
                                                    className="relative aspect-[9/16] rounded overflow-hidden group cursor-pointer border transition-all w-full"
                                                    style={{ borderColor: theme.border }}
                                                    onClick={() => {
                                                        setEditingImageIndex(index);
                                                        setIsMediaModalOpen(true);
                                                    }}
                                               >
                                                   {hasImage ? (
                                                       <img src={resolvedBg ?? undefined} className="w-full h-full object-cover" alt="thumb" onError={(e) => e.target.src='https://placehold.co/600x800/EEE/31343C?text=No+Image'}/>
                                                   ) : (
                                                       <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
                                                           <ImageOff size={16} style={{ color: theme.textSecondary }} />
                                                       </div>
                                                   )}
                                                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <Settings size={16} className="text-white"/>
                                                   </div>
                                               </div>
                                           </div>
                                           <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                               <div className="text-xs font-bold line-clamp-2 leading-relaxed" style={{ color: theme.text }} title={item.text}>{item.text}</div>
                                               <div className="flex items-center justify-between mt-2">
                                                   <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.bg, color: theme.textSecondary }}>{Math.round(item.duration * 10) / 10}s</span>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       </div>
                   )}

                   {/* 3. 风格面板 */}
                   {activeTab === 'style' && (
                       <div className="flex-1 flex flex-col rounded-xl border overflow-hidden shadow-sm h-full transition-colors" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
                           <div className="p-3 shrink-0 border-b transition-colors" style={{ borderColor: theme.border, backgroundColor: theme.mode === 'dark' ? '#252629' : '#f9fafb' }}>
                                <div className="flex gap-2">
                                    <button onClick={handleShuffleCurrent} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border font-bold transition-all text-xs theme-button">
                                        <Dices size={14} /> 换个风格
                                    </button>
                                    <button onClick={handleShuffleAll} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border font-bold transition-all text-xs theme-button">
                                        <Shuffle size={14} /> 随机生成
                                    </button>
                                </div>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4 space-y-6 storyboard-scroll">
                                {/* A-Roll */}
                                <div className="space-y-3"><h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.textSecondary }}><Move size={14} /> 动态背景</h2><div className="grid grid-cols-3 gap-2">{[{id:'grid', icon:Grid, label:'网格'}, {id:'velocity', icon:Type, label:'急速'}, {id:'curve', icon:CircleDashed, label:'环绕'}, {id:'dots', icon:Target, label:'点阵'}, {id:'plus', icon:Plus, label:'加号'}, {id:'cross', icon:X, label:'叉号'}].map(s => (<button key={s.id} onClick={() => { setActiveMotionStyle(s.id); updateCurrentItemStyles({ motionStyle: s.id }); }} className="p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border" style={{ backgroundColor: activeMotionStyle === s.id ? (theme.mode === 'dark' ? '#3574f0' : '#e0e7ff') : theme.buttonBg, borderColor: theme.border, color: activeMotionStyle === s.id ? (theme.mode === 'dark' ? '#fff' : '#4338ca') : theme.textSecondary }}><s.icon size={18}/> <span className="text-[10px] font-bold">{s.label}</span></button>))}
                                </div>
                                {activeMotionStyle === 'grid' && (
                                    <div className="flex gap-2 mt-2 p-2 rounded-lg transition-colors" style={{ backgroundColor: theme.bg }}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider self-center" style={{ color: theme.textSecondary }}>方向:</span>
                                        <button onClick={() => setGridDirection('forward')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 theme-button ${gridDirection === 'forward' ? 'opacity-100' : 'opacity-50'}`}><ChevronDown size={12}/> 前进</button>
                                        <button onClick={() => setGridDirection('backward')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 theme-button ${gridDirection === 'backward' ? 'opacity-100' : 'opacity-50'}`}><ChevronUp size={12}/> 后退</button>
                                    </div>
                                )}
                                </div>
                                {/* Subtitle */}
                                <div className="space-y-3"><h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.textSecondary }}><Type size={14} /> 字幕风格</h2><div className="grid grid-cols-3 gap-2">{[{id:'focus', label:'聚焦'}, {id:'kinetic', label:'动力'}, {id:'scrapbook', label:'手账'}, {id:'bubble', label:'气泡'}, {id:'impact', label:'冲击'}, {id:'minimal', label:'极简'}].map(style => (<button key={style.id} onClick={() => { setActiveSubtitleStyle(style.id); updateCurrentItemStyles({ subtitleStyle: style.id }); }} className="p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border" style={{ backgroundColor: activeSubtitleStyle === style.id ? theme.text : theme.buttonBg, color: activeSubtitleStyle === style.id ? theme.panelBg : theme.textSecondary, borderColor: theme.border }}>{style.label}</button>))}
                                </div></div>
                                {/* Cutout */}
                                <div className="space-y-3"><h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#f59e0b' }}><Scissors size={14} /> 抠像工厂</h2><div className="grid grid-cols-3 gap-2">{[{id:'cutout-neo', icon:Box, label:'新潮'}, {id:'cutout-film', icon:FilmIcon, label:'胶卷'}, {id:'cutout-paper', icon:Sticker, label:'贴纸'}, {id:'cutout-float', icon:Sparkles, label:'悬浮'}, {id:'cutout-doodle', icon:PenTool, label:'涂鸦'}, {id:'cutout-glass', icon:LayoutTemplate, label:'玻璃'}].map(s => (<button key={s.id} onClick={() => { setActiveCutoutStyle(s.id); updateCurrentItemStyles({ cutoutStyle: s.id }); }} className="p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border" style={{ backgroundColor: activeCutoutStyle === s.id ? (theme.mode === 'dark' ? '#453210' : '#fffbeb') : theme.buttonBg, color: activeCutoutStyle === s.id ? '#f59e0b' : theme.textSecondary, borderColor: theme.border }}><s.icon size={18}/> <span className="text-[10px] font-bold">{s.label}</span></button>))}
                                </div></div>
                                {/* B-Roll */}
                                <div className="space-y-3"><h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.textSecondary }}><Film size={14} /> 空镜样式</h2><div className="grid grid-cols-2 gap-2">{[{ id: 'scrapbook', label: '情绪板', desc: '手账/胶带/便签' }, { id: 'vogue', label: '杂志风', desc: '杂志/条码/排版' }, { id: 'bubble', label: '组件', desc: '玻璃拟态/悬浮' }, { id: 'dv', label: '老式 DV', desc: '全屏覆盖' }, { id: 'ccd', label: 'CCD 复古', desc: '全屏覆盖' }, { id: 'y2k', label: 'Y2K 辣妹', desc: '全屏覆盖' }, { id: 'soft', label: '柔光清透', desc: '全屏覆盖' }, { id: 'impact', label: '红色警示', desc: '全屏覆盖' }].map(style => (<button key={style.id} onClick={() => { setActiveBrollStyle(style.id); updateCurrentItemStyles({ brollStyle: style.id }); }} className="p-3 rounded-lg text-left transition-all border group" style={{ backgroundColor: activeBrollStyle === style.id ? (theme.mode === 'dark' ? '#2e1f3d' : '#f3e8ff') : theme.buttonBg, borderColor: activeBrollStyle === style.id ? '#9333ea' : theme.border }}><div className="text-xs font-bold mb-0.5" style={{ color: activeBrollStyle === style.id ? '#a855f7' : theme.text }}>{style.label}</div><div className="text-[9px]" style={{ color: theme.textSecondary }}>{style.desc}</div></button>))}
                                </div></div>
                           </div>
                       </div>
                   )}

                   {/* 4. 全局配置 */}
                   {activeTab === 'settings' && (
                       <div className="flex-1 flex flex-col rounded-xl border overflow-hidden shadow-sm h-full transition-colors" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
                           <div className="flex-1 overflow-y-auto p-4 space-y-6 storyboard-scroll">
                               {/* 背景词 */}
                               <div className="space-y-2">
                                   <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.text }}><Move size={14}/> 背景滚动词 (逗号分隔)</h3>
                                   <textarea 
                                       className="w-full p-3 rounded-lg text-xs font-mono outline-none h-20 resize-none theme-input"
                                       value={config.bgKeywords.join(', ')}
                                       onChange={(e) => setConfig({...config, bgKeywords: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)})
                                       }
                                       placeholder="例如: 科技, AI, 未来..."
                                   />
                               </div>

                               {/* 关键词配置 */}
                               <div className="space-y-2">
                                   <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2"><ThumbsUp size={14}/> 正向高亮词 (自动标橙)</h3>
                                   <textarea 
                                       className="w-full p-3 rounded-lg text-xs font-mono outline-none h-24 resize-none theme-input"
                                       style={{ borderColor: '#f59e0b', backgroundColor: theme.mode === 'dark' ? '#2e2315' : '#fffbeb' }}
                                       value={config.positiveWords.join(', ')}
                                       onChange={(e) => setConfig({...config, positiveWords: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)})
                                       }
                                       placeholder="例如: 成功, 突破, 增长..."
                                   />
                               </div>

                               <div className="space-y-2">
                                   <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2"><AlertCircle size={14}/> 负向/警示词 (自动标红)</h3>
                                   <textarea 
                                       className="w-full p-3 rounded-lg text-xs font-mono outline-none h-24 resize-none theme-input"
                                       style={{ borderColor: '#f43f5e', backgroundColor: theme.mode === 'dark' ? '#2e151b' : '#fff1f2' }}
                                       value={config.negativeWords.join(', ')}
                                       onChange={(e) => setConfig({...config, negativeWords: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)})
                                       }
                                       placeholder="例如: 失败, 风险, 下跌..."
                                   />
                               </div>

                               {/* 图片素材 */}
                               <div className="space-y-2">
                                   <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#6366f1' }}><ImageIcon size={14}/> 素材库 (选图时会显示在这里)</h3>
                                   <textarea 
                                       className="w-full p-3 rounded-lg text-xs font-mono outline-none h-40 resize-none whitespace-pre theme-input"
                                       style={{ borderColor: '#6366f1' }}
                                       value={remoteImagesValue}
                                       onChange={(e) => {
                                           const nextUrls = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                                           setConfig((prev) => ({
                                               ...prev,
                                               images: [...prev.images.filter((img) => isIdbRef(img)), ...nextUrls],
                                           }));
                                       }}
                                       placeholder="https://example.com/image1.jpg..."
                                   />
                                   <div className="flex flex-wrap items-center gap-2">
                                       <input
                                           ref={localImageInputRef}
                                           type="file"
                                           accept="image/*"
                                           multiple
                                           className="hidden"
                                           onChange={(e) => handleLocalImages(e.currentTarget.files)}
                                       />
                                       <button
                                           type="button"
                                           onClick={() => localImageInputRef.current?.click()}
                                           className="px-3 py-2 rounded-lg text-[10px] font-bold transition-all border"
                                           style={{ backgroundColor: theme.buttonBg, color: theme.textSecondary, borderColor: theme.border }}
                                       >
                                           添加本地图片
                                       </button>
                                       <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                                           本地图片将存到浏览器，过大可能无法保存
                                       </span>
                                   </div>
                               </div>

                               {/* 音频素材 */}
                               <div className="space-y-2">
                                   <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#10b981' }}><Music size={14}/> 音频素材库 (拖拽到音频轨)</h3>
                                   <textarea
                                       className="w-full p-3 rounded-lg text-xs font-mono outline-none h-28 resize-none whitespace-pre theme-input"
                                       style={{ borderColor: '#10b981' }}
                                       value={remoteAudiosValue}
                                       onChange={(e) => {
                                           const nextUrls = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                                           setConfig((prev) => ({
                                               ...prev,
                                               audios: [...prev.audios.filter((audio) => isAudioRef(audio)), ...nextUrls],
                                           }));
                                       }}
                                       placeholder="https://example.com/audio.mp3..."
                                   />
                                   <div className="flex flex-wrap items-center gap-2">
                                       <input
                                           ref={localAudioInputRef}
                                           type="file"
                                           accept="audio/*"
                                           multiple
                                           className="hidden"
                                           onChange={(e) => handleLocalAudios(e.currentTarget.files)}
                                       />
                                       <button
                                           type="button"
                                           onClick={() => localAudioInputRef.current?.click()}
                                           className="px-3 py-2 rounded-lg text-[10px] font-bold transition-all border"
                                           style={{ backgroundColor: theme.buttonBg, color: theme.textSecondary, borderColor: theme.border }}
                                       >
                                           添加本地音频
                                       </button>
                                       <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                                           音频保存到 IndexedDB，可拖拽到时间线
                                       </span>
                                   </div>

                                   <div className="space-y-2">
                                       {audioItems.length === 0 && (
                                           <div className="text-[10px]" style={{ color: theme.textSecondary }}>
                                               暂无音频素材
                                           </div>
                                       )}
                                       {audioItems.map((item) => (
                                           <div
                                               key={item.ref}
                                               draggable
                                               onDragStart={(e) => {
                                                   e.dataTransfer.setData(
                                                       "application/x-editor-clip",
                                                       JSON.stringify({
                                                           type: "audio",
                                                           src: item.ref,
                                                           options: { duration: item.duration, name: item.name },
                                                       })
                                                   );
                                               }}
                                               className="flex items-center gap-2 p-2 rounded-lg border text-[10px] transition-all"
                                               style={{ borderColor: theme.border, backgroundColor: theme.buttonBg }}
                                           >
                                               <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: theme.mode === 'dark' ? '#0f2f25' : '#ecfdf5', color: '#10b981' }}>
                                                   <Music size={12} />
                                               </div>
                                               <div className="flex-1 min-w-0">
                                                   <div className="font-bold truncate" style={{ color: theme.text }}>{item.name}</div>
                                                   <div className="text-[9px]" style={{ color: theme.textSecondary }}>
                                                       {formatDuration(item.duration)} {item.isLocal ? "· 本地" : ""}
                                                   </div>
                                               </div>
                                               <button
                                                   type="button"
                                                   onClick={() => addAudioClipAtTime(item.ref, currentTime)}
                                                   className="px-2 py-1 rounded border text-[9px] font-bold"
                                                   style={{ borderColor: theme.border, color: theme.textSecondary }}
                                               >
                                                   添加
                                               </button>
                                           </div>
                                       ))}
                                   </div>
                               </div>

                               {/* 导出 */}
                               <div className="space-y-2">
                                   <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.text }}><Video size={14}/> 导出</h3>
                                   <div className="grid grid-cols-3 gap-2">
                                       {EXPORT_PRESETS.map((preset) => (
                                           <button
                                               key={preset.id}
                                               onClick={() => setExportPreset(preset.id)}
                                               className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all border`}
                                               style={{ 
                                                   backgroundColor: exportPreset === preset.id ? theme.text : theme.bg,
                                                   color: exportPreset === preset.id ? theme.bg : theme.textSecondary,
                                                   borderColor: theme.border
                                               }}
                                           >
                                               {preset.label}
                                           </button>
                                       ))}
                                   </div>
                                   <button
                                       onClick={renderMedia}
                                       disabled={renderState.status === "invoking" || exportClips.length === 0}
                                       className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${renderState.status === "invoking" ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                                       style={{ backgroundColor: theme.text, color: theme.bg }}
                                   >
                                       {renderState.status === "invoking" ? "渲染中..." : "导出视频"}
                                   </button>
                                   {renderState.status === "error" && (
                                       <div className="text-[10px] text-red-500">
                                           {renderState.error.message}
                                       </div>
                                   )}
                                   {renderState.status === "done" && (
                                       <div className="flex items-center justify-between text-[10px]" style={{ color: theme.textSecondary }}>
                                           <a className="text-blue-500 hover:underline" href={renderState.url} download>
                                               下载成品
                                           </a>
                                           <button onClick={resetRender} className="hover:text-current">
                                               重新导出
                                           </button>
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>
                   )}

                   {/* 5. 资源 (Resources) */}
                   {activeTab === 'resources' && (
                       <div className="flex-1 rounded-xl border overflow-hidden shadow-sm h-full transition-colors" style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}>
                           <ResourcesPanel onAddClip={handleAddResourceClip} />
                       </div>
                   )}
               </div>
           </div>

           {/* 右下：Timeline - 占据剩余空间 */}
           <div className="flex-1 border-t overflow-hidden flex flex-col transition-colors duration-200" style={{ borderColor: theme.border, backgroundColor: theme.trackBg }}>
                <Timeline
                    tracks={tracks}
                    clips={timelineClips}
                    duration={Math.max(totalDuration, 1)}
                    currentTime={currentTime}
                    selectedClipIds={selectedClipIds}
                    markers={markers}
                    selectedMarkerId={selectedMarkerId}
                    pixelsPerSecond={pixelsPerSecond}
                    colors={theme}
                    onSeek={handleSeek}
                    onClipUpdate={handleClipUpdate}
                    onClipsUpdate={handleClipsUpdate}
                    onAddTrack={handleAddTrack}
                    onSelectClip={handleSelectClip}
                    onTrackUpdate={handleTrackUpdate}
                    onSplit={handleSplit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onMarkerAdd={handleMarkerAdd}
                    onMarkerSelect={handleMarkerSelect}
                    onDropClip={handleDropClip}
                />
           </div>
      </div>
    </div>
  );
}
