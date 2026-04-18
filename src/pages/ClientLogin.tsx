import * as React from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { User, Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [cpf, setCpf] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    return v.replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const q = query(collection(db, "clients"), where("cpf", "==", cpf)); // Comparing with formatted CPF as stored
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("Cliente não encontrado.");
        setIsLoading(false);
        return;
      }

      const clientDoc = querySnapshot.docs[0];
      const clientData = clientDoc.data();

      if (clientData.password === password) {
        localStorage.setItem("otica_client_session", JSON.stringify({
          id: clientDoc.id,
          name: clientData.name,
          cpf: clientData.cpf
        }));
        toast.success(`Bem-vindo, ${clientData.name}!`);
        navigate("/cliente/dashboard");
      } else {
        toast.error("Senha incorreta.");
      }
    } catch (error: any) {
      toast.error("Erro ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-2">
            <img src="/logo.png" alt="Ótica Melissa" className="h-12 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center justify-center gap-2">
              Área do Cliente <Sparkles className="h-5 w-5 text-amber-400" />
            </h1>
            <p className="text-slate-400 text-sm font-medium">Acesse seu histórico, receitas e acompanhe seus pedidos.</p>
          </div>
        </div>

        <Card className="rounded-[32px] border-white/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl">
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seu CPF</Label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    placeholder="000.000.000-00" 
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    className="rounded-2xl border-white/10 h-14 text-base font-bold pl-12 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white/5 text-white placeholder:text-slate-600"
                    required
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sua Senha</Label>
                <div className="relative group">
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="rounded-2xl border-white/10 h-14 text-base font-bold pl-12 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white/5 text-white placeholder:text-slate-600"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? "Entrando..." : (
                  <>Acessar Minha Conta <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/50" />
                Acesso Seguro e Criptografado
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">
          © 2024 Ótica Melissa • Sua visão em primeiro lugar
        </p>
      </div>
    </div>
  );
}
