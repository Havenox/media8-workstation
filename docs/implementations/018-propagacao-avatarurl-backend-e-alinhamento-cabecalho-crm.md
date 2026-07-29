# Estudo de Caso 018: Propagação de AvatarUrl no Backend .NET 10 e Alinhamento 1:1 do Cabeçalho e Menu Dropdown de Usuário com o App CRM

## 1. Visão Geral

Este estudo de caso documenta a solução definitiva para a propagação da foto de perfil (`AvatarUrl`) do usuário autenticado no backend .NET 10, bem como a padronização e alinhamento visual 1:1 do cabeçalho superior fixo (`Header.tsx`), modal de busca (`GlobalSearch.tsx`), sininho de notificações (`NotificationsDropdown.tsx`) e menu de avatar (`UserNav.tsx`) do **Media 8 Workstation PAM** com a especificação visual do **Media 8 CRM (app-v1)**.

---

## 2. Contexto & Diagnóstico da Causa Raiz

### Ausência da Foto do Usuário Logado
Ao realizar o login ou atualizar a aplicação, o componente de topo `UserNav` renderizava as iniciais em texto (ex: "EO") como fallback, mesmo quando o usuário logado (Eduardo Oliveira) possuía foto cadastrada no banco de dados.

**Causa Raiz Identificada na API .NET 10**:
1. O DTO de resposta `AuthResponse.cs` não continha a propriedade `AvatarUrl`.
2. O endpoint `POST /api/v1/Auth/login` e o endpoint `GET /api/v1/Auth/me` em `AuthController.cs` não mapeavam a foto do usuário (`user.AvatarUrl`) para a resposta de autenticação.
3. Como resultado, o estado global `currentUser` no React recebia `AvatarUrl` indefinido (`undefined`), acionando o fallback de iniciais.

### Desalinhamentos Visuais no Cabeçalho
1. **Sininho de Notificação**: O badge do contador de não lidas ficava posicionado sobre a área interna do botão do sininho devido a classes de posicionamento ad-hoc.
2. **Container do Cabeçalho**: Altura e espaçamentos variados em telas responsivas.
3. **Menu Dropdown de Usuário**: Faltava o anel de foco sutil (`ring-2 ring-[#400404]/20 hover:ring-[#400404]/40`) e padronização dos itens.

---

## 3. Implementação Técnica

### Backend .NET 10 (`media8-api`)

1. **`AuthResponse.cs`**:
   ```csharp
   namespace Media8.Workstation.Application.DTOs;

   public class AuthResponse
   {
       public string Token { get; set; } = string.Empty;
       public Guid UserId { get; set; }
       public string Name { get; set; } = string.Empty;
       public string Email { get; set; } = string.Empty;
       public string Role { get; set; } = string.Empty;
       public string? AvatarUrl { get; set; }
   }
   ```

2. **`AuthController.cs`**:
   - Atualizado o método `Login()` para mapear `AvatarUrl = user.AvatarUrl`.
   - Atualizado o método `GetCurrentUser()` (`GET /api/v1/Auth/me`) para mapear `AvatarUrl = user.AvatarUrl`.

### Frontend React SPA (`media8-web`)

1. **`UserNav.tsx`**:
   - Ajustado o botão do avatar para utilizar anel de foco sutil: `h-9 w-9 rounded-full bg-[#400404] text-[#FFFBED] font-semibold text-sm flex items-center justify-center overflow-hidden ring-2 ring-[#400404]/20 hover:ring-[#400404]/40 transition-all shadow-xs shrink-0 cursor-pointer`.
   - Corrigida a renderização do `avatarSrc` tanto na bolinha do topo quanto no cabeçalho do popup dropdown.

2. **`NotificationsDropdown.tsx`**:
   - Reformulado o botão trigger: `relative w-9 h-9 flex items-center justify-center text-[#400404] hover:bg-[#400404]/10 rounded-full transition-colors cursor-pointer focus:outline-none shrink-0`.
   - Badge posicionado estritamente no canto superior direito exterior: `absolute -top-1 -right-1 w-4 h-4 bg-[#400404] text-[#FFFBED] text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs`.

3. **`Header.tsx`**:
   - Container fixado em `h-16 px-4 md:px-6 flex items-center justify-between` 1:1 com o CRM.

---

## 4. Resultados & Validação

- **Testes Unitários Backend**: 10/10 aprovados (100% pass).
- **Vite Production Build**: 0 erros de compilação (8.10s).
- **Docker Compose**: 4/4 containers recompilados e operando de forma saudável.
- **Experiência Visual**: Foto do usuário Eduardo Oliveira é renderizada com nitidez no canto superior direito e dentro do menu dropdown. Cabeçalho e sininho estão 100% idênticos ao app CRM.

---

## 5. Arquitetura de Segurança de Mídias (`StorageController` + Cookies HttpOnly)

### Acesso Protegido a Mídias Privadas
1. **Desativação Total do Acesso Público**: O middleware `UseStaticFiles('/storage')` e a localização `/storage/` do Nginx foram permanentemente desativados.
2. **Controlador Protegido `StorageController`**: Anotado com `[Authorize]`, exige token JWT via Cookie de segurança (`media8_auth`).
3. **Absoluto Banimento de Tokens em URLs**: Mídias são servidas via URLs limpas (`/api/v1/Storage/avatars/xxx.webp`). Nenhum token JWT é exposto em parâmetros de query (`?token=...`).
4. **Renovação Automática de Cookie (`GET /Auth/me`)**: Ao carregar a aplicação, a API renova a Cookie de segurança `media8_auth` (`HttpOnly`, `SameSite=Lax`, `Path=/`), permitindo que a tag `<img src="...">` envie a cookie nativamente.
5. **Bloqueio em Aba Anônima**: Tentativas de acesso externo direto retornam estritamente **HTTP 401 Unauthorized**.
