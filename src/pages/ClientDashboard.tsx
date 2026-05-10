import * as React from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Package, LogOut, Calendar, Clock, ChevronRight, ShoppingBag, CreditCard, CheckCircle2, AlertTriangle, MessageCircle, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getClientSession } from "../components/ClientProtectedRoute";

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .dash-main { padding: 20px 12px !important; }
  .dash-header { padding: 0 12px !important; }
  .dash-title { font-size: 22px !important; line-height: 1.2 !important; }
  .dash-stats { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
  .dash-stat-card { padding: 12px 8px !important; }
  .dash-stat-icon { margin-bottom: 8px !important; width: 16px !important; height: 16px !important; }
  .dash-stat-label { font-size: 9px !important; }
  .dash-stat-value { font-size: 18px !important; }
  .dash-order-card { padding: 16px 12px !important; gap: 12px !important; }
  .dash-order-icon-wrap { width: 40px !important; height: 40px !important; }
  .dash-order-info { gap: 12px !important; }
  .dash-order-icon { width: 18px !important; height: 18px !important; }
  .dash-banners { grid-template-columns: 1fr !important; }
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
  bg: "#FDFDFD",
  white: "#FFFFFF",
  border: "#F1F5F9",
  surface: "#F8FAFC",
  primary: "#c4121a",
  primaryLight: "#FFF1F2",
  primaryHover: "#9F1239",
  text: "#0F172A",
  textSec: "#475569",
  textMuted: "#94A3B8",
  success: "#10B981",
  successBg: "#F0FDF4",
  warning: "#F59E0B",
  danger: "#E11D48",
  dangerBg: "#FFF1F2",
};

