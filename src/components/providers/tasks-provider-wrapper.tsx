"use client";

import { TasksProvider } from "@/contexts/tasks-context";
import { ReactNode } from "react";

export function TasksProviderWrapper({ children }: { children: ReactNode }) {
  return <TasksProvider>{children}</TasksProvider>;
}

