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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import {
  useAllProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "../hooks/useQueries";

const defaultForm = {
  name: "",
  category: "",
  material: "",
  basePrice: "",
  sizesInput: "",
  isActive: true,
};

const CATEGORIES = [
  "Kurta",
  "Saree",
  "Lehenga",
  "Anarkali",
  "Suit Set",
  "Co-ord Set",
  "Dress",
  "Blouse",
  "Other",
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [sizeChips, setSizeChips] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");

  const { data: products = [], isLoading } = useAllProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filtered = products.filter(
    (p: Product) =>
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.material.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditProduct(null);
    setForm(defaultForm);
    setSizeChips([]);
    setSizeInput("");
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      material: product.material,
      basePrice: String(product.basePrice),
      sizesInput: "",
      isActive: product.isActive,
    });
    setSizeChips(product.sizes);
    setSizeInput("");
    setDialogOpen(true);
  };

  const addSize = () => {
    const v = sizeInput.trim().toUpperCase();
    if (v && !sizeChips.includes(v)) {
      setSizeChips((c) => [...c, v]);
    }
    setSizeInput("");
  };

  const removeSize = (s: string) =>
    setSizeChips((c) => c.filter((x) => x !== s));

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.category ||
      !form.material ||
      sizeChips.length === 0
    ) {
      toast.error(
        "Please fill in all required fields and add at least one size",
      );
      return;
    }
    try {
      if (editProduct) {
        await updateProduct.mutateAsync({
          ...editProduct,
          name: form.name,
          category: form.category,
          material: form.material,
          basePrice: form.basePrice
            ? BigInt(form.basePrice)
            : editProduct.basePrice,
          sizes: sizeChips,
          isActive: form.isActive,
        });
        toast.success("Product updated");
      } else {
        await createProduct.mutateAsync({
          name: form.name,
          category: form.category,
          sizes: sizeChips,
          material: form.material,
          basePrice: form.basePrice ? BigInt(form.basePrice) : BigInt(0),
        });
        toast.success("Product created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground mt-1">
            Style catalog — all your designs and SKUs.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> New Product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-16 text-center">
          <p className="text-muted-foreground">
            No products found. Add your first style to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product: Product) => (
            <div
              key={String(product.id)}
              className="bg-card rounded-lg border border-border shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.category}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                    product.isActive
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground w-16">
                    Material
                  </span>
                  <span className="text-foreground text-xs font-medium">
                    {product.material}
                  </span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground w-16">
                    Price
                  </span>
                  <span className="text-foreground text-xs font-semibold">
                    ₹{String(product.basePrice)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium border border-border"
                  >
                    {size}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1 mt-auto border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => openEdit(product)}
                >
                  <Pencil size={12} /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(product.id)}
                >
                  <Trash2 size={12} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editProduct ? "Edit Product" : "New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Anarkali Kurta Set"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input
                  list="cats"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="Anarkali"
                />
                <datalist id="cats">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Base Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, basePrice: e.target.value }))
                  }
                  placeholder="2500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Material *</Label>
              <Input
                value={form.material}
                onChange={(e) =>
                  setForm((f) => ({ ...f, material: e.target.value }))
                }
                placeholder="Cotton Silk, Chanderi..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sizes * (press Enter or click Add)</Label>
              <div className="flex gap-2">
                <Input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSize();
                    }
                  }}
                  placeholder="XS / S / M / L / XL / XXL"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addSize}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {sizeChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sizeChips.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-medium"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSize(s)}
                        className="hover:opacity-70"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {editProduct && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isActive: v }))
                  }
                />
                <Label>Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editProduct ? "Save Changes" : "Create Product"}
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
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product from the catalog.
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
