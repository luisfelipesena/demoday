## Stack Recomendada

Para o projeto Demoday com autenticação personalizada (admin, user, professor) e PostgreSQL/Neon, recomendo:

- **Front-end**: Next.js (App Router)
- **Back-end**: API Routes no Next.js ou tRPC para tipagem end-to-end
- **ORM**: Prisma ou Drizzle (ambos se integram perfeitamente com TypeScript)
- **Autenticação**: NextAuth.js (renomeado para Auth.js) com CredentialsProvider personalizado
- **Banco de dados**: PostgreSQL no Neon (conforme já decidido)
- **Estilização**: Tailwind CSS com componentes (shadcn/ui ou similar)
- **Deployment**: Vercel

## Descrição Atualizada do Projeto

# Demoday

Demoday é uma plataforma web onde estudantes de graduação e pós-graduação podem submeter seus projetos desenvolvidos em Disciplina, Iniciação Científica, TCC, Mestrado ou Doutorado. O sistema permite que o público vote nos projetos mais interessantes.

A plataforma conta com três níveis de acesso:
- **Usuários**: Podem visualizar projetos e votar
- **Professores**: Podem avaliar e dar feedback aos projetos
- **Administradores**: Gerenciam o sistema, usuários e configurações do evento

Toda autenticação é gerenciada via back-end, com segurança robusta e persistência em banco de dados PostgreSQL.

## Próximos Passos

1. **Configuração do Projeto**:
   - Iniciar projeto Next.js com TypeScript
   - Configurar Tailwind CSS
   - Configurar ESLint e Prettier

2. **Configuração do Banco de Dados**:
   - Criar instância do PostgreSQL no Neon
   - Configurar Prisma como ORM
   - Definir schema do banco com modelos para Users, Projects, Votes, etc.

3. **Implementação da Autenticação**:
   - Configurar NextAuth.js com CredentialsProvider
   - Implementar lógica de roles (admin, user, professor)
   - Criar API endpoints para login, registro e validação de sessão
   - Implementar middleware para proteção de rotas baseado em roles

4. **Desenvolvimento do Front-end**:
   - Criar páginas de login/registro
   - Implementar dashboard para cada tipo de usuário
   - Criar interfaces para submissão e avaliação de projetos
   - Desenvolver sistema de votação

5. **Deployment e Testes**:
   - Configurar ambiente de testes
   - Realizar deploy no Vercel
   - Configurar CI/CD para automação

## How to run

1. Clone the repository
2. Run `npm install`
3. Run `docker compose up -d`
4. Run `npm run db:push`
5. Run `npm run db:studio`
6. Run `npm run dev`

