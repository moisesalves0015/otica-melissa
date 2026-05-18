import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { RefreshCcw, Package, Clock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const TrocasDevolucoes = () => {
  const steps = [
    {
      icon: <AlertCircle className="text-primary" size={24} />,
      title: "Solicitação",
      desc: "Entre em contato via WhatsApp ou e-mail em até 24h após o recebimento."
    },
    {
      icon: <Package className="text-primary" size={24} />,
      title: "Envio",
      desc: "Enviamos um código de postagem gratuita para você nos devolver o produto."
    },
    {
      icon: <Clock className="text-primary" size={24} />,
      title: "Análise",
      desc: "Após recebermos, nosso time técnico analisa o estado do produto em até 3 dias."
    },
    {
      icon: <CheckCircle2 className="text-primary" size={24} />,
      title: "Resolução",
      desc: "Realizamos o estorno, troca por outro modelo ou crédito em loja."
    }
  ];

  return (
    <InstitutionalLayout 
      title="Trocas e Devoluções" 
      subtitle="Transparência e respeito em cada etapa do seu processo de troca."
      breadcrumb={[{ name: "Trocas e Devoluções", href: "/trocas-e-devolucoes" }]}
    >
      <div className="space-y-16">
        {/* Intro Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-[24px] bg-slate-50 border border-slate-100">
            <RefreshCcw className="text-primary mb-4" size={32} />
            <h3 className="font-bold text-xl text-slate-900 mb-2">Arrependimento</h3>
            <p className="text-slate-500 text-sm">Você tem até 24h para desistir da compra por qualquer motivo.</p>
          </div>
          <div className="p-8 rounded-[24px] bg-slate-50 border border-slate-100">
            <ShieldCheck className="text-primary mb-4" size={32} />
            <h3 className="font-bold text-xl text-slate-900 mb-2">Garantia</h3>
            <p className="text-slate-500 text-sm">90 dias de garantia contra defeitos de fabricação em armações e lentes.</p>
          </div>
          <div className="p-8 rounded-[24px] bg-slate-50 border border-slate-100">
            <Package className="text-primary mb-4" size={32} />
            <h3 className="font-bold text-xl text-slate-900 mb-2">Frete Grátis</h3>
            <p className="text-slate-500 text-sm">A primeira troca é totalmente por nossa conta, sem custos de envio.</p>
          </div>
        </div>

        {/* Process Timeline */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Como funciona o processo</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="p-6 h-full rounded-[24px] bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="mb-4">{step.icon}</div>
                  <h4 className="font-bold text-slate-900 mb-2">{idx + 1}. {step.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Info */}
        <div className="prose prose-slate max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Condições para Troca</h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li>• O produto deve estar acompanhado da Nota Fiscal.</li>
                <li>• Não deve apresentar sinais de uso (exceto em casos de vício oculto).</li>
                <li>• Deve ser enviado na embalagem original, com todos os acessórios (estojo, flanela).</li>
                <li>• Brindes enviados também devem ser devolvidos em caso de cancelamento total.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Opções de Restituição</h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li>• <strong>Estorno no Cartão:</strong> O valor aparece em até 2 faturas subsequentes.</li>
                <li>• <strong>PIX:</strong> O reembolso é feito em até 48h após a análise técnica.</li>
                <li>• <strong>Vale-Compra:</strong> Crédito imediato em nosso site para nova escolha.</li>
                <li>• <strong>Substituição:</strong> Envio de um novo produto idêntico ou similar.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 rounded-[30px] p-10 text-center">
          <h3 className="text-white font-bold text-2xl mb-4 uppercase tracking-tight">Ainda tem dúvidas?</h3>
          <p className="text-white/60 text-sm mb-8 max-w-lg mx-auto">Nosso time de suporte está pronto para te ajudar com qualquer processo de troca ou devolução.</p>
          <button 
            onClick={() => window.open("https://wa.me/5521966123495", "_blank")}
            className="px-10 h-14 bg-primary text-white font-bold rounded-full hover:scale-105 transition-all uppercase tracking-widest text-xs"
          >
            Falar com Suporte
          </button>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default TrocasDevolucoes;
