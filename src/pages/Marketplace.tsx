import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AnnouncementBar, Header, Footer, ProductCard } from "./LandingPage";

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "landing_products"), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-white flex flex-col">
      <AnnouncementBar />
      <Header />
      
      <main className="flex-1 max-w-[1440px] mx-auto w-full py-16 px-6 lg:px-10">
        <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 mb-4">Coleção Completa</h1>
            <p className="text-slate-500 max-w-2xl mx-auto">Explore todos os nossos produtos. Das armações clássicas aos últimos lançamentos, temos o par perfeito para você.</p>
        </div>

        {loading ? (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        ) : products.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
                <p>Nenhum produto cadastrado ainda.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
