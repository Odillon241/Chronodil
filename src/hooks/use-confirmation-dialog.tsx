"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationDialogProps {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  onCancel?: () => void
}

export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogProps, setDialogProps] = useState<ConfirmationDialogProps | null>(null)

  const showConfirmation = (props: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    onConfirm: () => void
    onCancel?: () => void
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogProps({
        ...props,
        confirmText: props.confirmText || "Confirmer",
        cancelText: props.cancelText || "Annuler",
        variant: props.variant || "default",
        onConfirm: () => {
          setIsOpen(false)
          props.onConfirm()
          resolve(true)
        },
        onCancel: () => {
          setIsOpen(false)
          if (props.onCancel) {
            props.onCancel()
          }
          resolve(false)
        },
      })
      setIsOpen(true)
    })
  }

  const ConfirmationDialog = () => {
    if (!dialogProps) return null

    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogProps.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogProps.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={dialogProps.onCancel}>
              {dialogProps.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={dialogProps.onConfirm}
              className={dialogProps.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {dialogProps.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return {
    showConfirmation,
    ConfirmationDialog,
  }
}
