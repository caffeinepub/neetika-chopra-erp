import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface ProductOrder {
    id: OrderId;
    customerName: string;
    status: OrderStatus;
    customerContact: string;
    createdAt: Time;
    size: string;
    deliveryDate: string;
    productId: ProductId;
    orderType: Variant_MTO_readyStock;
    notes: string;
    quantity: bigint;
    orderNumber: string;
    styleName: string;
}
export type Time = bigint;
export interface ProductionJob {
    id: ProductionJobId;
    startedAt: Time;
    isCompleted: boolean;
    stageHistory: Array<StageHistoryEntry>;
    orderId: OrderId;
    currentStage: ProductionStage;
}
export interface StageHistoryEntry {
    completedAt: Time;
    stage: ProductionStage;
}
export type ProductionJobId = bigint;
export interface JobWorkAssignment {
    id: JobWorkAssignmentId;
    productionJobId: ProductionJobId;
    status: JobWorkAssignmentStatus;
    actualReturnDate?: Time;
    jobWorkerId: JobWorkerId;
    stage: ProductionStage;
    expectedReturnDate: Time;
    notes: string;
    assignedDate: Time;
}
export type JobWorkAssignmentId = bigint;
export type InventoryItemId = bigint;
export interface InventoryItem {
    id: InventoryItemId;
    name: string;
    unit: InventoryUnit;
    lastUpdated: Time;
    category: InventoryCategory;
    reorderLevel: number;
    currentStock: number;
}
export interface JobWorker {
    id: JobWorkerId;
    name: string;
    contactPerson: string;
    isActive: boolean;
    specialty: JobWorkerSpecialty;
    phone: string;
    location: string;
}
export type JobWorkerId = bigint;
export type ProductId = bigint;
export interface Product {
    id: ProductId;
    name: string;
    isActive: boolean;
    sizes: Array<string>;
    category: string;
    basePrice: bigint;
    material: string;
}
export type OrderId = bigint;
export enum InventoryCategory {
    other = "other",
    trim = "trim",
    thread = "thread",
    fabric = "fabric"
}
export enum InventoryUnit {
    kg = "kg",
    meter = "meter",
    roll = "roll",
    piece = "piece"
}
export enum JobWorkAssignmentStatus {
    pending = "pending",
    rejected = "rejected",
    inProgress = "inProgress",
    returned = "returned"
}
export enum JobWorkerSpecialty {
    embroidery = "embroidery",
    both = "both",
    stitching = "stitching"
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    dispatched = "dispatched",
    inProduction = "inProduction",
    confirmed = "confirmed"
}
export enum ProductionStage {
    embroidery = "embroidery",
    dispatchReady = "dispatchReady",
    qualityCheck = "qualityCheck",
    stitching = "stitching",
    finishing = "finishing",
    cutting = "cutting"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_MTO_readyStock {
    MTO = "MTO",
    readyStock = "readyStock"
}
export interface backendInterface {
    advanceProductionJobStage(jobId: ProductionJobId, newStage: ProductionStage): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createInventoryItem(name: string, category: InventoryCategory, unit: InventoryUnit, currentStock: number, reorderLevel: number): Promise<InventoryItemId>;
    createJobWorkAssignment(productionJobId: ProductionJobId, stage: ProductionStage, jobWorkerId: JobWorkerId, assignedDate: Time, expectedReturnDate: Time, notes: string): Promise<JobWorkAssignmentId>;
    createJobWorker(name: string, specialty: JobWorkerSpecialty, contactPerson: string, phone: string, location: string): Promise<JobWorkerId>;
    createOrder(orderNumber: string, customerName: string, customerContact: string, productId: ProductId, styleName: string, size: string, quantity: bigint, orderType: Variant_MTO_readyStock, deliveryDate: string, notes: string): Promise<OrderId>;
    createProduct(name: string, category: string, sizes: Array<string>, material: string, basePrice: bigint): Promise<ProductId>;
    createProductionJob(orderId: OrderId, currentStage: ProductionStage): Promise<ProductionJobId>;
    deleteInventoryItem(inventoryId: InventoryItemId): Promise<void>;
    deleteJobWorkAssignment(assignmentId: JobWorkAssignmentId): Promise<void>;
    deleteJobWorker(jobWorkerId: JobWorkerId): Promise<void>;
    deleteOrder(orderId: OrderId): Promise<void>;
    deleteProduct(productId: ProductId): Promise<void>;
    deleteProductionJob(jobId: ProductionJobId): Promise<void>;
    getActiveProducts(): Promise<Array<Product>>;
    getAllInventoryItems(): Promise<Array<InventoryItem>>;
    getAllJobWorkAssignments(): Promise<Array<JobWorkAssignment>>;
    getAllJobWorkers(): Promise<Array<JobWorker>>;
    getAllOrders(): Promise<Array<ProductOrder>>;
    getAllProductionJobs(): Promise<Array<ProductionJob>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInventoryItem(inventoryId: InventoryItemId): Promise<InventoryItem>;
    getJobWorkAssignment(assignmentId: JobWorkAssignmentId): Promise<JobWorkAssignment>;
    getJobWorkAssignmentsByJobAndWorker(productionJobId: ProductionJobId, jobWorkerId: JobWorkerId): Promise<Array<JobWorkAssignment>>;
    getJobWorker(jobWorkerId: JobWorkerId): Promise<JobWorker>;
    getLowStockItems(): Promise<Array<InventoryItem>>;
    getOrder(orderId: OrderId): Promise<ProductOrder>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<ProductOrder>>;
    getProduct(productId: ProductId): Promise<Product>;
    getProductionJob(jobId: ProductionJobId): Promise<ProductionJob>;
    getProductionJobsByOrderId(orderId: OrderId): Promise<Array<ProductionJob>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateInventoryItem(item: InventoryItem): Promise<void>;
    updateJobWorkAssignment(assignment: JobWorkAssignment): Promise<void>;
    updateJobWorker(worker: JobWorker): Promise<void>;
    updateOrder(order: ProductOrder): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateProductionJob(job: ProductionJob): Promise<void>;
}
