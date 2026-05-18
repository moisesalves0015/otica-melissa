import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Search,
  User,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  Percent,
  Menu,
  X,
  Instagram,
  Facebook,
  Twitter,
  MessageSquare,
  Lock,
  ChevronLeft,
  Glasses,
  Zap,
  Clock,
  Package,
  Sun,
  Disc,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveSlider } from "@/components/ui/ResponsiveSlider";
import { ClientLoginModal } from "../components/ClientLoginModal";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

// --- Mock Data ---

const ANNOUNCEMENTS = [
  "Atendimento por Whatsapp",
  "5% de desconto no Pix",
  "Frete Grátis Para Todo Brasil",
];

type NavMenuItem = {
  name: string;
  href: string;
  badge?: string;
  categories?: {
    title: string;
    links: string[];
  }[];
  featured?: {
    image: string;
    title: string;
  };
};

const NAV_MENU_DATA: NavMenuItem[] = [
  { name: "Óculos de Grau", href: "/categoria/oculos-de-grau" },
  { name: "Óculos de Sol", href: "/categoria/oculos-de-sol" },
  { name: "Lentes de Contato", href: "/categoria/lentes-de-contato" },
  { name: "Lançamentos", href: "/categoria/lancamentos", badge: "Novo" },
];

const CATEGORIES_DATA = [
  { name: "Óculos de Grau", href: "/categoria/oculos-de-grau", image: "/cat_grau_cut.jpg", imgClass: "w-[85%] max-w-[240px]" },
  { name: "Óculos de Sol", href: "/categoria/oculos-de-sol", image: "/cat_sol_cut.jpg", imgClass: "w-full max-w-[280px]" },
  { name: "Lentes de Contato", href: "/categoria/lentes-de-contato", image: "/cat_lentes_cut.jpg", imgClass: "w-[85%] max-w-[240px]" },
  { name: "Lançamentos", href: "/categoria/lancamentos", image: "/cat_lancamentos_cut.jpg", imgClass: "w-full max-w-[280px]" },
];

const BENEFITS = [
  { icon: Percent, title: "5% OFF no PIX", description: "Economize em cada compra" },
  { icon: ShoppingBag, title: "Até 70% OFF", description: "Produtos selecionados" },
  { icon: CreditCard, title: "12x sem juros", description: "No cartão de crédito" },
  { icon: MapPin, title: "Consultoria Grátis", description: "Especialistas em visagismo" },
];

// Products will be fetched from Firestore

// CATEGORIES and STORES removed to simplify the landing page as requested

