import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { FileText, Scale, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const Termos = () => {
  return (
    <InstitutionalLayout 
      title="Termos de Uso" 
      subtitle="Regras e condições para utilização de nossa plataforma e serviços."
      breadcrumb={[{ name: "Termos", href: "/termos" }]}
    >
      <div className="space-y-12 max-w-4xl mx-auto">
        <section className="p-8 rounded-[30px] bg-primary/5 border border-primary/10">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Scale className="text-primary" size={24} /> Aceite dos Termos
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
                Ao acessar e utilizar o site da <strong>Ótica Melissa</strong>, você concorda automaticamente com os termos e condições aqui descritos. Caso não concorde com qualquer parte destes termos, recomendamos que não utilize nossa plataforma.
            </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-900">
                    <User className="text-primary" size={24} />
                    <h3 className="font-bold uppercase tracking-tight">Cadastro e Conta</h3>
                </div>
                <div className="text-slate-600 text-sm space-y-4">
                    <p>O usuário é responsável pela veracidade dos dados informados no cadastro. A conta é pessoal e intransferível, sendo o usuário o único responsável pela segurança de sua senha.</p>
                    <p>Menores de 18 anos devem ser representados por seus responsáveis legais para realizar compras.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-900">
                    <CreditCard className="text-primary" size={24} />
                    <h3 className="font-bold uppercase tracking-tight">Pagamentos e Pedidos</h3>
                </div>
                <div className="text-slate-600 text-sm space-y-4">
                    <p>Todos os preços estão sujeitos a alteração sem aviso prévio. A conclusão do pedido está sujeita à confirmação de estoque e aprovação da operadora de pagamento.</p>
                    <p>Lentes graduadas personalizadas só entrarão em produção após o recebimento e validação da receita médica.</p>
                </div>
            </div>
        </div>

        <section className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-primary" size={24} /> Propriedade Intelectual
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
                Todo o conteúdo deste site (textos, imagens, logotipos, vídeos) é de propriedade exclusiva da Ótica Melissa ou de seus parceiros e está protegido pelas leis de direitos autorais e propriedade industrial. É proibida qualquer reprodução sem autorização prévia por escrito.
            </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="text-primary" size={16} /> Limitações
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Não nos responsabilizamos por danos causados por mau uso dos produtos ou por erros na prescrição médica enviada.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="text-primary" size={16} /> Disponibilidade
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Trabalhamos para manter o site online 24/7, mas não garantimos isenção de falhas técnicas eventuais.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Scale className="text-primary" size={16} /> Foro
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Para dirimir quaisquer controvérsias, fica eleito o foro da comarca da Capital do Estado do Rio de Janeiro.</p>
            </div>
        </section>

        <div className="p-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs">Versão 1.2 - Atualizada em Maio de 2026.</p>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default Termos;
