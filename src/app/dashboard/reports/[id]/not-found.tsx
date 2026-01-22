import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileX, ArrowLeft } from 'lucide-react'

export default function ReportNotFound() {
  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-muted p-6">
              <FileX className="h-16 w-16 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Rapport non trouvé</h1>
              <p className="text-muted-foreground max-w-md">
                Le rapport que vous recherchez n'existe pas ou vous n'avez pas la permission de le
                consulter.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild variant="default">
                <Link href="/dashboard/reports">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux rapports
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Tableau de bord</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
