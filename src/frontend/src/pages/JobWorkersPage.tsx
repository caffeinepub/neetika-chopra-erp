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
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { JobWorker } from "../backend.d";
import {
  JobWorkerSpecialty,
  useAllJobWorkers,
  useCreateJobWorker,
  useDeleteJobWorker,
  useUpdateJobWorker,
} from "../hooks/useQueries";

const specialtyColors: Record<string, string> = {
  embroidery: "bg-purple-100 text-purple-800 border-purple-200",
  stitching: "bg-blue-100 text-blue-800 border-blue-200",
  both: "bg-teal-100 text-teal-800 border-teal-200",
};

const specialtyLabels: Record<string, string> = {
  embroidery: "Embroidery",
  stitching: "Stitching",
  both: "Both",
};

const defaultForm = {
  name: "",
  specialty: JobWorkerSpecialty.embroidery as string,
  contactPerson: "",
  phone: "",
  location: "",
  isActive: true,
};

export default function JobWorkersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWorker, setEditWorker] = useState<JobWorker | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: workers = [], isLoading } = useAllJobWorkers();
  const createWorker = useCreateJobWorker();
  const updateWorker = useUpdateJobWorker();
  const deleteWorker = useDeleteJobWorker();

  const filtered = workers.filter(
    (w: JobWorker) =>
      search === "" ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()) ||
      w.contactPerson.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditWorker(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (worker: JobWorker) => {
    setEditWorker(worker);
    setForm({
      name: worker.name,
      specialty: worker.specialty,
      contactPerson: worker.contactPerson,
      phone: worker.phone,
      location: worker.location,
      isActive: worker.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contactPerson || !form.phone || !form.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editWorker) {
        await updateWorker.mutateAsync({
          ...editWorker,
          name: form.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          specialty: form.specialty as any,
          contactPerson: form.contactPerson,
          phone: form.phone,
          location: form.location,
          isActive: form.isActive,
        });
        toast.success("Worker updated");
      } else {
        await createWorker.mutateAsync({
          name: form.name,
          specialty: form.specialty as JobWorkerSpecialty,
          contactPerson: form.contactPerson,
          phone: form.phone,
          location: form.location,
        });
        toast.success("Worker added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteWorker.mutateAsync(deleteId);
      toast.success("Worker deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const isPending = createWorker.isPending || updateWorker.isPending;

  const activeCount = workers.filter((w: JobWorker) => w.isActive).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Job Workers
          </h1>
          <p className="text-muted-foreground mt-1">
            Vendor directory — {activeCount} active worker
            {activeCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Worker
        </Button>
      </div>

      <div className="relative max-w-sm">
        <User
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search workers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-16 text-center">
          <p className="text-muted-foreground">
            No workers found. Add your first vendor to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((worker: JobWorker) => (
            <div
              key={String(worker.id)}
              className={`bg-card rounded-lg border shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col gap-3 ${
                worker.isActive
                  ? "border-border"
                  : "border-border/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                    worker.isActive
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {worker.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">{worker.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border mt-1 ${specialtyColors[worker.specialty] ?? ""}`}
                >
                  {specialtyLabels[worker.specialty] ?? worker.specialty}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs">
                    {worker.contactPerson}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs">
                    {worker.phone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin
                    size={12}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-muted-foreground text-xs">
                    {worker.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 mt-auto border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => openEdit(worker)}
                >
                  <Pencil size={12} /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(worker.id)}
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
              {editWorker ? "Edit Job Worker" : "Add Job Worker"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Business Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Sharma Embroidery Works"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Specialty</Label>
              <Select
                value={form.specialty}
                onValueChange={(v) => setForm((f) => ({ ...f, specialty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(JobWorkerSpecialty).map((s) => (
                    <SelectItem key={s} value={s}>
                      {specialtyLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person *</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPerson: e.target.value }))
                }
                placeholder="Ramesh Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Chandni Chowk, Delhi"
              />
            </div>
            {editWorker && (
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
              {editWorker ? "Save Changes" : "Add Worker"}
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
            <AlertDialogTitle>Delete Worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this vendor from your directory.
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
