import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Contato = () => {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
        await addDoc(collection(db, "contacts"), {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            createdAt: serverTimestamp(),
            status: "Nova"
        });
        
        toast.success("Mensagem enviada com sucesso! Responderemos em breve.");
        form.reset();
    } catch (error: any) {
        toast.error("Erro ao enviar mensagem: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <InstitutionalLayout 
      title="Fale Conosco" 
      subtitle="Estamos aqui para ouvir você. Escolha o canal de sua preferência."
      breadcrumb={[{ name: "Contato", href: "/contato" }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-12">
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Nossos Canais</h2>
                <div className="space-y-8">
                    <div className="flex gap-6 items-start group">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-all duration-300">
                            <MessageSquare className="text-primary group-hover:text-white transition-colors" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">WhatsApp Suporte</h4>
                            <a href="https://wa.me/5521966123495" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                                (21) 96612-3495
                            </a>
                            <p className="text-slate-500 text-xs mt-1">Resposta média: 15 minutos</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
                            <Mail className="text-white" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">E-mail</h4>
                            <p className="text-slate-500 text-sm">Carlacmenezzes@gmail.com</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                            <MapPin className="text-slate-900" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">Loja Física</h4>
                            <p className="text-slate-500 text-sm">R. Severino da Silva, 40 - Campo Grande, RJ</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Clock className="text-slate-900" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">Horário de Atendimento</h4>
                            <p className="text-slate-500 text-sm">Seg a Sex: 09h às 18h | Sáb: 09h às 14h</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-[30px] bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4">CNPJ Empresa</h4>
                <p className="text-slate-500 text-sm mb-1">Ótica Melissa LTDA</p>
                <p className="text-slate-500 text-sm">52.173.061/0001-54</p>
            </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
            <div className="bg-slate-50/50 rounded-[40px] p-8 md:p-12 border border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Envie uma mensagem</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                            <Input name="name" placeholder="Como podemos te chamar?" className="h-14 rounded-2xl bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                            <Input name="email" type="email" placeholder="exemplo@email.com" className="h-14 rounded-2xl bg-white border-slate-200" required />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assunto</label>
                        <select name="subject" className="w-full h-14 rounded-2xl bg-white border border-slate-200 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                            <option>Dúvida sobre Produto</option>
                            <option>Status do Pedido</option>
                            <option>Troca ou Devolução</option>
                            <option>Reclamação ou Sugestão</option>
                            <option>Outros</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mensagem</label>
                        <textarea 
                            name="message"
                            rows={5}
                            placeholder="Descreva detalhadamente o que você precisa..."
                            className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            required
                        />
                    </div>

                    <Button 
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-[20px] bg-slate-900 text-white font-bold uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                    >
                        {loading ? "ENVIANDO..." : (
                            <>ENVIAR MENSAGEM <Send size={16} className="ml-2" /></>
                        )}
                    </Button>
                </form>
            </div>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default Contato;
