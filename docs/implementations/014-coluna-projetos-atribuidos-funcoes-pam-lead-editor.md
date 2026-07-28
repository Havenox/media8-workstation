# Estudo de Caso 014: Coluna "Projetos Atribuídos", Atribuição Múltipla com Funções PAM & Lead Editor

> **Status**: Concluído  
> **Data**: 2026-07-28  
> **Autor**: Antigravity AI  
> **Versão**: 2.9.0  

---

## 🎯 1. Contexto & Motivação

1. **Restauração da Coluna "Projetos Atribuídos"**:
   - A coluna de visualização de atribuição de projetos na tabela de usuários foi restaurada.
   - **Regra de Negócio Refinada**: A coluna exibe a contagem exata e real de atribuições explícitas (ex: `0 Projetos`, `1 Projeto`, `3 Projetos`), tanto para **Admins** quanto para **Editores**.
   - O privilégio de **Admin** confere acesso de gerenciamento global na plataforma PAM, mas **não implica estar vinculado como editor/responsável de um projeto**. Se um Admin não for atribuído como editor de nenhum projeto, exibirá `0 Projetos`.

2. **Editor Responsável (Lead Editor) & Funções da Produção (Assignment Roles)**:
   - Todo projeto possui **1 Editor Responsável (Lead Editor)** obrigatório.
   - A atribuição de editores a projetos suporta funções específicas da produção audiovisual:
     - `General` $\rightarrow$ Edição Geral / Montagem
     - `Decoupage` $\rightarrow$ Decoupagem & Seleção de Takes
     - `AudioTreatment` $\rightarrow$ Tratamento de Áudio & Mixagem
     - `ColorGrading` $\rightarrow$ Color Grading & Correção de Cor
     - `MotionGraphics` $\rightarrow$ Motion Graphics & VFX
     - `Reviewer` $\rightarrow$ Revisão & Controle de Qualidade (QC)

---

## 🛠️ 2. Arquitetura da Solução

### 2.1 Backend (.NET 10 & EF Core)
- **Modelos de Domínio (`Project.cs` & `ProjectEditor.cs`)**:
  - `Project.cs`: Adicionadas propriedades `LeadUserId` (`Guid?`) e navegação `LeadUser`.
  - `ProjectEditor.cs`: Adicionadas propriedades `AssignmentRole` (`string`, default `"General"`) e `IsLead` (`bool`).
- **Migração Dinâmica (`DbSeeder.cs`)**:
  - Adicionadas instruções `ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "LeadUserId" uuid;` e `ALTER TABLE "ProjectEditors" ADD COLUMN IF NOT EXISTS "AssignmentRole" text; ALTER TABLE "ProjectEditors" ADD COLUMN IF NOT EXISTS "IsLead" boolean;`.
- **`UsersController.cs`**:
  - Calculada a contagem real `AssignedProjectsCount` no DTO `UserDto` via subconsulta no Entity Framework Core.
- **`ProjectsController.cs`**:
  - Criação e atualização de projetos sincronizam automaticamente o `LeadUserId` como `ProjectEditor` com `IsLead = true` e `AssignmentRole = "General"`, juntamente com os editores adicionais.

### 2.2 Frontend (React SPA)
- **`types/index.ts`**: Atualizadas as interfaces `User`, `ProjectEditor` e `Project`.
- **`UsersPage.tsx`**: Adicionada a coluna **"Projetos Atribuídos"** exibindo `{u.AssignedProjectsCount ?? 0} {u.AssignedProjectsCount === 1 ? 'Projeto' : 'Projetos'}` em fonte mono e caixa normal.

---

## 🧪 3. Validação e Qualidade

1. **Suíte de Testes Unitários**: 100% de aprovação (10/10 testes aprovados no .NET 10).
2. **Compilação SPA**: `npm --prefix media8-web run build` finalizado com sucesso em 5.8s.
3. **Containers Docker**: Recompilados e iniciados com sucesso via `docker compose up -d --build`.

---

## 📜 4. Histórico de Commits Atômicos

- `feat(api): adiciona LeadUserId em Project, AssignmentRole/IsLead em ProjectEditor e AssignedProjectsCount em UserDto`
- `feat(front): restaura coluna Projetos Atribuidos na tabela de usuarios com contagem real`
- `docs: cria estudo de caso 014 e atualiza matriz arquitetural v2.9.0`
