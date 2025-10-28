'use client';

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, FC, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Column = {
  id: string;
  name: string;
  color?: string;
};

type KanbanContextValue<T> = {
  columns: Column[];
  data: T[];
  activeId: string | null;
  renderChildren?: (item: T) => ReactNode;
};

const KanbanContext = createContext<KanbanContextValue<any>>({
  columns: [],
  data: [],
  activeId: null,
});

export type KanbanProviderProps<T extends { id: string; column: string }> = {
  columns: Column[];
  data: T[];
  onDragEnd: (event: DragEndEvent) => void;
  children: (column: Column) => ReactNode;
  className?: string;
};

export function KanbanProvider<T extends { id: string; column: string }>({
  columns,
  data,
  onDragEnd,
  children,
  className,
}: KanbanProviderProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const activeItem = data.find((item) => item.id === activeId);

  return (
    <KanbanContext.Provider value={{ columns, data, activeId }}>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div
          className={cn(
            'flex h-full gap-4 overflow-x-auto overflow-y-hidden',
            className
          )}
        >
          {columns.map((column) => children(column))}
        </div>
        <DragOverlay>
          {activeItem && activeId ? (
            <div className="rotate-3 opacity-50">
              <Card className="cursor-grabbing p-4 shadow-lg">
                <p className="text-sm">{(activeItem as any).name}</p>
              </Card>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </KanbanContext.Provider>
  );
}

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard: FC<KanbanBoardProps> = ({
  id,
  children,
  className,
}) => {
  const { data } = useContext(KanbanContext);
  const items = data
    .filter((item) => item.column === id)
    .map((item) => item.id);

  return (
    <div
      className={cn(
        'flex min-w-[300px] flex-1 flex-col rounded-lg border bg-muted/20',
        className
      )}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
};

export type KanbanHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const KanbanHeader: FC<KanbanHeaderProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'border-b bg-background p-4 font-semibold text-sm',
      className
    )}
  >
    {children}
  </div>
);

export type KanbanCardsProps = {
  id: string;
  children: (item: any) => ReactNode;
  className?: string;
};

export const KanbanCards: FC<KanbanCardsProps> = ({
  id,
  children,
  className,
}) => {
  const { data } = useContext(KanbanContext);
  const items = data.filter((item) => item.column === id);

  return (
    <div className={cn('flex-1 space-y-2 overflow-y-auto p-4', className)}>
      {items.map((item) => (
        <div key={item.id}>{children(item)}</div>
      ))}
    </div>
  );
};

export type KanbanCardProps = {
  id: string;
  column: string;
  name: string;
  children: ReactNode;
  className?: string;
};

export const KanbanCard: FC<KanbanCardProps> = ({
  id,
  children,
  className,
}) => {
  const { activeId } = useContext(KanbanContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (activeId === id) {
    return (
      <Card
        className={cn(
          'cursor-grabbing border-2 border-dashed border-primary bg-muted/40 p-4',
          className
        )}
        ref={setNodeRef}
        style={style}
      >
        <div className="h-16" />
      </Card>
    );
  }

  return (
    <Card
      className={cn('cursor-grab p-4 active:cursor-grabbing', className)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </Card>
  );
};
