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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Gestão Financeira</h1>
          <p className="text-xs text-slate-500">Fluxo de caixa, controle de carnês e saúde financeira.</p>
        </div>

        <div className="flex gap-2">
            <Button variant="outline" className="rounded border-slate-200 text-slate-600 font-semibold text-xs h-9 px-4 flex items-center gap-2">
                <Download className="h-4 w-4" /> EXPORTAR
            </Button>
            <Dialog>
                <DialogTrigger render={<Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2" />}>
                    <Plus className="h-4 w-4" /> NOVA TRANSAÇÃO
                </DialogTrigger>
                <DialogContent className="max-w-md rounded border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                        <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                            <DollarSign className="h-5 w-5" /> Registrar Transação
                        </DialogTitle>
                        <p className="text-slate-400 text-xs font-medium">Lance novas receitas ou despesas no fluxo de caixa.</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição / Título</Label>
                            <Input placeholder="Ex: Aluguel da Loja - Abril" className="rounded border-slate-200 h-9 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor (R$)</Label>
                                <Input type="number" placeholder="0,00" className="rounded border-slate-200 h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data do Lançamento</Label>
                                <Input type="date" className="rounded border-slate-200 h-9 text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</Label>
                                <Select>
                                    <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600 bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                                        <SelectItem value="venda">Venda de Produto</SelectItem>
                                        <SelectItem value="servico">Serviço / Mão de Obra</SelectItem>
                                        <SelectItem value="custo-fixo">Custo Fixo (Aluguel/Luz)</SelectItem>
                                        <SelectItem value="estoque">Compra de Estoque</SelectItem>
                                        <SelectItem value="marketing">Marketing / Ads</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Fluxo</Label>
                                <Select>
                                    <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600 bg-white">
                                        <SelectValue placeholder="Tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                                        <SelectItem value="entrada" className="text-emerald-600 font-bold">ENTRADA (+)</SelectItem>
                                        <SelectItem value="saida" className="text-red-600 font-bold">SAÍDA (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Button variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9">CANCELAR</Button>
                        <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9">EFETUAR LANÇAMENTO</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Main Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded border-slate-200 shadow-none bg-white">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded bg-slate-50 text-emerald-600 flex items-center justify-center border border-slate-100">
                          <TrendingUp className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-100 bg-emerald-50 text-[10px] font-bold">+14%</Badge>
                  </div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Recebido (Mensal)</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 82.300,00</h3>
              </CardContent>
          </Card>

          <Card className="rounded border-slate-200 shadow-none bg-white">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded bg-slate-50 text-red-600 flex items-center justify-center border border-slate-100">
                          <TrendingDown className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50 text-[10px] font-bold">-2.5%</Badge>
                  </div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Despesas (Mensal)</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 41.150,00</h3>
              </CardContent>
          </Card>

          <Card className="rounded border-none bg-slate-900 shadow-none text-white">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded bg-white/10 text-white flex items-center justify-center">
                          <DollarSign className="h-5 w-5" />
                      </div>
                  </div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Saldo Projetado</p>
                  <h3 className="text-2xl font-bold text-white mt-1">R$ 56.350,20</h3>
                  <p className="text-[10px] text-white/40 mt-2 font-medium">Incluindo recebíveis futuros</p>
              </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="caixa" className="w-full">
          <TabsList className="bg-transparent p-0 border-b border-slate-200 h-10 w-full justify-start rounded-none gap-8 mb-6">
            <TabsTrigger value="caixa" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="carnes" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Carnês & Parcelas</TabsTrigger>
            <TabsTrigger value="relatorios" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="caixa" className="m-0 space-y-4">
            <Card className="rounded border-slate-200 shadow-none overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Buscar transação..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded h-9 px-4 font-semibold text-xs border-slate-200 text-slate-700 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" /> ESTE MÊS
                        </Button>
                        <Button variant="outline" className="rounded h-9 w-9 p-0 font-semibold border-slate-200 text-slate-700">
                            <Filter className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Valor</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Tipo</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_TRANSACTIONS.map((t) => (
                                <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                                    <TableCell className="px-6 py-3 font-medium text-slate-500">{t.date}</TableCell>
                                    <TableCell className="px-6 py-3">
                                        <span className="font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">{t.description}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-3">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500 whitespace-nowrap">
                                            {t.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`px-6 py-3 text-right font-bold ${t.type === 'Entrada' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {t.type === 'Entrada' ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-center">
                                       <div className={`h-6 w-6 rounded mx-auto flex items-center justify-center ${t.type === 'Entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {t.type === 'Entrada' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carnes" className="m-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Installment List */}
                <div className="lg:col-span-8 space-y-4">
                    {MOCK_INSTALLMENTS.map((inst) => (
                        <Card key={inst.id} className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
                            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-semibold text-slate-900">{inst.client}</CardTitle>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Carnê #{inst.id} • Venda #{inst.orderId}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-slate-400 hover:text-slate-900">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-slate-400">
                                        <QrCode className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-4 gap-6 p-6 border-b border-slate-50 bg-slate-50/30">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Valor Total</p>
                                        <p className="text-base font-bold text-slate-900">R$ {inst.totalValue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Saldo Devedor</p>
                                        <p className="text-base font-bold text-red-600">R$ {inst.remainingValue.toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Progresso</p>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-slate-900" 
                                                style={{ width: `${((inst.totalValue - inst.remainingValue) / inst.totalValue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {inst.installments.map((parc) => (
                                            <div key={parc.number} className={`p-3 rounded border ${
                                                parc.status === 'Pago' ? 'bg-emerald-50/30 border-emerald-100' :
                                                parc.status === 'Vencido' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-semibold text-slate-500 uppercase">{parc.number}ª Parcela</span>
                                                    <Badge className={`${
                                                        parc.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                                                        parc.status === 'Vencido' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                                                    } text-[9px] font-bold shadow-none border-none px-1.5 py-0`}>
                                                        {parc.status}
                                                    </Badge>
                                                </div>
                                                <p className="font-bold text-slate-900 text-[13px]">R$ {parc.value.toFixed(2)}</p>
                                                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-slate-400 uppercase">
                                                    <Calendar className="h-3 w-3" /> {parc.dueDate}
                                                </div>
                                                {parc.status !== 'Pago' && (
                                                    <Button className="w-full mt-3 h-7 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold">
                                                        Receber
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
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded border-slate-200 shadow-none bg-white">
                        <CardHeader className="px-6 py-4 border-b border-slate-100">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saúde da Carteira</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                                    <span>Adimplência</span>
                                    <span className="text-emerald-600">92%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                                    <span>Inadimplência</span>
                                    <span className="text-red-600">8%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-red-500" style={{ width: '8%' }} />
                                </div>
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">12 Parcelas Vencidas</p>
                                        <p className="text-[10px] text-slate-400">Total: R$ 1.850,00</p>
                                    </div>
                                </div>
                                <Button className="w-full rounded bg-amber-500 hover:bg-amber-600 font-bold text-xs h-9">COBRAR DEVEDORES</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded border-slate-200 shadow-none bg-white border-dashed">
                        <CardContent className="p-8 space-y-4 text-center">
                            <div className="h-10 w-10 rounded bg-slate-900 text-white flex items-center justify-center mx-auto">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Emissão de Carnê</h3>
                                <p className="text-[11px] text-slate-500 mt-1">Gere o documento completo com boletos ou QR Code Pix.</p>
                            </div>
                            <Button variant="outline" className="w-full rounded font-semibold text-xs h-9 border-slate-200">SELECIONAR VENDA</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}

