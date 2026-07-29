# 017 — Redesign do Cabeçalho Superior Fixo e Dinâmico, Busca Global ⌘K, Notificações e Menu de Avatar

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 29/07/2026  

---

## 🚀 Desafio de Engenharia

O cabeçalho antigo do **Media 8 | Workstation** apresentava um bloco retangular estático branco que exibia apenas o nome e o perfil do usuário por extenso com um botão "Sair" ao lado. Esse padrão gerava duas limitações:

1. **Exibição Inconsistente do Avatar do Usuário**: A foto de perfil (`AvatarUrl`) não era devidamente priorizada, recorrendo a fallbacks estáticos de inicial única ("E").
2. **Navegação & Funcionalidades Ricas Ausentes**: Faltavam recursos modernos exigidos no padrão de UI da produtora (CRM app-v1), tais como:
   - Breadcrumbs e título de página dinâmicos integrados ao cabeçalho fixo.
   - Aparelho de Busca Global por atalho de teclado (`⌘K` / `Ctrl+K`).
   - Popover interativo de Notificações recentes com contador e link de navegação dedicada (`/notifications`).
   - Botão circular de avatar com menu popup dropdown completo de usuário.

---

## 🧠 Estratégia da Solução

1. **Investigação do Avatar & Diagnóstico**:
   - O objeto `currentUser` trazia o campo `AvatarUrl` que ficava restrito a fallbacks quando nulo. Criamos o componente `UserNav.tsx` / `UserDropdownMenu` que formata as iniciais do usuário com suporte a nomes compostos (ex: "Eduardo Oliveira" -> "EO", "Shaiany Barbosa" -> "SB") e renderiza a imagem real com `object-cover` e contorno dourado/vinho quando a URL do avatar está configurada.

2. **Cabeçalho Fixo & Dinâmico (`Header.tsx`)**:
   - Posicionamento fixo no topo (`sticky top-0 z-40 bg-[#FFFBED]/95 backdrop-blur-md border-b border-[#400404]/15`).
   - **Lado Esquerdo**: Breadcrumb interativo com ícone `<ChevronRight />` (ex: `Home > Projetos`, `Home > Usuários`) e título da tela em destaque dinâmico via `useLocation()`.
   - **Lado Direito**:
     1. **Busca Global (`GlobalSearch.tsx`)**: Integração do modal Shadcn `CommandK` acionado via clique ou atalho `Ctrl+K` / `Cmd+K`.
     2. **Notificações (`NotificationsDropdown.tsx`)**: Sininho com badge vermelho numérico de não lidas e Popover com lista de alertas recentes e navegação para `/notifications`.
     3. **Avatar Circular (`UserNav.tsx`)**: Menu popup estilizado com as cores do Media 8 contendo Foto grande, Nome, E-mail, *Meu Perfil*, *Minha Assinatura*, *Configurações*, *Ajuda & Suporte* e *Sair*.

3. **Central de Notificações (`NotificationsPage.tsx` & `NotificationsContext.tsx`)**:
   - Criados a rota `/notifications`, a página dedicada de listagem de notificações e o Context API para gestão global de leitura e limpeza de alertas.

---

## 🛠️ Implementação Técnica

### Frontend React SPA (`media8-web`)
- **Novos Componentes & Páginas**:
  - `src/components/layout/Header.tsx` (Redesign completo).
  - `src/components/layout/UserNav.tsx` (Dropdown Menu de Avatar).
  - `src/components/layout/NotificationsDropdown.tsx` (Popover de Alertas).
  - `src/components/layout/GlobalSearch.tsx` (CommandK modal).
  - `src/pages/NotificationsPage.tsx` (Página de Notificações).
  - `src/contexts/NotificationsContext.tsx` (Context Provider).

---

## 🎯 Impacto e Resultado

* **Experiência Visual de Nível Estado da Arte**: Cabeçalho moderno 100% fiel ao CRM app-v1, com breadcrumbs limpos e atalhos rápidos `⌘K`.
* **Zero Emojis & Padrão Vetorial Lucide React**: Uso estrito de ícones vetoriais.
* **Qualidade Aprovada**:
  - Production Build Vite: 100% de sucesso (8.81s).
  - Testes Unitários .NET 10: 10/10 aprovados.
  - Commits Atômicos em Português enviados para o GitHub.
