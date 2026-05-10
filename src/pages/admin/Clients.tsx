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
import { collection, addDoc, setDoc, doc, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { calculateCreditScore, getCreditStatusColor } from "../../lib/credit";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Clients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterCredit, setFilterCredit] = React.useState("todos");
  const [filterStartDate, setFilterStartDate] = React.useState("");
  const [filterEndDate, setFilterEndDate] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [quickAccessModal, setQuickAccessModal] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);

  // Estados para os campos com máscara
  const [nameValue, setNameValue] = React.useState("");
  const [cpfValue, setCpfValue] = React.useState("");
  const [phoneValue, setPhoneValue] = React.useState("");
  const [birthValue, setBirthValue] = React.useState("");
  const [cepValue, setCepValue] = React.useState("");
  const [addressValue, setAddressValue] = React.useState("");
  const [bairroValue, setBairroValue] = React.useState("");
  const [cityValue, setCityValue] = React.useState("");
  const [numberValue, setNumberValue] = React.useState("");
  const [complementValue, setComplementValue] = React.useState("");
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [installments, setInstallments] = React.useState<any[]>([]);

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    return v.replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const formatCEP = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const capitalizeName = (str: string) => {
    const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e'];
    return str.split(' ').map((word, index) => {
        if (!word) return '';
        const lower = word.toLowerCase();
        if (preposicoes.includes(lower) && index !== 0) return lower;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const handleCepBlur = async () => {
    const cep = cepValue.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddressValue(data.logradouro || "");
          setBairroValue(data.bairro || "");
          setCityValue(`${data.localidade || ""} - ${data.uf || ""}`);
        }
      } catch (err) {
        // Error handled via UI
      }
    }
  };

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    return v.replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2");
  };

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

    const unsubAtend = onSnapshot(query(collection(db, "atendimentos")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const parseDate = (s: string) => {
          if (!s) return 0;
          if (s.includes("/")) {
              const [d, m, y] = s.split("/").map(Number);
              return new Date(y, m - 1, d).getTime();
          }
          return new Date(s).getTime();
        };
        return parseDate(b.date) - parseDate(a.date);
      });
      setAtendimentos(data);
    });

    const unsubInst = onSnapshot(query(collection(db, "installments")), (snapshot) => {
      setInstallments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubAtend();
      unsubInst();
    };
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // 1. Validações de Campos Obrigatórios
    if (!data.name || String(data.name).trim().length < 3) {
      toast.error("O nome completo é obrigatório e deve ter pelo menos 3 caracteres.");
      return;
    }
    if (!data.cpf || String(data.cpf).replace(/\D/g, "").length !== 11) {
      toast.error("CPF inválido. Certifique-se de preencher os 11 dígitos.");
      return;
    }
    if (!data.birth || String(data.birth).length !== 10) {
      toast.error("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
      return;
    }

    setIsSaving(true);
    try {
      // 2. Verificação de CPF Duplicado
      const cpf = String(data.cpf);
      const q = query(collection(db, "clients"), where("cpf", "==", cpf));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error("Este CPF já está cadastrado para outro cliente.");
        setIsSaving(false);
        return;
      }

      const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
      
      const password = String(data.cpf || "").replace(/\D/g, "").slice(-4);

      let lastConsultDate = data.lastConsultation ? String(data.lastConsultation) : "";
      if (lastConsultDate.includes("-") && lastConsultDate.split("-")[0].length === 4) {
          const [y, m, d] = lastConsultDate.split("-");
          lastConsultDate = `${d}/${m}/${y}`;
      }

      await setDoc(doc(db, "clients", uniqueId), {
        name: String(data.name || ""),
        cpf: String(data.cpf || ""),
        birthDate: String(data.birth || ""),
        phone: String(data.phone || ""),
        email: String(data.email || ""),
        profession: String(data.profession || ""),
        password: password, // Padrão: 4 últimos dígitos do CPF
        cep: cepValue,
        address: addressValue,
        number: numberValue,
        complement: complementValue,
        bairro: bairroValue,
        city: cityValue,
        lastConsultation: lastConsultDate,
        createdAt: new Date().toISOString(),
        creditStatus: "Em Análise",
        lastVisit: new Date().toLocaleDateString('pt-BR'),
        balance: 0,
      });
      
      toast.success("Cliente cadastrado com sucesso!");
      setIsDialogOpen(false);
      // Reset form states
      setNameValue(""); setCpfValue(""); setPhoneValue(""); setBirthValue(""); setCepValue("");
      setAddressValue(""); setBairroValue(""); setCityValue(""); setNumberValue(""); setComplementValue("");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };



  const getDynamicClientData = (client: any) => {
    const clientAtendimentos = atendimentos.filter(a => a.clientId === client.id);
    const lastVisit = clientAtendimentos.length > 0 ? clientAtendimentos[0].date : (client.lastVisit || "Primeiro Acesso");
    
    const clientInstallments = installments.filter(i => i.clientId === client.id && i.status !== 'Pago');
    const dynamicBalance = clientInstallments.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    return { lastVisit, dynamicBalance };
  };

  const filteredClients = clients.filter(client => {
    const { dynamicBalance } = getDynamicClientData(client);
    const matchesSearch = 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf?.includes(searchTerm);

    const score = calculateCreditScore(client, installments);
    const matchesCredit = filterCredit === "todos" || 
      (filterCredit === 'inadimplente' ? (dynamicBalance > 0 || score.status === 'Atenção' || score.status === 'Inadimplente') : score.status?.toLowerCase() === filterCredit);

    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      if (client.createdAt) {
        const itemDateStr = client.createdAt.includes('T') ? client.createdAt.split('T')[0] : client.createdAt;
        let itemDate: Date;
        if (itemDateStr.includes("-")) {
            itemDate = new Date(itemDateStr);
        } else if (itemDateStr.includes("/")) {
            const [d, m, y] = itemDateStr.split("/").map(Number);
            itemDate = new Date(y, m - 1, d);
        } else {
            itemDate = new Date(itemDateStr);
        }
        itemDate.setHours(0,0,0,0);

        if (filterStartDate) {
          const [sy, sm, sd] = filterStartDate.split("-").map(Number);
          const startDate = new Date(sy, sm - 1, sd);
          startDate.setHours(0,0,0,0);
          if (itemDate < startDate) matchesDate = false;
        }
        if (filterEndDate) {
          const [ey, em, ed] = filterEndDate.split("-").map(Number);
          const endDate = new Date(ey, em - 1, ed);
          endDate.setHours(0,0,0,0);
          if (itemDate > endDate) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesCredit && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCredit("todos");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const currentMonth = new Date().getMonth() + 1;
  const aniversariantesList = clients.filter(c => {
    if (!c.birthDate) return false;
    const parts = c.birthDate.split('/');
    if (parts.length === 3) {
      return parseInt(parts[1], 10) === currentMonth;
    }
    return false;
  });

  const inadimplentesList = clients.filter(c => {
    const { dynamicBalance } = getDynamicClientData(c);
    const score = calculateCreditScore(c, installments);
    return score.status === 'Atenção' || 
    score.status === 'Inadimplente' || 
    dynamicBalance > 0
  });

  const cityCount: Record<string, number> = {};
  clients.forEach(c => {
      const city = c.city ? c.city.split('-')[0].trim().toUpperCase() : '';
      if (city && city !== 'N/A') {
          cityCount[city] = (cityCount[city] || 0) + 1;
      }
  });
  const citiesArray = Object.entries(cityCount).sort((a, b) => b[1] - a[1]);
  const uniqueCities = citiesArray.length;
  const localizacaoSub = uniqueCities > 0 ? `${uniqueCities} cidades atendidas` : 'Mapa de densidade';

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
                      <Input id="c-name" name="name" value={nameValue} onChange={(e) => setNameValue(capitalizeName(e.target.value))} placeholder="Ex: João da Silva Santos" className="rounded border-slate-200 h-9 text-sm" required />
                    </div>
                     <div className="space-y-1.5">
                       <Label htmlFor="c-cpf" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">CPF</Label>
                       <Input id="c-cpf" name="cpf" value={cpfValue} onChange={e => setCpfValue(formatCPF(e.target.value))} placeholder="000.000.000-00" className="rounded border-slate-200 h-9 text-sm" required />
                     </div>
                     <div className="space-y-1.5">
                       <Label htmlFor="c-birth" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data de Nascimento</Label>
                       <Input id="c-birth" name="birth" value={birthValue} onChange={e => setBirthValue(formatDate(e.target.value))} type="text" placeholder="DD/MM/YYYY" className="rounded border-slate-200 h-9 text-sm" required />
                     </div>
                     <div className="space-y-1.5">
                       <Label htmlFor="c-phone" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Celular (WhatsApp)</Label>
                       <Input id="c-phone" name="phone" value={phoneValue} onChange={e => setPhoneValue(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="rounded border-slate-200 h-9 text-sm" />
                     </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email de Contato</Label>
                      <Input id="c-email" name="email" type="email" placeholder="cliente@email.com" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-profession" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Profissão / Ocupação</Label>
                      <Input id="c-profession" name="profession" placeholder="Ex: Engenheiro" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Endereço</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-cep" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">CEP</Label>
                      <Input id="c-cep" value={cepValue} onChange={e => setCepValue(formatCEP(e.target.value))} onBlur={handleCepBlur} placeholder="00000-000" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-4">
                      <Label htmlFor="c-address" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Logradouro / Rua</Label>
                      <Input id="c-address" value={addressValue} onChange={e => setAddressValue(e.target.value)} placeholder="Av. Principal..." className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="c-number" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Número</Label>
                      <Input id="c-number" value={numberValue} onChange={e => setNumberValue(e.target.value)} placeholder="123" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-4">
                      <Label htmlFor="c-complement" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Complemento</Label>
                      <Input id="c-complement" value={complementValue} onChange={e => setComplementValue(e.target.value)} placeholder="Apto, Sala, Bloco..." className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <Label htmlFor="c-bairro" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bairro</Label>
                      <Input id="c-bairro" value={bairroValue} onChange={e => setBairroValue(e.target.value)} placeholder="Centro" className="rounded border-slate-200 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <Label htmlFor="c-city" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cidade / UF</Label>
                      <Input id="c-city" value={cityValue} onChange={e => setCityValue(e.target.value)} placeholder="São Paulo - SP" className="rounded border-slate-200 h-9 text-sm" />
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
                      <Input id="c-consultation" name="lastConsultation" type="date" className="rounded border-slate-200 h-9 text-sm" />
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
      <Card className="!rounded-none border-slate-200 shadow-none overflow-hidden bg-white">
                 <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
                    <div className="relative flex-1 group max-w-md">
                        <Input
                            placeholder="Buscar por nome ou CPF..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 !rounded-none text-xs focus:ring-0 focus:border-slate-400 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-9 !rounded-none border-slate-200 text-xs font-bold transition-colors ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        {showFilters ? 'OCULTAR FILTROS' : 'FILTROS AVANÇADOS'}
                        {(filterCredit !== 'todos' || filterStartDate || filterEndDate) && (
                            <Badge className="ml-2 bg-emerald-500 text-white border-none h-4 px-1 min-w-[16px] flex items-center justify-center text-[9px]">
                                !
                            </Badge>
                        )}
                    </Button>

                    {(searchTerm || filterCredit !== 'todos' || filterStartDate || filterEndDate) && (
                        <Button 
                            variant="ghost" 
                            onClick={clearFilters}
                            className="h-9 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                        >
                            LIMPAR
                        </Button>
                    )}
                 </div>

                 {/* PAINEL DE FILTROS ROBUSTOS */}
                 {showFilters && (
                    <div className="p-5 bg-slate-50/80 border-b border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Período Inicial</Label>
                                <Input 
                                    type="date"
                                    value={filterStartDate} 
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="h-9 !rounded-none border-slate-200 bg-white text-xs font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Período Final</Label>
                                <Input 
                                    type="date"
                                    value={filterEndDate} 
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="h-9 !rounded-none border-slate-200 bg-white text-xs font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status de Crédito</Label>
                                <Select value={filterCredit} onValueChange={setFilterCredit}>
                                    <SelectTrigger className="h-9 !rounded-none border-slate-200 bg-white text-xs font-medium">
                                        <SelectValue placeholder="Status de Crédito" />
                                    </SelectTrigger>
                                    <SelectContent className="!rounded-none">
                                        <SelectItem value="todos">Todos Status</SelectItem>
                                        <SelectItem value="excelente">Excelente</SelectItem>
                                        <SelectItem value="bom">Bom</SelectItem>
                                        <SelectItem value="em análise">Em Análise</SelectItem>
                                        <SelectItem value="atenção">Atenção</SelectItem>
                                        <SelectItem value="inadimplente">Inadimplentes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                 )}
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="min-w-[800px]">
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
              {filteredClients.map((client) => {
                const { lastVisit, dynamicBalance } = getDynamicClientData(client);
                return (
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
                    {(() => {
                        const score = calculateCreditScore(client, installments);
                        return (
                            <Badge className={`rounded ${getCreditStatusColor(score.status)} text-[10px] font-semibold uppercase tracking-wider border-none px-2 py-0.5 shadow-none inline-flex items-center`}>
                              {score.status}
                            </Badge>
                        );
                    })()}
                  </TableCell>
                  <TableCell className="px-6 py-3">
                     <span className="text-slate-500">{lastVisit}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <span className={`font-bold ${dynamicBalance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {dynamicBalance === 0 ? '-' : `R$ ${dynamicBalance.toFixed(2)}`}
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
                );
              })}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500 font-medium">
                    Nenhum cliente cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ id: 'aniversariantes', label: 'Aniversariantes', sub: `${aniversariantesList.length} este mês`, icon: Calendar, color: 'bg-amber-50 text-amber-600' },
            { id: 'inadimplentes', label: 'Inadimplentes', sub: `${inadimplentesList.length} pendências`, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
            { id: 'localizacao', label: 'Localização', sub: localizacaoSub, icon: MapPin, color: 'bg-slate-50 text-slate-600' }
          ].map((item) => (
            <Card key={item.id} onClick={() => setQuickAccessModal(item.id)} className="rounded border-slate-200 shadow-none hover:bg-slate-50/50 transition-colors cursor-pointer bg-white group border-dashed">
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

      <Dialog open={!!quickAccessModal} onOpenChange={(open) => !open && setQuickAccessModal(null)}>
        <DialogContent className="sm:max-w-[600px] rounded border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="bg-slate-900 p-6 border-b border-slate-800 text-white">
            <DialogTitle className="text-base font-bold uppercase tracking-wide flex items-center gap-2">
                {quickAccessModal === 'aniversariantes' && <><Calendar className="h-4 w-4" /> Aniversariantes do Mês</>}
                {quickAccessModal === 'inadimplentes' && <><AlertCircle className="h-4 w-4 text-red-400" /> Clientes Inadimplentes</>}
                {quickAccessModal === 'localizacao' && <><MapPin className="h-4 w-4" /> Mapa de Densidade (Cidades)</>}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-0 bg-white">
             {quickAccessModal === 'aniversariantes' && (
                <div className="divide-y divide-slate-100">
                    {aniversariantesList.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500 font-medium">Nenhum aniversariante encontrado este mês.</p>
                    ) : (
                        aniversariantesList.map(c => (
                            <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setQuickAccessModal(null); navigate(`/admin/clientes/${c.id}`); }}>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-slate-600 transition-colors">{c.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Nascimento: <strong className="text-slate-700">{c.birthDate}</strong></p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold shadow-none border-none pointer-events-none">🎂 PARABÉNS</Badge>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
             )}

             {quickAccessModal === 'inadimplentes' && (
                <div className="divide-y divide-slate-100">
                    {inadimplentesList.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500 font-medium">Nenhum cliente com pendências financeiras encontrado.</p>
                    ) : (
                        inadimplentesList.map(c => (
                            <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setQuickAccessModal(null); navigate(`/admin/clientes/${c.id}`); }}>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-slate-600 transition-colors">{c.name}</p>
                                    <p className="text-xs text-red-600 font-semibold mt-0.5">Saldo Devedor: R$ {getDynamicClientData(c).dynamicBalance.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-700 text-[10px] font-bold uppercase shadow-none border-none pointer-events-none">{calculateCreditScore(c, installments).status}</Badge>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
             )}

             {quickAccessModal === 'localizacao' && (
                 <div className="divide-y divide-slate-100 p-6">
                     {citiesArray.length === 0 ? (
                         <p className="text-center text-sm text-slate-500 font-medium">Nenhum dado de localização encontrado nos cadastros.</p>
                     ) : (
                         <div className="space-y-6">
                             {citiesArray.map(([city, count], idx) => (
                                 <div key={city} className="flex flex-col gap-2">
                                     <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                                         <span className="flex items-center gap-2">
                                             <span className="text-[10px] text-slate-400 font-medium">#{idx + 1}</span> {city}
                                         </span>
                                         <span className="text-slate-500">{count} {count === 1 ? 'cliente' : 'clientes'}</span>
                                     </div>
                                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-slate-900 rounded-full" style={{ width: `${(count / clients.length) * 100}%` }} />
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             )}
          </div>
          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
            <Button onClick={() => setQuickAccessModal(null)} variant="outline" className="rounded font-semibold text-xs border-slate-200 text-slate-600 hover:bg-slate-100">FECHAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

