import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportsUserSectionProps {
  data: any[];
}

export function ReportsUserSection({ data }: ReportsUserSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Rapport par utilisateur</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Statistiques détaillées par utilisateur
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          {/* Desktop view */}
          <table className="w-full text-xs sm:text-sm text-left hidden md:table">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th className="px-6 py-3">Utilisateur</th>
                <th className="px-6 py-3">Département</th>
                <th className="px-6 py-3">Rôle</th>
                <th className="px-6 py-3">Total heures</th>
                <th className="px-6 py-3">Approuvé</th>
                <th className="px-6 py-3">En attente</th>
                <th className="px-6 py-3">Taux validation</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.department}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-bold">{user.totalHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-green-600">{user.approvedHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-amber-600">{user.pendingHours.toFixed(1)}h</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${user.validationRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{user.validationRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {data.map((user: any) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Département: </span>
                      <span>{user.department}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rôle: </span>
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total heures: </span>
                      <span className="font-bold">{user.totalHours.toFixed(1)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Approuvé: </span>
                      <span className="text-green-600 font-medium">
                        {user.approvedHours.toFixed(1)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">En attente: </span>
                      <span className="text-amber-600 font-medium">
                        {user.pendingHours.toFixed(1)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taux validation: </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${user.validationRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{user.validationRate}%</span>
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
