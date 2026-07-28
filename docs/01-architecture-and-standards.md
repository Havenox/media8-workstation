# 01 — Arquitetura, Padrões & Injeção de Ambiente

> **Matriz de Documentação — Pilar 2: Fundação & Padrões**  
> *Versão:* 2.3.0  
> *Status:* Ativo  

---

## 1. Agnosticism de Ambiente & Banco de Dados Externo

O **Media 8 | Workstation** segue a política de **Zero-Hardcode**. O projeto **não sobe nem gerencia um container de banco de dados próprio no seu `docker-compose.yml`**. O banco de dados PostgreSQL é um recurso externo/centralizado da infraestrutura (acessível via `DB_HOST`, ex: `192.168.18.110`).

- **Conexão Externa:** Todas as credenciais de conexão são injetadas via variáveis de ambiente no arquivo `.env` na raiz do repositório.
- **Frontend Vite SPA:** URL base da API REST configurável via `VITE_API_URL` (padrão: `http://localhost:5000/api/v1`).

---

## 2. Endpoint Dedicado de Estatísticas & Métricas (`GET /api/v1/Projects/Stats`)

O Dashboard consome as estatísticas consolidadas da estação a partir de um endpoint dedicado de metadados agregados:
`GET /api/v1/Projects/Stats`

- **Desempenho Agregado:** Retorna o DTO `ProjectStatsDto` utilizando `CountAsync()` com `AsNoTracking()`, sem carregar entidades pesadas na memória.
- **Isolamento RBAC por Claims JWT:** Admins obtêm a contagem de toda a produtora. Editores obtêm a contagem restrita aos projetos aos quais pertencem.

---

## 3. Diretrizes de Design Visual Premium (Padrão Apple / Media 8 Design System)

1. **Banimento Estrito de Emojis**:
   - Emojis unicode estão proibidos no código frontend.
   - Toda a representação de mídia, arquivos, status ou ações utiliza exclusivamente ícones vetoriais da biblioteca **Lucide React**.
2. **Componentes Customizados & Dropdowns (`LinkTypeSelect` e `UserRoleSelect`)**:
   - Proibido o uso de `<select>` nativo do navegador em formulários da estação.
   - Os dropdowns utilizam componentes baseados em ShadCN UI / Radix (`Popover`/`Select`), com cantos arredondados (`rounded-xl`), sombra (`shadow-xl`), fundo creme (`#FFFBED`) e ícones vetoriais associados a cada opção.
3. **Hierarquia Tipográfica & Contraste de Hover**:
   - Títulos primários: `font-semibold text-base text-[#400404] tracking-tight`.
   - Textos secundários e descrições: `font-normal text-xs text-[#5C1212]/80`.
   - Elementos interativos em hover invertem a cor do texto e dos ícones vetoriais simultaneamente via `group-hover:text-[#FFFBED]`.

---

## 4. Padrão Arquitetural `WorkstationBaseController` (`api/v1/[controller]`)

Todos os controladores da API .NET 10 herdam obrigatoriamente da classe base abstrata **`WorkstationBaseController`**:

```csharp
namespace Media8.Workstation.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class WorkstationBaseController : ControllerBase
{
}
```

---

## 5. Histórico de Estudos de Caso

- **[Estudo de Caso 001](implementations/001-integracao-inicial-workstation-dotnet10.md):** Arquitetura inicial .NET 10, JWT e SignalR.
- **[Estudo de Caso 002](implementations/002-credenciais-iniciais-admin-dotenv.md):** Injeção de credenciais de Admin via `.env` e Seeding dinâmico.
- **[Estudo de Caso 003](implementations/003-reestruturacao-frontend-alinhamento-app-v1.md):** Reestruturação do frontend `media8-web`, biblioteca ShadCN UI e alinhamento visual com `media8-app-v1`.
- **[Estudo de Caso 004](implementations/004-arquitetura-projetos-mvp-visual-workstation.md):** Transição da terminologia para Projetos e desenvolvimento do MVP Visual das 6 telas operacionais da Workstation.
- **[Estudo de Caso 005](implementations/005-basecontroller-projetos-links-dinamicos.md):** Padrão WorkstationBaseController (`api/v1`), cadastramento de Projetos com múltiplos links categorizados (`ProjectLinks`), validações de URL e Soft/Hard Delete.
- **[Estudo de Caso 006](implementations/006-expurgo-orders-rbac-paginacao-scroll-infinito.md):** Expurgo definitivo de Orders, blindagem RBAC por Claims JWT e paginação com Scroll Infinito (20 em 20).
- **[Estudo de Caso 007](implementations/007-arquitetura-ingestao-links-projeto-autoingest.md):** Arquitetura de Ingestão por Links do Projeto, propriedade AutoIngest e Trigger Auto/Manual.
- **[Estudo de Caso 008](implementations/008-redesenho-visual-premium-projetos.md):** Redesenho Visual Premium (Padrão Apple) na Gestão de Projetos e Banimento de Emojis.
- **[Estudo de Caso 009](implementations/009-componente-linktypeselect-icones-lucide-hover.md):** Componente Customizado LinkTypeSelect e Correção de Contraste no Hover.
- **[Estudo de Caso 010](implementations/010-endpoint-estatisticas-projetos-dashboard.md):** Endpoint Dedicado de Estatísticas (GET /api/v1/Projects/Stats) e Correção dos Indicadores do Dashboard.
