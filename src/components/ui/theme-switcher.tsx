'use client';

import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { Monitor, Moon, Sun } from 'lucide-react';

import { motion } from 'motion/react';

import { useCallback, useEffect, useState } from 'react';

import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';

const themes = [
  {
    key: 'system',
    icon: Monitor,
    label: 'Thème système',
  },
  {
    key: 'light',
    icon: Sun,
    label: 'Thème clair',
  },
  {
    key: 'dark',
    icon: Moon,
    label: 'Thème sombre',
  },
];

export type ThemeSwitcherProps = {
  value?: 'light' | 'dark' | 'system';
  onChange?: (theme: 'light' | 'dark' | 'system') => void;
  defaultValue?: 'light' | 'dark' | 'system';
  className?: string;
};

export const ThemeSwitcher = ({
  value,
  onChange,
  defaultValue = 'system',
  className,
}: ThemeSwitcherProps) => {
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [theme, setThemeState] = useControllableState({
    defaultProp: defaultValue,
    prop: value ?? (currentTheme as 'light' | 'dark' | 'system' | undefined),
    onChange: (newTheme) => {
      if (newTheme) {
        setTheme(newTheme);
        onChange?.(newTheme);
      }
    },
  });

  const handleThemeClick = useCallback(
    (themeKey: 'light' | 'dark' | 'system') => {
      setThemeState(themeKey);
    },
    [setThemeState]
  );

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with next-themes when not controlled
  useEffect(() => {
    if (mounted && currentTheme && !value) {
      setThemeState(currentTheme as 'light' | 'dark' | 'system');
    }
  }, [mounted, currentTheme, value, setThemeState]);

  if (!mounted || !theme) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border',
        className
      )}
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;

        return (
          <button
            aria-label={label}
            className="relative h-6 w-6 rounded-full"
            key={key}
            onClick={() => handleThemeClick(key as 'light' | 'dark' | 'system')}
            type="button"
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-secondary"
                layoutId="activeTheme"
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <Icon
              className={cn(
                'relative z-10 m-auto h-4 w-4',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

