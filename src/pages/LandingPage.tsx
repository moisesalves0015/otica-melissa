import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
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
  { name: "Óculos de Grau", href: "#" },
  { name: "Óculos de Sol", href: "#" },
  { name: "Lentes", href: "#" },
  { name: "Lançamentos", href: "#", badge: "Novo" },
];

const BENEFITS = [
  { icon: Percent, title: "5% OFF no PIX", description: "Economize em cada compra" },
  { icon: ShoppingBag, title: "Até 70% OFF", description: "Produtos selecionados" },
  { icon: CreditCard, title: "12x sem juros", description: "No cartão de crédito" },
  { icon: MapPin, title: "Consultoria Grátis", description: "Especialistas em visagismo" },
];

// Products will be fetched from Firestore

// CATEGORIES and STORES removed to simplify the landing page as requested

function AnnouncementBar() {
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

function Header() {
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
              <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/5 rounded-none">
                <Menu className="h-5 w-5 text-slate-700" />
              </Button>
            } />
            <SheetContent side="left" className="w-[300px] p-0 border-r-0 rounded-none">
              <div className="p-6 border-b border-border/50">
                <img src="/logo.png" alt="Ótica Melissa" className="h-10 w-auto object-contain" />
              </div>
              <nav className="flex flex-col p-4">
                {NAV_MENU_DATA.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between p-3 text-sm font-bold hover:bg-muted rounded-lg transition-colors"
                  >
                    {item.name}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex flex-col items-start select-none cursor-pointer group">
            <img 
              src="/logo.png" 
              alt="Ótica Melissa" 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-1">
            {NAV_MENU_DATA.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.categories ? (
                  <>
                    <NavigationMenuTrigger className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-none hover:bg-slate-100 data-[state=open]:bg-slate-100 text-slate-600">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-0 md:w-[700px] lg:w-[900px] bg-slate-900 text-white rounded-none border-none overflow-hidden shadow-2xl">
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
                    className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-none hover:bg-slate-100 flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    {item.name}
                    {item.badge && (
                      <Badge className="bg-primary text-white text-[9px] px-2 h-4 flex items-center justify-center font-bold rounded-none border-none shadow-sm">
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
              className="pl-10 w-[200px] focus:w-[280px] h-11 bg-slate-100 border-none rounded-none transition-all text-sm focus:ring-0 focus:border-primary"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <ClientLoginModal />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative w-full pt-6 md:pt-16 pb-0 overflow-hidden bg-white">
      <div className="w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-0">
          {/* Text Content - Centered in its 50% half */}
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
                <Button size="lg" className="rounded-none h-12 px-10 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 uppercase tracking-[0.15em] group">
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

          {/* Image - Centered in its 50% half */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center relative py-0"
          >
            <div className="relative w-full max-w-[280px] md:max-w-xs lg:max-w-sm z-10 mx-auto md:mx-0">
              {/* Floating Badge 1 - Top Left */}
              <motion.img
                src="/selo_desc_exclu.png"
                alt="Desconto Exclusivo"
                className="absolute top-12 -left-8 md:-left-20 -translate-y-1/2 w-28 md:w-40 opacity-100 pointer-events-none z-30 drop-shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Floating Badge 2 - Bottom Right */}
              <motion.img
                src="/selo_melhores_precos.png"
                alt="Melhores Preços"
                className="absolute bottom-2 md:bottom-4 -right-16 md:-right-32 w-32 md:w-48 opacity-100 pointer-events-none z-30 drop-shadow-xl"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />

              {/* Floating Logo 1 - Top Right */}
              <motion.img
                src="/logo.png"
                alt="Logo"
                className="absolute top-8 -right-8 md:-right-16 w-24 md:w-32 opacity-100 pointer-events-none z-20 drop-shadow-xl"
                animate={{ y: [0, 8, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />

              {/* Floating Logo 2 - Bottom Left */}
              <motion.img
                src="/logo.png"
                alt="Logo"
                className="absolute bottom-16 -left-8 md:-left-16 w-24 md:w-32 opacity-100 pointer-events-none z-20 drop-shadow-xl"
                animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              />

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
    <section className="py-3 md:py-5 bg-red-600">
      <div className="w-full mx-auto px-0 lg:max-w-[1440px] lg:px-6">
        <ResponsiveSlider autoplay={true} autoplayInterval={3500} dotClassName="bg-white/30">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 p-3 h-full rounded-none bg-white shadow-xl shadow-red-900/10 border border-white/5 transition-all cursor-pointer group"
            >
              <div className="h-8 w-8 rounded-none bg-red-50 flex items-center justify-center text-red-600 shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <benefit.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-[10px] md:text-xs uppercase tracking-tight text-slate-900">{benefit.title}</h3>
                <p className="text-slate-500 text-[9px] leading-tight mt-0.5">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </ResponsiveSlider>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <Card className="group relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-none bg-white hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500">
      <CardContent className="p-4">
        <div className="relative aspect-[16/11] overflow-hidden rounded-none bg-slate-50 mb-4 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3">
            {product.badge && <Badge className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-none shadow-lg">{product.badge}</Badge>}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900">
              R$ {product.price.toFixed(2)}
            </span>
            {product.originalPrice > 0 && (
              <span className="text-slate-400 text-xs line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
             <CreditCard className="h-3 w-3" /> 10x de R$ {(product.price / 10).toFixed(2)} sem juros
          </div>
          <Button
            variant="ghost"
            className="w-full mt-3 h-10 rounded-none bg-slate-50 text-slate-600 hover:bg-primary hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            VER DETALHES
          </Button>
        </div>
      </CardContent>
    </Card>
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
                    <div className="aspect-[4/5] rounded-none overflow-hidden shadow-2xl border border-white/5">
                        <img src="/hero_trio_distracted_white.png" alt="Qualidade Ótica Melissa" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full border-2 border-primary/20" />
                </motion.div>
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="space-y-6">
                        <Badge className="bg-primary text-white border-none rounded-none px-4 py-1 font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20">Qualidade e Precisão</Badge>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">Excelência em Cada Detalhe</h2>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-xl">
                            Na Ótica Melissa, unimos a tradição do atendimento personalizado com a mais alta tecnologia em lentes e armações. Trabalhamos com as melhores marcas do mercado para garantir não apenas estilo, mas a saúde total da sua visão.
                        </p>
                    </div>
                    <Button className="rounded-none bg-primary text-white hover:bg-primary/90 h-14 px-12 font-bold group uppercase tracking-widest text-xs transition-all border-none">
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
                    <div className="space-y-6">
                        <Badge className="bg-primary/10 text-primary border-none rounded-none px-4 py-1 font-bold text-[10px] tracking-widest uppercase">Nossa Unidade</Badge>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none text-slate-900">Maestria Melissa</h2>
                        <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">
                            Nossa unidade em Salvador foi projetada para oferecer uma experiência única. Ambiente climatizado, showroom moderno e equipamentos de última geração para sua avaliação visual.
                        </p>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="flex gap-6 items-start group">
                            <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center shrink-0 rounded-none group-hover:bg-primary transition-colors">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl uppercase tracking-tighter text-slate-900">Onde Estamos</h4>
                                <p className="text-slate-500 font-medium">Av. Manoel Dias da Silva, 1234 - Pituba, Salvador - BA</p>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start group">
                            <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center shrink-0 rounded-none group-hover:bg-primary transition-colors">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl uppercase tracking-tighter text-slate-900">Funcionamento</h4>
                                <p className="text-slate-500 font-medium">Segunda a Sexta: 08:30h às 18:30h | Sábados: 09h às 13h</p>
                            </div>
                        </div>
                    </div>

                    <Button size="lg" className="rounded-none px-12 h-14 font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-200 group uppercase tracking-widest text-xs transition-all">
                        Agendar Visita <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="order-1 lg:order-2"
                >
                    <div className="aspect-[4/3] overflow-hidden rounded-none shadow-2xl border border-slate-100">
                        <img src="/three_people_glasses.png" alt="Showroom Ótica Melissa" className="w-full h-full object-cover" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 md:py-24 border-t border-slate-800 mt-auto">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 mb-16">
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-none">
                    <img src="/logo.png" alt="Ótica Melissa" className="h-6 w-auto" />
                </div>
                <span className="text-xl font-black text-white uppercase tracking-tighter">Ótica Melissa</span>
            </div>
            <p className="text-[14px] leading-relaxed max-w-sm">
                Comprometidos em oferecer não apenas óculos, mas uma nova visão de mundo. 
                Excelência técnica, design moderno e atendimento personalizado para sua identidade.
            </p>
            <div className="flex gap-4">
                {['Instagram', 'Facebook', 'WhatsApp'].map((social) => (
                    <a key={social} href="#" className="w-10 h-10 rounded-none border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all">
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
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-6">
            <h6 className="text-white font-bold text-sm uppercase tracking-widest">Atendimento</h6>
            <ul className="space-y-4 text-[13px]">
              {["Trocas e Devoluções", "Dúvidas Frequentes", "Política de Entrega", "Cuidados com os Óculos", "Fale Conosco"].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
              ))}
              <li className="pt-2">
                <a href="#" className="flex items-center gap-2 text-primary font-bold hover:brightness-110 transition-all">
                    <MessageSquare size={16} />
                    WhatsApp: (71) 99999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
                <p className="text-[11px]">© 2024 Ótica Melissa. Todos os direitos reservados.</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest">
                    <span>CNPJ: 00.000.000/0001-00</span>
                    <a href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                        <Lock size={10} />
                        Painel Admin
                    </a>
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
        toast.success(`Agendamento solicitado para ${appointmentData.preferredDate?.includes("-") ? appointmentData.preferredDate.split("-").reverse().join("/") : appointmentData.preferredDate} (${appointmentData.period})! Aguarde nossa confirmação via WhatsApp.`);
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
      <main className="flex-1 overflow-x-hidden max-w-[1440px] mx-auto w-full">
        <Hero />
        <Benefits />
        
        {/* NEW ARRIVALS WITH DYNAMIC DATA */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-[1440px] mx-auto px-0 lg:px-10">
            <div className="flex items-center justify-between mb-8 px-6 lg:px-0">
              <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Mais Procurados</h2>
              <Button variant="link" className="text-primary font-bold text-xs group p-0 h-auto">
                Ver Todos <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
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

        <QualitySection />
        <StoreSection />

        {/* FREE EXAM SECTION WITH FORM LOGIC */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-white rounded-none border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/2 p-12 md:p-20 flex flex-col justify-center bg-slate-900 text-white">
                <Badge className="w-fit mb-8 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-none px-5 py-1.5 font-bold text-[11px] tracking-widest shadow-none uppercase">GRÁTIS TODOS OS SÁBADOS</Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">Sua saúde visual é nossa prioridade.</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">Agende seu exame computadorizado sem custos. Tecnologia de ponta para sua melhor visão.</p>
                <div className="flex items-center gap-4 text-sm font-bold">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-12 h-12 rounded-none border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white/50">{i}</div>)}
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
                        className="h-12 rounded-none border-slate-200 bg-slate-50 focus:bg-white focus:ring-0 focus:border-primary transition-all" 
                        value={appointmentData.name}
                        onChange={e => setAppointmentData({...appointmentData, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">WhatsApp</label>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        className="h-12 rounded-none border-slate-200 bg-slate-50 focus:bg-white focus:ring-0 focus:border-primary transition-all" 
                        value={appointmentData.whatsapp}
                        onChange={e => setAppointmentData({...appointmentData, whatsapp: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Data Preferencial</label>
                        {availableDates.length > 0 ? (
                            <select 
                                className="w-full h-12 rounded-none border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
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
                            <Input 
                                type="date" 
                                className="h-12 rounded-none border-slate-200 bg-slate-50"
                                value={appointmentData.preferredDate}
                                onChange={e => setAppointmentData({...appointmentData, preferredDate: e.target.value})}
                                required
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Período</label>
                      <select 
                        className="w-full h-12 rounded-none border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
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
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-none bg-primary text-white font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all mt-4"
                  >
                    {isSubmitting ? "SOLICITANDO..." : "CONFIRMAR SOLICITAÇÃO"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
