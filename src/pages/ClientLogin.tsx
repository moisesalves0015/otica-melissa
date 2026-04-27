import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { User, Calendar, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react";

const SESSION_DURATION_HOURS = 8;

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
* { box-sizing: border-box; }
input::placeholder { color: #C7C7C7 !important; }
@media (max-width: 480px) {
  .login-card { padding: 24px 20px !important; }
  .login-title { font-size: 20px !important; }
  .login-subtitle { font-size: 13px !important; }
  .login-wrap { padding: 16px !important; }
}
`;

export default function ClientLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cpf, setCpf] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [cpfFocus, setCpfFocus] = React.useState(false);
  const [dateFocus, setDateFocus] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("otica_client_session");
      if (!raw) return;
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() < session.expiresAt) {
        navigate(searchParams.get("redirect") || "/cliente/dashboard", { replace: true });
      } else {
        localStorage.removeItem("otica_client_session");
      }
    } catch {
      localStorage.removeItem("otica_client_session");
    }
  }, []);

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return v;
  };

  const formatDate = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 8);
    if (v.length > 4) return v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    if (v.length > 2) return v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    return v;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt — CPF:", cpf, "| Data:", birthDate);

    if (!cpf.trim() || !birthDate.trim()) {
      toast.error("Preencha CPF e Data de Nascimento.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const cleanBirth = birthDate.replace(/\D/g, "");
      const fmtCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

      let foundClient: any = null;

      // Busca com CPF formatado (123.456.789-00)
      const snap1 = await getDocs(query(collection(db, "clients"), where("cpf", "==", fmtCpf), limit(1)));
      if (!snap1.empty) {
        foundClient = { id: snap1.docs[0].id, ...snap1.docs[0].data() };
        console.log("Encontrado com CPF formatado");
      }

      // Busca com CPF sem máscara (12345678900)
      if (!foundClient) {
        const snap2 = await getDocs(query(collection(db, "clients"), where("cpf", "==", cleanCpf), limit(1)));
        if (!snap2.empty) {
          foundClient = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
          console.log("Encontrado com CPF limpo");
        }
      }

      // Fallback: full-scan (garante compatibilidade com qualquer formato no DB)
      if (!foundClient) {
        console.log("Tentando full-scan como fallback...");
        const snapAll = await getDocs(collection(db, "clients"));
        snapAll.forEach((d) => {
          const data = d.data();
          const dbCpf = (data.cpf || "").replace(/\D/g, "");
          if (dbCpf === cleanCpf) {
            foundClient = { id: d.id, ...data };
          }
        });
        if (foundClient) console.log("Encontrado via full-scan");
      }

      if (!foundClient) {
        console.log("Cliente não encontrado.");
        toast.error("Cliente não encontrado. Verifique o CPF informado.");
        return;
      }

      console.log("Cliente encontrado:", foundClient.name, "| birthDate no DB:", foundClient.birthDate);

      const dbBirth = (foundClient.birthDate || "").replace(/\D/g, "");
      console.log("Comparando datas — input:", cleanBirth, "| db:", dbBirth);

      if (dbBirth === cleanBirth) {
        const expiresAt = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;
        localStorage.setItem("otica_client_session", JSON.stringify({
          id: foundClient.id,
          name: foundClient.name,
          expiresAt,
        }));
        toast.success(`Bem-vindo, ${foundClient.name.split(" ")[0]}!`);
        navigate(searchParams.get("redirect") || "/cliente/dashboard");
      } else {
        toast.error("Data de nascimento não confere.");
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      toast.error("Erro ao realizar login: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Estilos inline (design system) ────────────────────────────────────────
  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    height: "44px",
    borderRadius: "12px",
    border: `1.5px solid ${focused ? "#c4121a" : "#ECECEC"}`,
    background: "#FAFAFB",
    paddingLeft: "40px",
    paddingRight: "16px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#1C1C1C",
    outline: "none",
    boxShadow: focused ? "0 0 0 3px rgba(196,18,26,0.1)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  });

  return (
    <div style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif", background: "#F7F7F8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{MOBILE_CSS}</style>


      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", cursor: "pointer", marginBottom: "20px" }} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Ótica Melissa" style={{ height: "44px", objectFit: "contain" }} />
          </div>
          <h1 className="login-title" style={{ fontSize: "24px", fontWeight: 700, color: "#1C1C1C", lineHeight: "32px", margin: "0 0 6px" }}>
            Acesse sua conta
          </h1>
          <p className="login-subtitle" style={{ fontSize: "14px", color: "#6F6F6F", margin: 0 }}>
            Entre com seu CPF e data de nascimento
          </p>
        </div>

        {/* Card */}
        <div className="login-card" style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #ECECEC", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: "32px" }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* CPF */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6F6F6F", marginBottom: "8px" }}>
                CPF cadastrado
              </label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: cpfFocus ? "#c4121a" : "#BABABA", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  onFocus={() => setCpfFocus(true)}
                  onBlur={() => setCpfFocus(false)}
                  maxLength={14}
                  autoComplete="off"
                  style={inputStyle(cpfFocus)}
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6F6F6F", marginBottom: "8px" }}>
                Data de nascimento
              </label>
              <div style={{ position: "relative" }}>
                <Calendar style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: dateFocus ? "#c4121a" : "#BABABA", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onChange={e => setBirthDate(formatDate(e.target.value))}
                  onFocus={() => setDateFocus(true)}
                  onBlur={() => setDateFocus(false)}
                  maxLength={10}
                  autoComplete="off"
                  style={inputStyle(dateFocus)}
                />
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                height: "44px",
                marginTop: "4px",
                borderRadius: "12px",
                background: isLoading ? "#9899f2" : "#c4121a",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />
                  Verificando...
                </>
              ) : (
                <>Entrar <ArrowRight style={{ width: "16px", height: "16px" }} /></>
              )}
            </button>
          </form>

          {/* Rodapé do card */}
          <div style={{ height: "1px", background: "#ECECEC", margin: "24px 0" }} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            <ShieldCheck style={{ width: "14px", height: "14px", color: "#22C55E" }} />
            <span style={{ fontSize: "12px", color: "#9A9A9A", fontWeight: 500 }}>Conexão segura · Sessão expira em 8h</span>
          </div>
        </div>

        {/* Voltar */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#9A9A9A", fontFamily: "inherit", fontWeight: 500 }}>
            <ChevronLeft style={{ width: "14px", height: "14px" }} />
            Voltar ao início
          </button>
        </div>

      </div>
    </div>
  );
}
