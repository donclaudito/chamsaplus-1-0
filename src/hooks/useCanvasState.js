import { useState, useDebugValue } from 'react';

const CLOSED = { title: null, content: null };

export function useCanvasState() {
  // Agrupa title+content num único objeto — evita dois setState separados
  const [canvas, setCanvas] = useState(CLOSED);
  const [canvasMode, setCanvasMode] = useState(false);

  useDebugValue(canvas.content ? `open: "${canvas.title}"` : "closed");

  const openCanvas = (title, content) => setCanvas({ title, content });

  // Não desliga canvasMode ao fechar — usuário precisa desativar manualmente
  const closeCanvas  = () => setCanvas(CLOSED);
  const resetCanvas  = () => setCanvas(CLOSED);

  const toggleCanvasMode = () => setCanvasMode((prev) => !prev);

  return {
    canvasContent: canvas.content,
    canvasTitle:   canvas.title,
    canvasMode,
    setCanvasMode,
    openCanvas,
    closeCanvas,
    resetCanvas,
    toggleCanvasMode,
  };
}