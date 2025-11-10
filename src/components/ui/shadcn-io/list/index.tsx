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
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, FC, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type { DragEndEvent } from '@dnd-kit/core';

type ListContextValue = {
  activeId: string | null;
};

const ListContext = createContext<ListContextValue>({
  activeId: null,
});

export type ListProviderProps = {
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
  className?: string;
};

export const ListProvider: FC<ListProviderProps> = ({
  onDragEnd,
  children,
  className,
}) => {
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

  return (
    <ListContext.Provider value={{ activeId }}>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div className={cn('flex flex-col h-full gap-4 p-4', className)}>
          {children}
        </div>
        <DragOverlay>
          {activeId ? (
            <Card className="cursor-grabbing p-3 opacity-50 shadow-lg">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ListContext.Provider>
  );
};

export type ListGroupProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const ListGroup: FC<ListGroupProps> = ({ id, children, className }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      className={cn('flex min-w-[300px] flex-1 flex-col', className)}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type ListHeaderProps = {
  name: string;
  color: string;
  className?: string;
};

export const ListHeader: FC<ListHeaderProps> = ({ name, color, className }) => (
  <div className={cn('mb-4 flex items-center gap-2', className)}>
    <div
      className="h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
    />
    <h3 className="font-semibold text-sm">{name}</h3>
  </div>
);

export type ListItemsProps = {
  children: ReactNode;
  className?: string;
};

export const ListItems: FC<ListItemsProps> = ({ children, className }) => {
  // Collect item IDs from children for SortableContext
  const itemIds: string[] = [];
  const extractIds = (child: any): void => {
    if (child?.props?.id) {
      itemIds.push(child.props.id);
    }
  };

  if (Array.isArray(children)) {
    children.forEach(extractIds);
  } else if (children) {
    extractIds(children);
  }

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </SortableContext>
  );
};

export type ListItemProps = {
  id: string;
  index: number;
  name: string;
  parent: string;
  children: ReactNode;
  className?: string;
};

export const ListItem: FC<ListItemProps> = ({
  id,
  children,
  className,
}) => {
  const { activeId } = useContext(ListContext);
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
          'cursor-grabbing border-2 border-dashed border-primary bg-muted/40 p-3',
          className
        )}
        ref={setNodeRef}
        style={style}
      >
        <div className="h-6" />
      </Card>
    );
  }

  return (
    <Card
      className={cn('cursor-grab p-3 active:cursor-grabbing', className)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">{children}</div>
    </Card>
  );
};
