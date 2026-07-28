import React, { useState } from 'react';
import { UserPlus, Crown, Video, Loader2 } from 'lucide-react';
import type { User, Project } from '../types';
import { UserService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { UserRoleSelect } from '../components/UserRoleSelect';

interface UsersPageProps {
  users: User[];
  projects: Project[];
  currentUser: User;
  onRefreshUsers: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  users,
  projects,
  currentUser,
  onRefreshUsers,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Editor'>('Editor');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    try {
      setIsCreating(true);
      await UserService.createUser({
        Name: name.trim(),
        Email: email.trim(),
        Password: password,
        Role: role,
      });

      setName('');
      setEmail('');
      setPassword('');
      setRole('Editor');
      setIsCreateModalOpen(false);
      onRefreshUsers();
    } catch (err) {
      alert('Erro ao criar usuário. Verifique se o e-mail já não está cadastrado.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#400404] tracking-tight">Usuários & Atribuições RBAC</h2>
          <p className="text-xs text-[#5C1212]/80 font-normal mt-0.5">
            Gestão de contas de acesso à Workstation. Somente Administradores podem cadastrar novos usuários.
          </p>
        </div>

        {currentUser.Role === 'Admin' && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-medium py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#400404]/15 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#400404]/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#400404] tracking-tight">Equipe da Produtora</h3>
          <span className="text-xs font-mono font-medium text-[#5C1212]/80">{users.length} usuários cadastrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#400404]">
            <thead className="bg-[#400404] text-[#FFFBED] uppercase font-mono font-medium border-b border-[#400404]">
              <tr>
                <th className="p-3.5">Usuário</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Papel (RBAC)</th>
                <th className="p-3.5">Data de Cadastro</th>
                <th className="p-3.5 text-right">Projetos Atribuídos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#400404]/10">
              {users.map((u) => (
                <tr key={u.UserId} className="hover:bg-[#FFFBED]/60 transition-colors">
                  <td className="p-3.5 font-semibold text-[#400404]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#400404] text-[#FFFBED] font-semibold text-xs flex items-center justify-center shadow-xs">
                        {u.Name.charAt(0).toUpperCase()}
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
                    {u.Role === 'Admin' ? (
                      <span className="text-emerald-800 font-medium">Acesso Global (Todos)</span>
                    ) : (
                      <span>{projects.length} Projetos</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Criar Usuário */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-md rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
              Crie o login e defina a permissão de acesso para o membro da equipe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
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
              <label className="text-xs font-semibold text-[#400404]">Papel (RBAC) *</label>
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
                disabled={isCreating || !name.trim() || !email.trim() || !password}
                className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs rounded-xl cursor-pointer"
              >
                {isCreating ? (
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
    </div>
  );
};
