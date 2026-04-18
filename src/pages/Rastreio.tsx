import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { 
  Search, Clock, Package, CheckCircle2, 
  Eye, Truck, Wrench, ShieldCheck, MapPin, 
  Calendar, ShoppingBag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const statusSteps = [
  { status: "Pendente", label: "Pedido Recebido", icon: Clock },
  { status: "Em Produção", label: "Em Laboratório", icon: Wrench },
  { status: "Qualidade", label: "Controle de Qualidade", icon: Eye },
  { status: "Pronto para Entrega", label: "Disponível para Retirada", icon: ShoppingBag },
  { status: "Entregue", label: "Entregue", icon: Truck },
];

const statusColors: Record<string, string> = {
  "Pendente": "bg-slate-100 text-slate-600",
  "Em Produção": "bg-amber-100 text-amber-700",
  "Qualidade": "bg-blue-100 text-blue-700",
  "Pronto para Entrega": "bg-emerald-100 text-emerald-700",
  "Entregue": "bg-emerald-600 text-white",
};

export default function Rastreio() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  
  const [cpf, setCpf] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verifiedOrder, setVerifiedOrder] = React.useState<any>(null);
  const [clientName, setClientName] = React.useState("");

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})\d+?$/, "$1");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("--- INICIANDO BUSCA PROFUNDA ---");
    console.log("Buscando por ID:", orderId);

    if (!orderId) {
      toast.error("ID do pedido não encontrado na URL.");
      return;
    }
    
    setIsVerifying(true);
    try {
      let orderData: any = null;
      let clientId: string = "";

      // 1. Tentar buscar pelo ID do documento em 'orders'
      console.log("1. Tentando ID direto em 'orders'...");
      let orderDoc = await getDoc(doc(db, "orders", orderId));
      if (orderDoc.exists()) {
        console.log("Sucesso: Encontrado ID direto em 'orders'");
        orderData = orderDoc.data();
        clientId = orderData.clientId;
      } else {
        // 2. Tentar buscar pelo campo 'externalId' em 'orders'
        console.log("2. Tentando externalId em 'orders'...");
        const qExternal = query(collection(db, "orders"), where("externalId", "==", orderId));
        const qSnap = await getDocs(qExternal);
        if (!qSnap.empty) {
          console.log("Sucesso: Encontrado por externalId em 'orders'");
          orderData = qSnap.docs[0].data();
          clientId = orderData.clientId;
        } else {
          // 3. Tentar buscar pelo ID do documento em 'atendimentos'
          console.log("3. Tentando ID direto em 'atendimentos'...");
          const atendDoc = await getDoc(doc(db, "atendimentos", orderId));
          if (atendDoc.exists()) {
            console.log("Sucesso: Encontrado ID direto em 'atendimentos'");
            const atendData = atendDoc.data();
            clientId = atendData.clientId;
            orderData = {
              ...atendData,
              status: atendData.status || "Pendente",
              items: atendData.orders ? atendData.orders.map((o: any) => o.serviceType).join(", ") : "Óculos",
              dueDate: atendData.orders ? atendData.orders[0]?.dueDate : null
            };
          } else {
            // 4. BUSCA PROFUNDA: Procurar o ID dentro do array de pedidos de TODOS os atendimentos
            console.log("4. BUSCA PROFUNDA: Varrendo todos os atendimentos...");
            const allAtendSnap = await getDocs(collection(db, "atendimentos"));
            for (const docSnap of allAtendSnap.docs) {
               const data = docSnap.data();
               if (data.orders && Array.isArray(data.orders)) {
                  const foundOrder = data.orders.find((o: any) => o.id === orderId);
                  if (foundOrder) {
                     console.log("Sucesso: ID encontrado dentro de um atendimento antigo!");
                     clientId = data.clientId;
                     orderData = {
                        ...data,
                        status: data.status || "Pendente",
                        items: foundOrder.serviceType || "Óculos",
                        dueDate: foundOrder.dueDate || null
                     };
                     break;
                  }
               }
            }
          }
        }
      }
      
      if (!orderData) {
        console.log("ERRO: Pedido não encontrado após busca profunda.");
        toast.error("Pedido não encontrado. Verifique se o código está correto.");
        setIsVerifying(false);
        return;
      }

      console.log("Buscando cliente:", clientId);
      const clientDoc = await getDoc(doc(db, "clients", clientId));
      if (!clientDoc.exists()) {
        toast.error("Dados do cliente não encontrados.");
        setIsVerifying(false);
        return;
      }

      const clientData = clientDoc.data();
      const cleanInputCpf = cpf.replace(/\D/g, "");
      const cleanClientCpf = (clientData.cpf || "").replace(/\D/g, "");

      console.log("Validando Identidade...");
      console.log("CPF Informado:", cleanInputCpf, "| Banco:", cleanClientCpf);
      console.log("Data Informada:", birthDate, "| Banco:", clientData.birthDate);

      if (cleanInputCpf === cleanClientCpf && birthDate === clientData.birthDate) {
        setVerifiedOrder({ id: orderId, ...orderData });
        setClientName(clientData.name);
        toast.success("Acesso liberado!");
      } else {
        toast.error("CPF ou Data de Nascimento não conferem.");
      }
    } catch (err: any) {
      console.error("Erro na busca:", err);
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (verifiedOrder) {
    const currentStatusIndex = statusSteps.findIndex(s => s.status === verifiedOrder.status);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Ótica Melissa" className="h-12 mx-auto object-contain" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Acompanhe seu Pedido</h1>
            <p className="text-slate-500 text-sm">Olá, <span className="font-bold text-slate-900">{clientName}</span>! Veja como está o processo do seu óculos.</p>
          </div>

          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pedido</p>
                  <p className="text-xl font-black tracking-tight">#{verifiedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge className={`rounded-full px-4 py-1 text-[10px] font-black uppercase ${statusColors[verifiedOrder.status]}`}>
                  {verifiedOrder.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-10">
              
              {/* TIMELINE VISUAL */}
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                />
                
                <div className="relative flex justify-between">
                  {statusSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx <= currentStatusIndex;
                    const isActive = idx === currentStatusIndex;

                    return (
                      <div key={step.status} className="flex flex-col items-center gap-3 z-10 group">
                        <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500
                          ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-2 border-slate-100 text-slate-300'}
                          ${isActive ? 'ring-4 ring-emerald-50' : ''}
                        `}>
                          <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight text-center max-w-[60px] md:max-w-none ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-slate-50" />

              {/* DETALHES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itens do Pedido</p>
                      <p className="text-sm font-bold text-slate-900">{verifiedOrder.items}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previsão de Entrega</p>
                      <p className="text-sm font-black text-emerald-600">
                        {verifiedOrder.dueDate || "A confirmar"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                     <ShieldCheck className="h-4 w-4 text-emerald-500" />
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Garantia Ótica Melissa</p>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed">
                     Seu pedido está sendo processado com os mais altos padrões de precisão óptica. Avisaremos quando estiver pronto para retirada na loja.
                   </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Loja Matriz - Ótica Melissa</span>
                 </div>
                 <Button 
                   variant="outline" 
                   className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest border-slate-200"
                   onClick={() => window.location.reload()}
                 >
                   Atualizar Status
                 </Button>
              </div>

            </CardContent>
          </Card>

          <p className="text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            © 2024 Ótica Melissa • Qualidade em cada detalhe
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <img src="/logo.png" alt="Ótica Melissa" className="h-16 mx-auto object-contain" />
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Central do Cliente</h1>
            <p className="text-slate-500 text-sm font-medium">Insira seus dados para acompanhar a produção do seu óculos.</p>
          </div>
        </div>

        <Card className="rounded-3xl border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white">
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Seu CPF</Label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    placeholder="000.000.000-00" 
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    className="rounded-xl border-slate-100 h-12 text-base font-bold pl-11 focus:ring-slate-900 focus:border-slate-900 transition-all bg-slate-50/50"
                    required
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data de Nascimento</Label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    placeholder="DD/MM/YYYY"
                    value={birthDate}
                    onChange={e => setBirthDate(formatDate(e.target.value))}
                    maxLength={10}
                    className="rounded-xl border-slate-100 h-12 text-base font-bold pl-11 focus:ring-slate-900 focus:border-slate-900 transition-all bg-slate-50/50 text-slate-600"
                    required
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isVerifying || !orderId} 
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
              >
                {isVerifying ? "Verificando..." : "Rastrear Pedido"}
              </Button>
            </form>

            {!orderId && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                  Para rastrear, você precisa ler o QR Code impresso no seu canhoto de retirada.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-6">
           <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Suporte</a>
           <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Privacidade</a>
           <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Termos</a>
        </div>
      </div>
    </div>
  );
}
