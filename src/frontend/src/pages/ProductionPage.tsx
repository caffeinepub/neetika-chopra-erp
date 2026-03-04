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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  ProductOrder,
  ProductionJob,
  StageHistoryEntry,
} from "../backend.d";
import {
  ProductionStage,
  useAdvanceProductionJobStage,
  useAllOrders,
  useAllProductionJobs,
  useCreateProductionJob,
  useDeleteProductionJob,
} from "../hooks/useQueries";

const STAGES_IN_ORDER: ProductionStage[] = [
  ProductionStage.cutting,
  ProductionStage.embroidery,
  ProductionStage.stitching,
  ProductionStage.finishing,
  ProductionStage.qualityCheck,
  ProductionStage.dispatchReady,
];

const stageLabels: Record<string, string> = {
  cutting: "Cutting",
  embroidery: "Embroidery",
  stitching: "Stitching",
  finishing: "Finishing",
  qualityCheck: "Quality Check",
  dispatchReady: "Dispatch Ready",
};

const stageColors: Record<string, string> = {
  cutting: "bg-blue-100 text-blue-800 border-blue-200",
  embroidery: "bg-purple-100 text-purple-800 border-purple-200",
  stitching: "bg-amber-100 text-amber-800 border-amber-200",
  finishing: "bg-orange-100 text-orange-800 border-orange-200",
  qualityCheck: "bg-teal-100 text-teal-800 border-teal-200",
  dispatchReady: "bg-green-100 text-green-800 border-green-200",
};

function getNextStage(currentStage: ProductionStage): ProductionStage | null {
  const idx = STAGES_IN_ORDER.indexOf(currentStage);
  if (idx === -1 || idx === STAGES_IN_ORDER.length - 1) return null;
  return STAGES_IN_ORDER[idx + 1];
}

