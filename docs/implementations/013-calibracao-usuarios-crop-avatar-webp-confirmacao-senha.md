# Estudo de Caso 013: Calibração de Usuários (UX, Design System, Confirmação de Senha 3s & Fotos de Perfil com Crop 1:1 e WebP 200x200px)

> **Status**: Concluído  
> **Data**: 2026-07-28  
> **Autor**: Antigravity AI  
> **Versão**: 2.6.0  

---

## 🎯 1. Contexto & Motivação

Após os ajustes iniciais de paginação da tela de **Usuários**, foram identificados pontos cruciais de melhoria visual, usabilidade e segurança:
1. O rótulo no Sidebar ainda apresentava a string legada "Usuários & Atribuições".
2. Os cabeçalhos da tabela estavam estilizados em caixa alta (`uppercase`), destoando dos padrões de design refinados da aplicação.
3. Menções a jargões de desenvolvedor ("RBAC", "Papel (RBAC)") estavam expostos na interface.
4. Redefinições administrativas de senha não possuíam uma confirmação de segurança com tempo de reflexão.
5. Ausência de foto de perfil (avatar) do usuário e falta de pipeline de upload, recorte interativo e conversão otimizada de armazenamento em disco (`/storage`).

---

## 🛠️ 2. Arquitetura da Solução

### 2.1 Backend (.NET 10, C# 13 & SixLabors.ImageSharp)
- **NuGet `SixLabors.ImageSharp` (3.1.7)**: Adicionado ao projeto API para validação de magic bytes, crop proporcional e compressão WebP.
- **Entidade `User.cs` & DTOs (`UserDto`, `CreateUserRequest`, `UpdateUserRequest`)**: Adicionada a propriedade `AvatarUrl` (`string?`).
- **`DbSeeder.cs`**: Inclusão de verificação dinâmica da coluna `AvatarUrl` na tabela `Users` no PostgreSQL.
- **`UsersController.cs`**:
  - `POST /api/v1/Users/{id}/avatar`: Valida o arquivo via ImageSharp (`Image.LoadAsync`), redimensiona/corta para **200x200px** (`ResizeMode.Crop`) e grava em `wwwroot/storage/avatars/{id}.webp` com **WebP @ 80% de qualidade**.
- **`Program.cs`**: Ativado `app.UseStaticFiles()` para serving de fotos de perfil estáticas.

### 2.2 Frontend (React SPA & Canvas 1:1 Crop)
- **`Sidebar.tsx`**: Rótulo ajustado para unicamente **"Usuários"**.
- **`UserRoleSelect.tsx` & `UsersPage.tsx`**: Purga de jargões técnicos ("RBAC"), substituindo por **"Função"** / **"Função de Acesso"**.
- **Tabela Padrão Apple**: Cabeçalhos estilizados em caixa normal (`normal-case text-[#FFFBED] font-semibold text-xs tracking-tight`).
- **`AvatarCropModal.tsx`**: Modal interativo de recorte 1:1 com grade de enquadramento (Regra dos Terços), slider de zoom e arraste (pan). Gera o Blob de saída cortado em Canvas.
- **`PasswordResetConfirmModal.tsx`**: Modal de segurança de 2 passos exibido ao redefinir a senha do usuário, contendo **contador regressivo de 3 segundos** antes de habilitar o botão "Confirmar Redefinição".
- **`Header.tsx` & `UsersPage.tsx`**: Exibição da foto do perfil (`AvatarUrl`) no menu superior e nas linhas da tabela de usuários.

---

## 🧪 3. Validação e Qualidade

1. **Suíte de Testes Unitários**: 100% de aprovação nos testes (.NET 10) incluindo `TestHostEnvironment`.
2. **Compilação SPA**: `npm run build` executado sem erros de compilação ou de linting.
3. **Containers Docker**: Recompilados e atualizados com sucesso (`media8-workstation-api` e `media8-workstation-web`).

---

## 📜 4. Histórico de Commits Atômicos

- `feat(api): adiciona propriedade AvatarUrl em User e endpoint de upload com ImageSharp WebP 200x200px`
- `feat(front): cria AvatarCropModal 1:1, PasswordResetConfirmModal com contador 3s e ajusta rotulo do Sidebar`
- `docs: adiciona estudo de caso 013 e atualiza matriz arquitetural v2.6.0`
