"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TypingTextProps {
  text: string[];
  as?: React.ElementType;
  className?: string;
  typingSpeed?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  initialDelay?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorClassName?: string;
  textColors?: string[];
  loop?: boolean;
}

export default function TypingText({
  text,
  as: Component = 'div',
  className = '',
  typingSpeed = 100,
  pauseDuration = 2000,
  deletingSpeed = 50,
  initialDelay = 0,
  showCursor = true,
  cursorCharacter = '|',
  cursorClassName = '',
  textColors = [],
  loop = false
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    if (isWaiting && initialDelay > 0) {
      const timer = setTimeout(() => setIsWaiting(false), initialDelay);
      return () => clearTimeout(timer);
    }
  }, [isWaiting, initialDelay]);

  useEffect(() => {
    if (isWaiting) return;

    const currentText = text[currentIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentText.length) {
        setDisplayText(currentText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (!isDeleting && charIndex === currentText.length) {
        setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setCurrentIndex((currentIndex + 1) % text.length);
        if (!loop && currentIndex === text.length - 1) {
          return;
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentIndex, text, typingSpeed, deletingSpeed, pauseDuration, isWaiting, loop]);

  const currentColor = textColors[currentIndex] || textColors[0] || '';

  return (
    <Component className={cn(className, currentColor)}>
      {displayText}
      {showCursor && (
        <span className={cn('inline-block animate-pulse', cursorClassName)}>
          {cursorCharacter}
        </span>
      )}
    </Component>
  );
}
