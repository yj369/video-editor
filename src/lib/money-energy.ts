export const NEGATIVE_KEYWORDS = ['漏', '损耗', '存不住', '轻视', '过期', '废弃', '忽略', '叹气', '抱怨', '掏空', '心疼', '智商税', '陷阱', '伪勤奋', '没做成', '忙', '团团转', '暗漏', '关不紧', '大主见', '贪小利', '错失', '强撑', '面子'];
export const POSITIVE_KEYWORDS = ['财库', '开源', '变富', '财神', '新财', '丰盛', '福气', '越来越富', '磁场', '财富', '能量', '高手', '心流', '聚焦', '刀刃', '配得感', '禄勋', '气场', '通透', '稳住'];

export const THEME_CONFIG = {
    primaryColor: "text-amber-500", 
    primaryBg: "bg-amber-500",
    accentColor: "text-rose-600", 
    accentBg: "bg-rose-500",
    neutralColor: "text-indigo-600",
    neutralBg: "bg-indigo-500",
    keywords: ["搞钱", "能量", "发财", "暴富", "上岸", "财运", "搞钱", "能量"], 
};

export const getWordSentiment = (word: string, clipEvent?: string) => {
    if (!word) return 'neutral';
    if (NEGATIVE_KEYWORDS.some(k => word.includes(k))) return 'negative';
    if (POSITIVE_KEYWORDS.some(k => word.includes(k))) return 'positive';
    if (clipEvent === 'intro') return 'positive'; 
    return 'neutral'; 
};

export const analyzeText = (text: string) => {
    const highlights: string[] = [];
    let sentiment: "positive" | "negative" | "neutral" = "neutral";

    // 1. Extract bracketed words [word]
    const regex = /\[(.*?)\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        highlights.push(match[1]);
    }

    // 2. Check general sentiment of the whole text
    if (NEGATIVE_KEYWORDS.some(k => text.includes(k))) sentiment = 'negative';
    else if (POSITIVE_KEYWORDS.some(k => text.includes(k))) sentiment = 'positive';

    return { highlights, sentiment };
};
