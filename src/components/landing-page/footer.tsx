import { GraduationCap } from "lucide-react"

export function LandingPageFooter() {
  return (
    <footer className="w-full border-t bg-background flex justify-center">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row p-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="text-lg font-bold">Demoday</span>
        </div>
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Demoday. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
