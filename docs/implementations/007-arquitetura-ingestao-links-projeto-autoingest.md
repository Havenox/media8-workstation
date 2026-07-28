# 007 - [Backend & Frontend]: Arquitetura de Ingestão por Links do Projeto, Propriedade AutoIngest e Trigger Auto/Manual

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

O modelo conceitual da estação PAM **Media 8 | Workstation** exigia uma reformulação completa na forma como as mídias entram na esteira de pré-edição:
1. **Incompatibilidade da Ingestão Manual Solta**: Na estação PAM não faz sentido haver um botão solto de "Adicionar Ingestão de Mídia" para subir arquivos individuais sem associação com a lista de links do projeto.
2. **Propriedade `AutoIngest`**: O administrador precisa de controle total sobre o comportamento de disparo de ingestão ao criar ou atualizar um projeto.
3. **Disparo Inteligente Sem Duplicações**: O sistema precisa varrer os links cadastrados no projeto (`ProjectLinks`), verificar se a mídia já foi processada anteriormente e enfileirar apenas os links pendentes em `MediaProcessingJobs`.
4. **Edição Completa de Links do Projeto**: Modal no frontend permitindo atualizar metadados, briefing e gerenciar links existentes ou novos.

---

## 🧠 Estratégia da Solução

1. **Expurgo da Ingestão Solta**:
   - Exclusão do componente `IngestModal.tsx` e remoção do botão de ingestão solta no cabeçalho da Workstation PAM.

2. **Propriedade `AutoIngest` (`boolean`)**:
   - Adicionada na entidade `Project` em C#, no PostgreSQL (DDL automatizada) e nos DTOs da API REST.
   - Adicionado Switch estilizado no formulário de criação e edição do projeto (padrão: `true`).

3. **Endpoint `POST /api/v1/Projects/{id}/TriggerIngest`**:
   - Método atômico na API `ProjectsController` que varre os links do projeto, gera os registros de `WorkstationAsset` (Status: "Pending") e tarefas em `MediaProcessingJobs` (JobType: "IngestDownload"), evitando duplicidades para links já processados.
   - Acionamento automático (quando `AutoIngest == true`) ou manual através do botão **"Iniciar Ingestão"** no card do projeto ou na Workstation PAM.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10)
- `Media8.Workstation.Domain/Entities/Project.cs`: Adicionada propriedade `AutoIngest`.
- `Media8.Workstation.Infrastructure/Data/DbSeeder.cs`: Adicionada DDL `ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "AutoIngest" boolean NOT NULL DEFAULT true;`.
- `Media8.Workstation.Api/Controllers/ProjectsController.cs`: Criados DTOs com `AutoIngest` e endpoint `TriggerIngest`.
- `Media8.Workstation.UnitTests/ProjectsControllerTests.cs`: Adicionados testes unitários para o acionamento de `TriggerIngest`.

### Frontend (React SPA)
- `src/pages/ProjectsPage.tsx`: Adicionado Switch de `AutoIngest`, Modal de Edição de Projeto e Ação de disparo manual.
- `src/pages/WorkstationPage.tsx`: Removida modal antiga e adicionado botão de disparo no cabeçalho do projeto.
- `src/services/api.ts`: Adicionado `ProjectService.triggerProjectIngest`.

---

## 🎯 Impacto e Resultado

* **[Fluxo de Negócio Correto]**: As mídias derivam 100% dos links associados ao Projeto.
* **[Automação Flexível]**: Suporte a ingestão automática (padrão) ou acionamento manual sob demanda.
* **[Garantia Contra Duplicidades]**: Verificação inteligente impedindo enfileiramento repetido de links já processados.
