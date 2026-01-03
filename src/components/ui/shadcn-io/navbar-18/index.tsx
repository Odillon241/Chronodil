'use client';

import * as React from 'react';
import { useId, useState } from 'react';
import { ClockIcon, PowerIcon, PowerOffIcon, ZapIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-bounce-subtle group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-bounce-strong group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-bounce-subtle group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
    />
  </svg>
);

// Types
export interface Navbar18NavItem {
  href?: string;
  label: string;
  active?: boolean;
  badge?: number | string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface Navbar18StatusIndicator {
  type: 'online' | 'uptime' | 'latency';
  value: string;
  color?: 'emerald' | 'default';
}

export interface Navbar18Props extends React.HTMLAttributes<HTMLElement> {
  navigationLinks?: Navbar18NavItem[];
  statusIndicators?: Navbar18StatusIndicator[];
  powerState?: boolean;
  onNavItemClick?: (href: string) => void;
  onPowerToggle?: (enabled: boolean) => void;
}

// Default navigation links
const defaultNavigationLinks: Navbar18NavItem[] = [
  { href: '#', label: 'Overview', active: true },
  { href: '#', label: 'Graphs', active: false },
  { href: '#', label: 'Backups', active: false },
];

// Default status indicators
const defaultStatusIndicators: Navbar18StatusIndicator[] = [
  { type: 'online', value: 'Online', color: 'emerald' },
  { type: 'uptime', value: '99.9%' },
  { type: 'latency', value: '45ms' },
];

export const Navbar18 = React.forwardRef<HTMLElement, Navbar18Props>(
  (
    {
      className,
      navigationLinks = defaultNavigationLinks,
      statusIndicators,
      powerState: controlledPowerState,
      onNavItemClick,
      onPowerToggle,
      ...props
    },
    ref
  ) => {
    // Use default only if statusIndicators is undefined, not if it's an empty array
    const effectiveStatusIndicators = statusIndicators ?? defaultStatusIndicators;
    const id = useId();
    const [internalPowerState, setInternalPowerState] = useState<boolean>(true);
    
    // Use controlled or internal power state
    const powerState = controlledPowerState !== undefined ? controlledPowerState : internalPowerState;
    
    const handlePowerToggle = (checked: boolean) => {
      if (controlledPowerState === undefined) {
        setInternalPowerState(checked);
      }
      if (onPowerToggle) {
        onPowerToggle(checked);
      }
    };

    const renderStatusBadge = (indicator: Navbar18StatusIndicator) => {
      const badgeClass = indicator.color === 'emerald' ? 'gap-1.5 text-emerald-600' : 'gap-1.5';
      
      return (
        <Badge key={indicator.type} variant="outline" className={badgeClass}>
          {indicator.type === 'online' && indicator.color === 'emerald' && (
            <span
              className="size-1.5 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
          )}
          {indicator.type === 'uptime' && (
            <ZapIcon
              className="-ms-0.5 opacity-60"
              size={12}
              aria-hidden="true"
            />
          )}
          {indicator.type === 'latency' && (
            <ClockIcon
              className="-ms-0.5 opacity-60"
              size={12}
              aria-hidden="true"
            />
          )}
          {indicator.value}
        </Badge>
      );
    };

    return (
      <header
        ref={ref}
        className={cn(
          'border-b px-4 md:px-6 **:no-underline',
          className
        )}
        {...props}
      >
        <div className={cn(
          "flex justify-between gap-4",
          (statusIndicators && statusIndicators.length > 0 || onPowerToggle !== undefined) ? "h-16" : "h-auto"
        )}>
          {/* Left side */}
          <div className="flex gap-2">
            {navigationLinks.length > 2 && (
              <div className="flex items-center md:hidden">
                {/* Mobile menu trigger */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="group size-8" variant="ghost" size="icon">
                      <HamburgerIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-36 p-1 md:hidden">
                    <NavigationMenu className="max-w-none *:w-full">
                      <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                        {navigationLinks.map((link, index) => (
                          <NavigationMenuItem key={index} className="w-full">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (onNavItemClick && link.href) onNavItemClick(link.href);
                              }}
                              className="flex w-full items-center justify-between py-1.5 px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md no-underline"
                            >
                              <span>{link.label}</span>
                              {link.badge !== undefined && (
                                <Badge variant={link.badgeVariant || 'secondary'} className="ml-2">
                                  {link.badge}
                                </Badge>
                              )}
                            </button>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              {/* Navigation menu */}
              <NavigationMenu className="h-full *:h-full max-md:hidden">
                <NavigationMenuList className="h-full gap-2">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index} className="h-full">
                      <NavigationMenuLink
                        href={link.href}
                        onClick={(e) => {
                          e.preventDefault();
                          if (onNavItemClick && link.href) onNavItemClick(link.href);
                        }}
                        data-active={link.active}
                        className={cn(
                          "text-muted-foreground hover:text-primary border-b-primary hover:border-b-primary h-full justify-center rounded-none border-y-2 border-transparent py-1.5 font-medium hover:bg-transparent cursor-pointer flex items-center gap-2",
                          link.active && "border-b-primary text-primary bg-transparent"
                        )}
                      >
                        <span>{link.label}</span>
                        {link.badge !== undefined && (
                          <Badge variant={link.badgeVariant || 'secondary'} className="ml-1">
                            {link.badge}
                          </Badge>
                        )}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
              {/* Mobile: show nav items directly if <= 2 items */}
              {navigationLinks.length <= 2 && (
                <div className="flex items-center gap-2 md:hidden">
                  {navigationLinks.map((link, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavItemClick && link.href) onNavItemClick(link.href);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                        link.active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <span>{link.label}</span>
                      {link.badge !== undefined && (
                        <Badge variant={link.badgeVariant || 'secondary'} className="ml-1">
                          {link.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Right side */}
          {(effectiveStatusIndicators.length > 0 || onPowerToggle !== undefined) && (
            <div className="flex items-center gap-4">
              {effectiveStatusIndicators.length > 0 && (
                <div className="flex items-center gap-2">
                  {effectiveStatusIndicators.map(renderStatusBadge)}
                </div>
              )}
              {/* Switch */}
              {onPowerToggle !== undefined && (
                <div>
                  <div className="relative inline-grid h-7 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                    <Switch
                      id={id}
                      checked={powerState}
                      onCheckedChange={handlePowerToggle}
                      className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-smooth-out data-[state=checked]:[&_span]:translate-x-full rtl:data-[state=checked]:[&_span]:-translate-x-full"
                    />
                    <span className="pointer-events-none relative ms-0.5 flex w-6 items-center justify-center text-center transition-transform duration-300 ease-smooth-out peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full rtl:peer-data-[state=unchecked]:-translate-x-full">
                      <PowerOffIcon size={12} aria-hidden="true" />
                    </span>
                    <span className="peer-data-[state=checked]:text-background pointer-events-none relative me-0.5 flex w-6 items-center justify-center text-center transition-transform duration-300 ease-smooth-out peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible rtl:peer-data-[state=checked]:translate-x-full">
                      <PowerIcon size={12} aria-hidden="true" />
                    </span>
                  </div>
                  <Label htmlFor={id} className="sr-only">
                    Power
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);

Navbar18.displayName = 'Navbar18';

export { HamburgerIcon };