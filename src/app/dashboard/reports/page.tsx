"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart as BarChartIcon, Download, FileText, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

export default function ReportsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    // Check if user is professor or admin
    if (session?.user) {
      if (session.user.role !== "professor" && session.user.role !== "admin") {
        router.push("/unauthorized")
        return
      }
      
      fetchReports()
    }
  }, [session, router])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports")
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!reportData || !reportData.evaluationSummary) return
    
    // Create CSV content
    const headers = ["Project Title", "Type", "Average Score", "Total Evaluations", ...reportData.criteria.map((c: any) => c.name)]
    const rows = reportData.evaluationSummary.map((summary: any) => {
      const criteriaScores = reportData.criteria.map((criterion: any) => {
        const criterionScore = summary.criteriaScores.find((cs: any) => cs.criteriaId === criterion.id)
        return criterionScore ? criterionScore.averageScore.toFixed(2) : "N/A"
      })
      
      return [
        summary.projectTitle,
        reportData.submissions.find((s: any) => s.id === summary.submissionId)?.project.type || "Unknown",
        summary.averageTotalScore.toFixed(2),
        summary.totalEvaluations,
        ...criteriaScores
      ]
    })
    
    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `demoday-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Success",
      description: "Report downloaded successfully",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Evaluation Reports</h1>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!reportData?.demoday) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Evaluation Reports</h1>
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <BarChartIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-lg font-medium">No report data available</p>
              <p className="text-sm text-gray-500">No active Demoday or no evaluations have been submitted yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push("/dashboard/evaluations")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Go to Evaluations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedSummary = reportData.evaluationSummary
    ? [...reportData.evaluationSummary].sort((a, b) => b.averageTotalScore - a.averageTotalScore)
    : []

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evaluation Reports</h1>
        <Button variant="outline" onClick={downloadCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{reportData.demoday.name} - Reports</CardTitle>
          <CardDescription>
            {reportData.evaluationSummary.length} project evaluations | {reportData.criteria.length} evaluation criteria
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Project Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Overall Rankings</CardTitle>
              <CardDescription>Projects ranked by average evaluation score</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Evaluations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSummary.map((summary: any, index: number) => {
                    const project = reportData.submissions.find((s: any) => s.id === summary.submissionId)?.project
                    return (
                      <TableRow key={summary.submissionId}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>{project?.title || "Unknown Project"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project?.type || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20">
                              <Progress value={summary.averageTotalScore} />
                            </div>
                            <span className="font-semibold">{summary.averageTotalScore.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{summary.totalEvaluations}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <div className="grid gap-6">
            {sortedSummary.map((summary: any) => {
              const project = reportData.submissions.find((s: any) => s.id === summary.submissionId)?.project
              return (
                <Card key={summary.submissionId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{project?.title || "Unknown Project"}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Star className="mr-1 h-3 w-3" />
                        {summary.averageTotalScore.toFixed(0)}%
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>{project?.type || "Unknown Type"}</span>
                      <span>•</span>
                      <span>{summary.totalEvaluations} evaluations</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h3 className="mb-4 text-sm font-semibold">Criteria Scores</h3>
                    <div className="space-y-3">
                      {summary.criteriaScores.map((criteriaScore: any) => {
                        const criterion = reportData.criteria.find((c: any) => c.id === criteriaScore.criteriaId)
                        return (
                          <div key={criteriaScore.criteriaId} className="grid grid-cols-[1fr_auto] gap-4">
                            <div>
                              <div className="text-sm font-medium">{criterion?.name || "Unknown Criterion"}</div>
                              <div className="text-xs text-gray-500">{criterion?.description || ""}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24">
                                <Progress value={(criteriaScore.averageScore / 10) * 100} className="h-2" />
                              </div>
                              <span className="text-sm font-medium">{criteriaScore.averageScore.toFixed(1)}/10</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 