"use client"

import Link from "next/link"
import { ArrowRight, Award, BookOpen, Calendar, GraduationCap, Users, Clock, FileText, Vote, Trophy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingPageHeader } from "@/components/landing-page/header"
import { LandingPageFooter } from "@/components/landing-page/footer"
import { useActiveDemoday } from "@/hooks/useDemoday"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getCurrentPhaseInfo(demoday: any) {
  if (!demoday?.phases) return null
  
  const now = new Date()
  
  for (const phase of demoday.phases) {
    const startDate = new Date(phase.startDate)
    const endDate = new Date(phase.endDate)
    
    if (now >= startDate && now <= endDate) {
      return {
        phase,
        status: 'active',
        message: `${phase.name} em andamento`
      }
    }
    
    if (now < startDate) {
      return {
        phase,
        status: 'upcoming',
        message: `Próxima fase: ${phase.name}`
      }
    }
  }
  
  return {
    phase: null,
    status: 'finished',
    message: 'Demoday finalizado'
  }
}

function getPhaseIcon(phaseNumber: number, isActive: boolean, isCompleted: boolean) {
  const iconProps = {
    className: `h-4 w-4 ${isActive ? 'text-white' : isCompleted ? 'text-green-600' : 'text-gray-400'}`
  }
  
  switch (phaseNumber) {
    case 1:
      return <FileText {...iconProps} />
    case 2:
      return <Users {...iconProps} />
    case 3:
      return <Vote {...iconProps} />
    case 4:
      return <Trophy {...iconProps} />
    default:
      return <Calendar {...iconProps} />
  }
}

function getPhaseColor(phaseNumber: number, isActive: boolean, isCompleted: boolean) {
  if (isActive) {
    return 'bg-gradient-to-r from-blue-500 to-purple-600'
  }
  if (isCompleted) {
    return 'bg-gradient-to-r from-green-500 to-emerald-600'
  }
  
  switch (phaseNumber) {
    case 1:
      return 'bg-gradient-to-r from-blue-400 to-blue-500'
    case 2:
      return 'bg-gradient-to-r from-purple-400 to-purple-500'
    case 3:
      return 'bg-gradient-to-r from-orange-400 to-orange-500'
    case 4:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
    default:
      return 'bg-gray-300'
  }
}

function getPhaseName(phaseNumber: number): string {
  switch (phaseNumber) {
    case 1:
      return 'Fase 1: Submissão de projetos'
    case 2:
      return 'Fase 2: Triagem'
    case 3:
      return 'Fase 3: Votação para a final'
    case 4:
      return 'Fase 4: Evento principal (final)'
    default:
      return `Fase ${phaseNumber}`
  }
}

export default function LandingPage() {
  const { data: activeDemoday, isLoading: isLoadingDemoday } = useActiveDemoday()
  const currentPhaseInfo = activeDemoday ? getCurrentPhaseInfo(activeDemoday) : null

  const getPhaseStatus = (phase: any) => {
    if (!activeDemoday) return { isActive: false, isCompleted: false }
    
    const now = new Date()
    const startDate = new Date(phase.startDate)
    const endDate = new Date(phase.endDate)
    
    const isActive = now >= startDate && now <= endDate
    const isCompleted = now > endDate
    
    return { isActive, isCompleted }
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
                    Apresente seu projeto no {activeDemoday?.name || "Demoday"}
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
                <div className="relative h-[450px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-lg">
                  {activeDemoday ? (
                    <div className="p-6 h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{activeDemoday.name}</h2>
                        
                        {currentPhaseInfo && (
                          <Badge 
                            variant="secondary"
                            className={`${
                              currentPhaseInfo.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : currentPhaseInfo.status === 'finished'
                                ? 'bg-gray-100 text-gray-800 border-gray-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {currentPhaseInfo.message}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Timeline */}
                      <div className="flex-1 relative">
                        <div className="space-y-4">
                          {activeDemoday.phases?.slice(0, 4).map((phase, index) => {
                            const { isActive, isCompleted } = getPhaseStatus(phase)
                            const isLast = index === activeDemoday.phases.length - 1
                            
                            return (
                              <div key={phase.id} className="relative flex items-start">
                                {/* Timeline line */}
                                {!isLast && (
                                  <div className="absolute left-5 top-10 w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-200" />
                                )}
                                
                                {/* Phase indicator */}
                                <div className={`
                                  relative z-10 flex items-center justify-center w-10 h-10 rounded-full 
                                  ${getPhaseColor(phase.phaseNumber, isActive, isCompleted)}
                                  shadow-lg transform transition-all duration-300
                                  ${isActive ? 'scale-110 shadow-xl' : ''}
                                `}>
                                  {getPhaseIcon(phase.phaseNumber, isActive, isCompleted)}
                                  
                                  {/* Active pulse effect */}
                                  {isActive && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20" />
                                  )}
                                  
                                  {/* Completed check */}
                                  {isCompleted && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Phase content */}
                                <div className="ml-4 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className={`text-sm font-semibold ${
                                      isActive ? 'text-purple-700' : isCompleted ? 'text-green-700' : 'text-gray-700'
                                    }`}>
                                      {getPhaseName(phase.phaseNumber)}
                                    </h3>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Demoday 2025</h2>
                          <p className="text-gray-600">
                            {isLoadingDemoday ? 'Carregando informações...' : 'Aguarde novidades em breve!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Como funciona</h2>
              <p className="max-w-none leading-normal text-muted-foreground sm:text-lg sm:leading-7">
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
                <p className="text-muted-foreground">Cadastre seu projeto com título, descrição e tipo.</p>
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
                <h3 className="text-xl font-bold">Apresentação</h3>
                <p className="text-muted-foreground">Os projetos mais votados são anunciados e apresentados.</p>
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
