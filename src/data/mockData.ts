// src/data/mockData.ts

export const DASHBOARD_STATS = [
  { label: "Vendas do Dia", value: "R$ 4.250,00", change: "+12.5%", trend: "up" },
  { label: "Vendas do Mês", value: "R$ 82.300,00", change: "+18.2%", trend: "up" },
  { label: "Ticket Médio", value: "R$ 580,00", change: "-2.4%", trend: "down" },
  { label: "Novos Clientes", value: "42", change: "+5.0%", trend: "up" },
  { label: "Estoque Baixo", value: "12", color: "text-red-600", urgent: true },
  { label: "Contas a Receber (7d)", value: "R$ 15.200,00", color: "text-amber-600" },
];

export const SALES_CHART_DATA = [
  { day: "01/Abr", sales: 4200 },
  { day: "05/Abr", sales: 5100 },
  { day: "10/Abr", sales: 3800 },
  { day: "15/Abr", sales: 6200 },
  { day: "20/Abr", sales: 4900 },
  { day: "25/Abr", sales: 5500 },
  { day: "30/Abr", sales: 7100 },
];

export const PAYMENT_METHODS_DATA = [
  { name: "Cartão de Crédito", value: 45, color: "#c4121a" },
  { name: "Pix", value: 30, color: "#10b981" },
  { name: "Carnê", value: 15, color: "#f59e0b" },
  { name: "Dinheiro", value: 10, color: "#64748b" },
];

export const TOP_PRODUCTS = [
  { name: "Ray-Ban Aviator", category: "Armação", sales: 24, revenue: "R$ 13.884" },
  { name: "Lente Varilux Physio", category: "Lente", sales: 18, revenue: "R$ 11.700" },
  { name: "Oakley Holbrook", category: "Armação", sales: 15, revenue: "R$ 7.020" },
  { name: "Vogue Butterfly", category: "Armação", sales: 12, revenue: "R$ 5.070" },
];

export const RECENT_ALERTS = [
  { id: 1, type: "vencimento", title: "Carnê Vencido", text: "Cliente: João Silva - Parcela 03/10", time: "Hoje" },
  { id: 2, type: "aniversario", title: "Aniversariante", text: "Maria Oliveira faz anos hoje!", time: "Hoje" },
  { id: 3, type: "pedido", title: "Pedido Pronto", text: "Venda #1024 pronta para entrega", time: "Há 2 horas" },
];

export const MOCK_CLIENTS = [
  {
    id: "1",
    name: "João Silva Santos",
    cpf: "123.456.789-00",
    email: "joao.silva@email.com",
    phone: "(11) 98877-6655",
    status: "Ativo",
    creditStatus: "Bom",
    lastVisit: "15/03/2024",
    balance: 0,
  },
  {
    id: "2",
    name: "Maria Oliveira Ramos",
    cpf: "234.567.890-11",
    email: "maria.oliveira@email.com",
    phone: "(11) 97766-5544",
    status: "Ativo",
    creditStatus: "Atenção",
    lastVisit: "02/04/2024",
    balance: 450.00,
  },
  {
    id: "3",
    name: "Carlos Eduardo Pereira",
    cpf: "345.678.901-22",
    email: "carlos.edu@email.com",
    phone: "(11) 96655-4433",
    status: "Inadimplente",
    creditStatus: "Restrito",
    lastVisit: "10/02/2024",
    balance: 1200.50,
  },
  {
    id: "4",
    name: "Ana Beatriz Costa",
    cpf: "456.789.012-33",
    email: "ana.costa@email.com",
    phone: "(11) 95544-3322",
    status: "Ativo",
    creditStatus: "Excelente",
    lastVisit: "12/04/2024",
    balance: 0,
  },
];

