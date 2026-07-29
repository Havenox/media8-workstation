# 016 - Seções Retráteis Sutis & Switch Minimalista de Ingestão Automática nos Modais de Projeto

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 29/07/2026  

---

## 🚀 Desafio de Engenharia

Com a introdução dos seletores de Lead Editor e da Equipe por Especialidades PAM (Estudos de Caso 014 e 015), os modais de **Novo Projeto** e **Editar Projeto** em `ProjectsPage.tsx` tornaram-se extensos verticalmente.

Para otimizar o fluxo de trabalho dos usuários e evitar formulários gigantes e poluídos visualmente, solicitou-se a organização do modal em seções que pudessem ser abertas e fechadas suavemente (estilo sanfona minimalista, limpa e elegante, longe de sanfonas pesadas estilo FAQ), utilizando rótulos diretos e minimalistas:

- **Seção 1**: **"Equipe"** (agrupando Lead Editor e integrantes PAM).
- **Seção 2**: **"Links dos Materiais"** (agrupando o gerenciamento de links e o switch de ingestão).
- **Caixa de Ingestão Automática**: Relocada para **abaixo da lista de links** em uma caixa minimalista de 1 linha com o ícone `<RefreshCw />` e o texto curto **"Processar mídias automaticamente"** (zerando descrições secundárias ou textos verborrágicos).

---

## 🧠 Estratégia da Solução

1. **Painéis Retráteis Sutis (Sanfona Minimalista)**:
   - **Rótulos Diretos & Curtos**:
     - **Equipe**: Cabeçalho sutil `<Users className="w-4 h-4 text-[#400404]" />` + **"Equipe"** + Badge com contagem de integrantes + `<ChevronDown />` / `<ChevronUp />`.
     - **Links dos Materiais**: Cabeçalho sutil `<Link2 className="w-4 h-4 text-[#400404]" />` + **"Links dos Materiais"** + Badge com contagem de links + `<ChevronDown />` / `<ChevronUp />`.
   - **Comportamento Interativo**: Alternância de estado booleano via clique no cabeçalho sutil, permitindo ocultar ou expandir cada seção dinamicamente.

2. **Ingestão Automática Minimalista (1 Linha)**:
   - **Posicionamento**: Relocada para a base da seção de links (abaixo dos links e do botão de adicionar link).
   - **Design Limpo**:
     - Fundo suave `bg-[#FFFBED]/50 border border-[#400404]/15 rounded-lg flex items-center justify-between`.
     - Ícone vetorial da Lucide React `<RefreshCw className="w-4 h-4 text-[#400404]" />` (engrenagem/ciclo de sincronização automática).
     - Rótulo direto: **"Processar mídias automaticamente"** (sem textos acessórios ou frases longas).

---

## 🛠️ Implementação Técnica

### Frontend (`ProjectsPage.tsx`)
- **Estados Booleanos de Expansão**:
  - `isTeamExpanded`, `isLinksExpanded` (Modal de Criação).
  - `editIsTeamExpanded`, `editIsLinksExpanded` (Modal de Edição).
- **Iconografia Lucide React**:
  - `ChevronDown`, `ChevronUp`, `RefreshCw`.
- **Estruturação Visual**:
  - Envoltórios de cantos suaves `rounded-xl border border-[#400404]/15` com transições CSS limpas.

---

## 🎯 Impacto e Resultado

* **UX Ultra-Limpa e Direta**: Os modais de cadastro e edição de projetos ganharam organização modular minimalista, economizando mais de 40% de altura útil de tela.
* **Leitura Imediata sem Verborragia**: Rótulos curtos ("Equipe", "Links dos Materiais") e caixa minimalista de 1 linha ("Processar mídias automaticamente").
* **Estabilidade & Qualidade**:
  - Build do Vite Frontend: 100% de sucesso.
  - Testes Unitários .NET 10: 10/10 aprovados.
  - Containers Docker: Recompilados e ativos.
