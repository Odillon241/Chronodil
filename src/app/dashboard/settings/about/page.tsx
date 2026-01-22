'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Info,
  ExternalLink,
  FileText,
  Code2,
  Shield,
  Cpu,
  Database,
  Globe,
  Heart,
  Github,
  Copy,
  Check,
} from 'lucide-react'
import { getVersionInfo } from '@/lib/version'
import { useState } from 'react'
import { toast } from 'sonner'

const versionInfo = getVersionInfo()

const techStack = [
  { name: 'Next.js', version: '16.1', icon: Globe, description: 'Framework React' },
  { name: 'React', version: '19.2', icon: Code2, description: 'Bibliothèque UI' },
  { name: 'TypeScript', version: '5.9', icon: FileText, description: 'Typage statique' },
  { name: 'Prisma', version: '6.17', icon: Database, description: 'ORM Database' },
  { name: 'Supabase', version: '2.91', icon: Shield, description: 'Backend-as-a-Service' },
  { name: 'Tailwind CSS', version: '4.0', icon: Cpu, description: 'Framework CSS' },
]

const links = [
  {
    title: 'Documentation',
    href: '/docs',
    icon: FileText,
    description: 'Guide utilisateur et API',
  },
  {
    title: 'Changelog',
    href: 'https://github.com/odillon/chronodil-app/blob/main/CHANGELOG.md',
    icon: FileText,
    description: 'Historique des versions',
    external: true,
  },
  {
    title: 'Signaler un bug',
    href: 'https://github.com/odillon/chronodil-app/issues',
    icon: Github,
    description: 'Ouvrir une issue GitHub',
    external: true,
  },
]

export default function AboutPage() {
  const [copied, setCopied] = useState(false)

  const handleCopyVersion = async () => {
    try {
      const info = `Chronodil ${versionInfo.formattedVersion}
Environment: ${versionInfo.nodeEnv}
Build Date: ${versionInfo.buildDate}`
      await navigator.clipboard.writeText(info)
      setCopied(true)
      toast.success('Informations copiées')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erreur lors de la copie')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">À propos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Informations sur l'application et les technologies utilisées
        </p>
      </div>

      {/* Version Info Card */}
      <Card className="overflow-hidden border shadow-none bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{versionInfo.name}</CardTitle>
                <CardDescription className="text-base">{versionInfo.description}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm font-mono">
              {versionInfo.formattedVersion}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="text-xs text-muted-foreground mb-1">Version</div>
              <div className="font-mono font-semibold">{versionInfo.version}</div>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="text-xs text-muted-foreground mb-1">Environnement</div>
              <div className="font-mono font-semibold capitalize">{versionInfo.nodeEnv}</div>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="text-xs text-muted-foreground mb-1">Build</div>
              <div className="font-mono font-semibold">{versionInfo.buildDate}</div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleCopyVersion} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié' : 'Copier les infos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Technologies
          </CardTitle>
          <CardDescription>Stack technique de l'application</CardDescription>
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
            {techStack.map((tech, index) => (
              <div
                key={tech.name}
                className={`p-4 hover:bg-muted/30 transition-colors ${
                  index >= 3 ? 'sm:border-t border-border/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background border shadow-sm">
                    <tech.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{tech.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {tech.version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tech.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Liens utiles
          </CardTitle>
          <CardDescription>Documentation et ressources</CardDescription>
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          <div className="divide-y divide-border/50">
            {links.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {link.title}
                    </span>
                    {link.external && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p className="flex items-center justify-center gap-1">
          Fait avec <Heart className="h-4 w-4 text-red-500 fill-red-500" /> par{' '}
          <span className="font-semibold">{versionInfo.author}</span>
        </p>
        <p>&copy; {new Date().getFullYear()} Chronodil. Tous droits réservés.</p>
      </div>
    </div>
  )
}
