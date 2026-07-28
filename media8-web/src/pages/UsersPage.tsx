import React, { useState } from 'react';
import { Users, UserPlus, Shield, Film, Mail, Key, Loader2, CheckCircle2, Lock } from 'lucide-react';
import type { User, Project } from '../types';
import { UserService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

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
          <h2 className="text-2xl font-bold text-[#400404]">Usuários & Atribuições RBAC</h2>
          <p className="text-xs text-[#5C1212]/70 mt-0.5">
            Gestão de contas de acesso à Workstation. Somente Administradores podem cadastrar novos usuários.
          </p>
        </div>

        {currentUser.Role === 'Admin' && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] text-xs font-semibold py-2.5 px-4 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#400404]/15 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#400404]/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#400404]">Equipe da Produtora</h3>
          <span className="text-xs font-mono text-[#5C1212]/60">{users.length} usuários cadastrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#400404]">
            <thead className="bg-[#FFFBED] text-[#5C1212]/80 uppercase font-mono border-b border-[#400404]/15">
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
                <tr key={u.UserId} className="hover:bg-[#FFFBED]/40 transition-colors">
                  <td className="p-3.5 font-bold text-[#400404] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#400404] text-[#FFFBED] font-bold text-xs flex items-center justify-center shadow-sm">
                      {u.Name.charAt(0).toUpperCase()}
                    </div>
                    <span>{u.Name}</span>
                  </td>
                  <td className="p-3.5 font-mono text-[#5C1212]/80">{u.Email}</td>
                  <td className="p-3.5">
                    {u.Role === 'Admin' ? (
                      <Badge className="bg-[#400404] text-[#FFFBED]">👑 Admin</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                        🎬 Editor
                      </Badge>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-[#5C1212]/60">
                    {new Date(u.CreatedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-[#5C1212]/70">
                    {u.Role === 'Admin' ? (
                      <span className="text-emerald-700 font-semibold">Acesso Global (Todos)</span>
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
        <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#400404]">Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription className="text-xs text-[#5C1212]/70">
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
                className="bg-white text-xs"
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
                className="bg-white text-xs"
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
                className="bg-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#400404]">Papel (RBAC) *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Admin' | 'Editor')}
                className="w-full p-2.5 bg-white border border-[#400404]/20 rounded-lg text-xs text-[#400404] focus:outline-none focus:ring-2 focus:ring-[#400404]/30"
              >
                <option value="Editor">🎬 Editor (Acesso apenas aos Projetos Atribuídos)</option>
                <option value="Admin">👑 Administrador (Acesso Global + Gestão de Usuários)</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !name.trim() || !email.trim() || !password}
                className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs cursor-pointer"
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
