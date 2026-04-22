import * as React from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  User, Package, LogOut, Calendar, Clock, 
  ChevronRight, Bell, Eye, ShoppingBag,
  MessageSquare, Sparkles, ChevronLeft,
  CreditCard, CheckCircle2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isApptOpen, setIsApptOpen] = React.useState(false);

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
      const clientDoc = await getDoc(doc(db, "clients", clientId));
      if (clientDoc.exists()) {
        setClient({ id: clientDoc.id, ...clientDoc.data() });
      }

      // Orders
      const qOrders = query(collection(db, "orders"), where("clientId", "==", clientId));
      const ordersSnap = await getDocs(qOrders);
      const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      ordersList.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setOrders(ordersList);

      // Installments
      const qInst = query(collection(db, "installments"), where("clientId", "==", clientId));
      const instSnap = await getDocs(qInst);
      const instList = instSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const parseDate = (s: string) => {
          if (!s) return 0;
          if (s.includes("/")) {
              const [d, m, y] = s.split("/").map(Number);
              return new Date(y, m - 1, d).getTime();
          }
          return new Date(s).getTime();
      };

      instList.sort((a: any, b: any) => parseDate(a.dueDate) - parseDate(b.dueDate));
      setInstallments(instList);

    } catch (error: any) {
      console.error("Error fetching client data:", error);
      toast.error("Erro ao carregar seus dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("otica_client_session");
    navigate("/cliente/login");
  };

  const getWhatsAppLink = (message: string) => {
    const phone = "5511999999999"; 
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let apptDate = formData.get("date") as string;
    if (apptDate.includes("-") && apptDate.split("-")[0].length === 4) {
        const [y, m, d] = apptDate.split("-");
        apptDate = `${d}/${m}/${y}`;
    }
    const period = formData.get("period") as string;

    try {
      await addDoc(collection(db, "appointments"), {
        clientId: client.id,
        clientName: client.name,
        date: apptDate,
        period,
        status: "Pendente",
        createdAt: new Date().toISOString()
      });
      toast.success("Solicitação enviada! Entraremos em contato.");
      setIsApptOpen(false);
    } catch (err) {
      toast.error("Erro ao agendar.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      {/* Header Estilo Landing Page */}
      <header className="bg-white border-b border-slate-100 py-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <img src="/logo.png" alt="Ótica Melissa" className="h-10 w-auto object-contain cursor-pointer" onClick={() => navigate("/")} />
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Cliente</p>
                <p className="text-sm font-black text-slate-900">{client?.name?.split(' ')[0]}</p>
             </div>
             <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50 text-slate-400 hover:text-primary" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-16">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Meu Painel
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
              Acompanhe seus pedidos e pagamentos em tempo real
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedidos</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{orders.length}</p>
               </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
               <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagos</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{installments.filter(i => i.status === "Pago").length}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Order History Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Histórico de Pedidos</h2>
           </div>
           
           <div className="space-y-4">
              {orders.length === 0 ? (
                 <div className="bg-slate-50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100">
                    <ShoppingBag className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum pedido encontrado.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                       <Card key={order.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-pointer group border border-slate-100" onClick={() => navigate(`/rastreio?id=${order.id}`)}>
                          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                             <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                   <Package className="h-8 w-8" />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">#{order.id.slice(0, 8).toUpperCase()}</p>
                                      <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] font-black uppercase rounded-full px-2 py-0">
                                         {order.status}
                                      </Badge>
                                   </div>
                                   <h3 className="text-xl font-black text-slate-900 mt-1">{order.serviceType || "Serviço Óptico"}</h3>
                                   <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                      <Clock className="h-3 w-3" /> Realizado em {order.date}
                                   </p>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                                <div className="text-left md:text-right">
                                   <p className="text-[10px] font-black text-slate-300 uppercase">Valor Total</p>
                                   <p className="text-lg font-black text-slate-900">R$ {Number(order.totalValue || 0).toFixed(2)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                   <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-primary transition-all" />
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                    ))}
                 </div>
              )}
           </div>
        </section>

        {/* Installments (Carnês) Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Meus Carnês & Parcelas</h2>
           </div>

           <div className="space-y-4">
              {installments.length === 0 ? (
                 <div className="bg-slate-50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100">
                    <CreditCard className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma parcela pendente.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {installments.map((inst) => (
                       <Card key={inst.id} className={`rounded-3xl border-none shadow-sm p-6 space-y-4 relative overflow-hidden group border border-slate-100 ${inst.status === "Pago" ? "bg-emerald-50/30" : "bg-white"}`}>
                          <div className="flex justify-between items-start">
                             <Badge className={`${inst.status === "Pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} border-none rounded-full px-3 text-[9px] font-black uppercase`}>
                                {inst.status}
                             </Badge>
                             <span className="text-[9px] font-black text-slate-400 uppercase">Parc. {inst.number}/{inst.totalInstallments}</span>
                          </div>
                          
                          <div>
                             <p className={`text-2xl font-black ${inst.status === "Pago" ? "text-emerald-700" : "text-slate-900"}`}>
                                R$ {Number(inst.value || 0).toFixed(2)}
                             </p>
                              <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                 <Calendar className="h-3.5 w-3.5" /> 
                                 {inst.status === "Pago" ? `Pago em ${(() => {
                                     const pd = inst.paymentDate || "---";
                                     if (pd.includes("-") && pd.split("-")[0].length === 4) {
                                         const [y, m, d] = pd.split("-");
                                         return `${d}/${m}/${y}`;
                                     }
                                     return pd;
                                 })()}` : `Vence em ${(() => {
                                     const dd = inst.dueDate || "---";
                                     if (dd.includes("-") && dd.split("-")[0].length === 4) {
                                         const [y, m, d] = dd.split("-");
                                         return `${d}/${m}/${y}`;
                                     }
                                     return dd;
                                 })()}`}
                              </p>
                          </div>

                          {inst.status !== "Pago" && (
                            <Button className="w-full rounded-2xl h-11 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/20" onClick={() => window.open(getWhatsAppLink(`Olá! Quero pagar a parcela ${inst.number} do meu carnê (Valor: R$ ${Number(inst.value).toFixed(2)}).`), '_blank')}>
                               Pagar via Pix
                            </Button>
                          )}
                       </Card>
                    ))}
                 </div>
              )}
           </div>
        </section>

        {/* Action Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
           <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/30">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Precisa de Ajuda?</h3>
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-[200px]">Fale diretamente com nossa equipe via WhatsApp.</p>
                 <Button className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-[10px] tracking-widest h-12 px-10 shadow-xl shadow-emerald-500/20" onClick={() => window.open(getWhatsAppLink("Olá! Preciso de suporte com meu pedido."), '_blank')}>
                    Suporte Online
                 </Button>
              </div>
           </div>
           <div className="rounded-[2.5rem] bg-white border border-slate-100 p-10 text-slate-900 relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Sua Receita Venceu?</h3>
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-[200px]">Agende um novo exame de vista hoje mesmo.</p>
                 <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-12 px-10 shadow-xl shadow-slate-900/20" onClick={() => setIsApptOpen(true)}>
                    Agendar Exame
                 </Button>
              </div>
           </div>
        </div>

        {/* Appointment Modal */}
        <Dialog open={isApptOpen} onOpenChange={setIsApptOpen}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
              <DialogHeader className="bg-primary text-white p-10">
                 <DialogTitle className="flex items-center gap-3 italic font-black text-2xl uppercase tracking-tighter">
                    <Calendar className="h-8 w-8" /> Agendar Exame
                 </DialogTitle>
                 <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Escolha seu melhor horário</p>
              </DialogHeader>
              <form onSubmit={handleCreateAppointment}>
                 <div className="p-10 space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Data Preferencial</Label>
                       <input type="date" name="date" required className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Melhor Período</Label>
                       <select name="period" className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
                          <option value="Manhã">Manhã (09:00 - 12:00)</option>
                          <option value="Tarde">Tarde (13:00 - 18:00)</option>
                       </select>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold text-center italic uppercase tracking-widest">
                       * Sujeito a confirmação pela equipe.
                    </p>
                    <Button type="submit" className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest h-14 mt-4 shadow-xl shadow-primary/20">
                       Solicitar Agendamento
                    </Button>
                 </div>
              </form>
           </DialogContent>
        </Dialog>
      </main>

      {/* Footer Nav (Mobile) */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-2xl border border-slate-100 h-20 rounded-[2rem] shadow-2xl flex items-center justify-around px-8 md:hidden z-50">
         <Button variant="ghost" className="flex flex-col gap-1 text-primary h-auto p-0 hover:bg-transparent">
            <Package className="h-6 w-6" />
            <span className="text-[8px] font-black uppercase">Pedidos</span>
         </Button>
         <div 
            className="h-16 w-16 rounded-full bg-primary -mt-12 border-8 border-white flex items-center justify-center text-white shadow-xl shadow-primary/30 cursor-pointer active:scale-95 transition-all"
            onClick={() => setIsApptOpen(true)}
         >
            <Calendar className="h-6 w-6" />
         </div>
         <Button variant="ghost" className="flex flex-col gap-1 text-slate-400 h-auto p-0 hover:bg-transparent" onClick={handleLogout}>
            <LogOut className="h-6 w-6" />
            <span className="text-[8px] font-black uppercase">Sair</span>
         </Button>
      </nav>
    </div>
  );
}
