import { z } from "zod";
import { RenderRequest } from "@/types/schema";
import { CompositionProps } from "@/types/constants";
import { ApiResponse } from "../helpers/api-response";

export const renderVideo = async ({
  id,
  inputProps,
  scale,
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
  scale?: number;
}) => {
  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps,
    scale,
  };

  const result = await fetch("/api/render", {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
  const json = (await result.json()) as ApiResponse<{ url: string }>;
  if (json.type === "error") {
    throw new Error(json.message);
  }

  return json.data;
};
