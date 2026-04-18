import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export function ClientLoginModal() {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { user, role, clientData, setClientData, logout } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Autenticar anonimamente PRIMEIRO para poder consultar o banco
      await signInAnonymously(auth);

      const q = query(
        collection(db, "clients"),
        where("cpf", "==", cpf),
        where("birthDate", "==", birthDate)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Se não achou, desloga e avisa
        await auth.signOut();
        toast.error("Cliente não encontrado. Verifique o CPF e a Data de Nascimento.");
      } else {
        const clientDoc = snapshot.docs[0];
        const data = { id: clientDoc.id, ...clientDoc.data() } as any;
        
        setClientData(data);
        toast.success(`Bem-vindo(a), ${data.name}!`);
        setIsOpen(false);
      }
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (user && role === "client" && clientData) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-700 hidden md:inline-block">
          Olá, {clientData.name.split(" ")[0]}
        </span>
        <Button variant="ghost" size="icon" onClick={() => { logout(); setClientData(null); }} className="rounded-full h-10 w-10 hover:bg-red-50 text-red-500" title="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted/50">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-center">Área do Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">CPF</Label>
            <Input 
              placeholder="000.000.000-00" 
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Data de Nascimento</Label>
            <Input 
              type="date" 
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider mt-2">
            {loading ? "Acessando..." : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
