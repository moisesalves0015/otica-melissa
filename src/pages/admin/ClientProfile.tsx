import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import html2pdf from 'html2pdf.js';
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { calculateCreditScore, getCreditStatusColor } from "../../lib/credit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, FileText, User, Phone, Calendar, ShoppingBag, MapPin, Activity, Download, Wrench, Save, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [dynamicBalance, setDynamicBalance] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editData, setEditData] = React.useState<any>({});

  const capitalizeName = (str: string) => {
    const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e'];
    return str.split(' ').map((word, index) => {
        if (!word) return '';
        const lower = word.toLowerCase();
        if (preposicoes.includes(lower) && index !== 0) return lower;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const startEditing = () => {
    setEditData({ ...client });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleCepBlur = async () => {
    if (!editData.cep) return;
    const cep = editData.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEditData((prev: any) => ({
            ...prev,
            address: data.logradouro || prev.address || "",
            bairro: data.bairro || prev.bairro || "",
            city: `${data.localidade || ""} - ${data.uf || ""}` || prev.city || ""
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleUpdate = async () => {
    if (!client || !id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "clients", id), editData);
      toast.success("Perfil do cliente atualizado com sucesso!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        const parseDate = (s: string) => {
            if (!s) return 0;
            if (s.includes("/")) {
                const [d, m, y] = s.split("/").map(Number);
                return new Date(y, m - 1, d).getTime();
            }
            return new Date(s).getTime();
        };
        records.sort((a: any, b: any) => parseDate(b.date) - parseDate(a.date));
        setHistory(records);

        // Fetch installments for dynamic balance and credit score
        const qInst = query(collection(db, "installments"), where("clientId", "==", id));
        const instSnapshot = await getDocs(qInst);
        const allInst = instSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setInstallments(allInst);
        const unpaidInst = allInst.filter((i: any) => i.status !== 'Pago');
        const balance = unpaidInst.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
        setDynamicBalance(balance);
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
    const content = document.querySelector('.print-page');
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error("Por favor, permita pop-ups para imprimir.");
        return;
    }

    printWindow.document.write(`
        <html>
            <head>
                <title>Prontuário - Ótica Melissa</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; font-family: sans-serif; }
                    * { box-sizing: border-box; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div style="padding: 10mm 12mm; min-height: 297mm;">
                    ${content.innerHTML}
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-client') as HTMLElement;
    if (!element) {
        toast.error("Erro ao localizar o conteúdo da ficha.");
        return;
    }

    const opt = {
      margin:       0,
      filename:     `Prontuario_${client.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    toast.info("Gerando PDF, aguarde...");
    
    // Garantir que o elemento seja visível para captura
    const originalStyle = element.style.display;
    element.style.display = 'block';

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.display = originalStyle;
        toast.success("Download concluído!");
    }).catch((err: any) => {
        element.style.display = originalStyle;
        console.error("Erro no PDF:", err);
        toast.error("Erro ao gerar PDF.");
    });
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
        <div className="flex gap-2">
            {isEditing ? (
              <>
                  <Button onClick={cancelEditing} variant="outline" className="rounded font-bold text-xs h-9">
                      <XCircle className="mr-2 h-4 w-4" /> CANCELAR
                  </Button>
                  <Button onClick={handleUpdate} disabled={saving} className="rounded font-bold text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white">
                      <Save className="mr-2 h-4 w-4" /> {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                  </Button>
              </>
            ) : (
              <>
                  <Button onClick={startEditing} variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-300 text-slate-700" title="Editar Perfil">
                      <Wrench className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleDownloadPDF} variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-300 text-slate-700" title="Baixar PDF">
                      <Download className="h-4 w-4" />
                  </Button>
                  <Button onClick={handlePrint} variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-300 text-slate-700" title="Imprimir Prontuário">
                      <Printer className="h-4 w-4" />
                  </Button>
              </>
            )}
        </div>
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
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4`}>
              {isEditing ? (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Nome Completo</Label>
                    <Input value={editData.name || ''} onChange={e => setEditData({...editData, name: capitalizeName(e.target.value)})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">CPF</Label>
                    <Input value={editData.cpf || ''} onChange={e => setEditData({...editData, cpf: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Data de Nascimento</Label>
                    <Input value={editData.birthDate || ''} onChange={e => setEditData({...editData, birthDate: e.target.value})} placeholder="DD/MM/YYYY" className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Telefone / WhatsApp</Label>
                    <Input value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Email</Label>
                    <Input value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5 lg:col-span-3">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Profissão</Label>
                    <Input value={editData.profession || ''} onChange={e => setEditData({...editData, profession: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">CEP</Label>
                    <Input value={editData.cep || ''} onChange={e => setEditData({...editData, cep: e.target.value})} onBlur={handleCepBlur} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Endereço</Label>
                    <Input value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Número</Label>
                    <Input value={editData.number || ''} onChange={e => setEditData({...editData, number: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Complemento</Label>
                    <Input value={editData.complement || ''} onChange={e => setEditData({...editData, complement: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Bairro</Label>
                    <Input value={editData.bairro || ''} onChange={e => setEditData({...editData, bairro: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Cidade / UF</Label>
                    <Input value={editData.city || ''} onChange={e => setEditData({...editData, city: e.target.value})} className="h-8 text-sm font-semibold rounded" />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
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
                  {client.profession && (
                    <div className="lg:col-span-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Profissão</p>
                      <p className="font-medium text-slate-700">{client.profession}</p>
                    </div>
                  )}
                  {(client.address || client.cep) && (
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-4 pt-4 border-t border-slate-100">
                      <div className="md:col-span-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço Completo</p>
                        <p className="font-medium text-slate-700">
                          {client.address || "Endereço não informado"}{client.number ? `, ${client.number}` : ""}{client.complement ? ` - ${client.complement}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {client.bairro ? `${client.bairro} - ` : ""}{client.city ? client.city : ""}{client.cep ? ` | CEP: ${client.cep}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Cliente Desde</p>
                <p className="font-medium text-slate-700">
                  {(() => {
                      if (!client.createdAt) return "Não informado";
                      const d = client.createdAt;
                      if (d.includes("/")) return d;
                      return new Date(d).toLocaleDateString('pt-BR');
                  })()}
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
              {(() => {
                const score = calculateCreditScore(client, installments);
                return (
                  <Badge className={`rounded ${getCreditStatusColor(score.status)} text-xs font-bold uppercase tracking-wider border-none px-3 py-1 shadow-none`}>
                    {score.status}
                  </Badge>
                );
              })()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Saldo Financeiro</p>
                  {dynamicBalance > 0 ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[9px] px-1.5 py-0 font-bold border-none shadow-none uppercase">Saldo Devedor Ativo</Badge>
                  ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[9px] px-1.5 py-0 font-bold border-none shadow-none uppercase">Crédito</Badge>
                  )}
              </div>
              <p className={`text-2xl font-black ${dynamicBalance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {dynamicBalance === 0 ? 'R$ 0,00' : `R$ ${dynamicBalance.toFixed(2)}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Última Visita</p>
              <p className="font-medium text-slate-700">{history.length > 0 ? history[0].date : (client.lastVisit || "-")}</p>
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
      
      {/* FICHA FORMATADA PARA CONFERÊNCIA (PRÉVIA) */}
      <div id="printable-client" className="print-page bg-white" style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        margin: '0 auto', 
        padding: '5mm 12mm 10mm 12mm', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4mm',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
      }}>
        
        {/* CABEÇALHO */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4mm', borderBottom: '2px solid #000000', marginBottom: '4mm'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
            <div>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#000000', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Prontuário do Cliente</p>
            </div>
          </div>
          <div style={{textAlign: 'right', display: 'flex', gap: '3mm', alignItems: 'flex-start'}}>
            {/* QR CODE DE ACESSO AO PORTAL */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2mm'}}>
              <QRCodeSVG 
                value={`https://otica-melissa.vercel.app/cliente/login`} 
                size={50} 
              />
              <p style={{fontSize: '4pt', fontWeight: '900', textTransform: 'uppercase', color: '#000000', margin: 0}}>Portal do Cliente</p>
            </div>

            <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px'}}>
              <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Nº da Ficha</p>
              <p style={{fontSize: '13pt', fontWeight: '900', color: '#000000', margin: 0}}>#{client.id.length > 8 ? client.id.slice(0,6).toUpperCase() : client.id}</p>
              <p style={{fontSize: '6.5pt', color: '#334155', margin: 0}}>Cliente desde {(() => {
                  if (!client.createdAt) return "---";
                  if (client.createdAt.includes("/")) return client.createdAt;
                  return new Date(client.createdAt).toLocaleDateString('pt-BR');
              })()}</p>
            </div>
          </div>
        </div>

        {/* DADOS PESSOAIS */}
        <div style={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4mm', marginBottom: '4mm'}}>
          <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm'}}>Dados Pessoais</p>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4mm'}}>
            <div><p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Nome Completo</p><p style={{fontSize: '10pt', fontWeight: '800', color: '#000000', margin: 0}}>{client.name}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>CPF</p><p style={{fontSize: '9.5pt', fontWeight: '700', color: '#000000', margin: 0}}>{client.cpf || "—"}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Data de Nascimento</p><p style={{fontSize: '9.5pt', fontWeight: '700', color: '#000000', margin: 0}}>{(() => {
                if (!client.birthDate) return "—";
                if (client.birthDate.includes("/")) return client.birthDate;
                return new Date(client.birthDate).toLocaleDateString('pt-BR');
            })()}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Telefone</p><p style={{fontSize: '9.5pt', fontWeight: '700', color: '#000000', margin: 0}}>{client.phone || "—"}</p></div>
            <div><p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Email</p><p style={{fontSize: '9.5pt', fontWeight: '700', color: '#000000', margin: 0}}>{client.email || "—"}</p></div>
             <div>
              <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.5mm'}}>Status de Crédito</p>
              {(() => {
                const score = calculateCreditScore(client, installments);
                const color = score.status === 'Excelente' ? '#065f46' : 
                              score.status === 'Bom' ? '#1d4ed8' : 
                              score.status === 'Atenção' ? '#b45309' : 
                              score.status === 'Inadimplente' ? '#991b1b' : '#334155';
                return (
                  <p style={{fontSize: '9.5pt', fontWeight: '900', color: color, margin: 0}}>{score.status}</p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* STATUS FINANCEIRO */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginBottom: '4mm'}}>
          <div style={{border: '1px solid #cbd5e1', borderLeft: `4px solid ${dynamicBalance > 0 ? '#991b1b' : '#166534'}`, borderRadius: '8px', padding: '4mm'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5mm'}}>
                <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: 0}}>Saldo Financeiro</p>
                <span style={{fontSize: '6pt', fontWeight: '800', textTransform: 'uppercase', color: dynamicBalance > 0 ? '#991b1b' : '#166534', backgroundColor: dynamicBalance > 0 ? '#fee2e2' : '#dcfce7', padding: '0.5mm 1.5mm', borderRadius: '4px'}}>{dynamicBalance > 0 ? 'Saldo Devedor' : 'Crédito'}</span>
            </div>
            <p style={{fontSize: '16pt', fontWeight: '900', color: dynamicBalance > 0 ? '#991b1b' : '#000000', margin: 0}}>R$ {dynamicBalance.toFixed(2)}</p>
          </div>
          <div style={{border: '1px solid #cbd5e1', borderLeft: '4px solid #334155', borderRadius: '8px', padding: '4mm'}}>
            <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1.5mm'}}>Última Visita Registrada</p>
            <p style={{fontSize: '12pt', fontWeight: '800', color: '#000000', margin: 0}}>{history.length > 0 ? history[0].date : (client.lastVisit || "—")}</p>
          </div>
        </div>

        {/* HISTÓRICO DE ATENDIMENTOS */}
        <div style={{flex: 1}}>
          <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm'}}>Histórico de Atendimentos</p>
          {history.length === 0 ? (
            <p style={{color: '#334155', fontStyle: 'italic', fontSize: '9pt', textAlign: 'center', padding: '6mm'}}>Nenhum atendimento registrado.</p>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8pt'}}>
              <thead>
                <tr style={{backgroundColor: '#000000', color: 'white'}}>
                  <th style={{padding: '2mm 3mm', textAlign: 'left', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800'}}>Data</th>
                  <th style={{padding: '2mm 3mm', textAlign: 'left', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800'}}>Serviços / Itens</th>
                  <th style={{padding: '2mm 3mm', textAlign: 'left', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800'}}>Pagamento</th>
                  <th style={{padding: '2mm 3mm', textAlign: 'right', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800'}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {history.map((atendimento: any, idx: number) => {
                  const orderItems = atendimento.orders || atendimento.items || [];
                  return (
                    <tr key={atendimento.id} style={{borderBottom: '1px solid #cbd5e1', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid'}}>
                      <td style={{padding: '3mm 3mm', fontWeight: '800', color: '#000000', whiteSpace: 'nowrap'}}>
                        {atendimento.date || "—"}
                        {atendimento.time && <span style={{display: 'block', fontSize: '6.5pt', color: '#334155', fontWeight: '700', marginTop: '1mm'}}>{atendimento.time}</span>}
                      </td>
                      <td style={{padding: '3mm 3mm', color: '#000000', fontWeight: '600'}}>
                        {orderItems.length > 0 ? orderItems.map((o: any) => o.serviceType || o.service).join(', ') : "Registro clínico"}
                        {orderItems.length > 0 && orderItems[0].items && <span style={{display: 'block', fontSize: '6.5pt', color: '#334155', marginTop: '1mm', lineHeight: '1.4', fontWeight: '500'}}>{orderItems[0].items}</span>}
                      </td>
                      <td style={{padding: '3mm 3mm', color: '#000000', textTransform: 'uppercase', fontSize: '7pt', fontWeight: '800'}}>{atendimento.paymentMethod || "—"}</td>
                      <td style={{padding: '3mm 3mm', textAlign: 'right', fontWeight: '900', color: '#000000'}}>R$ {(atendimento.totalValue || atendimento.total || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1'}}>
                  <td colSpan={3} style={{padding: '4mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '1px', color: '#334155'}}>Total Gasto no Histórico:</td>
                  <td style={{padding: '4mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '11pt', color: '#000000'}}>
                    R$ {history.reduce((acc: number, a: any) => acc + (a.totalValue || a.total || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* RODAPÉ */}
        <div style={{marginTop: 'auto', paddingTop: '3mm', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <p style={{fontSize: '6.5pt', color: '#94a3b8', margin: 0}}>Prontuário gerado pelo sistema Ótica Melissa</p>
          <p style={{fontSize: '6.5pt', color: '#94a3b8', margin: 0}}>Relatório emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        </div>
      </div>
  );
}
