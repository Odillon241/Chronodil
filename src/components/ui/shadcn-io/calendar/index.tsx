'use client';

import {
  addMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  getISODay,
  isSameDay,
  startOfMonth,
  subMonths,
  isToday,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { createContext, useContext, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Événements et jours fériés du Gabon
interface GabonEvent {
  date: string;
  name: string;
  type: 'holiday' | 'celebration' | 'cultural' | 'religious';
  emoji: string;
}

const GABON_EVENTS: GabonEvent[] = [
  // Jours fériés officiels
  { date: '01-01', name: 'Nouvel An', type: 'holiday', emoji: '🎉' },
  { date: '03-12', name: 'Fête de la Rénovation', type: 'holiday', emoji: '🇬🇦' },
  { date: '04-17', name: 'Journée des Femmes Gabonaises', type: 'holiday', emoji: '👩' },
  { date: '05-01', name: 'Fête du Travail', type: 'holiday', emoji: '⚒️' },
  { date: '08-15', name: 'Assomption', type: 'religious', emoji: '✝️' },
  { date: '08-16', name: 'Indépendance du Gabon (Jour 1)', type: 'holiday', emoji: '🇬🇦' },
  { date: '08-17', name: 'Indépendance du Gabon (Jour 2)', type: 'holiday', emoji: '🇬🇦' },
  { date: '11-01', name: 'Toussaint', type: 'religious', emoji: '🕯️' },
  { date: '12-25', name: 'Noël', type: 'religious', emoji: '🎄' },

  // Événements culturels et célébrations
  { date: '02-14', name: 'Saint-Valentin', type: 'celebration', emoji: '💝' },
  { date: '03-08', name: 'Journée Internationale des Femmes', type: 'celebration', emoji: '👩‍🦰' },
  { date: '03-21', name: 'Journée Internationale des Forêts', type: 'cultural', emoji: '🌳' },
  { date: '04-22', name: 'Jour de la Terre', type: 'cultural', emoji: '🌍' },
  { date: '05-25', name: 'Journée de l\'Afrique', type: 'cultural', emoji: '🌍' },
  { date: '06-01', name: 'Journée Internationale de l\'Enfance', type: 'celebration', emoji: '👶' },
  { date: '06-05', name: 'Journée Mondiale de l\'Environnement', type: 'cultural', emoji: '♻️' },
  { date: '06-21', name: 'Fête de la Musique', type: 'celebration', emoji: '🎵' },
  { date: '07-14', name: 'Fête Nationale Française', type: 'celebration', emoji: '🇫🇷' },
  { date: '09-01', name: 'Rentrée Scolaire', type: 'cultural', emoji: '🎒' },
  { date: '10-24', name: 'Journée des Nations Unies', type: 'cultural', emoji: '🌐' },
  { date: '10-31', name: 'Halloween', type: 'celebration', emoji: '🎃' },
  { date: '11-11', name: 'Armistice 1918', type: 'cultural', emoji: '🕊️' },
  { date: '12-10', name: 'Journée des Droits de l\'Homme', type: 'cultural', emoji: '⚖️' },
  { date: '12-24', name: 'Veille de Noël', type: 'celebration', emoji: '🎅' },
  { date: '12-31', name: 'Saint-Sylvestre', type: 'celebration', emoji: '🎊' },
];

const getEvent = (date: Date): GabonEvent | null => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;

  return GABON_EVENTS.find(e => e.date === dateStr) || null;
};

const getEventBgColor = (event: GabonEvent | null): string => {
  if (!event) return "";
  switch (event.type) {
    case 'holiday':
      return "bg-red-50 dark:bg-red-950/20";
    case 'religious':
      return "bg-purple-50 dark:bg-purple-950/20";
    case 'celebration':
      return "bg-pink-50 dark:bg-pink-950/20";
    case 'cultural':
      return "bg-amber-50 dark:bg-amber-950/20";
    default:
      return "";
  }
};

const getEventBadgeVariant = (event: GabonEvent | null): "default" | "destructive" | "outline" | "secondary" => {
  if (!event) return "default";
  switch (event.type) {
    case 'holiday':
      return "destructive";
    case 'religious':
      return "secondary";
    case 'celebration':
      return "outline";
    case 'cultural':
      return "secondary";
    default:
      return "default";
  }
};

export type CalendarFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: {
    color: string;
  };
};

type CalendarContextValue = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  features: CalendarFeature[];
};

const CalendarContext = createContext<CalendarContextValue>({
  currentDate: new Date(),
  setCurrentDate: () => {},
  features: [],
});

export type CalendarProviderProps = {
  children: ReactNode;
  className?: string;
};

export const CalendarProvider: FC<CalendarProviderProps> = ({
  children,
  className,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        features: [],
      }}
    >
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-auto bg-background',
          className
        )}
      >
        {children}
      </div>
    </CalendarContext.Provider>
  );
};

export type CalendarDateProps = {
  children: ReactNode;
  className?: string;
};

export const CalendarDate: FC<CalendarDateProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 border-border/50 border-b p-4',
      className
    )}
  >
    {children}
  </div>
);

export type CalendarDatePickerProps = {
  children: ReactNode;
  className?: string;
};

export const CalendarDatePicker: FC<CalendarDatePickerProps> = ({
  children,
  className,
}) => (
  <div className={cn('flex items-center gap-2', className)}>{children}</div>
);

export type CalendarMonthPickerProps = {
  className?: string;
};

