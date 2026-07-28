# 01 — Arquitetura, Padrões & Injeção de Ambiente

> **Matriz de Documentação — Pilar 2: Fundação & Padrões**  
> *Versão:* 1.6.0  
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

### 4.2 Primary Constructors & Clean Architecture
- Injeção de dependência no backend utilizando exclusivamente C# 13 Primary Constructors (`public class OrdersController(WorkstationDbContext context)`).
- Separação em camadas desacopladas (`Domain`, `Application`, `Infrastructure`, `Api`, `Workers`).

### 4.3 Defensive UI & Prevenção de Multi-submit
- Botões de ação mutável no frontend são fisicamente desabilitados (`disabled={loading}`) durante requisições ativas.
- Zero re-renders desnecessários usando estado derivado diretamente no corpo do componente.

### 4.4 Identidade Visual Oficial (Vinho Profundo & Creme Suave)
- **Cores Primárias**: Vinho Profundo (`#400404`), Vinho Quente (`#5C1212`), Vinho Vibrante (`#7B0A0A`) e Creme Suave (`#FFFBED`).
- **Assets de Marca**: Utilização de logotipos WebP (`logo-media8-cream.webp`, `logo-media8-wine.webp`) e `favicon.ico`.
- **Estética Glassmorphism**: Cartões e painéis com desfoque de fundo (`backdrop-blur-xl`), bordas de 1px e tipografia limpa em `Inter`.

---

## 5. Convenção de Nomenclatura de Pastas por Escopo (`media8-NOME`)

Todo microserviço, worker, suite de testes ou escopo do projeto que possua seu próprio container no `docker-compose.yml` ou represente uma camada independente do repositório deve obrigatoriamente iniciar o nome da pasta com o prefixo **`media8-NOME`**:

- **Backend API:** `media8-api/`
- **Frontend SPA (Web):** `media8-web/`
- **Background Workers:** `media8-workers/`
- **Suíte de Testes:** `media8-tests/`
