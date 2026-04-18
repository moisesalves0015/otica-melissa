import * as React from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  User, Package, FileText, CreditCard, 
  LogOut, Calendar, Clock, MapPin, 
  ChevronRight, ExternalLink, Bell, 
  Eye, Stethoscope, ShoppingBag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const session = localStorage.getItem("otica_client_session");
    if (!session) {
      navigate("/cliente/login");
      return;
    }

    const { id } = JSON.parse(session);
    fetchClientData(id);
  }, [navigate]);

  const fetchClientData = async (clientId: string) => {
    try {
      // 1. Fetch Client Info
      const clientDoc = await getDoc(doc(db, "clients", clientId));
      if (clientDoc.exists()) {
        setClient({ id: clientDoc.id, ...clientDoc.data() });
      }

      // 2. Fetch Orders
      const qOrders = query(
        collection(db, "orders"), 
        where("clientId", "==", clientId),
        orderBy("createdAt", "desc")
      );
      const ordersSnap = await getDocs(qOrders);
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 3. Fetch Atendimentos (Receitas)
      const qAtend = query(
        collection(db, "atendimentos"), 
        where("clientId", "==", clientId),
        orderBy("createdAt", "desc")
      );
      const atendSnap = await getDocs(qAtend);
      setAtendimentos(atendSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error: any) {
      console.error("Error fetching client data:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("otica_client_session");
    navigate("/cliente/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Carregando seu portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-10 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <User className="h-8 w-8 text-emerald-400" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bem-vindo(a) de volta</p>
                <h1 className="text-2xl font-black tracking-tight">{client?.name}</h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 text-xs font-bold px-5" onClick={() => navigate("/rastreio")}>
                <Bell className="h-4 w-4 mr-2" /> Notificações
             </Button>
             <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-11" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
             </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 -mt-12 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Package className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meus Pedidos</p>
                    <p className="text-xl font-black text-slate-900">{orders.length}</p>
                 </div>
              </CardContent>
           </Card>
           <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FileText className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receitas Ativas</p>
                    <p className="text-xl font-black text-slate-900">{atendimentos.length}</p>
                 </div>
              </CardContent>
           </Card>
           <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <CreditCard className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status de Crédito</p>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-full px-3 text-[9px] font-black uppercase mt-1">
                       {client?.creditStatus || "Regular"}
                    </Badge>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Recent Orders */}
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Pedidos Recentes</h2>
                 <Button variant="link" className="text-[10px] font-bold uppercase text-blue-600 p-0 h-auto">Ver Todos</Button>
              </div>
              <div className="space-y-3">
                 {orders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-100">
                       <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                       <p className="text-sm font-bold text-slate-400">Você ainda não possui pedidos.</p>
                    </div>
                 ) : (
                    orders.slice(0, 3).map((order) => (
                       <Card key={order.id} className="rounded-3xl border-none shadow-lg shadow-slate-200/30 bg-white overflow-hidden hover:scale-[1.01] transition-all cursor-pointer group" onClick={() => navigate(`/rastreio?id=${order.id}`)}>
                          <CardContent className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                   <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-900 uppercase">#{order.id.slice(0, 8).toUpperCase()}</p>
                                   <p className="text-xs font-bold text-slate-500">{order.serviceType}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{order.date}</p>
                                   <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] font-black uppercase">
                                      {order.status}
                                   </Badge>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                             </div>
                          </CardContent>
                       </Card>
                    ))
                 )}
              </div>
           </div>

           {/* Medical History / Prescriptions */}
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Histórico de Receitas</h2>
                 <Button variant="link" className="text-[10px] font-bold uppercase text-emerald-600 p-0 h-auto">Histórico Completo</Button>
              </div>
              <div className="space-y-3">
                 {atendimentos.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-100">
                       <Stethoscope className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                       <p className="text-sm font-bold text-slate-400">Nenhum histórico médico encontrado.</p>
                    </div>
                 ) : (
                    atendimentos.slice(0, 3).map((atend) => (
                       <Card key={atend.id} className="rounded-3xl border-none shadow-lg shadow-slate-200/30 bg-white overflow-hidden border-l-4 border-l-emerald-500 hover:scale-[1.01] transition-all">
                          <CardContent className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                   <Eye className="h-5 w-5" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-900 uppercase">Consulta de {atend.date}</p>
                                   <p className="text-xs font-bold text-slate-500">Optometrista: {atend.attendant}</p>
                                </div>
                             </div>
                             <Button size="sm" variant="ghost" className="h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 text-[10px] font-black uppercase">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver PDF
                             </Button>
                          </CardContent>
                       </Card>
                    ))
                 )}
              </div>
           </div>
        </div>

        {/* Action Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
           <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10 space-y-4">
                 <h3 className="text-xl font-black italic tracking-tighter">Precisa de Ajuda?</h3>
                 <p className="text-slate-400 text-sm font-medium max-w-[200px]">Fale diretamente com nossa equipe via WhatsApp.</p>
                 <Button className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8">
                    Suporte Online
                 </Button>
              </div>
           </div>
           <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 text-slate-900 relative overflow-hidden group shadow-xl shadow-slate-200/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10 space-y-4">
                 <h3 className="text-xl font-black italic tracking-tighter">Sua Receita Venceu?</h3>
                 <p className="text-slate-400 text-sm font-medium max-w-[200px]">Agende um novo exame de vista hoje mesmo.</p>
                 <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8">
                    Agendar Exame
                 </Button>
              </div>
           </div>
        </div>
      </main>

      {/* Footer Nav (Mobile) */}
      <nav className="fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/20 h-16 rounded-3xl shadow-2xl flex items-center justify-around px-4 md:hidden z-50">
         <Button variant="ghost" className="flex flex-col gap-1 text-slate-900 h-auto p-2">
            <Package className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase">Pedidos</span>
         </Button>
         <Button variant="ghost" className="flex flex-col gap-1 text-slate-400 h-auto p-2">
            <FileText className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase">Receitas</span>
         </Button>
         <div className="h-14 w-14 rounded-full bg-slate-900 -mt-10 border-4 border-slate-50 flex items-center justify-center text-white shadow-xl shadow-slate-900/30">
            <MapPin className="h-6 w-6" />
         </div>
         <Button variant="ghost" className="flex flex-col gap-1 text-slate-400 h-auto p-2">
            <CreditCard className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase">Pagos</span>
         </Button>
         <Button variant="ghost" className="flex flex-col gap-1 text-slate-400 h-auto p-2" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase">Sair</span>
         </Button>
      </nav>
    </div>
  );
}
