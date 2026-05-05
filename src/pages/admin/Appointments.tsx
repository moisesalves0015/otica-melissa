import * as React from "react";
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
    Calendar, CheckCircle2, XCircle, Clock, Trash2, 
    MessageCircle, Search, Filter, Phone, User, CalendarDays, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Appointment {
    id: string;
    name: string;
    whatsapp: string;
    preferredDate: string;
    period?: string;
    status: "Pendente" | "Confirmado" | "Cancelado";
    source: string;
    createdAt: any;
}

export default function Appointments() {
    const [appointments, setAppointments] = React.useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("todos");
    const [timeFilter, setTimeFilter] = React.useState("todos");
    const [availableDates, setAvailableDates] = React.useState<string[]>([]);
    const [newAvailableDate, setNewAvailableDate] = React.useState("");

    React.useEffect(() => {
        const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            })) as Appointment[];
            setAppointments(data);
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const updateStatus = async (id: string, newStatus: Appointment["status"]) => {
        try {
            await updateDoc(doc(db, "appointments", id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            toast.success(`Agendamento ${newStatus}!`);
        } catch (error: any) {
            toast.error("Erro ao atualizar status: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
        try {
            await deleteDoc(doc(db, "appointments", id));
            toast.success("Agendamento excluído!");
        } catch (error: any) {
            toast.error("Erro ao excluir: " + error.message);
        }
    };

    const openWhatsApp = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        const message = encodeURIComponent(`Olá ${name}, aqui é da Ótica Melissa. Estamos entrando em contato para confirmar seu agendamento de exame gratuito solicitado pelo site.`);
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
    };

    const filteredAppointments = appointments.filter(a => {
        const name = a.name || "";
        const whatsapp = a.whatsapp || "";
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             whatsapp.includes(searchTerm);
        const matchesStatus = statusFilter === "todos" || a.status === statusFilter;
        
        let matchesTime = true;
        if (timeFilter === "hoje" && a.preferredDate) {
            const today = new Date().toISOString().split('T')[0];
            const apptDate = a.preferredDate.includes("/") ? a.preferredDate.split("/").reverse().join("-") : a.preferredDate;
            matchesTime = apptDate === today;
        } else if (timeFilter === "semana" && a.preferredDate) {
            const now = new Date();
            const weekFromNow = new Date();
            weekFromNow.setDate(now.getDate() + 7);
            const apptDateStr = a.preferredDate.includes("/") ? a.preferredDate.split("/").reverse().join("-") : a.preferredDate;
            const apptDate = new Date(apptDateStr);
            matchesTime = apptDate >= now && apptDate <= weekFromNow;
        }

        return matchesSearch && matchesStatus && matchesTime;
    });

    const handleAddAvailableDate = async () => {
        if (!newAvailableDate) return;
        if (availableDates.includes(newAvailableDate)) {
            toast.error("Esta data já está disponível.");
            return;
        }
        const updated = [...availableDates, newAvailableDate].sort();
        try {
            await setDoc(doc(db, "settings", "exams"), { availableDates: updated }, { merge: true });
            toast.success("Data adicionada!");
            setNewAvailableDate("");
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        }
    };

    const handleRemoveAvailableDate = async (date: string) => {
        const updated = availableDates.filter(d => d !== date);
        try {
            await setDoc(doc(db, "settings", "exams"), { availableDates: updated }, { merge: true });
            toast.success("Data removida!");
        } catch (error: any) {
            toast.error("Erro ao remover: " + error.message);
        }
    };

    const getStatusBadge = (status: Appointment["status"]) => {
        switch (status) {
            case "Confirmado":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 !rounded-none uppercase tracking-widest text-[10px]">Confirmado</Badge>;
            case "Cancelado":
                return <Badge className="bg-red-500 hover:bg-red-600 !rounded-none uppercase tracking-widest text-[10px]">Cancelado</Badge>;
            default:
                return <Badge className="bg-amber-500 hover:bg-amber-600 !rounded-none uppercase tracking-widest text-[10px]">Pendente</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-slate-900">Agendamentos de Exames</h1>
                <p className="text-xs text-slate-500">Gerencie as solicitações de exames gratuitos vindas do site e portal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="!rounded-none border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Search className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Buscar</Label>
                            <Input 
                                placeholder="Nome ou telefone..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-8 border-none p-0 focus-visible:ring-0 shadow-none text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="!rounded-none border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Filter className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-8 border-none p-0 focus:ring-0 shadow-none text-sm uppercase font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="!rounded-none">
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="Pendente">Pendentes</SelectItem>
                                    <SelectItem value="Confirmado">Confirmados</SelectItem>
                                    <SelectItem value="Cancelado">Cancelados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="!rounded-none border-slate-200 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Período</Label>
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="h-8 border-none p-0 focus:ring-0 shadow-none text-sm uppercase font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="!rounded-none">
                                    <SelectItem value="todos">Sempre</SelectItem>
                                    <SelectItem value="hoje">Hoje</SelectItem>
                                    <SelectItem value="semana">Esta Semana</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="!rounded-none border-slate-200 shadow-none bg-slate-900 text-white">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-white/10 flex items-center justify-center">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Total Filtrado</p>
                            <p className="text-xl font-bold">{filteredAppointments.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 !rounded-none border-slate-200 shadow-none">
                    <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Lista de Agendamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-12 px-6">Cliente</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-12">WhatsApp</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-12">Fonte</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-12">Data Solicitada</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-12">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-12 text-right px-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-400 text-sm">Carregando...</TableCell>
                                    </TableRow>
                                ) : filteredAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-400 text-sm">Nenhum agendamento encontrado.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAppointments.map((a) => (
                                        <TableRow key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-slate-900">{a.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-medium">Solicitado em {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recentemente'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-600">{a.whatsapp}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`!rounded-none text-[9px] font-bold uppercase tracking-tighter ${a.source === "Landing Page" ? "border-blue-200 text-blue-600 bg-blue-50" : "border-purple-200 text-purple-600 bg-purple-50"}`}>
                                                    {a.source || "Landing Page"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-3 w-3 text-primary" />
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {a.preferredDate ? (a.preferredDate.includes("-") ? a.preferredDate.split("-").reverse().join("/") : a.preferredDate) : "Não informada"}
                                                        </span>
                                                    </div>
                                                    {a.period && <span className="text-[10px] text-slate-400 font-medium">{a.period}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(a.status)}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => openWhatsApp(a.whatsapp, a.name)}
                                                        className="!rounded-none border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-8"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5 mr-2" />
                                                        WhatsApp
                                                    </Button>
                                                    {a.status === "Pendente" && (
                                                        <>
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                onClick={() => updateStatus(a.id, "Confirmado")}
                                                                className="h-8 w-8 !rounded-none border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                                title="Confirmar"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                onClick={() => updateStatus(a.id, "Cancelado")}
                                                                className="h-8 w-8 !rounded-none border-red-200 text-red-600 hover:bg-red-50"
                                                                title="Cancelar"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(a.id)}
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4 !rounded-none border-slate-200 shadow-none">
                    <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" /> Disponibilidade de Exames
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Habilitar Nova Data</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="date"
                                    value={newAvailableDate}
                                    onChange={e => setNewAvailableDate(e.target.value)}
                                    className="!rounded-none border-slate-200 h-10 flex-1"
                                />
                                <Button 
                                    onClick={handleAddAvailableDate}
                                    className="!rounded-none bg-slate-900 text-white h-10 px-4"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Datas Ativas no Site</Label>
                            {availableDates.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Nenhuma data específica habilitada. O formulário usará o seletor padrão.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {availableDates.map(date => (
                                        <div key={date} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-sm font-medium">{date.split("-").reverse().join("/")}</span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleRemoveAvailableDate(date)}
                                                className="h-7 w-7 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
