# 📋 Tickets de Funcionalidades Pendentes - Demoday

## 🎯 Baseado na Análise do Cliente (Transcrição)

O cliente definiu requisitos específicos que precisam ser implementados:

### 📊 Fluxo Completo do Cliente:
1. **Período de Inscrição** (10 dias) - estudantes submetem projetos
2. **Avaliação Geral** - professores e alunos avaliam todos os projetos
3. **Seleção de Finalistas** - 3-5 projetos por categoria (baseado na votação popular)
4. **Votação Final** - no dia do evento (professores têm voto decisivo)
5. **Certificados** - apenas para quem participou de todas as etapas

---

## 🚨 **CRÍTICO - Funcionalidades Solicitadas pelo Cliente**

### TICKET-021: Tela de Gestão de Resultados Admin ⭐ **NOVO - IMPLEMENTADO**
**Descrição**: Tela administrativa completa para visualizar todos os projetos com dados detalhados, marcar vencedores e exportar dados.
**Contexto Cliente**: "não conseguimos ver nem qual o projeto que foi o vencedor. além disso, era pra ter uma tela para visualizar todos eles, os votos, as notas etc."
**Status Atual**: ✅ Implementado
**Tarefas**:
- [X] Criar página `/dashboard/admin/results` para listar demodays
- [X] Criar página `/dashboard/admin/results/[demodayId]` para gestão detalhada
- [X] API `/api/admin/demoday/[id]/detailed-results` com dados completos
- [X] API `/api/admin/project-submissions/[id]/status` para atualizar status
- [X] API `/api/admin/demoday/[id]/export` para exportar dados CSV
- [X] Interface para visualizar todos os projetos com:
  - Votos populares e finais
  - Avaliações e notas médias
  - Status atual (submitted/approved/finalist/winner)
  - Funcionalidade para marcar/desmarcar vencedores
- [X] Filtros por categoria e status
- [X] Busca por título/autor
- [X] Export completo para CSV
- [X] Estatísticas gerais do demoday
- [X] Link no sidebar admin

**Prioridade**: 🔥 **CRÍTICA - CONCLUÍDA**

### TICKET-015: Sistema de Categorias para Projetos ⭐ **NOVO**
**Descrição**: Implementar sistema de categorias customizáveis para organizar projetos.
**Contexto Cliente**: "dos cinco que vão para a final, dos cinco finalistas... de cada categoria que a gente vai criar, a gente vai selecionar três ou cinco"
**Status Atual**: ✅ Parcialmente Implementado
**Tarefas**:
- [X] Adicionar tabela `project_categories` no schema
- [X] Modificar tabela `projects` para incluir `categoryId`
- [X] Criar API para CRUD de categorias
- [X] Interface admin para gerenciar categorias
- [X] Filtros por categoria nas listagens
- [X] Validação: máximo de finalistas por categoria (API `demoday/[id]/finalists` considera `max_finalists`)

**Prioridade**: 🔥 **CRÍTICA**

### TICKET-016: Sistema de Votação Diferenciada ⭐ **NOVO**
**Descrição**: Implementar distinção entre votos de estudantes e professores com pesos diferentes.
**Contexto Cliente**: "o professor é quem vai dar o voto final... o professor vai decidir manualmente ali no final"
**Status Atual**: ✅ Implementado
**Tarefas**:
- [X] Modificar tabela `votes` para incluir `voterRole` e `voteWeight`
- [X] Criar tabela `vote_phases` (popular vs final) -> (coluna `votePhase` na tabela `votes`)
- [X] API para votação popular (fase preliminar)
- [X] API para votação final (apenas professores) (API atual já diferencia e aplica pesos)
- [X] Interface diferenciada para cada tipo de votação (Página de votação pública adapta-se à fase e role)
- [X] Cálculo de resultados com pesos diferentes (Realizado na API de Resultados `/api/demoday/[id]/results`)

**Prioridade**: 🔥 **CRÍTICA**

### TICKET-017: Geração de Certificados ⭐ **NOVO**
**Descrição**: Sistema automático de geração de certificados para participantes.
**Contexto Cliente**: "O sistema, a geração de certificados só vai ocorrer para quem teve no sistema, para quem avaliou na etapa preliminar e participou no dia presencial"
**Status Atual**: ❌ Inexistente
**Tarefas**:
- [X] Criar tabela `certificates` para rastrear certificados gerados
- [X] Adicionar campo `attendedEvent` na tabela users (`users.attended_current_event`, `certificates.attended_event`)
- [ ] Template de certificado em PDF
- [X] API `/api/certificates/generate` (Estrutura inicial criada, com MOCK para eligibility e PDF URL)
- [ ] Validação: participou da avaliação + presença no evento (Placeholders na API, necessita lógica real)
- [ ] Download de certificados na área do usuário
- [ ] Envio por email automaticamente

