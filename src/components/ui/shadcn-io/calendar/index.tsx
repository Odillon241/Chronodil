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
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { createContext, useContext, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
        const featureStart = startOfMonth(feature.startAt);
        const featureEnd = endOfMonth(feature.endAt);
        const currentMonth = startOfMonth(currentDate);

        return featureStart <= currentMonth && featureEnd >= currentMonth;
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
      {calendarDays.map((day, index) => (
        <div
          className={cn(
            'min-h-[120px] border-border/50 border-b border-r p-2',
            !day.isCurrentMonth && 'bg-muted/20'
          )}
          key={`${id}-${index}`}
        >
          <div
            className={cn(
              'mb-2 text-right text-sm',
              !day.isCurrentMonth && 'text-muted-foreground'
            )}
          >
            {format(day.date, 'd')}
          </div>
          <div className="space-y-1">
            {day.features.map((feature) => (
              <div key={feature.id}>{children({ feature })}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export type CalendarItemProps = {
  feature: CalendarFeature;
  className?: string;
};

export const CalendarItem: FC<CalendarItemProps> = ({
  feature,
  className,
}) => (
  <div
    className={cn(
      'cursor-pointer truncate rounded px-2 py-1 text-xs hover:opacity-80',
      className
    )}
    style={{
      backgroundColor: feature.status.color,
    }}
    title={feature.name}
  >
    {feature.name}
  </div>
);
