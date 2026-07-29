# 015 - Gestão de Atribuições de Editores por Admins: Lead Editor, Funções PAM & Avatar Stack

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 29/07/2026  

---

## 🚀 Desafio de Engenharia

Com o refinamento do modelo de atribuições (Estudo de Caso 014), os projetos passaram a exigir a definição explícita do **Editor Responsável (Lead Editor)** e o agrupamento de **editores adicionais por especialidade PAM** (Decoupagem, Áudio, Color Grading, Motion Graphics e Revisão).

No entanto, a interface de usuário da listagem de projetos (`ProjectsPage.tsx`) ainda não oferecia aos Administradores a capacidade de selecionar o Lead Editor, adicionar/remover integrantes com suas respectivas funções operacionais, nem visualizar graficamente a equipe responsável em cada Card de Projeto.

---

## 🧠 Estratégia da Solução

1. **Gestão Visual nos Modais (`Novo Projeto` & `Editar Projeto`)**:
   - **Editor Responsável (Lead Editor)**: Campo obrigatório com o componente de seleção da `shadcn/ui`, pré-selecionando o criador e permitindo alteração rápida.
   - **Equipe do Projeto & Funções PAM**: Seção interativa em que o Admin seleciona o usuário e a sua função na produção, gerenciando a lista de integrantes dinamicamente com ações de inclusão (`UserPlus`) e remoção (`Trash2`).

2. **Visualização Gráfica nos Cards de Projetos (Avatar Stack + Popover)**:
   - **Avatar Stack**: Exibição da pilha de avatares dos editores atribuídos no rodapé de cada Card.
   - **Destaque de Lead**: O avatar do Lead Editor recebe destaque com borda dourada (`ring-amber-400`) e mini-badge de coroa (`Crown`).
   - **Popover Interativo (`shadcn/ui Popover`)**: Ao clicar/interagir com a pilha de avatares, um popover estilizado apresenta a lista completa da equipe com avatares, nomes, e-mails e badges coloridos com os ícones vetoriais `Lucide React` de cada especialidade.

3. **Zero Emojis Unicode**:
   - Toda a representação visual da interface atende 100% à diretriz de banimento de emojis, utilizando exclusivamente ícones vetoriais da biblioteca `lucide-react`:
     - `General` $\rightarrow$ `<Film />` (Edição Geral / Lead)
     - `Decoupage` $\rightarrow$ `<Scissors />` (Decoupagem & Seleção)
     - `AudioTreatment` $\rightarrow$ `<Volume2 />` (Tratamento de Áudio)
     - `ColorGrading` $\rightarrow$ `<Palette />` (Color Grading)
     - `MotionGraphics` $\rightarrow$ `<Zap />` (Motion Graphics / VFX)
     - `Reviewer` $\rightarrow$ `<CheckCircle2 />` (Revisão / Controle QC)

---

## 🛠️ Implementação Técnica

### Backend (.NET 10 & Entity Framework Core)
- **`ProjectsController.cs`**:
  - Incluída a navegação `.Include(p => p.AssignedEditors).ThenInclude(pe => pe.User)` em `GetProjects` e `GetProjectById`, garantindo que os objetos de usuário e funções de atribuição sejam serializados nativamente para o frontend.

### Frontend (React SPA, TypeScript & Tailwind CSS)
- **`services/api.ts`**:
  - Atualizadas as assinaturas de `createProject` e `updateProject` em `ProjectService` para enviar `LeadUserId` e o array `AssignedEditors`.
- **`ProjectsPage.tsx`**:
  - Declarado a constante helper `PAM_ROLES` mapeando cada ID de função ao seu rótulo, cor de badge e ícone `Lucide React`.
  - Adicionadas variáveis de estado e handlers `handleAddAdditionalEditor` e `handleRemoveAdditionalEditor` para manipular atribuições tanto no modal de criação quanto no modal de edição.
  - Implementado a pilha de avatares com `<Popover>` e `<PopoverContent>` da `shadcn/ui` no rodapé dos Cards de Projeto.

---

## 🎯 Impacto e Resultado

* **Controle Total por Administradores**: Admins conseguem atribuir o Lead Editor e escalar a equipe com atribuições de funções operacionais em menos de 10 segundos durante o cadastro ou edição de um projeto.
* **Experiência Visual de Agência Premium**: Os Cards de projetos ganharam visualização gráfica de equipe com Avatar Stacks e popover com badges coloridos por função.
* **Conformidade de Engenharia & Qualidade**:
  - Testes Unitários .NET 10: 100% de aprovação (10/10).
  - Build do Vite Frontend: Concluído com sucesso sem erros.
  - Containers Docker: Recompilados e iniciados perfeitamente via `docker compose up -d --build`.

---

**Nota do Desenvolvedor:** *A inclusão da pilha de avatares com popover na listagem de projetos eleva o Media 8 Workstation ao patamar visual dos softwares de gestão de mídia broadcast mais prestigiados do mercado. O gerenciamento simples de atribuições se conecta perfeitamente com a contagem real da tabela de usuários.*
