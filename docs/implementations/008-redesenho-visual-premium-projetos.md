# 008 - [Frontend]: Redesenho Visual Premium (Padrão Apple) na Gestão de Projetos e Banimento de Emojis

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia & Design

A interface gráfica da página de Projetos (`/projetos`) apresentava inconformidades com as diretrizes visuais do ecossistema **Media 8** (estipuladas nos prints 2 e 3 do `media8-app-v1`):
1. **Poluição por Emojis**: A presença de emojis unicode (como 📁, 🎬, 🎵, 🖼️, 📄, 🔗) empobrecia a estética da estação profissional PAM.
2. **Excesso de Negrito (Falta de Hierarquia Tipográfica)**: Pesos pesados (`font-bold` em excesso) tornavam a visualização cansativa.
3. **Cores Berrantes**: Badges roxas e amarelas intensas que fugiam da paleta minimalista de luxo da marca.

---

## 🧠 Estratégia da Solução

1. **Banimento Total de Emojis**:
   - Substituição de 100% dos emojis por ícones vetoriais elegantes da biblioteca **Lucide React** (`FolderKanban`, `Video`, `Music`, `ImageIcon`, `FileText`, `Link2`, `Clock`, `Zap`).
2. **Ajuste Tipográfico Refinado (Padrão Apple)**:
   - Títulos primários ajustados para peso semi-bold (`font-semibold text-base text-[#400404] tracking-tight`).
   - Textos explicativos e descrições ajustados para pesos suaves (`font-normal text-xs text-[#5C1212]/80`).
3. **Harmonização da Paleta & Tags Sutis**:
   - Aplicação da paleta oficial do Media 8: `#FFFBED` (Creme Suave), `#400404` (Vinho Profundo), bordas ultra finas `border-[#400404]/15` e tags minimalistas discretas.

---

## 🛠️ Implementação Técnica

### Frontend (React SPA)
- `src/pages/ProjectsPage.tsx`: Redesenho estético dos cards de projetos, tags sutis de status/prazos/CRM ref, modal de criação e edição com ícones Lucide vetoriais.
- `src/pages/DashboardPage.tsx`: Atualizado com a mesma hierarquia tipográfica leve e remoção de emojis.

---

## 🎯 Impacto e Resultado

* **[Estética de Luxo]**: Interface 100% alinhada ao padrão Apple / Media 8 Design System.
* **[Zero Emojis]**: Ícones vetoriais precisos e elegantes em toda a aplicação.
* **[Leitura Confortável]**: Hierarquia visual clara, sem poluição de cores berrantes ou excesso de negrito.
