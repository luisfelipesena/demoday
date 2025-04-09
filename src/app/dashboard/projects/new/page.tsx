"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NewProjectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para o dashboard
    router.push("/dashboard")
  }, [router])

  return null  // Não renderiza nada, apenas redireciona
}
