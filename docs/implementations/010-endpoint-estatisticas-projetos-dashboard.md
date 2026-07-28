# 010 - [Backend & Frontend]: Endpoint Dedicado de Estatísticas (GET /api/v1/Projects/Stats) e Correção dos Indicadores do Dashboard

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

O Dashboard da estação PAM apresentava uma distorção nos 4 cards de indicadores numéricos (`Total de Projetos`, `Em Produção`, `Em Revisão`, `Concluídos`). Como o Dashboard realizava a consulta dos projetos limitando a 5 itens (`pageSize=5` para a lista visual de "Projetos Recentes"), o frontend calculava os totais executando um filtro local (`projects.filter(...)`) sob o array retornado de apenas 5 itens. Consequentemente, se a estação possuísse 7, 50 ou 100 projetos gravados no banco PostgreSQL, os cards exibiam contagens parciais limitadas à primeira página.

---

## 🧠 Estratégia da Solução

1. **Criação do Endpoint Otimizado (`GET /api/v1/Projects/Stats`)**:
   - Criação da ação `[HttpGet("Stats")]` herdando do `WorkstationBaseController`.
   - Execução de consultas agregadas otimizadas (`CountAsync`) diretamente no PostgreSQL utilizando `AsNoTracking()`, sem carregar entidades pesadas na memória.
   - **Trava de Segurança RBAC**: Admins recebem a contagem consolidada de toda a estação; Editores recebem contagens filtradas apenas pelos projetos atribuídos.

2. **Consumo no Frontend React SPA**:
   - Criação do DTO em PascalCase `ProjectStats` e do método `ProjectService.getProjectStats()`.
   - Atualização do `DashboardPage.tsx` para carregar simultaneamente as estatísticas reais consolidadas e os 5 projetos recentes da lista.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10 & C# 13)
- `Media8.Workstation.Application/DTOs/ProjectStatsDto.cs`: DTO com as propriedades `TotalCount`, `InProductionCount`, `InReviewCount`, `CompletedCount`, `DraftCount` e `CancelledCount`.
- `Media8.Workstation.Api/Controllers/ProjectsController.cs`: Ação `[HttpGet("Stats")]` com RBAC por Claims JWT.
- `Media8.Workstation.UnitTests/ProjectsControllerTests.cs`: Adicionado o teste unitário `GetProjectStats_ReturnsCorrectConsolidatedCounts` (10/10 testes aprovados).

### Frontend (React SPA)
- `src/types/index.ts`: Adicionada a interface `ProjectStats`.
- `src/services/api.ts`: Adicionado `ProjectService.getProjectStats`.
- `src/pages/DashboardPage.tsx`: Integração dos dados agregados com feedback de carregamento suave (`Loader2`).

---

## 🎯 Impacto e Resultado

* **[Métricas 100% Precisas]**: Os cards do Dashboard exibem a quantidade exata real de projetos no banco de dados, independente de paginação.
* **[Desempenho Escalável]**: A consulta `CountAsync` é executada em milissegundos com `AsNoTracking()`.
* **[RBAC Preservado]**: Garantia total de que editores visualizam apenas números autorizados.
