import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Factory,
  ShoppingBag,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { AppPage } from "../App";
import type { InventoryItem, ProductOrder } from "../backend.d";
import {
  useAllInventoryItems,
  useAllOrders,
  useDashboardStats,
} from "../hooks/useQueries";
import { OrderStatus, Variant_MTO_readyStock } from "../hooks/useQueries";

interface DashboardPageProps {
  onNavigate: (page: AppPage) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  inProduction: "bg-purple-100 text-purple-800 border-purple-200",
  dispatched: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  inProduction: "In Production",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
};

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders = [], isLoading: ordersLoading } = useAllOrders();
  const { data: inventory = [] } = useAllInventoryItems();

  const recentOrders = [...orders]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 5);

  const lowStockItems = inventory.filter(
    (i: InventoryItem) => i.currentStock <= i.reorderLevel,
  );

  const kpis = [
    {
      label: "Open Orders",
      value: stats ? String(stats.openOrdersCount) : "-",
      icon: <ShoppingBag size={20} />,
      accent: "kpi-card-accent-green",
      iconBg: "bg-green-50 text-green-700",
      description: "Awaiting fulfillment",
    },
    {
      label: "In Production",
      value: stats ? String(stats.inProductionCount) : "-",
      icon: <Factory size={20} />,
      accent: "kpi-card-accent-blue",
      iconBg: "bg-blue-50 text-blue-700",
      description: "Active production jobs",
    },
    {
      label: "Pending Job Work",
      value: stats ? String(stats.pendingJobWorkCount) : "-",
      icon: <Wrench size={20} />,
      accent: "kpi-card-accent-gold",
      iconBg: "bg-amber-50 text-amber-700",
      description: "Awaiting vendor return",
    },
    {
      label: "Low Stock Alerts",
      value:
        lowStockItems.length > 0
          ? String(lowStockItems.length)
          : stats
            ? String(stats.lowStockItems?.length ?? 0)
            : "-",
      icon: <AlertTriangle size={20} />,
      accent: "kpi-card-accent-red",
      iconBg: "bg-red-50 text-red-700",
      description: "Items below reorder level",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Good to see you — here's how the atelier is performing.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-card rounded-lg border border-border p-5 ${kpi.accent} shadow-xs`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${kpi.iconBg}`}
              >
                {kpi.icon}
              </div>
              <TrendingUp size={14} className="text-muted-foreground/40 mt-1" />
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground font-display">
                {kpi.value}
              </p>
            )}
            <p className="text-sm font-medium text-foreground mt-0.5">
              {kpi.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kpi.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-card rounded-lg border border-border shadow-xs">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Recent Orders</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("orders")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {ordersLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                No orders yet. Create your first order to get started.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Style
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Delivery
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order: ProductOrder) => (
                    <tr
                      key={String(order.id)}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-primary">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.styleName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                            order.orderType === Variant_MTO_readyStock.MTO
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-sky-50 text-sky-700 border-sky-200"
                          }`}
                        >
                          {order.orderType === Variant_MTO_readyStock.MTO
                            ? "MTO"
                            : "Ready Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${statusColors[order.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                        >
                          {statusLabels[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(order.deliveryDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-card rounded-lg border border-border shadow-xs">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <AlertTriangle size={16} className="text-destructive" />
            <h2 className="font-semibold text-foreground">Low Stock Alerts</h2>
          </div>
          <div className="px-4 py-3">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                All inventory levels are healthy.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.slice(0, 8).map((item: InventoryItem) => (
                  <div
                    key={String(item.id)}
                    className="flex items-center justify-between rounded-md bg-red-50 border border-red-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
