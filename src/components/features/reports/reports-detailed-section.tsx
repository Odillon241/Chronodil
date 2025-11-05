import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ReportsDetailedSectionProps {
  data: any[];
}

export function ReportsDetailedSection({ data }: ReportsDetailedSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Rapport détaillé</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Toutes les saisies pour la période
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          {/* Desktop view */}
          <table className="w-full text-xs sm:text-sm text-left hidden md:table">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Utilisateur</th>
                <th className="px-6 py-3">Projet</th>
                <th className="px-6 py-3">Tâche</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Durée</th>
                <th className="px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry: any) => (
                <tr key={entry.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-4">{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4">{entry.User.name}</td>
                  <td className="px-6 py-4">{entry.Project?.name || 'Projet non assigné'}</td>
                  <td className="px-6 py-4">{entry.Task?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="text-xs">
                      {entry.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">{entry.duration}h</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        entry.status === 'APPROVED'
                          ? 'default'
                          : entry.status === 'SUBMITTED'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-xs"
                    >
                      {entry.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {data.map((entry: any) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span className="font-medium">
                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Utilisateur: </span>
                      <span>{entry.User.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Projet: </span>
                      <span>{entry.Project?.name || 'Projet non assigné'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tâche: </span>
                      <span>{entry.Task?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type: </span>
                      <Badge variant="secondary" className="text-xs">
                        {entry.type}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durée: </span>
                      <span className="font-bold">{entry.duration}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Statut: </span>
                      <Badge
                        variant={
                          entry.status === 'APPROVED'
                            ? 'default'
                            : entry.status === 'SUBMITTED'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-xs"
                      >
                        {entry.status}
                      </Badge>
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
