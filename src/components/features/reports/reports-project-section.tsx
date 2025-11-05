import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportsProjectSectionProps {
  data: any[];
}

export function ReportsProjectSection({ data }: ReportsProjectSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Rapport par projet</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Statistiques détaillées par projet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          {/* Desktop view */}
          <table className="w-full text-xs sm:text-sm text-left hidden md:table">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th className="px-6 py-3">Projet</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Total heures</th>
                <th className="px-6 py-3">Heures normales</th>
                <th className="px-6 py-3">Heures sup.</th>
                <th className="px-6 py-3">Approuvé</th>
                <th className="px-6 py-3">Membres</th>
                <th className="px-6 py-3">Progression</th>
              </tr>
            </thead>
            <tbody>
              {data.map((project: any) => (
                <tr key={project.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {project.budgetHours ? `${project.budgetHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4 font-bold">{project.totalHours.toFixed(1)}h</td>
                  <td className="px-6 py-4">{project.normalHours.toFixed(1)}h</td>
                  <td className="px-6 py-4">{project.overtimeHours.toFixed(1)}h</td>
                  <td className="px-6 py-4">{project.approvedHours.toFixed(1)}h</td>
                  <td className="px-6 py-4">{project.members}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(project.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{project.progress.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {data.map((project: any) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="font-medium text-sm">{project.name}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Budget: </span>
                      <span>{project.budgetHours ? `${project.budgetHours}h` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total heures: </span>
                      <span className="font-bold">{project.totalHours.toFixed(1)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Heures normales: </span>
                      <span>{project.normalHours.toFixed(1)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Heures sup.: </span>
                      <span>{project.overtimeHours.toFixed(1)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Approuvé: </span>
                      <span>{project.approvedHours.toFixed(1)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Membres: </span>
                      <span>{project.members}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progression: </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(project.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{project.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