export const CalendarMonthPicker: FC<CalendarMonthPickerProps> = ({
  className,
}) => {
  const { currentDate, setCurrentDate } = useContext(CalendarContext);

  const handleValueChange = (value: string) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(value, 10));
    setCurrentDate(newDate);
  };

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <Select
      onValueChange={handleValueChange}
      value={currentDate.getMonth().toString()}
    >
      <SelectTrigger className={cn('w-[140px]', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((month, index) => (
          <SelectItem key={month} value={index.toString()}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export type CalendarYearPickerProps = {
  start: number;
  end: number;
  className?: string;
};

export const CalendarYearPicker: FC<CalendarYearPickerProps> = ({
  start,
  end,
  className,
}) => {
  const { currentDate, setCurrentDate } = useContext(CalendarContext);

  const handleValueChange = (value: string) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(value, 10));
    setCurrentDate(newDate);
  };

  const years = Array.from(
    { length: end - start + 1 },
    (_, i) => start + i
  );

  return (
    <Select
      onValueChange={handleValueChange}
      value={currentDate.getFullYear().toString()}
    >
      <SelectTrigger className={cn('w-[100px]', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export type CalendarDatePaginationProps = {
  className?: string;
};

export const CalendarDatePagination: FC<CalendarDatePaginationProps> = ({
  className,
}) => {
  const { currentDate, setCurrentDate } = useContext(CalendarContext);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        onClick={handlePrevMonth}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleNextMonth}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export type CalendarHeaderProps = {
  className?: string;
};

export const CalendarHeader: FC<CalendarHeaderProps> = ({ className }) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div
      className={cn(
        'grid grid-cols-7 border-border/50 border-b bg-muted/50',
        className
      )}
    >
      {weekDays.map((day) => (
        <div
          className="p-2 text-center font-medium text-muted-foreground text-xs"
          key={day}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarBodyProps = {
  features: CalendarFeature[];
  children: (props: { feature: CalendarFeature }) => ReactNode;
  className?: string;
};

export const CalendarBody: FC<CalendarBodyProps> = ({
  features,
  children,
  className,
}) => {
  const { currentDate } = useContext(CalendarContext);
  const id = useId();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const startDayOfWeek = getISODay(monthStart);

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      features: CalendarFeature[];
    }> = [];

    // Add previous month days to fill the first week
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const prevDate = new Date(monthStart);
      prevDate.setDate(prevDate.getDate() - i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        features: [],
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayFeatures = features.filter((feature) => {
        // Vérifier si la date actuelle est dans la période du feature
        // Utilise le début et la fin du jour pour la comparaison
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const featureStart = new Date(feature.startAt);
        featureStart.setHours(0, 0, 0, 0);
        const featureEnd = new Date(feature.endAt);
        featureEnd.setHours(23, 59, 59, 999);

        // Le feature est visible si le jour chevauche la période du feature
        return dayStart <= featureEnd && dayEnd >= featureStart;
      });

      days.push({
        date,
        isCurrentMonth: true,
        features: dayFeatures,
      });
    }

    // Add next month days to fill the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(monthEnd);
        nextDate.setDate(nextDate.getDate() + i);
        days.push({
          date: nextDate,
          isCurrentMonth: false,
          features: [],
        });
      }
    }

    return days;
  }, [currentDate, features]);

  return (
    <div className={cn('grid flex-1 grid-cols-7', className)}>
      {calendarDays.map((day, index) => {
        const event = getEvent(day.date);
        const isTodayDate = isToday(day.date);
        const MAX_VISIBLE_FEATURES = event ? 2 : 3;
        const visibleFeatures = day.features.slice(0, MAX_VISIBLE_FEATURES);
        const remainingCount = Math.max(0, day.features.length - MAX_VISIBLE_FEATURES);

        return (
          <div
            className={cn(
              'min-h-[120px] border-border/50 border-b border-r p-2',
              !day.isCurrentMonth && 'bg-muted/20',
              getEventBgColor(event),
              isTodayDate && 'ring-2 ring-inset ring-primary'
            )}
            key={`${id}-${index}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div
                className={cn(
                  'text-sm',
                  !day.isCurrentMonth && 'text-muted-foreground',
                  isTodayDate && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
                )}
              >
                {format(day.date, 'd')}
              </div>
              {event && (
                <span className="text-sm" title={event.name}>
                  {event.emoji}
                </span>
              )}
            </div>

            {event && (
              <Badge
                variant={getEventBadgeVariant(event)}
                className="text-[9px] mb-1 w-full justify-center px-1 py-0 h-auto leading-tight truncate"
                title={`${event.name} - ${event.type}`}
              >
                {event.name}
              </Badge>
            )}

            <div className="space-y-1">
              {visibleFeatures.map((feature) => (
                <div key={feature.id}>{children({ feature })}</div>
              ))}
              {remainingCount > 0 && (
                <div className="text-[10px] text-center text-muted-foreground py-1 hover:bg-muted/50 rounded cursor-pointer">
                  +{remainingCount} autre{remainingCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export type CalendarItemProps = {
  feature: CalendarFeature;
  className?: string;
  onClick?: () => void;
};

export const CalendarItem: FC<CalendarItemProps> = ({
  feature,
  className,
  onClick,
}) => (
  <div
    className={cn(
      'cursor-pointer truncate rounded px-2 py-1 text-xs hover:opacity-80',
      className
    )}
    onClick={onClick}
    style={{
      backgroundColor: feature.status.color,
    }}
    title={feature.name}
  >
    {feature.name}
  </div>
);
