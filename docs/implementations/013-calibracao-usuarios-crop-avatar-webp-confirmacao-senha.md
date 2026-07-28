# Estudo de Caso 013: Calibração de Usuários (UX, Design System, Confirmação de Senha 3s & Fotos de Perfil com Crop 1:1 e WebP 200x200px em media8-storage)

> **Status**: Concluído  
> **Data**: 2026-07-28  
> **Autor**: Antigravity AI  
> **Versão**: 2.7.0  

---

## 🎯 1. Contexto & Motivação

Após os ajustes iniciais de paginação da tela de **Usuários**, foram identificados pontos cruciais de melhoria visual, usabilidade e infraestrutura de mídia:
1. O rótulo no Sidebar ainda apresentava a string legada "Usuários & Atribuições".
2. Os cabeçalhos da tabela estavam estilizados em caixa alta (`uppercase`), destoando dos padrões de design refinados da aplicação.
3. Menções a jargões de desenvolvedor ("RBAC", "Papel (RBAC)") estavam expostos na interface.
4. Redefinições administrativas de senha não possuíam uma confirmação de segurança com tempo de reflexão.
5. Ausência de foto de perfil (avatar) e falha de servimento/persistência em disco por falta de uma pasta dedicada no repositório (`media8-storage/`) montada nos containers e servida centralizadamente pela API REST via Nginx.

---

## 🛠️ 2. Arquitetura da Solução

### 2.1 Armazenamento Centralizado & Infraestrutura (`media8-storage/`)
- **Diretório na Raiz do Repositório (`media8-storage/`)**:
  - Criada a pasta física `media8-storage/` com subdiretórios `avatars/`, `high-fidelity/`, `proxies/` e `waveforms/`.
  - Adicionada a regra `media8-storage/*` e `!media8-storage/**/.gitkeep` no `.gitignore`.
- **Bind Mount Docker (`docker-compose.yml`)**:
  - Mapeado o bind mount `./media8-storage:/storage` para os containers `api`, `worker-ingestion` e `worker-transcoder`.
- **Reverse Proxy Nginx (`media8-web/nginx.conf`)**:
  - Adicionadas regras de repasse `location /api/` e `location /storage/` direcionando chamadas ao container da API (`http://api:5000/storage/`).

### 2.2 Backend (.NET 10 & SixLabors.ImageSharp)
- **Servimento Estático Centralizado (`Program.cs`)**:
  - Configurado `app.UseStaticFiles()` com `PhysicalFileProvider` mapeando o caminho `STORAGE_PATH` (default `./media8-storage` ou `/storage`) para responder em `/storage/*`.
- **Upload e Processamento WebP (`UsersController.cs`)**:
  - `POST /api/v1/Users/{id}/avatar`: Valida a assinatura de imagem (magic bytes), redimensiona e corta em 1:1 (200x200px) e grava a foto em `media8-storage/avatars/{id}.webp` com **WebP @ 80% de qualidade**.

### 2.3 Frontend (React SPA & Crop 1:1)
- **`Sidebar.tsx`**: Rótulo ajustado para unicamente **"Usuários"**.
- **`UserRoleSelect.tsx` & `UsersPage.tsx`**: Purga de jargões técnicos ("RBAC"), substituindo por **"Função"** / **"Função de Acesso"**.
- **Tabela Padrão Apple**: Cabeçalhos estilizados em caixa normal (`normal-case text-[#FFFBED] font-semibold text-xs tracking-tight`).
- **`AvatarCropModal.tsx`**: Modal interativo de recorte 1:1 com grade de enquadramento (Regra dos Terços), slider de zoom e arraste (pan).
- **`PasswordResetConfirmModal.tsx`**: Modal de segurança de 2 passos com **contador regressivo de 3 segundos** antes de habilitar a confirmação de nova senha.
- **`Header.tsx` & `UsersPage.tsx`**: Exibição da foto do perfil (`AvatarUrl`) no menu superior e na tabela.

---

## 🧪 3. Validação e Qualidade

1. **Suíte de Testes Unitários**: 100% de aprovação nos testes (.NET 10).
2. **Compilação SPA**: `npm run build` executado sem erros TypeScript.
3. **Containers Docker**: Recompilados e atualizados com sucesso (`media8_workstation_api`, `media8_workstation_web`, `worker-ingestion`, `worker-transcoder`).

---

## 📜 4. Histórico de Commits Atômicos

- `feat(storage): cria estrutura media8-storage na raiz do repositorio, bind mount docker e proxy no Nginx`
- `feat(api): adiciona PhysicalFileProvider em Program.cs e grava avatares WebP em media8-storage/avatars`
- `feat(front): ajusta AvatarCropModal 1:1, PasswordResetConfirmModal 3s e exibe avatares no Header e UsersPage`
- `docs: adiciona estudo de caso 013 e atualiza matriz arquitetural v2.7.0`
