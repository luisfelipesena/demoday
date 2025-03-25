# API DEPRECATED

Esta API está obsoleta e será removida em versões futuras.

## Migre para a nova localização

Por motivos de consistência, esta funcionalidade foi movida para:

```
/api/projects/submissions/demoday
```

A nova API oferece os mesmos recursos com uma estrutura mais consistente com o restante do sistema.

## Comparação de estrutura

### Estrutura da API

| Recurso               | API Antiga                  | Nova API                              |
| --------------------- | --------------------------- | ------------------------------------- |
| Projetos do usuário   | `/api/projects`             | `/api/projects` (mantida)             |
| Submissão de projetos | `/api/projects/submissions` | `/api/projects/submissions` (mantida) |
| Projetos do Demoday   | `/api/demoday/projects`     | `/api/projects/submissions/demoday`   |

### Como usar a nova API

```typescript
// Faça requisições para:
fetch("/api/projects/submissions/demoday?demodayId=abc123")

// Use nosso hook dedicado:
import { useDemodayProjects } from "@/hooks/useDemodayProjects"

// Em seu componente:
const { data, isLoading, error } = useDemodayProjects(demodayId, {
  status: "approved",
  type: "Mestrado",
})
```
