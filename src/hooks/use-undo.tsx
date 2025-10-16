import { useState, useCallback } from "react";

export function useUndo<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<T[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const nextState = newState instanceof Function ? newState(prevState) : newState;

      // Ajouter au historique
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(nextState);
        // Limiter l'historique à 50 entrées
        return newHistory.slice(-50);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));

      return nextState;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
      setState(history[historyIndex - 1]);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
      setState(history[historyIndex + 1]);
    }
  }, [canRedo, history, historyIndex]);

  const reset = useCallback(() => {
    setState(initialState);
    setHistory([initialState]);
    setHistoryIndex(0);
  }, [initialState]);

  return {
    state,
    setState: updateState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
