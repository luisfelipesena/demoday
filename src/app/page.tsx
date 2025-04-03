"use client"

import Link from "next/link"
import { ArrowRight, Award, BookOpen, Calendar, GraduationCap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingPageHeader } from "@/components/landing-page/header"
import { LandingPageFooter } from "@/components/landing-page/footer"

export default function LandingPage() {
  const onClick = async () => {
    try {
      const response = await fetch("/api/db/run-migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        console.log("Migrations executed successfully")
        alert("Migrations executed successfully")
      } else {
        const error = await response.json()
        console.error("Failed to run migrations:", error)
        alert(`Failed to run migrations: ${error.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error triggering migrations:", error)
      alert(`Error triggering migrations: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LandingPageHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto flex flex-col items-center justify-center px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Apresente seu projeto no Demoday
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Submeta seu projeto acadêmico e participe da votação para escolher os mais interessantes.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-1.5">
                      Participar agora
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#about">
                    <Button size="lg" variant="outline">
                      Saiba mais
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[450px] w-full overflow-hidden rounded-xl bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted-foreground/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="space-y-2 text-center">
                      <GraduationCap className="mx-auto h-16 w-16 text-primary" />
                      <h2 className="text-2xl font-bold">Demoday 2025</h2>
                      <p className="text-muted-foreground">Inscrições abertas</p>
                      <Button onClick={onClick}>Migrations</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="w-full bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container mx-auto flex flex-col items-center justify-center px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Sobre o Demoday</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                O Demoday é um evento no qual estudantes de graduação e pós-graduação podem submeter os seus projetos
                desenvolvidos em Disciplina, Iniciação Científica, TCC, Mestrado ou Doutorado e participar de uma
                votação para o público escolher os mais interessantes.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:gap-8 mt-12">
              <div className="relative overflow-hidden rounded-lg border bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Projetos Acadêmicos</h3>
                <p className="mt-2 text-muted-foreground">
                  Submeta projetos de Disciplina, IC, TCC, Mestrado ou Doutorado.
                </p>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Avaliação</h3>
                <p className="mt-2 text-muted-foreground">
                  Professores e público votam nos projetos mais interessantes.
                </p>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Premiação</h3>
                <p className="mt-2 text-muted-foreground">Os melhores projetos são reconhecidos e premiados.</p>
              </div>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto flex flex-col items-center justify-center px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Como Funciona</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Conheça o processo de participação no Demoday
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16 mt-12">
              <div className="flex flex-col items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <h3 className="text-xl font-bold">Cadastro</h3>
                <p className="text-muted-foreground">Crie sua conta como estudante, professor ou administrador.</p>
              </div>
              <div className="flex flex-col items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <h3 className="text-xl font-bold">Submissão</h3>
                <p className="text-muted-foreground">Cadastre seu projeto com título, descrição e categoria.</p>
              </div>
              <div className="flex flex-col items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <h3 className="text-xl font-bold">Avaliação</h3>
                <p className="text-muted-foreground">Professores e público avaliam os projetos submetidos.</p>
              </div>
              <div className="flex flex-col items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <h3 className="text-xl font-bold">Resultados</h3>
                <p className="text-muted-foreground">Os projetos mais votados são anunciados e premiados.</p>
              </div>
            </div>
            <div className="mt-12 flex justify-center">
              <Link href="/register">
                <Button size="lg">Participar agora</Button>
              </Link>
            </div>
          </div>
        </section>
        <section id="projects" className="w-full bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container mx-auto flex flex-col items-center justify-center px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Projetos em Destaque</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Conheça alguns dos projetos que já participaram do Demoday
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg border bg-background">
                  <div className="aspect-video w-full bg-muted"></div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold">Projeto Exemplo {i}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Descrição breve do projeto exemplo {i} que participou do Demoday.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Demoday 2023</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Ver todos os projetos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingPageFooter />
    </div>
  )
}
