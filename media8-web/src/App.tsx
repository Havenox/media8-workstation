import { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { BrandLogo } from './components/BrandLogo';
import { TimecodePlayer } from './components/TimecodePlayer';
import { WaveformCanvas } from './components/WaveformCanvas';
import { SubClipEditor } from './components/SubClipEditor';
import { IngestModal } from './components/IngestModal';
import type { Order, WorkstationAsset, TimecodeMarker, AuthResponse } from './types';
import { OrderService, TimecodeService, AuthService } from './services/api';
import {
  LayoutDashboard,
  FolderKanban,
  ShoppingBag,
  Palette,
  Film,
  Scissors,
  Users,
  Package,
  CreditCard,
  FileText,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Plus,
  LogOut,
  ChevronRight,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(() => {
    const saved = localStorage.getItem('media8_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<WorkstationAsset | undefined>(undefined);
  const [markers, setMarkers] = useState<TimecodeMarker[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [inPoint, setInPoint] = useState('00:00:00:00');
  const [outPoint, setOutPoint] = useState('00:00:00:00');
  const [inFrame, setInFrame] = useState(0);
  const [outFrame, setOutFrame] = useState(0);

  // Handle 401 unauthorized token expiry
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Load orders when authenticated
  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      setError(null);
      const data = await OrderService.getOrders(currentUser.UserId, currentUser.Role);
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
        if (data[0].Assets && data[0].Assets.length > 0) {
          setSelectedAsset(data[0].Assets[0]);
        }
      }
    } catch (err) {
      setError('Não foi possível se conectar com a API. Verifique a execução do backend PostgreSQL.');
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [currentUser]);

  // Load markers for selected asset
  const loadMarkers = async (assetId: string) => {
    try {
      const data = await TimecodeService.getMarkersByAsset(assetId);
      setMarkers(data);
    } catch (err) {
      console.error('Error loading markers:', err);
    }
  };

  useEffect(() => {
    if (selectedAsset) {
      loadMarkers(selectedAsset.AssetId);
    } else {
      setMarkers([]);
    }
  }, [selectedAsset]);

  const handleCreateNewOrder = async () => {
    if (!currentUser) return;
    const title = prompt('Digite o título do novo Pedido / Order:');
    if (!title) return;

    try {
      const newOrder = await OrderService.createOrder({
        Title: title,
        BriefingText: 'Briefing inicial do projeto. Descreva aqui os cortes e especificações do cliente.',
        CreatedByUserId: currentUser.UserId,
        Status: 'InProduction',
      });
      await loadOrders();
      setSelectedOrder(newOrder);
    } catch (err) {
      alert('Falha ao criar Order.');
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setOrders([]);
    setSelectedOrder(null);
    setSelectedAsset(undefined);
  };

  // UNAUTHENTICATED LOCK — Renders ONLY the exact Login Page matching print3
  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Pedidos', icon: FolderKanban },
    { label: 'Serviços', icon: ShoppingBag },
    { label: 'Ident. Marca', icon: Palette },
    { label: 'Estilos Edição', icon: Film },
    { label: 'Edições', icon: Scissors },
    { label: 'Usuários', icon: Users },
    { label: 'Ofertas', icon: Package },
    { label: 'Formatos', icon: Film },
    { label: 'Estilos', icon: Palette },
    { label: 'Pagamentos', icon: CreditCard },
    { label: 'Contratos', icon: FileText },
    { label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBED] text-[#400404] flex font-sans">
      {/* Sidebar - Vinho Profundo (#400404) matching print4 */}
      <aside className="w-64 bg-[#400404] text-[#FFFBED] flex flex-col justify-between p-4 shrink-0 shadow-2xl z-40">
        <div>
          {/* Logo & Header */}
          <div className="mb-6 p-2 border-b border-[#5C1212]">
            <BrandLogo variant="cream" size="sm" />
            <p className="text-xs text-[#FFFBED]/60 mt-1 font-medium">Gestão de Edição de Vídeos</p>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FFFBED] text-[#400404] font-semibold shadow-md'
                      : 'text-[#FFFBED]/80 hover:bg-[#5C1212] hover:text-[#FFFBED]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-[#5C1212] space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-[#FFFBED]/70 hover:text-[#FFFBED] transition-colors cursor-pointer">
            <HelpCircle className="w-4 h-4" />
            <span>Ajuda & Suporte</span>
          </button>
          <p className="text-[10px] text-center text-[#FFFBED]/40 font-mono">v1.0.0</p>
        </div>
      </aside>

      {/* Main Content Area matching print4 */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FFFBED]">
        {/* Top Header */}
        <header className="h-16 bg-[#FFFBED] border-b border-[#400404]/15 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#5C1212]/60 font-medium">
              <span>Home</span>
              <ChevronRight className="w-3 h-3 text-[#5C1212]/40" />
              <span className="text-[#400404] font-semibold">{activeTab}</span>
            </div>
            <h1 className="text-lg font-bold text-[#400404]">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-[#5C1212]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-9 pr-4 py-1.5 text-xs bg-white border border-[#400404]/20 rounded-lg text-[#400404] placeholder-[#5C1212]/40 focus:outline-none focus:ring-2 focus:ring-[#400404]/30 w-48"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-full hover:bg-[#5C1212]/10 text-[#400404] relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#400404]/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#400404] text-[#FFFBED] font-bold text-xs flex items-center justify-center shadow-md">
                  {currentUser.Name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#400404] truncate max-w-[120px]">{currentUser.Name}</p>
                  <p className="text-[10px] text-[#5C1212]/60 uppercase font-mono">{currentUser.Role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sair da Plataforma"
                className="p-1.5 rounded-lg hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#400404]">
                Olá, {currentUser.Name}! 👋
              </h2>
              <p className="text-xs text-[#5C1212]/70 mt-0.5">
                Visão geral da plataforma Media 8 Workstation PAM.
              </p>
            </div>

            <button
              onClick={handleCreateNewOrder}
              className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md transition-colors flex items-center gap-2 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pedido</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-xs text-red-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadOrders}
                className="px-3 py-1 bg-[#400404] text-[#FFFBED] rounded text-xs font-semibold"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* 4 Stat Summary Cards matching print4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#400404]/15 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#5C1212]/70">Total de Pedidos</p>
                <p className="text-2xl font-bold text-[#400404] mt-1">{orders.length}</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">+12% este mês</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#FFFBED] border border-[#400404]/20 flex items-center justify-center text-[#400404]">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-900/70">Pendentes</p>
                <p className="text-2xl font-bold text-amber-950 mt-1">0</p>
                <p className="text-[11px] text-amber-800 mt-1">aguardando editor</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-200/60 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-900/70">Em Progresso</p>
                <p className="text-2xl font-bold text-amber-950 mt-1">{orders.length}</p>
                <p className="text-[11px] text-amber-800 mt-1">sendo editados</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-900">
                <Video className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-900/70">Concluídos</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1">0</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">+8% este mês</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-900">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Workstation Broadcast Module */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Col: Orders & Briefing */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#400404]/10 pb-2.5 mb-3">
                  <h3 className="text-xs font-bold text-[#400404] uppercase">Projetos Ativos</h3>
                  <button
                    onClick={handleCreateNewOrder}
                    className="text-xs text-[#400404] font-semibold hover:underline"
                  >
                    + Criar
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-xs text-[#5C1212]/50 italic text-center py-4">Nenhum projeto encontrado.</p>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.OrderId}
                        onClick={() => {
                          setSelectedOrder(ord);
                          if (ord.Assets && ord.Assets.length > 0) setSelectedAsset(ord.Assets[0]);
                          else setSelectedAsset(undefined);
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedOrder?.OrderId === ord.OrderId
                            ? 'bg-[#400404] text-[#FFFBED] border-[#400404]'
                            : 'bg-[#FFFBED] border-[#400404]/15 text-[#400404] hover:bg-white'
                        }`}
                      >
                        <div className="font-bold truncate">{ord.Title}</div>
                        <div className="text-[10px] mt-1 opacity-70 flex justify-between">
                          <span>{ord.Assets?.length || 0} mídias</span>
                          <span className="uppercase font-mono">{ord.Status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedOrder && (
                <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode className="w-4 h-4 text-[#400404]" />
                    <h4 className="text-xs font-bold text-[#400404] uppercase">Briefing da Order</h4>
                  </div>
                  <p className="text-xs text-[#5C1212]/80 bg-[#FFFBED] p-3 rounded-lg border border-[#400404]/15 leading-relaxed max-h-36 overflow-y-auto">
                    {selectedOrder.BriefingText || 'Nenhum briefing especificado.'}
                  </p>
                </div>
              )}
            </div>

            {/* Center Col: Broadcast Player & Waveform */}
            <div className="col-span-12 lg:col-span-6 space-y-6">
              <TimecodePlayer
                asset={selectedAsset}
                onSetInPoint={(tc, frame) => {
                  setInPoint(tc);
                  setInFrame(frame);
                }}
                onSetOutPoint={(tc, frame) => {
                  setOutPoint(tc);
                  setOutFrame(frame);
                }}
              />

              <WaveformCanvas durationSeconds={selectedAsset?.DurationSeconds} />
            </div>

            {/* Right Col: Media Assets & SubClip Marker Editor */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <div className="bg-white p-4 rounded-xl border border-[#400404]/15 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#400404]/10 pb-2">
                  <h3 className="text-xs font-bold text-[#400404] uppercase">Mídias do Projeto</h3>
                  {selectedOrder && (
                    <button
                      onClick={() => setIsIngestModalOpen(true)}
                      className="text-xs text-[#400404] font-semibold hover:underline cursor-pointer"
                    >
                      + Ingest
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {!selectedOrder?.Assets || selectedOrder.Assets.length === 0 ? (
                    <p className="text-xs text-[#5C1212]/50 italic text-center py-4">Nenhuma mídia cadastrada.</p>
                  ) : (
                    selectedOrder.Assets.map((asset) => (
                      <div
                        key={asset.AssetId}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedAsset?.AssetId === asset.AssetId
                            ? 'bg-[#400404] text-[#FFFBED] border-[#400404]'
                            : 'bg-[#FFFBED] border-[#400404]/15 text-[#400404] hover:bg-white'
                        }`}
                      >
                        <div className="font-semibold truncate">{asset.Title}</div>
                        <div className="text-[10px] opacity-70 flex justify-between mt-1 font-mono">
                          <span className="truncate max-w-[120px]">{asset.OriginalFileName}</span>
                          <span className="uppercase">{asset.Status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <SubClipEditor
                assetId={selectedAsset?.AssetId}
                markers={markers}
                inPoint={inPoint}
                outPoint={outPoint}
                inFrame={inFrame}
                outFrame={outFrame}
                onMarkerCreated={() => selectedAsset && loadMarkers(selectedAsset.AssetId)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Ingest Modal */}
      {selectedOrder && (
        <IngestModal
          isOpen={isIngestModalOpen}
          onClose={() => setIsIngestModalOpen(false)}
          orderId={selectedOrder.OrderId}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}
