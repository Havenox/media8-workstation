# 01 — Arquitetura, Padrões & Injeção de Ambiente

> **Matriz de Documentação — Pilar 2: Fundação & Padrões**  
> *Versão:* 1.8.0  
> *Status:* Ativo  

---

## 1. Agnosticism de Ambiente & Banco de Dados Externo

O **Media 8 | Workstation** segue a política de **Zero-Hardcode**. O projeto **não sobe nem gerencia um container de banco de dados próprio no seu `docker-compose.yml`**. O banco de dados PostgreSQL é um recurso externo/centralizado da infraestrutura (acessível via `DB_HOST`, ex: `192.168.18.110`).

- **Conexão Externa:** Todas as credenciais de conexão são injetadas via variáveis de ambiente no arquivo `.env` na raiz do repositório.
- **Frontend Vite SPA:** URL base da API REST configurável via `VITE_API_URL` (padrão: `http://localhost:5000/api/v1`).

---

## 2. Padrão Arquitetural `WorkstationBaseController` (`api/v1/[controller]`)

Todos os controladores da API .NET 10 herdam obrigatoriamente da classe base abstrata **`WorkstationBaseController`**:

```csharp
namespace Media8.Workstation.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class WorkstationBaseController : ControllerBase
{
}
```

### Vantagens do Padrão:
1. **Roteamento Centralizado Versionado**: Todos os endpoints da API atendem sob a rota unificada `/api/v1/[controller]`.
2. **Conformidade DRY (Don't Repeat Yourself)**: Nenhum controlador individual precisa declarar repetidamente `[ApiController]` ou `[Route(...)]`.
3. **Evolução de API sem Quebras**: Qualquer atualização no prefixo global da API é realizada em um único arquivo de código C#.

---

## 3. Estrutura de Armazenamento por Projeto (`/storage/{projectId}/...`)

Os arquivos de mídias físicas gerados pelos Workers são agrupados por **Projeto**, utilizando a GUID do Projeto no banco de dados como pasta raiz:

```text
/storage/
└── {projectId}/
    ├── raw/           # Downloads temporários de mídias brutas (purgados pós-transcode)
    ├── high_fidelity/ # Camada 1: Codec otimizado de alta fidelidade
    ├── proxies/       # Camada 2: Vídeos proxies leves WebM 720p
    └── waveforms/     # JSON de picos de áudio para o Canvas 2D
```

---

## 4. Modelo de Segurança, JWT & Controle de Acesso (RBAC)

O ecossistema impõe segregação estrita de privacidade por projetos e por papéis:

1. **👑 Admin (Administrador):**
   - Possui privilégios globais de leitura, escrita e exclusão.
   - Pode cadastrar novos usuários (`POST /api/v1/Users`), atribuir editores a Projetos ou autoatribuir-se a qualquer projeto.
   - Acumula a capacidade operacional total de um Editor em qualquer tela do Workstation.
2. **🎬 Editor (Editor):**
   - Acesso estrito e delimitado **apenas aos Projetos para os quais foi formalmente atribuído** via tabela de junção `ProjectEditors`.
   - Isolamento total contra outros projetos do sistema.

---

## 5. Padrões de Código & Regras de Ouro

### 5.1 Backend é LEI (PascalCase Rigoroso)
- O backend .NET 10 estabelece os contratos JSON de entrada e saída.
- Todos os payloads de API utilizam nativamente a convenção **PascalCase** (`options.JsonSerializerOptions.PropertyNamingPolicy = null`).
- As interfaces TypeScript do frontend espelham os nomes exatos de propriedades (`ProjectId`, `BriefingText`, `TimecodeStart`, `AssetId`, `ProjectLinkId`) sem conversões para `camelCase`.

---

## 6. Histórico de Estudos de Caso

- **[Estudo de Caso 001](implementations/001-integracao-inicial-workstation-dotnet10.md):** Arquitetura inicial .NET 10, JWT e SignalR.
- **[Estudo de Caso 002](implementations/002-credenciais-iniciais-admin-dotenv.md):** Injeção de credenciais de Admin via `.env` e Seeding dinâmico.
- **[Estudo de Caso 003](implementations/003-reestruturacao-frontend-alinhamento-app-v1.md):** Reestruturação do frontend `media8-web`, biblioteca ShadCN UI e alinhamento visual com `media8-app-v1`.
- **[Estudo de Caso 004](implementations/004-arquitetura-projetos-mvp-visual-workstation.md):** Transição da terminologia para Projetos e desenvolvimento do MVP Visual das 6 telas operacionais da Workstation.
- **[Estudo de Caso 005](implementations/005-basecontroller-projetos-links-dinamicos.md):** Padrão WorkstationBaseController (`api/v1`), cadastramento de Projetos com múltiplos links categorizados (`ProjectLinks`), validações de URL e Soft/Hard Delete.
