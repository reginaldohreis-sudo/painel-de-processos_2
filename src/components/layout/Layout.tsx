import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ReportGraphs } from '@/components/ReportGraphs';
import { useData } from '@/context/DataContext';

export function Layout() {
  const { batches, products, nozzles } = useData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      {/* Hidden templates for PDF generation. Kept off-screen to be rendered by html2canvas. */}
      <div className="absolute -left-[2000px] top-0 pointer-events-none bg-white">
          {batches.map(batch => (
              <ReportGraphs 
                key={batch.id} 
                batch={batch} 
                allProducts={products} 
                allNozzles={nozzles}
              />
          ))}
      </div>
    </div>
  );
}