**Prioridade**: 🔥 **CRÍTICA**

### TICKET-018: Seleção Automática de Finalistas ⭐ **NOVO**
**Descrição**: Sistema para selecionar automaticamente finalistas baseado na votação popular.
**Contexto Cliente**: "desses 50, de cada categoria... a gente vai selecionar três ou cinco... baseado na votação popular"
**Status Atual**: ✅ Parcialmente Implementado
**Tarefas**:
- [X] Configuração de número de finalistas por categoria
- [X] API para calcular e marcar finalistas automaticamente
- [X] Interface para admin revisar seleção automática (Botão para acionar na página de detalhes do Demoday Admin)
- [ ] Notificações para finalistas selecionados
- [ ] Relatório de justificativa da seleção

**Prioridade**: 🔥 **CRÍTICA**

### TICKET-019: Formulário de Feedback/Usabilidade ⭐ **NOVO**
**Descrição**: Coletar feedback dos participantes sobre usabilidade do sistema.
**Contexto Cliente**: "a gente já manda o link para o cara responder um formulário de perguntas sobre usabilidade do sistema"
**Status Atual**: ❌ Inexistente
**Tarefas**:
- [ ] Criar tabela `user_feedback`
- [ ] Formulário de avaliação da plataforma
- [ ] API para salvar feedback
- [ ] Envio automático de link por email após evento
- [ ] Dashboard admin para visualizar feedback
- [ ] Export de dados para análise (TCC)

**Prioridade**: 🔥 **CRÍTICA**

---

## 🚨 Alta Prioridade (Funcionalidades Críticas)

### TICKET-001: Implementar Backend de Verificação de Email
**Descrição**: Criar endpoint para processar links de verificação de email enviados aos usuários.
**Contexto**: Atualmente existe a página `/verify-email` mas falta o endpoint backend para processar o token de verificação.
**Tarefas**:
- [ ] Criar endpoint `GET /api/auth/verify-email?token=xxx`
- [ ] Validar token e marcar email como verificado
- [ ] Redirecionar para página de sucesso
- [ ] Implementar expiração de tokens

### TICKET-002: Implementar Backend de Reset de Senha
**Descrição**: Criar fluxo completo de recuperação de senha.
**Contexto**: As páginas de forgot-password e reset-password existem, mas faltam os endpoints.
**Tarefas**:
- [ ] Criar endpoint `POST /api/auth/forgot-password` para solicitar reset
- [ ] Criar endpoint `POST /api/auth/reset-password` para processar novo password
- [ ] Implementar envio de email com link de reset
- [ ] Adicionar validação de token e expiração

### TICKET-003: Criar Página de Votação Pública
**Descrição**: Desenvolver interface pública para votação nos projetos durante fase específica.
**Contexto**: A API de votação existe (`/api/projects/vote`), mas falta a interface pública.
**⚠️ ATENÇÃO**: Precisa ser adaptada para o novo sistema de votação diferenciada
**Status Atual**: ✅ Parcialmente Implementado
**Tarefas**:
- [X] Criar página `/demoday/[id]/voting` acessível ao público
- [X] Exibir projetos aprovados por categoria (com filtro de categoria)
- [X] Implementar sistema de votação popular (Frontend com botão de voto e lógica básica)
- [X] Validar se está na fase correta de votação (Interface exibe status e API valida)
- [X] Limitar um voto por usuário/sessão (API valida, UI mostra status "Voted")

### TICKET-004: Criar Página de Resultados
**Descrição**: Desenvolver página pública para exibição dos resultados finais.
**Contexto**: Não existe página para mostrar vencedores e finalistas após o término do Demoday.
**⚠️ ATENÇÃO**: Precisa mostrar resultados por categoria e tipo de votação
**Status Atual**: ✅ Implementado
**Tarefas**:
- [X] Criar página `/demoday/[id]/results`
- [X] Exibir projetos por categoria (vencedores, finalistas, participantes)
- [X] Separar resultados de votação popular vs professores (API calcula `popularVoteCount` e `finalWeightedScore`)
- [X] Mostrar estatísticas de participação (Pendente - API não retorna isso ainda) -> (API retorna `overallStats` com `totalSubmittedProjects`, `totalUniqueParticipants`, `totalPopularVotes`, `totalFinalVotes`)
- [ ] Incluir avaliações agregadas (Pendente - API não retorna isso ainda)

