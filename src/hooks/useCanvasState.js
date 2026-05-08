import { useState } from 'react';

export function useCanvasState() {
  const [canvasContent, setCanvasContent] = useState(null);
  const [canvasTitle, setCanvasTitle] = useState(null);
  const [canvasMode, setCanvasMode] = useState(false);

  const openCanvas = (title, content) => {
    setCanvasTitle(title);
    setCanvasContent(content);
  };

  const closeCanvas = () => {
    setCanvasContent(null);
    setCanvasTitle(null);
    setCanvasMode(false);
  };

  const resetCanvas = () => {
    setCanvasContent(null);
    setCanvasTitle(null);
  };

  const toggleCanvasMode = () => setCanvasMode((prev) => !prev);

  return {
    canvasContent,
    canvasTitle,
    canvasMode,
    setCanvasMode,
    openCanvas,
    closeCanvas,
    resetCanvas,
    toggleCanvasMode,
  };
}