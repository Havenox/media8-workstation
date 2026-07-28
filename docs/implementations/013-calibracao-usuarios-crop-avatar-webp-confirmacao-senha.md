# Estudo de Caso 013: Calibração de Usuários (UX, Input Minimalista de URL com Lápis Interno, Expurgo de Arquivo Físico & Zoom Simétrico)

> **Status**: Concluído  
> **Data**: 2026-07-28  
> **Autor**: Antigravity AI  
> **Versão**: 2.8.0  

---

## 🎯 1. Contexto & Motivação

Após os ajustes iniciais de avatares WebP e armazenamento em `media8-storage/`, foram solicitados aprimoramentos adicionais de interface, sincronia e governança de armazenamento em disco:
1. **Foto no Canto Superior Direito (Header)**: A miniatura do usuário logado não sincronizava instantaneamente ao alterar a foto e o `AvatarUrl` era descartado ao restaurar o `localStorage`.
2. **Entrada Minimalista para URLs Externas de Imagem**: Desejo de colar links de CDNs (ex: Gravatar, Unsplash, S3) através de uma caixa sutil posicionada logo abaixo da caixa de avatar, com estilo desabilitado por padrão e destravada via botão de lápis interno (`Pencil`).
3. **Purga Automática de Arquivo Físico em Disco**: Garantir que, ao trocar o avatar local de um usuário por um link de CDN externa ou novo arquivo, o arquivo físico `.webp` antigo em `media8-storage/avatars/{userId}.webp` seja automaticamente excluído para economizar espaço em disco.
4. **Controles Simétricos de Zoom (-100 a +100) & Botão Reset no Recorte**: Melhoria da usabilidade do modal de crop (`AvatarCropModal.tsx`), adicionando slider centrado em 0 e botão com ícone `RotateCcw` para restaurar o enquadramento original.

---

## 🛠️ 2. Arquitetura da Solução

### 2.1 Backend (.NET 10 & Expurgo de Disco)
- **Purga de Mídia em `UsersController.cs`**:
  - Ao salvar `UpdateUser` onde o `AvatarUrl` inicia por `http://` ou `https://` (URL externa):
    - O controller localiza o arquivo físico antigo em `media8-storage/avatars/{userId}.webp`.
    - Executa `File.Delete(localAvatarFile)` com tratamento de exceção silencioso, eliminando lixo em disco.

### 2.2 Frontend (React SPA & UI Minimalista)
- **Input Sutil de URL Externa com Trava de Lápis**:
  - Renderizado logo abaixo da imagem de perfil nos modais de usuário.
  - Estilo sutil acinzentado (`bg-[#400404]/5 opacity-75 cursor-not-allowed border-[#400404]/15 rounded-xl text-[11px] font-mono px-3 py-1.5`).
  - Botão de lápis interno (`Pencil`) destrava o campo (`isUrlEditingAllowed = true`), permitindo digitação/colagem de links externos com atualização dinâmica do preview 1:1.
- **Sincronização em Tempo Real no Header**:
  - `App.tsx` lê `AvatarUrl` ao carregar usuário salvo do `localStorage`.
  - Passado o callback `onUpdateCurrentUser` para `UsersPage.tsx`, garantindo que quando o usuário logado editar sua própria foto, o `Header.tsx` atualize a miniatura do topo imediatamente.
- **`AvatarCropModal.tsx`**:
  - Slider de zoom variando de `-100` (zoom out 0.5x) até `+100` (zoom in 2.5x), com ponto neutro em `0` (1.0x).
  - Adicionado botão de **Reset** (`RotateCcw`) que redefini o slider para `0` e limpa o deslocamento do mouse (pan).

---

## 🧪 3. Validação e Qualidade

1. **Suíte de Testes Unitários**: 100% de aprovação (10/10 testes aprovados no .NET 10).
2. **Compilação SPA**: `npm --prefix media8-web run build` finalizado com sucesso em 7.5s sem avisos de linter.
3. **Containers Docker**: Recompilados e ativos com sucesso via `docker compose up -d --build`.

---

## 📜 4. Histórico de Commits Atômicos

- `feat(api): adiciona expurgo automatico de arquivo .webp local em UsersController ao mudar para URL externa`
- `feat(front): implementa caixa sutil de URL com lapisinho interno, reset de zoom -100..+100 e sync no Header`
- `docs: atualiza estudo de caso 013 e matriz arquitetural v2.8.0`
