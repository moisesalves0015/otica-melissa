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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Gestão de Clientes</h1>
          <p className="text-slate-500">Visualize, cadastre e gerencie o histórico de todos os seus clientes.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="rounded-full px-6 font-bold h-12 shadow-lg shadow-primary/20 flex items-center gap-2" />}>
            <Plus className="h-5 w-5" /> NOVO CLIENTE
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl sm:rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-primary p-8 text-white">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Users className="h-6 w-6" /> Cadastro de Novo Cliente
              </DialogTitle>
              <p className="text-white/70 text-sm font-medium">Preencha os dados abaixo com atenção para criar um registro completo.</p>
            </DialogHeader>
            
            <div className="p-0">
              <Tabs defaultValue="pessoais" className="w-full">
                <TabsList className="w-full justify-start h-14 bg-slate-50 border-b border-slate-100 rounded-none px-8 gap-8">
                  <TabsTrigger value="pessoais" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest text-slate-400">
                    Dados Pessoais
                  </TabsTrigger>
                  <TabsTrigger value="endereco" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest text-slate-400">
                    Endereço
                  </TabsTrigger>
                  <TabsTrigger value="clinicos" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest text-slate-400">
                    Informações Clínicas
                  </TabsTrigger>
                  <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest text-slate-400">
                    Documentos
                  </TabsTrigger>
                </TabsList>

                <div className="p-8">
                  <TabsContent value="pessoais" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo *</Label>
                        <Input id="name" placeholder="Ex: João da Silva Santos" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf" className="text-[10px] font-black uppercase tracking-widest text-slate-500">CPF *</Label>
                        <Input id="cpf" placeholder="000.000.000-00" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data de Nascimento *</Label>
                        <Input id="birth" type="date" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Celular (WhatsApp) *</Label>
                        <Input id="phone" placeholder="(11) 90000-0000" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email *</Label>
                        <Input id="email" type="email" placeholder="cliente@exemplo.com" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profession" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Profissão</Label>
                        <Input id="profession" className="rounded-xl border-slate-200 h-11" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="endereco" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-[10px] font-black uppercase tracking-widest text-slate-500">CEP</Label>
                        <div className="flex gap-2">
                           <Input id="cep" placeholder="00000-000" className="rounded-xl border-slate-200 h-11" />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logradouro</Label>
                        <Input id="address" placeholder="Av. Principal, Rua Exemplo..." className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Número</Label>
                        <Input id="number" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bairro" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bairro</Label>
                        <Input id="bairro" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade</Label>
                        <Input id="city" className="rounded-xl border-slate-200 h-11" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="clinicos" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <Label htmlFor="consultation" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Última Consulta Oftalmológica</Label>
                        <Input id="consultation" type="date" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doctor" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Médico de Confiança</Label>
                        <Input id="doctor" placeholder="Dr. Nome do Médico" className="rounded-xl border-slate-200 h-11" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="allergies" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alergias a Materiais</Label>
                        <Input id="allergies" placeholder="Ex: Níquel, Silicone..." className="rounded-xl border-slate-200 h-11" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documentos" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors">
                            <Upload className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700">Foto do Cliente</p>
                            <p className="text-xs text-slate-400 mt-1">Clique para fazer upload (PNG, JPG)</p>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700">Receita Médica</p>
                            <p className="text-xs text-slate-400 mt-1">Anexar imagem ou PDF da receita</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            <DialogFooter className="bg-slate-50 p-8 flex flex-row items-center justify-between">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Preencha todos os campos obrigatórios (*)</p>
              <div className="flex gap-4">
                <Button variant="ghost" className="rounded-full px-6 font-bold" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
                <Button className="rounded-full px-8 font-bold shadow-lg shadow-primary/20" onClick={() => setIsDialogOpen(false)}>SALVAR CLIENTE</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-6 bg-white flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-100">
           <div className="relative flex-1 group">
            <Input
              type="search"
              placeholder="Buscar por nome ou CPF..."
              className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 flex items-center gap-2">
              <Filter className="h-4 w-4" /> FILTROS
            </Button>
             <Select defaultValue="todos">
              <SelectTrigger className="w-[180px] rounded-2xl h-12 border-slate-200 font-bold text-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
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
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Contato / CPF</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status Crédito</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Última Visita</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Saldo Devedor</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{client.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">ID: #{client.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" /> {client.phone}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <AlertCircle className="h-3 w-3 text-slate-300" /> CPF: {client.cpf}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-4">
                    <Badge className={`${
                      client.creditStatus === 'Excelente' ? 'bg-emerald-100 text-emerald-700' :
                      client.creditStatus === 'Bom' ? 'bg-blue-100 text-blue-700' :
                      client.creditStatus === 'Atenção' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    } text-[10px] font-black uppercase tracking-widest border-none px-3 py-1 rounded-full`}>
                      {client.creditStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-4">
                     <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="h-4 w-4 text-slate-300" /> {client.lastVisit}
                      </div>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-right">
                    <span className={`font-black text-sm ${client.balance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {client.balance === 0 ? '-' : `R$ ${client.balance.toFixed(2)}`}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5">
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredClients.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 flex items-center justify-center rounded-3xl">
                    <Search className="h-10 w-10" />
                </div>
                <div>
                    <p className="font-bold text-slate-900">Nenhum cliente encontrado</p>
                    <p className="text-sm text-slate-500">Tente ajustar sua busca ou filtros.</p>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white group">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <Calendar className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-900">Aniversariantes</p>
                    <p className="text-xs text-slate-500">8 clientes este mês</p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-slate-300" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white group">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-900">Inadimplentes</p>
                    <p className="text-xs text-slate-500">12 pendências ativas</p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-slate-300" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white group">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <MapPin className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-900">Localização</p>
                    <p className="text-xs text-slate-500">Mapa de densidade</p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-slate-300" />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

