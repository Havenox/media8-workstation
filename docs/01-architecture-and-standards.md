# 01 — Arquitetura, Padrões & Injeção de Ambiente

> **Matriz de Documentação — Pilar 2: Fundação & Padrões**  
> *Versão:* 1.7.0  
> *Status:* Ativo  

---

## 1. Agnosticism de Ambiente & Banco de Dados Externo

O **Media 8 | Workstation** segue a política de **Zero-Hardcode**. O projeto **não sobe nem gerencia um container de banco de dados próprio no seu `docker-compose.yml`**. O banco de dados PostgreSQL é um recurso externo/centralizado da infraestrutura (acessível via `DB_HOST`, ex: `192.168.18.110`).

- **Conexão Externa:** Todas as credenciais de conexão são injetadas via variáveis de ambiente no arquivo `.env` na raiz do repositório.
- **Frontend Vite SPA:** URL base da API REST configurável via `VITE_API_BASE_URL` (padrão: `http://localhost:5000`).

### 1.1 Interpolação Automática da Connection String
O arquivo `.env` declara as variáveis do PostgreSQL externo e monta a Connection String dinamicamente:

```env
DB_HOST=192.168.18.110
DB_PORT=5432
DB_NAME=media8_workstation_db
DB_USERNAME=media8_user
DB_PASSWORD=media8_password_secret

# Interpolada automaticamente sem duplicação de dados:
DB_CONNECTION_STRING=Host=${DB_HOST};Port=${DB_PORT};Database=${DB_NAME};Username=${DB_USERNAME};Password=${DB_PASSWORD}
```

---

## 2. Estrutura de Armazenamento por Projeto (`/storage/{orderId}/...`)

Os arquivos de mídias físicas gerados pelos Workers são agrupados por **Order (Projeto)**, utilizando a GUID da Order no banco de dados como pasta raiz:

```text
/storage/
└── {orderId}/
    ├── raw/           # Downloads temporários de mídias brutas (purgados pós-transcode)
    ├── high_fidelity/ # Camada 1: Codec otimizado de alta fidelidade
    ├── proxies/       # Camada 2: Vídeos proxies leves WebM 720p
    └── waveforms/     # JSON de picos de áudio para o Canvas 2D
```

---

## 3. Modelo de Segurança, JWT & Controle de Acesso (RBAC)

O ecossistema impõe segregação estrita de privacidade por projetos (Orders) e por papéis:

1. **👑 Admin (Administrador):**
   - Possui privilégios globais de leitura, escrita e exclusão.
   - Pode cadastrar novos usuários (`POST /api/users`), atribuir editores a Orders ou autoatribuir-se a qualquer projeto.
   - Acumula a capacidade operacional total de um Editor em qualquer tela do Workstation.
2. **🎬 Editor (Editor):**
   - Acesso estrito e delimitado **apenas às Orders para as quais foi formalmente atribuído** via tabela de junção `OrderEditors`.
   - Isolamento total contra outros projetos do sistema.

### 3.1 Seeding Dinâmico do Administrador Inicial
- Não existem credenciais administrativas embutidas em código C#.
- Durante a inicialização da API (`DbSeeder.cs`), o sistema consulta o PostgreSQL e, se não identificar nenhum usuário com o papel `Admin`, lê `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` do `.env`, gera o hash com `PasswordHasher` e insere o primeiro Administrador no banco.

### 3.2 Bloqueio Estrito de Acessos Anônimos
- **Zero Formulários de Cadastro Anônimo:** A aplicação não permite autoregistro de usuários. O cadastramento de novos usuários é feito **exclusivamente por um Administrador** autenticado (`POST /api/users`).
- **Guarda de Rotas SPA & API:** Usuários não autenticados visualizam apenas a tela de Login ("Entrar"). Todos os endpoints de negócio exigem o cabeçalho `Authorization: Bearer <token>`.

---

## 4. Padrões de Código & Regras de Ouro

### 4.1 Backend é LEI (PascalCase Rigoroso)
- O backend .NET 10 estabelece os contratos JSON de entrada e saída.
- Todos os payloads de API utilizam nativamente a convenção **PascalCase** (`options.JsonSerializerOptions.PropertyNamingPolicy = null`).
- As interfaces TypeScript do frontend espelham os nomes exatos de propriedades (`OrderId`, `BriefingText`, `TimecodeStart`, `AssetId`) sem conversões para `camelCase`.

### 4.2 Stack de Frontend & Design System (Tailwind v3 + ShadCN UI)
- **Engine CSS**: Tailwind CSS v3 (`^3.4.17`), PostCSS (`^8.5.6`) e Autoprefixer (`^10.4.21`).
- **Suíte de UI**: 51 Componentes ShadCN UI (`src/components/ui/`), Radix UI primitives, Framer Motion e Lucide Icons.
- **Identidade Visual Oficial**: Vinho Profundo (`#400404`), Vinho Quente (`#5C1212`), Vinho Vibrante (`#7B0A0A`) e Creme Suave (`#FFFBED`).
- **Estética Glassmorphism**: Cartões e painéis com desfoque de fundo (`backdrop-blur-xl`), bordas de 1px e tipografia limpa em `Inter`.

---

## 5. Histórico de Estudos de Caso

- **[Estudo de Caso 001](implementations/001-integracao-inicial-workstation-dotnet10.md):** Arquitetura inicial .NET 10, JWT e SignalR.
- **[Estudo de Caso 002](implementations/002-credenciais-iniciais-admin-dotenv.md):** Injeção de credenciais de Admin via `.env` e Seeding dinâmico.
- **[Estudo de Caso 003](implementations/003-reestruturacao-frontend-alinhamento-app-v1.md):** Reestruturação do frontend `media8-web`, correção do Tailwind CSS v3, biblioteca ShadCN UI e alinhamento visual com `media8-app-v1` (telas `print3` e `print4`).
