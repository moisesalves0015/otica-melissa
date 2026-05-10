import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { User, Calendar, ArrowRight, ShieldCheck, ChevronLeft, Lock } from "lucide-react";

const SESSION_DURATION_HOURS = 8;

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
input::placeholder { color: #94A3B8 !important; }
@media (max-width: 480px) {
  .login-card { padding: 32px 24px !important; }
  .login-title { font-size: 24px !important; }
  .login-subtitle { font-size: 14px !important; }
  .login-wrap { padding: 16px !important; }
}
`;

const S = {
  bg: "#FDFDFD",
  white: "#FFFFFF",
  border: "#F1F5F9",
  surface: "#F8FAFC",
  primary: "#c4121a",
  primaryHover: "#9F1239",
  text: "#0F172A",
  textSec: "#475569",
  textMuted: "#94A3B8",
  success: "#10B981",
};

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

      const snap1 = await getDocs(query(collection(db, "clients"), where("cpf", "==", fmtCpf), limit(1)));
      if (!snap1.empty) {
        foundClient = { id: snap1.docs[0].id, ...snap1.docs[0].data() };
      }

      if (!foundClient) {
        const snap2 = await getDocs(query(collection(db, "clients"), where("cpf", "==", cleanCpf), limit(1)));
        if (!snap2.empty) {
          foundClient = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
        }
      }

      if (!foundClient) {
        toast.error("Cliente não encontrado. Verifique o CPF informado.");
        return;
      }

      const dbBirth = (foundClient.birthDate || "").replace(/\D/g, "");

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
      toast.error("Erro ao realizar login: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    height: "56px",
    borderRadius: "16px",
    border: `2px solid ${focused ? S.primary : S.surface}`,
    background: S.surface,
    paddingLeft: "48px",
    paddingRight: "16px",
    fontSize: "15px",
    fontWeight: 600,
    color: S.text,
    outline: "none",
    boxShadow: focused ? `0 0 0 4px ${S.primary}10` : "none",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit",
    boxSizing: "border-box",
  });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: S.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{MOBILE_CSS}</style>

      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Logo Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", cursor: "pointer", marginBottom: "24px", transition: "transform 0.2s" }} onClick={() => navigate("/")} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <img src="/logo.png" alt="Ótica Melissa" style={{ height: "48px", objectFit: "contain" }} />
          </div>
          <h1 className="login-title" style={{ fontSize: "32px", fontWeight: 800, color: S.text, margin: "0 0 8px", letterSpacing: "-0.025em" }}>
            Portal do Cliente
          </h1>
          <p className="login-subtitle" style={{ fontSize: "16px", color: S.textSec, margin: 0, fontWeight: 500 }}>
            Gerencie seus pedidos e consultas com segurança.
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card" style={{ background: S.white, borderRadius: "28px", border: `1px solid ${S.border}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.02)", padding: "40px" }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* CPF Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CPF do Cliente
              </label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: cpfFocus ? S.primary : S.textMuted, pointerEvents: "none", transition: "color 0.2s" }} />
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

            {/* Birth Date Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Data de Nascimento
              </label>
              <div style={{ position: "relative" }}>
                <Calendar style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: dateFocus ? S.primary : S.textMuted, pointerEvents: "none", transition: "color 0.2s" }} />
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                height: "56px",
                marginTop: "8px",
                borderRadius: "16px",
                background: isLoading ? S.primary + "80" : S.primary,
                color: "#fff",
                fontSize: "16px",
                fontWeight: 800,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={e => { if(!isLoading) { e.currentTarget.style.background = S.primaryHover; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { if(!isLoading) { e.currentTarget.style.background = S.primary; e.currentTarget.style.transform = "none"; } }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Verificando...
                </>
              ) : (
                <>Acessar Painel <ArrowRight style={{ width: "20px", height: "20px" }} /></>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div style={{ height: "1px", background: S.border, margin: "32px 0" }} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", color: S.textMuted }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck style={{ width: "16px", height: "16px", color: S.success }} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Ambiente Seguro</span>
            </div>
            <span style={{ fontSize: "12px" }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Lock style={{ width: "14px", height: "14px" }} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Ótica Melissa</span>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: S.textSec, fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = S.text} onMouseLeave={e => e.currentTarget.style.color = S.textSec}>
            <ChevronLeft style={{ width: "18px", height: "18px" }} />
            Voltar ao início
          </button>
        </div>

      </div>
    </div>
  );
}
