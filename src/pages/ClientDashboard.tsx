import * as React from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Package, LogOut, Calendar, Clock, ChevronRight, ShoppingBag, CreditCard, CheckCircle2, AlertTriangle, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { getClientSession } from "../components/ClientProtectedRoute";

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
* { box-sizing: border-box; }
@media (max-width: 640px) {
  .dash-main { padding: 20px 16px !important; }
  .dash-header { padding: 0 16px !important; }
  .dash-title { font-size: 24px !important; line-height: 32px !important; }
  .dash-stats { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
  .dash-stat-label { font-size: 10px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dash-order-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
  .dash-order-right { border-top: 1px solid #ECECEC; padding-top: 12px; width: 100%; display: flex; justify-content: space-between; align-items: center; }
  .dash-banners { grid-template-columns: 1fr !important; }
  .dash-inst-grid { grid-template-columns: 1fr !important; }
  .dash-tab-label { display: none; }
  .dash-user-name { display: none; }
}
`;

function parseFlexDate(s: string): number {
  if (!s) return 0;
  if (s.includes("/")) { const [d, m, y] = s.split("/").map(Number); return new Date(y, m - 1, d).getTime(); }
  return new Date(s).getTime();
}
function toDisplay(s: string): string {
  if (!s) return "—";
  if (s.includes("/")) return s;
  if (s.includes("-") && s.split("-")[0].length === 4) { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; }
  return s;
}
function isOverdue(dueDate: string): boolean {
  const ts = parseFlexDate(dueDate);
  return ts > 0 && ts < Date.now();
}

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    "Pendente":            { bg: "#FEF3C7", color: "#92400E" },
    "Em Produção":         { bg: "#DBEAFE", color: "#1D4ED8" },
    "Qualidade":           { bg: "#EDE9FE", color: "#6D28D9" },
    "Pronto para Entrega": { bg: "#D1FAE5", color: "#065F46" },
    "Entregue":            { bg: "#ECFDF3", color: "#15803D" },
    "Cancelado":           { bg: "#FEE2E2", color: "#B91C1C" },
  };
  const c = map[status] || { bg: "#F1F5F9", color: "#475569" };
  return { fontSize: "11px", fontWeight: 600, borderRadius: "999px", padding: "2px 10px", background: c.bg, color: c.color, whiteSpace: "nowrap" as const };
}

const S = {
  bg: "#F7F7F8",
  white: "#FFFFFF",
  border: "#ECECEC",
  surface: "#FAFAFB",
  primary: "#c4121a",
  primaryLight: "#FEE2E2",
  primaryHover: "#a50f16",
  text: "#1C1C1C",
  textSec: "#6F6F6F",
  textMuted: "#9A9A9A",
  success: "#22C55E",
  successBg: "#ECFDF3",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
};

const card: React.CSSProperties = {
  background: S.white, borderRadius: "20px", border: `1px solid ${S.border}`,
  boxShadow: "0 4px 20px rgba(0,0,0,0.03)", padding: "24px",
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [apptOpen, setApptOpen] = React.useState(false);
  const [whatsapp, setWhatsapp] = React.useState("5511999999999");
  const [activeTab, setActiveTab] = React.useState<"pedidos" | "parcelas">("pedidos");

  React.useEffect(() => {
    const session = getClientSession();
    if (!session) { navigate("/cliente/login"); return; }
    load(session.id);
  }, [navigate]);

  const load = async (id: string) => {
    try {
      const [cSnap, settSnap] = await Promise.all([
        getDoc(doc(db, "clients", id)),
        getDoc(doc(db, "settings", "store")),
      ]);
      if (cSnap.exists()) setClient({ id: cSnap.id, ...cSnap.data() });
      if (settSnap.exists() && settSnap.data().whatsappPhone)
        setWhatsapp(settSnap.data().whatsappPhone.replace(/\D/g, ""));

      const [oSnap, iSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), where("clientId", "==", id))),
        getDocs(query(collection(db, "installments"), where("clientId", "==", id))),
      ]);
      const ol = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      ol.sort((a: any, b: any) => parseFlexDate(b.createdAt || b.date) - parseFlexDate(a.createdAt || a.date));
      setOrders(ol);
      const il = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      il.sort((a: any, b: any) => parseFlexDate(a.dueDate) - parseFlexDate(b.dueDate));
      setInstallments(il);
    } catch { toast.error("Erro ao carregar dados."); }
    finally { setIsLoading(false); }
  };

  const logout = () => { localStorage.removeItem("otica_client_session"); navigate("/cliente/login"); };
  const wa = (msg: string) => window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

  const overdue = installments.filter(i => i.status !== "Pago" && isOverdue(i.dueDate));
  const paid = installments.filter(i => i.status === "Pago");

  const handleAppt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = toDisplay(fd.get("date") as string);
    const period = fd.get("period") as string;
    try {
      await addDoc(collection(db, "appointments"), { clientId: client.id, clientName: client.name, date, period, status: "Pendente", createdAt: new Date().toISOString() });
      toast.success("Agendamento solicitado!");
      setApptOpen(false);
    } catch { toast.error("Erro ao agendar."); }
  };

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: `3px solid ${S.border}`, borderTopColor: S.primary, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ fontSize: "13px", color: S.textMuted, fontWeight: 500 }}>Carregando...</p>
      </div>
    </div>
  );

  const firstName = client?.name?.split(" ")[0] || "Cliente";

  return (
    <div style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif", background: S.bg, minHeight: "100vh", paddingBottom: "80px" }}>
      <style>{MOBILE_CSS}</style>

      {/* Header */}
      <header className="dash-header" style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <img src="/logo.png" alt="Ótica Melissa" style={{ height: "36px", objectFit: "contain", cursor: "pointer" }} onClick={() => navigate("/")} />
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "12px", color: S.textMuted, fontWeight: 500, margin: 0, lineHeight: "18px" }}>Olá,</p>
            <p style={{ fontSize: "14px", color: S.text, fontWeight: 600, margin: 0, lineHeight: "22px" }}>{firstName}</p>
          </div>
          <button onClick={logout} title="Sair" style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${S.border}`, background: S.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.textMuted, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = S.dangerBg; e.currentTarget.style.color = S.danger; e.currentTarget.style.borderColor = "#FECACA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = S.white; e.currentTarget.style.color = S.textMuted; e.currentTarget.style.borderColor = S.border; }}>
            <LogOut style={{ width: "15px", height: "15px" }} />
          </button>
        </div>
      </header>

      <main className="dash-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>

        {/* Page title */}
        <div style={{ marginBottom: "32px" }}>
          <h1 className="dash-title" style={{ fontSize: "32px", fontWeight: 700, color: S.text, margin: "0 0 4px 0", lineHeight: "40px" }}>Meu Painel</h1>
          <p style={{ fontSize: "14px", color: S.textSec, margin: 0, fontWeight: 400 }}>Acompanhe seus pedidos e pagamentos</p>
        </div>

        {/* Stats row */}
        <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Pedidos", value: orders.length, icon: <Package style={{ width: "18px", height: "18px", color: S.primary }} />, bg: S.primaryLight },
            { label: "Parcelas pagas", value: paid.length, icon: <CheckCircle2 style={{ width: "18px", height: "18px", color: S.primary }} />, bg: S.primaryLight },
            ...(overdue.length > 0 ? [{ label: "Vencidas", value: overdue.length, icon: <AlertTriangle style={{ width: "18px", height: "18px", color: S.danger }} />, bg: S.dangerBg }] : []),
          ].map((stat, i) => (
            <div key={i} style={{ ...card, display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", border: `1px solid ${S.border}`, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <p className="dash-stat-label" style={{ fontSize: "12px", color: S.textMuted, fontWeight: 500, margin: "0 0 2px 0" }}>{stat.label}</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color: S.text, margin: 0, lineHeight: 1 }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: S.white, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "4px", width: "fit-content" }}>
          {(["pedidos", "parcelas"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              height: "36px", padding: "0 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              background: activeTab === tab ? S.primary : "transparent",
              color: activeTab === tab ? "#fff" : S.textSec,
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: "8px",
            }}>
              {tab === "pedidos" ? <><Package style={{ width: "14px", height: "14px" }} /> <span className="dash-tab-label">Pedidos</span></> : <><CreditCard style={{ width: "14px", height: "14px" }} /> <span className="dash-tab-label">Parcelas</span> {overdue.length > 0 && <span style={{ background: S.danger, color: "#fff", borderRadius: "999px", fontSize: "10px", fontWeight: 700, padding: "0 6px", height: "16px", display: "flex", alignItems: "center" }}>{overdue.length}</span>}</>}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "pedidos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {orders.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "64px 24px" }}>
                <ShoppingBag style={{ width: "40px", height: "40px", color: S.border, margin: "0 auto 16px" }} />
                <p style={{ fontSize: "14px", color: S.textMuted, fontWeight: 500, margin: 0 }}>Nenhum pedido encontrado</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} onClick={() => navigate(`/rastreio?id=${order.id}`)} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "16px", transition: "box-shadow 0.15s, border-color 0.15s" }}
                className="dash-order-row"
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = "#D8D8FF"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = S.border; }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", border: `1px solid ${S.primaryLight}`, background: S.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package style={{ width: "18px", height: "18px", color: S.primary }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: S.primary }}>#{order.tso || order.id.slice(0, 8).toUpperCase()}</span>
                      <span style={statusStyle(order.status)}>{order.status}</span>
                    </div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: S.text, margin: "0 0 2px 0" }}>{order.serviceType || "Serviço Óptico"}</p>
                    <p style={{ fontSize: "12px", color: S.textMuted, margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock style={{ width: "11px", height: "11px" }} /> {toDisplay(order.date || order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="dash-order-right" style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "11px", color: S.textMuted, margin: "0 0 2px 0", fontWeight: 500 }}>Total</p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: S.text, margin: 0 }}>R$ {Number(order.totalValue || order.total || 0).toFixed(2)}</p>
                  </div>
                  <ChevronRight style={{ width: "18px", height: "18px", color: S.textMuted }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Installments Tab */}
        {activeTab === "parcelas" && (
          <div className="dash-inst-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {installments.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "64px 24px", gridColumn: "1/-1" }}>
                <CreditCard style={{ width: "40px", height: "40px", color: S.border, margin: "0 auto 16px" }} />
                <p style={{ fontSize: "14px", color: S.textMuted, fontWeight: 500, margin: 0 }}>Nenhuma parcela encontrada</p>
              </div>
            ) : installments.map(inst => {
              const ov = inst.status !== "Pago" && isOverdue(inst.dueDate);
              const isPaid = inst.status === "Pago";
              return (
                <div key={inst.id} style={{ background: S.white, borderRadius: "20px", border: `1px solid ${ov ? "#FECACA" : isPaid ? "#BBF7D0" : S.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, borderRadius: "999px", padding: "3px 12px", background: isPaid ? S.successBg : ov ? S.dangerBg : "#FEF3C7", color: isPaid ? "#15803D" : ov ? S.danger : "#92400E" }}>
                      {isPaid ? "Pago" : ov ? "Vencida" : "Pendente"}
                    </span>
                    <span style={{ fontSize: "12px", color: S.textMuted, fontWeight: 500 }}>Parc. {inst.number}/{inst.totalInstallments}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "24px", fontWeight: 700, color: isPaid ? "#15803D" : ov ? S.danger : S.text, margin: "0 0 4px 0" }}>
                      R$ {Number(inst.value || 0).toFixed(2)}
                    </p>
                    <p style={{ fontSize: "12px", color: ov ? S.danger : S.textMuted, margin: 0, display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                      {ov && <AlertTriangle style={{ width: "12px", height: "12px" }} />}
                      <Calendar style={{ width: "12px", height: "12px" }} />
                      {isPaid ? `Pago em ${toDisplay(inst.paymentDate)}` : ov ? `Venceu em ${toDisplay(inst.dueDate)}` : `Vence em ${toDisplay(inst.dueDate)}`}
                    </p>
                  </div>
                  {!isPaid && (
                    <button onClick={() => wa(`Olá! Quero pagar a parcela ${inst.number} (R$ ${Number(inst.value).toFixed(2)}).`)}
                      style={{ height: "40px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, background: ov ? S.danger : S.primary, color: "#fff", transition: "opacity 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                      {ov ? "Regularizar via WhatsApp" : "Pagar via Pix"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Banners */}
        <div className="dash-banners" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "32px" }}>
          <div style={{ background: S.primary, borderRadius: "20px", padding: "32px", color: "#fff", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: "20px", height: "20px" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 4px 0" }}>Precisa de ajuda?</h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0 }}>Fale com nossa equipe pelo WhatsApp.</p>
            </div>
            <button onClick={() => wa("Olá! Preciso de suporte com meu pedido.")} style={{ height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s", width: "fit-content", padding: "0 20px" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
              Suporte online
            </button>
          </div>
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", border: `1px solid ${S.border}`, background: S.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar style={{ width: "20px", height: "20px", color: S.primary }} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: S.text, margin: "0 0 4px 0" }}>Agendar exame</h3>
              <p style={{ fontSize: "13px", color: S.textSec, margin: 0 }}>Renove sua receita com um novo exame de vista.</p>
            </div>
            <button onClick={() => setApptOpen(true)} style={{ height: "40px", borderRadius: "12px", background: S.primary, border: "none", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s", width: "fit-content", padding: "0 20px" }}
              onMouseEnter={e => (e.currentTarget.style.background = S.primaryHover)}
              onMouseLeave={e => (e.currentTarget.style.background = S.primary)}>
              Solicitar agendamento
            </button>
          </div>
        </div>
      </main>

      {/* Appointment Modal */}
      {apptOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
          <div style={{ background: S.white, borderRadius: "20px", border: `1px solid ${S.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.10)", width: "100%", maxWidth: "420px", overflow: "hidden" }}>
            <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: S.text, margin: "0 0 2px 0" }}>Agendar Exame</h2>
                <p style={{ fontSize: "13px", color: S.textMuted, margin: 0 }}>Escolha data e período de preferência</p>
              </div>
              <button onClick={() => setApptOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${S.border}`, background: S.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.textMuted }}>
                <X style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
            <form onSubmit={handleAppt} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: S.textSec }}>Data preferencial</label>
                <input type="date" name="date" required style={{ height: "44px", borderRadius: "12px", border: `1px solid ${S.border}`, background: S.surface, padding: "0 14px", fontSize: "14px", color: S.text, outline: "none", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: S.textSec }}>Período preferido</label>
                <select name="period" style={{ height: "44px", borderRadius: "12px", border: `1px solid ${S.border}`, background: S.surface, padding: "0 14px", fontSize: "14px", color: S.text, outline: "none", fontFamily: "inherit" }}>
                  <option value="Manhã">Manhã (09:00 – 12:00)</option>
                  <option value="Tarde">Tarde (13:00 – 18:00)</option>
                </select>
              </div>
              <p style={{ fontSize: "12px", color: S.textMuted, margin: "4px 0 0", textAlign: "center" }}>Sujeito à confirmação da equipe.</p>
              <button type="submit" style={{ height: "44px", borderRadius: "12px", background: S.primary, border: "none", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                Confirmar solicitação
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        @media (max-width: 640px) {
          main { padding: 24px 16px !important; }
          header { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  );
}
