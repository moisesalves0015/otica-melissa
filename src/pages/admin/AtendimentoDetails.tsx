import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, query, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
  ArrowLeft, User, ShoppingCart, 
  Clock, FileText, Activity, Printer, 
  CreditCard, DollarSign, Calendar, Wrench, XCircle, Save, Trash2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AtendimentoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [atendimento, setAtendimento] = React.useState<any>(null);
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [editNotes, setEditNotes] = React.useState("");
  const [editRx, setEditRx] = React.useState<any>({});

  React.useEffect(() => {
    if (!id) return;
    
    const unsub = onSnapshot(doc(db, "atendimentos", id), (docSnap) => {
      if (docSnap.exists()) {
        setAtendimento({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Atendimento não encontrado.");
        navigate("/admin/atendimentos");
      }
      setLoading(false);
    });

    const unsubAtendentes = onSnapshot(query(collection(db, "atendentes")), (snap) => {
      setAtendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub();
      unsubAtendentes();
    };
  }, [id, navigate]);

  const startEditing = () => {
    setEditNotes(atendimento.notes || "");
    setEditRx({ ...(atendimento.rxData || {}) });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!atendimento || !id) return;
    setSaving(true);
    
    try {
      const changes: string[] = [];
      if (atendimento.notes !== editNotes) changes.push(`Anotações atualizadas`);
      
      const rxData = atendimento.rxData || {};
      const newRxData = { ...editRx };

      let rxChanged = false;
      const rxFields = ['longe_od_esf', 'longe_od_cil', 'longe_od_eixo', 'longe_od_dp', 'longe_oe_esf', 'longe_oe_cil', 'longe_oe_eixo', 'longe_oe_dp', 'perto_od_esf', 'perto_od_cil', 'perto_od_eixo', 'perto_od_dp', 'perto_oe_esf', 'perto_oe_cil', 'perto_oe_eixo', 'perto_oe_dp'];
      for (const field of rxFields) {
        if ((rxData[field] || '') !== (newRxData[field] || '')) {
          rxChanged = true;
          break;
        }
      }
      
      if (rxChanged) changes.push(`Receita Óptica (Grau) modificada`);

      if (changes.length === 0) {
        toast.info("Nenhuma alteração detectada.");
        setIsEditing(false);
        setSaving(false);
        return;
      }

      const historyEntry = {
        date: new Date().toISOString(),
        action: `Alterações efetuadas: ${changes.join(', ')}`,
        user: "Administrador"
      };

      await updateDoc(doc(db, "atendimentos", id), {
        notes: editNotes,
        rxData: newRxData,
        history: arrayUnion(historyEntry)
      });

      toast.success("Atendimento atualizado!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir permanentemente este atendimento? Esta ação não pode ser desfeita e pode causar inconsistência se houverem pedidos associados.")) {
      try {
        await deleteDoc(doc(db, "atendimentos", id));
        toast.success("Atendimento excluído com sucesso.");
        navigate("/admin/atendimentos");
      } catch (err: any) {
        toast.error("Erro ao excluir atendimento: " + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!atendimento) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Atendimento não encontrado.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

          
          {/* HEADER */}
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate("/admin/atendimentos")} className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Atendimento #{atendimento.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-xs text-slate-500">{atendimento.date} às {atendimento.time}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button type="button" onClick={cancelEditing} variant="outline" className="rounded font-bold text-xs h-9">
                    <XCircle className="mr-2 h-4 w-4" /> CANCELAR
                  </Button>
                  <Button 
                    type="button" 
                    disabled={saving} 
                    onClick={handleUpdate as any}
                    className="rounded font-bold text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" /> {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" onClick={handleDelete} variant="outline" className="rounded font-bold text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <Trash2 className="mr-2 h-4 w-4" /> EXCLUIR
                  </Button>
                  <Button type="button" onClick={startEditing} variant="outline" className="rounded font-bold text-xs h-9">
                    <Wrench className="mr-2 h-4 w-4" /> EDITAR
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => {
                      const printContent = document.getElementById('printable-area');
                      if (printContent) {
                          const originalContent = document.body.innerHTML;
                          document.body.innerHTML = printContent.innerHTML;
                          window.print();
                          document.body.innerHTML = originalContent;
                          window.location.reload();
                      }
                    }} 
                    variant="outline" 
                    className="rounded font-bold text-xs h-9"
                  >
                    <Printer className="mr-2 h-4 w-4" /> IMPRIMIR FICHA COMPLETA
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUNA ESQUERDA: DADOS CLÍNICOS E PEDIDOS */}
            <div className="lg:col-span-2 space-y-6">
              
              <Card className="!rounded-none border-slate-200 shadow-none overflow-hidden !p-0 !gap-0">
                <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80 !rounded-none">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                    <User className="h-4 w-4 text-slate-500" /> Identificação e Dados Clínicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Paciente</p>
                            <p className="text-sm font-bold text-slate-900 h-8 flex items-center">{atendimento.clientName}</p>
                            <p className="text-[11px] text-slate-500 h-7 flex items-center">{atendimento.clientCpf}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Atendente</p>
                            <p className="text-sm font-bold text-slate-900 h-8 flex items-center">{atendimento.attendant}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data/Hora</p>
                            <p className="text-sm font-bold text-slate-900">{atendimento.date}</p>
                            <p className="text-[11px] text-slate-500">{atendimento.time}</p>
                        </div>
                    </div>

                    <Separator className="bg-slate-100" />
                    
                    <div className="space-y-5">
                        {/* PRESCRIÇÃO (Rx) */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Receita Óptica (Grau)</Label>
                            <div className="!rounded-none border border-slate-200 overflow-hidden bg-white">
                            {isEditing ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center border-collapse text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="p-3 border-r border-slate-100"></th>
                                                <th className="p-3 border-r border-slate-100">ESF.</th>
                                                <th className="p-3 border-r border-slate-100">CIL.</th>
                                                <th className="p-3 border-r border-slate-100">EIXO</th>
                                                <th className="p-3">D.P.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(['longe_od','longe_oe','perto_od','perto_oe'] as const).map(row => (
                                                <tr key={row}>
                                                    <td className="p-3 font-bold bg-slate-50/30 border-r border-slate-100 text-[10px]">{row.replace('longe_','').replace('perto_','').toUpperCase()} {row.startsWith('longe') ? 'LONGE' : 'PERTO'}</td>
                                                    {(['esf','cil','eixo','dp'] as const).map((col, ci) => (
                                                        <td key={col} className={`p-1 ${ci < 3 ? 'border-r border-slate-100' : ''}`}>
                                                            <Input
                                                                value={editRx[`${row}_${col}`] || ''}
                                                                onChange={e => setEditRx((prev: any) => ({ ...prev, [`${row}_${col}`]: e.target.value }))}
                                                                className="h-8 w-16 mx-auto text-center p-1"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : atendimento.rxData && (atendimento.rxData.longe_od_esf || atendimento.rxData.longe_oe_esf || atendimento.rxData.perto_od_esf || atendimento.rxData.perto_oe_esf) ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center border-collapse text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="p-3 border-r border-slate-100"></th>
                                                <th className="p-3 border-r border-slate-100">ESF.</th>
                                                <th className="p-3 border-r border-slate-100">CIL.</th>
                                                <th className="p-3 border-r border-slate-100">EIXO</th>
                                                <th className="p-3">D.P.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr><td className="p-3 font-bold bg-slate-50/30 border-r border-slate-100 text-[10px]">OD LONGE</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.longe_od_esf || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.longe_od_cil || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.longe_od_eixo || '—'}</td><td className="p-3">{atendimento.rxData?.longe_od_dp || '—'}</td></tr>
                                            <tr><td className="p-3 font-bold bg-slate-50/30 border-r border-slate-100 text-[10px]">OE LONGE</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.longe_oe_esf || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.longe_oe_cil || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.longe_oe_eixo || '—'}</td><td className="p-3">{atendimento.rxData?.longe_oe_dp || '—'}</td></tr>
                                            <tr><td className="p-3 font-bold bg-slate-50/30 border-r border-slate-100 text-[10px]">OD PERTO</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.perto_od_esf || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.perto_od_cil || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.perto_od_eixo || '—'}</td><td className="p-3">{atendimento.rxData?.perto_od_dp || '—'}</td></tr>
                                            <tr><td className="p-3 font-bold bg-slate-50/30 border-r border-slate-100 text-[10px]">OE PERTO</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.perto_oe_esf || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.perto_oe_cil || '—'}</td><td className="p-3 border-r border-slate-100">{atendimento.rxData?.perto_oe_eixo || '—'}</td><td className="p-3">{atendimento.rxData?.perto_oe_dp || '—'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Activity className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 italic font-medium">Nenhum dado técnico de prescrição (Rx) registrado.</p>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* ANOTAÇÕES */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Anotações da Consulta (Histórico, Queixas)</Label>
                            {isEditing ? (
                              <textarea 
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                                className="w-full !rounded-none border border-slate-200 text-sm p-3 min-h-[80px] bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium" 
                              />
                            ) : (
                              <div className="w-full !rounded-none border border-slate-200 text-sm p-3 min-h-[80px] bg-slate-50/50">
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                      {atendimento.notes || "Nenhuma anotação registrada para este atendimento."}
                                  </p>
                              </div>
                            )}
                        </div>
                    </div>
                </CardContent>
              </Card>

              {/* SEÇÃO DE PEDIDOS (CARRINHO) */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" /> Itens do Atendimento
                      </h3>
                  </div>
                  <div className="space-y-3">
                      {atendimento.orders && atendimento.orders.length > 0 ? (
                          atendimento.orders.map((order: any, idx: number) => (
                              <Card key={idx} className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white">
                                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                      <div className="flex flex-col gap-0.5">
                                          <span className="text-sm font-bold text-slate-900">{order.serviceType}</span>
                                          <span className="text-xs text-slate-500">{order.items || "Sem descrição"}</span>
                                      </div>
                                      <div className="text-right flex items-center justify-end gap-3">
                                          <div>
                                              <p className="text-sm font-black text-slate-900">R$ {order.price?.toFixed(2)}</p>
                                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Entrega: {order.dueDate || 'Imediata'}</p>
                                          </div>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 text-[10px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border-slate-200" 
                                            onClick={(e) => { e.preventDefault(); navigate(`/admin/pedidos/${order.id}`); }}
                                          >
                                              VER PEDIDO
                                          </Button>
                                      </div>
                                  </div>
                              </Card>
                          ))
                      ) : (
                          <div className="p-8 text-center bg-white border border-slate-200 !rounded-none">
                              <p className="text-sm text-slate-400 italic font-medium">Nenhum item ou venda vinculada.</p>
                          </div>
                      )}
                    </div>
                </div>
            </div>

            {/* COLUNA DIREITA: RESUMO FINANCEIRO */}
            <div className="space-y-6">
              <Card className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white !p-0 !gap-0">
                <CardHeader className="p-5 border-b border-slate-100 bg-slate-900 text-white !rounded-none">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider">
                        <DollarSign className="h-4 w-4 text-emerald-400" /> Resumo do Atendimento
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-5 space-y-4 bg-white">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-slate-500 text-[11px]">
                                <span>Subtotal Bruto</span>
                                <span className="font-semibold">R$ {atendimento.subtotal?.toFixed(2) || atendimento.totalValue?.toFixed(2)}</span>
                            </div>
                            {atendimento.discount > 0 && (
                                <div className="flex justify-between items-center text-rose-500 text-[11px]">
                                    <span>Desconto Aplicado</span>
                                    <span className="font-semibold">- R$ {atendimento.discount.toFixed(2)}</span>
                                </div>
                            )}
                            {atendimento.fee > 0 && (
                                <div className="flex justify-between items-center text-emerald-600 text-[11px]">
                                    <span>Taxas / Acréscimos</span>
                                    <span className="font-semibold">+ R$ {atendimento.fee.toFixed(2)}</span>
                                </div>
                            )}
                            <Separator className="bg-slate-50" />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-bold text-slate-900 uppercase">Total Final</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight">
                                    <span className="text-sm font-bold text-slate-400 mr-1">R$</span>
                                    {atendimento.totalValue?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-0 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Método de Pagamento</Label>
                            <div className="!rounded-none border border-slate-200 h-10 flex items-center px-3 text-sm font-semibold bg-slate-50/50 uppercase tracking-wide text-slate-700">
                                {atendimento.paymentMethod || "NÃO INFORMADO"}
                            </div>
                        </div>
                    </div>

                    {atendimento.isCarne && (
                        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 !rounded-none space-y-3">
                            <p className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-2">
                                <CreditCard className="h-3 w-3" /> Detalhes do Carnê
                            </p>
                            <div className="flex items-center justify-between text-xs text-emerald-700">
                                <span>Status</span>
                                <span className="font-bold uppercase tracking-widest">Ativo</span>
                            </div>
                            <div className="pt-2 border-t border-emerald-100/50 space-y-3">
                                <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                                    O carnê está ativo. O controle de baixas das parcelas pode ser feito no módulo <strong className="font-bold">Financeiro</strong>, e o cliente pode visualizar seu próprio carnê pela área digital exclusiva.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="w-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 h-8 text-[10px] font-bold uppercase tracking-wider"
                                    onClick={() => window.open('/cliente/login', '_blank')}
                                >
                                    Acessar Portal do Cliente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
              </Card>

              <Card className="!rounded-none border-slate-200 shadow-none bg-slate-50/50 p-5">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Criado em</p>
                                <p className="text-xs font-bold text-slate-700">{atendimento.date} - {atendimento.time}</p>
                            </div>
                        </div>
                        <Separator className="bg-slate-200/50" />
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Origem</p>
                                <p className="text-xs font-bold text-slate-700">Sistema Administrativo</p>
                            </div>
                        </div>
                    </div>
              </Card>

              {atendimento.history && atendimento.history.length > 0 && (
                <Card className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 !rounded-none">
                    <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Histórico de Alterações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {atendimento.history.map((h: any, i: number) => (
                        <div key={i} className="p-4 space-y-1.5 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h.user}</span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {new Date(h.date).toLocaleDateString('pt-BR')} às {new Date(h.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{h.action}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

        {/* ÁREA DE IMPRESSÃO MODERNA (Oculta na tela, visível apenas na impressão) */}
        <div id="printable-area" style={{display: 'none'}}>
          <style>{`
            @media print {
              @page { size: A4; margin: 0; }
              html, body { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; padding: 0 !important; }
              body { background: white !important; }
            }
          `}</style>
          <div style={{
            width: '210mm', 
            minHeight: '297mm', 
            padding: '10mm 12mm', 
            backgroundColor: 'white', 
            color: 'black',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* CABEÇALHO */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4mm', borderBottom: '2px solid #0f172a', marginBottom: '4mm'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
                <div>
                  <p style={{fontSize: '7pt', fontWeight: '700', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Ficha Clínica & Pedido</p>
                </div>
              </div>
              <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px'}}>
                <p style={{fontSize: '7pt', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Protocolo</p>
                <p style={{fontSize: '11pt', fontWeight: '900', color: '#0f172a', margin: 0}}>#{atendimento.id.substring(0, 8).toUpperCase()}</p>
                <p style={{fontSize: '7pt', color: '#64748b', margin: 0}}>{atendimento.date} • {atendimento.time}</p>
              </div>
            </div>

            {/* DADOS DO PACIENTE */}
            <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4mm', marginBottom: '4mm'}}>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm'}}>Dados do Paciente</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4mm'}}>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Nome Completo</p>
                  <p style={{fontSize: '10pt', fontWeight: '700', color: '#0f172a', margin: 0}}>{atendimento.clientName}</p>
                </div>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>CPF</p>
                  <p style={{fontSize: '10pt', fontWeight: '600', color: '#334155', margin: 0}}>{atendimento.clientCpf || "—"}</p>
                </div>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Atendente</p>
                  <p style={{fontSize: '10pt', fontWeight: '600', color: '#334155', margin: 0}}>{atendimento.attendant}</p>
                </div>
              </div>
            </div>

            {/* PRESCRIÇÃO E ANOTAÇÕES */}
            <div style={{display: 'grid', gridTemplateColumns: atendimento.rxData ? '1.5fr 1fr' : '1fr', gap: '4mm', marginBottom: '4mm'}}>
              {atendimento.rxData && (
                <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden'}}>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', padding: '1mm 2mm', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', margin: 0}}>Prescrição Óptica (Rx)</p>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'center'}}>
                    <thead style={{backgroundColor: '#f1f5f9', fontSize: '6.5pt', fontWeight: '700', color: '#64748b'}}>
                      <tr>
                        <th style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}></th>
                        <th style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}></th>
                        <th style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>ESF.</th>
                        <th style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>CIL.</th>
                        <th style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>EIXO</th>
                        <th style={{padding: '1mm'}}>D.P.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td rowSpan={2} style={{padding: '1mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt', backgroundColor: '#f8fafc'}}>LONGE</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.D.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.longe_od_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.longe_od_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.longe_od_eixo || "—"}</td>
                        <td style={{padding: '1mm'}}>{atendimento.rxData.longe_od_dp || "—"}</td>
                      </tr>
                      <tr style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.E.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.longe_oe_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.longe_oe_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.longe_oe_eixo || "—"}</td>
                        <td style={{padding: '1mm'}}>{atendimento.rxData.longe_oe_dp || "—"}</td>
                      </tr>
                      <tr style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td rowSpan={2} style={{padding: '1mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt', backgroundColor: '#f8fafc'}}>PERTO</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.D.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.perto_od_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.perto_od_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.perto_od_eixo || "—"}</td>
                        <td style={{padding: '1mm'}}>{atendimento.rxData.perto_od_dp || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.E.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.perto_oe_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.perto_oe_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #e2e8f0'}}>{atendimento.rxData.perto_oe_eixo || "—"}</td>
                        <td style={{padding: '1mm'}}>{atendimento.rxData.perto_oe_dp || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {atendimento.notes && (
                <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3mm 4mm', backgroundColor: '#fff', display: 'flex', flexDirection: 'column'}}>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm'}}>Anotações Clínicas</p>
                  <p style={{fontSize: '8.5pt', color: '#334155', margin: 0, whiteSpace: 'pre-wrap'}}>{atendimento.notes}</p>
                </div>
              )}
            </div>

            {/* TABELA DE PEDIDOS */}
            <div style={{marginBottom: '4mm', flex: 1}}>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm'}}>Relação de Pedidos / Vendas</p>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt'}}>
                <thead>
                  <tr style={{backgroundColor: '#0f172a', color: 'white'}}>
                    <th style={{padding: '2mm 3mm', textAlign: 'left', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px 0 0 4px'}}>Tipo de Serviço</th>
                    <th style={{padding: '2mm 3mm', textAlign: 'left', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Itens / Descrição</th>
                    <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Entrega</th>
                    <th style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '0 4px 4px 0'}}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimento.orders && atendimento.orders.map((o: any, i: number) => (
                    <tr key={i} style={{borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                      <td style={{padding: '2mm 3mm', fontWeight: '700', color: '#0f172a'}}>{o.serviceType}</td>
                      <td style={{padding: '2mm 3mm', color: '#64748b'}}>{o.items || "—"}</td>
                      <td style={{padding: '2mm 3mm', textAlign: 'center', color: '#475569'}}>{(() => {
                        if (!o.dueDate) return "Imediata";
                        if (o.dueDate.includes("/")) {
                            const [d, m, y] = o.dueDate.split("/").map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                        }
                        return new Date(o.dueDate).toLocaleDateString('pt-BR');
                      })()}</td>
                      <td style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '800', color: '#0f172a'}}>R$ {(o.price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!atendimento.orders || atendimento.orders.length === 0) && (
                    <tr><td colSpan={4} style={{padding: '2mm', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic'}}>Nenhum pedido registrado nesta sessão.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  {(atendimento.discount > 0 || atendimento.fee > 0) && (
                    <tr style={{backgroundColor: '#f8fafc', color: '#64748b'}}>
                      <td colSpan={3} style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0'}}>SUBTOTAL BRUTO</td>
                      <td style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '8pt', borderBottom: '1px solid #e2e8f0'}}>R$ {(atendimento.subtotal || atendimento.totalValue || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {atendimento.discount > 0 && (
                    <tr style={{backgroundColor: '#fef2f2', color: '#dc2626'}}>
                      <td colSpan={3} style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0'}}>DESCONTO</td>
                      <td style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '8pt', borderBottom: '1px solid #e2e8f0'}}>- R$ {atendimento.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  {atendimento.fee > 0 && (
                    <tr style={{backgroundColor: '#ecfdf5', color: '#059669'}}>
                      <td colSpan={3} style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0'}}>TAXAS / ACRÉSCIMOS</td>
                      <td style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '8pt', borderBottom: '1px solid #e2e8f0'}}>+ R$ {atendimento.fee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{backgroundColor: '#0f172a', color: 'white'}}>
                    <td colSpan={3} style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>VALOR FINAL</td>
                    <td style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '11pt'}}>R$ {(atendimento.totalValue || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <p style={{fontSize: '7.5pt', textAlign: 'right', marginTop: '1.5mm', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px'}}>
                Pagamento: {atendimento.isCarne ? 'CARNÊ / CREDIÁRIO' : (atendimento.paymentMethod || 'NÃO DEFINIDO').toUpperCase()}
              </p>
            </div>

            {/* ASSINATURAS */}
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '4mm', paddingTop: '4mm', borderTop: '1px solid #e2e8f0', pageBreakInside: 'avoid'}}>
              <div style={{textAlign: 'center', width: '70mm'}}>
                <div style={{borderBottom: '1px solid #0f172a', marginBottom: '2mm', height: '10mm'}}></div>
                <p style={{fontSize: '6.5pt', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: 0}}>Assinatura do Paciente / Cliente</p>
              </div>
              <div style={{textAlign: 'center', width: '70mm'}}>
                <div style={{borderBottom: '1px solid #0f172a', marginBottom: '2mm', height: '10mm'}}></div>
                <p style={{fontSize: '6.5pt', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: 0}}>Ótica Melissa — {atendimento.attendant}</p>
              </div>
            </div>

            {/* CANHOTO */}
            <div style={{marginTop: '6mm', borderTop: '2px dashed #cbd5e1', paddingTop: '4mm', position: 'relative', pageBreakInside: 'avoid'}}>
              <div style={{position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 6px'}}>
                <span style={{fontSize: '8pt', color: '#94a3b8'}}>✂</span>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3mm'}}>
                    <img src="/logo.png" alt="Ótica Melissa" style={{height: '22px', width: 'auto'}} />
                    <div>
                      <p style={{fontSize: '8pt', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: 0}}>Canhoto de Retirada</p>
                      <p style={{fontSize: '6.5pt', color: '#64748b', margin: 0}}>Apresente este comprovante para retirar seus óculos</p>
                    </div>
                  </div>
                  <div style={{fontSize: '8.5pt', display: 'flex', flexDirection: 'column', gap: '1mm'}}>
                    <p style={{margin: 0}}><strong>Cliente:</strong> {atendimento.clientName || "Não informado"}</p>
                    <p style={{margin: 0}}><strong>Pedidos:</strong> {(atendimento.orders || []).length} item(ns)</p>
                    <p style={{margin: 0}}><strong>Valor Total:</strong> R$ {(atendimento.totalValue || 0).toFixed(2)}</p>
                    {atendimento.isCarne && <p style={{margin: 0, color: '#dc2626', fontWeight: '700'}}>⚠ CARNÊ — Verificar pendências antes da entrega</p>}
                  </div>
                </div>
                <div style={{textAlign: 'right', display: 'flex', gap: '3mm', alignItems: 'flex-start'}}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2mm'}}>
                    <QRCodeSVG 
                      value={`https://otica-melissa.vercel.app/cliente/login`} 
                      size={60} 
                    />
                    <p style={{fontSize: '4.5pt', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', margin: 0}}>Área do Cliente</p>
                  </div>

                  <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4mm', minWidth: '45mm'}}>
                    <p style={{fontSize: '6.5pt', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Nº Atendimento</p>
                    <p style={{fontSize: '14pt', fontWeight: '900', color: '#0f172a', margin: '0 0 2mm'}}>#{atendimento.id ? atendimento.id.substring(0, 8).toUpperCase() : "—"}</p>
                    <table style={{fontSize: '7pt', borderCollapse: 'collapse', width: '100%'}}>
                      <thead><tr style={{backgroundColor: '#e2e8f0'}}><th style={{padding: '1mm 2mm', textAlign: 'left'}}>Item</th><th style={{padding: '1mm 2mm', textAlign: 'center'}}>Entrega</th></tr></thead>
                      <tbody>
                        {(atendimento.orders || []).map((o: any, i: number) => (
                          <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                            <td style={{padding: '1mm 2mm', fontWeight: '600'}}>{o.serviceType}</td>
                            <td style={{padding: '1mm 2mm', textAlign: 'center', fontWeight: '700'}}>{(() => {
                              if (!o.dueDate) return "Retirada";
                              if (o.dueDate.includes("/")) {
                                  const [d, m, y] = o.dueDate.split("/").map(Number);
                                  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                              }
                              return new Date(o.dueDate).toLocaleDateString('pt-BR');
                            })()}</td>
                          </tr>
                        ))}
                        {(atendimento.orders || []).length === 0 && (
                          <tr>
                            <td colSpan={2} style={{padding: '2mm', textAlign: 'center', fontStyle: 'italic', color: '#94a3b8'}}>Consulta / Registro Clínico</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RODAPÉ */}
            <div style={{marginTop: 'auto', paddingTop: '3mm', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <p style={{fontSize: '6.5pt', color: '#cbd5e1', margin: 0}}>Documento gerado pelo sistema Ótica Melissa</p>
              <p style={{fontSize: '6.5pt', color: '#cbd5e1', margin: 0}}>Impresso em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
    </div>
  );
}
