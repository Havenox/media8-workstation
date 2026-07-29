# 01 — Arquitetura, Padrões & Injeção de Ambiente

> **Matriz de Documentação — Pilar 2: Fundação & Padrões**  
> *Versão:* 3.2.0  
> *Status:* Ativo  

---

## 1. Agnosticism de Ambiente, Armazenamento Centralizado (`media8-storage`) & Banco de Dados Externo

O **Media 8 | Workstation** segue a política de **Zero-Hardcode** e **Centralização de Mídias Compartilhadas**:
- **Pasta de Armazenamento na Raiz (`media8-storage/`)**: O repositório contém a pasta dedicada `media8-storage/` com as subpastas `avatars/`, `high-fidelity/`, `proxies/` e `waveforms/`.
- **Bind Mount Docker**: Todos os containers que lidam com mídia (`api`, `worker-ingestion`, `worker-transcoder`) mapeiam o bind mount `./media8-storage:/storage`.
- **Servimento via API & Nginx Proxy**: A API serve o diretório via `app.UseStaticFiles()` e `PhysicalFileProvider` na rota `/storage/*`. O Nginx (`web` container) faz o proxy reverso de `location /storage/` para `http://api:5000/storage/`.
- **Conexão Externa:** Todas as credenciais de conexão são injetadas via variáveis de ambiente no arquivo `.env` na raiz do repositório.
- **Frontend Vite SPA:** URL base da API REST configurável via `VITE_API_URL` (padrão: `http://localhost:5000/api/v1`).

---

## 2. Roteamento Declarativo por URL & Layout Shell Persistente (`react-router-dom` v6)

A navegação da estação PAM utiliza rotas declarativas baseadas em URLs reais:
- **Layout Shell Persistente (`AppLayout.tsx`)**: O **Sidebar** e o **Header** permanecem fixos e montados continuamente no DOM. Aparelhos de busca, perfil de usuário e atalhos não sofrem re-renders desnecessários.
- **Renderização Dinâmica do Corpo (`<Outlet />`)**: Apenas o container central de conteúdo (`<main>`) é atualizado dinamicamente conforme a rota ativa (`/` (Dashboard), `/projects`, `/workstation/:projectId`, `/jobs`, `/users`, `/settings`, `/notifications`).
- **Nginx SPA Fallback**: Configuração da instrução `try_files $uri $uri/ /index.html;` no Nginx do container Docker, garantindo recarregamento via `F5` e Deep Linking de qualquer rota sem erro 404.

---

## 3. Endpoints Dedicados de Estatísticas & Métricas (`GET /api/v1/Projects/Stats` & `GET /api/v1/Users/Stats`)

O Dashboard e os contadores de metadados da aplicação consomem dados numéricos agregados de endpoints dedicados:
1. `GET /api/v1/Projects/Stats`: Métricas consolidadas dos projetos.
2. `GET /api/v1/Users/Stats`: Estatísticas numéricas dos usuários (`TotalUsers`, `AdminCount`, `EditorCount`).

- **Desempenho Agregado:** Retorna os DTOs de estatísticas utilizando `CountAsync()` com `AsNoTracking()`, sem carregar entidades pesadas na memória.
- **Isolamento RBAC por Claims JWT:** Admins obtêm a contagem de toda a produtora. Editores obtêm a contagem restrita aos projetos aos quais pertencem.

---

## 4. Pipeline de Atribuições de Projetos, Lead Editor, Funções PAM, Avatar Stack & Modais Retráteis Minimalistas

