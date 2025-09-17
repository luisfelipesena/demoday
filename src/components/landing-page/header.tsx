import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function LandingPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center">
      <div className="container flex h-24 items-center justify-between px-6">
        <Link href="#" className="flex items-center gap-4">
          <Image src="/icc-ufba.png" alt="ICC UFBA" width={50} height={50} />
          <span className="text-xl font-bold">Demoday</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link href="#about" className="text-sm font-medium transition-colors hover:text-primary">
            Sobre
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
            Como funciona
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/admin-setup">
            <Button variant="secondary" size="sm">Admin Setup</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button>Cadastrar</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
