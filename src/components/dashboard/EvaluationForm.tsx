"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle } from "lucide-react"

type Criterion = {
  id: string
  name: string
  description: string
}

type ScoreEntry = {
  criteriaId: string;
  approved: boolean;
  comment: string;
};

type EvaluationFormProps = {
  criteria: Criterion[]
  onSubmit: (data: { scores: ScoreEntry[]; approvalPercentage: number }) => void
  onCancel: () => void
  isEditing?: boolean
  existingEvaluation?: any
}

export default function EvaluationForm({ criteria, onSubmit, onCancel, isEditing = false, existingEvaluation }: EvaluationFormProps) {
  const [scores, setScores] = useState<ScoreEntry[]>(() => {
    if (isEditing && existingEvaluation?.scores) {
      return criteria.map((criterion) => {
        const existingScore = existingEvaluation.scores.find((s: any) => s.criteriaId === criterion.id)
        return {
          criteriaId: criterion.id,
          approved: existingScore?.approved ?? false,
          comment: existingScore?.comment ?? "",
        }
      })
    }
    return criteria.map((criterion) => ({
      criteriaId: criterion.id,
      approved: false,
      comment: "",
    }))
  })
  
  const handleApprovalChange = (index: number, approved: boolean) => {
    const newScores = [...scores];
    const currentEntry = newScores[index];
    if (currentEntry) {
      newScores[index] = { ...currentEntry, approved };
      setScores(newScores);
    }
  }
  
  const handleCommentChange = (index: number, comment: string) => {
    const newScores = [...scores];
    const currentEntry = newScores[index];
    if (currentEntry) {
      newScores[index] = { ...currentEntry, comment };
      setScores(newScores);
    }
  }
  
  const calculateApprovalPercentage = () => {
    if (criteria.length === 0) return 0;
    const approvedCount = scores.filter(scoreEntry => scoreEntry.approved).length;
    return Math.round((approvedCount / criteria.length) * 100);
  }
  
  const handleSubmit = () => {
    onSubmit({
      scores,
      approvalPercentage: calculateApprovalPercentage(),
    })
  }

  const approvalPercentage = calculateApprovalPercentage();
  const approvedCount = scores.filter(score => score.approved).length;
  const totalCount = criteria.length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{isEditing ? "Editar Triagem" : "Critérios de Triagem"}</h2>
      <p className="text-sm text-gray-500">
        {isEditing
          ? "Edite os critérios que o projeto atende. O projeto será aprovado se atingir pelo menos 50% dos critérios."
          : "Marque os critérios que o projeto atende. O projeto será aprovado se atingir pelo menos 50% dos critérios."
        }
      </p>
      
      {criteria.map((criterion, index) => (
        <Card key={criterion.id} className="p-4">
          <div className="mb-4 space-y-1">
            <h3 className="text-base font-medium">{criterion.name}</h3>
            <p className="text-sm text-gray-500">{criterion.description}</p>
          </div>
          
          <div className="mb-4 flex items-center space-x-3">
            <Checkbox
              id={`approval-${index}`}
              checked={scores[index]?.approved ?? false}
              onCheckedChange={(checked: boolean) => handleApprovalChange(index, checked)}
            />
            <label htmlFor={`approval-${index}`} className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
              {scores[index]?.approved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">Critério atendido</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Critério não atendido</span>
                </>
              )}
            </label>
          </div>
          
          <div className="space-y-2">
            <label htmlFor={`comment-${index}`} className="text-sm font-medium">
              Comentários (opcional)
            </label>
            <Textarea
              id={`comment-${index}`}
              placeholder="Adicione comentários ou feedback sobre este critério..."
              value={scores[index]?.comment ?? ""}
              onChange={(e) => handleCommentChange(index, e.target.value)}
              rows={3}
            />
          </div>
        </Card>
      ))}
      
      <div className={`rounded-lg p-4 ${approvalPercentage >= 50 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold">Resultado da Triagem:</span>
          <div className="flex items-center space-x-2">
            <span className={`rounded-full px-3 py-1 text-lg font-bold ${
              approvalPercentage >= 50 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {approvedCount}/{totalCount} ({approvalPercentage}%)
            </span>
            {approvalPercentage >= 50 ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
        </div>
        <p className={`text-sm font-medium ${
          approvalPercentage >= 50 ? 'text-green-700' : 'text-red-600'
        }`}>
          {approvalPercentage >= 50 
            ? '✓ Projeto será aprovado na triagem' 
            : '✗ Projeto será rejeitado na triagem'
          }
        </p>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {isEditing ? "Atualizar Triagem" : "Enviar Triagem"}
        </Button>
      </div>
    </div>
  )
} 