import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot, collection, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, Clock, User, ShoppingCart, 
  Calendar, CreditCard, FileText, Activity, Truck, 
  Wrench, CheckCircle2, Eye, XCircle, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const statusColors: Record<string, string> = {
  "Pendente": "bg-slate-100 text-slate-600",
  "Em Produção": "bg-amber-100 text-amber-700",
  "Qualidade": "bg-blue-100 text-blue-700",
  "Pronto para Entrega": "bg-emerald-100 text-emerald-700",
  "Entregue": "bg-emerald-600 text-white",
  "Cancelado": "bg-red-100 text-red-700",
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [order, setOrder] = React.useState<any>(null);
  
  // States for selects
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!id) return;
    
    const unsubOrder = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Pedido não encontrado.");
        navigate("/admin/pedidos");
      }
      setLoading(false);
    });

    const unsubAtendentes = onSnapshot(query(collection(db, "atendentes")), (snap) => {
      setAtendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFornecedores = onSnapshot(query(collection(db, "fornecedores")), (snap) => {
      setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubOrder();
      unsubAtendentes();
      unsubFornecedores();
    };
  }, [id, navigate]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('print') === 'true' && !loading && order) {
      setTimeout(() => {
        window.print();
        // Remove o parâmetro da URL após imprimir para não imprimir de novo no reload
        navigate(location.pathname, { replace: true });
      }, 500);
    }
  }, [location.search, loading, order, navigate, location.pathname]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order || !id) return;
    setSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const newStatus = data.status as string;
      const oldStatus = order.status;
      
      // Criar entrada no histórico se o status mudou ou se houver alteração significativa
      const historyEntry = {
        date: new Date().toISOString(),
        action: oldStatus !== newStatus ? `Status alterado de ${oldStatus} para ${newStatus}` : "Pedido atualizado",
        user: "Administrador" // Em um sistema real, viria do Auth
      };

      await updateDoc(doc(db, "orders", id), {
        seller: data.seller,
        orderCode: data.orderCode,
        supplier: data.supplier,
        serviceType: data.serviceType,
        items: data.items,
        total: Number(data.total),
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        status: newStatus,
        notes: data.notes,
        history: arrayUnion(historyEntry)
      });

      toast.success("Pedido atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* HEADER NAVEGAÇÃO */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/pedidos")} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
              <Badge className={`rounded ${statusColors[order.status]} text-[10px] font-bold uppercase tracking-wider`}>
                {order.status}
              </Badge>
            </h1>
            <p className="text-xs text-slate-500">Gerencie e acompanhe a evolução deste pedido.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="rounded font-bold text-xs h-9">
            <Printer className="mr-2 h-4 w-4" /> IMPRIMIR OS
          </Button>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: DADOS DO PEDIDO */}
        <div className="lg:col-span-2 space-y-6 print:hidden">
          <Card className="rounded border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Informações Operacionais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vendedor / Atendente</Label>
                  <Select name="seller" defaultValue={order.seller}>
                    <SelectTrigger className="h-9 rounded border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {atendentes.map(a => (
                        <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status Atual</Label>
                  <Select name="status" defaultValue={order.status}>
                    <SelectTrigger className="h-9 rounded border-slate-200 text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusColors).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código do Pedido / Lab</Label>
                  <Input name="orderCode" defaultValue={order.orderCode} className="h-9 rounded border-slate-200 text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</Label>
                  <Select name="supplier" defaultValue={order.supplier}>
                    <SelectTrigger className="h-9 rounded border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(f => (
                        <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição dos Itens / Lentes</Label>
                <textarea 
                  name="items" 
                  defaultValue={order.items}
                  className="w-full rounded border-slate-200 text-sm p-3 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Serviço</Label>
                  <Select name="serviceType" defaultValue={order.serviceType}>
                    <SelectTrigger className="h-9 rounded border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Óculos Completo">Óculos Completo</SelectItem>
                      <SelectItem value="Apenas Lentes">Apenas Lentes</SelectItem>
                      <SelectItem value="Apenas Armação">Apenas Armação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data Prometida</Label>
                  <Input name="dueDate" type="text" placeholder="DD/MM/YYYY" defaultValue={order.dueDate} className="h-9 rounded border-slate-200 text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações Técnicas</Label>
                <textarea 
                  name="notes" 
                  defaultValue={order.notes}
                  className="w-full rounded border-slate-200 text-sm p-3 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: FINANCEIRO E TIMELINE */}
        <div className="space-y-6 print:hidden">
          <Card className="rounded border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor do Pedido (R$)</Label>
                <Input name="total" type="number" step="0.01" defaultValue={order.total} className="h-10 rounded border-slate-200 text-lg font-black text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Forma de Pagto</Label>
                <Select name="paymentMethod" defaultValue={order.paymentMethod}>
                  <SelectTrigger className="h-9 rounded border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="carne">Carnê</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded font-bold uppercase text-xs tracking-wider h-11">
                {saving ? "SALVANDO..." : (
                  <><Save className="mr-2 h-4 w-4" /> SALVAR ALTERAÇÕES</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* TIMELINE / HISTÓRICO */}
          <Card className="rounded border-slate-200 shadow-sm overflow-hidden bg-slate-50/30">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" /> Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 overflow-y-auto max-h-[400px]">
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-2 before:w-px before:bg-slate-200">
                {!order.history || order.history.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic pl-6 text-center">Nenhuma movimentação registrada.</p>
                ) : (
                  order.history.slice().reverse().map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">{item.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(item.date).toLocaleDateString('pt-BR')} {new Date(item.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2 uppercase">{item.user}</span>
                      </div>
                    </div>
                  ))
                )}
                {/* Registro Inicial */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">Pedido Criado no Sistema</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* OVERLAY DE IMPRESSÃO (A4) - Só aparece no print */}
      <div className="print-page hidden print:block bg-white" style={{fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: '12mm 14mm', minHeight: '297mm', display: 'flex', flexDirection: 'column', gap: '5mm'}}>
        
        {/* CABEÇALHO */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6mm', borderBottom: '2px solid #0f172a'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
            <div>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Ordem de Serviço & Pedido</p>
              <p style={{fontSize: '9pt', fontWeight: '400', color: '#0f172a', margin: 0}}>Via da Loja / Operacional</p>
            </div>
          </div>
          <div style={{textAlign: 'right', display: 'flex', gap: '3mm', alignItems: 'flex-start'}}>
            {/* QR CODE DE RASTREIO */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2mm'}}>
              <QRCodeSVG 
                value={`https://otica-melissa.vercel.app/rastreio?id=${order.id}`} 
                size={55} 
              />
              <p style={{fontSize: '4pt', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', margin: 0}}>Rastrear Pedido</p>
            </div>
            
            <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px'}}>
              <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Nº do Pedido</p>
              <p style={{fontSize: '13pt', fontWeight: '900', color: '#0f172a', margin: 0}}>#{order.id.slice(0, 8).toUpperCase()}</p>
              <p style={{fontSize: '6.5pt', color: '#64748b', margin: 0}}>Data: {order.date}</p>
            </div>
          </div>
        </div>

        {/* DADOS DO CLIENTE E ATENDIMENTO */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm'}}>
          <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4mm'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1.5mm'}}>Cliente Responsável</p>
            <p style={{fontSize: '11pt', fontWeight: '700', color: '#0f172a', margin: 0}}>{order.clientName}</p>
          </div>
          <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4mm'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1.5mm'}}>Vendedor / Atendente</p>
            <p style={{fontSize: '10pt', fontWeight: '600', color: '#0f172a', margin: 0}}>{order.seller}</p>
          </div>
        </div>

        {/* DETALHES TÉCNICOS E LAB */}
        <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden'}}>
          <div style={{backgroundColor: '#0f172a', color: 'white', padding: '2mm 4mm'}}>
            <p style={{fontSize: '7pt', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '1px'}}>Especificações de Laboratório</p>
          </div>
          <div style={{padding: '4mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm'}}>
            <div>
              <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1mm'}}>Código / Lab</p>
              <p style={{fontSize: '10pt', fontWeight: '800', color: '#0f172a', margin: '0 0 3mm'}}>{order.orderCode || "NÃO INFORMADO"}</p>
              
              <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1mm'}}>Fornecedor</p>
              <p style={{fontSize: '9pt', fontWeight: '600', color: '#0f172a', margin: 0}}>{order.supplier || "NÃO INFORMADO"}</p>
            </div>
            <div>
              <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1mm'}}>Tipo de Serviço</p>
              <p style={{fontSize: '10pt', fontWeight: '700', color: '#0f172a', margin: '0 0 3mm'}}>{order.serviceType}</p>
              
              <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1mm'}}>Data Prometida</p>
              <p style={{fontSize: '10pt', fontWeight: '800', color: '#dc2626', margin: 0}}>{new Date(order.dueDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div style={{padding: '4mm', borderTop: '1px solid #e2e8f0', backgroundColor: '#fafafa'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1.5mm'}}>Descrição dos Itens / Lentes</p>
            <p style={{fontSize: '9pt', color: '#334155', fontWeight: '500', margin: 0, lineHeight: '1.4'}}>{order.items}</p>
          </div>
        </div>

        {/* OBSERVAÇÕES TÉCNICAS */}
        <div style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4mm'}}>
          <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 2mm', borderBottom: '1px solid #f1f5f9', paddingBottom: '1mm'}}>Observações Técnicas</p>
          <p style={{fontSize: '9pt', color: '#475569', lineHeight: '1.5', margin: 0}}>{order.notes || "Sem observações adicionais."}</p>
        </div>

        {/* FINANCEIRO */}
        <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4mm'}}>
          <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4mm'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1.5mm'}}>Forma de Pagamento</p>
            <p style={{fontSize: '9pt', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', margin: 0}}>{order.paymentMethod}</p>
          </div>
          <div style={{backgroundColor: '#0f172a', borderRadius: '8px', padding: '4mm', color: 'white', textAlign: 'right'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 1mm'}}>Valor Total</p>
            <p style={{fontSize: '16pt', fontWeight: '900', margin: 0}}>R$ {(Number(order.total) || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* STATUS E TIMELINE SIMPLIFICADA NO PRINT */}
        <div style={{fontSize: '7pt', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '3mm', display: 'flex', justifyContent: 'space-between'}}>
          <p style={{margin: 0}}>Status do Pedido: <strong>{order.status.toUpperCase()}</strong></p>
          <p style={{margin: 0}}>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>

    </div>
  );
}