---

## 🔧 Média Prioridade (Melhorias Importantes)

### TICKET-020: Melhorar Dashboard Admin com Novas Funcionalidades ⭐ **ATUALIZADO**
**Descrição**: Adicionar funcionalidades específicas solicitadas pelo cliente.
**Contexto**: Sidebar atual não contempla todas as necessidades do admin.
**Status Atual**: ⚠️ Parcialmente implementado
**Tarefas**:
- [ ] Adicionar link "Categorias" no menu admin
- [ ] Página de gestão de categorias
- [ ] Dashboard de finalistas por categoria
- [ ] Área de configuração de certificados
- [ ] Relatórios de feedback dos usuários

### TICKET-005: Sistema de Notificações por Email
**Descrição**: Implementar notificações automáticas para eventos importantes.
**Contexto**: O emailService existe mas não está sendo usado para notificações automáticas.
**⚠️ ATENÇÃO**: Incluir notificações específicas do cliente
**Tarefas**:
- [ ] Email de boas-vindas após registro
- [ ] Notificação quando projeto é aprovado/rejeitado
- [ ] Alerta de mudança de fase do Demoday
- [ ] Notificação para finalistas selecionados
- [ ] Email de resultado final para participantes
- [ ] Link para formulário de feedback pós-evento
- [ ] Notificação de certificado disponível

### TICKET-006: Validação Automática de Fases
**Descrição**: Implementar sistema para transição automática de fases baseada em datas.
**Contexto**: Atualmente as fases têm datas mas não há validação automática.
**⚠️ ATENÇÃO**: Cliente mencionou datas específicas (setembro 2025)
**Tarefas**:
- [ ] Criar job/cron para verificar datas das fases
- [ ] Bloquear ações fora da fase correta
- [ ] Transição automática: inscrição → avaliação → seleção → evento
- [ ] Implementar warnings quando fase está próxima do fim
- [ ] Adicionar override manual para admin

### TICKET-007: Dashboard de Analytics
**Descrição**: Criar dashboard com estatísticas e métricas do Demoday.
**Contexto**: Admins precisam visualizar métricas gerais do evento.
**⚠️ ATENÇÃO**: Incluir métricas específicas solicitadas
**Tarefas**:
- [ ] Criar endpoint `/api/analytics/demoday/[id]`
- [ ] Página `/dashboard/admin/analytics`
- [ ] Métricas: total de projetos por categoria
- [ ] Estatísticas de votação (popular vs professores)
- [ ] Participação nas avaliações
- [ ] Presença no evento (para certificados)
- [ ] Gráficos de engajamento

### TICKET-008: Funcionalidade de Export
**Descrição**: Permitir exportação de dados em diferentes formatos.
**Contexto**: Necessário para relatórios e análises externas.
**⚠️ ATENÇÃO**: Cliente mencionou uso para TCC
**Tarefas**:
- [ ] Export de projetos por categoria (CSV/Excel)
- [ ] Export de resultados de votação separados
- [ ] Export de feedback de usabilidade
- [ ] Relatório PDF do Demoday completo
- [ ] Lista de participantes elegíveis para certificado

---

## 📈 Baixa Prioridade (Nice to Have)

### TICKET-009: Sistema de Busca e Filtros
**Descrição**: Implementar busca avançada e filtros para projetos.
**Contexto**: Facilitar navegação quando houver muitos projetos.
**⚠️ ATENÇÃO**: Incluir filtros por categoria
**Tarefas**:
- [ ] Busca por título/descrição
- [ ] Filtros por tipo de projeto
- [ ] Filtros por categoria (nova funcionalidade)
- [ ] Filtros por status (submitted, finalist, winner)
- [ ] Ordenação por votos/avaliação

### TICKET-010: Rate Limiting e Segurança
**Descrição**: Implementar proteções adicionais de segurança.
**Contexto**: Prevenir abuso de APIs e ataques.
**Tarefas**:
- [ ] Rate limiting em endpoints de votação
- [ ] Proteção contra múltiplos votos
- [ ] CORS configurado para endpoints públicos
- [ ] Logs de auditoria para ações administrativas
- [ ] Backup automático antes do evento

### TICKET-011: Operações em Lote
**Descrição**: Permitir ações em múltiplos itens simultaneamente.
**Contexto**: Facilitar trabalho do admin com muitos projetos.
**Tarefas**:
- [ ] Aprovar/rejeitar múltiplos projetos
- [ ] Marcar múltiplos como finalistas
- [ ] Gerar certificados em lote
- [ ] Enviar notificações em lote

