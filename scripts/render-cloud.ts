import 'dotenv/config';
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import mongoose from 'mongoose';
import { webpackOverride } from "../src/remotion/webpack-override.mjs";
import { COMP_NAME, VIDEO_FPS } from "../src/types/constants";
import { EditorState, Asset } from "../src/lib/db/models";

// Helper to match IDB ref pattern
const IDB_REF_PREFIX = "idb://";
const isIdbRef = (value: string) => value.startsWith(IDB_REF_PREFIX);
const getIdFromRef = (value: string) => value.slice(IDB_REF_PREFIX.length);

async function renderCloud() {
  const args = process.argv.slice(2);
  const projectId = args[0] || "proj-1";

  console.log(`[Render] Starting render for project: ${projectId}`);

  // 1. Connect to DB
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }
  
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'test'
  });
  console.log("[DB] Connected");

  // 2. Fetch Data
  const editorState = await EditorState.findOne({ projectId }).lean();
  if (!editorState) {
    throw new Error(`Project ${projectId} not found in database.`);
  }
  console.log("[DB] Editor state loaded");

  const assets = await Asset.find({ projectId }).lean();
  console.log(`[DB] Loaded ${assets.length} assets`);

  // Create a map for quick asset lookup: assetId -> data (Base64)
  const assetMap = new Map<string, string>();
  for (const asset of assets) {
    assetMap.set(asset.assetId, asset.data as string);
  }

  // 3. Reconstruct Props
  // Logic mirrored from src/app/editor/[projectId]/page.tsx
  const scriptData = (editorState.scriptData || []) as any[];
  const layerClips = (editorState.layerClips || []) as any[];
  const tracks = (editorState.tracks || []) as any[];
  const config = editorState.config || {};

  // Resolve Images in Script Items (bgImage) -> though these are usually used to generate layerClips
  // We primarily care about constructing the final `clips` array for Remotion.
  
  // Reconstruct 'clips' array normally passed to Composition
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
      subtitleStyle: item.subtitleStyle,
      highlightWords: item.highlight || [],
      sentiment: item.event === "normal" ? "neutral" : item.event || "neutral",
  }));

  const combinedClips = [...layerClips, ...textClips];

  // Resolve Asset References (idb:// -> Base64)
  const resolvedClips = combinedClips.map((clip) => {
    let src = clip.src;
    
    if (src && typeof src === 'string' && isIdbRef(src)) {
      const id = getIdFromRef(src);
      const assetData = assetMap.get(id);
      if (assetData) {
        src = assetData; // Replace ref with actual Base64 data
      } else {
        console.warn(`[Warn] Asset not found for ref: ${src}`);
      }
    }
    
    return { ...clip, src };
  });

  // Calculate duration
  const scriptMax = scriptData.reduce((max, item) => Math.max(max, item.start + item.duration), 0);
  const layerMax = layerClips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
  const totalDuration = Math.max(scriptMax, layerMax, 1);

  // Prepare Props
  const inputProps = {
    clips: resolvedClips,
    tracks,
    width: 2160,
    height: 3840,
    fps: VIDEO_FPS,
    duration: totalDuration,
    bgKeywords: config.bgKeywords || [],
    positiveWords: config.positiveWords || [],
    negativeWords: config.negativeWords || [],
    gridDirection: editorState.gridDirection || "forward",
  };

  console.log(`[Render] Props prepared. Duration: ${totalDuration}s`);

  // 4. Render
  const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");
  console.log("[Bundler] Bundling...");
  const bundled = await bundle({
    entryPoint,
    webpackOverride,
  });

  console.log("[Renderer] Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundled,
    id: COMP_NAME,
    inputProps,
  });

  const outputLocation = path.join(process.cwd(), "out.mp4");
  console.log(`[Renderer] Rendering to ${outputLocation}...`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation,
    inputProps,
    timeoutInMilliseconds: 300000, // 5 mins
  });

  console.log("[Success] Video rendered!");
  process.exit(0);
}

renderCloud().catch((err) => {
  console.error(err);
  process.exit(1);
});
