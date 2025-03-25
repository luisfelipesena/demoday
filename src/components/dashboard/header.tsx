import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import Image from "next/image"

export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <header className="flex h-24 items-center border-b px-6">
      <SidebarTrigger className="mr-4" />
      <Image src="/icc-ufba.png" alt="ICC UFBA" width={50} height={50} />
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm font-medium">
          {session?.user?.name} ({session?.user?.role === "user" ? "Estudante" : session?.user?.role})
        </span>
      </div>
    </header>
  )
}
