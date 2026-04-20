import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { User, Calendar, ArrowRight, ShieldCheck, Sparkles, ChevronLeft, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cpf, setCpf] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    return v.replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const formatDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de login iniciada para o CPF:", cpf);
    
    if (!cpf || !birthDate) {
        toast.error("Preencha CPF e Data de Nascimento.");
        return;
    }

    setIsLoading(true);

    try {
      const cleanInputCpf = cpf.replace(/\D/g, "");
      const cleanInputBirth = birthDate.replace(/\D/g, "");
      
      console.log("Buscando clientes no banco...");
      const q = query(collection(db, "clients"));
      const querySnapshot = await getDocs(q);

      let foundClient: any = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dbCpf = (data.cpf || "").replace(/\D/g, "");
        if (dbCpf === cleanInputCpf) {
          foundClient = { id: doc.id, ...data };
        }
      });

      if (!foundClient) {
        toast.error("Cliente não encontrado.");
        setIsLoading(false);
        return;
      }

      const dbBirth = (foundClient.birthDate || "").replace(/\D/g, "");

      if (dbBirth === cleanInputBirth) {
        localStorage.setItem("otica_client_session", JSON.stringify({
          id: foundClient.id,
          name: foundClient.name,
          cpf: foundClient.cpf
        }));
        
        toast.success(`Bem-vindo, ${foundClient.name}!`);
        
        const redirect = searchParams.get("redirect") || "/cliente/dashboard";
        navigate(redirect);
      } else {
        toast.error("Data de nascimento não confere.");
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error("Erro ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Elementos Decorativos Suaves */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 skew-x-12 translate-x-1/4 -z-10" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-6">
          <div 
            className="inline-flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/")}
          >
            <img src="/logo.png" alt="Ótica Melissa" className="h-16 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Acesse sua Conta
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-3">
              Valide seus dados para entrar
            </p>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden bg-white relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          
          <CardContent className="p-10 md:p-12 space-y-8">
            <form 
              onSubmit={handleLogin} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-2">CPF Cadastrado</Label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    placeholder="000.000.000-00" 
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    className="rounded-2xl border-slate-100 h-14 text-base font-bold pl-12 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-2">Data de Nascimento</Label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    placeholder="DD/MM/AAAA"
                    value={birthDate}
                    onChange={e => setBirthDate(formatDate(e.target.value))}
                    maxLength={10}
                    className="rounded-2xl border-slate-100 h-14 text-base font-bold pl-12 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {isLoading ? "Validando..." : (
                  <>Acessar Painel <ArrowRight className="h-5 w-5" /></>
                )}
              </Button>
            </form>

            <div className="flex flex-col items-center gap-6">
              <div className="h-px bg-slate-100 w-full" />
              
              <div className="flex flex-col items-center gap-3">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Conexão Segura Ótica Melissa
                </div>
                <Button 
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 uppercase transition-all flex items-center gap-2 rounded-full h-8"
                >
                  <ChevronLeft className="h-3 w-3" /> Voltar ao Início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-300 text-[10px] uppercase font-bold tracking-[0.3em]">
          © 2024 Ótica Melissa
        </p>
      </div>
    </div>
  );
}
