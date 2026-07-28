# 006 - [Backend & Frontend]: Expurgo Definitivo de Orders, Blindagem RBAC via Claims e Paginação com Scroll Infinito

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

Com a transição conceitual da estação PAM **Media 8 | Workstation**, onde requisições comerciais não mais geram entidades "Orders" diretamente no sistema local, surgiram demandas críticas de refatoração e otimização de performance:
1. **Eliminação de Código Morto/Ambíguo**: A presença da entidade `Order` e `OrdersController` causava duplicação e erros de mapeamento no EF Core (ex: erro 500 ao incluir mídias de projetos).
2. **Segurança de Acesso RBAC por Token JWT**: Impor trava de segurança no backend onde Administradores (`Admin`) visualizam todos os projetos, enquanto Editores (`Editor`) enxergam **estritamente apenas os projetos aos quais foram designados**.
3. **Estratégia Dupla de Carregamento**:
   - **Dashboard**: Carregamento de lote recente fixo (`limit=5`) ordenado por data de criação.
   - **Página de Projetos (`/projetos`)**: Paginação oficial em lotes de 20 (`pageSize=20`) integrada a **Scroll Infinito** no frontend.

---

## 🧠 Estratégia da Solução

1. **Expurgo Completo de `Orders`**:
   - Remoção de `OrdersController.cs`, `Order.cs`, `OrderEditor.cs` e `OrderService.ts`.
   - Refatoração de `WorkstationAsset` para relacionar-se diretamente com `Project` via `ProjectId`.

2. **DTO Paginado `PagedResultDto<T>` & Claims de Autorização**:
   - Criação da classe `PagedResultDto<T>` em C# contendo `Items`, `Page`, `PageSize`, `TotalCount`, `TotalPages` e `HasNextPage`.
   - Captura do `UserId` e `Role` dos Claims do JWT Token Bearer do usuário autenticado no `ProjectsController`:
     ```csharp
     if (roleClaim != "Admin") {
         query = query.Where(p => p.AssignedEditors.Any(e => e.UserId == currentUserId));
     }
     ```

3. **Scroll Infinito com Intersection Observer**:
   - Integração na `ProjectsPage.tsx` do hook de observer para detectar quando o usuário chega ao final do grid e carregar automaticamente a próxima página (`page + 1`) sem perder o estado dos itens anteriores.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10)
- `Media8.Workstation.Application/DTOs/PagedResultDto.cs`: DTO genérico de resposta paginada.
- `Media8.Workstation.Api/Controllers/ProjectsController.cs`: Filtro por Claims JWT e suporte a `limit=5` e `page`/`pageSize=20`.
- `Media8.Workstation.Domain/Entities/WorkstationAsset.cs`: Chave estrangeira `ProjectId`.
- `Media8.Workstation.UnitTests/ProjectsControllerTests.cs`: Suíte de testes unitários para `ProjectsController`.

### Frontend (React SPA)
- `src/services/api.ts`: Atualizado para `ProjectService.getProjects` com tipagem `PagedResult<Project>`.
- `src/pages/ProjectsPage.tsx`: Implementado Intersection Observer para Scroll Infinito.
- `src/pages/DashboardPage.tsx` & `src/App.tsx`: Carregamento do limite de 5 projetos.

---

## 🎯 Impacto e Resultado

* **[Código Limpo]**: Purgada 100% da legado `Order`, unificando a entidade raiz como `Project`.
* **[Segurança Garantida]**: Editores não possuem qualquer visibilidade de projetos de terceiros.
* **[Alta Performance]**: Consultas paginadas leves utilizando `Skip` e `Take` direto no PostgreSQL.
