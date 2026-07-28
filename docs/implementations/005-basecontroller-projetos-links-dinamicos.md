# 005 - [Backend & Frontend]: Padrão WorkstationBaseController (api/v1) e Gestão de Projetos com Links Dinâmicos

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

O cadastro de Projetos na **Media 8 | Workstation** exigia evoluções fundamentais de arquitetura full-stack:
1. **Centralização de Controllers da API**: Todos os controladores possuíam duplicação dos atributos `[ApiController]` e `[Route("api/[controller]")]`, dificultando o versionamento global da API.
2. **Links Múltiplos Categorizados**: Projetos de edição frequentemente recebem múltiplos links externos (pastas do Google Drive, arquivos de áudio, vídeos, PDFs de roteiro ou imagens de referência).
3. **ID do Pedido (CRM Alias)**: Necessidade de vincular uma chave fria/alias de referência externa (`#0254` ou `ORD-9981`) sem impor FK física no banco de dados.
4. **Ciclo de Vida de Exclusão**: Suporte a **Soft Delete** e **Hard Delete** via parâmetros de query.

---

## 🧠 Estratégia da Solução

1. **Padrão `WorkstationBaseController` (`api/v1/[controller]`)**:
   - Criação da classe abstrata `WorkstationBaseController.cs` decorada com `[ApiController]` e `[Route("api/v1/[controller]")]`.
   - Refatoração de todos os controladores (`AuthController`, `UsersController`, `OrdersController`, `AssetsController`, `TimecodeMarkersController` e o novo `ProjectsController`) para herdarem desta classe base.
   - Atualização do cliente Axios no frontend (`api.ts`) com `baseURL: ${API_BASE_URL}/api/v1`.

2. **Modelagem Relacional `ProjectLinks` (PostgreSQL / EF Core)**:
   - Criação da nova tabela `"ProjectLinks"` relacionada a `"Projects"`.
   - Tipagem por enum/string: `Folder` (Pasta Drive), `Video`, `Audio`, `Image`, `PDF`, `Other`.
   - Mapeamento de `IsDeleted` e `ExternalOrderReference` na entidade `Project`.

3. **Frontend React SPA (`ProjectsPage.tsx`)**:
   - Formulário com adição e remoção dinâmica de campos de links.
   - Dropdown de classificação à frente de cada URL.
   - Botão **`+ ADICIONAR LINK`** estilizado conforme as diretrizes da marca.
   - Validação defensiva de formato de URL no frontend e no backend.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10)
- `Media8.Workstation.Api/Controllers/WorkstationBaseController.cs`: Criado controlador base abstrato com rota `api/v1/[controller]`.
- `Media8.Workstation.Api/Controllers/ProjectsController.cs`: Criado controlador com endpoints `GET`, `GET {id}`, `POST`, `PUT` e `DELETE` (Soft/Hard delete).
- `Media8.Workstation.Domain/Entities/ProjectLink.cs`: Criada entidade de domínio.
- `Media8.Workstation.Domain/Entities/Project.cs`: Atualizada entidade com suporte a `Links`, `ExternalOrderReference` e `IsDeleted`.
- `Media8.Workstation.Infrastructure/Data/WorkstationDbContext.cs`: Mapeado `DbSet<ProjectLink>` e relacionamentos no EF Core.

### Frontend (React SPA)
- `src/types/index.ts`: Adicionada interface `ProjectLink` e atualizada interface `Project`.
- `src/services/api.ts`: Atualizado `baseURL` para `/api/v1` e adicionados métodos CRUD em `ProjectService`.
- `src/pages/ProjectsPage.tsx`: Implementado formulário dinâmico de links e validações.

---

## 🎯 Impacto e Resultado

* **[Versionamento Centralizado]**: Todos os controladores agora respondem em `api/v1/[controller]` via `WorkstationBaseController`.
* **[Múltiplos Links Categorizados]**: Suporte a links de pastas Drive, áudios, vídeos e PDFs.
* **[Validação Defensiva & Soft Delete]**: URLs validadas antes do envio e exclusão defensiva com recuperação.
* **[Contratos em PascalCase]**: Contratos TypeScript e C# 100% integrados em PascalCase.

---

**Nota do Desenvolvedor:** *O padrão BaseController trouxe extrema elegância e maturidade à API .NET 10. A criação dinâmica de links categorizados prepara o terreno para automações avançadas dos Workers.*
