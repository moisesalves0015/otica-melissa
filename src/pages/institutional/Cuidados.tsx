import React from 'react';
import { InstitutionalLayout } from '../../layouts/InstitutionalLayout';
import { Sun, Droplets, Shield, Glasses, AlertCircle, Sparkles } from 'lucide-react';

const Cuidados = () => {
  const tips = [
    {
      title: "Limpeza Correta",
      icon: <Droplets className="text-primary" />,
      desc: "Lave suas lentes com água corrente fria e sabão neutro. Evite álcool ou produtos químicos, pois podem danificar o tratamento da lente."
    },
    {
      title: "Pano Ideal",
      icon: <Sparkles className="text-primary" />,
      desc: "Use sempre a flanela de microfibra que acompanha seus óculos. Toalhas de papel ou roupas podem causar riscos permanentes."
    },
    {
      title: "Calor Excessivo",
      icon: <Sun className="text-primary" />,
      desc: "Nunca deixe seus óculos no painel do carro ou expostos ao sol forte por muito tempo. O calor pode deformar a armação e craquelar as lentes."
    },
    {
      title: "Manuseio",
      icon: <Glasses className="text-primary" />,
      desc: "Sempre coloque e retire os óculos com as duas mãos. Isso evita o desalinhamento das hastes e o afrouxamento dos parafusos."
    }
  ];

  return (
    <InstitutionalLayout 
      title="Cuidados com os Óculos" 
      subtitle="Guia prático para manter sua visão clara e prolongar a vida útil dos seus óculos."
      breadcrumb={[{ name: "Cuidados", href: "/cuidados" }]}
    >
      <div className="space-y-16">
        {/* Intro Section */}
        <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-6">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                    Seus óculos merecem <span className="text-primary">atenção especial.</span>
                </h2>
                <p className="text-slate-600 leading-relaxed">
                    Um par de óculos é um investimento na sua saúde e no seu estilo. Com os cuidados certos, você garante que suas lentes mantenham a nitidez original e sua armação permaneça confortável por muito mais tempo.
                </p>
                <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl text-white">
                    <Shield size={32} className="text-primary shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Garantia Ótica Melissa</p>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest">Cuidando de você há mais de 10 anos</p>
                    </div>
                </div>
            </div>
            <div className="md:w-1/2 relative">
                <img 
                    src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800" 
                    alt="Limpando óculos" 
                    className="rounded-[30px] shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 p-6 bg-white rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                    <p className="text-slate-900 font-bold text-lg mb-1">Dica de Especialista</p>
                    <p className="text-slate-500 text-sm max-w-[200px]">"Nunca use sabonetes perfumados ou com hidratante nas lentes."</p>
                </div>
            </div>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tips.map((tip, idx) => (
                <div key={idx} className="p-8 rounded-[30px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                        {tip.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-3">{tip.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{tip.desc}</p>
                </div>
            ))}
        </div>

        {/* What to Avoid */}
        <div className="bg-slate-50 rounded-[40px] p-12 border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-2">
                <AlertCircle className="text-primary" /> O que você deve evitar:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold">1</div>
                    <p className="text-sm font-bold text-slate-900">Praia e Mar</p>
                    <p className="text-xs text-slate-500 leading-relaxed">A areia e o sal podem riscar as lentes e oxidar partes metálicas da armação. Lave sempre com água doce após o uso.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold">2</div>
                    <p className="text-sm font-bold text-slate-900">Suor e Perfumes</p>
                    <p className="text-xs text-slate-500 leading-relaxed">A acidez do suor e os químicos de perfumes/cremes podem desgastar o revestimento das hastes e o antirreflexo das lentes.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold">3</div>
                    <p className="text-sm font-bold text-slate-900">Uso no Topo da Cabeça</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Este hábito deforma as hastes e deixa as dobradiças frouxas, fazendo com que os óculos escorreguem do rosto.</p>
                </div>
            </div>
        </div>
      </div>
    </InstitutionalLayout>
  );
};

export default Cuidados;
