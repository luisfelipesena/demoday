"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderPlus } from "lucide-react"

export default function ProjectsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now, we're redirecting to the dashboard since this feature is not yet implemented
    // In the future, this page will allow users to view and manage their projects
    if (session?.user) {
      // Instead of immediately redirecting, we'll show a message and provide a button
      setLoading(false)
    } else if (session === null) {
      router.push("/login")
    }
  }, [session, router])

  const goToDashboard = () => {
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Projects</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Button onClick={() => router.push("/dashboard/projects/new")}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects Management</CardTitle>
          <CardDescription>
            This feature is coming soon. Here you will be able to manage all your projects
            and submit them to active Demodays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            The projects management feature is under development. Soon you&apos;ll be able to:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Create new projects</li>
            <li>Edit existing projects</li>
            <li>Submit projects to Demodays</li>
            <li>Track evaluation status</li>
          </ul>
          <Button variant="outline" onClick={goToDashboard}>
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
