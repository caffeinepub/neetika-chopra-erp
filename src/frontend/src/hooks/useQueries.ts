import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  InventoryItem,
  JobWorkAssignment,
  JobWorker,
  Product,
  ProductOrder,
  ProductionJob,
} from "../backend.d";
import { useActor } from "./useActor";

// Runtime enum values (re-exported as values since backend.d.ts enums are type-only)
export const OrderStatus = {
  cancelled: "cancelled",
  pending: "pending",
  dispatched: "dispatched",
  inProduction: "inProduction",
  confirmed: "confirmed",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const Variant_MTO_readyStock = {
  MTO: "MTO",
  readyStock: "readyStock",
} as const;
export type Variant_MTO_readyStock =
  (typeof Variant_MTO_readyStock)[keyof typeof Variant_MTO_readyStock];

export const InventoryCategory = {
  other: "other",
  trim: "trim",
  thread: "thread",
  fabric: "fabric",
} as const;
export type InventoryCategory =
  (typeof InventoryCategory)[keyof typeof InventoryCategory];

export const InventoryUnit = {
  kg: "kg",
  meter: "meter",
  roll: "roll",
  piece: "piece",
} as const;
export type InventoryUnit = (typeof InventoryUnit)[keyof typeof InventoryUnit];

export const JobWorkerSpecialty = {
  embroidery: "embroidery",
  both: "both",
  stitching: "stitching",
} as const;
export type JobWorkerSpecialty =
  (typeof JobWorkerSpecialty)[keyof typeof JobWorkerSpecialty];

export const ProductionStage = {
  cutting: "cutting",
  embroidery: "embroidery",
  stitching: "stitching",
  finishing: "finishing",
  qualityCheck: "qualityCheck",
  dispatchReady: "dispatchReady",
} as const;
export type ProductionStage =
  (typeof ProductionStage)[keyof typeof ProductionStage];

export const JobWorkAssignmentStatus = {
  pending: "pending",
  inProgress: "inProgress",
  returned: "returned",
  rejected: "rejected",
} as const;
export type JobWorkAssignmentStatus =
  (typeof JobWorkAssignmentStatus)[keyof typeof JobWorkAssignmentStatus];

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      const [orders, jobs, assignments, lowStockItems] = await Promise.all([
        actor.getAllOrders(),
        actor.getAllProductionJobs(),
        actor.getAllJobWorkAssignments(),
        actor.getLowStockItems(),
      ]);
      const openOrdersCount = orders.filter(
        (o) => o.status === "pending" || o.status === "confirmed",
      ).length;
      const inProductionCount = jobs.filter((j) => !j.isCompleted).length;
      const pendingJobWorkCount = assignments.filter(
        (a) => a.status === "pending" || a.status === "inProgress",
      ).length;
      return {
        openOrdersCount,
        inProductionCount,
        pendingJobWorkCount,
        lowStockItems,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function useAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<ProductOrder[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrdersByStatus(status: OrderStatus | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductOrder[]>({
    queryKey: ["orders", status],
    queryFn: async () => {
      if (!actor) return [];
      if (!status) return actor.getAllOrders();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.getOrdersByStatus(status as any);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      orderNumber: string;
      customerName: string;
      customerContact: string;
      productId: bigint;
      styleName: string;
      size: string;
      quantity: bigint;
      orderType: Variant_MTO_readyStock;
      deliveryDate: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createOrder(
        data.orderNumber,
        data.customerName,
        data.customerContact,
        data.productId,
        data.styleName,
        data.size,
        data.quantity,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.orderType as any,
        data.deliveryDate,
        data.notes,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: ProductOrder) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateOrder(order);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteOrder(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function useAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      sizes: string[];
      material: string;
      basePrice: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createProduct(
        data.name,
        data.category,
        data.sizes,
        data.material,
        data.basePrice,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateProduct(product);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function useAllInventoryItems() {
  const { actor, isFetching } = useActor();
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInventoryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateInventoryItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: InventoryCategory;
      unit: InventoryUnit;
      currentStock: number;
      reorderLevel: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.createInventoryItem(
        data.name,
        data.category as any,
        data.unit as any,
        data.currentStock,
        data.reorderLevel,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateInventoryItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: InventoryItem) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateInventoryItem(item);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeleteInventoryItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteInventoryItem(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

// ─── Job Workers ──────────────────────────────────────────────────────────────

export function useAllJobWorkers() {
  const { actor, isFetching } = useActor();
  return useQuery<JobWorker[]>({
    queryKey: ["jobWorkers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobWorkers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateJobWorker() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      specialty: JobWorkerSpecialty;
      contactPerson: string;
      phone: string;
      location: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.createJobWorker(
        data.name,
        data.specialty as any,
        data.contactPerson,
        data.phone,
        data.location,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobWorkers"] }),
  });
}

export function useUpdateJobWorker() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (worker: JobWorker) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateJobWorker(worker);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobWorkers"] }),
  });
}

export function useDeleteJobWorker() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteJobWorker(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobWorkers"] }),
  });
}

// ─── Production Jobs ──────────────────────────────────────────────────────────

export function useAllProductionJobs() {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionJob[]>({
    queryKey: ["productionJobs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProductionJobs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProductionJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      orderId: bigint;
      currentStage: ProductionStage;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.createProductionJob(data.orderId, data.currentStage as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productionJobs"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useAdvanceProductionJobStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { jobId: bigint; newStage: ProductionStage }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.advanceProductionJobStage(data.jobId, data.newStage as any);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productionJobs"] }),
  });
}

export function useUpdateProductionJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (job: ProductionJob) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateProductionJob(job);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productionJobs"] }),
  });
}

export function useDeleteProductionJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteProductionJob(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productionJobs"] }),
  });
}

// ─── Job Work Assignments ─────────────────────────────────────────────────────

export function useAllJobWorkAssignments() {
  const { actor, isFetching } = useActor();
  return useQuery<JobWorkAssignment[]>({
    queryKey: ["jobWorkAssignments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobWorkAssignments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateJobWorkAssignment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      productionJobId: bigint;
      stage: ProductionStage;
      jobWorkerId: bigint;
      assignedDate: bigint;
      expectedReturnDate: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createJobWorkAssignment(
        data.productionJobId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.stage as any,
        data.jobWorkerId,
        data.assignedDate,
        data.expectedReturnDate,
        data.notes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobWorkAssignments"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateJobWorkAssignment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: JobWorkAssignment) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateJobWorkAssignment(assignment);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobWorkAssignments"] }),
  });
}

export function useDeleteJobWorkAssignment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteJobWorkAssignment(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobWorkAssignments"] }),
  });
}
