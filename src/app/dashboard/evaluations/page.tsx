"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Info, AlertCircle, FileText } from "lucide-react"
import EvaluationForm from "@/components/dashboard/EvaluationForm"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

// Define interfaces for the data we'll be working with
interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  authors?: string;
}

interface Submission {
  id: string;
  projectId: string;
  project: Project;
  evaluated: boolean;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
}

interface Demoday {
  id: string;
  name: string;
}

interface EvaluationsData {
  demoday: Demoday;
  submissions: Submission[];
  criteria: Criterion[];
}

export default function EvaluationsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [evaluationsData, setEvaluationsData] = useState<EvaluationsData | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  useEffect(() => {
    // Check if user is professor or admin
    if (session?.user) {
      if (session.user.role !== "professor" && session.user.role !== "admin") {
        router.push("/unauthorized")
        return
      }
      
      fetchEvaluations()
    } else if (session === null) {
      router.push("/login")
    }
  }, [session, router])

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/evaluations")
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setEvaluationsData(data)
    } catch (error) {
      console.error("Failed to fetch evaluations:", error)
      toast({
        title: "Error",
        description: "Failed to load evaluation data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartEvaluation = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsEvaluating(true)
  }

  const handleCancelEvaluation = () => {
    setSelectedSubmission(null)
    setIsEvaluating(false)
  }

  const handleSubmitEvaluation = async (evaluationData: { scores: Array<{ criteriaId: string; score: number; comment?: string }>; totalScore: number }) => {
    try {
      if (!selectedSubmission) {
        throw new Error("No submission selected")
      }

      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          ...evaluationData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit evaluation")
      }

      toast({
        title: "Success",
        description: "Evaluation submitted successfully",
      })
      
      setIsEvaluating(false)
      setSelectedSubmission(null)
      fetchEvaluations()
    } catch (error) {
      console.error("Error submitting evaluation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit evaluation. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Project Evaluations</h1>
        <div className="grid gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isEvaluating && selectedSubmission) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="outline" onClick={handleCancelEvaluation} className="mb-6">
          Back to submissions
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Evaluating: {selectedSubmission.project.title}</CardTitle>
            <CardDescription>
              {selectedSubmission.project.type} - {selectedSubmission.project.authors || "No authors specified"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm">{selectedSubmission.project.description}</p>
            {evaluationsData && (
              <EvaluationForm 
                criteria={evaluationsData.criteria} 
                onSubmit={handleSubmitEvaluation}
                onCancel={handleCancelEvaluation}
              />
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Project Evaluations</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/reports")}>
          <FileText className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>
      
      {!evaluationsData?.demoday && (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
              <p className="text-lg font-medium">No active Demoday found</p>
              <p className="text-sm text-gray-500">Contact an administrator to create a Demoday event.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {evaluationsData?.demoday && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{evaluationsData.demoday.name}</CardTitle>
              <CardDescription>
                Active Demoday - {evaluationsData.submissions.length} projects to evaluate
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending Evaluations</TabsTrigger>
              <TabsTrigger value="completed">Completed Evaluations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {evaluationsData.submissions.filter(s => !s.evaluated).length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <h3 className="text-lg font-medium">All projects evaluated!</h3>
                  <p className="text-gray-500">You have evaluated all available submissions.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {evaluationsData.submissions
                    .filter(submission => !submission.evaluated)
                    .map(submission => (
                      <Card key={submission.id} className="hover:border-primary">
                        <CardHeader>
                          <div className="flex justify-between">
                            <CardTitle className="truncate">{submission.project.title}</CardTitle>
                            <Badge>{submission.project.type}</Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {submission.project.authors || "No authors specified"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-6 line-clamp-3 text-sm">{submission.project.description}</p>
                          <Button 
                            onClick={() => handleStartEvaluation(submission)} 
                            className="w-full"
                          >
                            Evaluate
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {evaluationsData.submissions.filter(s => s.evaluated).length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Info className="mx-auto mb-2 h-8 w-8 text-blue-500" />
                  <h3 className="text-lg font-medium">No evaluations yet</h3>
                  <p className="text-gray-500">You haven&apos;t evaluated any projects yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {evaluationsData.submissions
                    .filter(submission => submission.evaluated)
                    .map(submission => (
                      <Card key={submission.id}>
                        <CardHeader>
                          <div className="flex justify-between">
                            <CardTitle className="truncate">{submission.project.title}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <Check className="mr-1 h-3 w-3" />
                              Evaluated
                            </Badge>
                          </div>
                          <CardDescription>{submission.project.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-3 text-sm">{submission.project.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
} 