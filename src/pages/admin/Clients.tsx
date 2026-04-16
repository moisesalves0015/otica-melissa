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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_CLIENTS } from "../../data/mockData";

export default function Clients() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredClients = MOCK_CLIENTS.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">GestÃ£o de Clientes</h1>
          <p className="text-xs text-slate-500">Registro completo e histÃ³rico de atendimentos.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2" />}>
            <Plus className="h-4 w-4" /> NOVO CLIENTE
          </DialogTrigger>
          <DialogContent className="w-[90vw] sm:max-w-none max-w-[900px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden gap-0">
            <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800 gap-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-3 text-white">
                <Users className="h-5 w-5" /> Cadastro de Novo Cliente
              </DialogTitle>
              <p className="text-slate-400 text-xs font-medium">Preencha todos os dados cadastrais do cliente.</p>
            </DialogHeader>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="p-8 space-y-8">

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dados Pessoais</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-name" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome Completo</Label>
                      <Input id="c-name" placeholder="Ex: JoÃ£o da Silva Santos" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-cpf" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">CPF</Label>
                      <Input id="c-cpf" placeholder="000.000.000-00" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-birth" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data de Nascimento</Label>
                      <Input id="c-birth" type="date" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-phone" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Celular (WhatsApp)</Label>
                      <Input id="c-phone" placeholder="(11) 90000-0000" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email de Contato</Label>
                      <Input id="c-email" type="email" placeholder="cliente@email.com" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-profession" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">ProfissÃ£o / OcupaÃ§Ã£o</Label>
                      <Input id="c-profession" placeholder="Ex: Engenheiro" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">EndereÃ§o</span>
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
                      <Label htmlFor="c-number" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">NÃºmero</Label>
                      <Input id="c-number" placeholder="123" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-bairro" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bairro</Label>
                      <Input id="c-bairro" placeholder="Centro" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-city" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cidade / UF</Label>
                      <Input id="c-city" placeholder="SÃ£o Paulo - SP" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dados ClÃ­nicos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-consultation" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ãšltima Consulta OftalmolÃ³gica</Label>
                      <Input id="c-consultation" type="date" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-doctor" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">MÃ©dico de ConfianÃ§a</Label>
                      <Input id="c-doctor" placeholder="Dr. Nome do MÃ©dico" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-allergies" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Alergias / RestriÃ§Ãµes Conhecidas</Label>
                      <Input id="c-allergies" placeholder="Ex: Alergia a NÃ­quel" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Anexos (Foto / Receita MÃ©dica)</Label>
                      <div className="border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                        <Upload className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Clique para fazer Upload</span>
                        <span className="text-[10px] text-slate-300">PNG, JPG ou PDF atÃ© 10MB</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 p-6 -mx-0 -mb-0 rounded-none">
              <Button variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
              <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9" onClick={() => setIsDialogOpen(false)}>SALVAR CLIENTE</Button>
            </DialogFooter>
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
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status CrÃ©dito</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ãšltima Visita</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Saldo Devedor</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">AÃ§Ãµes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                  <TableCell className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{client.name}</span>
                        <span className="text-[10px] text-slate-400">ID: #{client.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-600 truncate max-w-[150px]">{client.phone}</span>
                      <span className="text-[10px] font-medium text-slate-400">CPF: {client.cpf}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <Badge className={`rounded ${
                      client.creditStatus === 'Excelente' ? 'bg-emerald-100 text-emerald-700' :
                      client.creditStatus === 'Bom' ? 'bg-blue-100 text-blue-700' :
                      client.creditStatus === 'AtenÃ§Ã£o' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    } text-[10px] font-semibold uppercase tracking-wider border-none px-2 py-0.5 shadow-none inline-flex items-center`}>
                      {client.creditStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                     <span className="text-slate-500">{client.lastVisit}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <span className={`font-bold ${client.balance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {client.balance === 0 ? '-' : `R$ ${client.balance.toFixed(2)}`}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-900">
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

