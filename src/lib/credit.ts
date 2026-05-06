
/**
 * Calcula o score de crédito do cliente com base no histórico de parcelas ou override manual.
 */
export const calculateCreditScore = (client: any, installments: any[]) => {
    // 1. Verificação de override manual
    if (client.manualCreditStatus && client.manualCreditStatus !== "auto") {
        return {
            status: client.manualCreditStatus,
            isManual: true,
            reason: client.creditStatusReason || "Alterado manualmente pelo administrador."
        };
    }

    // 2. Filtro de parcelas do cliente (ignora entradas/down payments)
    const clientInsts = (installments || []).filter(i => i.clientId === client.id && !i.isDownPayment);
    
    // 3. Caso sem histórico
    if (!clientInsts || clientInsts.length === 0) {
        return { 
            status: "Em Análise", 
            isManual: false, 
            reason: "Cliente sem histórico de parcelas ou compras no crediário." 
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hasOverdue30 = false;
    let hasOverdue = false;
    let hasPaid = false;
    
    clientInsts.forEach(inst => {
        if (inst.status === "Pago" || inst.status === "Paga") {
            hasPaid = true;
        } else if (inst.status === "Pendente") {
            if (inst.dueDate) {
                const parts = inst.dueDate.split("/");
                if (parts.length === 3) {
                    const [d, m, y] = parts.map(Number);
                    const due = new Date(y, m - 1, d);
                    const diffTime = today.getTime() - due.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 0) {
                        hasOverdue = true;
                        if (diffDays > 30) {
                            hasOverdue30 = true;
                        }
                    }
                }
            }
        }
    });

    // 4. Lógica de prioridade de status
    if (hasOverdue30) {
        return { 
            status: "Inadimplente", 
            isManual: false, 
            reason: "Possui parcelas atrasadas há mais de 30 dias." 
        };
    }
    if (hasOverdue) {
        return { 
            status: "Atenção", 
            isManual: false, 
            reason: "Possui parcelas com atraso recente." 
        };
    }
    if (hasPaid) {
        return { 
            status: "Excelente", 
            isManual: false, 
            reason: "Possui histórico de pagamentos sem atrasos pendentes." 
        };
    }
    
    return { 
        status: "Bom", 
        isManual: false, 
        reason: "Possui compras no crediário sem atrasos pendentes." 
    };
};

/**
 * Retorna as classes CSS de cor para cada status de crédito.
 */
export const getCreditStatusColor = (status: string) => {
    switch (status) {
        case 'Excelente': 
            return 'bg-emerald-100 text-emerald-700';
        case 'Bom': 
            return 'bg-blue-100 text-blue-700';
        case 'Atenção': 
            return 'bg-amber-100 text-amber-700';
        case 'Inadimplente': 
            return 'bg-red-100 text-red-700';
        case 'Em Análise':
        default: 
            return 'bg-slate-100 text-slate-700';
    }
};