### TICKET-012: Galeria Pública de Projetos
**Descrição**: Criar página pública para visualizar todos os projetos de Demodays anteriores.
**Contexto**: Showcase permanente dos projetos desenvolvidos.
**⚠️ ATENÇÃO**: Organizar por categoria
**Tarefas**:
- [ ] Página `/gallery` ou `/projects/archive`
- [ ] Filtros por ano/demoday/categoria
- [ ] Página de detalhes do projeto público

---

## 🗄️ Atualizações de Schema Necessárias

### Baseado nos Requisitos do Cliente:

```sql
-- Nova tabela para categorias
CREATE TABLE project_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_finalists INTEGER DEFAULT 5,
  demoday_id TEXT REFERENCES demodays(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar categoria aos projetos
ALTER TABLE projects ADD COLUMN category_id TEXT REFERENCES project_categories(id);

-- Melhorar sistema de votação
ALTER TABLE votes ADD COLUMN voter_role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE votes ADD COLUMN vote_phase TEXT NOT NULL DEFAULT 'popular'; -- 'popular' ou 'final'
ALTER TABLE votes ADD COLUMN weight INTEGER DEFAULT 1;

-- Certificados
CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  demoday_id TEXT REFERENCES demodays(id),
  participated_evaluation BOOLEAN DEFAULT FALSE,
  attended_event BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback de usabilidade
CREATE TABLE user_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  demoday_id TEXT REFERENCES demodays(id),
  usability_rating INTEGER CHECK (usability_rating >= 1 AND usability_rating <= 5),
  comments TEXT,
  suggestions TEXT,
  would_participate_again BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Presença no evento
ALTER TABLE users ADD COLUMN attended_current_event BOOLEAN DEFAULT FALSE;
```

---

## 📊 **Priorização FINAL baseada no Cliente**

### 🔥 **IMPLEMENTAR IMEDIATAMENTE (MVP do Cliente)**:
1. **Sistema de Categorias** (TICKET-015)
2. **Votação Diferenciada** (TICKET-016) 
3. **Seleção de Finalistas** (TICKET-018)
4. **Página de Votação Pública atualizada** (TICKET-003)
5. **Página de Resultados por categoria** (TICKET-004)

### ⚡ **PRÓXIMA SPRINT**:
6. **Geração de Certificados** (TICKET-017)
7. **Formulário de Feedback** (TICKET-019)
8. **Sistema de Notificações** (TICKET-005)
9. **Verificação/Reset de Email** (TICKET-001, TICKET-002)

### 🚀 **FUTURAS MELHORIAS**:
10. **Dashboard Analytics atualizado** (TICKET-007)
11. **Validação de Fases** (TICKET-006)
12. **Exports atualizados** (TICKET-008)

---

## 🎯 **Situação Atual vs Requisitos do Cliente**

### ✅ **JÁ IMPLEMENTADO**:
- Sistema básico de projetos com tipos
- Avaliação por professores com critérios
- Sistema básico de votação
- Dashboard administrativo básico
- Autenticação e roles

### ❌ **FALTA IMPLEMENTAR (CRÍTICO)**:
- Categorias customizáveis para projetos
- Distinção entre votação popular e votação final
- Seleção automática de finalistas por categoria
- Geração de certificados
- Formulário de feedback de usabilidade

### ⚠️ **PRECISA ATUALIZAR**:
- Sidebar do dashboard (incluir categorias)
- APIs de votação (diferenciação de roles)
- Página de resultados (por categoria)
- Sistema de notificações (novos eventos)

---

## 💡 **Observações Importantes do Cliente**

1. **Evento em Setembro 2025**: Cliente mencionou que precisa de datas exatas para reservar auditório
2. **Período de Trabalhos**: 2024 até setembro 2025
3. **Certificados são Críticos**: Serve para carga horária complementar dos estudantes
4. **Imparcialidade**: Professor tem palavra final para evitar "voto de amizade"
5. **Feedback para TCC**: Dados de usabilidade serão usados em trabalho acadêmico
6. **Categorização é Essencial**: Cliente enfatizou "de cada categoria" múltiplas vezes

### 🎯 **Definição de "Pronto" (Atualizada)**

Para cada ticket considerar:
- [ ] Funcionalidade implementada e testada
- [ ] Tratamento de erros adequado  
- [ ] Loading states implementados
- [ ] Responsivo (mobile/desktop)
- [ ] **Documentação atualizada**
- [ ] Tipos TypeScript corretos
- [ ] **Atende especificamente ao requisito do cliente**
- [ ] **Testado com cenário de uso real (50 projetos, múltiplas categorias)**