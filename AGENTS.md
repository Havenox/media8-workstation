# Diretrizes Básicas e Regras Pétreas do Projeto Media8 Workstation

## 🎨 Regras Pétreas de Interface Visual (UI/UX)

1. **Zero Popups Nativos do Navegador (`alert` / `confirm` / `prompt`)**:
   - É **estritamente proibido** utilizar `window.alert()`, `window.confirm()` ou `window.prompt()` em qualquer parte da aplicação.
   - Qualquer tipo de diálogo, confirmação, aviso ou notificação deve utilizar obrigatoriamente componentes estruturados das bibliotecas visuais (ex: Radix UI / Shadcn `Dialog` e notificações estilizadas).

2. **Fidelidade Total ao Sistema de Design Institucional Media8**:
   - **Proibição de Cores Neon / Gradientes de Arco-Íris**: É terminantemente vedado criar modais escuros com elementos neon, sombras fluorescentes de perigo ou botões coloridos estilo "parque de diversões".
   - **Padrão Oficial de Modais de Confirmação (Padrão CRM / Apple)**:
     - **Fundo do Modal**: Creme Institucional (`bg-[#FFFBED]`).
     - **Borda**: Sutil (`border border-[#400404]/20`).
     - **Tipografia**: Título em Vinho Escuro (`#400404`, font-bold, text-base), descrição em (`#400404`/80, text-xs).
     - **Botão Primário Destrutivo / Arquivamento**: Vermelho limpo e sólido (`bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl px-5 py-2 text-xs shadow-xs border-none`).
     - **Botão Primário Reativação / Ação Padrão**: Vinho institucional sólido (`bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] rounded-xl px-5 py-2 text-xs shadow-xs border-none`).
     - **Botão Secundário / Cancelar**: Outline sutil (`border border-[#400404]/30 bg-transparent text-[#400404] hover:bg-[#400404]/5 rounded-xl px-5 py-2 text-xs`).
