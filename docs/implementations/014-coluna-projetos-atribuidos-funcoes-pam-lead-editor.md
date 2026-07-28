# 014 - Gestão de Usuários e Projetos: Coluna Projetos Atribuídos, Funções PAM & Lead Editor

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

No modelo legado da estação PAM Media 8 Workstation, a coluna de atribuição de projetos exibia a string genérica "Acesso Global (Todos)" para Administradores e a contagem simples para Editores. Essa abordagem continha duas limitações arquiteturais:
1. **Distorção de Responsabilidade**: Ser Administrador confere acesso de gerenciamento global a todas as áreas da plataforma, porém **não implica estar atribuído como responsável ou editor de um projeto de edição específico**. Uma Admin (como Shaiany) sem projetos sob sua responsabilidade exibia erroneamente "Acesso Global", dificultando o acompanhamento real das atribuições da equipe.
2. **Atribuição Simples sem Escopo de Produção**: A vinculação de editores era binária (atribuído / não atribuído), sem distinção de quem é o **Editor Responsável (Lead Editor)** pelo projeto nem da **função específica da produção** (Decoupagem, Tratamento de Áudio, Color Grading, Motion Graphics ou Revisão QC).

---

## 🧠 Estratégia da Solução

1. **Restauração da Coluna "Projetos Atribuídos" com Contagem Exata**:
   - A coluna de usuários foi atualizada para exibir exclusivamente a quantidade real de projetos em que o usuário está explicitamente atribuído (`0 Projetos`, `1 Projeto`, `3 Projetos`), independente do seu papel no sistema (Admin ou Editor).

2. **Arquitetura de Atribuições com 1 Lead Editor e Funções PAM**:
   - **Lead Editor Obrigatório**: Todo projeto passa a ter obrigatoriamente 1 Editor Responsável (`LeadUserId`). A gravação de um projeto auto-atribui o Lead Editor na junção `ProjectEditor` com a flag `IsLead = true` e função `General`.
   - **Funções Específicas da Atribuição (`AssignmentRole`)**: Editores adicionais vinculados a um projeto recebem funções operacionais (`General`, `Decoupage`, `AudioTreatment`, `ColorGrading`, `MotionGraphics`, `Reviewer`).

---

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13 & EF Core)
- **`Project.cs` & `ProjectEditor.cs`**:
  - Adicionada a propriedade `LeadUserId` (`Guid?`) e a navegação `LeadUser` em `Project.cs`.
  - Adicionadas as propriedades `AssignmentRole` (`string`, default `"General"`) e `IsLead` (`bool`, default `false`) na entidade `ProjectEditor.cs`.
- **`DbSeeder.cs`**:
  - Adicionadas instruções SQL nativas idempotentes (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) para migração dinâmica sem quebra em bancos de dados PostgreSQL já inicializados.
- **`UsersController.cs`**:
  - Projeção de `UserDto` atualizada para mapear a propriedade `AssignedProjectsCount` contando via EF Core os registros ativos em `ProjectEditors` onde o projeto não está deletado.
- **`ProjectsController.cs`**:
  - Atualizadas as rotas `CreateProject` e `UpdateProject` para processar `LeadUserId` e `AssignedEditors`, persistindo o Lead Editor e as funções PAM de cada integrante da produção.

### Frontend (React SPA & TypeScript)
- **`types/index.ts`**:
  - Adicionadas as propriedades `AssignedProjectsCount` em `User`, `AssignmentRole` e `IsLead` em `ProjectEditor`, e `LeadUserId` em `Project`.
- **`UsersPage.tsx`**:
  - Reinserida a coluna **"Projetos Atribuídos"** no cabeçalho e corpo da tabela de usuários, utilizando tipografia em fonte mono e estilo normal-case.
- **`App.tsx`**:
  - Corrigida a importação de `useCallback` no cabeçalho do arquivo, zerando o aviso runtime de `ReferenceError`.

---

## 🎯 Impacto e Resultado

* **Transparência de Atribuições**: A tabela de usuários reflete com 100% de precisão o volume real de projetos sob responsabilidade de cada integrante da produtora (Admins e Editores).
* **Escalabilidade da Produção Audiovisual**: A Workstation PAM agora suporta a divisão de trabalho por especialidades (Decoupagem, Mixagem de Áudio, Color Grading, VFX e Revisão QC), mantendo sempre 1 Lead Editor como responsável primário.
* **Estabilidade e Qualidade**: 100% dos testes unitários no backend (10/10) e a compilação do bundle frontend Vite finalizados sem nenhum erro ou aviso.

---

**Nota do Desenvolvedor:** *A separação entre permissão de acesso global (RBAC) e atribuição operacional por projeto é um pilar essencial para sistemas PAM industriais. Garantir que a contagem de projetos reflita atribuições reais evita ambiguidades na alocação de equipe e abre caminho para métricas avançadas de fluxo de trabalho.*
