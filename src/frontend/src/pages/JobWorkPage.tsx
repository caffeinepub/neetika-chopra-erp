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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  JobWorkAssignment,
  JobWorker,
  ProductOrder,
  ProductionJob,
} from "../backend.d";
import {
  JobWorkAssignmentStatus,
  ProductionStage,
  useAllJobWorkAssignments,
  useAllJobWorkers,
  useAllOrders,
  useAllProductionJobs,
  useCreateJobWorkAssignment,
  useDeleteJobWorkAssignment,
  useUpdateJobWorkAssignment,
} from "../hooks/useQueries";

const stageLabels: Record<string, string> = {
  cutting: "Cutting",
  embroidery: "Embroidery",
  stitching: "Stitching",
  finishing: "Finishing",
  qualityCheck: "Quality Check",
  dispatchReady: "Dispatch Ready",
};

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  inProgress: "bg-blue-100 text-blue-800 border-blue-200",
  returned: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  inProgress: "In Progress",
  returned: "Returned",
  rejected: "Rejected",
};

function dateToNanos(dateStr: string): bigint {
  return BigInt(Date.parse(dateStr)) * 1_000_000n;
}

function nanosToDate(nanos: bigint): string {
  try {
    const ms = Number(nanos / 1_000_000n);
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function nanosToInputDate(nanos: bigint): string {
  try {
    const ms = Number(nanos / 1_000_000n);
    return new Date(ms).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const defaultForm = {
  productionJobId: "",
  stage: ProductionStage.embroidery as string,
  jobWorkerId: "",
  assignedDate: new Date().toISOString().split("T")[0],
  expectedReturnDate: "",
  notes: "",
  status: JobWorkAssignmentStatus.pending as string,
  actualReturnDate: "",
};

export default function JobWorkPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<JobWorkAssignment | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: assignments = [], isLoading } = useAllJobWorkAssignments();
  const { data: jobs = [] } = useAllProductionJobs();
  const { data: workers = [] } = useAllJobWorkers();
  const { data: orders = [] } = useAllOrders();
  const createAssignment = useCreateJobWorkAssignment();
  const updateAssignment = useUpdateJobWorkAssignment();
  const deleteAssignment = useDeleteJobWorkAssignment();

  const jobMap = new Map<string, ProductionJob>(
    jobs.map((j: ProductionJob) => [String(j.id), j]),
  );
  const orderMap = new Map<string, ProductOrder>(
    orders.map((o: ProductOrder) => [String(o.id), o]),
  );
  const workerMap = new Map<string, JobWorker>(
    workers.map((w: JobWorker) => [String(w.id), w]),
  );

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (a: JobWorkAssignment) => {
    setEditItem(a);
    setForm({
      productionJobId: String(a.productionJobId),
      stage: a.stage,
      jobWorkerId: String(a.jobWorkerId),
      assignedDate: nanosToInputDate(a.assignedDate),
      expectedReturnDate: nanosToInputDate(a.expectedReturnDate),
      notes: a.notes,
      status: a.status,
      actualReturnDate: a.actualReturnDate
        ? nanosToInputDate(a.actualReturnDate)
        : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !form.productionJobId ||
      !form.jobWorkerId ||
      !form.assignedDate ||
      !form.expectedReturnDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editItem) {
        await updateAssignment.mutateAsync({
          ...editItem,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stage: form.stage as any,
          jobWorkerId: BigInt(form.jobWorkerId),
          assignedDate: dateToNanos(form.assignedDate),
          expectedReturnDate: dateToNanos(form.expectedReturnDate),
          notes: form.notes,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: form.status as any,
          actualReturnDate: form.actualReturnDate
            ? dateToNanos(form.actualReturnDate)
            : undefined,
        });
        toast.success("Assignment updated");
      } else {
        await createAssignment.mutateAsync({
          productionJobId: BigInt(form.productionJobId),
          stage: form.stage as ProductionStage,
          jobWorkerId: BigInt(form.jobWorkerId),
          assignedDate: dateToNanos(form.assignedDate),
          expectedReturnDate: dateToNanos(form.expectedReturnDate),
          notes: form.notes,
        });
        toast.success("Assignment created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAssignment.mutateAsync(deleteId);
      toast.success("Assignment deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const isPending = createAssignment.isPending || updateAssignment.isPending;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Job Work
          </h1>
          <p className="text-muted-foreground mt-1">
            Track assignments sent to external vendors for embroidery and
            stitching.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> New Assignment
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
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
                    "Production Job / Order",
                    "Stage",
                    "Vendor",
                    "Assigned",
                    "Expected Return",
                    "Actual Return",
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
                {assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No job work assignments yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a: JobWorkAssignment) => {
                    const job = jobMap.get(String(a.productionJobId));
                    const order = job
                      ? orderMap.get(String(job.orderId))
                      : null;
                    const worker = workerMap.get(String(a.jobWorkerId));
                    return (
                      <tr
                        key={String(a.id)}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {order ? (
                            <>
                              <p className="font-medium text-xs font-mono text-primary">
                                {order.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customerName}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Job #{String(a.productionJobId)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {stageLabels[a.stage] ?? a.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {worker ? (
                            <>
                              <p className="font-medium">{worker.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {worker.location}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Worker #{String(a.jobWorkerId)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {nanosToDate(a.assignedDate)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {nanosToDate(a.expectedReturnDate)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {a.actualReturnDate
                            ? nanosToDate(a.actualReturnDate)
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[a.status] ?? ""}`}
                          >
                            {statusLabels[a.status] ?? a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(a)}
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(a.id)}
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit Assignment" : "New Job Work Assignment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editItem && (
              <div className="space-y-1.5">
                <Label>Production Job *</Label>
                <Select
                  value={form.productionJobId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, productionJobId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select production job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j: ProductionJob) => {
                      const order = orderMap.get(String(j.orderId));
                      return (
                        <SelectItem key={String(j.id)} value={String(j.id)}>
                          {order
                            ? `${order.orderNumber} — ${order.customerName}`
                            : `Job #${String(j.id)}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm((f) => ({ ...f, stage: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ProductionStage).map((s) => (
                      <SelectItem key={s} value={s}>
                        {stageLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job Worker *</Label>
                <Select
                  value={form.jobWorkerId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, jobWorkerId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers
                      .filter((w: JobWorker) => w.isActive)
                      .map((w: JobWorker) => (
                        <SelectItem key={String(w.id)} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Assigned Date *</Label>
                <Input
                  type="date"
                  value={form.assignedDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignedDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Return *</Label>
                <Input
                  type="date"
                  value={form.expectedReturnDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expectedReturnDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {editItem && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(JobWorkAssignmentStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Actual Return Date</Label>
                  <Input
                    type="date"
                    value={form.actualReturnDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        actualReturnDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Special instructions..."
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
              {editItem ? "Save Changes" : "Create Assignment"}
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
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this job work assignment.
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
