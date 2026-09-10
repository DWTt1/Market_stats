import { createContext, useContext, useEffect, useState } from "react";
import type { DataIndex } from "../types/data";

export const DataContext = createContext<DataIndex | null>(null);
export function useIndex() {
  const index = useContext(DataContext);
  if (!index) throw new Error("Data index missing");
  return index;
}
export function useAsync<T>(key: string, loader: () => Promise<T>) {
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>(
    { key: "" },
  );
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ key });
    loader()
      .then((data) => {
        if (active) setState({ key, data });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            key,
            error: error instanceof Error ? error.message : "数据读取失败",
          });
      });
    return () => {
      active = false;
    };
    // The explicit key owns loader identity; avoids refetching on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return {
    data: state.key === key ? state.data : undefined,
    error: state.key === key ? state.error : undefined,
    retry: () => retry((n) => n + 1),
  };
}
