import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { Clock, Package, CheckCircle2, Eye, Truck, Wrench, ShieldCheck, Calendar, CreditCard, FileText, X, ChevronLeft, MessageCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { getClientSession } from "../components/ClientProtectedRoute";

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
@media (max-width: 640px) {
  .r-main { padding: 24px 16px !important; }
  .r-header { padding: 0 16px !important; }
  .r-title { font-size: 26px !important; line-height: 1.2 !important; }
  .r-step-label { font-size: 9px !important; max-width: 50px !important; }
  .r-step-icon { width: 34px !important; height: 34px !important; }
  .r-details-grid { grid-template-columns: 1fr !important; }
  .r-bottom-grid { grid-template-columns: 1fr !important; }
  .r-actions { flex-direction: column !important; }
  .r-actions button { width: 100% !important; }
  .r-banner { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
}
`;

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

const STEPS = [
  { status: "Pendente", label: "Recebido", icon: Clock },
  { status: "Em Produção", label: "Laboratório", icon: Wrench },
  { status: "Qualidade", label: "Qualidade", icon: Eye },
  { status: "Pronto para Entrega", label: "Pronto", icon: ShoppingBag },
  { status: "Entregue", label: "Entregue", icon: Truck },
];

function toDisplay(s: string) {
  if (!s) return "—";
  if (s.includes("/")) return s;
  if (s.includes("-") && s.split("-")[0].length === 4) { const [y,m,d]=s.split("-"); return `${d}/${m}/${y}`; }
  return s;
}

export default function Rastreio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = React.useState<any>(null);
  const [clientName, setClientName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [apptOpen, setApptOpen] = React.useState(false);
  const [selectedAtend, setSelectedAtend] = React.useState<any>(null);
  const [whatsapp, setWhatsapp] = React.useState("5511999999999");

  React.useEffect(() => {
    const session = getClientSession();
    if (!session) { navigate(`/cliente/login?redirect=${encodeURIComponent(window.location.pathname+window.location.search)}`); return; }
    setClientId(session.id); setClientName(session.name);
    if (orderId) load(session.id);
    else setLoading(false);
  }, [orderId]);

  const load = async (cId: string) => {
    try {
      const [oSnap, settSnap] = await Promise.all([
        getDoc(doc(db, "orders", orderId!)),
        getDoc(doc(db, "settings", "store")),
      ]);
      if (oSnap.exists()) setOrder({ id: orderId, ...oSnap.data() });
      if (settSnap.exists() && settSnap.data().whatsappPhone) setWhatsapp(settSnap.data().whatsappPhone.replace(/\D/g,""));
      const [iSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db,"installments"), where("clientId","==",cId))),
        getDocs(query(collection(db,"atendimentos"), where("clientId","==",cId))),
      ]);
      const il = iSnap.docs.map(d=>({id:d.id,...d.data()}));
      il.sort((a:any,b:any)=>{ const p=(s:string)=>{ if(!s)return 0; if(s.includes("/")){ const[dd,m,y]=s.split("/").map(Number); return new Date(y,m-1,dd).getTime(); } return new Date(s).getTime(); }; return p(a.dueDate)-p(b.dueDate); });
      setInstallments(il);
      const al = aSnap.docs.map(d=>({id:d.id,...d.data()}));
      al.sort((a:any,b:any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAtendimentos(al);
    } catch(e){ /* Error logged silently */ }
    finally { setLoading(false); }
  };

  const wa = (msg:string) => window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

  const handleAppt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = toDisplay(fd.get("date") as string);
    const period = fd.get("period") as string;
    try {
      await addDoc(collection(db,"appointments"), { clientId, clientName, date, period, status:"Pendente", createdAt: new Date().toISOString(), source: "Rastreio" });
      toast.success("Agendamento solicitado!"); setApptOpen(false);
    } catch { toast.error("Erro ao agendar."); }
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:S.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
        <div style={{width:"40px",height:"40px",border:`3px solid ${S.border}`,borderTopColor:S.primary,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
        <p style={{fontSize:"13px",color:S.textMuted,fontWeight:500}}>Buscando detalhes...</p>
      </div>
      <style>{MOBILE_CSS}</style>
    </div>
  );

  if (!orderId) return (
    <div style={{minHeight:"100vh",background:S.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",padding:"24px"}}>
      <div style={{...card,textAlign:"center",maxWidth:"400px",width:"100%",padding:"48px 32px"}}>
        <img src="/logo.png" alt="Ótica Melissa" style={{height:"42px",objectFit:"contain",margin:"0 auto 24px"}}/>
        <h1 style={{fontSize:"22px",fontWeight:800,color:S.text,margin:"0 0 12px",letterSpacing:"-0.01em"}}>Link Inválido</h1>
        <p style={{fontSize:"15px",color:S.textSec,margin:"0 0 32px",lineHeight:1.6}}>Utilize o QR Code do seu canhoto ou acesse pelo painel do cliente.</p>
        <button onClick={()=>navigate("/cliente/dashboard")} style={{height:"52px",borderRadius:"16px",background:S.primary,color:"#fff",fontSize:"15px",fontWeight:700,border:"none",cursor:"pointer",width:"100%",transition:"all 0.2s"}}>
          Ver Meus Pedidos
        </button>
      </div>
      <style>{MOBILE_CSS}</style>
    </div>
  );

  const stepIdx = STEPS.findIndex(s => s.status === order?.status);
  const pendingInst = installments.filter(i => i.status !== "Pago");

  return (
    <div style={{fontFamily:"'Inter', system-ui, sans-serif",background:S.bg,minHeight:"100vh",paddingBottom:"80px"}}>
      <style>{MOBILE_CSS}</style>

      {/* Header */}
      <header className="r-header" style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${S.border}`,padding:"0 40px",height:"80px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <img src="/logo.png" alt="Ótica Melissa" style={{height:"42px",objectFit:"contain",cursor:"pointer"}} onClick={()=>navigate("/")}/>
        <button onClick={()=>navigate("/cliente/dashboard")} style={{height:"44px",padding:"0 20px",borderRadius:"14px",border:`1px solid ${S.border}`,background:S.white,cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",fontSize:"14px",fontWeight:700,color:S.text,transition:"all 0.2s"}}>
          <ChevronLeft style={{width:"18px",height:"18px"}}/> <span className="r-btn-text">Painel</span>
        </button>
      </header>

      <main className="r-main" style={{maxWidth:"860px",margin:"0 auto",padding:"48px 24px",display:"flex",flexDirection:"column",gap:"24px"}}>

        {/* Title */}
        <div style={{ marginBottom: "8px" }}>
          <h1 className="r-title" style={{fontSize:"36px",fontWeight:800,color:S.text,margin:"0 0 8px",letterSpacing:"-0.02em"}}>Rastreio do Pedido</h1>
          <p style={{fontSize:"15px",color:S.textSec,margin:0,fontWeight:500}}>Pedido atualizado em tempo real para sua segurança.</p>
        </div>

        {!order ? (
          <div style={{...card,textAlign:"center",padding:"80px 24px"}}>
            <Package style={{width:"48px",height:"48px",color:S.border,margin:"0 auto 24px"}}/>
            <p style={{fontSize:"15px",color:S.textMuted,fontWeight:500}}>Pedido não encontrado ou removido.</p>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <div style={{...card,padding:0,overflow:"hidden"}}>
              <div style={{background:S.text,padding:"32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.5)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Protocolo</p>
                  <p style={{fontSize:"22px",fontWeight:800,color:"#fff",margin:0}}>#{order.orderCode || order.tso || order.id.slice(0,8).toUpperCase()}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.5)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Status Atual</p>
                    <span style={{fontSize:"12px",fontWeight:800,borderRadius:"10px",padding:"6px 16px",
                    background: order.status==="Entregue"?S.successBg: order.status==="Pronto para Entrega"?"#D1FAE5": order.status==="Qualidade"?"#EDE9FE": order.status==="Em Produção"?"#DBEAFE":"#FEF3C7",
                    color:    order.status==="Entregue"||order.status==="Pronto para Entrega"?S.success: order.status==="Qualidade"?"#6D28D9": order.status==="Em Produção"?"#1D4ED8":"#92400E",
                    textTransform: "uppercase" }}>
                    {order.status}
                    </span>
                </div>
              </div>

              <div style={{padding:"40px 32px"}}>
                {/* Progress Visual */}
                <div style={{position:"relative",marginBottom:"48px",padding:"0 20px"}}>
                  <div style={{position:"absolute",top:"20px",left:"40px",right:"40px",height:"4px",background:S.surface,borderRadius:"2px"}}/>
                  <div style={{position:"absolute",top:"20px",left:"40px",height:"4px",background:S.success,width: `calc(${(stepIdx/(STEPS.length-1))*100}% - ${stepIdx === 0 ? '0px' : '40px'})`, transition:"width 1s cubic-bezier(0.4, 0, 0.2, 1)",borderRadius:"2px"}}/>
                  
                  <div style={{display:"flex",justifyContent:"space-between",position:"relative"}}>
                    {STEPS.map((step,i)=>{
                      const Icon=step.icon;
                      const done=i<=stepIdx;
                      const active=i===stepIdx;
                      return(
                        <div key={step.status} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}>
                          <div className="r-step-icon" style={{width:"44px",height:"44px",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center",background:done?S.success:S.white,border:`2px solid ${done?S.success:S.border}`,boxShadow:active?`0 0 0 6px ${S.success}20`:"",transition:"all 0.5s",zIndex:1}}>
                            <Icon style={{width:"18px",height:"18px",color:done?"#fff":S.textMuted}}/>
                          </div>
                          <span className="r-step-label" style={{fontSize:"11px",fontWeight:700,color:done?S.text:S.textMuted,textAlign:"center",maxWidth:"64px",lineHeight:1.3}}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="r-details-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
                  <div style={{background:S.surface,borderRadius:"18px",padding:"20px",display:"flex",gap:"16px",alignItems:"center"}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"12px",background:S.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${S.border}`}}>
                      <Package style={{width:"20px",height:"20px",color:S.primary}}/>
                    </div>
                    <div>
                      <p style={{fontSize:"11px",fontWeight:700,color:S.textMuted,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Produto/Serviço</p>
                      <p style={{fontSize:"15px",fontWeight:700,color:S.text,margin:0}}>{order.serviceType||order.items||"Serviço Óptico"}</p>
                    </div>
                  </div>
                  <div style={{background:S.surface,borderRadius:"18px",padding:"20px",display:"flex",gap:"16px",alignItems:"center"}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"12px",background:S.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${S.border}`}}>
                      <Calendar style={{width:"20px",height:"20px",color:S.primary}}/>
                    </div>
                    <div>
                      <p style={{fontSize:"11px",fontWeight:700,color:S.textMuted,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Data de Entrega</p>
                      <p style={{fontSize:"15px",fontWeight:700,color:S.text,margin:0}}>{toDisplay(order.dueDate)||"A definir"}</p>
                    </div>
                  </div>
                </div>

                {/* Info Alert */}
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",background:S.successBg,borderRadius:"16px",padding:"20px",marginTop:"24px"}}>
                  <ShieldCheck style={{width:"20px",height:"20px",color:S.success,flexShrink:0}}/>
                  <p style={{fontSize:"14px",color:"#15803D",margin:0,lineHeight:1.5,fontWeight:500}}>Seu pedido está em conformidade com as especificações médicas e passando por rigorosos testes de qualidade.</p>
                </div>

                {/* Actions */}
                <div className="r-actions" style={{display:"flex",gap:"12px",marginTop:"32px",justifyContent:"flex-end"}}>
                  <button onClick={()=>window.location.reload()} style={{height:"48px",padding:"0 24px",borderRadius:"14px",border:`1px solid ${S.border}`,background:S.white,color:S.textSec,fontSize:"14px",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
                    Atualizar Rastreio
                  </button>
                  <button onClick={()=>setApptOpen(true)} style={{height:"48px",padding:"0 24px",borderRadius:"14px",border:"none",background:S.primary,color:"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
                    Agendar novo Exame
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-sections Grid */}
            <div className="r-bottom-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:"24px"}}>
              {/* Payments */}
              <div style={card}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{width:"40px",height:"40px",borderRadius:"12px",background:S.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <CreditCard style={{width:"20px",height:"20px",color:S.primary}}/>
                    </div>
                    <h2 style={{fontSize:"18px",fontWeight:800,color:S.text,margin:0}}>Pagamentos</h2>
                  </div>
                  {pendingInst.length > 0 && <span style={{ fontSize: "11px", fontWeight: 800, color: S.danger, background: S.dangerBg, padding: "4px 10px", borderRadius: "8px" }}>PENDENTES</span>}
                </div>
                
                {pendingInst.length===0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <CheckCircle2 style={{ width: "32px", height: "32px", color: S.success, margin: "0 auto 12px" }} />
                    <p style={{fontSize:"14px",color:S.textMuted,fontWeight:500}}>Tudo em dia com seus pagamentos.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {pendingInst.slice(0,3).map(inst=>(
                      <div key={inst.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px",borderRadius:"16px",background:S.surface,border:`1px solid ${S.border}`}}>
                        <div>
                          <p style={{fontSize:"17px",fontWeight:800,color:S.text,margin:"0 0 2px"}}>R$ {Number(inst.value).toFixed(2)}</p>
                          <p style={{fontSize:"12px",color:S.textMuted,margin:0,fontWeight:500}}>{inst.number === 0 ? "Entrada" : `Parc. ${inst.number}`} · Vence {toDisplay(inst.dueDate)}</p>
                        </div>
                        <button onClick={()=>wa(`Olá! Quero pagar a ${inst.number === 0 ? "entrada" : `parcela ${inst.number}`} do pedido ${order.orderCode} (R$ ${Number(inst.value).toFixed(2)}).`)} style={{height:"36px",padding:"0 16px",borderRadius:"10px",border:"none",background:S.primary,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
                          Pagar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              <div style={card}>
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"12px",background:S.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <FileText style={{width:"20px",height:"20px",color:S.primary}}/>
                  </div>
                  <h2 style={{fontSize:"18px",fontWeight:800,color:S.text,margin:0}}>Sua Receita</h2>
                </div>
                {atendimentos.length===0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <FileText style={{ width: "32px", height: "32px", color: S.border, margin: "0 auto 12px" }} />
                    <p style={{fontSize:"14px",color:S.textMuted,fontWeight:500}}>Nenhuma receita vinculada.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {atendimentos.slice(0,3).map(at=>(
                      <div key={at.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px",borderRadius:"16px",background:S.surface,border:`1px solid ${S.border}`, cursor: "pointer", transition: "all 0.2s" }} onClick={()=>setSelectedAtend(at)}>
                        <div>
                          <p style={{fontSize:"15px",fontWeight:700,color:S.text,margin:"0 0 2px"}}>Exame em {at.date}</p>
                          <p style={{fontSize:"12px",color:S.textMuted,margin:0,fontWeight:500,maxWidth:"200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {at.prescription || "Visualizar prescrição"}
                          </p>
                        </div>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: S.white, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${S.border}` }}>
                            <ArrowRight style={{width:"16px",height:"16px",color:S.textSec}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Support Banner */}
            <div className="r-banner" style={{...card,background:S.text,border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",padding: "32px", borderRadius: "28px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
                <div style={{width:"56px",height:"56px",borderRadius:"18px",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <MessageCircle style={{width:"28px",height:"28px",color:"#fff"}}/>
                </div>
                <div>
                  <h3 style={{fontSize:"20px",fontWeight:800,color:"#fff",margin:"0 0 4px"}}>Dúvidas sobre o pedido?</h3>
                  <p style={{fontSize:"15px",color:"rgba(255,255,255,0.6)",margin:0,fontWeight:500}}>Nossa equipe de suporte técnico está online.</p>
                </div>
              </div>
              <button onClick={()=>wa(`Olá! Tenho uma dúvida sobre meu pedido #${order.orderCode}.`)} style={{height:"52px",padding:"0 32px",borderRadius:"16px",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
                Falar com Especialista
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal: Receita */}
      {selectedAtend && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"24px"}}>
          <div style={{background:S.white,borderRadius:"32px",boxShadow:"0 30px 60px -12px rgba(0,0,0,0.25)",width:"100%",maxWidth:"460px",overflow:"hidden"}}>
            <div style={{padding:"32px 32px 24px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h2 style={{fontSize:"24px",fontWeight:800,color:S.text,margin:"0 0 8px"}}>Sua Receita</h2>
                <p style={{fontSize:"14px",color:S.textSec,margin:0,fontWeight:500}}>Data do exame: {selectedAtend.date}</p>
              </div>
              <button onClick={()=>setSelectedAtend(null)} style={{width:"40px",height:"40px",borderRadius:"14px",border:"none",background:S.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:S.textSec}}>
                <X style={{width:"20px",height:"20px"}}/>
              </button>
            </div>
            <div style={{padding:"0 32px 40px",display:"flex",flexDirection:"column",gap:"24px"}}>
              <div style={{background:S.surface,borderRadius:"18px",padding:"24px",border:`1px solid ${S.border}`}}>
                <p style={{fontSize:"11px",fontWeight:700,color:S.textMuted,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Prescrição Médica</p>
                <p style={{fontSize:"16px",fontWeight:500,color:S.text,margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{selectedAtend.prescription||"Nenhum detalhe de grau registrado."}</p>
              </div>
              <button onClick={()=>wa(`Olá! Tenho uma dúvida sobre minha receita do dia ${selectedAtend.date}.`)} style={{height:"56px",borderRadius:"16px",background:S.primary,color:"#fff",fontSize:"16px",fontWeight:800,border:"none",cursor:"pointer",transition:"all 0.2s"}}>
                Consultar via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agendamento */}
      {apptOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"24px"}}>
          <div style={{background:S.white,borderRadius:"32px",boxShadow:"0 30px 60px -12px rgba(0,0,0,0.25)",width:"100%",maxWidth:"460px",overflow:"hidden"}}>
            <div style={{padding:"32px 32px 24px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h2 style={{fontSize:"24px",fontWeight:800,color:S.text,margin:"0 0 8px"}}>Agendar Exame</h2>
                <p style={{fontSize:"14px",color:S.textSec,margin:0,fontWeight:500}}>Escolha o melhor dia para você.</p>
              </div>
              <button onClick={() => setApptOpen(false)} style={{ width: "40px", height: "40px", borderRadius: "14px", border: "none", background: S.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.textSec }}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleAppt} style={{ padding: "0 32px 40px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Data preferencial</label>
                <input type="date" name="date" required style={{ height: "52px", borderRadius: "16px", border: `2px solid ${S.surface}`, background: S.surface, padding: "0 16px", fontSize: "15px", fontWeight: 600, color: S.text, outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Período preferido</label>
                <select name="period" required style={{ height: "52px", borderRadius: "16px", border: `2px solid ${S.surface}`, background: S.surface, padding: "0 16px", fontSize: "15px", fontWeight: 600, color: S.text, outline: "none", appearance: "none", cursor: "pointer" }}>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>
              <button type="submit" style={{ height: "56px", borderRadius: "16px", background: S.primary, border: "none", color: S.white, fontSize: "16px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s", marginTop: "8px" }}>
                Confirmar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
