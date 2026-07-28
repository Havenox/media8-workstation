# 011 - [Frontend & Infra]: Roteamento Declarativo por URL (react-router-dom v6), Layout Shell Persistente e Fallback Nginx

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

Na versão inicial da estação PAM, a transição entre telas era gerenciada por um estado simples em memória (`activeTab: string`). Embora eficiente no protótipo, essa abordagem apresentava severas limitações de UX e arquitetura:
1. **Endereço Estático**: O navegador exibia unicamente `http://localhost:5000/`, impossibilitando o compartilhamento de links diretos (Deep Linking).
2. **Perda de Contexto no F5**: Ao recarregar a página ou usar os botões de voltar/avançar do navegador, a aplicação reiniciava no Dashboard.
3. **Re-renders Globais Inúteis**: O layout envolvente recalculava componentes pai desnecessariamente durante navegações de abas.

---

## 🧠 Estratégia da Solução

1. **Arquitetura de Layout Shell Persistente (`AppLayout.tsx`)**:
   - Criação do container `AppLayout` englobando o `Sidebar` e o `Header` em camadas fixas e persistentes.
   - O corpo central da aplicação utiliza o componente `<Outlet />` do `react-router-dom` v6, garantindo que **apenas o conteúdo dinâmico da rota ativa seja re-renderizado**.

2. **Roteamento Declarativo & Proteção por URL**:
   - `/dashboard` (ou `/`): Painel principal de métricas da produtora.
   - `/projects`: Gestão de Projetos de Edição (scroll infinito, busca e filtros).
   - `/workstation` e `/workstation/:projectId`: Estação PAM de timeline e reprodutor de timecode com carregamento direto por parâmetro de URL.
   - `/jobs`: Esteira de Ingestão e tarefas assíncronas.
   - `/users`: Usuários & Atribuições RBAC com proteção declarativa (`ProtectedRoute` para função `Admin`).
   - `/storage`: Configurações de armazenamento.

3. **Infraestrutura Nginx SPA Fallback (Docker)**:
   - Adicionada a instrução `try_files $uri $uri/ /index.html;` no arquivo `media8-web/nginx.conf` e copiada no `Dockerfile` para suporte total a F5 e navegação por URL profunda em produção.

---

## 🛠️ Implementação Técnica

### Frontend (`media8-web`)
- `src/components/layout/AppLayout.tsx`: Shell de layout persistente com `Sidebar`, `Header` e `<Outlet />`.
- `src/components/layout/Sidebar.tsx`: Integrado aos hooks `useNavigate()` e `useLocation()`.
- `src/pages/WorkstationPage.tsx`: Integrado a `useParams<{ projectId?: string }>()` para sincronizar automaticamente com a URL `/workstation/:projectId`.
- `src/App.tsx`: Configuração do `BrowserRouter`, `Routes` e rotas aninhadas sob o `AppLayout`.

### Infraestrutura & Docker
- `media8-web/nginx.conf`: Regras de roteamento Nginx para SPAs com cache estático de `/assets/`.
- `media8-web/Dockerfile`: Atualizado para copiar `nginx.conf` em `/etc/nginx/conf.d/default.conf`.

---

## 🎯 Impacto e Resultado

* **[Zero Re-render Inútil]**: O Sidebar e o Header permanecem 100% fixos na tela, mantendo o estado de busca e perfil intacto.
* **[Deep Linking Operacional]**: Editores e Admins podem copiar e compartilhar URLs diretas de projetos (ex: `/workstation/3efae67a...`).
* **[Resiliência a Recarregamentos (F5)]**: Pressionar `F5` ou usar as setas do navegador (`←` / `→`) preserva a tela e o contexto onde o usuário está trabalhando.
* **[Segurança Declarativa]**: Acesso à rota `/users` protegido por middleware de rotas React.
