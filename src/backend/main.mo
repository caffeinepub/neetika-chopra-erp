import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type Definitions
  type ProductId = Nat;
  type OrderId = Nat;
  type InventoryItemId = Nat;
  type JobWorkerId = Nat;
  type ProductionJobId = Nat;
  type JobWorkAssignmentId = Nat;

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type Product = {
    id : ProductId;
    name : Text;
    category : Text;
    sizes : [Text];
    material : Text;
    basePrice : Nat;
    isActive : Bool;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  type OrderStatus = {
    #pending;
    #confirmed;
    #inProduction;
    #dispatched;
    #cancelled;
  };

  type ProductOrder = {
    id : OrderId;
    orderNumber : Text;
    customerName : Text;
    customerContact : Text;
    productId : ProductId;
    styleName : Text;
    size : Text;
    quantity : Nat;
    orderType : {
      #readyStock;
      #MTO;
    };
    deliveryDate : Text;
    status : OrderStatus;
    notes : Text;
    createdAt : Time.Time;
  };

  module ProductOrder {
    public func compareByCreatedAt(o1 : ProductOrder, o2 : ProductOrder) : Order.Order {
      Int.compare(o1.createdAt, o2.createdAt);
    };
  };

  type InventoryCategory = { #fabric; #trim; #thread; #other };
  type InventoryUnit = { #meter; #piece; #roll; #kg };

  type InventoryItem = {
    id : InventoryItemId;
    name : Text;
    category : InventoryCategory;
    unit : InventoryUnit;
    currentStock : Float;
    reorderLevel : Float;
    lastUpdated : Time.Time;
  };

  module InventoryItem {
    public func compareByStock(i1 : InventoryItem, i2 : InventoryItem) : Order.Order {
      Float.compare(i1.currentStock, i2.currentStock);
    };
  };

  type JobWorkerSpecialty = {
    #embroidery;
    #stitching;
    #both;
  };

  type JobWorker = {
    id : JobWorkerId;
    name : Text;
    specialty : JobWorkerSpecialty;
    contactPerson : Text;
    phone : Text;
    location : Text;
    isActive : Bool;
  };

  module JobWorker {
    public func compare(w1 : JobWorker, w2 : JobWorker) : Order.Order {
      Nat.compare(w1.id, w2.id);
    };
  };

  type ProductionStage = {
    #cutting;
    #embroidery;
    #stitching;
    #finishing;
    #qualityCheck;
    #dispatchReady;
  };

  type StageHistoryEntry = {
    stage : ProductionStage;
    completedAt : Time.Time;
  };

  type ProductionJob = {
    id : ProductionJobId;
    orderId : OrderId;
    currentStage : ProductionStage;
    stageHistory : [StageHistoryEntry];
    startedAt : Time.Time;
    isCompleted : Bool;
  };

  module ProductionJob {
    public func compare(j1 : ProductionJob, j2 : ProductionJob) : Order.Order {
      Nat.compare(j1.id, j2.id);
    };
  };

  type JobWorkAssignmentStatus = {
    #pending;
    #inProgress;
    #returned;
    #rejected;
  };

  type JobWorkAssignment = {
    id : JobWorkAssignmentId;
    productionJobId : ProductionJobId;
    stage : ProductionStage;
    jobWorkerId : JobWorkerId;
    assignedDate : Time.Time;
    expectedReturnDate : Time.Time;
    actualReturnDate : ?Time.Time;
    status : JobWorkAssignmentStatus;
    notes : Text;
  };

  module JobWorkAssignment {
    public func compareByAssignedDate(a1 : JobWorkAssignment, a2 : JobWorkAssignment) : Order.Order {
      Int.compare(a1.assignedDate, a2.assignedDate);
    };
  };

  // Storage
  let products = Map.empty<ProductId, Product>();
  let orders = Map.empty<OrderId, ProductOrder>();
  let inventory = Map.empty<InventoryItemId, InventoryItem>();
  let jobWorkers = Map.empty<JobWorkerId, JobWorker>();
  let productionJobs = Map.empty<ProductionJobId, ProductionJob>();
  let jobWorkAssignments = Map.empty<JobWorkAssignmentId, JobWorkAssignment>();

  var nextProductId = 1;
  var nextOrderId = 1;
  var nextInventoryItemId = 1;
  var nextJobWorkerId = 1;
  var nextProductionJobId = 1;
  var nextJobWorkAssignmentId = 1;

  // Common Helper Functions
  func getNextProductId() : ProductId {
    let id = nextProductId;
    nextProductId += 1;
    id;
  };

  func getNextOrderId() : OrderId {
    let id = nextOrderId;
    nextOrderId += 1;
    id;
  };

  func getNextInventoryItemId() : InventoryItemId {
    let id = nextInventoryItemId;
    nextInventoryItemId += 1;
    id;
  };

  func getNextJobWorkerId() : JobWorkerId {
    let id = nextJobWorkerId;
    nextJobWorkerId += 1;
    id;
  };

  func getNextProductionJobId() : ProductionJobId {
    let id = nextProductionJobId;
    nextProductionJobId += 1;
    id;
  };

  func getNextJobWorkAssignmentId() : JobWorkAssignmentId {
    let id = nextJobWorkAssignmentId;
    nextJobWorkAssignmentId += 1;
    id;
  };

  // CRUD Operations - Products (Admin only)
  public shared ({ caller }) func createProduct(name : Text, category : Text, sizes : [Text], material : Text, basePrice : Nat) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create products");
    };
    let productId = getNextProductId();
    let product : Product = {
      id = productId;
      name;
      category;
      sizes;
      material;
      basePrice;
      isActive = true;
    };
    products.add(productId, product);
    productId;
  };

  public query ({ caller }) func getProduct(productId : ProductId) : async Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    switch (products.get(productId)) {
      case (null) {
        Runtime.trap("Product does not exist");
      };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray().sort();
  };

  public query ({ caller }) func getActiveProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray().filter(func(p) { p.isActive }).sort();
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(product.id)) {
      case (null) {
        Runtime.trap("Product does not exist");
      };
      case (?_existingProduct) {
        products.add(product.id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    if (not products.containsKey(productId)) {
      Runtime.trap("Product does not exist");
    };
    products.remove(productId);
  };

  // Orders (User level)
  public shared ({ caller }) func createOrder(orderNumber : Text, customerName : Text, customerContact : Text, productId : ProductId, styleName : Text, size : Text, quantity : Nat, orderType : { #readyStock; #MTO }, deliveryDate : Text, notes : Text) : async OrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };
    let orderId = getNextOrderId();
    let order : ProductOrder = {
      id = orderId;
      orderNumber;
      customerName;
      customerContact;
      productId;
      styleName;
      size;
      quantity;
      orderType;
      deliveryDate;
      status = #pending;
      notes;
      createdAt = Time.now();
    };
    orders.add(orderId, order);
    orderId;
  };

  public query ({ caller }) func getOrder(orderId : OrderId) : async ProductOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    switch (orders.get(orderId)) {
      case (null) {
        Runtime.trap("Order does not exist");
      };
      case (?order) { order };
    };
  };

  public query ({ caller }) func getAllOrders() : async [ProductOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray().sort(ProductOrder.compareByCreatedAt);
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [ProductOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray().filter(func(o) { o.status == status }).sort(ProductOrder.compareByCreatedAt);
  };

  public shared ({ caller }) func updateOrder(order : ProductOrder) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update orders");
    };
    switch (orders.get(order.id)) {
      case (null) {
        Runtime.trap("Order does not exist");
      };
      case (?_existingOrder) {
        orders.add(order.id, order);
      };
    };
  };

  public shared ({ caller }) func deleteOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete orders");
    };
    if (not orders.containsKey(orderId)) {
      Runtime.trap("Order does not exist");
    };
    orders.remove(orderId);
  };

  // Inventory (Admin only for modifications, users can view)
  public shared ({ caller }) func createInventoryItem(name : Text, category : InventoryCategory, unit : InventoryUnit, currentStock : Float, reorderLevel : Float) : async InventoryItemId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create inventory items");
    };
    let inventoryId = getNextInventoryItemId();
    let item : InventoryItem = {
      id = inventoryId;
      name;
      category;
      unit;
      currentStock;
      reorderLevel;
      lastUpdated = Time.now();
    };
    inventory.add(inventoryId, item);
    inventoryId;
  };

  public query ({ caller }) func getInventoryItem(inventoryId : InventoryItemId) : async InventoryItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory");
    };
    switch (inventory.get(inventoryId)) {
      case (null) {
        Runtime.trap("Inventory item does not exist");
      };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getAllInventoryItems() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory");
    };
    inventory.values().toArray();
  };

  public query ({ caller }) func getLowStockItems() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory");
    };
    inventory.values().toArray().filter(func(i) { i.currentStock <= i.reorderLevel }).sort(InventoryItem.compareByStock);
  };

  public shared ({ caller }) func updateInventoryItem(item : InventoryItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update inventory items");
    };
    switch (inventory.get(item.id)) {
      case (null) {
        Runtime.trap("Inventory item does not exist");
      };
      case (?_existingItem) {
        inventory.add(item.id, item);
      };
    };
  };

  public shared ({ caller }) func deleteInventoryItem(inventoryId : InventoryItemId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete inventory items");
    };
    if (not inventory.containsKey(inventoryId)) {
      Runtime.trap("Inventory item does not exist");
    };
    inventory.remove(inventoryId);
  };

  // Job Workers (Admin only for modifications, users can view)
  public shared ({ caller }) func createJobWorker(name : Text, specialty : JobWorkerSpecialty, contactPerson : Text, phone : Text, location : Text) : async JobWorkerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create job workers");
    };
    let jobWorkerId = getNextJobWorkerId();
    let worker : JobWorker = {
      id = jobWorkerId;
      name;
      specialty;
      contactPerson;
      phone;
      location;
      isActive = true;
    };
    jobWorkers.add(jobWorkerId, worker);
    jobWorkerId;
  };

  public query ({ caller }) func getJobWorker(jobWorkerId : JobWorkerId) : async JobWorker {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view job workers");
    };
    switch (jobWorkers.get(jobWorkerId)) {
      case (null) {
        Runtime.trap("Job worker does not exist");
      };
      case (?worker) { worker };
    };
  };

  public query ({ caller }) func getAllJobWorkers() : async [JobWorker] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view job workers");
    };
    jobWorkers.values().toArray().sort();
  };

  public shared ({ caller }) func updateJobWorker(worker : JobWorker) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update job workers");
    };
    switch (jobWorkers.get(worker.id)) {
      case (null) {
        Runtime.trap("Job worker does not exist");
      };
      case (?_existingWorker) {
        jobWorkers.add(worker.id, worker);
      };
    };
  };

  public shared ({ caller }) func deleteJobWorker(jobWorkerId : JobWorkerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete job workers");
    };
    if (not jobWorkers.containsKey(jobWorkerId)) {
      Runtime.trap("Job worker does not exist");
    };
    jobWorkers.remove(jobWorkerId);
  };

  // Production Jobs (User level)
  public shared ({ caller }) func createProductionJob(orderId : OrderId, currentStage : ProductionStage) : async ProductionJobId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create production jobs");
    };
    let jobId = getNextProductionJobId();
    let job : ProductionJob = {
      id = jobId;
      orderId;
      currentStage;
      stageHistory = [];
      startedAt = Time.now();
      isCompleted = false;
    };
    productionJobs.add(jobId, job);
    jobId;
  };

  public query ({ caller }) func getProductionJob(jobId : ProductionJobId) : async ProductionJob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production jobs");
    };
    switch (productionJobs.get(jobId)) {
      case (null) {
        Runtime.trap("Production job does not exist");
      };
      case (?job) { job };
    };
  };

  public query ({ caller }) func getAllProductionJobs() : async [ProductionJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production jobs");
    };
    productionJobs.values().toArray().sort();
  };

  public query ({ caller }) func getProductionJobsByOrderId(orderId : OrderId) : async [ProductionJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production jobs");
    };
    productionJobs.values().toArray().filter(func(j) { j.orderId == orderId });
  };

  public shared ({ caller }) func updateProductionJob(job : ProductionJob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update production jobs");
    };
    productionJobs.add(job.id, job);
  };

  public shared ({ caller }) func deleteProductionJob(jobId : ProductionJobId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete production jobs");
    };
    if (not productionJobs.containsKey(jobId)) {
      Runtime.trap("Production job does not exist");
    };
    productionJobs.remove(jobId);
  };

  // Job Work Assignments (User level)
  public shared ({ caller }) func createJobWorkAssignment(productionJobId : ProductionJobId, stage : ProductionStage, jobWorkerId : JobWorkerId, assignedDate : Time.Time, expectedReturnDate : Time.Time, notes : Text) : async JobWorkAssignmentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create job work assignments");
    };
    let assignmentId = getNextJobWorkAssignmentId();
    let assignment : JobWorkAssignment = {
      id = assignmentId;
      productionJobId;
      stage;
      jobWorkerId;
      assignedDate;
      expectedReturnDate;
      actualReturnDate = null;
      status = #pending;
      notes;
    };
    jobWorkAssignments.add(assignmentId, assignment);
    assignmentId;
  };

  public query ({ caller }) func getJobWorkAssignment(assignmentId : JobWorkAssignmentId) : async JobWorkAssignment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view job work assignments");
    };
    switch (jobWorkAssignments.get(assignmentId)) {
      case (null) {
        Runtime.trap("Job work assignment does not exist");
      };
      case (?assignment) { assignment };
    };
  };

  public query ({ caller }) func getAllJobWorkAssignments() : async [JobWorkAssignment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view job work assignments");
    };
    jobWorkAssignments.values().toArray();
  };

  public query ({ caller }) func getJobWorkAssignmentsByJobAndWorker(productionJobId : ProductionJobId, jobWorkerId : JobWorkerId) : async [JobWorkAssignment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view job work assignments");
    };
    jobWorkAssignments.values().toArray().filter(func(a) { a.productionJobId == productionJobId and a.jobWorkerId == jobWorkerId }).sort(JobWorkAssignment.compareByAssignedDate);
  };

  public shared ({ caller }) func updateJobWorkAssignment(assignment : JobWorkAssignment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update job work assignments");
    };
    switch (jobWorkAssignments.get(assignment.id)) {
      case (null) {
        Runtime.trap("Job work assignment does not exist");
      };
      case (?_existingAssignment) {
        jobWorkAssignments.add(assignment.id, assignment);
      };
    };
  };

  public shared ({ caller }) func deleteJobWorkAssignment(assignmentId : JobWorkAssignmentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete job work assignments");
    };
    if (not jobWorkAssignments.containsKey(assignmentId)) {
      Runtime.trap("Job work assignment does not exist");
    };
    jobWorkAssignments.remove(assignmentId);
  };

  // Advance Production Job Stage (User level)
  public shared ({ caller }) func advanceProductionJobStage(jobId : ProductionJobId, newStage : ProductionStage) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can advance production job stages");
    };
    switch (productionJobs.get(jobId)) {
      case (null) {
        Runtime.trap("Production job does not exist");
      };
      case (?job) {
        let stageEntry : StageHistoryEntry = {
          stage = job.currentStage;
          completedAt = Time.now();
        };
        let updatedHistory = job.stageHistory.concat([stageEntry]);
        let updatedJob : ProductionJob = {
          job with
          currentStage = newStage;
          stageHistory = updatedHistory;
        };
        productionJobs.add(jobId, updatedJob);
      };
    };
  };
};
