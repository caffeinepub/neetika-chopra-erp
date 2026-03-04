# Neetika Chopra ERP

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- **Dashboard**: Summary KPIs — open orders, in-production count, pending job work, low stock alerts
- **Order Management**: Create and manage customer orders (ready stock + made-to-order). Fields: order ID, customer name, contact, style/SKU, size, quantity, delivery date, order type (Ready Stock / MTO)
- **Product Catalog**: Styles/SKUs with description, category, size variants, material, and base price
- **Inventory Management**: Track raw materials (fabric, trims, thread) with stock levels, low-stock alerts, and usage linking to orders
- **Production Tracking**: For each MTO order, create a production job with stage-wise progress: Cutting → Embroidery → Stitching → Finishing → Quality Check → Dispatch Ready
- **Job Work Management**: Assign production stages to external job workers (embroidery, stitching vendors). Track assignments: vendor name, stage, assigned date, expected return date, actual return date, status (Pending / In Progress / Returned / Rejected)
- **Job Workers Directory**: Manage external vendor profiles — name, specialty (embroidery/stitching), contact, location, active status
- **Sample content**: Pre-populated demo data for orders, products, inventory, production jobs, and job workers

### Modify
- None

### Remove
- None

## Implementation Plan
1. Backend: Define data models for Orders, Products, Inventory, ProductionJobs, JobWorkAssignments, JobWorkers
2. Backend: CRUD APIs for all entities; queries for dashboard stats (open orders, in-production count, pending job work, low-stock items)
3. Backend: Stage progression logic for production jobs (advance/revert stage)
4. Backend: Job work assignment linking production job stages to vendors
5. Frontend: App shell with sidebar navigation (Dashboard, Orders, Products, Inventory, Production, Job Work, Job Workers)
6. Frontend: Dashboard page with KPI cards and recent activity
7. Frontend: Orders list + create/edit form with order type toggle
8. Frontend: Products catalog with size variant management
9. Frontend: Inventory list with stock level indicators and low-stock alerts
10. Frontend: Production tracking board — stage pipeline view per job
11. Frontend: Job Work assignments list with status management
12. Frontend: Job Workers directory with create/edit
