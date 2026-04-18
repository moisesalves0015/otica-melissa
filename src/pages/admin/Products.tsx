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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";

export default function Products() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const stock = Number(data.stock) || 0;
      const minStock = Number(data.minStock) || 0;
      let status = "Em Estoque";
      if (stock === 0) status = "Em Falta";
      else if (stock <= minStock) status = "Baixo Estoque";

      await addDoc(collection(db, "products"), {
        name: data.name || "",
        category: data.category || "Não definida",
        brand: data.brand || "",
        supplier: data.supplier || "",
        sku: data.sku || "",
        costPrice: Number(data.costPrice) || 0,
        price: Number(data.price) || 0,
        stock: stock,
        minStock: minStock,
        material: data.material || "",
        color: data.color || "",
        size: data.size || "",
        notes: data.notes || "",
        status: status,
        createdAt: new Date().toISOString(),
      });
      
      toast.success("Produto cadastrado com sucesso!");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Estoque & Produtos</h1>
          <p className="text-xs text-slate-500">Gestão de inventário e controle de reposição.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> NOVO PRODUTO
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] sm:max-w-none max-w-[900px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden gap-0">
            <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800 gap-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-3 text-white">
                <Package className="h-5 w-5" /> Cadastrar Novo Produto
              </DialogTitle>
              <p className="text-slate-400 text-xs font-medium">Insira as especificações técnicas e de estoque do item.</p>
            </DialogHeader>

            <form onSubmit={handleSave} className="flex flex-col max-h-[70vh] overflow-hidden">
              <div className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-8">

                {/* Seção 1: Identificação */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <ClipboardList className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identificação do Produto</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome do Produto / Descrição Curta</Label>
                      <Input name="name" placeholder="Ex: Ray-Ban RB3025 Aviator Gradient" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</Label>
                      <Select name="category">
                        <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                          <SelectItem value="Armações">Armações</SelectItem>
                          <SelectItem value="Lentes">Lentes</SelectItem>
                          <SelectItem value="Lentes de Contato">Lentes de Contato</SelectItem>
                          <SelectItem value="Óculos Prontos">Óculos Prontos</SelectItem>
                          <SelectItem value="Acessórios">Acessórios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Marca / Fabricante</Label>
                      <Input name="brand" placeholder="Ex: Ray-Ban" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor Principal</Label>
                      <Input name="supplier" placeholder="Nome do fornecedor" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">SKU / Código Interno</Label>
                      <Input name="sku" placeholder="Ex: RB3025-001" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Preços e Estoque */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Preços & Estoque</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preço de Custo (R$)</Label>
                      <Input name="costPrice" type="number" step="0.01" placeholder="0,00" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preço de Venda (R$)</Label>
                      <Input name="price" type="number" step="0.01" placeholder="0,00" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Estoque Atual</Label>
                      <Input name="stock" type="number" placeholder="0" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Estoque Mínimo</Label>
                      <Input name="minStock" type="number" placeholder="0" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Seção 3: Ficha Técnica */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <Glasses className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ficha Técnica</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Material</Label>
                      <Input name="material" placeholder="Ex: Acetato" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cor</Label>
                      <Input name="color" placeholder="Ex: Preto Fosco" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tamanho / Aro</Label>
                      <Input name="size" placeholder="Ex: 54" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações Adicionais</Label>
                      <textarea name="notes" className="w-full rounded border border-slate-200 text-sm p-3 min-h-[80px] focus:outline-none focus:border-slate-400 font-medium resize-none" placeholder="Informações extras sobre o produto..."></textarea>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 p-6 -mx-0 -mb-0 rounded-none">
              <Button type="button" variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
              <Button type="submit" disabled={isSaving} className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9">
                {isSaving ? "SALVANDO..." : "SALVAR PRODUTO"}
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[{ icon: Glasses, label: 'Total Armações', value: '428', color: 'text-slate-900' },
            { icon: Eye, label: 'Pares de Lentes', value: '1.250', color: 'text-slate-900' },
            { icon: AlertTriangle, label: 'Baixo Estoque', value: '12', color: 'text-red-600' },
            { icon: Tag, label: 'Gasto Médio', value: 'R$ 380', color: 'text-slate-900' }
          ].map((card, i) => (
            <Card key={i} className="rounded border-slate-200 shadow-none bg-white">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                      <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                    </div>
                </CardContent>
            </Card>
          ))}
      </div>

      {/* Main Inventory Section */}
      <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 group">
             <Input
                placeholder="Buscar por nome, marca ou ID..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <div className="flex gap-2">
             <Select defaultValue="todas">
                <SelectTrigger className="w-[160px] h-9 rounded border-slate-200 font-medium text-xs text-slate-600">
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="rounded border-slate-200 shadow-xl text-xs">
                    <SelectItem value="todas">Todas Categorias</SelectItem>
                    <SelectItem value="armacoes">Armações</SelectItem>
                    <SelectItem value="lentes">Lentes</SelectItem>
                    <SelectItem value="contato">Lentes de Contato</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="rounded h-9 px-4 font-semibold text-xs border-slate-200 text-slate-600">
                <Filter className="h-3.5 w-3.5 mr-2" /> FILTROS
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Produto / SKU</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Marca</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Estoque Atual</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Preço Venda</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Status</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{product.name}</span>
                        <span className="text-[11px] text-slate-400 uppercase">#{product.sku || product.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
                        {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-slate-600">
                    {product.brand}
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex flex-col items-center">
                        <span className={`font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                            {product.stock} un
                        </span>
                        <span className="text-[10px] text-slate-400">Mín: {product.minStock}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right font-semibold text-slate-900">
                    R$ {(Number(product.price) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <Badge className={`rounded ${
                        product.status === 'Em Estoque' ? 'bg-emerald-100 text-emerald-700' :
                        product.status === 'Baixo Estoque' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    } text-[10px] font-semibold uppercase tracking-wider shadow-none border-none px-2 py-0.5 inline-flex items-center gap-1`}>
                        {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100">
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400">
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500 font-medium">
                    Nenhum produto cadastrado no estoque ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
              <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Últimas Movimentações</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100">
                                <ArrowUpDown className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[13px] text-slate-900 truncate">Entrada de Mercadoria</h4>
                                <p className="text-[12px] text-slate-500 line-clamp-1">24 un. Lente Kodak Single Vision adicionadas.</p>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">09:42</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100">
                                <ArrowUpDown className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[13px] text-slate-900 truncate">Saída por Venda</h4>
                                <p className="text-[12px] text-slate-500 line-clamp-1">1 un. Ray-Ban RB3025 (Ref: Venda #1042).</p>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">11:20</span>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
              <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ferramentas de Inventário</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="w-full justify-start h-10 rounded border-slate-200 hover:bg-slate-50 transition-all group px-4">
                         <ClipboardList className="h-4 w-4 mr-3 text-slate-400 group-hover:text-slate-900" />
                         <span className="text-xs font-semibold text-slate-700">Emitir Relatório de Conferência</span>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-10 rounded border-slate-200 hover:bg-slate-50 transition-all group px-4">
                         <AlertTriangle className="h-4 w-4 mr-3 text-slate-400 group-hover:text-red-600" />
                         <span className="text-xs font-semibold text-slate-700">Produtos em Alerta Crítico (12)</span>
                    </Button>
                </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
