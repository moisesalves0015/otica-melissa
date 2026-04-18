import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, FileText, User, Phone, Calendar, ShoppingBag, MapPin, Activity } from "lucide-react";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "clients", id), (docSnap) => {
      if (docSnap.exists()) {
        setClient({ id: docSnap.id, ...docSnap.data() });
      } else {
        setClient(null);
      }
    });

    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "atendimentos"), where("clientId", "==", id));
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ordenar localmente por data (mais recente primeiro)
        records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(records);
      } catch (error) {
        console.error("Erro ao buscar histórico", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    return () => unsubscribe();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando prontuário...</div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Cliente não encontrado</h2>
        <Button onClick={() => navigate("/admin/clientes")}>Voltar para Lista</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:m-0 print:p-0 print:space-y-4">
      
      {/* HEADER DE NAVEGAÇÃO E AÇÕES (Escondido na impressão) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Prontuário do Cliente</h1>
            <p className="text-xs text-slate-500">Ficha #{client.id}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white rounded font-bold uppercase text-xs tracking-wider">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
        </Button>
      </div>

      {/* CABEÇALHO DO RELATÓRIO (Visível na impressão) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-black uppercase">Ótica Melissa</h1>
        <p className="text-sm font-bold uppercase text-gray-500 tracking-widest mt-1">Prontuário de Atendimento</p>
        <p className="text-xs mt-2">Relatório gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      {/* DADOS PRINCIPAIS DO CLIENTE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        
        {/* Info Pessoal */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <User className="h-4 w-4" /> Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Nome Completo</p>
                <p className="font-semibold text-slate-900">{client.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">CPF</p>
                <p className="font-medium text-slate-700">{client.cpf || "Não informado"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Data de Nascimento</p>
                <p className="font-medium text-slate-700">
                  {client.birthDate ? (client.birthDate.includes('-') ? new Date(client.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : client.birthDate) : "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone / WhatsApp</p>
                <p className="font-medium text-slate-700">{client.phone || "Não informado"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                <p className="font-medium text-slate-700">{client.email || "Não informado"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Cliente Desde</p>
                <p className="font-medium text-slate-700">
                  {client.createdAt ? (client.createdAt.includes('/') ? client.createdAt : new Date(client.createdAt).toLocaleDateString('pt-BR')) : "Não informado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status e Finanças */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status de Crédito</p>
              <Badge className={`rounded ${
                client.creditStatus === 'Excelente' ? 'bg-emerald-100 text-emerald-700' :
                client.creditStatus === 'Bom' ? 'bg-blue-100 text-blue-700' :
                client.creditStatus === 'Atenção' ? 'bg-amber-100 text-amber-700' :
                (client.creditStatus === 'Em Análise' || !client.creditStatus) ? 'bg-purple-100 text-purple-700' :
                'bg-red-100 text-red-700'
              } text-xs font-bold uppercase tracking-wider border-none px-3 py-1 shadow-none`}>
                {client.creditStatus || "Em Análise"}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Saldo Devedor Ativo</p>
              <p className={`text-2xl font-black ${(client.balance || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {!(client.balance) ? 'R$ 0,00' : `R$ ${(client.balance).toFixed(2)}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Última Visita</p>
              <p className="font-medium text-slate-700">{client.lastVisit || "-"}</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* HISTÓRICO DE ATENDIMENTOS */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Histórico de Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm font-medium">
              Nenhum atendimento registrado para este cliente ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((atendimento, index) => (
                <div key={atendimento.id} className="p-6 hover:bg-slate-50 transition-colors print:break-inside-avoid">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Atendimento #{atendimento.id.slice(0,6).toUpperCase()}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500">
                          {atendimento.date && atendimento.time
                            ? `${atendimento.date} às ${atendimento.time}`
                            : atendimento.date
                            ? atendimento.date
                            : "Data não registrada"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Forma de Pagamento: <strong className="uppercase">{atendimento.paymentMethod || "Não informado"}</strong></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Valor Total</p>
                      <p className="text-lg font-black text-slate-900">R$ {(atendimento.totalValue || atendimento.total || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Pedidos do Atendimento */}
                  {(() => {
                    const orderItems = atendimento.orders || atendimento.items;
                    return orderItems && orderItems.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                            <tr>
                              <th className="px-4 py-2">Serviço/Produto</th>
                              <th className="px-4 py-2 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orderItems.map((item: any, i: number) => (
                              <tr key={i}>
                                <td className="px-4 py-3">
                                  <span className="font-bold text-slate-900 block">{item.serviceType || item.service || "Serviço"}</span>
                                  {item.items && <span className="text-slate-500 block mt-0.5">{item.items}</span>}
                                  {item.product && <span className="text-slate-500 block mt-0.5">Produto: {item.product}</span>}
                                  {item.labNotes && <span className="text-slate-400 block text-[10px] mt-0.5">Lab: {item.labNotes}</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  R$ {(item.price || item.value || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* OVERLAY DE IMPRESSÃO MODERNO - Aparece apenas na impressão, cobre tudo */}
      <div className="print-page hidden print:block bg-white" style={{fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: '12mm 14mm', minHeight: '297mm', display: 'flex', flexDirection: 'column', gap: '4mm'}}>
        
        {/* CABEÇALHO */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6mm', borderBottom: '2px solid #0f172a'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
            <div>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Prontuário do Cliente</p>
            </div>
          </div>
          <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Nº da Ficha</p>
            <p style={{fontSize: '13pt', fontWeight: '900', color: '#0f172a', margin: 0}}>#{client.id.length > 8 ? client.id.slice(0,6).toUpperCase() : client.id}</p>
            <p style={{fontSize: '6.5pt', color: '#64748b', margin: 0}}>Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* DADOS PESSOAIS */}
        <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5mm'}}>
          <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm'}}>Dados Pessoais</p>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4mm'}}>
            <div><p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Nome Completo</p><p style={{fontSize: '10pt', fontWeight: '700', color: '#0f172a', margin: 0}}>{client.name}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>CPF</p><p style={{fontSize: '9.5pt', fontWeight: '600', color: '#334155', margin: 0}}>{client.cpf || "—"}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Data de Nascimento</p><p style={{fontSize: '9.5pt', fontWeight: '600', color: '#334155', margin: 0}}>{client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : "—"}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Telefone</p><p style={{fontSize: '9.5pt', fontWeight: '600', color: '#334155', margin: 0}}>{client.phone || "—"}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Email</p><p style={{fontSize: '9.5pt', fontWeight: '600', color: '#334155', margin: 0}}>{client.email || "—"}</p></div>
            <div>
              <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Status de Crédito</p>
              <p style={{fontSize: '9.5pt', fontWeight: '800', color: client.creditStatus === 'Bom' ? '#1d4ed8' : client.creditStatus === 'Excelente' ? '#065f46' : '#6d28d9', margin: 0}}>{client.creditStatus || "Em Análise"}</p>
            </div>
          </div>
        </div>

        {/* STATUS FINANCEIRO */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm'}}>
          <div style={{border: '1px solid #e2e8f0', borderLeft: '4px solid #0f172a', borderRadius: '8px', padding: '4mm'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1.5mm'}}>Saldo Devedor Ativo</p>
            <p style={{fontSize: '16pt', fontWeight: '900', color: (client.balance || 0) > 0 ? '#dc2626' : '#0f172a', margin: 0}}>R$ {(client.balance || 0).toFixed(2)}</p>
          </div>
          <div style={{border: '1px solid #e2e8f0', borderLeft: '4px solid #94a3b8', borderRadius: '8px', padding: '4mm'}}>
            <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1.5mm'}}>Última Visita Registrada</p>
            <p style={{fontSize: '12pt', fontWeight: '700', color: '#0f172a', margin: 0}}>{client.lastVisit || "—"}</p>
          </div>
        </div>

        {/* HISTÓRICO DE ATENDIMENTOS */}
        <div style={{flex: 1}}>
          <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm'}}>Histórico de Atendimentos</p>
          {history.length === 0 ? (
            <p style={{color: '#94a3b8', fontStyle: 'italic', fontSize: '9pt', textAlign: 'center', padding: '6mm'}}>Nenhum atendimento registrado.</p>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8pt'}}>
              <thead>
                <tr style={{backgroundColor: '#0f172a', color: 'white'}}>
                  <th style={{padding: '2.5mm 4mm', textAlign: 'left', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700'}}>Data</th>
                  <th style={{padding: '2.5mm 4mm', textAlign: 'left', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700'}}>Serviços / Itens</th>
                  <th style={{padding: '2.5mm 4mm', textAlign: 'left', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700'}}>Pagamento</th>
                  <th style={{padding: '2.5mm 4mm', textAlign: 'right', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700'}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {history.map((atendimento: any, idx: number) => {
                  const orderItems = atendimento.orders || atendimento.items || [];
                  return (
                    <tr key={atendimento.id} style={{borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid'}}>
                      <td style={{padding: '2.5mm 4mm', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap'}}>
                        {atendimento.date || "—"}
                        {atendimento.time && <span style={{display: 'block', fontSize: '6.5pt', color: '#94a3b8', fontWeight: '400'}}>{atendimento.time}</span>}
                      </td>
                      <td style={{padding: '2.5mm 4mm', color: '#475569'}}>
                        {orderItems.length > 0 ? orderItems.map((o: any) => o.serviceType || o.service).join(', ') : "Registro clínico"}
                        {orderItems.length > 0 && orderItems[0].items && <span style={{display: 'block', fontSize: '6.5pt', color: '#94a3b8'}}>{orderItems[0].items}</span>}
                      </td>
                      <td style={{padding: '2.5mm 4mm', color: '#64748b', textTransform: 'uppercase', fontSize: '7pt', fontWeight: '700'}}>{atendimento.paymentMethod || "—"}</td>
                      <td style={{padding: '2.5mm 4mm', textAlign: 'right', fontWeight: '800', color: '#0f172a'}}>R$ {(atendimento.totalValue || atendimento.total || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{backgroundColor: '#f1f5f9', borderTop: '2px solid #e2e8f0'}}>
                  <td colSpan={3} style={{padding: '2.5mm 4mm', textAlign: 'right', fontWeight: '700', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b'}}>Total Gasto no Histórico:</td>
                  <td style={{padding: '2.5mm 4mm', textAlign: 'right', fontWeight: '900', fontSize: '11pt', color: '#0f172a'}}>
                    R$ {history.reduce((acc: number, a: any) => acc + (a.totalValue || a.total || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* RODAPÉ */}
        <div style={{marginTop: 'auto', paddingTop: '3mm', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <p style={{fontSize: '6.5pt', color: '#cbd5e1', margin: 0}}>Prontuário gerado pelo sistema Ótica Melissa</p>
          <p style={{fontSize: '6.5pt', color: '#cbd5e1', margin: 0}}>Relatório emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>

    </div>
  );
}
