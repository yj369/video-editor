import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { executeApi } from "../../../helpers/api-response";
import { webpackOverride } from "../../../remotion/webpack-override.mjs";
import { RenderRequest } from "@/types/schema";

export const maxDuration = 300; // 5 minutes

export const POST = executeApi(RenderRequest, async (req, body) => {
  console.log("Starting render for:", body.id);
  const bundled = await bundle({
    entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
    webpackOverride,
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: body.id,
    inputProps: body.inputProps,
  });

  const outputLocation = path.join(process.cwd(), "public", "out.mp4");

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation,
    inputProps: body.inputProps,
    scale: body.scale ?? 1,
  });

  return { url: "/out.mp4" };
});
