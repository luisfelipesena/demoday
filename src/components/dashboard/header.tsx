import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import Image from "next/image"

export function DashboardHeader() {
  const { data: session, isPending: loading } = useSession()
  const user = session?.user

  return (
    <header className="flex h-24 items-center border-b px-6">
      <SidebarTrigger className="mr-4" />
      <Image src="/icc-ufba.png" alt="ICC UFBA" width={50} height={50} />
      <div className="ml-auto flex items-center gap-4">
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <span className="text-sm font-medium">
            {user?.name} ({user?.role === "user" ? "Estudante" : user?.role})
          </span>
        )}
      </div>
    </header>
  )
}
