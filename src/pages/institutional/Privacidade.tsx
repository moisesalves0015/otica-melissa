import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { ShieldCheck, Lock, Eye, Trash2, UserCheck, Server } from 'lucide-react';

const Privacidade = () => {
  return (
    <InstitutionalLayout 
      title="Política de Privacidade" 
      subtitle="Compromisso total com a segurança e o sigilo dos seus dados pessoais."
      breadcrumb={[{ name: "Privacidade", href: "/privacidade" }]}
    >
      <div className="space-y-12 max-w-4xl mx-auto">
        <section className="space-y-6">
            <div className="flex items-center gap-4 text-slate-900">
                <ShieldCheck className="text-primary" size={28} />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Nosso Compromisso</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
                Na <strong>Ótica Melissa</strong>, valorizamos a confiança que você deposita em nós ao compartilhar seus dados. Esta política explica de forma clara e transparente como coletamos, utilizamos e protegemos suas informações, sempre em conformidade com a <strong>LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018)</strong>.
            </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[30px] bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                    <Eye className="text-primary" size={20} />
                </div>
                <h3 className="font-bold text-slate-900 mb-4">O que coletamos?</h3>
                <ul className="space-y-3 text-slate-500 text-xs leading-relaxed">
                    <li>• <strong>Dados Cadastrais:</strong> Nome, CPF, e-mail e endereço.</li>
                    <li>• <strong>Dados de Saúde:</strong> Receitas oftalmológicas para produção de lentes.</li>
                    <li>• <strong>Dados de Navegação:</strong> Cookies e endereço IP para melhorar sua experiência.</li>
                </ul>
            </div>

            <div className="p-8 rounded-[30px] bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                    <Lock className="text-primary" size={20} />
                </div>
                <h3 className="font-bold text-slate-900 mb-4">Como protegemos?</h3>
                <ul className="space-y-3 text-slate-500 text-xs leading-relaxed">
                    <li>• <strong>Criptografia SSL:</strong> Todos os dados transitam de forma segura.</li>
                    <li>• <strong>Ambiente Seguro:</strong> Servidores monitorados 24/7 contra invasões.</li>
                    <li>• <strong>Acesso Restrito:</strong> Apenas funcionários autorizados acessam seus dados.</li>
                </ul>
            </div>
        </div>

        <section className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="text-primary" size={24} /> Seus Direitos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    "Acesso aos seus dados a qualquer momento",
                    "Correção de informações incompletas ou erradas",
                    "Exclusão definitiva de seus dados cadastrais",
                    "Portabilidade de dados para outro fornecedor",
                    "Informação sobre compartilhamento com parceiros",
                    "Revogação do consentimento para marketing"
                ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="text-slate-600 text-[13px] font-medium">{text}</span>
                    </div>
                ))}
            </div>
        </section>

        <section className="p-10 rounded-[40px] bg-slate-900 text-white space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Server className="text-primary" size={24} /> Compartilhamento com Terceiros
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
                Informamos que, para o funcionamento do e-commerce, compartilhamos dados estritamente necessários com parceiros de confiança:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <p className="font-bold text-white mb-2">Gateways</p>
                    <p className="text-[11px] text-white/40">Processamento seguro de pagamentos (Cartão/PIX).</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <p className="font-bold text-white mb-2">Logística</p>
                    <p className="text-[11px] text-white/40">Correios e transportadoras para entrega do pedido.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <p className="font-bold text-white mb-2">Laboratório</p>
                    <p className="text-[11px] text-white/40">Apenas dados da lente para confecção personalizada.</p>
                </div>
            </div>
        </section>

        <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Cookies</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
                Utilizamos cookies para reconhecer seu navegador e fornecer recursos como o carrinho de compras. Você pode desativar os cookies nas configurações do seu navegador, mas algumas funções do site podem ser limitadas.
            </p>
        </section>

        <div className="p-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs">Última atualização: 09 de Maio de 2026. Ótica Melissa LTDA.</p>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default Privacidade;
