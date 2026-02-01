import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { webpackOverride } from "../src/remotion/webpack-override.mjs";
import { defaultMyCompProps, COMP_NAME } from "../src/types/constants";

async function testRender() {
  console.log("Starting test render...");
  
  try {
    const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");
    console.log("Entry point:", entryPoint);

    console.log("Bundling...");
    const bundled = await bundle({
      entryPoint,
      webpackOverride,
    });
    console.log("Bundled:", bundled);

    console.log("Selecting composition...");
    const composition = await selectComposition({
      serveUrl: bundled,
      id: COMP_NAME,
      inputProps: defaultMyCompProps,
    });
    console.log("Composition selected:", composition.id);

    const outputLocation = path.join(process.cwd(), "public", "test-out.mp4");
    console.log("Rendering to:", outputLocation);

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation,
      inputProps: defaultMyCompProps,
    });

    console.log("Render success!");
  } catch (err) {
    console.error("Render failed:", err);
  }
}

testRender();