export function AnnouncementBar() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-primary text-primary-foreground py-1.5 text-center text-[10px] font-bold overflow-hidden relative h-7 rounded-none">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center uppercase tracking-[0.2em]"
        >
          {ANNOUNCEMENTS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 h-20 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-[0_2px_20px_-10px_rgba(0,0,0,0.1)] border-b border-border/50" : "bg-white border-b border-white"
      }`}
    >
      <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Sheet>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/5 rounded-[20px]">
                <Menu className="h-5 w-5 text-slate-700" />
              </Button>
            } />
            <SheetContent side="left" className="w-[300px] p-0 border-r-0 rounded-r-[20px]">
              <div className="p-6 border-b border-border/50">
                <img src="/logo.png" alt="Ótica Melissa" className="h-10 w-auto object-contain" />
              </div>
              <nav className="flex flex-col p-4">
                {NAV_MENU_DATA.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between p-3 text-sm font-bold hover:bg-muted rounded-[20px] transition-colors"
                  >
                    {item.name}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex flex-col items-start select-none cursor-pointer group">
            <img 
              src="/logo.png" 
              alt="Ótica Melissa" 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-1">
            {NAV_MENU_DATA.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.categories ? (
                  <>
                    <NavigationMenuTrigger className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-[20px] hover:bg-slate-100 data-[state=open]:bg-slate-100 text-slate-600">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-0 md:w-[700px] lg:w-[900px] bg-slate-900 text-white rounded-[20px] border-none overflow-hidden shadow-2xl">
                      <div className="grid grid-cols-12">
                         <div className="col-span-8 p-10 grid grid-cols-3 gap-8">
                          {item.categories.map((cat) => (
                            <div key={cat.title}>
                              <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-primary mb-5">{cat.title}</h4>
                              <ul className="space-y-3">
                                {cat.links.map((link) => (
                                  <li key={link}>
                                    <NavigationMenuLink
                                      href="#"
                                      className="text-[13px] text-white/60 hover:text-white hover:translate-x-1 transition-all inline-block"
                                    >
                                      {link}
                                    </NavigationMenuLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        {item.featured && (
                          <div className="col-span-4 relative group/feat overflow-hidden h-full">
                            <img
                              src={item.featured.image}
                              alt={item.featured.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/feat:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                              <span className="text-white/60 text-[10px] uppercase tracking-widest mb-1">{item.name}</span>
                              <span className="text-white font-black text-xl uppercase tracking-tighter leading-none">{item.featured.title}</span>
                              <Button variant="link" className="text-white p-0 h-auto justify-start text-xs mt-4">
                                Explorar Coleção <ArrowRight className="ml-2 h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    href={item.href}
                    className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-[20px] hover:bg-slate-100 flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    {item.name}
                    {item.badge && (
                      <Badge className="bg-primary text-white text-[9px] px-2 h-4 flex items-center justify-center font-bold rounded-[20px] border-none shadow-sm">
                        {item.badge}
                      </Badge>
                    )}
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden md:flex relative group mr-2">
            <Input
              type="search"
              placeholder="Encontre sua armação..."
              className="pl-10 w-[200px] focus:w-[280px] h-11 bg-slate-100 border-none rounded-[20px] transition-all text-sm focus:ring-0 focus:border-primary"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <ClientLoginModal />
        </div>
      </div>
    </header>
  );
}

const MARQUEE_DESCONTO = Array(8).fill("/selo_desc_exclu.png");
const MARQUEE_PRECOS = Array(8).fill("/selo_melhores_precos.png");

function Hero() {
  return (
    <section className="relative w-full pt-6 md:pt-16 pb-0 overflow-hidden bg-white flex flex-col">
      <div className="max-w-[1440px] mx-auto w-full relative z-10 px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-0">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex justify-center md:justify-center px-6 md:px-0"
          >
            <div className="max-w-md w-full text-center md:text-left flex flex-col items-center md:items-start">
               <span className="text-primary font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] mb-1 block">
                Nova Coleção 2026
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 leading-[1.1] tracking-tighter text-slate-900 uppercase">
                Estilo e <br /> Visão Única
                </h1>
                <p className="text-[14px] md:text-lg text-slate-500 mb-4 md:mb-6 max-w-md leading-relaxed font-medium">
                As melhores armações com lentes de alta tecnologia.
                </p>
                <div className="flex flex-col sm:flex-row gap-5 items-center">
                <Button 
                    size="lg" 
                    className="rounded-[20px] h-12 px-10 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 uppercase tracking-[0.15em] group"
                    onClick={() => window.location.href = "/marketplace"}
                >
                    Conhecer Coleção 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-[1px] bg-slate-200 hidden sm:block" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    12x Sem Juros
                    </span>
                </div>
                </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center relative py-0"
          >
            <div className="relative w-full max-w-[280px] md:max-w-xs lg:max-w-sm z-10 mx-auto md:mx-0">
              <img 
                  src="/hero_woman_no_bg.png" 
                  alt="Ótica Melissa Collection" 
                  className="w-full h-auto object-cover relative z-10"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="py-4 md:py-6 bg-red-600 w-full overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <ResponsiveSlider autoplay={true} autoplayInterval={3500} dotClassName="bg-white/30">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-4 p-2 h-full transition-all cursor-pointer group"
            >
              <benefit.icon className="h-7 w-7 md:h-9 md:w-9 text-white shrink-0 transition-transform group-hover:scale-110" />
              <div className="flex flex-col">
                <h3 className="font-black text-[12px] md:text-[14px] uppercase tracking-wider text-white leading-none">{benefit.title}</h3>
                <p className="text-white/80 text-[10px] md:text-[11px] leading-tight mt-1 font-medium">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </ResponsiveSlider>
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: any; key?: React.Key }) {
  const whatsappNumber = "5521966123495";
  const message = encodeURIComponent(`Olá! Tenho interesse no produto: ${product.name}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div 
      className="group relative overflow-hidden border border-slate-100 rounded-[12px] bg-white hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col p-0 m-0 w-full"
      onClick={() => window.open(whatsappUrl, '_blank')}
    >
      {/* Image - Colada no topo */}
      <div className="relative w-full aspect-square overflow-hidden bg-white p-0 m-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 p-0 m-0 block"
        />
        
        {/* Badge Overlay */}
        <div className="absolute top-2 left-2">
          {product.badge && (
            <Badge className="bg-primary text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border-none">
              {product.badge}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-3 pt-3 pb-0 flex flex-col gap-1.5 flex-grow">
        <h3 className="font-bold text-[13px] md:text-[15px] text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>

        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-black text-slate-950">
              R$ {product.price.toFixed(2)}
            </span>
            {product.originalPrice > 0 && (
              <span className="text-slate-400 text-[11px] md:text-[12px] line-through font-medium">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-primary font-bold uppercase tracking-tight">
             <CreditCard className="h-3 w-3 md:h-3.5 md:w-3.5" /> 10x de R$ {(product.price / 10).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Button - Colado no fundo */}
      <Button
          className="w-full h-11 md:h-12 rounded-none bg-slate-950 text-white hover:bg-primary transition-all duration-300 text-[10px] md:text-[11px] font-black uppercase tracking-widest border-none mt-auto p-0"
      >
          COMPRAR AGORA
      </Button>
    </div>
  );
}



function CategoryBanners() {
  return null; // Section removed as requested
}

function QualitySection() {
    return (
        <section className="py-24 px-6 bg-slate-900 text-white overflow-hidden">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="aspect-[4/5] rounded-[20px] overflow-hidden shadow-2xl border border-white/5">
                        <img src="/hero_trio_distracted_white.png" alt="Qualidade Ótica Melissa" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full border-2 border-primary/20 rounded-[20px]" />
                </motion.div>
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="space-y-6 flex flex-col items-start">
                        <Badge className="w-fit bg-primary/10 text-primary border border-primary/20 rounded-[20px] px-5 py-1.5 font-bold text-[11px] tracking-widest shadow-none uppercase">Qualidade e Precisão</Badge>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">Excelência em Cada Detalhe</h2>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-xl">
                            Na Ótica Melissa, unimos a tradição do atendimento personalizado com a mais alta tecnologia em lentes e armações. Trabalhamos com as melhores marcas do mercado para garantir não apenas estilo, mas a saúde total da sua visão.
                        </p>
                    </div>
                    <Button 
                        className="rounded-[20px] bg-primary text-white hover:bg-primary/90 h-14 px-12 font-bold group uppercase tracking-widest text-xs transition-all border-none"
                        onClick={() => window.location.href = "/marketplace"}
                    >
                        Ver Coleção Completa <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

function StoreSection() {
    return (
        <section className="py-24 px-6 bg-white overflow-hidden">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="space-y-10 order-2 lg:order-1"
                >
                    <div className="space-y-6 flex flex-col items-start">
                        <Badge className="w-fit bg-primary/10 text-primary border border-primary/20 rounded-[20px] px-5 py-1.5 font-bold text-[11px] tracking-widest shadow-none uppercase">Nossa Unidade</Badge>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none text-slate-900">Maestria Melissa</h2>
                        <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">
                            Nossa unidade em Salvador foi projetada para oferecer uma experiência única. Ambiente climatizado, showroom moderno e equipamentos de última geração para sua avaliação visual.
                        </p>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="flex gap-6 items-start group">
                            <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center shrink-0 rounded-[15px] group-hover:bg-primary transition-colors">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl uppercase tracking-tighter text-slate-900">Onde Estamos</h4>
                                <a 
                                    href="https://www.google.com/maps/dir/?api=1&destination=R.+Severino+da+Silva,+40+-+Campo+Grande,+Rio+de+Janeiro+-+RJ,+23075-520" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-slate-500 font-medium hover:text-primary transition-colors"
                                >
                                    R. Severino da Silva, 40 - Campo Grande, Rio de Janeiro - RJ, 23075-520
                                </a>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start group">
                            <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center shrink-0 rounded-[15px] group-hover:bg-primary transition-colors">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl uppercase tracking-tighter text-slate-900">Funcionamento</h4>
                                <p className="text-slate-500 font-medium">Segunda a Sexta: 09h às 18h | Sábados: 09h às 14h</p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        size="lg" 
                        className="rounded-[20px] px-12 h-14 font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-200 group uppercase tracking-widest text-xs transition-all"
                        onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=R.+Severino+da+Silva,+40+-+Campo+Grande,+Rio+de+Janeiro+-+RJ,+23075-520", "_blank")}
                    >
                        COMO CHEGAR <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="order-1 lg:order-2"
                >
                    <div className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-2xl border border-slate-100">
                        <img src="/three_people_glasses.png" alt="Showroom Ótica Melissa" className="w-full h-full object-cover object-top" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export function Footer() {
  const institutionalLinks = [
    { name: "Trocas e Devoluções", href: "/trocas-e-devolucoes" },
    { name: "Dúvidas Frequentes", href: "/faq" },
    { name: "Política de Entrega", href: "/politica-de-entrega" },
    { name: "Cuidados com os Óculos", href: "/cuidados" },
    { name: "Fale Conosco", href: "/contato" }
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 py-16 md:py-24 border-t border-slate-800 mt-auto">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 mb-16">
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/">
                    <img 
                        src="/logo.png" 
                        alt="Ótica Melissa" 
                        className="h-10 w-auto brightness-0 invert" 
                    />
                </Link>
            </div>
            <p className="text-[14px] leading-relaxed max-w-sm">
                Comprometidos em oferecer não apenas óculos, mas uma nova visão de mundo. 
                Excelência técnica, design moderno e atendimento personalizado para sua identidade.
            </p>
            <div className="flex gap-4">
                {['Instagram', 'Facebook', 'WhatsApp'].map((social) => (
                    <a key={social} href="#" className="w-10 h-10 rounded-[15px] border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all">
                        <span className="sr-only">{social}</span>
                        {social === 'Instagram' && <Instagram className="h-4 w-4" />}
                        {social === 'Facebook' && <Facebook className="h-4 w-4" />}
                        {social === 'WhatsApp' && <MessageSquare className="h-4 w-4" />}
                    </a>
                ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h6 className="text-white font-bold text-sm uppercase tracking-widest">Compre Por</h6>
            <ul className="space-y-4 text-[13px]">
              {["Óculos de Grau", "Óculos de Sol", "Lentes de Contato", "Acessórios", "Lançamentos"].map(link => (
                <li key={link}><Link to="#" className="hover:text-white transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-6">
            <h6 className="text-white font-bold text-sm uppercase tracking-widest">Atendimento</h6>
            <ul className="space-y-4 text-[13px]">
              {institutionalLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <a href="https://wa.me/5521966123495" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary font-bold hover:brightness-110 transition-all">
                    <MessageSquare size={16} />
                    WhatsApp: (21) 96612-3495
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
                <p className="text-[11px]">© 2024 Ótica Melissa. Todos os direitos reservados.</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest">
                    <span>CNPJ: 52.173.061/0001-54</span>
                    <Link to="/privacidade" className="hover:text-primary transition-colors text-[10px] uppercase font-medium">Privacidade</Link>
                    <Link to="/termos" className="hover:text-primary transition-colors text-[10px] uppercase font-medium">Termos</Link>
                </div>
            </div>
            
            <div className="flex gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <CreditCard className="h-6 w-6" />
                <Truck className="h-6 w-6" />
                <Package className="h-6 w-6" />
            </div>
        </div>
      </div>
    </footer>
  );
}

const TESTIMONIALS = [
  { 
    name: "Ana Beatriz", 
    image: "/testimonial_1_1778168858266.png",
    text: "Fiquei impressionada com o visagismo! Encontrei óculos que realmente combinam com meu rosto e o atendimento foi super acolhedor." 
  },
  { 
    name: "Ricardo Oliveira", 
    image: "/testimonial_2_1778168883053.png",
    text: "Melhor ótica da região, sem dúvidas. As lentes multifocais ficaram perfeitas e o preço foi muito justo pelo nível da tecnologia." 
  },
  { 
    name: "Juliana Mendes", 
    image: "/testimonial_3_1778168908314.png",
    text: "O agendamento pelo site é muito prático. Fiz o exame gratuito no sábado e já saí com minha armação nova escolhida. Nota 10!" 
  },
  { 
    name: "Fernanda Rocha", 
    image: "/testimonial_real_1.png",
    text: "Atendimento humano de verdade! Levei minha mãe para fazer o exame gratuito no sábado e fomos super bem recebidas. Qualidade excelente." 
  },
  { 
    name: "Marcos Vinicius", 
    image: "/testimonial_real_2.png",
    text: "Sempre tive dificuldade em encontrar óculos que não ficassem pesados no rosto. Na Melissa, a consultoria foi nota mil e o exame computadorizado foi muito rápido." 
  },
  { 
    name: "Beatriz Silva", 
    image: "/testimonial_real_3.png",
    text: "Preço imbatível e entrega antes do prazo. Recomendo muito a Ótica Melissa para quem busca estilo e confiança." 
  }
];

function TestimonialSection() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="bg-slate-900 border-t-4 border-primary mx-auto py-20 rounded-[20px] max-w-[1200px] text-center text-white shadow-[0px_30px_60px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col items-center">
        <h2 className="text-2xl md:text-[3rem] font-black mb-16 text-white uppercase tracking-tighter px-6">O que dizem nossos clientes</h2>
        <div className="w-full">
          <div className="flex overflow-hidden">
            <motion.div 
              className="flex gap-6 py-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            >
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} className="w-[300px] md:w-[400px] shrink-0">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[20px] shadow-[0px_10px_30px_rgba(0,0,0,0.1)] text-left flex flex-col items-start hover:bg-white/10 transition-all group h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-[15px] overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors shrink-0">
                          <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                          <span className="text-[1.1rem] text-white font-bold block">{t.name}</span>
                          <div className="flex gap-1 mt-1">
                              {[1,2,3,4,5].map(s => <span key={s} className="text-primary text-[16px]">★</span>)}
                          </div>
                      </div>
                    </div>
                    <p className="text-[0.9rem] md:text-[1rem] leading-relaxed text-slate-300 mb-2 italic">"{t.text}"</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}



export default function LandingPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [appointmentData, setAppointmentData] = React.useState({
    name: "",
    whatsapp: "",
    preferredDate: "",
    period: ""
  });
  const [availableDates, setAvailableDates] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 15);
    }
    return value.substring(0, 15);
  };

  React.useEffect(() => {
    const q = query(collection(db, "landing_products"), orderBy("order", "asc"));
    const unsubProducts = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(data);
    });

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

    return () => {
        unsubProducts();
        unsubExams();
    };
  }, []);

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
        await addDoc(collection(db, "appointments"), {
            ...appointmentData,
            status: "Pendente",
            source: "Landing Page",
            createdAt: serverTimestamp()
        });
        setShowSuccessModal(true);
        setAppointmentData({ name: "", whatsapp: "", preferredDate: "", period: "" });
    } catch (error: any) {
        toast.error("Erro ao solicitar agendamento: " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-white flex flex-col">
      <Toaster position="top-center" />
      <AnnouncementBar />
      <Header />

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md !rounded-[30px] p-10 border-none shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8">
                <img src="/logo.png" alt="Ótica Melissa" className="h-16 w-auto object-contain" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Quase Tudo Pronto!</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-lg leading-relaxed">
                Recebemos sua solicitação de agendamento. Nossa equipe entrará em contato via WhatsApp em breve para confirmar o melhor horário para você.
              </DialogDescription>
            </DialogHeader>
            <Button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full h-14 mt-10 rounded-[20px] bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
                ENTENDIDO, ATÉ LOGO!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <main className="flex-1 overflow-x-hidden w-full">
        <Hero />
        <Benefits />
        
        {/* CATEGORY ICONS SECTION */}
        <section className="py-12 bg-white w-full">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 whitespace-nowrap">Categorias</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 md:gap-8">
              {CATEGORIES_DATA.map((cat, i) => {
                return (
                  <a key={i} href={cat.href} className="flex flex-col items-center justify-end group gap-1">
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className={`${cat.imgClass} h-auto object-contain mix-blend-multiply transition-all duration-500 group-hover:-translate-y-3 group-hover:scale-105`} 
                    />
                    <span className="text-[8px] sm:text-xs md:text-sm font-bold text-slate-800 uppercase tracking-tighter sm:tracking-widest group-hover:text-primary transition-colors text-center">{cat.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* NEW ARRIVALS WITH DYNAMIC DATA */}
        <section className="py-16 bg-slate-50 w-full">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between mb-8 px-0 lg:px-0">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 whitespace-nowrap">Mais Procurados</h2>
              <Link to="/marketplace">
                <Button variant="link" className="text-primary font-bold text-xs group p-0 h-auto">
                    Ver Todos <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="pb-6 w-full max-w-full overflow-hidden">
                {products.length > 0 ? (
                    <ResponsiveSlider autoplay={true} autoplayInterval={4500}>
                    {products.map((product) => (
                        <div key={product.id} className="py-2 px-1">
                          <ProductCard product={product} />
                        </div>
                    ))}
                    </ResponsiveSlider>
                ) : (
                    <div className="text-center py-10 text-slate-400">Carregando vitrine...</div>
                )}
            </div>
          </div>
        </section>

        {/* Marquee Desconto Banner */}
        <div className="w-full bg-white border-y border-slate-100 py-8 overflow-hidden flex items-center z-20">
          <motion.div 
            className="flex w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12 md:gap-16 items-center pr-12 md:pr-16 shrink-0">
                {MARQUEE_DESCONTO.map((src, j) => (
                  <img 
                    key={j} 
                    src={src} 
                    alt="Desconto Exclusivo" 
                    className="h-12 md:h-20 w-auto object-contain drop-shadow-md shrink-0" 
                  />
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        <QualitySection />
        <StoreSection />

        {/* FREE EXAM SECTION WITH FORM LOGIC */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-white rounded-[20px] border border-slate-200 border-t-4 border-t-primary shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/2 p-12 md:p-20 flex flex-col justify-center bg-slate-900 text-white">
                <Badge className="w-fit mb-8 bg-primary/10 text-primary border border-primary/20 rounded-[20px] px-5 py-1.5 font-bold text-[11px] tracking-widest shadow-none uppercase">VAGAS LIMITADAS — 100% GRATUITO</Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">Sua visão merece o melhor cuidado, sem custo nenhum.</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">Não perca a chance de realizar seu exame computadorizado com tecnologia de ponta. Agende hoje e garanta sua saúde visual gratuitamente.</p>
                <div className="flex items-center gap-4 text-sm font-bold">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-12 h-12 rounded-[20px] border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white/50">{i}</div>)}
                  </div>
                  <span className="text-slate-300 text-xs tracking-wide uppercase">+ de 500 agendamentos</span>
                </div>
              </div>
              <div className="md:w-1/2 p-12 md:p-20 bg-white">
                <h3 className="text-2xl font-bold text-slate-900 mb-10 tracking-tight">Solicitar Agendamento</h3>
                <form className="space-y-6" onSubmit={handleAppointmentSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Nome</label>
                      <Input 
                        placeholder="Nome completo" 
                        className="h-12 rounded-[20px] border-slate-200 bg-slate-50 focus:bg-white focus:ring-0 focus:border-primary transition-all" 
                        value={appointmentData.name}
                        onChange={e => setAppointmentData({...appointmentData, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">WhatsApp</label>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        className="h-12 rounded-[20px] border-slate-200 bg-slate-50 focus:bg-white focus:ring-0 focus:border-primary transition-all" 
                        value={appointmentData.whatsapp}
                        onChange={e => setAppointmentData({...appointmentData, whatsapp: formatWhatsApp(e.target.value)})}
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Data Disponível</label>
                        {availableDates.length > 0 ? (
                            <select 
                                className="w-full h-12 rounded-[20px] border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                                value={appointmentData.preferredDate}
                                onChange={e => {
                                    const dateObj = availableDates.find(d => d.date === e.target.value);
                                    setAppointmentData({
                                        ...appointmentData, 
                                        preferredDate: e.target.value,
                                        period: dateObj?.period !== "Ambos" ? dateObj?.period || "" : ""
                                    });
                                }}
                                required
                            >
                                <option value="" disabled>Selecione uma data</option>
                                {availableDates.map((d: any) => (
                                    <option key={d.date} value={d.date}>
                                        {d.date.split("-").reverse().join("/")}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="h-12 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 flex items-center px-4 text-slate-400 text-sm font-medium italic">
                                Não há datas disponíveis no momento.
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Período</label>
                      <select 
                        className="w-full h-12 rounded-[20px] border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                        value={appointmentData.period}
                        onChange={e => setAppointmentData({...appointmentData, period: e.target.value})}
                        required
                        disabled={!appointmentData.preferredDate}
                      >
                        <option value="" disabled>Qualquer período</option>
                        {(() => {
                            const selected = availableDates.find(d => d.date === appointmentData.preferredDate);
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
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || availableDates.length === 0}
                        className="w-full h-14 md:h-16 rounded-[20px] bg-primary text-white font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all mt-4 px-2"
                    >
                        {isSubmitting ? "SOLICITANDO..." : availableDates.length === 0 ? "SEM DATAS DISPONÍVEIS" : "GARANTIR MEU EXAME GRÁTIS"}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <TestimonialSection />

        {/* Marquee Preços Banner */}
        <div className="w-full bg-white border-t border-slate-100 py-8 overflow-hidden flex items-center z-20">
          <motion.div 
            className="flex w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12 md:gap-16 items-center pr-12 md:pr-16 shrink-0">
                {MARQUEE_PRECOS.map((src, j) => (
                  <img 
                    key={j} 
                    src={src} 
                    alt="Melhores Preços" 
                    className="h-12 md:h-20 w-auto object-contain drop-shadow-md shrink-0" 
                  />
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />

      {/* Privacy Policy Modal */}
      {privacyOpen && (
        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-[24px] p-8 overflow-y-auto max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900 mb-4">Política de Privacidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>Na Ótica Melissa, a sua privacidade é nossa prioridade. Coletamos apenas as informações necessárias para prestar nossos serviços, como nome, CPF e dados de contato para agendamentos e pedidos.</p>
              <h4 className="font-bold text-slate-900">1. Coleta de Dados</h4>
              <p>Seus dados são coletados quando você solicita um exame gratuito ou realiza um pedido em nossa loja. Utilizamos esses dados exclusivamente para processar suas solicitações e manter seu histórico de saúde visual.</p>
              <h4 className="font-bold text-slate-900">2. Segurança</h4>
              <p>Implementamos medidas de segurança técnicas e administrativas para proteger seus dados contra acessos não autorizados e garantir a conformidade com a LGPD (Lei Geral de Proteção de Dados).</p>
              <h4 className="font-bold text-slate-900">3. Seus Direitos</h4>
              <p>Você tem o direito de solicitar a correção, exclusão ou acesso aos seus dados a qualquer momento através do nosso WhatsApp de suporte.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Terms of Use Modal */}
      {termsOpen && (
        <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-[24px] p-8 overflow-y-auto max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900 mb-4">Termos de Uso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>Ao utilizar nosso portal, você concorda com nossos termos de prestação de serviço óptico.</p>
              <h4 className="font-bold text-slate-900">1. Agendamentos</h4>
              <p>Os exames gratuitos estão sujeitos a disponibilidade e devem ser confirmados via WhatsApp.</p>
              <h4 className="font-bold text-slate-900">2. Pedidos e Rastreio</h4>
              <p>As informações de rastreio são atualizadas periodicamente conforme o status de produção em nosso laboratório parceiro.</p>
              <h4 className="font-bold text-slate-900">3. Pagamentos</h4>
              <p>As parcelas e carnês financeiros são de responsabilidade do cliente, e o atraso pode acarretar em restrições conforme o contrato assinado em loja.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/5521966123495" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-[20px] shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
        aria-label="Falar no WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
