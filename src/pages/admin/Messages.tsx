import * as React from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Mail, Trash2, CheckCircle, Clock, Search, MessageSquare, User, Tag, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Messages() {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Nova" ? "Lida" : "Nova";
    try {
      await updateDoc(doc(db, "contacts", id), { status: newStatus });
      toast.success(`Mensagem marcada como ${newStatus.toLowerCase()}.`);
    } catch (err: any) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta mensagem permanentemente?")) {
      try {
        await deleteDoc(doc(db, "contacts", id));
        toast.success("Mensagem excluída.");
      } catch (err: any) {
        toast.error("Erro ao excluir mensagem.");
      }
    }
  };

  const filteredMessages = messages.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Central de Mensagens</h1>
          <p className="text-slate-500 text-sm">Gerencie o contato recebido através do site.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Buscar mensagens..." 
            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredMessages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-6 bg-white border rounded-[20px] transition-all ${
                msg.status === 'Nova' ? 'border-l-4 border-l-primary shadow-md' : 'border-slate-100 opacity-80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={msg.status === 'Nova' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}>
                      {msg.status}
                    </Badge>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Calendar size={14} />
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Recentemente'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="text-slate-500" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Nome</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{msg.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Mail className="text-slate-500" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">E-mail</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{msg.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Tag className="text-slate-500" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Assunto</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{msg.subject}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 shrink-0">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-slate-200 hover:text-primary hover:border-primary"
                    title="Marcar como lida/não lida"
                    onClick={() => handleStatusChange(msg.id, msg.status)}
                  >
                    <CheckCircle className={`h-4 w-4 ${msg.status === 'Lida' ? 'text-green-500' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl border-slate-200 hover:text-red-500 hover:border-red-500"
                    title="Excluir mensagem"
                    onClick={() => handleDelete(msg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[30px] border border-dashed border-slate-200">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">Nenhuma mensagem encontrada.</p>
        </div>
      )}
    </div>
  );
}
