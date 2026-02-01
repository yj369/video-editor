import { z } from "zod";
import { useCallback, useMemo, useState } from "react";
import { renderVideo } from "../lib/render-api";
import { CompositionProps } from "@/types/constants";

export type State =
  | {
      status: "init";
    }
  | {
      status: "invoking";
    }
  | {
      status: "error";
      error: Error;
    }
  | {
      url: string;
      status: "done";
    };

export const useRendering = (
  id: string,
  inputProps: z.infer<typeof CompositionProps>,
  scale?: number,
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    setState({
      status: "invoking",
    });
    try {
      const { url } = await renderVideo({ id, inputProps, scale });
      setState({
        url,
        status: "done",
      });
    } catch (err) {
      setState({
        status: "error",
        error: err as Error,
      });
    }
  }, [id, inputProps, scale]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
    };
  }, [renderMedia, state, undo]);
};