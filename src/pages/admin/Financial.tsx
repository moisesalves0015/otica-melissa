import * as React from "react";
import { motion } from "motion/react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Filter,
  Download,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  History,
  QrCode,
  Plus,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MOCK_TRANSACTIONS,
    MOCK_INSTALLMENTS
} from "../../data/mockData";

export default function Financial() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Gestão Financeira</h1>
          <p className="text-slate-500">Fluxo de caixa, controle de carnês e saúde financeira da Ótica Melissa.</p>
        </div>

        <div className="flex gap-4">
            <Button variant="outline" className="rounded-full px-6 font-bold h-12 border-slate-200 text-slate-600 flex items-center gap-2">
                <Download className="h-4 w-4" /> EXPORTAR
            </Button>
            <Button className="rounded-full px-6 font-bold h-12 shadow-lg shadow-primary/20 flex items-center gap-2">
                <Plus className="h-5 w-5" /> NOVA TRANSAÇÃO
            </Button>
        </div>
      </div>

      {/* Main Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-none shadow-sm bg-white group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6" />
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 font-black">+14%</Badge>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Recebido (Mês)</p>
                  <h3 className="text-3xl font-black text-emerald-600 mt-1">R$ 82.300,00</h3>
              </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                          <TrendingDown className="h-6 w-6" />
                      </div>
                      <Badge className="bg-red-100 text-red-700 font-black">-2.5%</Badge>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Despesas (Mês)</p>
                  <h3 className="text-3xl font-black text-red-600 mt-1">R$ 41.150,00</h3>
              </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary group overflow-hidden relative">
              <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                          <DollarSign className="h-6 w-6" />
                      </div>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">Saldo Projetado</p>
                  <h3 className="text-3xl font-black text-white mt-1">R$ 56.350,20</h3>
                  <p className="text-[10px] text-white/50 mt-2 font-bold uppercase italic tracking-tighter">Incluindo recebíveis de carnê</p>
              </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="caixa" className="w-full">
          <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 h-14 w-full md:w-auto shadow-sm inline-flex mb-8">
            <TabsTrigger value="caixa" className="rounded-xl px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="carnes" className="rounded-xl px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Carnês & Parcelas</TabsTrigger>
            <TabsTrigger value="relatorios" className="rounded-xl px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="caixa" className="m-0 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Buscar transação..."
                            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 text-slate-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> ESTE MÊS
                        </Button>
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 text-slate-600">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Valor</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Tipo</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_TRANSACTIONS.map((t) => (
                                <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                    <TableCell className="px-8 py-4 font-bold text-slate-500 text-sm">{t.date}</TableCell>
                                    <TableCell className="px-8 py-4">
                                        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{t.description}</span>
                                    </TableCell>
                                    <TableCell className="px-8 py-4">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-slate-200 text-slate-500">
                                            {t.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`px-8 py-4 text-right font-black text-sm ${t.type === 'Entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {t.type === 'Entrada' ? '+' : ''} R$ {Math.abs(t.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="px-8 py-4 text-center">
                                       <div className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center ${t.type === 'Entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {t.type === 'Entrada' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carnes" className="m-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Installment List */}
                <div className="lg:col-span-8 space-y-6">
                    {MOCK_INSTALLMENTS.map((inst) => (
                        <Card key={inst.id} className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow group">
                            <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">{inst.client}</CardTitle>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Venda #{inst.orderId} • ID Carnê: {inst.id}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400">
                                        <QrCode className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-4 gap-8 p-8 border-b border-slate-50 bg-[#F8F9FC]/30">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Total</p>
                                        <p className="text-lg font-black text-slate-900 mt-1">R$ {inst.totalValue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Devedor</p>
                                        <p className="text-lg font-black text-red-600 mt-1">R$ {inst.remainingValue.toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Progresso de Pagamento</p>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary" 
                                                style={{ width: `${((inst.totalValue - inst.remainingValue) / inst.totalValue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {inst.installments.map((parc) => (
                                            <div key={parc.number} className={`p-4 rounded-2xl border ${
                                                parc.status === 'Pago' ? 'bg-emerald-50/50 border-emerald-100' :
                                                parc.status === 'Vencido' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{parc.number}ª Parcela</span>
                                                    <Badge className={`${
                                                        parc.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' :
                                                        parc.status === 'Vencido' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                                                    } text-[9px] font-black uppercase tracking-tighter border-none px-2`}>
                                                        {parc.status}
                                                    </Badge>
                                                </div>
                                                <p className="font-black text-slate-900">R$ {parc.value.toFixed(2)}</p>
                                                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500 uppercase">
                                                    <Calendar className="h-3 w-3" /> Venc: {parc.dueDate}
                                                </div>
                                                {parc.status !== 'Pago' && (
                                                    <Button className="w-full mt-4 h-8 rounded-lg text-[10px] font-bold uppercase bg-slate-900 hover:bg-slate-800">
                                                        Dar Baixa
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Performance & Filters */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Resumo da Carteira</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Adimplência</span>
                                    <span className="text-emerald-600">92%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Inadimplência (30d+)</span>
                                    <span className="text-red-600">8%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-red-500" style={{ width: '8%' }} />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-slate-600">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <p className="text-sm font-bold">12 Parcelas Vencidas</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Totalizando R$ 1.850,00</p>
                                    </div>
                                </div>
                                <Button className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 font-bold">AÇÕES DE COBRANÇA</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-primary/5 border border-primary/10 overflow-hidden">
                        <CardContent className="p-8 space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="font-black text-lg text-slate-900 uppercase tracking-tighter leading-tight">Emitir Carnê <br /> de Pagamento</h3>
                            <p className="text-xs text-slate-500 font-medium">Gere o carnê completo com QR Code para facilitar o pagamento no balcão ou via Pix.</p>
                            <Button className="w-full rounded-xl font-bold">SELECIONAR VENDA</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}