1. **Contagem Real de Atribuições**: A coluna **Projetos Atribuídos** na tabela de usuários exibe a quantidade exata de projetos em que o usuário está ativamente atribuído (tanto para Admins quanto para Editores). O privilégio de Admin concede acesso global, mas não infla a contagem de atribuição.
2. **Editor Responsável (Lead Editor)**: Todo projeto possui **1 Editor Responsável** (`LeadUserId`) obrigatório, selecionado via dropdown refinado nos modais de cadastro e edição.
3. **Funções da Atribuição (PAM Roles)**: Editores vinculados a um projeto possuem funções específicas (`General`, `Decoupage`, `AudioTreatment`, `ColorGrading`, `MotionGraphics`, `Reviewer`), com ícones vetoriais `Lucide React` dedicados.
4. **Avatar Stack com Popover**: Os Cards de projetos exibem a pilha de avatares com destaque dourado para o Lead Editor e Popover interativo detalhando toda a equipe de atribuição.
5. **Seções Retráteis & Ingestão Minimalista**: Os modais de cadastro/edição utilizam seções retráteis sutis com rótulos diretos ("Equipe" e "Links dos Materiais") e switch minimalista de 1 linha com o ícone `<RefreshCw />` ("Processar mídias automaticamente") posicionado após os links.

---

## 5. Cabeçalho Superior Fixo & Dinâmico (Breadcrumb, Busca ⌘K, Notificações & Menu Avatar Dropdown)

1. **Breadcrumb & Título Dinâmicos**: Cabeçalho fixo (`Header.tsx`) renderizando automaticamente o caminho (`Home > Projetos`) e título da tela em foco.
2. **Busca Global CommandK (`GlobalSearch.tsx`)**: Botão no topo com atalho `Ctrl+K` / `Cmd+K` que abre o modal Shadcn `CommandK` para busca e navegação rápida entre páginas.
3. **Notificações em Popover (`NotificationsDropdown.tsx`)**: Ícone de sininho com badge numérico em destaque de não lidas e Popover com lista de alertas e redirecionamento para `/notifications`.
4. **Avatar Circular & Menu Dropdown (`UserNav.tsx`)**: Botão circular de avatar com imagem (`AvatarUrl`) ou fallback de iniciais e menu popup com foto grande, e-mail, perfil, configurações e opção de Sair em vermelho.

---

## 5. Pipeline de Processamento de Avatares, Expurgo de Disco & Segurança de Credenciais

1. **Recorte Interativo 1:1 & Validação MIME**: O frontend valida o tipo de imagem e apresenta um modal interativo de recorte 1:1 (`AvatarCropModal.tsx`) com slider simétrico de zoom (-100 a +100) e botão de reset.
2. **Input Sutil de URL Externa**: Modal de usuário apresenta caixa minimalista de URL com trava ativada por ícone de lápis interno (`Pencil`).
3. **Compressão WebP & Expurgo Automático de Disco**: O backend grava fotos locais em `media8-storage/avatars/{userId}.webp` (WebP 200x200px @ 80%). Ao alternar um usuário para URL externa (`http://` ou `https://`), o backend executa `File.Delete` no arquivo `.webp` antigo em disco, evitando acúmulo de arquivos órfãos.
4. **Confirmação em 2 Passos com Countdown de 3s**: Redefinições administrativas de senha exigem a confirmação no modal `PasswordResetConfirmModal.tsx`, cujo botão de ação fica desabilitado por 3 segundos para evitar alterações acidentais.

---

## 5. Diretrizes de Design Visual Premium (Padrão Apple / Media 8 Design System)

1. **Banimento Estrito de Emojis**: NENHUM emoji é permitido em botões, tabelas, modais, selects ou notificações da interface. Todos os elementos devem utilizar exclusivamente ícones vetoriais da biblioteca Lucide React.
2. **Tipografia sem Maiúsculas Excessivas**: Tabelas e listagens devem utilizar cabeçalhos em caixa normal (`normal-case text-[#FFFBED] font-semibold text-xs tracking-tight`), evitando `uppercase` agressivo.
3. **Linguagem Amigável sem Jargões de Dev**: Expressões técnicas como "RBAC" ou "Papel (RBAC)" são substituídas por "Função" ou "Função de Acesso".
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

## 5. Padrão Arquitetural `WorkstationBaseController` (`api/v1/[controller]`)

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

## 6. Histórico de Estudos de Caso

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
- **[Estudo de Caso 011](implementations/011-roteamento-declarativo-applayout-nginx.md):** Roteamento Declarativo por URL (react-router-dom v6), Layout Shell Persistente e Fallback Nginx.
