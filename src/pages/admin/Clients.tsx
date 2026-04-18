import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  MapPin,
  Calendar,
  Stethoscope,
  ChevronRight,
  Upload,
  Users,
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
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, setDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Clients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "clients")); // Temporarily remove orderBy if index is not created
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid needing composite indexes right now
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setClients(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
      
      await setDoc(doc(db, "clients", uniqueId), {
        name: data.name || "",
        cpf: data.cpf || "",
        birthDate: data.birth || "",
        phone: data.phone || "",
        email: data.email || "",
        createdAt: new Date().toISOString(),
        creditStatus: "Em Análise",
        lastVisit: new Date().toLocaleDateString('pt-BR'),
        balance: 0,
      });
      
      toast.success("Cliente cadastrado com sucesso!");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Gestão de Clientes</h1>
          <p className="text-xs text-slate-500">Registro completo e histórico de atendimentos.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2" />}>
            <Plus className="h-4 w-4" /> NOVO CLIENTE
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[700px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden gap-0">
            <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800 gap-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-3 text-white">
                <Users className="h-5 w-5" /> Cadastro de Novo Cliente
              </DialogTitle>
              <p className="text-slate-400 text-xs font-medium">Preencha todos os dados cadastrais do cliente.</p>
            </DialogHeader>

            <form onSubmit={handleSave} className="flex flex-col max-h-[70vh] overflow-hidden">
              <div className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-8">

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dados Pessoais</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-name" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome Completo</Label>
                      <Input id="c-name" name="name" placeholder="Ex: João da Silva Santos" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-cpf" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">CPF</Label>
                      <Input id="c-cpf" name="cpf" placeholder="000.000.000-00" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-birth" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data de Nascimento</Label>
                      <Input id="c-birth" name="birth" type="date" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-phone" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Celular (WhatsApp)</Label>
                      <Input id="c-phone" name="phone" placeholder="(11) 90000-0000" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email de Contato</Label>
                      <Input id="c-email" name="email" type="email" placeholder="cliente@email.com" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-profession" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Profissão / Ocupação</Label>
                      <Input id="c-profession" placeholder="Ex: Engenheiro" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Endereço</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-cep" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">CEP</Label>
                      <Input id="c-cep" placeholder="00000-000" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-address" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Logradouro / Rua</Label>
                      <Input id="c-address" placeholder="Av. Principal..." className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-number" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Número</Label>
                      <Input id="c-number" placeholder="123" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-bairro" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bairro</Label>
                      <Input id="c-bairro" placeholder="Centro" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-city" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cidade / UF</Label>
                      <Input id="c-city" placeholder="São Paulo - SP" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dados Clínicos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-consultation" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Última Consulta Oftalmológica</Label>
                      <Input id="c-consultation" type="date" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-doctor" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Médico de ConfianÃ§a</Label>
                      <Input id="c-doctor" placeholder="Dr. Nome do Médico" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-allergies" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Alergias / Restrições Conhecidas</Label>
                      <Input id="c-allergies" placeholder="Ex: Alergia a Níquel" className="rounded border-slate-200 h-9 text-sm" />
                    </div>

                    <div className="space-y-3 md:col-span-2 mt-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Receita Óptica (Grau)</Label>
                      <div className="rounded border border-slate-200 overflow-hidden bg-white">
                        <table className="w-full text-xs text-center border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500">
                            <tr>
                              <th className="p-2 border-r border-slate-200 w-16"></th>
                              <th className="p-2 border-r border-slate-200 w-12"></th>
                              <th className="p-2 border-r border-slate-200">ESFÉRICO</th>
                              <th className="p-2 border-r border-slate-200">CILÍNDRICO</th>
                              <th className="p-2 border-r border-slate-200">EIXO</th>
                              <th className="p-2 w-16">D.P.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Longe OD */}
                            <tr className="border-b border-slate-200">
                              <td rowSpan={2} className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">PARA<br/>LONGE</td>
                              <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.D.</td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="+0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="-0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="0°" /></td>
                              <td className="p-1"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" /></td>
                            </tr>
                            {/* Longe OE */}
                            <tr className="border-b border-slate-200">
                              <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.E.</td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="+0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="-0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="0°" /></td>
                              <td className="p-1"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="m.m." /></td>
                            </tr>
                            {/* Perto OD */}
                            <tr className="border-b border-slate-200">
                              <td rowSpan={2} className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">PARA<br/>PERTO</td>
                              <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.D.</td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="+0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="-0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="0°" /></td>
                              <td className="p-1"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" /></td>
                            </tr>
                            {/* Perto OE */}
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.E.</td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="+0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="-0.00" /></td>
                              <td className="p-1 border-r border-slate-200"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="0°" /></td>
                              <td className="p-1"><Input className="h-7 text-xs text-center border-0 focus-visible:ring-1 rounded-sm shadow-none" placeholder="m.m." /></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Anexos (Foto / Receita Médica)</Label>
                      <div className="border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                        <Upload className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Clique para fazer Upload</span>
                        <span className="text-[10px] text-slate-300">PNG, JPG ou PDF até 10MB</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 p-6 -mx-0 -mb-0 rounded-none">
              <Button type="button" variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
              <Button type="submit" disabled={isSaving} className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9">
                {isSaving ? "SALVANDO..." : "SALVAR CLIENTE"}
              </Button>
            </DialogFooter>
          </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Table */}
      <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-slate-100">
           <div className="relative flex-1 group">
            <Input
              type="search"
              placeholder="Buscar por nome ou CPF..."
              className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded h-9 px-4 font-semibold text-xs border-slate-200 text-slate-600 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" /> FILTROS
            </Button>
             <Select defaultValue="todos">
              <SelectTrigger className="w-[160px] rounded h-9 border-slate-200 font-medium text-xs text-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded border-slate-200 shadow-xl text-xs">
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
                <SelectItem value="inadimplente">Inadimplentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contato / CPF</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status Crédito</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Última Visita</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Saldo Devedor</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                  <TableCell className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {(client.name || "?").split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{client.name || "Sem Nome"}</span>
                        <span className="text-[10px] font-bold text-primary">FICHA: #{client.id.length > 8 ? client.id.slice(0,6).toUpperCase() : client.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-600 truncate max-w-[150px]">{client.phone || "Sem Telefone"}</span>
                      <span className="text-[10px] font-medium text-slate-400">CPF: {client.cpf || "Sem CPF"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <Badge className={`rounded ${
                      client.creditStatus === 'Excelente' ? 'bg-emerald-100 text-emerald-700' :
                      client.creditStatus === 'Bom' ? 'bg-blue-100 text-blue-700' :
                      client.creditStatus === 'Atenção' ? 'bg-amber-100 text-amber-700' :
                      (client.creditStatus === 'Em Análise' || !client.creditStatus) ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    } text-[10px] font-semibold uppercase tracking-wider border-none px-2 py-0.5 shadow-none inline-flex items-center`}>
                      {client.creditStatus || 'Em Análise'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                     <span className="text-slate-500">{client.lastVisit || "Primeiro Acesso"}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <span className={`font-bold ${(client.balance || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {!(client.balance) ? '-' : `R$ ${client.balance.toFixed(2)}`}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <Button onClick={() => navigate(`/admin/clientes/${client.id}`)} variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-900" title="Ver Prontuário">
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500 font-medium">
                    Nenhum cliente cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ label: 'Aniversariantes', sub: '8 este mês', icon: Calendar, color: 'bg-amber-50 text-amber-600' },
            { label: 'Inadimplentes', sub: '12 pendências', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
            { label: 'Localização', sub: 'Mapa de densidade', icon: MapPin, color: 'bg-slate-50 text-slate-600' }
          ].map((item, i) => (
            <Card key={i} className="rounded border-slate-200 shadow-none hover:bg-slate-50/50 transition-colors cursor-pointer bg-white group border-dashed">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded border border-slate-100 flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-900">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.sub}</p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

