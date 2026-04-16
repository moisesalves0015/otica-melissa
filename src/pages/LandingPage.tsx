import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveSlider } from "@/components/ui/ResponsiveSlider";
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

const NAV_MENU_DATA = [
  {
    name: "Óculos de Grau",
    href: "#",
    categories: [
      { title: "Por Gênero", links: ["Feminino", "Masculino", "Infantil", "Unissex"] },
      { title: "Por Formato", links: ["Redondo", "Quadrado", "Gatinho", "Retangular", "Aviador"] },
      { title: "Por Material", links: ["Acetato", "Metal", "Titanium", "Injetado"] },
    ],
    featured: {
      title: "Tendência Grau 2024",
      image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=400",
    }
  },
  {
    name: "Óculos de Sol",
    href: "#",
    categories: [
      { title: "Por Estilo", links: ["Clássicos", "Esportivos", "Modernos", "Retrô"] },
      { title: "Lentes", links: ["Polarizados", "Espelhados", "Degradê", "Fotocromáticas"] },
      { title: "Ofertas Sol", links: ["Até 30% OFF", "Outlet Sol", "Combos Sol"] },
    ],
    featured: {
      title: "Sol Verão 2024",
      image: "https://images.unsplash.com/photo-1511499767350-a15941da92bf?q=80&w=400",
    }
  },
  { name: "Lentes", href: "#" },
  { name: "Lançamentos", href: "#", badge: "Novo" },
];

const BENEFITS = [
  { icon: Percent, title: "5% OFF no PIX", description: "Economize em cada compra" },
  { icon: ShoppingBag, title: "Até 70% OFF", description: "Produtos selecionados" },
  { icon: CreditCard, title: "12x sem juros", description: "No cartão de crédito" },
  { icon: MapPin, title: "Localizador de Lojas", description: "Encontre a Gassi perto de você" },
];

const PRODUCTS = [
  {
    id: 1,
    name: "Ray-Ban Aviator Classic",
    originalPrice: 890,
    price: 578.5,
    installments: "12x de R$ 48,20",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=500",
    badge: "35% OFF",
    freeShipping: true,
  },
  {
    id: 2,
    name: "Oakley Holbrook Prizm",
    originalPrice: 720,
    price: 468,
    installments: "12x de R$ 39,00",
    image: "https://images.unsplash.com/photo-1511499767350-a15941da92bf?q=80&w=500",
    badge: "35% OFF",
    freeShipping: true,
  },
  {
    id: 3,
    name: "Vogue Eyewear Butterfly",
    originalPrice: 650,
    price: 422.5,
    installments: "12x de R$ 35,20",
    image: "https://images.unsplash.com/photo-1509100104048-ed167d736.jpg?q=80&w=500",
    badge: "Novidade",
    freeShipping: false,
  },
  {
    id: 4,
    name: "Carrera Grand Prix 2",
    originalPrice: 950,
    price: 617.5,
    installments: "12x de R$ 51,45",
    image: "https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=500",
    badge: "35% OFF",
    freeShipping: true,
  },
];

const CATEGORIES = [
  {
    title: "Vogue - Atitude e Elegância",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
    size: "large",
  },
  {
    title: "Coleção Premium",
    image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=600",
    size: "small",
  },
  {
    title: "Esportivos",
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=600",
    size: "small",
  },
  {
    title: "Vintage",
    image: "https://images.unsplash.com/photo-1481016570479-9eab6349fde7?q=80&w=600",
    size: "small",
  },
  {
    title: "Lentes de Contato",
    image: "https://images.unsplash.com/photo-1628144501476-8f192aa07612?q=80&w=600",
    size: "small",
  },
];

const STORES = [
  { city: "São Paulo", neighborhood: "Paraíso", address: "Av. Bernardino de Campos, 123" },
  { city: "São Paulo", neighborhood: "Lapa", address: "Rua Doze de Outubro, 456" },
  { city: "São Paulo", neighborhood: "Barra Funda", address: "Av. Marquês de São Vicente, 789" },
];

