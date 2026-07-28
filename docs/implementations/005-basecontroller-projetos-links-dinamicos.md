# 005 - [Backend & Frontend]: Padrão WorkstationBaseController (api/v1), Gestão de Projetos com Links Dinâmicos, Prazo de Entrega e Schema DDL

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

O cadastro de Projetos na **Media 8 | Workstation** exigia evoluções fundamentais de arquitetura full-stack:
1. **Centralização de Controllers da API**: Todos os controladores possuíam duplicação dos atributos `[ApiController]` e `[Route("api/[controller]")]`, dificultando o versionamento global da API.
2. **Links Múltiplos Categorizados**: Projetos de edição frequentemente recebem múltiplos links externos (pastas do Google Drive, arquivos de áudio, vídeos, PDFs de roteiro ou imagens de referência).
3. **ID do Pedido (CRM Alias)**: Necessidade de vincular uma chave fria/alias de referência externa (`#0254` ou `ORD-9981`) sem impor FK física no banco de dados.
4. **Prazo de Entrega & Validação Defensiva**: Exigência de um campo de data de entrega (`Deadline`) com seletor de calendário estilizado e **bloqueio estrito contra datas passadas** na API e no Frontend.
5. **Autocriação de Esquema DDL no PostgreSQL**: Garantia de que novas tabelas (`Projects`, `ProjectLinks`, `ProjectEditors`) e colunas sejam criadas automaticamente na subida da API sem quebras em bancos existentes.
6. **Ciclo de Vida de Exclusão**: Suporte a **Soft Delete** e **Hard Delete** via parâmetros de query.

---

## 🧠 Estratégia da Solução

1. **Padrão `WorkstationBaseController` (`api/v1/[controller]`)**:
   - Criação da classe abstrata `WorkstationBaseController.cs` decorada com `[ApiController]` e `[Route("api/v1/[controller]")]`.
   - Refatoração de todos os controladores (`AuthController`, `UsersController`, `OrdersController`, `AssetsController`, `TimecodeMarkersController` e o novo `ProjectsController`) para herdarem desta classe base.
   - Atualização do cliente Axios no frontend (`api.ts`) com `baseURL: ${API_BASE_URL}/api/v1`.

2. **Modelagem Relacional & DDL Automática (`Projects` & `ProjectLinks`)**:
   - Criação das tabelas `"Projects"`, `"ProjectEditors"` e `"ProjectLinks"` no PostgreSQL.
   - Implementação do assistente DDL `DbSeeder.EnsureSchemaUpdatedAsync` executando SQL `CREATE TABLE IF NOT EXISTS` e `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para evitar o erro de relação inexistente.

3. **Prazo de Entrega & Calendário Pixel-Perfect**:
   - Construção de um componente de Calendário customizado em `Calendar.tsx` estilizado no Design System (`#FFFBED` Creme Suave / `#400404` Vinho Profundo) em uma grade de 7 colunas simétricas (`grid grid-cols-7`).
   - Atalhos rápidos (`Hoje`, `+3 Dias`, `+7 Dias`, `+15 Dias`).
   - Bloqueio de submissão na API `ProjectsController` e desabilitação visual de datas anteriores a `Today`.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10)
- `Media8.Workstation.Api/Controllers/WorkstationBaseController.cs`: Controlador base abstrato com rota `api/v1/[controller]`.
- `Media8.Workstation.Api/Controllers/ProjectsController.cs`: Endpoint REST com validações de URL e `Deadline`.
- `Media8.Workstation.Infrastructure/Data/DbSeeder.cs`: Método `EnsureSchemaUpdatedAsync` com DDL PostgreSQL atômica.
- `Media8.Workstation.Domain/Entities/Project.cs` & `ProjectLink.cs`: Entidades com suporte a `Deadline`, `ExternalOrderReference`, `IsDeleted` e `Links`.

### Frontend (React SPA)
- `src/components/ui/calendar.tsx`: Componente de calendário pixel-perfect simétrico.
- `src/pages/ProjectsPage.tsx`: Formulário modal com atalhos de tempo, validações e lista dinâmica de links.
- `src/types/index.ts` & `src/services/api.ts`: Interfaces TypeScript e chamadas de API versionadas.

---

## 🎯 Impacto e Resultado

* **[Versionamento Centralizado]**: Rota unificada `api/v1/[controller]` em toda a API.
* **[Resiliência de Banco de Dados]**: Tabelas `"Projects"` e `"ProjectLinks"` verificadas e criadas automaticamente no startup.
* **[Interface Pixel-Perfect]**: Calendário e formulário em perfeita conformidade visual com o Design System.
* **[Validação Defensiva]**: Zero aceitação de prazos em datas passadas ou URLs inválidas.
