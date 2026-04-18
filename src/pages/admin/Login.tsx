import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login realizado com sucesso!");
      navigate("/admin");
    } catch (error: any) {
      toast.error("E-mail ou senha incorretos.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 p-3 rounded-xl mb-4">
            <img src="/logo.png" alt="Ótica Melissa" className="h-8 w-auto invert" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Área Restrita</h1>
          <p className="text-sm text-slate-500 font-medium">Acesso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 h-11 bg-slate-50" 
                placeholder="admin@oticamelissa.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 h-11 bg-slate-50" 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider mt-4">
            {loading ? "Entrando..." : "Entrar no Sistema"}
          </Button>
        </form>
      </div>
    </div>
  );
}
