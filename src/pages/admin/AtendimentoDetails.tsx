import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, query, deleteDoc, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
  ArrowLeft, User, ShoppingCart, 
  Clock, FileText, Activity, Printer, 
  CreditCard, DollarSign, Calendar, Wrench, XCircle, Save, Trash2, Download,
  Menu, MoreVertical, Plus, CheckCircle, Package, ChevronDown, ChevronUp
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2pdf from 'html2pdf.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function AtendimentoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [atendimento, setAtendimento] = React.useState<any>(null);
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [editNotes, setEditNotes] = React.useState("");
  const [editTso, setEditTso] = React.useState("");
  const [editRx, setEditRx] = React.useState<any>({});
  const [linkedOrders, setLinkedOrders] = React.useState<any[]>([]);
  const [categorias, setCategorias] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [editOrders, setEditOrders] = React.useState<any[]>([]);
  const [expandedOrderIndex, setExpandedOrderIndex] = React.useState<number | null>(null);
  const [showRemovalConfirm, setShowRemovalConfirm] = React.useState(false);
  const [showCancelOrderConfirm, setShowCancelOrderConfirm] = React.useState(false);
  const [orderToDelete, setOrderToDelete] = React.useState<{id: string, idx: number} | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = React.useState("pix");
  const [editDiscountValue, setEditDiscountValue] = React.useState(0);
  const [editDiscountType, setEditDiscountType] = React.useState<"fixed" | "percent">("fixed");
  const [editFeeValue, setEditFeeValue] = React.useState(0);
  const [editFeeType, setEditFeeType] = React.useState<"fixed" | "percent">("percent");
  const [editEntrada, setEditEntrada] = React.useState(0);
  const [editInstallmentsCount, setEditInstallmentsCount] = React.useState(1);
  const [editFirstDueDate, setEditFirstDueDate] = React.useState("");

  const formatDate = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length >= 5) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    return v;
  };

  const calculateItemFinalPrice = (item: any) => {
    let price = item.price || 0;
    const disc = item.discountType === "percent" ? (price * (item.discount / 100)) : (item.discount || 0);
    const addition = item.feeType === "percent" ? (price * (item.fee / 100)) : (item.fee || 0);
    return Math.max(0, price - disc + addition);
  };

  const currentSubtotal = isEditing 
    ? editOrders.reduce((acc, curr) => acc + calculateItemFinalPrice(curr), 0)
    : (atendimento?.subtotal || atendimento?.totalValue || 0);

  const currentDiscount = isEditing ? editDiscountValue : (atendimento?.discount || 0);
  const currentDiscountType = isEditing ? editDiscountType : (atendimento?.discountType || 'fixed');
  const currentCalculatedDiscount = currentDiscountType === 'percent' ? (currentSubtotal * (currentDiscount / 100)) : currentDiscount;

  const currentFeeValue = isEditing ? editFeeValue : (atendimento?.feeValue || 0);
  const currentFeeType = isEditing ? editFeeType : (atendimento?.feeType || 'percent');
  const currentCalculatedFee = currentFeeType === 'percent' ? (currentSubtotal * (currentFeeValue / 100)) : currentFeeValue;

  const currentTotal = Math.max(0, currentSubtotal - currentCalculatedDiscount + currentCalculatedFee);
  const currentPaymentMethod = isEditing ? editPaymentMethod : (atendimento?.paymentMethod || 'pix');

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

    const qOrders = query(collection(db, "orders"), where("atendimentoId", "==", id));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setLinkedOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCats = onSnapshot(query(collection(db, "categorias")), (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFornecedores = onSnapshot(query(collection(db, "fornecedores")), (snap) => {
      setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub();
      unsubAtendentes();
      unsubOrders();
      unsubCats();
      unsubFornecedores();
    };
  }, [id, navigate]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'em laboratório': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pronto': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'entregue': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelado': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleRemoveOrder = (orderId: string, idx: number) => {
    setOrderToDelete({ id: orderId, idx });
    setShowRemovalConfirm(true);
  };

  const confirmRemoval = async () => {
    if (!orderToDelete || !atendimento) return;
    
    try {
      setSaving(true);
      const orderBeingRemoved = linkedOrders.find(o => o.id === orderToDelete.id);
      const newOrders = [...atendimento.orders];
      newOrders.splice(orderToDelete.idx, 1);

      const historyEntry = {
        date: new Date().toISOString(),
        action: `Alterações efetuadas: Item removido do atendimento: ${orderBeingRemoved?.serviceType || 'Serviço/Produto'}`,
        user: localStorage.getItem("selectedAtendente") || "Vendedora"
      };

      // Atualiza o atendimento
      await updateDoc(doc(db, "atendimentos", id!), {
        orders: newOrders,
        history: arrayUnion(historyEntry)
      });

      setShowRemovalConfirm(false);
      
      toast.success("Item removido do atendimento!", {
        onAutoClose: () => {
          // Após a mensagem sumir, verifica se deve perguntar sobre o cancelamento do pedido
          const order = linkedOrders.find(o => o.id === orderToDelete.id);
          if (order && order.status !== "Cancelado") {
            setShowCancelOrderConfirm(true);
          } else {
            setOrderToDelete(null);
          }
        }
      });
    } catch (error: any) {
      toast.error("Erro ao remover item: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrderAction = async () => {
    if (!orderToDelete || !atendimento) return;
    
    try {
      setSaving(true);
      const historyEntry = {
        date: new Date().toISOString(),
        action: `Pedido cancelado automaticamente ao ser removido do Atendimento #${atendimento.tso || id}`,
        user: localStorage.getItem("selectedAtendente") || "Vendedora"
      };

      await updateDoc(doc(db, "orders", orderToDelete.id), {
        status: "Cancelado",
        canceledAt: new Date().toISOString(),
        history: arrayUnion(historyEntry)
      });
      toast.success("Pedido vinculado marcado como cancelado.");
    } catch (error: any) {
      toast.error("Erro ao cancelar pedido: " + error.message);
    } finally {
      setSaving(false);
      setShowCancelOrderConfirm(false);
      setOrderToDelete(null);
    }
  };

  const updateEditOrder = (idx: number, field: string, value: any) => {
    const newOrders = [...editOrders];
    newOrders[idx] = { ...newOrders[idx], [field]: value };
    setEditOrders(newOrders);
  };

  const addEmptyOrder = () => {
    const newOrder = {
      id: "TEMP-" + Date.now(),
      serviceType: "",
      price: 0,
      discount: 0,
      fee: 0,
      discountType: "fixed",
      feeType: "fixed",
      items: "",
      dueDate: "",
      labNotes: "",
      labCode: "",
      isNew: true
    };
    setEditOrders([...editOrders, newOrder]);
    setExpandedOrderIndex(editOrders.length);
  };

  const startEditing = () => {
    setEditNotes(atendimento.notes || "");
    setEditTso(atendimento.tso || "");
    setEditRx({ ...(atendimento.rxData || {}) });
    setEditOrders([...(atendimento.orders || [])]);
    setEditPaymentMethod(atendimento.paymentMethod || "pix");
    setEditDiscountValue(atendimento.discount || 0);
    setEditDiscountType(atendimento.discountType || "fixed");
    setEditFeeValue(atendimento.feeValue || 0);
    setEditFeeType(atendimento.feeType || "percent");
    setEditEntrada(atendimento.entrada || 0);
    setEditInstallmentsCount(atendimento.installmentsCount || 1);
    setEditFirstDueDate(atendimento.firstDueDate || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!atendimento || !id) return;
    setSaving(true);
    
    try {
      // Validação de TSO Único na Edição
      if (atendimento.tso !== editTso && editTso) {
        const tsoQuery = query(collection(db, "atendimentos"), where("tso", "==", editTso));
        const tsoSnapshot = await getDocs(tsoQuery);
        if (!tsoSnapshot.empty) {
          toast.error(`O TSO #${editTso} já está sendo usado em outro atendimento.`);
          setSaving(false);
          return;
        }
      }

      // Validação de Categorias
      const missingCategory = editOrders.some(o => !o.serviceType);
      if (missingCategory) {
        toast.error("Por favor, selecione uma categoria para todos os itens.");
        setSaving(false);
        return;
      }

      const changes: string[] = [];
      if (atendimento.notes !== editNotes) changes.push(`Anotações atualizadas`);
      if (atendimento.tso !== editTso) changes.push(`TSO alterado para ${editTso}`);
      if (atendimento.paymentMethod !== editPaymentMethod) changes.push(`Forma de pagamento alterada para ${editPaymentMethod.toUpperCase()}`);
      if (atendimento.discount !== editDiscountValue || atendimento.discountType !== editDiscountType) changes.push(`Desconto global ajustado`);
      if (atendimento.feeValue !== editFeeValue || atendimento.feeType !== editFeeType) changes.push(`Taxas/Acréscimos globais ajustados`);
      if (atendimento.entrada !== editEntrada) changes.push(`Valor de entrada alterado`);
      if (atendimento.installmentsCount !== editInstallmentsCount) changes.push(`Número de parcelas alterado`);
      if (atendimento.firstDueDate !== editFirstDueDate) changes.push(`Data de vencimento alterada`);
      
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

      // Verifica mudanças nos pedidos (itens)
      const originalOrders = atendimento.orders || [];
      if (editOrders.length > originalOrders.length) {
        const addedItems = editOrders.filter(o => o.isNew);
        addedItems.forEach(item => {
          changes.push(`Item adicionado no atendimento: ${item.serviceType || 'Não definido'}`);
        });
      } else if (editOrders.length < originalOrders.length) {
        changes.push(`Lista de itens alterada (remoção)`);
      } else {
        const hasItemEdits = editOrders.some((order, idx) => {
          const original = originalOrders[idx];
          if (!original) return true;
          return order.serviceType !== original.serviceType || 
                 order.price !== original.price || 
                 order.discount !== original.discount ||
                 order.fee !== original.fee ||
                 order.items !== original.items ||
                 order.dueDate !== original.dueDate ||
                 order.orderCode !== original.orderCode;
        });
        if (hasItemEdits) changes.push(`Detalhes de itens atualizados`);
      }

      if (changes.length === 0) {
        toast.info("Nenhuma alteração detectada.");
        setIsEditing(false);
        setSaving(false);
        return;
      }

      const historyEntry = {
        date: new Date().toISOString(),
        action: `Alterações efetuadas: ${changes.join(', ')}`,
        user: localStorage.getItem("selectedAtendente") || "Vendedora"
      };

      // Recalcula o total final baseado nos pedidos editados e ajustes globais
      const finalOrders = editOrders.map(o => {
        const { isNew, ...rest } = o;
        return rest;
      });
      
      const subtotal = finalOrders.reduce((acc, curr) => acc + calculateItemFinalPrice(curr), 0);
      const calculatedDiscount = editDiscountType === "percent" ? (subtotal * (editDiscountValue / 100)) : editDiscountValue;
      const calculatedFee = editFeeType === "percent" ? (subtotal * (editFeeValue / 100)) : editFeeValue;
      const totalValue = Math.max(0, subtotal - (calculatedDiscount || 0) + (calculatedFee || 0));

      // 1. Atualiza documentos na coleção 'orders'
      const updatedOrdersForAtendimento = [];
      for (let i = 0; i < editOrders.length; i++) {
        const order = editOrders[i];
        const { isNew, ...orderData } = order;
        
        const baseTso = editTso || atendimento.tso || id.slice(0,6).toUpperCase();
        const itemNumber = String(i + 1).padStart(3, '0');
        const generatedCode = `${baseTso}${itemNumber}`;
        
        orderData.orderCode = generatedCode;
        orderData.labCode = orderData.labCode || "";
        orderData.tso = baseTso;

        if (isNew) {
          const realId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
          orderData.id = realId;
          orderData.atendimentoId = id;
          orderData.clientId = atendimento.clientId;
          orderData.clientName = atendimento.clientName;
          orderData.seller = atendimento.attendant;
          orderData.status = "Pendente";
          orderData.createdAt = new Date().toISOString();
          orderData.paymentMethod = editPaymentMethod; // Sincroniza forma de pagamento
          
          await setDoc(doc(db, "orders", realId), orderData);
          updatedOrdersForAtendimento.push(orderData);
        } else {
          // Atualiza forma de pagamento no pedido existente também
          orderData.paymentMethod = editPaymentMethod;
          await updateDoc(doc(db, "orders", order.id), orderData);
          updatedOrdersForAtendimento.push(orderData);
        }
      }

      // 2. Atualiza o atendimento principal
      await updateDoc(doc(db, "atendimentos", id), {
        notes: editNotes,
        tso: editTso,
        rxData: newRxData,
        orders: updatedOrdersForAtendimento,
        subtotal: subtotal,
        discount: editDiscountValue,
        discountType: editDiscountType,
        fee: calculatedFee, // Valor em R$ para o histórico
        feeValue: editFeeValue, // Valor original digitado
        feeType: editFeeType,
        totalValue: totalValue,
        paymentMethod: editPaymentMethod,
        isCarne: editPaymentMethod === 'carne',
        entrada: editEntrada,
        installmentsCount: editInstallmentsCount,
        firstDueDate: editFirstDueDate,
        history: arrayUnion(historyEntry)
      });

      toast.success("Atendimento e Pedidos atualizados!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir permanentemente este atendimento? Esta ação não pode ser desfeita e removerá também qualquer ficha financeira (carnê) vinculada.")) {
      try {
        setSaving(true);
        // 1. Deletar parcelas vinculadas (carnê)
        const qInst = query(collection(db, "installments"), where("atendimentoId", "==", id));
        const instSnap = await getDocs(qInst);
        const instPromises = instSnap.docs.map(d => deleteDoc(doc(db, "installments", d.id)));
        await Promise.all(instPromises);

        // 1.5 Deletar transações de caixa vinculadas
        const qTrans = query(collection(db, "financial_transactions"), where("atendimentoId", "==", id));
        const transSnap = await getDocs(qTrans);
        const transPromises = transSnap.docs.map(d => deleteDoc(doc(db, "financial_transactions", d.id)));
        await Promise.all(transPromises);

        // 2. Deletar o atendimento
        await deleteDoc(doc(db, "atendimentos", id));
        
        toast.success("Atendimento e dados financeiros excluídos com sucesso.");
        navigate("/admin/atendimentos");
      } catch (err: any) {
        toast.error("Erro ao excluir atendimento: " + err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) {
        toast.error("Erro ao localizar o conteúdo da ficha.");
        return;
    }

    const clientName = atendimento.clientName || "Cliente";
    const dateStr = atendimento.date ? atendimento.date.replace(/\//g, '-') : "data";

    const opt = {
      margin:       0,
      filename:     `Atendimento_${clientName.replace(/\s+/g, '_')}_${dateStr}.pdf`,
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
        /* SILENT ERROR */
        toast.error("Erro ao gerar PDF.");
    });
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
          <div className="flex items-center justify-between print:hidden px-4 md:px-0">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigate("/admin/atendimentos")} className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 truncate">
                  Atendimento <span className="text-slate-500 font-medium">#{atendimento.tso || atendimento.id.slice(0, 8).toUpperCase()}</span>
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 truncate">{atendimento.date} às {atendimento.time}</p>
              </div>
            </div>

            {/* AÇÕES - DESKTOP */}
            <div className="hidden md:flex gap-2">
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
                  <Button type="button" onClick={handleDelete} variant="outline" size="icon" className="rounded-full h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" onClick={startEditing} variant="outline" size="icon" className="rounded-full h-9 w-9" title="Editar">
                    <Wrench className="h-4 w-4" />
                  </Button>
                  <Button type="button" onClick={handleDownloadPDF} variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-300 text-slate-700" title="Baixar PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => {
                      const content = document.getElementById('printable-area');
                      if (!content) return;
                      
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        toast.error("Por favor, permita pop-ups para imprimir.");
                        return;
                      }

                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Ficha de Atendimento - Ótica Melissa</title>
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
                    }} 
                    variant="outline" 
                    size="icon"
                    className="rounded-full h-9 w-9"
                    title="Imprimir Ficha Completa"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* AÇÕES - MOBILE (MENU) */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-300">
                    <MoreVertical className="h-4 w-4 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Opções do Atendimento</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 py-6">
                    {isEditing ? (
                      <>
                        <Button 
                          type="button" 
                          onClick={handleUpdate as any}
                          disabled={saving}
                          className="w-full justify-start font-bold text-xs h-12 bg-slate-900 text-white"
                        >
                          <Save className="mr-3 h-5 w-5" /> {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                        </Button>
                        <Button 
                          type="button" 
                          onClick={cancelEditing} 
                          variant="outline" 
                          className="w-full justify-start font-bold text-xs h-12"
                        >
                          <XCircle className="mr-3 h-5 w-5" /> CANCELAR EDIÇÃO
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          type="button" 
                          onClick={startEditing} 
                          variant="outline" 
                          className="w-full justify-start font-bold text-xs h-12"
                        >
                          <Wrench className="mr-3 h-5 w-5 text-slate-600" /> EDITAR INFORMAÇÕES
                        </Button>
                        <Button 
                          type="button" 
                          onClick={handleDownloadPDF} 
                          variant="outline" 
                          className="w-full justify-start font-bold text-xs h-12"
                        >
                          <Download className="mr-3 h-5 w-5 text-slate-600" /> BAIXAR FICHA (PDF)
                        </Button>
                        <Button 
                          type="button"
                          onClick={() => {
                            // Reutiliza a lógica de impressão
                            const content = document.getElementById('printable-area');
                            if (!content) return;
                            const printWindow = window.open('', '_blank');
                            if (!printWindow) return;
                            printWindow.document.write(`<html><head><title>Ficha</title></head><body>${content.innerHTML}</body></html>`);
                            printWindow.document.close();
                            printWindow.print();
                            printWindow.close();
                          }} 
                          variant="outline" 
                          className="w-full justify-start font-bold text-xs h-12"
                        >
                          <Printer className="mr-3 h-5 w-5 text-slate-600" /> IMPRIMIR FICHA
                        </Button>
                        <Separator className="my-2" />
                        <Button 
                          type="button" 
                          onClick={handleDelete} 
                          variant="outline" 
                          className="w-full justify-start font-bold text-xs h-12 text-red-600 border-red-100 hover:bg-red-50"
                        >
                          <Trash2 className="mr-3 h-5 w-5" /> EXCLUIR REGISTRO
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">TSO (Nº)</p>
                            {isEditing ? (
                                <Input 
                                    value={editTso}
                                    onChange={e => setEditTso(e.target.value)}
                                    className="h-8 w-24 text-sm font-bold"
                                />
                            ) : (
                                <p className="text-sm font-bold text-slate-900 h-8 flex items-center">{atendimento.tso || "—"}</p>
                            )}
                        </div>
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
                      {isEditing && (
                        <Button 
                          onClick={addEmptyOrder} 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase bg-slate-900 text-white hover:bg-slate-800 border-none"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> ADICIONAR ITEM
                        </Button>
                      )}
                  </div>
                  <div className="space-y-3">
                      {isEditing ? (
                          editOrders.map((order: any, idx: number) => (
                              <Card key={order.id || idx} className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white transition-all !p-0 !gap-0">
                                  <div 
                                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${expandedOrderIndex === idx ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                                      onClick={() => setExpandedOrderIndex(expandedOrderIndex === idx ? null : idx)}
                                  >
                                      <div className="flex items-center gap-4">
                                          <div className="h-6 w-6 !rounded-none bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                                              {idx + 1}
                                          </div>
                                          <div className="flex flex-col">
                                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{order.serviceType}</span>
                                              {expandedOrderIndex !== idx && order.items && <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{order.items}</span>}
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                          <div className="text-right">
                                              <span className="text-sm font-black text-emerald-600">R$ {calculateItemFinalPrice(order).toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 !rounded-none" onClick={(e) => { e.stopPropagation(); handleRemoveOrder(order.id, idx); }}>
                                                  <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                              <div className="h-7 w-7 flex items-center justify-center text-slate-400">
                                                  {expandedOrderIndex === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  {expandedOrderIndex === idx && (
                                      <div className="p-5 space-y-5 bg-white">
                                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                              <div className="md:col-span-5 space-y-1.5">
                                                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Serviço / Categoria</Label>
                                                  <Select value={order.serviceType} onValueChange={(val) => updateEditOrder(idx, 'serviceType', val)}>
                                                      <SelectTrigger className="!rounded-none border-slate-200 h-9 text-xs font-medium">
                                                          <SelectValue placeholder="Selecione uma categoria" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {categorias.map(cat => (
                                                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                                        ))}
                                                        {categorias.length === 0 && <SelectItem value="Serviço">Serviço</SelectItem>}
                                                      </SelectContent>
                                                  </Select>
                                              </div>
                                              <div className="md:col-span-7 grid grid-cols-3 gap-3">
                                                  <div className="space-y-1.5">
                                                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor (R$)</Label>
                                                      <Input type="number" step="0.01" value={order.price || ''} onChange={(e) => updateEditOrder(idx, 'price', Number(e.target.value))} className="!rounded-none border-slate-200 h-9 text-sm font-bold" />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Desc. ({order.discountType === 'percent' ? '%' : 'R$'})</Label>
                                                      <div className="flex gap-1">
                                                          <Input type="number" step="0.01" value={order.discount || ''} onChange={(e) => updateEditOrder(idx, 'discount', Number(e.target.value))} className="!rounded-none border-slate-200 h-9 text-sm font-bold" />
                                                          <Button variant="outline" size="icon" className="h-9 w-9 !rounded-none border-slate-200 flex-none" onClick={(e) => { e.stopPropagation(); updateEditOrder(idx, 'discountType', order.discountType === 'percent' ? 'fixed' : 'percent'); }}>
                                                              <span className="text-[10px] font-bold">{order.discountType === 'percent' ? '%' : '$'}</span>
                                                          </Button>
                                                      </div>
                                                  </div>
                                                  <div className="space-y-1.5">
                                                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Acrés. ({order.feeType === 'percent' ? '%' : 'R$'})</Label>
                                                      <div className="flex gap-1">
                                                          <Input type="number" step="0.01" value={order.fee || ''} onChange={(e) => updateEditOrder(idx, 'fee', Number(e.target.value))} className="!rounded-none border-slate-200 h-9 text-sm font-bold" />
                                                          <Button variant="outline" size="icon" className="h-9 w-9 !rounded-none border-slate-200 flex-none" onClick={(e) => { e.stopPropagation(); updateEditOrder(idx, 'feeType', order.feeType === 'percent' ? 'fixed' : 'percent'); }}>
                                                              <span className="text-[10px] font-bold">{order.feeType === 'percent' ? '%' : '$'}</span>
                                                          </Button>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="space-y-1.5">
                                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição Detalhada dos Itens</Label>
                                              <Input value={order.items} onChange={(e) => updateEditOrder(idx, 'items', e.target.value)} placeholder="Ex: Armação RX5184 Preta + Lentes Kodak Anti-Reflexo" className="!rounded-none border-slate-200 h-9 text-xs" />
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                              <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código do Laboratório (Opcional)</Label>
                                                  <Input value={order.labCode || ""} onChange={(e) => updateEditOrder(idx, 'labCode', e.target.value)} placeholder="Ex: LAB-2024-001" className="h-9 rounded border-slate-200 text-xs font-mono disabled:opacity-70 disabled:bg-slate-50" />
                                              </div>
                                              <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código do Pedido / Sistema</Label>
                                                  <Input value={order.orderCode} onChange={(e) => updateEditOrder(idx, 'orderCode', e.target.value)} placeholder="Ex: PED-2024-001" className="!rounded-none border-slate-200 h-9 text-xs font-mono font-semibold" />
                                              </div>
                                              <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</Label>
                                                  <Select value={order.supplier} onValueChange={(val) => updateEditOrder(idx, 'supplier', val)}>
                                                      <SelectTrigger className="!rounded-none border-slate-200 h-9 text-xs font-medium">
                                                          <SelectValue placeholder="Selecione o fornecedor" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {fornecedores.map(f => (
                                                          <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                                        ))}
                                                        {fornecedores.length === 0 && <SelectItem value="_none">Nenhum</SelectItem>}
                                                      </SelectContent>
                                                  </Select>
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                              <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data Prometida de Entrega</Label>
                                                  <Input type="text" placeholder="DD/MM/YYYY" maxLength={10} value={order.dueDate} onChange={(e) => updateEditOrder(idx, 'dueDate', formatDate(e.target.value))} className="!rounded-none border-slate-200 h-9 text-xs text-slate-600" />
                                              </div>
                                              <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações de Laboratório</Label>
                                                  <Input value={order.labNotes} onChange={(e) => updateEditOrder(idx, 'labNotes', e.target.value)} placeholder="Ex: Montagem nylon cuidadosa..." className="!rounded-none border-slate-200 h-9 text-xs" />
                                              </div>
                                          </div>
                                          <div className="flex justify-end pt-2">
                                              <Button 
                                                  onClick={(e) => { e.stopPropagation(); setExpandedOrderIndex(null); }} 
                                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase h-8 px-4 !rounded-none"
                                              >
                                                  OK
                                              </Button>
                                          </div>
                                      </div>
                                  )}
                              </Card>
                          ))
                      ) : (
                          atendimento.orders && atendimento.orders.length > 0 ? (
                              atendimento.orders.map((order: any, idx: number) => (
                              <Card key={idx} className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white">
                                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                      <div className="flex items-center gap-4">
                                          <div className="flex flex-col gap-0.5">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">{order.serviceType}</span>
                                                {linkedOrders.find(lo => lo.id === order.id) && (
                                                  <Badge className={`rounded-none border text-[9px] font-bold uppercase tracking-widest px-2 py-0 ${getStatusColor(linkedOrders.find(lo => lo.id === order.id).status)}`}>
                                                    {linkedOrders.find(lo => lo.id === order.id).status}
                                                  </Badge>
                                                )}
                                              </div>
                                              <span className="text-xs text-slate-500">{order.items || "Sem descrição"}</span>
                                          </div>
                                      </div>
                                      <div className="text-right flex items-center justify-end gap-3">
                                          <div className="flex flex-col items-end">
                                              <p className="text-sm font-black text-emerald-600">R$ {calculateItemFinalPrice(order).toFixed(2)}</p>
                                              {calculateItemFinalPrice(order) !== order.price && (
                                                  <p className="text-[9px] text-slate-400 line-through">R$ {order.price?.toFixed(2)}</p>
                                              )}
                                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Entrega: {order.dueDate || 'Imediata'}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="h-8 text-[10px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border-slate-200" 
                                              onClick={(e) => { e.preventDefault(); navigate(`/admin/pedidos/${order.id}`); }}
                                            >
                                                DETALHES
                                            </Button>
                                            {isEditing && (
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                                                onClick={() => handleRemoveOrder(order.id, idx)}
                                              >
                                                  <Trash2 className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>
                                      </div>
                                  </div>
                              </Card>
                              ))
                          ) : (
                              <div className="p-8 text-center bg-white border border-slate-200 !rounded-none">
                                  <p className="text-sm text-slate-400 italic font-medium">Nenhum item ou venda vinculada.</p>
                              </div>
                          )
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
                                <span className="font-semibold">R$ {currentSubtotal.toFixed(2)}</span>
                            </div>
                            
                            {/* EDIÇÃO DE DESCONTO E TAXA GLOBAL (LAYOUT GRADE) */}
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Desconto Global</Label>
                                        <div className="flex gap-1">
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                value={editDiscountValue} 
                                                onChange={(e) => setEditDiscountValue(Number(e.target.value))} 
                                                className="!rounded-none border-slate-200 h-9 text-xs font-bold" 
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-9 w-9 !rounded-none border-slate-200 flex-none" 
                                                onClick={() => setEditDiscountType(editDiscountType === 'percent' ? 'fixed' : 'percent')}
                                            >
                                                <span className="text-[10px] font-bold">{editDiscountType === 'percent' ? '%' : '$'}</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Taxas / Acrésc.</Label>
                                        <div className="flex gap-1">
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                value={editFeeValue} 
                                                onChange={(e) => setEditFeeValue(Number(e.target.value))} 
                                                className="!rounded-none border-slate-200 h-9 text-xs font-bold" 
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-9 w-9 !rounded-none border-slate-200 flex-none" 
                                                onClick={() => setEditFeeType(editFeeType === 'percent' ? 'fixed' : 'percent')}
                                            >
                                                <span className="text-[10px] font-bold">{editFeeType === 'percent' ? '%' : '$'}</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {currentCalculatedDiscount > 0 && (
                                        <div className="flex justify-between items-center text-rose-500 text-[11px]">
                                            <span>Desconto Global</span>
                                            <span className="font-semibold">- R$ {currentCalculatedDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {currentCalculatedFee > 0 && (
                                        <div className="flex justify-between items-center text-emerald-600 text-[11px]">
                                            <span>Taxas / Acréscimos</span>
                                            <span className="font-semibold">+ R$ {currentCalculatedFee.toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <Separator className="bg-slate-50 my-4" />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-bold text-slate-900 uppercase">Total Final</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight">
                                    <span className="text-sm font-bold text-slate-400 mr-1">R$</span>
                                    {currentTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-0 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Forma de Pagamento</Label>
                            {isEditing ? (
                                <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                                    <SelectTrigger className="!rounded-none border-slate-200 h-10 text-xs font-bold uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pix">PIX (À Vista)</SelectItem>
                                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="carne" className="font-bold text-emerald-700">Carnê / Crediário Próprio</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="!rounded-none border border-slate-200 h-10 flex items-center px-3 text-sm font-semibold bg-slate-50/50 uppercase tracking-wide text-slate-700">
                                    {currentPaymentMethod || "NÃO INFORMADO"}
                                </div>
                            )}
                        </div>

                        {/* CONFIGURAÇÃO DO CARNÊ DURANTE A EDIÇÃO */}
                        {isEditing && editPaymentMethod === 'carne' && (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 !rounded-none space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">Configuração do Carnê</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Entrada (R$)</Label>
                                        <Input type="number" step="0.01" value={editEntrada || ''} onChange={(e) => setEditEntrada(Number(e.target.value))} className="!rounded-none border-emerald-200 bg-white h-9 text-xs font-semibold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Parcelas</Label>
                                        <Input type="number" min="1" max="24" value={editInstallmentsCount || ''} onChange={(e) => setEditInstallmentsCount(Number(e.target.value))} className="!rounded-none border-emerald-200 bg-white h-9 text-xs font-semibold text-center" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">1º Vencimento</Label>
                                    <Input type="text" placeholder="DD/MM/YYYY" maxLength={10} value={editFirstDueDate} onChange={(e) => setEditFirstDueDate(formatDate(e.target.value))} className="!rounded-none border-emerald-200 bg-white h-9 text-xs text-slate-700" />
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-emerald-100 text-center">
                                    <p className="text-[11px] text-emerald-600 font-medium">Saldo Devedor: <strong className="text-emerald-800">R$ {(currentTotal - editEntrada).toFixed(2)}</strong></p>
                                    {editInstallmentsCount > 0 && (currentTotal - editEntrada) > 0 && (
                                        <p className="text-lg font-black text-emerald-700 mt-1">
                                            {editInstallmentsCount}x de R$ {((currentTotal - editEntrada) / editInstallmentsCount).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
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
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 h-8 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                        onClick={() => window.open('/cliente/login', '_blank')}
                                    >
                                        Portal do Cliente
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 h-8 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                        onClick={handleDownloadPDF}
                                    >
                                        <Download className="h-3 w-3" /> Baixar Carnê
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
              </Card>

              {/* LINHA DO TEMPO / HISTÓRICO */}
              <Card className="rounded border-slate-200 shadow-sm overflow-hidden bg-slate-50/30">
                <CardHeader className="p-5 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" /> Linha do Tempo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 overflow-y-auto max-h-[400px]">
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-2 before:w-px before:bg-slate-200">
                    {/* Histórico de Alterações */}
                    {atendimento.history && atendimento.history.length > 0 && (
                      atendimento.history.slice().reverse().map((item: any, idx: number) => (
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

                    {/* Registro Inicial (Criação) */}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">Atendimento Criado no Sistema</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {atendimento.date} - {atendimento.time}
                        </span>
                        <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2 uppercase">SISTEMA ADMINISTRATIVO</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        {/* FICHA FORMATADA PARA CONFERÊNCIA (PRÉVIA) */}
        <div id="printable-area" className="hidden print:block bg-white p-[5mm_12mm_10mm_12mm]" style={{fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", width: '210mm', minHeight: '297mm'}}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4mm'
          }}>
            
            {/* CABEÇALHO */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4mm', borderBottom: '2px solid #000000', marginBottom: '4mm'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
                <div>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#000000', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Ficha Clínica & Pedido</p>
                </div>
              </div>
              <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px'}}>
                <p style={{fontSize: '7pt', color: '#334155', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Protocolo</p>
                <p style={{fontSize: '11pt', fontWeight: '900', color: '#000000', margin: 0}}>#{atendimento.tso || atendimento.id.substring(0, 8).toUpperCase()}</p>
                <p style={{fontSize: '7pt', color: '#334155', margin: 0}}>{atendimento.date} • {atendimento.time}</p>
              </div>
            </div>

            {/* DADOS DO PACIENTE */}
            <div style={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4mm', marginBottom: '4mm'}}>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm'}}>Dados do Paciente</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4mm'}}>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Nome Completo</p>
                  <p style={{fontSize: '10pt', fontWeight: '700', color: '#000000', margin: 0}}>{atendimento.clientName}</p>
                </div>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>CPF</p>
                  <p style={{fontSize: '10pt', fontWeight: '700', color: '#000000', margin: 0}}>{atendimento.clientCpf || "—"}</p>
                </div>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Atendente</p>
                  <p style={{fontSize: '10pt', fontWeight: '700', color: '#000000', margin: 0}}>{atendimento.attendant}</p>
                </div>
              </div>
            </div>

            {/* PRESCRIÇÃO E ANOTAÇÕES */}
            <div style={{display: 'grid', gridTemplateColumns: atendimento.rxData ? '1.5fr 1fr' : '1fr', gap: '4mm', marginBottom: '4mm'}}>
              {atendimento.rxData && (
                <div style={{border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden'}}>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', padding: '1mm 2mm', backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', margin: 0}}>Prescrição Óptica (Rx)</p>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'center'}}>
                    <thead style={{backgroundColor: '#f1f5f9', fontSize: '6.5pt', fontWeight: '800', color: '#000000'}}>
                      <tr>
                        <th style={{padding: '1mm', borderRight: '1px solid #cbd5e1'}}></th>
                        <th style={{padding: '1mm', borderRight: '1px solid #cbd5e1'}}></th>
                        <th style={{padding: '1mm', borderRight: '1px solid #cbd5e1'}}>ESF.</th>
                        <th style={{padding: '1mm', borderRight: '1px solid #cbd5e1'}}>CIL.</th>
                        <th style={{padding: '1mm', borderRight: '1px solid #cbd5e1'}}>EIXO</th>
                        <th style={{padding: '1mm'}}>D.P.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{borderBottom: '1px solid #cbd5e1'}}>
                        <td rowSpan={2} style={{padding: '1mm', borderRight: '1px solid #cbd5e1', fontWeight: '800', fontSize: '6pt', backgroundColor: '#f8fafc', color: '#000000'}}>LONGE</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', fontWeight: '800', fontSize: '6pt', color: '#000000'}}>O.D.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_od_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_od_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_od_eixo || "—"}</td>
                        <td style={{padding: '1mm', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_od_dp || "—"}</td>
                      </tr>
                      <tr style={{borderBottom: '1px solid #cbd5e1'}}>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', fontWeight: '800', fontSize: '6pt', color: '#000000'}}>O.E.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_oe_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_oe_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_oe_eixo || "—"}</td>
                        <td style={{padding: '1mm', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.longe_oe_dp || "—"}</td>
                      </tr>
                      <tr style={{borderBottom: '1px solid #cbd5e1'}}>
                        <td rowSpan={2} style={{padding: '1mm', borderRight: '1px solid #cbd5e1', fontWeight: '800', fontSize: '6pt', backgroundColor: '#f8fafc', color: '#000000'}}>PERTO</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', fontWeight: '800', fontSize: '6pt', color: '#000000'}}>O.D.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_od_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_od_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_od_eixo || "—"}</td>
                        <td style={{padding: '1mm', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_od_dp || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', fontWeight: '800', fontSize: '6pt', color: '#000000'}}>O.E.</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_oe_esf || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_oe_cil || "—"}</td>
                        <td style={{padding: '1mm', borderRight: '1px solid #cbd5e1', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_oe_eixo || "—"}</td>
                        <td style={{padding: '1mm', color: '#000000', fontWeight: '700'}}>{atendimento.rxData.perto_oe_dp || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {atendimento.notes && (
                <div style={{border: '1px solid #cbd5e1', borderRadius: '8px', padding: '3mm 4mm', backgroundColor: '#fff', display: 'flex', flexDirection: 'column'}}>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm'}}>Anotações Clínicas</p>
                  <p style={{fontSize: '8.5pt', color: '#000000', margin: 0, whiteSpace: 'pre-wrap', fontWeight: '500'}}>{atendimento.notes}</p>
                </div>
              )}
            </div>

            {/* TABELA DE PEDIDOS */}
            <div style={{marginBottom: '4mm', flex: 1}}>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm'}}>Relação de Pedidos / Vendas</p>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt'}}>
                <thead>
                  <tr style={{backgroundColor: '#000000', color: 'white'}}>
                    <th style={{padding: '2mm 3mm', textAlign: 'left', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px 0 0 4px'}}>Tipo de Serviço</th>
                    <th style={{padding: '2mm 3mm', textAlign: 'left', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Itens / Descrição</th>
                    <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Entrega</th>
                    <th style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '0 4px 4px 0'}}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimento.orders && atendimento.orders.map((o: any, i: number) => (
                    <tr key={i} style={{borderBottom: '1px solid #cbd5e1', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid'}}>
                      <td style={{padding: '2mm 3mm', fontWeight: '800', color: '#000000'}}>{o.serviceType}</td>
                      <td style={{padding: '2mm 3mm', color: '#000000', fontWeight: '500'}}>{o.items || "—"}</td>
                      <td style={{padding: '2mm 3mm', textAlign: 'center', color: '#000000', fontWeight: '600'}}>{(() => {
                        if (!o.dueDate) return "Imediata";
                        if (o.dueDate.includes("/")) {
                            const [d, m, y] = o.dueDate.split("/").map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                        }
                        return new Date(o.dueDate).toLocaleDateString('pt-BR');
                      })()}</td>
                      <td style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '900', color: '#000000'}}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                          <span>R$ {calculateItemFinalPrice(o).toFixed(2)}</span>
                          {calculateItemFinalPrice(o) !== o.price && (
                            <span style={{fontSize: '7pt', color: '#64748b', textDecoration: 'line-through', fontWeight: '500'}}>R$ {o.price.toFixed(2)}</span>
                          )}
                          {o.discount > 0 && (
                            <span style={{fontSize: '6.5pt', color: '#dc2626', fontWeight: '700'}}>- {o.discountType === 'percent' ? `${o.discount}%` : `R$ ${o.discount.toFixed(2)}`}</span>
                          )}
                          {o.fee > 0 && (
                            <span style={{fontSize: '6.5pt', color: '#059669', fontWeight: '700'}}>+ {o.feeType === 'percent' ? `${o.fee}%` : `R$ ${o.fee.toFixed(2)}`}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!atendimento.orders || atendimento.orders.length === 0) && (
                    <tr><td colSpan={4} style={{padding: '2mm', textAlign: 'center', color: '#334155', fontStyle: 'italic', fontWeight: '600'}}>Nenhum pedido registrado nesta sessão.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  {(atendimento.discount > 0 || atendimento.fee > 0) && (
                    <tr style={{backgroundColor: '#f8fafc', color: '#1e293b'}}>
                      <td colSpan={3} style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1'}}>SUBTOTAL BRUTO</td>
                      <td style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '8pt', borderBottom: '1px solid #cbd5e1', color: '#000000'}}>R$ {(atendimento.subtotal || atendimento.totalValue || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {atendimento.discount > 0 && (
                    <tr style={{backgroundColor: '#fef2f2', color: '#991b1b'}}>
                      <td colSpan={3} style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1'}}>DESCONTO</td>
                      <td style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '8pt', borderBottom: '1px solid #cbd5e1'}}>- R$ {atendimento.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  {atendimento.fee > 0 && (
                    <tr style={{backgroundColor: '#ecfdf5', color: '#064e3b'}}>
                      <td colSpan={3} style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '6.5pt', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1'}}>TAXAS / ACRÉSCIMOS</td>
                      <td style={{padding: '1mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '8pt', borderBottom: '1px solid #cbd5e1'}}>+ R$ {atendimento.fee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{backgroundColor: '#000000', color: 'white'}}>
                    <td colSpan={3} style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>VALOR FINAL</td>
                    <td style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '900', fontSize: '11pt'}}>R$ {(atendimento.totalValue || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <p style={{fontSize: '7.5pt', textAlign: 'right', marginTop: '1.5mm', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '1px'}}>
                Pagamento: {atendimento.isCarne ? 'CARNÊ / CREDIÁRIO' : (atendimento.paymentMethod || 'NÃO DEFINIDO').toUpperCase()}
              </p>
            </div>

            {/* ASSINATURAS */}
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '4mm', paddingTop: '4mm', borderTop: '1px solid #cbd5e1', pageBreakInside: 'avoid'}}>
              <div style={{textAlign: 'center', width: '70mm'}}>
                <div style={{borderBottom: '1px solid #000000', marginBottom: '2mm', height: '10mm'}}></div>
                <p style={{fontSize: '6.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#334155', margin: 0}}>Assinatura do Paciente / Cliente</p>
              </div>
              <div style={{textAlign: 'center', width: '70mm'}}>
                <div style={{borderBottom: '1px solid #000000', marginBottom: '2mm', height: '10mm'}}></div>
                <p style={{fontSize: '6.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#334155', margin: 0}}>Ótica Melissa — {atendimento.attendant}</p>
              </div>
            </div>

            {/* CANHOTO */}
            <div style={{marginTop: '6mm', borderTop: '2px dashed #94a3b8', paddingTop: '4mm', position: 'relative', pageBreakInside: 'avoid'}}>
              <div style={{position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 6px'}}>
                <span style={{fontSize: '8pt', color: '#000000'}}>✂</span>
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
                    <p style={{fontSize: '14pt', fontWeight: '900', color: '#0f172a', margin: '0 0 2mm'}}>#{atendimento.tso || (atendimento.id ? atendimento.id.substring(0, 8).toUpperCase() : "—")}</p>
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
            <div style={{marginTop: 'auto', paddingTop: '3mm', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <p style={{fontSize: '6.5pt', color: '#94a3b8', margin: 0}}>Documento gerado pelo sistema Ótica Melissa</p>
              <p style={{fontSize: '6.5pt', color: '#94a3b8', margin: 0}}>Impresso em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
        

        {/* POPUP DE CONFIRMAÇÃO DE REMOÇÃO DE ITEM */}
        <Dialog open={showRemovalConfirm} onOpenChange={setShowRemovalConfirm}>
          <DialogContent className="w-[95vw] sm:max-w-[400px] !rounded-none p-0 border-slate-200">
            <DialogHeader className="bg-slate-900 p-6 text-white !rounded-none">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider">Confirmar Remoção</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <p className="text-sm text-slate-600 font-medium">Tem certeza que deseja remover este item da ficha de atendimento?</p>
            </div>
            <DialogFooter className="p-4 bg-slate-50 flex gap-2 !rounded-none !m-0">
              <Button variant="ghost" onClick={() => setShowRemovalConfirm(false)} className="flex-1 text-[10px] font-bold h-10 !rounded-none">NÃO, VOLTAR</Button>
              <Button onClick={confirmRemoval} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold h-10 !rounded-none">SIM, REMOVER</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* POPUP DE CONFIRMAÇÃO DE CANCELAMENTO DO PEDIDO */}
        <Dialog open={showCancelOrderConfirm} onOpenChange={setShowCancelOrderConfirm}>
          <DialogContent className="w-[95vw] sm:max-w-[400px] !rounded-none p-0 border-slate-200">
            <DialogHeader className="bg-amber-600 p-6 text-white !rounded-none">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider">Cancelar Pedido?</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <p className="text-sm text-slate-600 font-medium">O item foi removido da ficha. Deseja também <strong className="text-rose-600 uppercase">Cancelar</strong> o pedido vinculado no sistema?</p>
            </div>
            <DialogFooter className="p-4 bg-slate-50 flex gap-2 !rounded-none !m-0">
              <Button variant="ghost" onClick={() => { setShowCancelOrderConfirm(false); setOrderToDelete(null); }} className="flex-1 text-[10px] font-bold h-10 !rounded-none">NÃO, APENAS REMOVER</Button>
              <Button onClick={handleCancelOrderAction} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold h-10 !rounded-none">SIM, CANCELAR PEDIDO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
