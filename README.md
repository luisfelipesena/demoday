# 🚀 Demoday - Plataforma de Competição Acadêmica

![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.3-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-0.39.0-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 📋 Visão Geral

**Demoday** é uma plataforma web completa para gerenciamento de competições acadêmicas, onde estudantes de graduação e pós-graduação podem submeter seus projetos desenvolvidos em diferentes contextos acadêmicos (Disciplina, Iniciação Científica, TCC, Mestrado ou Doutorado) e participar de um processo estruturado de avaliação e votação pública.

### 🎯 Principais Características

- **Sistema Multi-Roles**: Três níveis de acesso (Administrador, Professor, Estudante)
- **Gestão por Fases**: Competição estruturada em 4 fases distintas
- **Avaliação Criteriosa**: Sistema de avaliação baseado em critérios customizáveis
- **Votação Pública**: Interface para votação durante fase específica
- **Dashboard Completo**: Painéis específicos para cada tipo de usuário
- **Relatórios Detalhados**: Análise completa dos resultados e avaliações

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

| Categoria          | Tecnologia           | Versão |
| ------------------ | -------------------- | ------ |
| **Framework**      | Next.js (App Router) | 15.1.6 |
| **Linguagem**      | TypeScript           | 5.0+   |
| **Banco de Dados** | PostgreSQL           | 16.3   |
| **ORM**            | Drizzle ORM          | 0.39.0 |
| **Autenticação**   | Better Auth          | 1.2.5  |
| **Estilização**    | Tailwind CSS         | 4.0.6  |
| **UI Components**  | Shadcn/ui            | -      |
| **Query Client**   | TanStack Query       | 5.66.0 |
| **Email**          | Nodemailer           | 6.10.1 |
| **Validação**      | Zod                  | 3.24.2 |

### 📁 Estrutura do Projeto

```
demoday/
├── 📂 src/
│   ├── 📂 app/                    # App Router do Next.js
│   │   ├── 📂 api/               # Rotas da API
│   │   │   ├── 📂 auth/         # Autenticação e autorização
│   │   │   ├── 📂 demoday/      # Gestão de demodays
│   │   │   ├── 📂 projects/     # Gestão de projetos
│   │   │   ├── 📂 evaluations/  # Sistema de avaliações
│   │   │   └── 📂 reports/      # Relatórios
│   │   ├── 📂 dashboard/         # Painéis por role
│   │   │   ├── 📂 admin/        # Painel administrativo
│   │   │   ├── 📂 projects/     # Gestão de projetos
│   │   │   └── 📂 evaluations/  # Interface de avaliação
│   │   └── 📂 (auth)/           # Páginas de autenticação
│   ├── 📂 components/            # Componentes React
│   ├── 📂 hooks/                 # Custom React Hooks
│   ├── 📂 server/                # Lógica server-side
│   │   ├── 📂 db/               # Schema e configuração DB
│   │   └── auth.ts              # Configuração Better Auth
│   └── 📂 lib/                   # Utilitários
├── 📂 drizzle/                   # Migrations do banco
├── 📂 public/                    # Assets públicos
└── 📄 docker-compose.yml         # Configuração Docker
```

## 🔑 Funcionalidades por Perfil

### 👨‍💼 Administrador

- ✅ Criar e gerenciar Demodays
- ✅ Definir fases e critérios de avaliação
- ✅ Aprovar/rejeitar projetos submetidos
- ✅ Gerenciar usuários
- ✅ Visualizar relatórios completos
- ✅ Alterar status dos projetos (finalista/vencedor)

### 👨‍🏫 Professor

- ✅ Avaliar projetos com base nos critérios
- ✅ Dar notas e comentários detalhados
- ✅ Acessar relatórios de avaliação
- ✅ Visualizar todos os projetos submetidos

### 👨‍🎓 Estudante

- ✅ Submeter projetos durante fase de inscrição
- ✅ Acompanhar status das submissões
- ✅ Editar projetos (durante fase permitida)
- ✅ Votar em outros projetos (fase de votação)
- ✅ Visualizar resultados finais

## 📊 Fluxo do Demoday

```mermaid
graph LR
    A[Criação do Demoday] --> B[Fase 1: Submissão]
    B --> C[Fase 2: Avaliação]
    C --> D[Fase 3: Seleção de Finalistas]
    D --> E[Fase 4: Seleção de Vencedores]
    E --> F[Resultados Finais]
```

### Detalhamento das Fases

1. **📝 Submissão**: Estudantes submetem seus projetos
2. **⭐ Avaliação**: Professores avaliam com base nos critérios
3. **🏆 Seleção de Finalistas**: Admin seleciona os melhores avaliados
4. **🥇 Seleção de Vencedores**: Votação pública + decisão final

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js >= 20.11.0
- Docker e Docker Compose
- PostgreSQL (via Docker)

### Passo a Passo

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/demoday.git
cd demoday
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.sample .env
```

Edite o arquivo `.env` com suas configurações:

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/demoday
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=
EMAIL_USER="demoday.ic.ufba@gmail.com"
EMAIL_PASS=
```

4. **Inicie o banco de dados**

```bash
docker compose up -d
```

5. **Execute as migrations**

```bash
npm run db:push
```

6. **[Opcional] Abra o Drizzle Studio**

```bash
npm run db:studio
```

7. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

8. **Acesse a aplicação**

```
http://localhost:3000
```

## 📝 Scripts Disponíveis

| Comando               | Descrição                                 |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Inicia o servidor de desenvolvimento      |
| `npm run build`       | Gera build de produção                    |
| `npm run start`       | Inicia servidor de produção               |
| `npm run lint`        | Executa linter no código                  |
| `npm run lint:fix`    | Corrige problemas de lint automaticamente |
| `npm run db:push`     | Sincroniza schema com banco               |
| `npm run db:generate` | Gera migrations                           |
| `npm run db:migrate`  | Executa migrations                        |
| `npm run db:studio`   | Abre interface visual do banco            |
| `npm run db:drop`     | Remove todas as tabelas (CUIDADO!)        |

## 🗄️ Estrutura do Banco de Dados

### Principais Entidades

- **users**: Usuários do sistema (admin, professor, estudante)
- **projects**: Projetos criados pelos estudantes
- **demodays**: Competições/eventos
- **project_submissions**: Submissões de projetos aos demodays
- **professor_evaluations**: Avaliações dos professores
- **votes**: Votos do público


### Diagrama Simplificado

```mermaid
erDiagram
    users ||--o{ projects : creates
    users ||--o{ professor_evaluations : evaluates
    users ||--o{ votes : casts
    projects ||--o{ project_submissions : submitted_to
    demodays ||--o{ project_submissions : receives
    demodays ||--o{ demoday_phases : has
    demodays ||--o{ evaluation_criteria : defines
    project_submissions ||--o{ professor_evaluations : evaluated_by
```

## 🔒 Segurança

- ✅ Autenticação robusta com Better Auth
- ✅ Proteção de rotas baseada em roles
- ✅ Validação de dados com Zod
- ✅ Sanitização de inputs

- ✅ Rate limiting nas APIs críticas

## 🛠️ Desenvolvimento

### Convenções de Código

- **Componentes**: PascalCase (`ProjectCard.tsx`)
- **Hooks**: camelCase com prefixo 'use' (`useProjects.ts`)
- **Utilitários**: camelCase (`dateUtils.ts`)
- **Tipos**: PascalCase com sufixo adequado (`ProjectType`)

### Estrutura de Branches

- `main`: Branch principal (produção)
- `develop`: Branch de desenvolvimento
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `docs/*`: Atualizações de documentação

## 📱 Responsividade

A aplicação é totalmente responsiva, adaptando-se a:

- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch de feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Time

- **Desenvolvedor Principal**: Luis Felipe Sena
- **Instituição**: ICC UFBA (Instituto de Computação - Universidade Federal da Bahia)

## 📞 Suporte

Para suporte, envie um email para suporte@demoday.com ou abra uma issue no GitHub.

---

<div align="center">
  <p>Desenvolvido com ❤️ por ICC UFBA</p>
  <img src="/public/icc-ufba.png" alt="ICC UFBA" width="100" />
</div>
