"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// If you are using standard typescript with the library, you might need this type:
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}