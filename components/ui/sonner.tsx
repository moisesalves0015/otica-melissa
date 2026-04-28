"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600" />,
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600" />,
        error: <OctagonXIcon className="size-4 text-rose-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-slate-600" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-none border-l-4",
          description: "group-[.toast]:text-slate-500 font-medium",
          actionButton: "group-[.toast]:bg-slate-900 group-[.toast]:text-white font-bold",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600",
          success: "group-[.toaster]:border-l-emerald-500 group-[.toaster]:bg-emerald-50/50",
          error: "group-[.toaster]:border-l-rose-500 group-[.toaster]:bg-rose-50/50",
          warning: "group-[.toaster]:border-l-amber-500 group-[.toaster]:bg-amber-50/50",
          info: "group-[.toaster]:border-l-blue-500 group-[.toaster]:bg-blue-50/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
