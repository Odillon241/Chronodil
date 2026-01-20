'use client'

import {
  type Column,
  type ColumnDef,
  type HeaderGroup,
  type Header,
  type Row,
  type Cell,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useContext, useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type { ColumnDef, HeaderGroup, Header, Row, Cell } from '@tanstack/react-table'

type TableContextValue<TData> = {
  table: ReturnType<typeof useReactTable<TData>>
}

const TableContext = createContext<TableContextValue<any> | null>(null)

export type TableProviderProps<TData> = {
  columns: ColumnDef<TData>[]
  data: TData[]
  children: ReactNode
  className?: string
}

export function TableProvider<TData>({
  columns,
  data,
  children,
  className,
}: TableProviderProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <TableContext.Provider value={{ table }}>
      <div className={cn('w-full', className)}>
        <table className="w-full border-collapse">{children}</table>
      </div>
    </TableContext.Provider>
  )
}

export type TableHeaderProps<TData> = {
  children: (props: { headerGroup: HeaderGroup<TData> }) => ReactNode
  className?: string
}

export function TableHeader<TData>({ children, className }: TableHeaderProps<TData>) {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('TableHeader must be used within TableProvider')
  }

  return (
    <thead className={cn('border-b bg-muted/50', className)}>
      {context.table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>{children({ headerGroup })}</tr>
      ))}
    </thead>
  )
}

export type TableHeaderGroupProps<TData> = {
  headerGroup: HeaderGroup<TData>
  children: (props: { header: Header<TData, unknown> }) => ReactNode
  className?: string
}

export function TableHeaderGroup<TData>({
  headerGroup,
  children,
  className,
}: TableHeaderGroupProps<TData>) {
  return (
    <>
      {headerGroup.headers.map((header) => (
        <th className={cn('text-left', className)} key={header.id}>
          {children({ header })}
        </th>
      ))}
    </>
  )
}

export type TableHeadProps<TData> = {
  header: Header<TData, unknown>
  className?: string
}

export function TableHead<TData>({ header, className }: TableHeadProps<TData>) {
  return (
    <div className={cn('px-4 py-3', className)}>
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </div>
  )
}

export type TableColumnHeaderProps<TData> = {
  column: Column<TData>
  title: string
  className?: string
}

export function TableColumnHeader<TData>({
  column,
  title,
  className,
}: TableColumnHeaderProps<TData>) {
  if (!column.getCanSort()) {
    return <div className={cn('font-medium', className)}>{title}</div>
  }

  return (
    <Button
      className={cn('flex items-center gap-2', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      type="button"
      variant="ghost"
    >
      {title}
      {column.getIsSorted() === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : column.getIsSorted() === 'desc' ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

export type TableBodyProps<TData> = {
  children: (props: { row: Row<TData> }) => ReactNode
  className?: string
}

export function TableBody<TData>({ children, className }: TableBodyProps<TData>) {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('TableBody must be used within TableProvider')
  }

  return (
    <tbody className={cn(className)}>
      {context.table.getRowModel().rows.map((row) => children({ row }))}
    </tbody>
  )
}

export type TableRowProps<TData> = {
  row: Row<TData>
  children: (props: { cell: Cell<TData, unknown> }) => ReactNode
  className?: string
  onClick?: React.MouseEventHandler<HTMLTableRowElement>
}

export function TableRow<TData>({
  row,
  children,
  className,
  onClick,
  ...props
}: TableRowProps<TData> & Omit<React.HTMLAttributes<HTMLTableRowElement>, 'children'>) {
  return (
    <tr
      className={cn('border-b transition-colors hover:bg-muted/50', className)}
      key={row.id}
      onClick={onClick}
      {...props}
    >
      {row.getVisibleCells().map((cell) => (
        <Fragment key={cell.id}>{children({ cell })}</Fragment>
      ))}
    </tr>
  )
}

export type TableCellProps<TData> = {
  cell: Cell<TData, unknown>
  className?: string
}

export function TableCell<TData>({ cell, className }: TableCellProps<TData>) {
  return (
    <td className={cn('px-4 py-3', className)} key={cell.id}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  )
}
