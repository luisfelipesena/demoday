"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateDemodayInput, Phase, useCreateDemoday } from "@/hooks/useDemoday";
import { useSubmitCriteriaBatch } from "@/hooks/useCriteria";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NewDemodayPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { mutate: createDemoday, isPending: isCreatingDemoday } = useCreateDemoday();
  const { mutate: submitCriteria, isPending: isSubmittingCriteria } = useSubmitCriteriaBatch();

  const [name, setName] = useState("");
  const [phases, setPhases] = useState<Phase[]>([
    {
      name: "Fase 1",
      description: "A primeira fase é de submissão de projetos.",
      phaseNumber: 1,
      startDate: "",
      endDate: "",
    },
    {
      name: "Fase 2",
      description: "Na segunda fase a comissão avalia os projetos e pode aprová-los.",
      phaseNumber: 2,
      startDate: "",
      endDate: "",
    },
    {
      name: "Fase 3",
      description: "A terceira fase é de votação do público para escolha dos finalistas.",
      phaseNumber: 3,
      startDate: "",
      endDate: "",
    },
    {
      name: "Fase 4",
      description: "Na quarta fase há a votação do público para escolha dos vencedores.",
      phaseNumber: 4,
      startDate: "",
      endDate: "",
    },
  ]);

  // Registration and evaluation criteria
  const [registrationCriteria, setRegistrationCriteria] = useState<{ name: string; description: string }[]>([
    { name: "", description: "" },
  ]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<{ name: string; description: string }[]>([
    { name: "", description: "" },
  ]);

  // Form validation error
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  const isAdmin = session?.user?.role === "admin";

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Show loading during session check
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    router.push("/dashboard");
    return null;
  }

  const updatePhase = (index: number, field: keyof Phase, value: string | number) => {
    const updatedPhases = [...phases];
    updatedPhases[index] = {
      ...updatedPhases[index],
      [field]: value,
    } as Phase;
    setPhases(updatedPhases);
  };

  const updateRegistrationCriteria = (index: number, field: keyof { name: string; description: string }, value: string) => {
    const updated = [...registrationCriteria];
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as { name: string; description: string };
    setRegistrationCriteria(updated);
  };

  const updateEvaluationCriteria = (index: number, field: keyof { name: string; description: string }, value: string) => {
    const updated = [...evaluationCriteria];
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as { name: string; description: string };
    setEvaluationCriteria(updated);
  };

  const addRegistrationCriteria = () => {
    setRegistrationCriteria([...registrationCriteria, { name: "", description: "" }]);
  };

  const addEvaluationCriteria = () => {
    setEvaluationCriteria([...evaluationCriteria, { name: "", description: "" }]);
  };

  const removeRegistrationCriteria = (index: number) => {
    if (registrationCriteria.length > 1) {
      setRegistrationCriteria(registrationCriteria.filter((_, i) => i !== index));
    }
  };

  const removeEvaluationCriteria = (index: number) => {
    if (evaluationCriteria.length > 1) {
      setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (!name.trim()) {
      setError("O nome do Demoday é obrigatório");
      setIsSubmitting(false);
      return;
    }

    const invalidPhase = phases.find(
      (phase) => !phase.startDate || !phase.endDate
    );
    if (invalidPhase) {
      setError("Todas as fases precisam ter datas de início e fim");
      setIsSubmitting(false);
      return;
    }

    // Filter out empty criteria
    const validRegistrationCriteria = registrationCriteria.filter(
      (c) => c.name.trim() && c.description.trim()
    );
    
    const validEvaluationCriteria = evaluationCriteria.filter(
      (c) => c.name.trim() && c.description.trim()
    );

    if (validRegistrationCriteria.length === 0) {
      setError("Adicione pelo menos um critério de inscrição");
      setIsSubmitting(false);
      return;
    }

    // Create the demoday
    const demodayData: CreateDemodayInput = {
      name,
      phases,
    };

    createDemoday(demodayData, {
      onSuccess: (data) => {
        console.log("Demoday criado com sucesso:", data);
        
        // Now submit the criteria
        submitCriteria({
          demodayId: data.id,
          registration: validRegistrationCriteria,
          evaluation: validEvaluationCriteria,
        }, {
          onSuccess: () => {
            console.log("Critérios adicionados com sucesso");
            router.push("/admin/demoday");
          },
          onError: (error) => {
            console.error("Erro ao adicionar critérios:", error);
            setError(`Demoday criado, mas houve um erro ao adicionar critérios: ${error.message}`);
            setIsSubmitting(false);
          }
        });
      },
      onError: (error) => {
        setError(error.message);
        setIsSubmitting(false);
      },
    });
  };

  // Determine if form is submitting
  const isPending = isCreatingDemoday || isSubmittingCriteria || isSubmitting;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Criar novo demoday</h1>
        <Link
          href="/admin/demoday"
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Voltar
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Nome do Demoday */}
        <div className="space-y-4 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Nome do Demoday</h2>
          <Input
            type="text"
            placeholder="Digite o nome da nova edição do demoday"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Fases */}
        <div className="space-y-6 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Prazos</h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {phases.map((phase, index) => (
              <div
                key={index}
                className="space-y-4 rounded-lg border p-4 shadow-sm"
              >
                <h3 className="font-medium">
                  Fase {phase.phaseNumber}: {phase.name}
                </h3>
                <p className="text-sm text-gray-600">{phase.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`start-date-${index}`}
                      className="mb-1 block text-sm"
                    >
                      Início:
                    </label>
                    <Input
                      id={`start-date-${index}`}
                      type="date"
                      value={phase.startDate}
                      onChange={(e) =>
                        updatePhase(index, "startDate", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`end-date-${index}`}
                      className="mb-1 block text-sm"
                    >
                      Fim:
                    </label>
                    <Input
                      id={`end-date-${index}`}
                      type="date"
                      value={phase.endDate}
                      onChange={(e) =>
                        updatePhase(index, "endDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critérios de Inscrição */}
        <div className="space-y-4 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Critérios de inscrição</h2>
          
          <div className="space-y-4">
            {registrationCriteria.map((criteria, index) => (
              <div key={index} className="flex space-x-2">
                <div className="flex-grow space-y-2">
                  <Input
                    placeholder="Nome do critério"
                    value={criteria.name}
                    onChange={(e) =>
                      updateRegistrationCriteria(index, "name", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Descrição do critério de inscrição"
                    value={criteria.description}
                    onChange={(e) =>
                      updateRegistrationCriteria(index, "description", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRegistrationCriteria(index)}
                  className="mt-2 h-10 rounded-full bg-red-100 px-3 text-red-600 hover:bg-red-200"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            onClick={addRegistrationCriteria}
            className="w-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          >
            Adicionar critério
          </Button>
        </div>

        {/* Critérios de Avaliação */}
        <div className="space-y-4 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Critérios de avaliação</h2>
          
          <div className="space-y-4">
            {evaluationCriteria.map((criteria, index) => (
              <div key={index} className="flex space-x-2">
                <div className="flex-grow space-y-2">
                  <Input
                    placeholder="Nome do critério de avaliação"
                    value={criteria.name}
                    onChange={(e) =>
                      updateEvaluationCriteria(index, "name", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Descrição do critério"
                    value={criteria.description}
                    onChange={(e) =>
                      updateEvaluationCriteria(index, "description", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEvaluationCriteria(index)}
                  className="mt-2 h-10 rounded-full bg-red-100 px-3 text-red-600 hover:bg-red-200"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            onClick={addEvaluationCriteria}
            className="w-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          >
            Adicionar critério
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          disabled={isPending}
        >
          {isPending ? "Criando..." : "Criar Demoday"}
        </Button>
      </form>
    </div>
  );
} 