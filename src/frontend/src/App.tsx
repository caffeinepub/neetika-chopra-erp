import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import JobWorkPage from "./pages/JobWorkPage";
import JobWorkersPage from "./pages/JobWorkersPage";
import OrdersPage from "./pages/OrdersPage";
import ProductionPage from "./pages/ProductionPage";
import ProductsPage from "./pages/ProductsPage";

export type AppPage =
  | "dashboard"
  | "orders"
  | "products"
  | "inventory"
  | "production"
  | "jobwork"
  | "jobworkers";

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const { actor } = useActor();

  // Seed data on first load
  useEffect(() => {
    if (!actor) return;
    if ((actor as unknown as Record<string, unknown>).seedData) {
      (actor as unknown as { seedData: () => Promise<void> })
        .seedData()
        .catch(() => {
          /* ignore if already seeded */
        });
    }
  }, [actor]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage onNavigate={setActivePage} />;
      case "orders":
        return <OrdersPage />;
      case "products":
        return <ProductsPage />;
      case "inventory":
        return <InventoryPage />;
      case "production":
        return <ProductionPage />;
      case "jobwork":
        return <JobWorkPage />;
      case "jobworkers":
        return <JobWorkersPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
