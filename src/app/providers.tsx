"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { ToastProvider, ToastViewport } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="fdcs-theme"
        themes={["light", "dark"]}
      >
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
