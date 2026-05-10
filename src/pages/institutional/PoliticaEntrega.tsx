import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { Truck, MapPin, ShieldCheck, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

const PoliticaEntrega = () => {
  return (
    <InstitutionalLayout 
      title="Política de Entrega" 
      subtitle="Saiba como cuidamos do envio dos seus óculos até a sua porta."
      breadcrumb={[{ name: "Política de Entrega", href: "/politica-de-entrega" }]}
    >
      <div className="space-y-16">
        {/* Logistics Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Prazos e Processamento</h2>
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-[15px] bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Confirmação do Pedido</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Pedidos realizados via PIX são confirmados instantaneamente. Cartão de crédito pode levar até 24h para análise de segurança.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-[15px] bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Prazo de Produção</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Como cada lente é personalizada, o prazo de laboratório varia entre 3 a 7 dias úteis antes da postagem.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-[15px] bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Cálculo de Frete</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">O valor e o prazo final dependem da sua localização e do método escolhido (Sedex ou PAC).</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-[30px] p-10 border border-slate-100 h-fit">
            <ShieldCheck className="text-primary mb-6" size={40} />
            <h3 className="text-xl font-bold text-slate-900 mb-4">Seguro de Entrega</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Todos os nossos envios possuem seguro total contra extravio ou danos durante o transporte. 
              Caso ocorra qualquer problema, garantimos o reenvio de um novo produto ou o reembolso integral sem burocracia.
            </p>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dica Importante</p>
                <p className="text-slate-900 text-xs font-medium italic">"Sempre confira a embalagem no ato do recebimento. Se houver sinais de violação, recuse a entrega."</p>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-slate-600 leading-relaxed">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-900">
              <AlertTriangle size={20} className="text-primary" />
              <h3 className="font-bold uppercase tracking-tight">Tentativas de Entrega</h3>
            </div>
            <p>Os Correios realizam até 3 tentativas de entrega. Caso não haja ninguém no local para receber, o produto retornará ao nosso centro de distribuição. O reenvio poderá ter custo de frete adicional.</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-900">
              <MapPin size={20} className="text-primary" />
              <h3 className="font-bold uppercase tracking-tight">Endereço Incorreto</h3>
            </div>
            <p>Certifique-se de preencher o endereço corretamente. Caso o produto seja devolvido por endereço incompleto ou incorreto, o cliente será responsável pelos custos do novo envio.</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-900">
              <Clock size={20} className="text-primary" />
              <h3 className="font-bold uppercase tracking-tight">Atrasos Eventuais</h3>
            </div>
            <p>Atrasos podem ocorrer devido a fatores climáticos, greves ou períodos de alta demanda (como Black Friday). Em qualquer caso, nossa equipe monitora proativamente todos os pedidos.</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-900">
              <HelpCircle size={20} className="text-primary" />
              <h3 className="font-bold uppercase tracking-tight">Dúvidas sobre o Rastreio?</h3>
            </div>
            <p>O código de rastreamento pode levar até 24h para ser atualizado no sistema dos Correios após a postagem. Não se preocupe se não aparecer nada imediatamente.</p>
          </div>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default PoliticaEntrega;
