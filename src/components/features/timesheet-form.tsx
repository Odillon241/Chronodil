"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timesheetEntrySchema, type TimesheetEntryInput } from "@/lib/validations/timesheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface TimesheetFormProps {
  projects: Array<{ id: string; name: string }>;
  tasks?: Array<{ id: string; name: string; projectId: string }>;
  onSubmit: (data: TimesheetEntryInput) => Promise<void>;
  isLoading?: boolean;
  defaultDate?: Date;
}

export function TimesheetForm({
  projects,
  tasks = [],
  onSubmit,
  isLoading = false,
  defaultDate = new Date(),
}: TimesheetFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimesheetEntryInput>({
    resolver: zodResolver(timesheetEntrySchema),
    defaultValues: {
      date: defaultDate,
      type: "NORMAL",
      duration: 0,
    },
  });

  const selectedProjectId = watch("projectId");
  const filteredTasks = tasks.filter((task) => task.projectId === selectedProjectId);

  const calculateDuration = () => {
    const startTime = watch("startTime");
    const endTime = watch("endTime");

    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      const duration = (endMinutes - startMinutes) / 60;
      setValue("duration", duration > 0 ? duration : 0);
    }
  };

  const handleFormSubmit = async (data: TimesheetEntryInput) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(watch("date") ?? defaultDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={watch("date") ?? defaultDate}
                onSelect={(d: Date | undefined) => d && setValue("date", d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="project">Projet *</Label>
          <Select onValueChange={(value) => setValue("projectId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un projet" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectId && (
            <p className="text-sm text-destructive">{errors.projectId.message}</p>
          )}
        </div>
      </div>

      {filteredTasks.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="task">Tâche (optionnelle)</Label>
          <Select onValueChange={(value) => setValue("taskId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une tâche" />
            </SelectTrigger>
            <SelectContent>
              {filteredTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="startTime">Heure début</Label>
          <Input
            id="startTime"
            type="time"
            {...register("startTime")}
            onChange={(e) => {
              setValue("startTime", e.target.value);
              calculateDuration();
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Heure fin</Label>
          <Input
            id="endTime"
            type="time"
            {...register("endTime")}
            onChange={(e) => {
              setValue("endTime", e.target.value);
              calculateDuration();
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Durée (heures) *</Label>
          <Input
            id="duration"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            {...register("duration", { valueAsNumber: true })}
          />
          {errors.duration && (
            <p className="text-sm text-destructive">{errors.duration.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select onValueChange={(value: any) => setValue("type", value)} defaultValue="NORMAL">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NORMAL">Heures normales</SelectItem>
            <SelectItem value="OVERTIME">Heures supplémentaires</SelectItem>
            <SelectItem value="NIGHT">Heures de nuit</SelectItem>
            <SelectItem value="WEEKEND">Week-end</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Détails de l'activité..."
          {...register("description")}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          className="bg-rusty-red hover:bg-ou-crimson"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          {isLoading ? "Ajout..." : "Ajouter"}
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Réinitialiser
        </Button>
      </div>
    </form>
  );
}
