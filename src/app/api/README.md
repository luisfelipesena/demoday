# API Documentation

Este documento descreve a estrutura e organização dos endpoints da API do Demoday.

## Organização da API

A API está organizada seguindo os seguintes princípios:

1. Os recursos principais são agrupados pelo seu tipo (`/projects`, `/demoday`, etc.)
2. Subrecursos são aninhados conforme a relação com o recurso principal
3. Ações específicas são descritas com verbos HTTP (GET, POST, PUT, DELETE)

## Estrutura da API

### Projetos

| Endpoint             | Método | Descrição                         |
| -------------------- | ------ | --------------------------------- |
| `/api/projects`      | GET    | Listar projetos do usuário logado |
| `/api/projects`      | POST   | Criar um novo projeto             |
| `/api/projects/[id]` | GET    | Obter detalhes de um projeto      |
| `/api/projects/[id]` | PUT    | Atualizar um projeto              |
| `/api/projects/[id]` | DELETE | Excluir um projeto                |

### Submissões de Projetos

| Endpoint                            | Método | Descrição                                           |
| ----------------------------------- | ------ | --------------------------------------------------- |
| `/api/projects/submissions`         | GET    | Listar submissões do usuário logado                 |
| `/api/projects/submissions`         | POST   | Submeter um projeto a um Demoday                    |
| `/api/projects/submissions/[id]`    | GET    | Obter detalhes de uma submissão                     |
| `/api/projects/submissions/[id]`    | PUT    | Atualizar status de uma submissão                   |
| `/api/projects/submissions/[id]`    | DELETE | Remover uma submissão                               |
| `/api/projects/submissions/demoday` | GET    | Listar projetos submetidos em um Demoday específico |

### Demoday

| Endpoint                | Método | Descrição                               |
| ----------------------- | ------ | --------------------------------------- |
| `/api/demoday`          | GET    | Listar todos os demodays                |
| `/api/demoday`          | POST   | Criar um novo demoday                   |
| `/api/demoday/[id]`     | GET    | Obter detalhes de um demoday específico |
| `/api/demoday/criteria` | GET    | Obter critérios de um demoday           |
| `/api/demoday/criteria` | POST   | Criar critérios para um demoday         |
| `/api/demoday/phases`   | GET    | Obter fases de um demoday               |

### Votos

| Endpoint             | Método | Descrição                                     |
| -------------------- | ------ | --------------------------------------------- |
| `/api/projects/vote` | GET    | Verificar se o usuário já votou em um projeto |
| `/api/projects/vote` | POST   | Registrar um voto em um projeto               |
| `/api/projects/vote` | DELETE | Remover um voto                               |

## APIs Depreciadas

As seguintes APIs estão sendo depreciadas e serão removidas em versões futuras:

- `/api/demoday/projects` → Migrar para `/api/projects/submissions/demoday`

## Guias de Uso

### Para listar projetos submetidos em um Demoday

```typescript
import { useDemodayProjects } from "@/hooks/useDemodayProjects"

function ProjectsList({ demodayId }) {
  const { data, isLoading, error } = useDemodayProjects(demodayId, {
    status: "approved", // opcional
    type: "Mestrado", // opcional
  })

  // Renderização do componente
}
```

### Para submeter um projeto a um Demoday

```typescript
import { useSubmitProject } from "@/hooks/useProjects"

function SubmitProjectForm() {
  const { mutate, isPending } = useSubmitProject()

  const handleSubmit = (e) => {
    e.preventDefault()
    mutate({
      projectId: "id-do-projeto",
      demodayId: "id-do-demoday",
    })
  }

  // Renderização do formulário
}
```
