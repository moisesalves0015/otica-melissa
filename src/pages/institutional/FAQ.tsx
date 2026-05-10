import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FAQ_DATA = [
  {
    category: "Pedidos e Entrega",
    items: [
      {
        q: "Como acompanho meu pedido?",
        a: "Após a confirmação do pagamento, você receberá um link de rastreio por e-mail e WhatsApp. Além disso, pode consultar o status em tempo real em nosso Portal do Cliente usando seu CPF."
      },
      {
        q: "Qual o prazo de entrega?",
        a: "O prazo varia de acordo com a sua região e a complexidade das lentes (em média 7 a 15 dias úteis). O prazo exato será exibido no checkout ao informar seu CEP."
      },
      {
        q: "Posso retirar na loja física?",
        a: "Sim! Oferecemos retirada gratuita em nossa unidade em Campo Grande, Rio de Janeiro. Escolha 'Retirada na Loja' no momento da compra."
      }
    ]
  },
  {
    category: "Lentes e Receitas",
    items: [
      {
        q: "Como envio minha receita médica?",
        a: "Você pode fazer o upload da receita diretamente na página do produto, enviá-la via WhatsApp após a compra ou anexá-la no Portal do Cliente."
      },
      {
        q: "As lentes possuem proteção UV?",
        a: "Sim! Todas as nossas lentes, inclusive as incolores de grau, possuem proteção UV400 certificada para garantir sua saúde visual."
      },
      {
        q: "O exame de vista é realmente grátis?",
        a: "Sim! Todos os sábados oferecemos exames computadorizados gratuitos em nossa loja física para clientes que desejam renovar seus óculos."
      }
    ]
  },
  {
    category: "Pagamentos e Segurança",
    items: [
      {
        q: "Quais as formas de pagamento?",
        a: "Aceitamos Cartão de Crédito (até 10x sem juros), PIX com desconto progressivo e Boleto Bancário."
      },
      {
        q: "O site é seguro?",
        a: "Sim. Utilizamos criptografia SSL de 256 bits e gateways de pagamento certificados (Mercado Pago/Pagar.me), garantindo que seus dados nunca sejam armazenados em nossos servidores."
      }
    ]
  }
];

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors group"
      >
        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors pr-8">{q}</span>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pb-6 text-slate-500 text-sm leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [search, setSearch] = React.useState("");

  const filteredFaq = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.q.toLowerCase().includes(search.toLowerCase()) || 
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <InstitutionalLayout 
      title="Dúvidas Frequentes" 
      subtitle="Encontre respostas rápidas para as perguntas mais comuns sobre nossos produtos e serviços."
      breadcrumb={[{ name: "FAQ", href: "/faq" }]}
    >
      <div className="space-y-12">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Digite sua dúvida (ex: rastreio, prazo, pagamento)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-16 pl-14 pr-6 rounded-full bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
          />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 gap-12">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((cat, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-6 border-b-2 border-primary w-fit pb-2">
                  {cat.category}
                </h3>
                <div className="bg-slate-50/50 rounded-[30px] px-8 border border-slate-100">
                  {cat.items.map((item, i) => (
                    <FAQItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-400 font-medium">Nenhum resultado encontrado para "{search}".</p>
              <button onClick={() => setSearch("")} className="text-primary font-bold mt-2 hover:underline">Ver todas as dúvidas</button>
            </div>
          )}
        </div>

        {/* Still Have Questions */}
        <div className="flex flex-col md:flex-row items-center justify-between p-10 bg-primary/5 rounded-[30px] border border-primary/10 gap-8 mt-20">
          <div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Não encontrou o que procurava?</h4>
            <p className="text-slate-500 text-sm">Nossa equipe de atendimento humano está online para te ajudar.</p>
          </div>
          <button 
            onClick={() => window.open("https://wa.me/5521966123495", "_blank")}
            className="px-10 h-14 bg-slate-900 text-white font-bold rounded-full hover:scale-105 transition-all uppercase tracking-widest text-xs whitespace-nowrap"
          >
            Abrir Chamado WhatsApp
          </button>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default FAQ;
