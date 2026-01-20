'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  FolderKanban,
  ArrowUpDown,
  Archive,
  RotateCcw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Project } from '@/types/project.types'

interface ProjectsListProps {
  projects: Project[]
  onView: (project: Project) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onArchive: (project: Project) => void
  onManageTeam: (project: Project) => void
  onClone: (project: Project) => void
  canDelete: (project: Project) => boolean
  sortField: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: any) => void
  currentUser?: any
}

export function ProjectsList({
  projects,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onManageTeam,
  onClone,
  canDelete,
  sortField: _sortField,
  sortOrder: _sortOrder,
  onSortChange,
}: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed hover:bg-muted/20 transition-colors h-64">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FolderKanban className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Aucun projet trouvé</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Essayez de modifier vos filtres ou créez un nouveau projet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead
              className="w-[100px] cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSortChange('code')}
            >
              <div className="flex items-center gap-1">
                Code
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSortChange('name')}
            >
              <div className="flex items-center gap-1">
                Projet
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSortChange('department')}
            >
              <div className="flex items-center gap-1">
                Département
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSortChange('budgetHours')}
            >
              <div className="flex items-center justify-center gap-1">
                Budget
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSortChange('progress')}
            >
              <div className="flex items-center gap-1">
                Prog.
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSortChange('createdAt')}
            >
              <div className="flex items-center gap-1">
                Créé le
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const progress =
              project.budgetHours && project.usedHours
                ? (project.usedHours / project.budgetHours) * 100
                : 0

            return (
              <TableRow key={project.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-xs text-muted-foreground">
                  {project.code}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: project.color || '#ccc' }}
                      />
                      <span
                        className="font-medium text-sm truncate max-w-[200px]"
                        title={project.name}
                      >
                        {project.name}
                      </span>
                    </div>
                    {project.startDate && project.endDate && (
                      <span className="text-xs text-muted-foreground mt-0.5 ml-4">
                        {format(new Date(project.startDate), 'dd MMM', { locale: fr })} -{' '}
                        {format(new Date(project.endDate), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {project.Department ? (
                    <Badge variant="outline" className="font-normal text-xs">
                      {project.Department.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {project.budgetHours ? (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {project.usedHours?.toFixed(0) || 0} / {project.budgetHours}h
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.budgetHours ? (
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            progress > 100
                              ? 'bg-destructive'
                              : progress > 85
                                ? 'bg-amber-500'
                                : 'bg-green-500',
                          )}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={project.isActive ? 'default' : 'secondary'}
                    className="text-xs font-normal"
                  >
                    {project.isActive ? 'Actif' : 'Archivé'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManageTeam(project)}>
                        <Users className="mr-2 h-4 w-4" />
                        Équipe
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onClone(project)}>
                        <FolderKanban className="mr-2 h-4 w-4" />
                        Cloner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onArchive(project)}>
                        {project.isActive ? (
                          <>
                            <Archive className="mr-2 h-4 w-4" />
                            Archiver
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réactiver
                          </>
                        )}
                      </DropdownMenuItem>
                      {canDelete(project) && (
                        <DropdownMenuItem
                          onClick={() => onDelete(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper util
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
