import * as React from "react";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  Package,
  ArrowUpDown,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Edit,
  Trash2,
  Tag,
  Glasses,
  Eye,
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
import { MOCK_PRODUCTS } from "../../data/mockData";

export default function Products() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Estoque & Produtos</h1>
          <p className="text-slate-500">Controle total de armações, lentes e acessórios em tempo real.</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="rounded-full px-6 font-bold h-12 shadow-lg shadow-primary/20 flex items-center gap-2" />}>
            <Plus className="h-5 w-5" /> NOVO PRODUTO
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-primary p-8 text-white">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Package className="h-6 w-6" /> Cadastrar Produto
              </DialogTitle>
              <p className="text-white/70 text-sm font-medium">Adicione novos itens ao estoque da sua ótica.</p>
            </DialogHeader>
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Produto</Label>
                        <Input placeholder="Ex: Ray-Ban RB3025 Aviator" className="rounded-xl border-slate-200 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</Label>
                        <Select>
                            <SelectTrigger className="rounded-xl border-slate-200 h-11 font-bold text-slate-600">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl font-bold">
                                <SelectItem value="armacoes">Armações</SelectItem>
                                <SelectItem value="lentes">Lentes</SelectItem>
                                <SelectItem value="contato">Lentes de Contato</SelectItem>
                                <SelectItem value="prontos">Óculos Prontos</SelectItem>
                                <SelectItem value="acessorios">Acessórios</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marca / Fabricante</Label>
                        <Input placeholder="Ex: Ray-Ban" className="rounded-xl border-slate-200 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preço de Venda (R$)</Label>
                        <Input type="number" placeholder="0,00" className="rounded-xl border-slate-200 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estoque Inicial</Label>
                        <Input type="number" placeholder="0" className="rounded-xl border-slate-200 h-11" />
                    </div>
                </div>
            </div>
            <DialogFooter className="bg-slate-50 p-8">
                <Button variant="ghost" className="rounded-full px-6 font-bold text-slate-500">CANCELAR</Button>
                <Button className="rounded-full px-10 font-bold shadow-lg shadow-primary/20">SALVAR PRODUTO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Glasses className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Armações</p>
                    <p className="text-xl font-black text-slate-900">428</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pares de Lentes</p>
                    <p className="text-xl font-black text-slate-900">1.250</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Baixo Estoque</p>
                    <p className="text-xl font-black text-slate-900">12</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gasto Médio</p>
                    <p className="text-xl font-black text-slate-900">R$ 380</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Main Inventory Section */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 group">
             <Input
                placeholder="Buscar por nome, marca ou ID..."
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <div className="flex gap-2">
             <Select defaultValue="todas">
                <SelectTrigger className="w-[180px] h-12 rounded-2xl border-slate-200 font-bold text-slate-600">
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl font-bold">
                    <SelectItem value="todas">Todas Categorias</SelectItem>
                    <SelectItem value="armacoes">Armações</SelectItem>
                    <SelectItem value="lentes">Lentes</SelectItem>
                    <SelectItem value="contato">Lentes de Contato</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 text-slate-600">
                <Filter className="h-4 w-4 mr-2" /> MAIS FILTROS
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Produto / ID</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Marca</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Estoque Atual</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Preço Venda</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                  <TableCell className="px-8 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">SKU: {product.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-4">
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-sm font-medium text-slate-600">
                    {product.brand}
                  </TableCell>
                  <TableCell className="px-8 py-4 text-center">
                    <div className="flex flex-col items-center">
                        <span className={`font-black text-sm ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                            {product.stock} un
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Mín: {product.minStock}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-right font-black text-slate-900">
                    R$ {product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-8 py-4 text-center">
                    <Badge className={`${
                        product.status === 'Em Estoque' ? 'bg-emerald-100 text-emerald-700' :
                        product.status === 'Baixo Estoque' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    } text-[9px] font-black uppercase tracking-widest border-none rounded-full`}>
                        {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">A movimentação de Estoque</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                  <div className="space-y-6">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ArrowUpDown className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-sm text-slate-900">Entrada de Mercadoria</h4>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hoje, 09:42</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">24 un. Lente Kodak Single Vision adicionadas ao estoque.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ArrowUpDown className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-sm text-slate-900">Saída por Venda</h4>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hoje, 11:20</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">1 un. Ray-Ban RB3025 (Ref: Venda #1042).</p>
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Relatórios de Inventário</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 gap-4">
                    <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                         <ClipboardList className="h-5 w-5 mr-4 text-slate-400 group-hover:text-primary transition-colors" />
                         <div className="text-left">
                             <p className="text-sm font-bold text-slate-900">Inventário Geral Completo</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Gerar PDF para conferência física</p>
                         </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                         <AlertTriangle className="h-5 w-5 mr-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                         <div className="text-left">
                             <p className="text-sm font-bold text-slate-900">Relatório de Baixo Estoque</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">12 produtos atingiram nível de alerta</p>
                         </div>
                    </Button>
                </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
