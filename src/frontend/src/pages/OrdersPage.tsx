import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ProductOrder } from "../backend.d";
import {
  OrderStatus,
  Variant_MTO_readyStock,
  useAllOrders,
  useAllProducts,
  useCreateOrder,
  useDeleteOrder,
  useUpdateOrder,
} from "../hooks/useQueries";

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

function generateOrderNumber(total: number): string {
  return `NC-${String(total + 1).padStart(4, "0")}`;
}

const defaultForm = {
  customerName: "",
  customerContact: "",
  productId: "",
  styleName: "",
  size: "",
  quantity: "1",
  orderType: Variant_MTO_readyStock.MTO as string,
  deliveryDate: "",
  notes: "",
};

export default function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<ProductOrder | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: orders = [], isLoading } = useAllOrders();
  const { data: products = [] } = useAllProducts();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const filteredOrders = orders.filter((o: ProductOrder) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchSearch =
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.styleName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openCreate = () => {
    setEditOrder(null);
    setForm({ ...defaultForm, orderType: Variant_MTO_readyStock.MTO });
    setDialogOpen(true);
  };

  const openEdit = (order: ProductOrder) => {
    setEditOrder(order);
    setForm({
      customerName: order.customerName,
      customerContact: order.customerContact,
      productId: String(order.productId),
      styleName: order.styleName,
      size: order.size,
      quantity: String(order.quantity),
      orderType: order.orderType,
      deliveryDate: order.deliveryDate,
      notes: order.notes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !form.customerName ||
      !form.styleName ||
      !form.size ||
      !form.deliveryDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editOrder) {
        await updateOrder.mutateAsync({
          ...editOrder,
          customerName: form.customerName,
          customerContact: form.customerContact,
          productId: form.productId
            ? BigInt(form.productId)
            : editOrder.productId,
          styleName: form.styleName,
          size: form.size,
          quantity: BigInt(form.quantity || "1"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orderType: form.orderType as any,
          deliveryDate: form.deliveryDate,
          notes: form.notes,
        });
        toast.success("Order updated successfully");
      } else {
        const orderNumber = generateOrderNumber(orders.length);
        await createOrder.mutateAsync({
          orderNumber,
          customerName: form.customerName,
          customerContact: form.customerContact,
          productId: form.productId ? BigInt(form.productId) : BigInt(0),
          styleName: form.styleName,
          size: form.size,
          quantity: BigInt(form.quantity || "1"),
          orderType: form.orderType as Variant_MTO_readyStock,
          deliveryDate: form.deliveryDate,
          notes: form.notes,
        });
        toast.success("Order created successfully");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleStatusChange = async (order: ProductOrder, newStatus: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateOrder.mutateAsync({ ...order, status: newStatus as any });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOrder.mutateAsync(deleteId);
      toast.success("Order deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const isPending = createOrder.isPending || updateOrder.isPending;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders — ready stock and made-to-order.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(OrderStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Order #",
                    "Customer",
                    "Style",
                    "Size",
                    "Qty",
                    "Type",
                    "Delivery",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: ProductOrder) => (
                    <tr
                      key={String(order.id)}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        {order.customerContact && (
                          <p className="text-xs text-muted-foreground">
                            {order.customerContact}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.styleName}
                      </td>
                      <td className="px-4 py-3">{order.size}</td>
                      <td className="px-4 py-3 font-medium">
                        {String(order.quantity)}
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
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(order.deliveryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleStatusChange(order, v)}
                        >
                          <SelectTrigger
                            className={`h-7 w-36 text-xs border rounded-full px-2.5 ${statusColors[order.status] ?? ""}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(OrderStatus).map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {statusLabels[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(order)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(order.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editOrder ? "Edit Order" : "New Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Name *</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  placeholder="Priya Mehta"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input
                  value={form.customerContact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerContact: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Product / Style</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => {
                  const product = products.find(
                    (p: { id: bigint; name: string }) => String(p.id) === v,
                  );
                  setForm((f) => ({
                    ...f,
                    productId: v,
                    styleName: product ? product.name : f.styleName,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: { id: bigint; name: string }) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Style Name *</Label>
              <Input
                value={form.styleName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, styleName: e.target.value }))
                }
                placeholder="Anarkali Kurta Set"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Size *</Label>
                <Input
                  value={form.size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, size: e.target.value }))
                  }
                  placeholder="S / M / XL"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Order Type</Label>
                <Select
                  value={form.orderType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, orderType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Variant_MTO_readyStock.MTO}>
                      Made-to-Order
                    </SelectItem>
                    <SelectItem value={Variant_MTO_readyStock.readyStock}>
                      Ready Stock
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Delivery Date *</Label>
              <Input
                type="date"
                value={form.deliveryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deliveryDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Special instructions, customizations..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editOrder ? "Save Changes" : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
