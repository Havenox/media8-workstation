# 004 - [Frontend & Domínio]: Arquitetura de Projetos e MVP Visual das 6 Telas do Workstation PAM

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

A interface legada herdada do repositório comercial `app-v1` tratava a aplicação como um portal e-commerce de venda de pacotes de vídeo, utilizando menus como "Ofertas", "Estilos", "Formatos" e a terminologia "Order". 

Na **Media 8 | Workstation**, a aplicação atua como um sistema **PAM (Production Asset Management)** para a produtora e editores. Uma **Order** comercial vinda do CRM gera um **Projeto** (`Project`) operacional de edição na Workstation. Além disso, o Administrador precisa criar Projetos manualmente diretamente na Workstation para demandas internas sem passar pelo CRM.

O desafio consistiu em:
1. Reestruturar os tipos e a terminologia de **Projetos** mantendo total fidelidade aos contratos **PascalCase** do backend.
2. Implementar as **6 telas operacionais oficiais** da Workstation (`Dashboard`, `Projetos`, `Workstation PAM`, `Esteira de Ingestão & Jobs`, `Usuários & Atribuições`, `Configurações & Storage`).
3. Construir o fluxo de cadastro 100% manual de Projetos na Workstation, deixando o terreno pronto para integração futura via endpoint com o CRM.

---

## 🧠 Estratégia da Solução

1. **Adequação da Navegação e Layout**:
   - Reorganização da `Sidebar.tsx` e `Header.tsx` para apresentar apenas os 6 menus oficiais do PAM.
   - Manutenção rigorosa das cores primárias da marca (`#400404` Vinho Profundo e `#FFFBED` Creme Suave).

2. **Tipagem TypeScript Blindada (PascalCase)**:
   - Definição da interface `Project` com propriedades `ProjectId`, `Title`, `BriefingText`, `ExternalOrderReference`, `Status`, `CreatedByUserId`, `CreatedAt`, `UpdatedAt`.
   - Manutenção de alias de compatibilidade `export type Order = Project`.

3. **Arquitetura das 6 Telas Oficiais**:
   - **Dashboard (`/dashboard`)**: KPIs da produtora, status de projetos em produção/revisão e lista de projetos recentes.
   - **Projetos (`/projects`)**: Tabela/Grid de projetos, filtros por status, inspector de briefing e modal `+ Novo Projeto` manual.
   - **Workstation PAM (`/workstation`)**: Player Broadcast com precisão por frame `HH:MM:SS:FF`, atalhos `J/K/L/I/O`, Canvas 2D de Waveform, seletor de mídias e criador/exportador de sub-clips.
   - **Esteira de Ingestão & Jobs (`/jobs`)**: Monitor em tempo real da fila *SKIP LOCKED* (`MediaProcessingJobs`) com ações de reprocessamento.
   - **Usuários & RBAC (`/users`)**: Tabela de equipe e cadastro restrito a Admins (sem auto-cadastro público).
   - **Configurações & Storage (`/settings`)**: Gráfico de uso de disco (High-Fidelity vs Proxies vs Purga RAW) e preferências de retenção.

---

## 🛠️ Implementação Técnica

### Frontend (`media8-web`)
- **`src/types/index.ts`**: Adicionadas interfaces `Project`, `ProjectEditor` e `MediaProcessingJob` em PascalCase.
- **`src/services/api.ts`**: Adicionado `ProjectService` e `JobService`.
- **`src/components/layout/Sidebar.tsx`**: Reestruturado com os 6 menus da Workstation.
- **`src/components/layout/Header.tsx`**: Atualizado com dados do perfil logado e botão de logout.
- **`src/pages/DashboardPage.tsx`**: Criada página inicial com estatísticas e projetos recentes.
- **`src/pages/ProjectsPage.tsx`**: Criada página de gestão de projetos e modal de cadastro manual.
- **`src/pages/WorkstationPage.tsx`**: Criada página central de edição PAM com player e waveform.
- **`src/pages/JobsPage.tsx`**: Criada página de monitoramento da esteira de transcodificação.
- **`src/pages/UsersPage.tsx`**: Criada página de controle de acesso RBAC.
- **`src/pages/SettingsPage.tsx`**: Criada página de configurações de storage e purga defensiva.
- **`src/App.tsx`**: Integrado o roteador de 6 abas e gerenciamento de estado global.

---

## 🎯 Impacto e Resultado

* **[Transição de Domínio Concluída]**: A Workstation agora é 100% focada em Gestão de Projetos e Asset Management de vídeos.
* **[MVP Visual Operacional]**: 6 telas dinâmicas e responsivas prontas e conteinerizadas no Docker Compose.
* **[Criação Manual de Projetos]**: Administradores podem cadastrar projetos e instruções imediatamente.
* **[Contratos Preservados em PascalCase]**: Tipagem TypeScript blindada alinhada com a API .NET 10.

---

**Nota do Desenvolvedor:** *A segregação entre o CRM comercial (`app-v1`) e a estação de edição (`workstation`) trouxe clareza absoluta ao produto. A aplicação agora respira um verdadeiro software broadcast profissional.*
