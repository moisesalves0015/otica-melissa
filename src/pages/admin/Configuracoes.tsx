import * as React from "react";
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { Settings, Users, Truck, Plus, Trash2, Building2, Phone, Hash, ExternalLink, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Configuracoes() {
  // ---- Atendentes ----
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [nomeAtendente, setNomeAtendente] = React.useState("");
  const [cargoAtendente, setCargoAtendente] = React.useState("");
  const [savingAtendente, setSavingAtendente] = React.useState(false);

  // ---- Fornecedores ----
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [nomeFornecedor, setNomeFornecedor] = React.useState("");
  const [cnpjFornecedor, setCnpjFornecedor] = React.useState("");
  const [contatoFornecedor, setContatoFornecedor] = React.useState("");
  const [linkFornecedor, setLinkFornecedor] = React.useState("");
  const [savingFornecedor, setSavingFornecedor] = React.useState(false);

  // ---- Categorias ----
  const [categorias, setCategorias] = React.useState<any[]>([]);
  const [nomeCategoria, setNomeCategoria] = React.useState("");
  const [descCategoria, setDescCategoria] = React.useState("");
  const [savingCategoria, setSavingCategoria] = React.useState(false);

  // ---- Sistema ----
  const [migrating, setMigrating] = React.useState(false);

  const handleMigrateOrders = async () => {
    if (!confirm("Isso irá atualizar o banco de dados para suportar o rastreio de pedidos antigos. Continuar?")) return;
    setMigrating(true);
    try {
      const atendimentosSnap = await getDocs(collection(db, "atendimentos"));
      let migratedCount = 0;
      
      for (const atendDoc of atendimentosSnap.docs) {
        const atendData = atendDoc.data();
        if (atendData.orders && Array.isArray(atendData.orders)) {
          for (const order of atendData.orders) {
            if (!order.id) continue;
            await setDoc(doc(db, "orders", order.id), {
              atendimentoId: atendDoc.id,
              clientId: atendData.clientId,
              clientName: atendData.clientName || "Cliente Avulso",
              seller: atendData.attendant || "Administrador",
              serviceType: order.serviceType || "Óculos",
              dueDate: order.dueDate || null,
              items: order.items || order.serviceType,
              total: order.price || 0,
              status: atendData.status || "Pendente",
              createdAt: atendData.createdAt || new Date().toISOString(),
              date: atendData.date || new Date().toLocaleDateString('pt-BR'),
              isLegacy: true
            }, { merge: true });
            migratedCount++;
          }
        }
      }
      toast.success(`${migratedCount} pedidos migrados com sucesso!`);
    } catch (err: any) {
      toast.error("Erro na migração: " + err.message);
    } finally {
      setMigrating(false);
    }
  };

  React.useEffect(() => {
    const unsubAtend = onSnapshot(query(collection(db, "atendentes")), (snap) => {
      setAtendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubForn = onSnapshot(query(collection(db, "fornecedores")), (snap) => {
      setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCat = onSnapshot(query(collection(db, "categorias")), (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubAtend(); unsubForn(); unsubCat(); };
  }, []);

  const handleSaveAtendente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAtendente.trim()) { toast.error("Informe o nome do atendente."); return; }
    setSavingAtendente(true);
    try {
      await addDoc(collection(db, "atendentes"), {
        name: nomeAtendente.trim(),
        role: cargoAtendente.trim(),
        createdAt: new Date().toISOString(),
      });
      toast.success("Atendente cadastrado!");
      setNomeAtendente(""); setCargoAtendente("");
    } catch (err: any) { toast.error("Erro: " + err.message); }
    finally { setSavingAtendente(false); }
  };

  const handleDeleteAtendente = async (id: string) => {
    await deleteDoc(doc(db, "atendentes", id));
    toast.success("Atendente removido.");
  };

  const handleSaveFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFornecedor.trim()) { toast.error("Informe o nome do fornecedor."); return; }
    setSavingFornecedor(true);
    try {
      await addDoc(collection(db, "fornecedores"), {
        name: nomeFornecedor.trim(),
        cnpj: cnpjFornecedor.trim(),
        contact: contatoFornecedor.trim(),
        link: linkFornecedor.trim(),
        createdAt: new Date().toISOString(),
      });
      toast.success("Fornecedor cadastrado!");
      setNomeFornecedor(""); setCnpjFornecedor(""); setContatoFornecedor(""); setLinkFornecedor("");
    } catch (err: any) { toast.error("Erro: " + err.message); }
    finally { setSavingFornecedor(false); }
  };

  const handleDeleteFornecedor = async (id: string) => {
    await deleteDoc(doc(db, "fornecedores", id));
    toast.success("Fornecedor removido.");
  };

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCategoria.trim()) { toast.error("Informe o nome da categoria."); return; }
    setSavingCategoria(true);
    try {
      await addDoc(collection(db, "categorias"), {
        name: nomeCategoria.trim(),
        description: descCategoria.trim(),
        createdAt: new Date().toISOString(),
      });
      toast.success("Categoria cadastrada!");
      setNomeCategoria(""); setDescCategoria("");
    } catch (err: any) { toast.error("Erro: " + err.message); }
    finally { setSavingCategoria(false); }
  };

  const handleDeleteCategoria = async (id: string) => {
    await deleteDoc(doc(db, "categorias", id));
    toast.success("Categoria removida.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-500" /> Configurações do Sistema
        </h1>
        <p className="text-xs text-slate-500">Gerencie atendentes, fornecedores e preferências da loja.</p>
      </div>

      <Tabs defaultValue="atendentes" className="w-fit">
        <TabsList className="bg-transparent p-0 border-b border-slate-200 h-10 w-full justify-start !rounded-none-none gap-2 mb-6">
          <TabsTrigger value="atendentes" className="flex-none !rounded-none-none border-b-2 border-transparent w-[160px] justify-center h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
            <Users className="h-4 w-4" /> ATENDENTES
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex-none !rounded-none-none border-b-2 border-transparent w-[160px] justify-center h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
            <Truck className="h-4 w-4" /> FORNECEDORES
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex-none !rounded-none-none border-b-2 border-transparent w-[160px] justify-center h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
            <Tag className="h-4 w-4" /> CATEGORIAS
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex-none !rounded-none-none border-b-2 border-transparent w-[160px] justify-center h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
            <Settings className="h-4 w-4" /> SISTEMA
          </TabsTrigger>
        </TabsList>

        {/* ===== ABA ATENDENTES ===== */}
        <TabsContent value="atendentes" className="m-0 space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Formulário */}
            <Card className="lg:col-span-2 border-slate-200 shadow-none !rounded-none !p-0 !gap-0">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-slate-500" /> Novo Atendente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSaveAtendente} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome Completo *</Label>
                    <Input
                      value={nomeAtendente}
                      onChange={e => setNomeAtendente(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="!rounded-none border-slate-200 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cargo / Função</Label>
                    <Input
                      value={cargoAtendente}
                      onChange={e => setCargoAtendente(e.target.value)}
                      placeholder="Ex: Vendedor, Optometrista..."
                      className="!rounded-none border-slate-200 h-9 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingAtendente}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white !rounded-none font-bold uppercase text-xs tracking-wider h-9"
                  >
                    {savingAtendente ? "SALVANDO..." : "CADASTRAR ATENDENTE"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista */}
            <Card className="lg:col-span-3 border-slate-200 shadow-none !rounded-none !p-0 !gap-0">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" /> Atendentes Cadastrados
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-bold">{atendentes.length} cadastrado(s)</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {atendentes.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">Nenhum atendente cadastrado ainda.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {atendentes.map(a => (
                      <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 !!rounded-none-none bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{a.name}</p>
                            {a.role && <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{a.role}</p>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAtendente(a.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 !rounded-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== ABA FORNECEDORES ===== */}
        <TabsContent value="fornecedores" className="m-0 space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Formulário */}
            <Card className="lg:col-span-2 border-slate-200 shadow-none !rounded-none !p-0 !gap-0">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-slate-500" /> Novo Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSaveFornecedor} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome / Razão Social *</Label>
                    <Input
                      value={nomeFornecedor}
                      onChange={e => setNomeFornecedor(e.target.value)}
                      placeholder="Ex: Óticas Brasil Ltda"
                      className="!rounded-none border-slate-200 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Hash className="h-3 w-3" /> CNPJ
                    </Label>
                    <Input
                      value={cnpjFornecedor}
                      onChange={e => setCnpjFornecedor(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="!rounded-none border-slate-200 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Contato / Telefone
                    </Label>
                    <Input
                      value={contatoFornecedor}
                      onChange={e => setContatoFornecedor(e.target.value)}
                      placeholder="(21) 99999-0000"
                      className="!rounded-none border-slate-200 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Link do Portal / Site
                    </Label>
                    <Input
                      value={linkFornecedor}
                      onChange={e => setLinkFornecedor(e.target.value)}
                      placeholder="https://portal.fornecedor.com"
                      className="!rounded-none border-slate-200 h-9 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingFornecedor}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white !rounded-none font-bold uppercase text-xs tracking-wider h-9"
                  >
                    {savingFornecedor ? "SALVANDO..." : "CADASTRAR FORNECEDOR"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista */}
            <Card className="lg:col-span-3 border-slate-200 shadow-none !rounded-none !p-0 !gap-0">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" /> Fornecedores Cadastrados
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-bold">{fornecedores.length} cadastrado(s)</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {fornecedores.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">Nenhum fornecedor cadastrado ainda.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {fornecedores.map(f => (
                      <div key={f.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 !rounded-none bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Truck className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{f.name}</p>
                            <div className="flex gap-3 mt-0.5">
                              {f.cnpj && <p className="text-[10px] text-slate-400 font-medium">CNPJ: {f.cnpj}</p>}
                              {f.contact && <p className="text-[10px] text-slate-400 font-medium">{f.contact}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {f.link && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(f.link, '_blank')}
                              className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50 !rounded-none"
                              title="Abrir portal do fornecedor"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFornecedor(f.id)}
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 !rounded-none"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== ABA CATEGORIAS ===== */}
        <TabsContent value="categorias" className="m-0 space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <Card className="lg:col-span-2 border-slate-200 shadow-none !rounded-none !p-0 !gap-0">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-slate-500" /> Nova Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSaveCategoria} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome da Categoria *</Label>
                    <Input value={nomeCategoria} onChange={e => setNomeCategoria(e.target.value)} placeholder="Ex: Óculos Completo" className="!rounded-none border-slate-200 h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição (opcional)</Label>
                    <Input value={descCategoria} onChange={e => setDescCategoria(e.target.value)} placeholder="Breve descrição..." className="!rounded-none border-slate-200 h-9 text-sm" />
                  </div>
                  <Button type="submit" disabled={savingCategoria} className="w-full bg-slate-900 hover:bg-slate-800 text-white !rounded-none font-bold uppercase text-xs tracking-wider h-9">
                    {savingCategoria ? "SALVANDO..." : "CADASTRAR CATEGORIA"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-slate-200 shadow-none !rounded-none !p-0 !gap-0">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-500" /> Categorias Cadastradas
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-bold">{categorias.length} cadastrada(s)</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {categorias.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">Nenhuma categoria cadastrada ainda.<br/><span className="text-xs text-slate-300">Adicione categorias para usá-las nos atendimentos e pedidos.</span></div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {categorias.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 !rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <Tag className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{cat.name}</p>
                            {cat.description && <p className="text-[11px] text-slate-400">{cat.description}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoria(cat.id)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 !rounded-none">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sistema" className="m-0 space-y-6">
          <Card className="!rounded-none border-slate-200 shadow-none !p-0 !gap-0">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Manutenção do Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900">Migração de Pedidos Legados</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Utilize esta ferramenta para converter pedidos antigos (feitos antes da atualização de hoje) para o novo formato de rastreio individual. Isso garantirá que o QR Code de canhotos antigos funcione corretamente na Central do Cliente.
                </p>
              </div>
              <Button 
                onClick={handleMigrateOrders} 
                disabled={migrating}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest h-10 px-6 !rounded-none"
              >
                {migrating ? "MIGRANDO DADOS..." : "EXECUTAR MIGRAÇÃO AGORA"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
