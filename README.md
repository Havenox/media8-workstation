# Media 8 | Workstation — Production Asset Management (PAM)

![Media 8 Banner](docs/assets/Banner-1200x400.webp)

> **Plataforma PAM & Esteira de Ingestão e Suporte à Edição de Vídeos do Ecossistema Media 8**

O **Media 8 | Workstation** é a solução de **Production Asset Management (PAM)** e esteira de suporte à edição de vídeos projetada para pequenas agências de audiovisual, produtoras enxutas e editores autônomos. 

Integrado ao ecossistema Media 8 (onde cada projeto de cliente é uma **Order**), o Workstation elimina o gargalo de movimentação de terabytes de mídias brutas em 4K/8K. O sistema baixa os arquivos remotos de forma assíncrona, transcodifica para duas camadas otimizadas (*High Fidelity* e *Proxy Web*), descarta os originais RAW e fornece uma interface web com player broadcast de alta precisão por Timecode (`HH:MM:SS:FF`), Waveform em Canvas 2D e marcação de Sub-clips conectados ao briefing.

---

## 📂 Estrutura de Pastas por Escopo (`media8-NOME`)

O repositório adota a convenção onde cada escopo/container possui o nome de diretório prefixado por `media8-NOME`:

```text
media8-workstation/
├── media8-api/          # Backend Web API (.NET 10 & Clean Architecture)
├── media8-web/          # Frontend Web SPA (React 18 + Vite + Tailwind)
├── media8-workers/      # Background Workers (.NET 10 & FFmpeg)
├── media8-tests/        # Suíte de Testes Unitários xUnit
├── docs/                # Documentação técnica e Estudos de Caso
├── .env.example         # Variáveis globais de ambiente
└── docker-compose.yml   # Orquestração unificada dos serviços da aplicação
```

---

## 🚀 Guia de Execução Local (Localhost Setup)

### Pré-requisitos
- Docker & Docker Compose instalados.
- Servidor PostgreSQL acessível (configurado no `.env` via `DB_HOST`).
- .NET 10 SDK (para desenvolvimento local de backend/workers).
- Node.js 20+ / npm (para desenvolvimento local de frontend).

### 1. Clonar e Configurar o Ambiente
```bash
git clone https://github.com/Havenox/media8-workstation.git
cd media8-workstation
cp .env.example .env
```
*Ajuste o `DB_HOST` e as credenciais do PostgreSQL no arquivo `.env` para conectar ao seu banco de dados.*

### 2. Inicializar via Docker Compose (Serviços da Aplicação)
```bash
docker-compose up -d --build
```
Acesse a aplicação em:
- **Frontend SPA (Web):** `http://localhost:3000`
- **Web API (.NET 10):** `http://localhost:5000/swagger`

### 3. Rodar Testes de Unidade do Backend
```bash
dotnet test media8-api/Media8.Workstation.slnx
```

---

## 📚 Matriz de Documentação Arquitetural

- 📘 [PRD — Product Requirement Document](file:///g:/DEV/Media8/media8-workstation/docs/PRD.md)
- 🗄️ [Modelo do Banco de Dados & Esquema ERD](file:///g:/DEV/Media8/media8-workstation/docs/DATABASE_SCHEMA.md)
- 🏗️ [01 — Arquitetura, Padrões & Injeção de Ambiente](file:///g:/DEV/Media8/media8-workstation/docs/01-architecture-and-standards.md)
- 🧠 [02 — Regras do Domínio Core & Esteira de Mídias](file:///g:/DEV/Media8/media8-workstation/docs/02-core-domain-logic.md)
- 💾 [03 — Persistência, Filas PostgreSQL & Purga](file:///g:/DEV/Media8/media8-workstation/docs/03-data-and-persistence.md)
- 🎨 [Diretrizes de Identidade Visual](file:///g:/DEV/Media8/media8-workstation/docs/implementations/DIRETRIZES-IDENTIDADE-VISUAL.md)

---

## 🛠️ Tech Stack & Engenharia

- **Backend API & Workers:** C# .NET 10 (Clean Architecture, Primary Constructors, PascalCase estrito)
- **Banco de Dados & Fila:** PostgreSQL Externo (Database-as-a-Queue com `SELECT ... FOR UPDATE SKIP LOCKED`)
- **Frontend SPA:** React 18, Vite, Tailwind CSS, Radix UI Primitives, Lucide Icons, TanStack Query, Zod
- **Containers:** Docker Compose (API, Ingestion Worker, Transcoder Worker, Web SPA)
