"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

type Criterion = {
  id: string
  name: string
  description: string
}

type EvaluationFormProps = {
  criteria: Criterion[]
  onSubmit: (data: { scores: Array<{ criteriaId: string; score: number; comment?: string }>; totalScore: number }) => void
  onCancel: () => void
}

export default function EvaluationForm({ criteria, onSubmit, onCancel }: EvaluationFormProps) {
  const [scores, setScores] = useState<Array<{ criteriaId: string; score: number; comment: string }>>(() =>
    criteria.map((criterion) => ({
      criteriaId: criterion.id,
      score: 5, // Default score in the middle (scale 0-10)
      comment: "",
    }))
  )
  
  const handleScoreChange = (index: number, value: number[]) => {
    const newScores = [...scores]
    newScores[index] = { ...newScores[index], score: value[0] }
    setScores(newScores)
  }
  
  const handleCommentChange = (index: number, comment: string) => {
    const newScores = [...scores]
    newScores[index] = { ...newScores[index], comment }
    setScores(newScores)
  }
  
  const calculateTotalScore = () => {
    const sum = scores.reduce((total, score) => total + score.score, 0)
    return Math.round((sum / (criteria.length * 10)) * 100) // Calculate percentage
  }
  
  const handleSubmit = () => {
    onSubmit({
      scores,
      totalScore: calculateTotalScore(),
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Evaluation Criteria</h2>
      <p className="text-sm text-gray-500">
        Rate each criterion on a scale of 0-10. You may add optional comments for each criterion.
      </p>
      
      {criteria.map((criterion, index) => (
        <Card key={criterion.id} className="p-4">
          <div className="mb-2 space-y-1">
            <h3 className="text-base font-medium">{criterion.name}</h3>
            <p className="text-sm text-gray-500">{criterion.description}</p>
          </div>
          
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score:</span>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
                {scores[index]?.score || 0}/10
              </span>
            </div>
            
            <Slider
              defaultValue={[5]}
              max={10}
              step={1}
              value={[scores[index]?.score || 0]}
              onValueChange={(value) => handleScoreChange(index, value)}
              className="py-4"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 - Inadequate</span>
              <span>5 - Average</span>
              <span>10 - Excellent</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor={`comment-${index}`} className="text-sm font-medium">
              Comments (optional)
            </label>
            <Textarea
              id={`comment-${index}`}
              placeholder="Add any additional comments or feedback regarding this criterion..."
              value={scores[index]?.comment || ""}
              onChange={(e) => handleCommentChange(index, e.target.value)}
              rows={3}
            />
          </div>
        </Card>
      ))}
      
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold">Overall Score:</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-lg font-bold text-blue-800">
            {calculateTotalScore()}%
          </span>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Submit Evaluation
        </Button>
      </div>
    </div>
  )
} 