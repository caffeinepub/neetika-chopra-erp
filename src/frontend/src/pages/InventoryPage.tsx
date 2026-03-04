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
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { InventoryItem } from "../backend.d";
import {
  InventoryCategory,
  InventoryUnit,
  useAllInventoryItems,
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useUpdateInventoryItem,
} from "../hooks/useQueries";

const categoryLabels: Record<string, string> = {
  fabric: "Fabric",
  trim: "Trim",
  thread: "Thread",
  other: "Other",
};

const unitLabels: Record<string, string> = {
  meter: "Meter",
  piece: "Piece",
  roll: "Roll",
  kg: "Kg",
};

const defaultForm = {
  name: "",
  category: InventoryCategory.fabric as string,
  unit: InventoryUnit.meter as string,
  currentStock: "",
  reorderLevel: "",
};

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: items = [], isLoading } = useAllInventoryItems();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const filtered = items.filter((item: InventoryItem) => {
    const matchSearch =
      search === "" || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStockCount = items.filter(
    (i: InventoryItem) => i.currentStock <= i.reorderLevel,
  ).length;

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: String(item.currentStock),
      reorderLevel: String(item.reorderLevel),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.currentStock || !form.reorderLevel) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editItem) {
        await updateItem.mutateAsync({
          ...editItem,
          name: form.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: form.category as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unit: form.unit as any,
          currentStock: Number(form.currentStock),
          reorderLevel: Number(form.reorderLevel),
        });
        toast.success("Item updated");
      } else {
        await createItem.mutateAsync({
          name: form.name,
          category: form.category as InventoryCategory,
          unit: form.unit as InventoryUnit,
          currentStock: Number(form.currentStock),
          reorderLevel: Number(form.reorderLevel),
        });
        toast.success("Item added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem.mutateAsync(deleteId);
      toast.success("Item deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Track raw materials — fabrics, trims, and threads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-destructive bg-red-50 border border-red-200 rounded-full px-3 py-1">
              <AlertTriangle size={14} />
              <span>{lowStockCount} low stock</span>
            </div>
          )}
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search inventory..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(InventoryCategory).map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabels[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                    "Item Name",
                    "Category",
                    "Unit",
                    "Current Stock",
                    "Reorder Level",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item: InventoryItem) => {
                    const isLow = item.currentStock <= item.reorderLevel;
                    return (
                      <tr
                        key={String(item.id)}
                        className={`transition-colors ${isLow ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-muted/20"}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <AlertTriangle
                                size={13}
                                className="text-amber-600 shrink-0"
                              />
                            )}
                            {item.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">
                          <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                            {categoryLabels[item.category] ?? item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {unitLabels[item.unit] ?? item.unit}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${isLow ? "text-amber-700" : "text-foreground"}`}
                          >
                            {item.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.reorderLevel}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              isLow
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            {isLow ? "⚠ Low Stock" : "✓ OK"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit Item" : "Add Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Item Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Chanderi Silk Fabric"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InventoryCategory).map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabels[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InventoryUnit).map((u) => (
                      <SelectItem key={u} value={u}>
                        {unitLabels[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Current Stock *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentStock: e.target.value }))
                  }
                  placeholder="50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reorder Level *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reorderLevel: e.target.value }))
                  }
                  placeholder="10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the inventory item.
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
