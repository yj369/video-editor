import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import { Main } from "./MyComp/Main";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  CompositionProps,
} from "../types/constants";
import { z } from "zod";

const calculateMetadata: CalculateMetadataFunction<z.infer<typeof CompositionProps>> = ({ props }) => {
  const normalize = (value: number, fallback: number) => {
    const raw = Number.isFinite(value) ? value : fallback;
    const rounded = Math.max(16, Math.round(raw));
    return Math.max(16, Math.round(rounded / 2) * 2);
  };
  const width = normalize(props.width ?? VIDEO_WIDTH, VIDEO_WIDTH);
  const height = normalize(props.height ?? VIDEO_HEIGHT, VIDEO_HEIGHT);
  const fps = props.fps ?? VIDEO_FPS;
  const durationSeconds = props.duration ?? DURATION_IN_FRAMES / VIDEO_FPS;
  const durationInFrames = Math.ceil(durationSeconds * fps);
  return {
    width,
    height,
    fps,
    durationInFrames,
    props,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
