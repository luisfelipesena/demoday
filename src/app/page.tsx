"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { client } from "@/lib/client"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { useMutation, useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

export default function HomePage() {
  const [content, setContent] = useState("")

  const { data: post, refetch } = useQuery({
    queryKey: ["post"],
    queryFn: async () => {
      const response = await client.post.recent.$get()
      const json = await response.json()
      return json
    },
  })

  const { mutate: createNote, isPending } = useMutation({
    mutationFn: (content: string) => client.post.create.$post({ name: content }),
    onSuccess: () => {
      setContent("")
      refetch()
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim()) return
    createNote(content)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-bold">Welcome to Next.js Template</h1>

      <SignedIn>
        <Link href="/dashboard" className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
          Go to Dashboard
        </Link>
      </SignedIn>

      <div className="w-full max-w-lg space-y-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a note..."
            className="flex-1"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add Note"}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <div key={post?.id} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p>{post?.name}</p>
        </div>
      </div>

      <SignedOut>
        <div className="flex gap-4">
          <Button variant="outline">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button variant="outline">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </SignedOut>
    </div>
  )
}
