# 009 - [Frontend]: Componente Customizado LinkTypeSelect e Correção de Contraste no Hover

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 28/07/2026  

---

## 🚀 Desafio de Engenharia

O formulário de criação e edição de projetos apresentava duas inconsistências visuais importantes:
1. **Dropdown Nativo Sem Estilo**: O seletor de tipo de link utilizava a tag HTML `<select>` nativa, exibindo um menu retangular azul do sistema operacional, sem suporte a ícones explicativos e fora do padrão estético da marca.
2. **Desaparecimento de Ícones no Hover**: Ao passar o cursor (hover) sobre os botões dos cards de projetos ("Iniciar Ingestão" e Badges de Links Anexados), o fundo alterava para vinho escuro (`#400404`) e o texto para creme (`#FFFBED`), porém os ícones vetoriais mantinham a cor estática `#400404`, tornando-se invisíveis.

---

## 🧠 Estratégia da Solução

1. **Desenvolvimento do Componente `LinkTypeSelect` (`LinkTypeSelect.tsx`)**:
   - Criação de um componente de Select customizado baseado no ShadCN / Radix UI `Popover`.
   - Incorporação de ícones vetoriais **Lucide React** específicos para cada categoria (`FolderKanban`, `Video`, `Music`, `ImageIcon`, `FileText`, `Link2`).
   - Aplicação da paleta oficial do Media 8: `#FFFBED` (Creme Suave), `#400404` (Vinho Profundo), cantos arredondados (`rounded-xl`), sombra (`shadow-xl`) e indicador visual de seleção (`Check`).

2. **Sincronização de Contraste no Hover**:
   - Aplicação da classe Tailwind `group` nos elementos pais interativos.
   - Sincronização dos ícones vetoriais com a propriedade `currentColor` e `group-hover:text-[#FFFBED]`, garantindo que a cor dos ícones acompanhe perfeitamente a cor do texto durante o estado de hover.

---

## 🛠️ Implementação Técnica

### Frontend (React SPA)
- `src/components/LinkTypeSelect.tsx`: Componente customizado com dropdown estilizado e suporte a ícones vetoriais Lucide.
- `src/pages/ProjectsPage.tsx`: Substituição dos `<select>` nativos pelas instâncias do `LinkTypeSelect` e adição de `group` com `currentColor` nos botões e links anexados dos cards.

---

## 🎯 Impacto e Resultado

* **[Experiência Visual de Luxo]**: Seletor de tipo de link 100% harmonizado com o Media 8 Design System.
* **[Identificação Visual Instantânea]**: Ícones vetoriais nos menus ajudam o usuário a categorizar links rapidamente.
* **[Contraste Perfeito no Hover]**: Transição de cores suave e legibilidade impecável sem ícones ocultos.

---
**Nota do Desenvolvedor:** *Manter o componente de Select isolado e flexível permitiu garantir a estética de alto padrão ShadCN/Radix UI sem comprometer a simplicidade do estado nos formulários React.*
