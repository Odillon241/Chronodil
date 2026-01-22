'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  MinimalTiptapProps,
  MinimalTiptapHandle,
} from '@/components/ui/shadcn-io/minimal-tiptap'

// ⚡ Dynamic import pour réduire le bundle initial de ~150KB
const MinimalTiptapComponent = dynamic(
  () =>
    import('@/components/ui/shadcn-io/minimal-tiptap').then((mod) => ({
      default: mod.MinimalTiptap,
    })),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-md" />,
    ssr: false, // L'éditeur nécessite le DOM
  },
)

// Wrapper qui préserve les types et forward la ref
const MinimalTiptap = React.forwardRef<MinimalTiptapHandle, MinimalTiptapProps>((props, ref) => {
  return <MinimalTiptapComponent {...props} ref={ref} />
})

MinimalTiptap.displayName = 'MinimalTiptap'

export { MinimalTiptap }
export type { MinimalTiptapHandle, MinimalTiptapProps }
