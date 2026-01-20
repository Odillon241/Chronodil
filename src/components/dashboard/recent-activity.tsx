'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  Activity,
  PlusCircle,
  FileEdit,
  Trash2,
  LogIn,
  UserPlus,
  CalendarDays,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface ActivityItem {
  id: string
  user: {
    name: string
    initials: string
    avatar?: string | null
  }
  action: string
  type: string
  target: string
  time: string
  createdAt: Date
}

interface RecentActivityProps {
  items?: ActivityItem[]
}

const getActionConfig = (type: string) => {
  switch (type) {
    case 'CREATE':
      return {
        icon: PlusCircle,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        borderColor: 'border-emerald-200 dark:border-emerald-900/50',
      }
    case 'UPDATE':
      return {
        icon: FileEdit,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        borderColor: 'border-amber-200 dark:border-amber-900/50',
      }
    case 'DELETE':
      return {
        icon: Trash2,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        borderColor: 'border-red-200 dark:border-red-900/50',
      }
    case 'LOGIN':
      return {
        icon: LogIn,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        borderColor: 'border-blue-200 dark:border-blue-900/50',
      }
    case 'REGISTER':
      return {
        icon: UserPlus,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        borderColor: 'border-indigo-200 dark:border-indigo-900/50',
      }
    default:
      return {
        icon: Activity,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
        borderColor: 'border-border',
      }
  }
}

const groupItemsByDate = (items: ActivityItem[]) => {
  const groups: { label: string; items: ActivityItem[] }[] = []

  // Sort items by date desc just in case
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  sortedItems.forEach((item) => {
    const date = new Date(item.createdAt)
    let label = format(date, 'd MMMM yyyy', { locale: fr })

    if (isToday(date)) {
      label = "Aujourd'hui"
    } else if (isYesterday(date)) {
      label = 'Hier'
    }

    const existingGroup = groups.find((g) => g.label === label)
    if (existingGroup) {
      existingGroup.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  })

  return groups
}

export function RecentActivity({ items = [] }: RecentActivityProps) {
  // Ensure we filter out invalid items if any
  const validItems = items.filter((item) => item && item.createdAt)
  const groupedItems = groupItemsByDate(validItems)

  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Flux d'activité
            </CardTitle>
            <CardDescription>Suivi chronologique des opérations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="relative border-l-2 border-dashed border-border/60 ml-[19px] space-y-10 pb-4">
          {groupedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground ml-8">
              <Activity className="h-10 w-10 opacity-20 mb-2" />
              <p>Aucune activité récente.</p>
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.label} className="relative">
                {/* Date Header Bubble */}
                <div className="flex items-center -ml-[21px] mb-6">
                  <div className="h-10 w-10 rounded-full border-4 border-background bg-muted/50 flex items-center justify-center shadow-xs z-10 transition-transform hover:scale-110 duration-200">
                    <CalendarDays className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span className="ml-3 text-sm font-semibold text-foreground/80 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/40 shadow-xs">
                    {group.label}
                  </span>
                </div>

                <div className="space-y-4 ml-8">
                  {group.items.map((item) => {
                    const config = getActionConfig(item.type)
                    const Icon = config.icon

                    return (
                      <div key={item.id} className="relative group">
                        {/* Connecting horizontal line to main timeline */}
                        <div className="absolute -left-[34px] top-8 w-6 h-px bg-border/60 group-hover:bg-primary/50 transition-colors duration-300" />

                        <div className="relative flex flex-col sm:flex-row gap-4 p-2 transition-all duration-300 hover:translate-x-1">
                          {/* Avatar Section */}
                          <div className="flex items-start gap-4">
                            <div className="relative pt-1">
                              <UserAvatar
                                name={item.user.name}
                                avatar={item.user.avatar}
                                size="md"
                                className="border-2 border-background shadow-xs shrink-0 ring-2 ring-transparent group-hover:ring-primary/10 transition-all"
                              />
                              <div
                                className={cn(
                                  'absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-background shadow-sm flex items-center justify-center z-10',
                                  config.bg,
                                )}
                              >
                                <Icon className={cn('h-3 w-3', config.color)} />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground leading-tight">
                                    {item.user.name}
                                    <span className="text-muted-foreground font-normal mx-1">
                                      {item.action}
                                    </span>
                                    <span className="font-semibold text-foreground break-all">
                                      {item.target}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded-md border border-border/20">
                                  <Clock className="w-3 h-3 mr-1.5 opacity-70" />
                                  {format(new Date(item.createdAt), 'HH:mm')}
                                </div>
                              </div>

                              {/* Optional context or details could go here */}
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-opacity-10',
                                    config.bg,
                                    config.color,
                                  )}
                                >
                                  {item.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
