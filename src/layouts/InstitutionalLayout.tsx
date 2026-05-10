import React from 'react';
import { motion } from 'motion/react';
import { Header, Footer, AnnouncementBar } from '../pages/LandingPage';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InstitutionalLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumb?: { name: string; href: string }[];
}

export const InstitutionalLayout: React.FC<InstitutionalLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  breadcrumb 
}) => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <AnnouncementBar />
      <Header />
      
      {/* Hero Section for Institutional Pages */}
      <section className="bg-slate-900 pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          {breadcrumb && (
            <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest mb-6">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} />
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.href}>
                  <Link to={item.href} className="hover:text-white transition-colors">{item.name}</Link>
                  {index < breadcrumb.length - 1 && <ChevronRight size={12} />}
                </React.Fragment>
              ))}
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/60 text-lg max-w-2xl font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-white rounded-[30px] p-8 md:p-16 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
