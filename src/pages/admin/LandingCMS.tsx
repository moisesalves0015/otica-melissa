import * as React from "react";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
    Plus, Trash2, Edit, Save, X, Image as ImageIcon, 
    Tag, DollarSign, Package, Layout
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface LandingProduct {
    id: string;
    name: string;
    originalPrice: number;
    price: number;
    image: string;
    badge: string;
    freeShipping: boolean;
    order?: number;
}

export default function LandingCMS() {
    const [products, setProducts] = React.useState<LandingProduct[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    // Form state
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        name: "",
        originalPrice: "",
        price: "",
        image: "",
        badge: "",
        freeShipping: true
    });

    React.useEffect(() => {
        const q = query(collection(db, "landing_products"));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            })) as LandingProduct[];
            
            // Sort by order or name
            data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setProducts(data);
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            originalPrice: "",
            price: "",
            image: "",
            badge: "",
            freeShipping: true
        });
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.image) {
            toast.error("Preencha os campos obrigatórios (Nome, Preço e Imagem)");
            return;
        }

        setIsSaving(true);
        const productData = {
            name: formData.name,
            originalPrice: Number(formData.originalPrice) || 0,
            price: Number(formData.price),
            image: formData.image,
            badge: formData.badge,
            freeShipping: formData.freeShipping,
            updatedAt: serverTimestamp()
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "landing_products", editingId), productData);
                toast.success("Produto atualizado!");
            } else {
                await addDoc(collection(db, "landing_products"), {
                    ...productData,
                    order: products.length,
                    createdAt: serverTimestamp()
                });
                toast.success("Produto adicionado à landing page!");
            }
            resetForm();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (p: LandingProduct) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            originalPrice: p.originalPrice.toString(),
            price: p.price.toString(),
            image: p.image,
            badge: p.badge,
            freeShipping: p.freeShipping
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este produto da vitrine?")) return;
        try {
            await deleteDoc(doc(db, "landing_products", id));
            toast.success("Produto removido!");
        } catch (error: any) {
            toast.error("Erro ao deletar: " + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-slate-900">Gestão da Vitrine (Landing Page)</h1>
                <p className="text-xs text-slate-500">Controle os produtos em destaque no carrossel "Mais Procurados".</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Formulário */}
                <Card className="lg:col-span-5 !rounded-none border-slate-200 shadow-none h-fit">
                    <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {editingId ? "Editar Produto" : "Novo Produto na Vitrine"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Nome do Produto *</Label>
                                <Input 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Ray-Ban Aviator Classic"
                                    className="!rounded-none border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Preço Original (R$)</Label>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        value={formData.originalPrice}
                                        onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                                        placeholder="890.00"
                                        className="!rounded-none border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Preço Promocional (R$) *</Label>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                        placeholder="578.50"
                                        className="!rounded-none border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">URL da Imagem *</Label>
                                <Input 
                                    value={formData.image}
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                    placeholder="https://images.unsplash.com/..."
                                    className="!rounded-none border-slate-200"
                                />
                                {formData.image && (
                                    <div className="mt-2 aspect-video w-full rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                                        <img src={formData.image} alt="Preview" className="h-full w-full object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Badge (Etiqueta)</Label>
                                    <Input 
                                        value={formData.badge}
                                        onChange={e => setFormData({...formData, badge: e.target.value})}
                                        placeholder="Ex: 35% OFF"
                                        className="!rounded-none border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Frete Grátis?</Label>
                                    <div className="flex items-center space-x-2 h-10 px-3 border border-slate-200 !rounded-none bg-white">
                                        <Switch 
                                            checked={formData.freeShipping}
                                            onCheckedChange={v => setFormData({...formData, freeShipping: v})}
                                        />
                                        <span className="text-xs font-medium text-slate-600">Sim, habilitar</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 !rounded-none bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider"
                                >
                                    {isSaving ? "SALVANDO..." : (editingId ? "ATUALIZAR" : "ADICIONAR À VITRINE")}
                                </Button>
                                {editingId && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={resetForm}
                                        className="!rounded-none text-xs font-bold uppercase tracking-wider"
                                    >
                                        CANCELAR
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Lista de Produtos */}
                <Card className="lg:col-span-7 !rounded-none border-slate-200 shadow-none">
                    <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Layout className="h-4 w-4" /> Produtos Ativos na Vitrine
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-3">
                            {products.length} {products.length === 1 ? "Produto" : "Produtos"}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {isLoading ? (
                                <div className="p-12 text-center text-slate-400 text-sm">Carregando vitrine...</div>
                            ) : products.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 text-sm">Nenhum produto cadastrado na landing page.</div>
                            ) : (
                                products.map((p) => (
                                    <div key={p.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="h-20 w-32 shrink-0 rounded border border-slate-100 bg-white overflow-hidden flex items-center justify-center">
                                            <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-sm text-slate-900 truncate">{p.name}</h3>
                                                {p.badge && <Badge className="h-4 text-[9px] font-bold px-1.5 uppercase tracking-widest">{p.badge}</Badge>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-primary">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                {p.originalPrice > 0 && (
                                                    <span className="text-[10px] text-slate-400 line-through">R$ {p.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {p.freeShipping && (
                                                    <Badge variant="secondary" className="h-4 text-[8px] font-bold px-1.5 text-emerald-600 bg-emerald-50 border-emerald-100">FRETE GRÁTIS</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-none border-slate-200 text-slate-400 hover:text-slate-900"
                                                onClick={() => handleEdit(p)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-none border-slate-200 text-slate-400 hover:text-red-600"
                                                onClick={() => handleDelete(p.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