export const MOCK_PRODUCTS = [
  {
    id: "P001",
    name: "Ray-Ban RB3025 Aviator",
    category: "Armações",
    brand: "Ray-Ban",
    stock: 15,
    minStock: 5,
    price: 890.00,
    status: "Em Estoque",
    material: "Metal",
  },
  {
    id: "P002",
    name: "Oakley Holbrook Prizm",
    category: "Armações",
    brand: "Oakley",
    stock: 8,
    minStock: 10,
    price: 720.00,
    status: "Baixo Estoque",
    material: "Acetato",
  },
  {
    id: "P003",
    name: "Lente Varilux Physio 3.0",
    category: "Lentes",
    brand: "Essilor",
    stock: 24,
    minStock: 5,
    price: 1200.00,
    status: "Em Estoque",
    type: "Multifocal",
  },
  {
    id: "P004",
    name: "Lente KODAK Single Vision",
    category: "Lentes",
    brand: "Kodak",
    stock: 42,
    minStock: 10,
    price: 350.00,
    status: "Em Estoque",
    type: "Monofocal",
  },
  {
    id: "P005",
    name: "Acuvue Oasys with Hydraclear",
    category: "Lentes de Contato",
    brand: "Johnson & Johnson",
    stock: 4,
    minStock: 5,
    price: 180.00,
    status: "Baixo Estoque",
    type: "Esférica",
  },
  {
    id: "P006",
    name: "Vogue VO5324",
    category: "Armações",
    brand: "Vogue",
    stock: 0,
    minStock: 3,
    price: 550.00,
    status: "Em Falta",
    material: "Injetado",
  },
];

export const MOCK_ORDERS = [
  {
    id: "1024",
    clientName: "João Silva Santos",
    date: "12/04/2024",
    total: 1250.00,
    paymentMethod: "Cartão de Crédito",
    status: "Pronto para Entrega",
    items: "Ray-Ban Aviator + Lentes Zeiss",
  },
  {
    id: "1025",
    clientName: "Maria Oliveira Ramos",
    date: "14/04/2024",
    total: 850.00,
    paymentMethod: "Carnê",
    status: "Em Produção",
    items: "Vogue VO5324 + Lentes Monofocais",
  },
  {
    id: "1026",
    clientName: "Carlos Eduardo Pereira",
    date: "15/04/2024",
    total: 2100.00,
    paymentMethod: "Pix",
    status: "Qualidade",
    items: "Oakley Holbrook + Lentes Varilux",
  },
  {
    id: "1027",
    clientName: "Ana Beatriz Costa",
    date: "16/04/2024",
    total: 450.00,
    paymentMethod: "Dinheiro",
    status: "Pendente",
    items: "Armação Gassi Urban + Lentes Simples",
  },
];

export const MOCK_TRANSACTIONS = [
  { id: 1, date: "16/04/2024", description: "Venda #1027", category: "Venda", amount: 450.00, type: "Entrada" },
  { id: 2, date: "16/04/2024", description: "Fornecedor: Essilor (Lentes)", category: "Produtos", amount: -2400.00, type: "Saída" },
  { id: 3, date: "15/04/2024", description: "Venda #1026", category: "Venda", amount: 2100.00, type: "Entrada" },
  { id: 4, date: "15/04/2024", description: "Aluguel Loja", category: "Fixo", amount: -4500.00, type: "Saída" },
  { id: 5, date: "14/04/2024", description: "Pagamento Carnê: Maria Silva", category: "Recebimento", amount: 150.00, type: "Entrada" },
];

export const MOCK_INSTALLMENTS = [
  { 
    id: "INST001", 
    client: "Maria Oliveira Ramos", 
    orderId: "1025", 
    totalValue: 850.00, 
    remainingValue: 450.00,
    installments: [
        { number: 1, value: 100.00, dueDate: "10/03/2024", status: "Pago" },
        { number: 2, value: 150.00, dueDate: "10/04/2024", status: "Pago" },
        { number: 3, value: 150.00, dueDate: "10/05/2024", status: "Aberto" },
        { number: 4, value: 150.00, dueDate: "10/06/2024", status: "Aberto" },
    ]
  },
  { 
    id: "INST002", 
    client: "Carlos Eduardo Pereira", 
    orderId: "1022", 
    totalValue: 1200.50, 
    remainingValue: 1200.50,
    installments: [
        { number: 1, value: 200.00, dueDate: "05/04/2024", status: "Vencido" },
        { number: 2, value: 200.00, dueDate: "05/05/2024", status: "Aberto" },
    ]
  }
];
