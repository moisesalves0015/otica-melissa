import { 
  Instagram, 
  Facebook, 
  MessageSquare,
  Glasses,
  Zap,
  Clock,
  MapPin,
  ChevronRight,
  ArrowRight
} from "lucide-react";

export const ANNOUNCEMENTS = [
  "🚀 Frete Grátis para todo Brasil em compras acima de R$ 299",
  "👓 Exame de Vista Computadorizado Grátis todos os Sábados",
  "💎 Lentes de Alta Tecnologia com 2 anos de Garantia",
  "🔥 Coleção Verão 2024 com até 40% OFF"
];

export const NAV_MENU_DATA = [
  {
    name: "Óculos de Grau",
    href: "/categoria/grau",
    categories: [
      {
        title: "Estilo",
        links: ["Executivo", "Vintage", "Moderno", "Minimalista", "Esportivo"]
      },
      {
        title: "Material",
        links: ["Acetato Premium", "Titânio", "Metal", "TR90 Flex", "Injetado"]
      },
      {
        title: "Formato",
        links: ["Redondo", "Quadrado", "Gatinho", "Retangular", "Aviador"]
      }
    ],
    featured: {
      title: "Lançamentos 2024",
      image: "https://images.unsplash.com/photo-1511499767390-a7335958bbe7?auto=format&fit=crop&q=80&w=800",
      href: "/categoria/grau"
    }
  },
  {
    name: "Óculos de Sol",
    href: "/categoria/sol",
    categories: [
      {
        title: "Tendências",
        links: ["Lentes Degradê", "Espelhados", "Clássicos", "Retrô Futurista", "Oversized"]
      },
      {
        title: "Proteção",
        links: ["Polarizados", "UV400", "Lentes de Policarbonato", "Anti-Reflexo"]
      }
    ],
    featured: {
      title: "Coleção Verão",
      image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&q=80&w=800",
      href: "/categoria/sol"
    }
  },
  { name: "Lentes de Contato", href: "/categoria/lentes" },
  { name: "Ofertas", href: "/categoria/ofertas", badge: "HOT" },
  { name: "Sobre Nós", href: "#sobre" }
];

export const FOOTER_LINKS = {
  shop: [
    { name: "Óculos de Grau", href: "/categoria/grau" },
    { name: "Óculos de Sol", href: "/categoria/sol" },
    { name: "Lentes de Contato", href: "/categoria/lentes" },
    { name: "Acessórios", href: "/categoria/acessorios" },
    { name: "Lançamentos", href: "/categoria/lancamentos" }
  ],
  support: [
    { name: "Trocas e Devoluções", href: "/trocas-e-devolucoes" },
    { name: "Dúvidas Frequentes", href: "/faq" },
    { name: "Política de Entrega", href: "/politica-de-entrega" },
    { name: "Cuidados com os Óculos", href: "/cuidados" },
    { name: "Fale Conosco", href: "/contato" }
  ],
  legal: [
    { name: "Privacidade", id: "privacy" },
    { name: "Termos", id: "terms" }
  ]
};

export const MARQUEE_PRECOS = [
  "/precos_banner_1.png",
  "/precos_banner_2.png",
  "/precos_banner_3.png"
];
