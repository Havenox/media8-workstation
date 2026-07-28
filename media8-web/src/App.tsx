import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TimecodePlayer } from './components/TimecodePlayer';
import { WaveformCanvas } from './components/WaveformCanvas';
import { SubClipEditor } from './components/SubClipEditor';
import { IngestModal } from './components/IngestModal';
import { LoginScreen } from './components/LoginScreen';
import type { Order, WorkstationAsset, TimecodeMarker, AuthResponse } from './types';
import { OrderService, TimecodeService, AuthService } from './services/api';
import { Folder, Film, FileText, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(() => {
    const saved = localStorage.getItem('media8_user');
    return saved ? JSON.parse(saved) : null;
  });

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

  // Handle unauthorized events (401 response from backend)
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Fetch real orders from database when logged in
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
      setError('Não foi possível carregar os projetos da API. Verifique a conexão e suas credenciais.');
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [currentUser]);

  // Fetch markers for selected asset
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

  // UNAUTHENTICATED USER LOCK — Renders ONLY the Login Screen (Zero Anonymous Access)
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#140101] text-cream-soft flex flex-col font-sans selection:bg-wine-vibrant selection:text-cream-soft">
      <Header
        currentUser={currentUser}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onLogout={handleLogout}
        selectedOrderTitle={selectedOrder?.Title}
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-cream-soft flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadOrders}
            className="px-3.5 py-1.5 bg-wine-vibrant hover:bg-wine-warm text-cream-soft font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full">
        {/* Left Sidebar: Orders & Asset Explorer */}
        <aside className="col-span-3 glass-panel rounded-2xl p-5 border border-wine-vibrant/30 flex flex-col gap-5 h-[calc(100vh-120px)] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-wine-vibrant/20 pb-3">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-wine-vibrant" />
              <h2 className="font-bold text-xs text-cream-soft uppercase tracking-wider">Orders (Projetos)</h2>
            </div>
            <button
              onClick={handleCreateNewOrder}
              title="Nova Order"
              className="p-1.5 hover:bg-wine-deep/60 rounded-lg text-cream-soft/80 hover:text-cream-soft transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Orders List (Real DB Query) */}
          <div className="space-y-2.5">
            {orders.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-wine-vibrant/30 rounded-2xl p-5 bg-[#100101]">
                <Sparkles className="w-8 h-8 text-wine-vibrant/50 mx-auto mb-2" />
                <p className="text-xs text-cream-soft/60 mb-3 leading-relaxed">Nenhuma Order encontrada no PostgreSQL.</p>
                <button
                  onClick={handleCreateNewOrder}
                  className="bg-gradient-to-r from-wine-deep to-wine-vibrant hover:from-wine-warm hover:to-wine-vibrant text-cream-soft text-xs font-semibold px-4 py-2 rounded-xl border border-wine-vibrant/50 shadow-md cursor-pointer transition-all"
                >
                  + Criar Primeira Order
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.OrderId}
                  onClick={() => {
                    setSelectedOrder(order);
                    if (order.Assets && order.Assets.length > 0) {
                      setSelectedAsset(order.Assets[0]);
                    } else {
                      setSelectedAsset(undefined);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedOrder?.OrderId === order.OrderId
                      ? 'bg-gradient-to-r from-wine-deep/70 to-wine-warm/40 border-wine-vibrant shadow-lg scale-[1.01]'
                      : 'bg-[#100101] hover:bg-[#140101] border-wine-vibrant/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cream-soft truncate">{order.Title}</h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#1A0202] border border-wine-vibrant/40 text-cream-soft/80">
                      {order.Status}
                    </span>
                  </div>
                  <p className="text-[11px] text-cream-soft/50 mt-1.5 truncate flex items-center gap-1">
                    <Film className="w-3 h-3 text-wine-vibrant" />
                    <span>{order.Assets?.length || 0} mídias cadastradas</span>
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Selected Order Briefing */}
          {selectedOrder && (
            <div className="mt-auto border-t border-wine-vibrant/20 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-wine-vibrant" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-cream-soft/90">Briefing da Order</h4>
              </div>
              <p className="text-xs text-cream-soft/75 bg-[#100101] p-3.5 rounded-xl border border-wine-vibrant/20 leading-relaxed max-h-36 overflow-y-auto shadow-inner">
                {selectedOrder.BriefingText || 'Nenhum briefing especificado.'}
              </p>
            </div>
          )}
        </aside>

        {/* Center: Broadcast Timecode Player & Waveform */}
        <section className="col-span-6 flex flex-col gap-6">
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

          <WaveformCanvas
            durationSeconds={selectedAsset?.DurationSeconds}
          />
        </section>

        {/* Right Sidebar: Sub-clips & Media Explorer */}
        <aside className="col-span-3 flex flex-col gap-6">
          {/* Order Assets List */}
          <div className="glass-panel rounded-2xl p-5 border border-wine-vibrant/30 flex flex-col gap-3 max-h-64 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-wine-vibrant/20 pb-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-wine-vibrant" />
                <h3 className="font-bold text-xs text-cream-soft uppercase tracking-wider">Mídias da Order</h3>
              </div>
              {selectedOrder && (
                <button
                  onClick={() => setIsIngestModalOpen(true)}
                  className="text-[11px] text-wine-vibrant hover:text-cream-soft font-semibold cursor-pointer transition-colors"
                >
                  + Ingest
                </button>
              )}
            </div>

            {!selectedOrder?.Assets || selectedOrder.Assets.length === 0 ? (
              <p className="text-xs text-cream-soft/40 text-center py-4 italic">
                Nenhuma mídia adicionada a esta Order.
              </p>
            ) : (
              selectedOrder.Assets.map((asset) => (
                <div
                  key={asset.AssetId}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedAsset?.AssetId === asset.AssetId
                      ? 'bg-gradient-to-r from-wine-deep/80 to-wine-vibrant/40 border-wine-vibrant text-cream-soft shadow-md'
                      : 'bg-[#100101] border-wine-vibrant/20 text-cream-soft/70 hover:bg-[#140101]'
                  }`}
                >
                  <div className="font-semibold truncate">{asset.Title}</div>
                  <div className="text-[10px] font-mono text-cream-soft/50 flex items-center justify-between mt-1">
                    <span className="truncate max-w-[140px]">{asset.OriginalFileName}</span>
                    <span className="uppercase text-wine-vibrant font-bold">{asset.Status}</span>
                  </div>
                </div>
              ))
            )}
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
        </aside>
      </main>

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
