import { enableTailwind } from "@remotion/tailwind-v4";
import path from "path";
import { cwd } from "node:process";

/**
 *  @param {import('webpack').Configuration} currentConfig
 */
export const webpackOverride = (currentConfig) => {
  const config = enableTailwind(currentConfig);
  const resolved = config.resolve ?? {};
  const alias = resolved.alias ?? {};
  return {
    ...config,
    resolve: {
      ...resolved,
      alias: {
        ...alias,
        "@": path.join(cwd(), "src"),
      },
    },
  };
};
