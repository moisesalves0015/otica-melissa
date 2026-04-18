import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export function ClientLoginModal() {
  const navigate = useNavigate();
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    const savedSession = localStorage.getItem("otica_client_session");
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("otica_client_session");
    setSession(null);
    navigate("/");
  };

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted/50"
          onClick={() => navigate("/cliente/dashboard")}
        >
          <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 hidden sm:inline-block">
            {session.name.split(" ")[0]}
          </span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout} 
          className="rounded-full h-10 w-10 hover:bg-red-50 text-red-400" 
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full h-10 w-10 hover:bg-muted/50 border border-slate-100"
      onClick={() => navigate("/cliente/login")}
    >
      <User className="h-5 w-5 text-slate-600" />
    </Button>
  );
}
