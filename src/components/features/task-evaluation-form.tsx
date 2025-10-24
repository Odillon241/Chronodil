'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MinimalTiptap } from '@/components/ui/shadcn-io/minimal-tiptap';
import { Button } from '@/components/ui/button';
import { TrainingLevel, MasteryLevel, UnderstandingLevel } from '@prisma/client';

interface TaskEvaluationFormProps {
  trainingLevel?: TrainingLevel | null;
  masteryLevel?: MasteryLevel | null;
  understandingLevel?: UnderstandingLevel | null;
  evaluationNotes?: string | null;
  onEvaluationChange?: (data: {
    trainingLevel?: TrainingLevel | null;
    masteryLevel?: MasteryLevel | null;
    understandingLevel?: UnderstandingLevel | null;
    evaluationNotes?: string;
  }) => void;
  isReadOnly?: boolean;
}

const trainingLevels: TrainingLevel[] = ['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const masteryLevels: MasteryLevel[] = ['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const understandingLevels: UnderstandingLevel[] = [
  'NONE',
  'SUPERFICIAL',
  'WORKING',
  'COMPREHENSIVE',
  'EXPERT',
];

const trainingLevelLabels: Record<TrainingLevel, string> = {
  NONE: 'Aucune formation',
  BASIC: 'Formation basique',
  INTERMEDIATE: 'Formation intermédiaire',
  ADVANCED: 'Formation avancée',
  EXPERT: 'Formation experte',
};

const masteryLevelLabels: Record<MasteryLevel, string> = {
  NOVICE: 'Novice',
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert',
};

const understandingLevelLabels: Record<UnderstandingLevel, string> = {
  NONE: 'Aucune compréhension',
  SUPERFICIAL: 'Compréhension superficielle',
  WORKING: 'Compréhension fonctionnelle',
  COMPREHENSIVE: 'Compréhension complète',
  EXPERT: 'Compréhension experte',
};

export function TaskEvaluationForm({
  trainingLevel,
  masteryLevel,
  understandingLevel,
  evaluationNotes,
  onEvaluationChange,
  isReadOnly = false,
}: TaskEvaluationFormProps) {
  const [localTrainingLevel, setLocalTrainingLevel] = useState<TrainingLevel | null | undefined>(
    trainingLevel
  );
  const [localMasteryLevel, setLocalMasteryLevel] = useState<MasteryLevel | null | undefined>(
    masteryLevel
  );
  const [localUnderstandingLevel, setLocalUnderstandingLevel] = useState<
    UnderstandingLevel | null | undefined
  >(understandingLevel);
  const [localNotes, setLocalNotes] = useState(evaluationNotes || '');

  // Synchroniser l'état local avec les props quand elles changent
  useEffect(() => {
    setLocalTrainingLevel(trainingLevel);
    setLocalMasteryLevel(masteryLevel);
    setLocalUnderstandingLevel(understandingLevel);
    setLocalNotes(evaluationNotes || '');
  }, [trainingLevel, masteryLevel, understandingLevel, evaluationNotes]);

  const handleSave = () => {
    onEvaluationChange?.({
      trainingLevel: localTrainingLevel,
      masteryLevel: localMasteryLevel,
      understandingLevel: localUnderstandingLevel,
      evaluationNotes: localNotes,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Formation Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Niveau de Formation</label>
          <Select
            value={localTrainingLevel || 'NONE'}
            onValueChange={(value) => setLocalTrainingLevel(value as TrainingLevel)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {trainingLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {trainingLevelLabels[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">Formation nécessaire pour la tâche</p>
        </div>

        {/* Mastery Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Niveau de Maîtrise</label>
          <Select
            value={localMasteryLevel || 'NOVICE'}
            onValueChange={(value) => setLocalMasteryLevel(value as MasteryLevel)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {masteryLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {masteryLevelLabels[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">Maîtrise du collaborateur</p>
        </div>

        {/* Understanding Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Niveau de Compréhension</label>
          <Select
            value={localUnderstandingLevel || 'NONE'}
            onValueChange={(value) => setLocalUnderstandingLevel(value as UnderstandingLevel)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {understandingLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {understandingLevelLabels[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">Compréhension de la tâche</p>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes d'Évaluation</label>
        <MinimalTiptap
          content={localNotes || ''}
          onChange={(content) => setLocalNotes(content)}
          placeholder="Ajouter des commentaires sur la performance et les domaines d'amélioration..."
          editable={!isReadOnly}
          className="min-h-[250px]"
        />
        <p className="text-xs text-slate-500">Observations et recommandations pour le collaborateur</p>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={handleSave} variant="default" size="sm">
            Enregistrer l'Évaluation
          </Button>
        </div>
      )}
    </div>
  );
}
