import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserPlus, Crown, Video, Loader2, Search, Edit2, Upload, Camera, Pencil, Check } from 'lucide-react';
import type { User, Project, UserStats } from '../types';
import { UserService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { UserRoleSelect, UserRoleOption } from '../components/UserRoleSelect';
import { AvatarCropModal } from '../components/auth/AvatarCropModal';
import { PasswordResetConfirmModal } from '../components/auth/PasswordResetConfirmModal';

interface UsersPageProps {
  projects: Project[];
  currentUser: User;
  onRefreshUsers?: () => void;
  onUpdateCurrentUser?: (user: User) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  projects,
  currentUser,
  onRefreshUsers,
  onUpdateCurrentUser,
}) => {
  // State for Users List & Pagination
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Password Reset 2-Step Confirmation Modal State
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false);

  // Avatar Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>('');

  // Subtle External URL Input State (with pencil toggle)
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>('');
  const [isUrlEditingAllowed, setIsUrlEditingAllowed] = useState<boolean>(false);

  // Form State (Create/Edit)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRoleOption>('Editor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intersection Observer Sentinel Ref
  const observerSentinelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load User Statistics
  const loadUserStats = async () => {
    try {
      const data = await UserService.getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas de usuários:', err);
    }
  };

  // Fetch Users (Page 1 vs Next Pages)
  const fetchUsers = useCallback(
    async (pageToFetch: number, isInitial: boolean = false) => {
      try {
        if (isInitial) {
          setIsLoading(true);
        } else {
          setIsFetchingMore(true);
        }

        const res = await UserService.getUsers({
          page: pageToFetch,
          pageSize: 20,
          search: debouncedSearch,
          role: roleFilter,
        });

        if (isInitial) {
          setUsers(res.Items || []);
        } else {
          setUsers((prev) => [...prev, ...(res.Items || [])]);
        }

        setHasNextPage(res.HasNextPage);
        setPage(pageToFetch);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [debouncedSearch, roleFilter]
  );

  // Trigger initial load when search or filter changes
  useEffect(() => {
    fetchUsers(1, true);
    loadUserStats();
  }, [fetchUsers]);

  // IntersectionObserver for Infinite Scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isLoading && !isFetchingMore) {
        fetchUsers(page + 1, false);
      }
    },
    [hasNextPage, isLoading, isFetchingMore, page, fetchUsers]
  );

  useEffect(() => {
    const option = { root: null, rootMargin: '100px', threshold: 0.1 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (observerSentinelRef.current) observer.observe(observerSentinelRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  // File Select Handler for Avatar
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP ou GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setRawImageSrc(reader.result.toString());
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob, previewUrl: string) => {
    setCroppedAvatarBlob(croppedBlob);
    setAvatarPreviewUrl(previewUrl);
    // Overrides custom URL when a new local file is cropped
    setCustomAvatarUrl('');
  };

  // Handlers for Create User
  const handleOpenCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('Editor');
    setCroppedAvatarBlob(null);
    setAvatarPreviewUrl('');
    setCustomAvatarUrl('');
    setIsUrlEditingAllowed(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    try {
      setIsSubmitting(true);
      const created = await UserService.createUser({
        Name: name.trim(),
        Email: email.trim(),
        Password: password,
        Role: role,
        AvatarUrl: customAvatarUrl.trim() ? customAvatarUrl.trim() : undefined,
      });

      // Upload avatar file if cropped local image exists
      if (croppedAvatarBlob && created.UserId) {
        const uploaded = await UserService.uploadAvatar(created.UserId, croppedAvatarBlob);
        if (currentUser.UserId === created.UserId && onUpdateCurrentUser) {
          onUpdateCurrentUser(uploaded);
        }
      } else if (currentUser.UserId === created.UserId && onUpdateCurrentUser) {
        onUpdateCurrentUser(created);
      }

      setIsCreateModalOpen(false);
      fetchUsers(1, true);
      loadUserStats();
      if (onRefreshUsers) onRefreshUsers();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Erro ao cadastrar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit User
  const handleOpenEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setName(userToEdit.Name);
    setEmail(userToEdit.Email);
    setRole(userToEdit.Role as UserRoleOption);
    setPassword('');
    setCroppedAvatarBlob(null);
    setAvatarPreviewUrl(userToEdit.AvatarUrl || '');
    setCustomAvatarUrl(userToEdit.AvatarUrl || '');
    setIsUrlEditingAllowed(false);
    setIsEditModalOpen(true);
  };

  // Submits form (or triggers password reset confirmation modal if password filled)
  const handleFormSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !name.trim() || !email.trim()) return;

    if (password.trim().length > 0) {
      setIsPasswordConfirmOpen(true);
    } else {
      executeUserUpdate();
    }
  };

  const executeUserUpdate = async () => {
    if (!editingUser) return;

    try {
      setIsSubmitting(true);

      // Check if custom URL was set vs cropped blob
      const avatarUrlToSave = customAvatarUrl.trim() !== (editingUser.AvatarUrl || '')
        ? customAvatarUrl.trim()
        : undefined;

      const updated = await UserService.updateUser(editingUser.UserId, {
        Name: name.trim(),
        Email: email.trim(),
        Role: role,
        Password: password.trim() ? password.trim() : undefined,
        AvatarUrl: avatarUrlToSave,
      });

      // Upload new avatar photo if a new cropped image exists
      let finalUser = updated;
      if (croppedAvatarBlob) {
        finalUser = await UserService.uploadAvatar(editingUser.UserId, croppedAvatarBlob);
      }

      // Refresh top right header if logged-in user edited their own profile
      if (currentUser.UserId === editingUser.UserId && onUpdateCurrentUser) {
        onUpdateCurrentUser(finalUser);
      }

      setIsPasswordConfirmOpen(false);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers(1, true);
      loadUserStats();
      if (onRefreshUsers) onRefreshUsers();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Erro ao atualizar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#400404] tracking-tight">Usuários</h2>
          <p className="text-xs text-[#5C1212]/80 font-normal mt-0.5">
            Gestão de contas e funções de acesso da estação Media 8.
          </p>
        </div>

        {currentUser.Role === 'Admin' && (
          <Button
            onClick={handleOpenCreateModal}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-medium py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </Button>
        )}
      </div>

      {/* Search Bar & Role Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#400404]/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#FFFBED]/50 border-[#400404]/20 rounded-xl text-xs font-normal text-[#400404]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              roleFilter === 'ALL'
                ? 'bg-[#400404] text-[#FFFBED] border-[#400404] shadow-xs'
                : 'bg-white text-[#400404] border-[#400404]/20 hover:bg-[#FFFBED]'
            }`}
          >
            Todos ({stats?.TotalUsers ?? users.length})
          </button>

          <button
            onClick={() => setRoleFilter('Admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
              roleFilter === 'Admin'
                ? 'bg-[#400404] text-[#FFFBED] border-[#400404] shadow-xs'
                : 'bg-white text-[#400404] border-[#400404]/20 hover:bg-[#FFFBED]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Admins ({stats?.AdminCount ?? 0})</span>
          </button>

          <button
            onClick={() => setRoleFilter('Editor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
              roleFilter === 'Editor'
                ? 'bg-[#400404] text-[#FFFBED] border-[#400404] shadow-xs'
                : 'bg-white text-[#400404] border-[#400404]/20 hover:bg-[#FFFBED]'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-[#400404]/70 shrink-0" />
            <span>Editores ({stats?.EditorCount ?? 0})</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#400404]/15 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#400404]/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#400404] tracking-tight">Equipe da Produtora</h3>
          <span className="text-xs font-mono font-medium text-[#5C1212]/80">
            {stats ? stats.TotalUsers : users.length} usuários cadastrados
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#5C1212]/80 flex flex-col items-center justify-center gap-2 font-normal">
            <Loader2 className="w-6 h-6 animate-spin text-[#400404]" />
            <span>Carregando usuários...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#400404] font-normal italic">
            Nenhum usuário encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#400404]">
              {/* Elegant normal-case table header */}
              <thead className="bg-[#400404] text-[#FFFBED] font-semibold text-xs tracking-tight normal-case border-b border-[#400404]">
                <tr>
                  <th className="p-3.5">Usuário</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">Função</th>
                  <th className="p-3.5">Data de Cadastro</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#400404]/10">
                {users.map((u) => (
                  <tr
                    key={u.UserId}
                    className="hover:bg-[#FFFBED]/60 transition-colors group cursor-pointer"
                    onClick={() => currentUser.Role === 'Admin' && handleOpenEditModal(u)}
                  >
                    <td className="p-3.5 font-semibold text-[#400404]">
                      <div className="flex items-center gap-3">
                        {/* Avatar Image or Initials Box */}
                        <div className="w-9 h-9 rounded-xl bg-[#400404] text-[#FFFBED] font-semibold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-[#400404]/20">
                          {u.AvatarUrl ? (
                            <img src={u.AvatarUrl} alt={u.Name} className="w-full h-full object-cover" />
                          ) : (
                            u.Name ? u.Name.charAt(0).toUpperCase() : 'U'
                          )}
                        </div>
                        <span>{u.Name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-[#5C1212]">{u.Email}</td>
                    <td className="p-3.5">
                      {u.Role === 'Admin' ? (
                        <Badge className="bg-[#400404] text-[#FFFBED] font-medium text-[10px] gap-1 px-2.5 py-0.5 rounded-full inline-flex items-center border border-[#400404]">
                          <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Admin</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-[#400404]/20 bg-[#FFFBED] text-[#400404] font-medium text-[10px] gap-1 px-2.5 py-0.5 rounded-full inline-flex items-center">
                          <Video className="w-3 h-3 text-[#400404]/70 shrink-0" />
                          <span>Editor</span>
                        </Badge>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-normal text-[#5C1212]/80">
                      {new Date(u.CreatedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3.5 text-right font-medium text-[#400404]">
                      {currentUser.Role === 'Admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(u);
                          }}
                          className="text-xs font-medium border-[#400404]/20 hover:bg-[#400404] hover:text-[#FFFBED] transition-colors rounded-lg py-1 px-2.5 flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Button>
                      ) : (
                        <span className="text-[#5C1212]/60 font-normal">Apenas Leitura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        <div ref={observerSentinelRef} className="h-6 w-full flex items-center justify-center p-2">
          {isFetchingMore && <Loader2 className="w-4 h-4 animate-spin text-[#400404]/70" />}
        </div>
      </div>

      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Interactive Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* Password Reset Security Confirmation Modal (3s Timer) */}
      <PasswordResetConfirmModal
        isOpen={isPasswordConfirmOpen}
        userName={editingUser?.Name || 'Usuário'}
        onClose={() => setIsPasswordConfirmOpen(false)}
        onConfirm={executeUserUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Modal: Cadastrar Usuário */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-md rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
              Crie a conta de acesso para o membro da equipe da produtora.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            {/* Avatar Selector Uploader Box */}
            <div className="flex flex-col items-center justify-center gap-2 pb-1">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 rounded-2xl bg-[#400404] text-[#FFFBED] flex items-center justify-center overflow-hidden border-2 border-[#400404] shadow-md transition-transform group-hover:scale-105">
                  {avatarPreviewUrl ? (
                    <img src={avatarPreviewUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-[#FFFBED]/80" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-6 h-6 text-[#FFFBED]" />
                </div>
              </div>
              <p className="text-[11px] text-[#5C1212]/80 font-medium">Clique para escolher foto de perfil</p>

              {/* Subtle External URL Input Box with Internal Pencil Toggle */}
              <div className="w-full max-w-xs mt-1">
                <div
                  className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-mono transition-all border ${
                    isUrlEditingAllowed
                      ? 'bg-white text-[#400404] border-[#400404]/40 ring-1 ring-[#400404]/30 shadow-xs'
                      : 'bg-[#400404]/5 text-[#5C1212]/70 border-[#400404]/15 opacity-75'
                  }`}
                >
                  <input
                    type="url"
                    disabled={!isUrlEditingAllowed}
                    placeholder="https://... (URL de imagem externa / CDN)"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setAvatarPreviewUrl(e.target.value.trim());
                        setCroppedAvatarBlob(null);
                      }
                    }}
                    className="w-full bg-transparent border-none outline-none text-[11px] font-mono text-[#400404] placeholder:text-[#5C1212]/60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setIsUrlEditingAllowed(!isUrlEditingAllowed)}
                    title={isUrlEditingAllowed ? 'Travar edição de URL' : 'Editar link externo de imagem'}
                    className="p-1 text-[#400404]/80 hover:text-[#400404] rounded-lg transition-colors cursor-pointer shrink-0 ml-1 hover:bg-[#400404]/10"
                  >
                    {isUrlEditingAllowed ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Nome Completo *</label>
              <Input
                type="text"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white text-xs font-normal text-[#400404] border-[#400404]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">E-mail de Acesso *</label>
              <Input
                type="email"
                placeholder="editor@media8.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Senha Inicial *</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white text-xs font-normal text-[#400404] border-[#400404]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Função de Acesso *</label>
              <UserRoleSelect value={role} onChange={setRole} />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs font-medium border-[#400404]/20 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim() || !password}
                className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs rounded-xl cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar Usuário</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Usuário */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-md rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">Editar Usuário</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
              Atualize as informações de cadastro, função de acesso ou foto de perfil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmitAttempt} className="space-y-4 py-2">
            {/* Avatar Selector Uploader Box */}
            <div className="flex flex-col items-center justify-center gap-2 pb-1">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 rounded-2xl bg-[#400404] text-[#FFFBED] flex items-center justify-center overflow-hidden border-2 border-[#400404] shadow-md transition-transform group-hover:scale-105">
                  {avatarPreviewUrl ? (
                    <img src={avatarPreviewUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-[#FFFBED]/80" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-6 h-6 text-[#FFFBED]" />
                </div>
              </div>
              <p className="text-[11px] text-[#5C1212]/80 font-medium">Clique para alterar a foto de perfil</p>

              {/* Subtle External URL Input Box with Internal Pencil Toggle */}
              <div className="w-full max-w-xs mt-1">
                <div
                  className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-mono transition-all border ${
                    isUrlEditingAllowed
                      ? 'bg-white text-[#400404] border-[#400404]/40 ring-1 ring-[#400404]/30 shadow-xs'
                      : 'bg-[#400404]/5 text-[#5C1212]/70 border-[#400404]/15 opacity-75'
                  }`}
                >
                  <input
                    type="url"
                    disabled={!isUrlEditingAllowed}
                    placeholder="https://... (URL de imagem externa / CDN)"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setAvatarPreviewUrl(e.target.value.trim());
                        setCroppedAvatarBlob(null);
                      }
                    }}
                    className="w-full bg-transparent border-none outline-none text-[11px] font-mono text-[#400404] placeholder:text-[#5C1212]/60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setIsUrlEditingAllowed(!isUrlEditingAllowed)}
                    title={isUrlEditingAllowed ? 'Travar edição de URL' : 'Editar link externo de imagem'}
                    className="p-1 text-[#400404]/80 hover:text-[#400404] rounded-lg transition-colors cursor-pointer shrink-0 ml-1 hover:bg-[#400404]/10"
                  >
                    {isUrlEditingAllowed ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Nome Completo *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white text-xs font-normal text-[#400404] border-[#400404]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">E-mail de Acesso *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-xs font-mono font-normal text-[#400404] border-[#400404]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Redefinir Senha (Opcional)</label>
              <Input
                type="password"
                placeholder="Deixe em branco para manter a senha atual"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white text-xs font-normal text-[#400404] border-[#400404]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Função de Acesso *</label>
              <UserRoleSelect value={role} onChange={setRole} />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs font-medium border-[#400404]/20 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim()}
                className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs rounded-xl cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