function getStageProgress(currentStage: ProductionStage): number {
  const idx = STAGES_IN_ORDER.indexOf(currentStage);
  return Math.round(((idx + 1) / STAGES_IN_ORDER.length) * 100);
}

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / 1_000_000n);
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export default function ProductionPage() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [createForm, setCreateForm] = useState({
    orderId: "",
    initialStage: ProductionStage.cutting as string,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useAllProductionJobs();
  const { data: orders = [], isLoading: ordersLoading } = useAllOrders();
  const createJob = useCreateProductionJob();
  const advanceStage = useAdvanceProductionJobStage();
  const deleteJob = useDeleteProductionJob();

  const orderMap = new Map<string, ProductOrder>(
    orders.map((o: ProductOrder) => [String(o.id), o]),
  );

  const handleAdvance = async (job: ProductionJob) => {
    const next = getNextStage(job.currentStage);
    if (!next) return;
    try {
      await advanceStage.mutateAsync({ jobId: job.id, newStage: next });
      toast.success(`Advanced to ${stageLabels[next]}`);
    } catch {
      toast.error("Failed to advance stage");
    }
  };

  const handleCreate = async () => {
    if (!createForm.orderId) {
      toast.error("Please select an order");
      return;
    }
    try {
      await createJob.mutateAsync({
        orderId: BigInt(createForm.orderId),
        currentStage: createForm.initialStage as ProductionStage,
      });
      toast.success("Production job created");
      setCreateOpen(false);
      setCreateForm({ orderId: "", initialStage: ProductionStage.cutting });
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJob.mutateAsync(deleteId);
      toast.success("Production job deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Only show orders that don't already have a production job (for the create form)
  const ordersWithoutJobs = orders.filter(
    (o: ProductOrder) =>
      !jobs.some((j: ProductionJob) => String(j.orderId) === String(o.id)),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Production
          </h1>
          <p className="text-muted-foreground mt-1">
            Track each garment through the production pipeline.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} /> New Production Job
        </Button>
      </div>

      {/* Stage legend */}
      <div className="flex flex-wrap gap-2">
        {STAGES_IN_ORDER.map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${stageColors[s]}`}
            >
              {stageLabels[s]}
            </span>
            {i < STAGES_IN_ORDER.length - 1 && (
              <ArrowRight size={10} className="text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>

      {jobsLoading || ordersLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-16 text-center">
          <p className="text-muted-foreground">
            No production jobs yet. Create one to start tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: ProductionJob) => {
            const order = orderMap.get(String(job.orderId));
            const progress = getStageProgress(job.currentStage);
            const nextStage = getNextStage(job.currentStage);
            const isExpanded = expandedJob === String(job.id);

            return (
              <Collapsible
                key={String(job.id)}
                open={isExpanded}
                onOpenChange={(o) => setExpandedJob(o ? String(job.id) : null)}
              >
                <div className="bg-card rounded-lg border border-border shadow-xs">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Status dot */}
                      <div
                        className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${job.isCompleted ? "bg-green-500" : "bg-amber-400"}`}
                      />

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            {order ? (
                              <>
                                <p className="font-semibold text-foreground">
                                  {order.styleName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.customerName} ·{" "}
                                  <span className="font-mono text-xs text-primary">
                                    {order.orderNumber}
                                  </span>
                                </p>
                              </>
                            ) : (
                              <p className="font-medium text-muted-foreground">
                                Order #{String(job.orderId)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${stageColors[job.currentStage] ?? ""}`}
                            >
                              {stageLabels[job.currentStage] ??
                                job.currentStage}
                            </span>
                            {job.isCompleted ? (
                              <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                <CheckCircle size={13} /> Completed
                              </span>
                            ) : nextStage ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleAdvance(job)}
                                disabled={advanceStage.isPending}
                              >
                                {advanceStage.isPending &&
                                advanceStage.variables?.jobId === job.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <ArrowRight size={12} />
                                )}
                                {stageLabels[nextStage]}
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(job.id)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {progress}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {/* Stage indicators */}
                          <div className="flex justify-between mt-1.5">
                            {STAGES_IN_ORDER.map((s) => {
                              const stageIdx = STAGES_IN_ORDER.indexOf(s);
                              const currentIdx = STAGES_IN_ORDER.indexOf(
                                job.currentStage,
                              );
                              const isDone = stageIdx <= currentIdx;
                              return (
                                <div
                                  key={s}
                                  className={`w-2 h-2 rounded-full ${isDone ? "bg-primary" : "bg-muted"}`}
                                  title={stageLabels[s]}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Toggle */}
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Stage history */}
                  <CollapsibleContent>
                    <div className="border-t border-border px-5 pb-4 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Stage History
                      </p>
                      {job.stageHistory.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No history yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {job.stageHistory.map(
                            (entry: StageHistoryEntry, idx: number) => (
                              <div
                                key={`${entry.stage}-${idx}`}
                                className="flex items-center gap-3"
                              >
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${stageColors[entry.stage] ?? ""}`}
                                >
                                  {stageLabels[entry.stage] ?? entry.stage}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(entry.completedAt)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-border/60">
                        <p className="text-xs text-muted-foreground">
                          Started: {formatTimestamp(job.startedAt)}
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              New Production Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Order *</Label>
              <Select
                value={createForm.orderId}
                onValueChange={(v) =>
                  setCreateForm((f) => ({ ...f, orderId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an order..." />
                </SelectTrigger>
                <SelectContent>
                  {ordersWithoutJobs.length === 0 ? (
                    <SelectItem value="none" disabled>
                      All orders already have production jobs
                    </SelectItem>
                  ) : (
                    ordersWithoutJobs.map((o: ProductOrder) => (
                      <SelectItem key={String(o.id)} value={String(o.id)}>
                        {o.orderNumber} — {o.customerName} ({o.styleName})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Starting Stage</Label>
              <Select
                value={createForm.initialStage}
                onValueChange={(v) =>
                  setCreateForm((f) => ({ ...f, initialStage: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES_IN_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {stageLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createJob.isPending}>
              {createJob.isPending && (
                <Loader2 size={14} className="mr-2 animate-spin" />
              )}
              Create Job
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
            <AlertDialogTitle>Delete Production Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this production job and its stage
              history.
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
