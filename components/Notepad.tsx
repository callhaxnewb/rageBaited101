import './Notepad.css';
import { useDebate } from '@/lib/state';
import React, { useState, useRef, useEffect } from 'react';

export default function Notepad() {
  const { notepadText, setNotepadText } = useDebate();
  const notepadRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 350, height: 300 });

  // Dragging logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !notepadRef.current) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !notepadRef.current) return;
      const newWidth = Math.max(250, size.width + e.movementX);
      const newHeight = Math.max(200, size.height + e.movementY);
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, size]);

  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  return (
    <div
      className="notepad"
      ref={notepadRef}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="notepad-header" onMouseDown={handleHeaderMouseDown}>
        <span className="icon">edit_note</span> Notepad
      </div>
      <textarea
        value={notepadText}
        onChange={e => setNotepadText(e.target.value)}
        placeholder="> Your notes..."
      />
      <div
        className="notepad-resize-handle"
        onMouseDown={handleResizeMouseDown}
      ></div>
    </div>
  );
}