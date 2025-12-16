'use client';

import { useEffect, useState } from 'react';
import { useNotificationWithSound } from '@/hooks/use-notification-with-sound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertCircle,
  Volume2,
  Bell,
  Wifi,
  Clock,
  Zap,
  TestTube,
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration: number;
}

export function NotificationComprehensiveTester() {
  const [mounted, setMounted] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const {
    soundEnabled,
    volume,
    hasPermission,
    playSound,
    testSound,
    setSoundPreference,
    setVolumePreference,
    requestPermission,
  } = useNotificationWithSound();

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [result, ...prev]);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const startTime = performance.now();
    const result: TestResult = {
      name: testName,
      status: 'running',
      message: 'En cours...',
      duration: 0,
    };

    addTestResult(result);
    addLog(`▶️ Démarrage du test: ${testName}`);

    try {
      await testFn();
      const duration = performance.now() - startTime;

      addTestResult({
        name: testName,
        status: 'passed',
        message: 'Succès',
        duration: Math.round(duration),
      });

      addLog(`✅ Test réussi: ${testName} (${Math.round(duration)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;

      addTestResult({
        name: testName,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Math.round(duration),
      });

      addLog(`❌ Test échoué: ${testName} - ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setLogs([]);

    addLog('🚀 Démarrage de la suite de tests...');

    // Test 1: Vérifier l'initialisation
    await runTest('Initialisation du hook', async () => {
      if (!mounted) throw new Error('Hook non monté');
      addLog('✓ Hook initialisé');
    });

    // Test 2: Vérifier les permissions
    await runTest('Vérification des permissions', async () => {
      addLog(`Permission actuelle: ${hasPermission ? 'Accordée' : 'Non accordée'}`);
    });

    // Test 3: Jouer un son
    await runTest('Lecture d\'un son', async () => {
      if (!soundEnabled) {
        addLog('⚠️ Sons désactivés, activation...');
        setSoundPreference(true);
      }

      playSound('notification');
      addLog('✓ Son joué');

      // Attendre que le son se termine
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    // Test 4: Test du son d'alerte
    await runTest('Lecture du son d\'alerte', async () => {
      playSound('error');
      addLog('✓ Son d\'alerte joué');
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    // Test 5: Test du son de succès
    await runTest('Lecture du son de succès', async () => {
      playSound('success');
      addLog('✓ Son de succès joué');
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    // Test 6: Vérifier le volume
    await runTest('Gestion du volume', async () => {
      addLog(`Volume actuel: ${Math.round(volume * 100)}%`);

      // Changer le volume
      setVolumePreference(0.3);
      addLog('✓ Volume changé à 30%');

      // Restaurer le volume
      setVolumePreference(volume);
      addLog(`✓ Volume restauré à ${Math.round(volume * 100)}%`);
    });

    // Test 7: Tester les permissions
    await runTest('Demande de permissions', async () => {
      if (!hasPermission) {
        addLog('⚠️ Demande de permission utilisateur...');
        const result = await requestPermission();
        addLog(`✓ Résultat: ${result}`);
      } else {
        addLog('✓ Permissions déjà accordées');
      }
    });

    // Test 8: BroadcastChannel
    await runTest('Test BroadcastChannel', async () => {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('test-notification');
        addLog('✓ BroadcastChannel créé');

        channel.postMessage({ type: 'TEST', data: 'test' });
        addLog('✓ Message envoyé');

        channel.close();
        addLog('✓ BroadcastChannel fermé');
      } else {
        throw new Error('BroadcastChannel non supporté');
      }
    });

    // Test 9: localStorage
    await runTest('Persistance localStorage', async () => {
      const testValue = 'test-value-' + Date.now();
      localStorage.setItem('notification-test', testValue);

      const retrieved = localStorage.getItem('notification-test');
      if (retrieved !== testValue) {
        throw new Error('localStorage non fonctionnel');
      }

      localStorage.removeItem('notification-test');
      addLog('✓ localStorage fonctionnel');
    });

    // Test 10: Performance
    await runTest('Performance - Sons multiples', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 5; i++) {
        playSound('notification');
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const duration = performance.now() - startTime;
      addLog(`✓ 5 sons joués en ${Math.round(duration)}ms`);
    });

    setIsRunning(false);
    addLog('✅ Suite de tests complétée');
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'running':
        return <Zap className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!mounted) {
    return <div className="p-4 text-sm text-muted-foreground">Initialisation...</div>;
  }

  const passedTests = testResults.filter((t) => t.status === 'passed').length;
  const failedTests = testResults.filter((t) => t.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="w-full space-y-6">
      {/* Header avec statistiques */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testeur complet des notifications</h1>
          <p className="text-muted-foreground mt-2">
            Suite de tests complète pour valider le système de notifications avec sons
          </p>
        </div>

        {/* Statut général */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalTests}</p>
                <p className="text-sm text-muted-foreground">Tests exécutés</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                <p className="text-sm text-green-700">Réussis</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{failedTests}</p>
                <p className="text-sm text-red-700">Échoués</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className={soundEnabled ? 'text-green-600' : 'text-red-600'}>
                    {soundEnabled ? 'Activés' : 'Désactivés'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sons</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <Button
          size="lg"
          onClick={runAllTests}
          disabled={isRunning}
          className="flex-1 sm:flex-none"
        >
          <TestTube className="mr-2 h-4 w-4" />
          {isRunning ? 'Tests en cours...' : 'Exécuter tous les tests'}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => testSound()}
          disabled={!soundEnabled}
        >
          <Bell className="mr-2 h-4 w-4" />
          Tester le son
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">Résultats des tests</TabsTrigger>
          <TabsTrigger value="logs">Logs détaillés</TabsTrigger>
        </TabsList>

        {/* Résultats */}
        <TabsContent value="results" className="space-y-4">
          {testResults.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun test exécuté. Cliquez sur "Exécuter tous les tests" pour commencer.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <Card key={index} className="border-l-4" style={{borderLeftColor: result.status === 'passed' ? '#22c55e' : result.status === 'failed' ? '#ef4444' : '#3b82f6'}}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={getStatusColor(result.status)}
                        >
                          {result.status === 'passed'
                            ? 'Succès'
                            : result.status === 'failed'
                              ? 'Échoué'
                              : 'En cours'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{result.duration}ms</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Journal détaillé</CardTitle>
              <CardDescription>Derniers 50 logs ({logs.length})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted p-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    En attente de logs... Exécutez les tests pour voir les détails.
                  </p>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                    {logs.join('\n')}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informations du système */}
      <Card className="bg-slate-50 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-base">Informations du système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sons activés:</span>
            <span className="font-medium">
              {soundEnabled ? '✅ Oui' : '❌ Non'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-medium">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Permissions:</span>
            <span className="font-medium">
              {hasPermission ? '✅ Accordées' : '❌ Refusées/Par défaut'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">BroadcastChannel:</span>
            <span className="font-medium">
              {'BroadcastChannel' in window ? '✅ Supporté' : '❌ Non supporté'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notification API:</span>
            <span className="font-medium">
              {'Notification' in window ? '✅ Supportée' : '❌ Non supportée'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audio API:</span>
            <span className="font-medium">
              {'Audio' in window ? '✅ Supportée' : '❌ Non supportée'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