function AnnouncementBar() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-primary text-primary-foreground py-1.5 text-center text-[10px] font-bold overflow-hidden relative h-7">
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
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 border-r-0">
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
                    <NavigationMenuTrigger className="px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all rounded-full hover:bg-muted/50 data-[state=open]:bg-muted/50 text-foreground/70">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-0 md:w-[700px] lg:w-[900px] glass-dark text-white rounded-[2rem] border-none overflow-hidden shadow-2xl">
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
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all rounded-full hover:bg-muted/50 flex items-center gap-2 text-foreground/70 hover:text-foreground"
                  >
                    {item.name}
                    {item.badge && (
                      <Badge className="bg-primary text-white text-[8px] px-1.5 h-4 flex items-center justify-center font-black animate-bounce rounded-full border-none">
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
              className="pl-10 w-[200px] focus:w-[280px] h-10 bg-muted/30 border-none rounded-full transition-all text-sm focus:ring-1 focus:ring-primary/20"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted/50">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 relative hover:bg-muted/50 group">
            <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 h-4 w-4 bg-primary text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-white">
              0
            </span>
          </Button>
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
                Nova Coleção 2024
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 leading-[1.1] tracking-tighter text-slate-900 uppercase">
                Estilo e <br /> Visão Única
                </h1>
                <p className="text-[14px] md:text-lg text-slate-500 mb-4 md:mb-6 max-w-md leading-relaxed font-medium">
                As melhores armações com lentes de alta tecnologia. Conforto e elegância para o seu dia a dia.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button size="lg" className="rounded-full h-10 px-8 text-[10px] md:text-[11px] font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 uppercase tracking-widest group">
                    Conhecer Coleção 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    12x Sem Juros No Cartão
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
            {/* Floating Logo 1 - Side of image - EVEN CLOSER */}
            {/* Floating Logo 1 - Side of image - EVEN CLOSER */}
            <motion.img
              src="/logo.png"
              alt=""
              className="absolute top-12 left-8 -translate-y-1/2 w-20 md:w-32 opacity-100 pointer-events-none z-30 drop-shadow-lg"
              animate={{ 
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />

            {/* Floating Logo 2 - Bottom Right edge of image - EVEN CLOSER */}
            <motion.img
              src="/logo.png"
              alt=""
              className="absolute bottom-8 right-12 w-24 md:w-40 opacity-100 pointer-events-none z-30 drop-shadow-lg"
              animate={{ 
                y: [0, 10, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5
              }}
            />

            <div className="relative w-full max-w-[280px] md:max-w-xs lg:max-w-sm z-10 mx-auto md:mx-0">
                <img 
                    src="/hero_woman_no_bg.png" 
                    alt="Ótica Melissa Collection" 
                    className="w-full h-auto object-cover"
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
      <div className="w-full md:container mx-auto px-0 md:px-6">
        <ResponsiveSlider autoplay={true} autoplayInterval={3500} dotClassName="bg-white/30">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 p-3 h-full rounded-xl bg-white shadow-xl shadow-red-900/20 border border-white/10 hover:border-white transition-all cursor-pointer group"
            >
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
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

function ProductCard({ product }: { product: typeof PRODUCTS[0] }) {
  return (
    <Card className="group relative overflow-hidden border-none shadow-sm rounded-lg bg-white">
      <CardContent className="p-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded bg-background mb-3 flex items-center justify-center text-3xl">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2">
            {product.badge && <Badge className="bg-primary text-[9px] font-bold p-1 rounded-sm scale-90 origin-left">{product.badge}</Badge>}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-xs truncate text-foreground">{product.name}</h3>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] line-through">
              R$ {product.originalPrice.toFixed(2)}
            </span>
            <span className="text-sm font-black text-primary">
              R$ {product.price.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground italic">
              10x de R$ {(product.price / 10).toFixed(2)}
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full mt-2 h-8 rounded-sm border-primary text-primary hover:bg-primary/5 text-[10px] font-bold uppercase"
          >
            EXPERIMENTE
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NewArrivals() {
  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold tracking-tight">Novos Lançamentos</h2>
          <Button variant="link" className="text-primary font-bold text-xs group p-0 h-auto">
            Ver Tudo <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <ResponsiveSlider>
          {PRODUCTS.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </ResponsiveSlider>
      </div>
    </section>
  );
}

function CategoryBanners() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative overflow-hidden group rounded-3xl ${
                cat.size === "large" ? "md:col-span-8 md:row-span-2" : "md:col-span-4"
              }`}
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                <h3 className={`text-white font-black tracking-tight ${cat.size === 'large' ? 'text-4xl' : 'text-2xl'}`}>
                  {cat.title}
                </h3>
                <Button
                  variant="link"
                  className="text-white p-0 h-auto font-bold mt-2 self-start group/btn"
                >
                  Conheça agora <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">EXPERIÊNCIA GASSI</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Venha conhecer a maior rede de óticas do Brasil. Tecnologia de ponta, consultores especializados e mais de 2.000 modelos exclusivos em cada loja.
            </p>
            <div className="space-y-6 mb-8">
              {STORES.map((store) => (
                <div key={store.neighborhood} className="flex gap-4 p-4 rounded-2xl border hover:border-primary transition-colors group cursor-pointer">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{store.neighborhood} - {store.city}</h4>
                    <p className="text-muted-foreground">{store.address}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" className="rounded-full px-10 font-bold group">
              Ver Mais Lojas <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1000"
              alt="Loja Gassi"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/20 backdrop-overlay" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 md:py-20 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-6">
                <div className="bg-white p-1.5 rounded-lg">
                    <img src="/logo.png" alt="Ótica Melissa" className="h-6 w-auto" />
                </div>
                <span className="text-xl font-black text-white uppercase tracking-tighter">Ótica Melissa</span>
            </div>
            <p className="text-[13px] leading-relaxed mb-8 max-w-sm">
                Comprometidos em oferecer não apenas óculos, mas uma nova visão de mundo. 
                Excelência técnica, design moderno e atendimento personalizado para a sua visão.
            </p>
            <div className="flex gap-4">
                {['Instagram', 'Facebook', 'WhatsApp'].map((social) => (
                    <a key={social} href="#" className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all">
                        <span className="sr-only">{social}</span>
                        {social === 'Instagram' && <Instagram className="h-4 w-4" />}
                        {social === 'Facebook' && <Facebook className="h-4 w-4" />}
                        {social === 'WhatsApp' && <MessageSquare className="h-4 w-4" />}
                    </a>
                ))}
            </div>
          </div>

          {/* Links Column - Category */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Compre Por</h6>
            <ul className="space-y-4 text-[13px]">
              {["Óculos de Grau", "Óculos de Sol", "Lentes de Contato", "Acessórios", "Lançamentos"].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Links Column - Support */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Atendimento</h6>
            <ul className="space-y-4 text-[13px]">
              {["Trocas e Devoluções", "Dúvidas Frequentes", "Política de Entrega", "Cuidados com os Óculos", "Fale Conosco"].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
              ))}
              <li className="pt-2">
                <a href="#" className="flex items-center gap-2 text-primary font-bold hover:brightness-110 transition-all justify-center md:justify-start">
                    <MessageSquare size={16} />
                    WhatsApp: (11) 9999-9999
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-3">
             <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-6 text-center md:text-left">Assine Nossa News</h6>
             <p className="text-[13px] mb-6 text-center md:text-left">Receba novidades e descontos exclusivos em primeira mão.</p>
             <div className="flex gap-2">
                <Input 
                    placeholder="Seu melhor e-mail" 
                    className="bg-slate-900 border-slate-800 text-white h-11 text-[13px] rounded-full px-6 focus:ring-primary focus:border-primary" 
                />
                <Button className="h-11 px-6 font-bold rounded-full text-xs uppercase tracking-widest bg-white text-slate-950 hover:bg-slate-200" onClick={() => toast.success("Inscrito!")}>
                  OK
                </Button>
             </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
                <p className="text-[11px]">© 2024 Ótica Melissa. Todos os direitos reservados.</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest">
                    <span>CNPJ: 00.000.000/0001-00</span>
                    <a href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                        <Lock size={10} />
                        Área Administrativa
                    </a>
                </div>
            </div>
            
            <div className="flex gap-3 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <CreditCard className="h-6 w-6" />
                <Truck className="h-6 w-6" />
                {/* Additional payment icons would go here */}
            </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-white flex flex-col">
      <Toaster position="top-center" />
      <AnnouncementBar />
      <Header />
      <main className="flex-1 overflow-x-hidden max-w-7xl mx-auto w-full">
        <Hero />
        <Benefits />
        <NewArrivals />
        <CategoryBanners />
        <StoreSection />
      </main>
      <Footer />
    </div>
  );
}