const card: React.CSSProperties = {
  background: S.white, 
  borderRadius: "24px", 
  border: `1px solid ${S.border}`,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.01)", 
  padding: "24px",
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
  const [availableDates, setAvailableDates] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedPeriod, setSelectedPeriod] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const session = getClientSession();
    if (!session) { navigate("/cliente/login"); return; }
    load(session.id);

    const unsubExams = onSnapshot(doc(db, "settings", "exams"), (doc) => {
        if (doc.exists()) {
            const dates = doc.data().availableDates || [];
            const today = new Date().toISOString().split('T')[0];
            const activeDates = dates.filter((d: any) => {
                const dateStr = typeof d === 'string' ? d : d.date;
                return dateStr >= today;
            }).map((d: any) => {
                if (typeof d === 'string') return { date: d, period: "Ambos" };
                return d;
            });
            setAvailableDates(activeDates);
        }
    });
    return () => unsubExams();
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
    if (isSubmitting) return;

    const fd = new FormData(e.currentTarget);
    const date = fd.get("date") as string;
    const period = fd.get("period") as string;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "appointments"), { 
        clientId: client.id, 
        clientName: client.name, 
        name: client.name,
        whatsapp: client.phone || client.whatsapp || "",
        preferredDate: date, 
        period, 
        status: "Pendente", 
        source: "Portal do Cliente",
        createdAt: serverTimestamp() 
      });
      toast.success(`Agendamento solicitado para ${date.includes("-") ? date.split("-").reverse().join("/") : date}!`);
      setApptOpen(false);
    } catch { toast.error("Erro ao agendar."); }
    finally { setIsSubmitting(false); }
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
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: S.bg, minHeight: "100vh", paddingBottom: "80px" }}>
      <style>{MOBILE_CSS}</style>

      {/* Header */}
      <header className="dash-header" style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${S.border}`, padding: "0 40px", height: "80px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <img src="/logo.png" alt="Ótica Melissa" style={{ height: "42px", objectFit: "contain", cursor: "pointer" }} 
             onClick={() => navigate("/")} />
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }} className="dash-user-name">
            <p style={{ fontSize: "11px", color: S.textMuted, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bem-vindo</p>
            <p style={{ fontSize: "14px", color: S.text, fontWeight: 700, margin: 0 }}>{firstName}</p>
          </div>
          <button onClick={logout} style={{ width: "40px", height: "40px", borderRadius: "14px", border: "none", background: S.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.textSec, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = S.dangerBg; e.currentTarget.style.color = S.danger; }}
            onMouseLeave={e => { e.currentTarget.style.background = S.surface; e.currentTarget.style.color = S.textSec; }}>
            <LogOut style={{ width: "18px", height: "18px" }} />
          </button>
        </div>
      </header>

      <main className="dash-main" style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px" }}>

        {/* Page title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 className="dash-title" style={{ fontSize: "36px", fontWeight: 800, color: S.text, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>Painel do Cliente</h1>
          <p style={{ fontSize: "15px", color: S.textSec, margin: 0, fontWeight: 500 }}>Acompanhe sua visão e seus pedidos em um só lugar.</p>
        </div>

        {/* Stats row */}
        <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
          {[
            { label: "Seus Pedidos", value: orders.length, icon: <Package style={{ width: "20px", height: "20px" }} /> },
            { label: "Parcelas Pagas", value: paid.length, icon: <CheckCircle2 style={{ width: "20px", height: "20px" }} /> },
            { label: "Vencidas", value: overdue.length, icon: <AlertTriangle style={{ width: "20px", height: "20px" }} />, isDanger: overdue.length > 0 },
          ].map((stat, i) => (
            <div key={i} className="dash-stat-card" style={{ ...card, padding: "24px", border: stat.isDanger ? `1px solid ${S.danger}20` : `1px solid ${S.border}` }}>
              <div className="dash-stat-icon" style={{ color: stat.isDanger ? S.danger : S.primary, marginBottom: "16px" }}>
                {stat.icon}
              </div>
              <div>
                <p className="dash-stat-label" style={{ fontSize: "12px", color: S.textMuted, fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
                <p className="dash-stat-value" style={{ fontSize: "28px", fontWeight: 800, color: S.text, margin: 0, lineHeight: 1 }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "40px", background: S.surface, borderRadius: "18px", padding: "6px", width: "fit-content" }}>
          {(["pedidos", "parcelas"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              height: "44px", padding: "0 24px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700,
              background: activeTab === tab ? S.white : "transparent",
              color: activeTab === tab ? S.text : S.textSec,
              boxShadow: activeTab === tab ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: "10px",
            }}>
              {tab === "pedidos" ? <><ShoppingBag style={{ width: "16px", height: "16px" }} /> <span className="dash-tab-label">Pedidos</span></> : <><CreditCard style={{ width: "16px", height: "16px" }} /> <span className="dash-tab-label">Pagamentos</span></>}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "pedidos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "80px 24px" }}>
                <Package style={{ width: "48px", height: "48px", color: S.border, margin: "0 auto 24px" }} />
                <p style={{ fontSize: "15px", color: S.textMuted, fontWeight: 500, margin: 0 }}>Você ainda não possui pedidos registrados.</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="dash-order-card" onClick={() => navigate(`/rastreio?id=${order.id}`)} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02)"; }}>
                <div className="dash-order-info" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <div className="dash-order-icon-wrap" style={{ width: "60px", height: "60px", borderRadius: "18px", background: S.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package className="dash-order-icon" style={{ width: "24px", height: "24px", color: S.primary }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: S.primary, letterSpacing: "0.02em" }}>#{order.orderCode || order.tso || order.id.slice(0, 8).toUpperCase()}</span>
                      <span style={{ ...statusStyle(order.status), borderRadius: "8px", padding: "4px 10px" }}>{order.status}</span>
                    </div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: S.text, margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.serviceType || "Atendimento Óptico"}</p>
                    <p style={{ fontSize: "12px", color: S.textMuted, margin: 0, fontWeight: 500 }}>
                      {toDisplay(order.date || order.createdAt)}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "10px", color: S.textMuted, margin: "0 0 2px 0", fontWeight: 700, textTransform: "uppercase" }}>Total</p>
                    <p style={{ fontSize: "16px", fontWeight: 800, color: S.text, margin: 0, whiteSpace: "nowrap" }}>R$ {Number(order.totalValue || order.total || 0).toFixed(2)}</p>
                  </div>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: S.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight style={{ width: "18px", height: "18px", color: S.textSec }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Installments Tab */}
        {activeTab === "parcelas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {installments.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "80px 24px" }}>
                <CreditCard style={{ width: "48px", height: "48px", color: S.border, margin: "0 auto 24px" }} />
                <p style={{ fontSize: "15px", color: S.textMuted, fontWeight: 500, margin: 0 }}>Nenhum pagamento pendente encontrado.</p>
              </div>
            ) : (() => {
              const grouped: Record<string, any[]> = {};
              installments.forEach(inst => {
                const key = inst.atendimentoId || "Sem Atendimento";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(inst);
              });

              return Object.entries(grouped).map(([atendimentoId, insts]) => {
                const order = orders.find(o => o.id === atendimentoId || o.atendimentoId === atendimentoId);
                const tso = order?.orderCode || order?.tso || atendimentoId.slice(0, 8).toUpperCase();
                const date = order?.date || order?.createdAt || "";
                const orderTitle = `Atendimento ${tso} • ${toDisplay(date)}`;
                const isExpanded = expandedGroups[atendimentoId] || false;

                const toggleGroup = () => {
                    setExpandedGroups(prev => ({ ...prev, [atendimentoId]: !isExpanded }));
                };

                return (
                  <div key={atendimentoId} style={{ ...card, padding: 0, overflow: "hidden", transition: "all 0.3s" }}>
                    <div 
                        onClick={toggleGroup}
                        style={{ padding: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: isExpanded ? S.surface : "transparent" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: S.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CreditCard style={{ width: "20px", height: "20px", color: S.primary }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: S.text, margin: 0 }}>{orderTitle}</h3>
                            <p style={{ fontSize: "13px", color: S.textMuted, margin: "2px 0 0 0", fontWeight: 500 }}>{insts.length} parcelas • Total R$ {insts.reduce((acc, i) => acc + (Number(i.value) || 0), 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                         <span style={{ fontSize: "11px", fontWeight: 800, color: S.primary, background: S.primaryLight, padding: "6px 14px", borderRadius: "10px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {insts.filter(i => i.status === "Pago").length}/{insts.length} Pagas
                         </span>
                         <div style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>
                            <ChevronDown style={{ width: "20px", height: "20px", color: S.textMuted }} />
                         </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                        <div style={{ padding: "0 24px 24px", background: S.white }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", paddingTop: "8px" }}>
                            {insts.map(inst => {
                                const ov = inst.status !== "Pago" && isOverdue(inst.dueDate);
                                const isPaid = inst.status === "Pago";
                                return (
                                <div key={inst.id} style={{ background: S.surface, borderRadius: "18px", padding: "20px", border: isPaid ? `1px solid ${S.success}10` : ov ? `1px solid ${S.danger}10` : "1px solid transparent" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 800, borderRadius: "6px", padding: "4px 10px", background: isPaid ? S.successBg : ov ? S.dangerBg : S.white, color: isPaid ? S.success : ov ? S.danger : S.textSec, border: isPaid || ov ? "none" : `1px solid ${S.border}`, textTransform: "uppercase" }}>
                                            {isPaid ? "Pago" : ov ? "Vencida" : "Pendente"}
                                        </span>
                                        <span style={{ fontSize: "12px", color: S.textMuted, fontWeight: 700 }}>{inst.number === 0 ? "Entrada" : `#${inst.number}`}</span>
                                    </div>
                                    <div style={{ marginBottom: "20px" }}>
                                        <p style={{ fontSize: "22px", fontWeight: 800, color: S.text, margin: "0 0 4px 0" }}>
                                            R$ {Number(inst.value || 0).toFixed(2)}
                                        </p>
                                        <p style={{ fontSize: "12px", color: ov ? S.danger : S.textMuted, margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Calendar style={{ width: "13px", height: "13px" }} />
                                            {isPaid ? `Pago em ${toDisplay(inst.paymentDate || inst.receivedAtBr || "")}` : `Vence em ${toDisplay(inst.dueDate)}`}
                                        </p>
                                    </div>
                                    {!isPaid && (
                                    <button onClick={() => wa(`Olá! Quero pagar a ${inst.number === 0 ? "entrada" : `parcela ${inst.number}`} do ${orderTitle} (R$ ${Number(inst.value).toFixed(2)}).`)}
                                        style={{ width: "100%", height: "40px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: ov ? S.danger : S.text, color: S.white, transition: "all 0.2s" }}>
                                        {ov ? "Regularizar" : "Pagar via Pix"}
                                    </button>
                                    )}
                                </div>
                                );
                            })}
                            </div>
                        </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Bottom Banners */}
        <div className="dash-banners" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "40px" }}>
          <div style={{ background: S.text, borderRadius: "28px", padding: "32px", color: S.white, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 2 }}>
                <MessageCircle style={{ width: "28px", height: "28px", marginBottom: "20px", opacity: 0.8 }} />
                <h3 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px 0" }}>Precisa de ajuda?</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: "0 0 24px 0", fontWeight: 500, lineHeight: 1.5 }}>Nossa equipe está pronta para te atender agora mesmo via WhatsApp.</p>
                <button onClick={() => wa("Olá! Preciso de suporte com meu pedido.")} style={{ height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "none", color: S.white, fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", padding: "0 24px" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
                Suporte WhatsApp
                </button>
            </div>
          </div>
          
          <div style={{ ...card, borderRadius: "28px", padding: "32px", background: S.white }}>
            <Calendar style={{ width: "28px", height: "28px", marginBottom: "20px", color: S.primary }} />
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: S.text, margin: "0 0 8px 0" }}>Novo Exame</h3>
            <p style={{ fontSize: "14px", color: S.textSec, margin: "0 0 24px 0", fontWeight: 500, lineHeight: 1.5 }}>Já faz tempo que você não revisa seu grau? Agende um exame de vista.</p>
            <button onClick={() => setApptOpen(true)} style={{ height: "44px", borderRadius: "14px", background: S.primary, border: "none", color: S.white, fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", padding: "0 24px" }}
              onMouseEnter={e => (e.currentTarget.style.background = S.primaryHover)}
              onMouseLeave={e => (e.currentTarget.style.background = S.primary)}>
              Agendar Agora
            </button>
          </div>
        </div>
      </main>

      {/* Appointment Modal */}
      {apptOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: S.white, borderRadius: "32px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.25)", width: "100%", maxWidth: "460px", overflow: "hidden" }}>
            <div style={{ padding: "32px 32px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: S.text, margin: "0 0 8px 0" }}>Agendar Exame</h2>
                <p style={{ fontSize: "14px", color: S.textSec, margin: 0, fontWeight: 500 }}>Escolha o melhor dia para você.</p>
              </div>
              <button onClick={() => setApptOpen(false)} style={{ width: "40px", height: "40px", borderRadius: "14px", border: "none", background: S.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.textSec }}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleAppt} style={{ padding: "0 32px 40px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Data preferencial</label>
                {availableDates.length > 0 ? (
                    <select 
                        name="date" 
                        required 
                        value={selectedDate}
                        onChange={(e) => {
                            const date = e.target.value;
                            setSelectedDate(date);
                            const dateObj = availableDates.find(d => d.date === date);
                            setSelectedPeriod(dateObj?.period !== "Ambos" ? dateObj?.period || "" : "");
                        }} 
                        style={{ height: "52px", borderRadius: "16px", border: `2px solid ${S.surface}`, background: S.surface, padding: "0 16px", fontSize: "15px", fontWeight: 600, color: S.text, outline: "none", appearance: "none", cursor: "pointer" }}
                    >
                        <option value="">Selecione uma data</option>
                        {availableDates.map(d => (
                            <option key={d.date} value={d.date}>{d.date?.includes("-") ? d.date.split("-").reverse().join("/") : d.date}</option>
                        ))}
                    </select>
                ) : (
                    <input type="date" name="date" required style={{ height: "52px", borderRadius: "16px", border: `2px solid ${S.surface}`, background: S.surface, padding: "0 16px", fontSize: "15px", fontWeight: 600, color: S.text, outline: "none" }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Período preferido</label>
                <select 
                    name="period" 
                    required 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    style={{ height: "52px", borderRadius: "16px", border: `2px solid ${S.surface}`, background: S.surface, padding: "0 16px", fontSize: "15px", fontWeight: 600, color: S.text, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="">Qualquer período</option>
                  {(() => {
                      const selected = availableDates.find(d => d.date === selectedDate);
                      if (!selected || selected.period === "Ambos") {
                          return (
                              <>
                                  <option value="Manhã">Manhã</option>
                                  <option value="Tarde">Tarde</option>
                              </>
                          );
                      }
                      return <option value={selected.period}>{selected.period}</option>;
                  })()}
                </select>
              </div>
              <button type="submit" disabled={isSubmitting} style={{ height: "56px", borderRadius: "16px", background: S.primary, border: "none", color: S.white, fontSize: "16px", fontWeight: 800, cursor: "pointer", opacity: isSubmitting ? 0.6 : 1, transition: "all 0.2s", marginTop: "8px" }}
                onMouseEnter={e => { e.currentTarget.style.background = S.primaryHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = S.primary; e.currentTarget.style.transform = "none"; }}>
                {isSubmitting ? "Processando..." : "Confirmar Agendamento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
