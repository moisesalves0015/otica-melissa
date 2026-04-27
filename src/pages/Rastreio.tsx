import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { Clock, Package, CheckCircle2, Eye, Truck, Wrench, ShieldCheck, MapPin, Calendar, ShoppingBag, CreditCard, FileText, X, ChevronLeft, MessageCircle } from "lucide-react";
import { getClientSession } from "../components/ClientProtectedRoute";

const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
* { box-sizing: border-box; }
@media (max-width: 640px) {
  .r-main { padding: 20px 16px !important; }
  .r-header { padding: 0 16px !important; }
  .r-title { font-size: 22px !important; line-height: 30px !important; }
  .r-step-label { font-size: 9px !important; max-width: 48px !important; }
  .r-step-icon { width: 32px !important; height: 32px !important; }
  .r-details-grid { grid-template-columns: 1fr !important; }
  .r-bottom-grid { grid-template-columns: 1fr !important; }
  .r-actions { flex-wrap: wrap; }
  .r-banner { flex-direction: column !important; align-items: flex-start !important; }
}
`;

const S = { bg:"#F7F7F8",white:"#FFFFFF",border:"#ECECEC",surface:"#FAFAFB",primary:"#c4121a",primaryLight:"#FEE2E2",text:"#1C1C1C",textSec:"#6F6F6F",textMuted:"#9A9A9A",success:"#22C55E",successBg:"#ECFDF3",warning:"#F59E0B",danger:"#EF4444" };
const card: React.CSSProperties = { background:S.white, borderRadius:"20px", border:`1px solid ${S.border}`, boxShadow:"0 4px 20px rgba(0,0,0,0.03)", padding:"24px" };

const STEPS = [
  { status:"Pendente", label:"Recebido", icon:Clock },
  { status:"Em Produção", label:"Laboratório", icon:Wrench },
  { status:"Qualidade", label:"Qualidade", icon:Eye },
  { status:"Pronto para Entrega", label:"Pronto", icon:ShoppingBag },
  { status:"Entregue", label:"Entregue", icon:Truck },
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
  }, []);

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
        getDocs(query(collection(db,"atendimentos"), where("clientId","==",cId), orderBy("createdAt","desc"))),
      ]);
      const il = iSnap.docs.map(d=>({id:d.id,...d.data()}));
      il.sort((a:any,b:any)=>{ const p=(s:string)=>{ if(!s)return 0; if(s.includes("/")){ const[dd,m,y]=s.split("/").map(Number); return new Date(y,m-1,dd).getTime(); } return new Date(s).getTime(); }; return p(a.dueDate)-p(b.dueDate); });
      setInstallments(il);
      setAtendimentos(aSnap.docs.map(d=>({id:d.id,...d.data()})));
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const wa = (msg:string) => window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

  const handleAppt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = toDisplay(fd.get("date") as string);
    const period = fd.get("period") as string;
    try {
      await addDoc(collection(db,"appointments"), { clientId, clientName, date, period, status:"Pendente", createdAt: new Date().toISOString() });
      toast.success("Agendamento solicitado!"); setApptOpen(false);
    } catch { toast.error("Erro ao agendar."); }
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:S.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",padding:"24px"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
        <div style={{width:"40px",height:"40px",border:`3px solid ${S.border}`,borderTopColor:S.primary,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
        <p style={{fontSize:"13px",color:S.textMuted,fontWeight:500}}>Buscando pedido...</p>
      </div>
      <style>{MOBILE_CSS}</style>
    </div>
  );

  if (!orderId) return (
    <div style={{minHeight:"100vh",background:S.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",padding:"24px"}}>
      <div style={{...card,textAlign:"center",maxWidth:"400px",width:"100%",padding:"48px 32px"}}>
        <img src="/logo.png" alt="Ótica Melissa" style={{height:"40px",objectFit:"contain",margin:"0 auto 24px"}}/>
        <h1 style={{fontSize:"20px",fontWeight:700,color:S.text,margin:"0 0 8px"}}>Acesse via QR Code</h1>
        <p style={{fontSize:"14px",color:S.textSec,margin:"0 0 24px"}}>Use o QR Code do canhoto para rastrear seu pedido.</p>
        <button onClick={()=>navigate("/cliente/dashboard")} style={{height:"44px",borderRadius:"12px",background:S.primary,color:"#fff",fontSize:"14px",fontWeight:600,border:"none",cursor:"pointer",width:"100%",fontFamily:"inherit"}}>
          Ir para Meus Pedidos
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );

  const stepIdx = STEPS.findIndex(s => s.status === order?.status);
  const pendingInst = installments.filter(i => i.status !== "Pago");

  return (
    <div style={{fontFamily:"'Inter','Plus Jakarta Sans',system-ui,sans-serif",background:S.bg,minHeight:"100vh",paddingBottom:"48px"}}>
      <style>{MOBILE_CSS}</style>

      {/* Header */}
      <header className="r-header" style={{background:S.white,borderBottom:`1px solid ${S.border}`,padding:"0 40px",height:"64px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <img src="/logo.png" alt="Ótica Melissa" style={{height:"36px",objectFit:"contain",cursor:"pointer"}} onClick={()=>navigate("/")}/>
        <button onClick={()=>navigate("/cliente/dashboard")} style={{height:"36px",padding:"0 16px",borderRadius:"10px",border:`1px solid ${S.border}`,background:S.white,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",fontWeight:600,color:S.textSec,fontFamily:"inherit"}}>
          <ChevronLeft style={{width:"14px",height:"14px"}}/> Meus Pedidos
        </button>
      </header>

      <main className="r-main" style={{maxWidth:"860px",margin:"0 auto",padding:"40px 24px",display:"flex",flexDirection:"column",gap:"24px"}}>

        {/* Title */}
        <div>
          <h1 className="r-title" style={{fontSize:"32px",fontWeight:700,color:S.text,margin:"0 0 4px",lineHeight:"40px"}}>Rastreio do Pedido</h1>
          <p style={{fontSize:"14px",color:S.textSec,margin:0}}>Olá, <strong style={{color:S.text}}>{clientName}</strong>. Acompanhe o status abaixo.</p>
        </div>

        {!order ? (
          <div style={{...card,textAlign:"center",padding:"64px"}}>
            <Package style={{width:"40px",height:"40px",color:S.border,margin:"0 auto 16px"}}/>
            <p style={{fontSize:"14px",color:S.textMuted,fontWeight:500}}>Pedido não encontrado.</p>
          </div>
        ) : (
          <>
            {/* Order card */}
            <div style={{...card,padding:0,overflow:"hidden"}}>
              {/* Card header */}
              <div style={{background:S.text,padding:"24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.5)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.1em"}}>Pedido</p>
                  <p style={{fontSize:"20px",fontWeight:700,color:"#fff",margin:0}}>#{order.tso || order.id.slice(0,8).toUpperCase()}</p>
                </div>
                <span style={{fontSize:"12px",fontWeight:600,borderRadius:"999px",padding:"5px 14px",
                  background: order.status==="Entregue"?"#ECFDF3": order.status==="Pronto para Entrega"?"#D1FAE5": order.status==="Qualidade"?"#EDE9FE": order.status==="Em Produção"?"#DBEAFE": order.status==="Cancelado"?"#FEE2E2":"#FEF3C7",
                  color:    order.status==="Entregue"||order.status==="Pronto para Entrega"?"#15803D": order.status==="Qualidade"?"#6D28D9": order.status==="Em Produção"?"#1D4ED8": order.status==="Cancelado"?"#B91C1C":"#92400E"}}>
                  {order.status}
                </span>
              </div>

              {/* Progress */}
              <div style={{padding:"32px 24px"}}>
                <div style={{position:"relative",marginBottom:"32px"}}>
                  <div style={{position:"absolute",top:"20px",left:0,right:0,height:"2px",background:S.border}}/>
                  <div style={{position:"absolute",top:"20px",left:0,height:"2px",background:S.success,width:`${Math.max(0,(stepIdx/(STEPS.length-1))*100)}%`,transition:"width 1s ease"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",position:"relative"}}>
                    {STEPS.map((step,i)=>{
                      const Icon=step.icon;
                      const done=i<=stepIdx;
                      const active=i===stepIdx;
                      return(
                        <div key={step.status} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"10px"}}>
                          <div className="r-step-icon" style={{width:"40px",height:"40px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:done?S.success:S.white,border:`2px solid ${done?S.success:S.border}`,boxShadow:active?`0 0 0 4px ${S.successBg}`:"",transition:"all 0.4s",zIndex:1}}>
                            <Icon style={{width:"16px",height:"16px",color:done?"#fff":S.textMuted}}/>
                          </div>
                          <span className="r-step-label" style={{fontSize:"10px",fontWeight:600,color:done?S.text:S.textMuted,textAlign:"center",maxWidth:"64px",lineHeight:"14px"}}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order details */}
                <div className="r-details-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginTop:"8px"}}>
                  <div style={{background:S.surface,borderRadius:"14px",border:`1px solid ${S.border}`,padding:"16px",display:"flex",gap:"12px",alignItems:"flex-start"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"10px",border:`1px solid ${S.primaryLight}`,background:S.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Package style={{width:"16px",height:"16px",color:S.primary}}/>
                    </div>
                    <div>
                      <p style={{fontSize:"11px",fontWeight:500,color:S.textMuted,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Serviço</p>
                      <p style={{fontSize:"14px",fontWeight:600,color:S.text,margin:0}}>{order.serviceType||order.items||"Serviço Óptico"}</p>
                    </div>
                  </div>
                  <div style={{background:S.surface,borderRadius:"14px",border:`1px solid ${S.border}`,padding:"16px",display:"flex",gap:"12px",alignItems:"flex-start"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"10px",border:`1px solid ${S.border}`,background:S.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Calendar style={{width:"16px",height:"16px",color:S.primary}}/>
                    </div>
                    <div>
                      <p style={{fontSize:"11px",fontWeight:500,color:S.textMuted,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Previsão</p>
                      <p style={{fontSize:"14px",fontWeight:600,color:S.success,margin:0}}>{toDisplay(order.dueDate)||"A confirmar"}</p>
                    </div>
                  </div>
                </div>

                {/* Guarantee note */}
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px",background:S.successBg,borderRadius:"12px",padding:"14px 16px",marginTop:"16px"}}>
                  <ShieldCheck style={{width:"16px",height:"16px",color:S.success,flexShrink:0,marginTop:"1px"}}/>
                  <p style={{fontSize:"13px",color:"#15803D",margin:0,lineHeight:"20px"}}>Seu pedido está sendo processado com os mais altos padrões de precisão óptica.</p>
                </div>

                {/* Actions */}
                <div className="r-actions" style={{display:"flex",gap:"12px",marginTop:"24px",justifyContent:"flex-end"}}>
                  <button onClick={()=>window.location.reload()} style={{height:"40px",padding:"0 20px",borderRadius:"12px",border:`1px solid ${S.border}`,background:S.white,color:S.textSec,fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    Atualizar status
                  </button>
                  <button onClick={()=>setApptOpen(true)} style={{height:"40px",padding:"0 20px",borderRadius:"12px",border:"none",background:S.primary,color:"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    Agendar exame
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom grid: Carnês + Receitas */}
            <div className="r-bottom-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"16px"}}>
              {/* Carnês */}
              <div style={card}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",border:`1px solid ${S.primaryLight}`,background:S.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <CreditCard style={{width:"16px",height:"16px",color:S.primary}}/>
                  </div>
                  <h2 style={{fontSize:"16px",fontWeight:600,color:S.text,margin:0}}>Meus Carnês</h2>
                </div>
                {pendingInst.length===0 ? (
                  <p style={{fontSize:"13px",color:S.textMuted,textAlign:"center",padding:"24px 0"}}>Nenhuma parcela pendente.</p>
                ) : pendingInst.slice(0,3).map(inst=>(
                  <div key={inst.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:"12px",border:`1px solid ${S.border}`,background:S.surface,marginBottom:"8px"}}>
                    <div>
                      <p style={{fontSize:"15px",fontWeight:700,color:S.text,margin:"0 0 2px"}}>R$ {Number(inst.value).toFixed(2)}</p>
                      <p style={{fontSize:"12px",color:S.textMuted,margin:0}}>Parc. {inst.number} · Vence {toDisplay(inst.dueDate)}</p>
                    </div>
                    <button onClick={()=>wa(`Olá! Quero pagar a parcela ${inst.number} (R$ ${Number(inst.value).toFixed(2)}).`)} style={{height:"32px",padding:"0 14px",borderRadius:"8px",border:"none",background:S.primaryLight,color:S.primary,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      Pix
                    </button>
                  </div>
                ))}
              </div>

              {/* Receitas */}
              <div style={card}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",border:`1px solid ${S.primaryLight}`,background:S.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <FileText style={{width:"16px",height:"16px",color:S.primary}}/>
                  </div>
                  <h2 style={{fontSize:"16px",fontWeight:600,color:S.text,margin:0}}>Minhas Receitas</h2>
                </div>
                {atendimentos.length===0 ? (
                  <p style={{fontSize:"13px",color:S.textMuted,textAlign:"center",padding:"24px 0"}}>Nenhum histórico médico.</p>
                ) : atendimentos.slice(0,3).map(at=>(
                  <div key={at.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:"12px",border:`1px solid ${S.border}`,background:S.surface,marginBottom:"8px"}}>
                    <div>
                      <p style={{fontSize:"14px",fontWeight:600,color:S.text,margin:"0 0 2px"}}>Consulta {at.date}</p>
                      <p style={{fontSize:"12px",color:S.textMuted,margin:0,maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {at.prescription?"Rx: "+at.prescription.slice(0,20)+"...":"Ver detalhes"}
                      </p>
                    </div>
                    <button onClick={()=>setSelectedAtend(at)} style={{height:"32px",padding:"0 14px",borderRadius:"8px",border:"none",background:S.primaryLight,color:S.primary,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      Ver
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Suporte banner */}
            <div className="r-banner" style={{...card,background:S.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <MessageCircle style={{width:"20px",height:"20px",color:"#fff"}}/>
                </div>
                <div>
                  <p style={{fontSize:"16px",fontWeight:600,color:"#fff",margin:"0 0 2px"}}>Precisa de ajuda?</p>
                  <p style={{fontSize:"13px",color:"rgba(255,255,255,0.7)",margin:0}}>Fale com nossa equipe pelo WhatsApp.</p>
                </div>
              </div>
              <button onClick={()=>wa("Olá! Preciso de ajuda com meu pedido.")} style={{height:"40px",padding:"0 20px",borderRadius:"12px",background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                Suporte online
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal: Receita */}
      {selectedAtend && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:"24px"}}>
          <div style={{background:S.white,borderRadius:"20px",border:`1px solid ${S.border}`,boxShadow:"0 8px 30px rgba(0,0,0,0.1)",width:"100%",maxWidth:"420px",overflow:"hidden"}}>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${S.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h2 style={{fontSize:"18px",fontWeight:700,color:S.text,margin:"0 0 2px"}}>Detalhes da Receita</h2>
                <p style={{fontSize:"13px",color:S.textMuted,margin:0}}>Consulta em {selectedAtend.date}</p>
              </div>
              <button onClick={()=>setSelectedAtend(null)} style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${S.border}`,background:S.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:S.textMuted}}>
                <X style={{width:"14px",height:"14px"}}/>
              </button>
            </div>
            <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{background:S.surface,borderRadius:"12px",border:`1px solid ${S.border}`,padding:"16px"}}>
                <p style={{fontSize:"11px",fontWeight:500,color:S.textMuted,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Prescrição (Grau)</p>
                <p style={{fontSize:"14px",fontWeight:500,color:S.text,margin:0,lineHeight:"22px"}}>{selectedAtend.prescription||"Nenhum detalhe de grau registrado."}</p>
              </div>
              <button onClick={()=>wa(`Olá! Tenho uma dúvida sobre minha receita do dia ${selectedAtend.date}.`)} style={{height:"44px",borderRadius:"12px",background:S.primary,color:"#fff",fontSize:"14px",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
                Tirar dúvidas no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agendamento */}
      {apptOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:"24px"}}>
          <div style={{background:S.white,borderRadius:"20px",border:`1px solid ${S.border}`,boxShadow:"0 8px 30px rgba(0,0,0,0.1)",width:"100%",maxWidth:"400px",overflow:"hidden"}}>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${S.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h2 style={{fontSize:"18px",fontWeight:700,color:S.text,margin:"0 0 2px"}}>Agendar Exame</h2>
                <p style={{fontSize:"13px",color:S.textMuted,margin:0}}>Sujeito à confirmação da equipe</p>
              </div>
              <button onClick={()=>setApptOpen(false)} style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${S.border}`,background:S.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:S.textMuted}}>
                <X style={{width:"14px",height:"14px"}}/>
              </button>
            </div>
            <form onSubmit={handleAppt} style={{padding:"24px",display:"flex",flexDirection:"column",gap:"16px"}}>
              <div>
                <label style={{display:"block",fontSize:"12px",fontWeight:500,color:S.textSec,marginBottom:"6px"}}>Data preferencial</label>
                <input type="date" name="date" required style={{width:"100%",height:"44px",borderRadius:"12px",border:`1px solid ${S.border}`,background:S.surface,padding:"0 14px",fontSize:"14px",color:S.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:"12px",fontWeight:500,color:S.textSec,marginBottom:"6px"}}>Período preferido</label>
                <select name="period" style={{width:"100%",height:"44px",borderRadius:"12px",border:`1px solid ${S.border}`,background:S.surface,padding:"0 14px",fontSize:"14px",color:S.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
                  <option value="Manhã">Manhã (09:00 – 12:00)</option>
                  <option value="Tarde">Tarde (13:00 – 18:00)</option>
                </select>
              </div>
              <button type="submit" style={{height:"44px",borderRadius:"12px",background:S.primary,color:"#fff",fontSize:"14px",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
                Confirmar solicitação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
