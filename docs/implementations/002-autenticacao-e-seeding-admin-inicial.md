# 002 - [PAM Workstation]: Autenticação JWT, Seeding Dinâmico de Admin e Bloqueio de Anônimos

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 28/07/2026

---

## 🚀 Desafio de Engenharia
Em ambientes de produção audiovisual e agências de comunicação, a segurança dos projetos e briefings de clientes exige controle de acesso rigoroso. O sistema não pode permitir acessos anônimos, autoregistros por formulários públicos nem manter credenciais administrativas hardcoded no código da aplicação.

## 🧠 Estratégia da Solução
Foi desenvolvida uma esteira de autenticação baseada em tokens **JWT (JSON Web Token) Bearer** no .NET 10, combinada com um processo dinâmico de **Seeding de Administrador Inicial** (`DbSeeder.cs`). O seeder consulta o banco de dados PostgreSQL na inicialização e, caso não identifique nenhum usuário com perfil `Admin`, lê as credenciais `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` injetadas via variáveis de ambiente (`.env`), realiza o hash seguro com `PasswordHasher` e persiste o usuário no banco.

No frontend React SPA, foi criada uma interface de login com a identidade visual Vinho Profundo (`#400404`), sem nenhuma opção de cadastro público. A aplicação é envolvida por uma guarda de rotas que renderiza exclusivamente a tela de login para usuários não autenticados.

## 🛠️ Implementação Técnica
- **Backend (.NET 10 & JWT Bearer):**
  - Configuração do middleware `JwtBearerDefaults` em `Program.cs` com validação de Issuer, Audience e Chave Simétrica.
  - Endpoints REST em `AuthController.cs` (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`).
  - Restrição de gerenciamento de usuários em `UsersController.cs` (`[Authorize(Roles = "Admin")]`), impedindo a criação de usuários fora do controle administrativo.
  - Proteção global das rotas de projetos (`OrdersController`), mídias (`AssetsController`) e marcadores (`TimecodeMarkersController`) com `[Authorize]`.
- **Seeding de Admin Dinâmico (`DbSeeder.cs`):**
  - Leitura assíncrona das credenciais de ambiente com zero dados hardcoded em C#.
  - Encriptação de senha com `PasswordHasher<User>`.
- **Frontend SPA (React 18 + Vite + Tailwind):**
  - DTOs em PascalCase (`AuthResponse`, `LoginRequest`, `CreateUserRequest`).
  - Interceptores Axios em `api.ts` para injeção automática do cabeçalho `Authorization: Bearer <token>` e tratamento global de erro 401 (redirecionamento ao login).
  - Componente `LoginScreen.tsx` em tema Vinho Profundo com efeito de vidro (glassmorphism), feedback visual e botão desabilitado em estado de requisição.

## 🎯 Impacto e Resultado
* **Bloqueio Total de Anônimos**: 100% dos endpoints de negócio exigem autenticação ativa.
* **Segurança de Credenciais**: Credenciais de admin inicial gerenciadas estritamente por variáveis de ambiente.
* **Governança RBAC**: Apenas Administradores possuem permissão para cadastrar novos usuários (Editores/Admins).

---
**Nota do Desenvolvedor:** *A remoção de qualquer opção de autoregistro anônimo tanto na API quanto na interface SPA reforça o caráter corporativo e de segurança fechada do ecossistema Media 8 Workstation.*
