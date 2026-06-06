"use client";
import { useEffect, useRef } from "react";

export function useSSE(url, handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data);
        handlersRef.current[type]?.(data);
      } catch {}
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 3s
      setTimeout(() => {
        const newEs = new EventSource(url);
        newEs.onmessage = es.onmessage;
      }, 3000);
    };

    return () => es.close();
  }, [url]);
}