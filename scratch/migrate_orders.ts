
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./src/lib/firebase";

async function migrateOrders() {
  console.log("Iniciando migração de pedidos legados...");
  const atendimentosSnap = await getDocs(collection(db, "atendimentos"));
  
  let migratedCount = 0;
  
  for (const atendDoc of atendimentosSnap.docs) {
    const atendData = atendDoc.data();
    if (atendData.orders && Array.isArray(atendData.orders)) {
      for (const order of atendData.orders) {
        // Criar o documento na coleção 'orders' usando o ID do pedido como chave
        const orderRef = doc(db, "orders", order.id);
        
        await setDoc(orderRef, {
          atendimentoId: atendDoc.id,
          clientId: atendData.clientId,
          clientName: atendData.clientName || "Cliente Avulso",
          seller: atendData.attendant || "Administrador",
          serviceType: order.serviceType || "Óculos",
          dueDate: order.dueDate || null,
          items: order.items || order.serviceType,
          total: order.price || 0,
          status: atendData.status || "Pendente",
          createdAt: atendData.createdAt || new Date().toISOString(),
          date: atendData.date || new Date().toLocaleDateString('pt-BR'),
          isLegacy: true // Marcador para sabermos que veio da migração
        }, { merge: true });
        
        migratedCount++;
        console.log(`Pedido ${order.id} migrado.`);
      }
    }
  }
  
  console.log(`Migração concluída! ${migratedCount} pedidos processados.`);
}

migrateOrders();
