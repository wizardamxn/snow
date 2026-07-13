# Solar Vistar CRM — Engineering Portfolio Case Study

### 1. METADATA HEADER
* **Project Name:** **Solar Vistar CRM** — A high-performance, compliance-driven workflow automation and project management platform for residential and commercial solar installations, powered by React, Express, Prisma, and PostgreSQL.
* **Links/Metadata:**
  * **Status:** COMPLETED
  * **Role:** Lead Full-Stack Engineer
  * **Team Size:** 1 (Solo)
  * **Links:** [Source Repository](https://github.com/example/solar-vistar-crm) | [Live Demo](https://solar-vistar.example.com)
* **Stack:**
  * **Languages:** JavaScript (ES6+), SQL (PostgreSQL Dialect), Prisma Schema
  * **Frameworks:** React 18, Vite, Node.js, Express
  * **State Management:** Redux Toolkit (RTK) Query
  * **Databases & ORM:** PostgreSQL, Prisma ORM
  * **Asset Management:** Cloudinary API (Direct Write Streaming)
  * **UI & Styling:** Tailwind CSS, Phosphor Icons

---

### 2. CHALLENGES & INSIGHTS

* **Challenges:**
  * **Destructive Multi-Stage State Reordering:** Moving the `INSTALLATION` stage ahead of the `FILE_PREPARATION` stage introduced historical status conflicts. Pre-existing projects that were past `INSTALLATION` but had incomplete `FILE_PREPARATION` states faced logical loops, threatening data consistency.
  * **Resource-Constrained Asset Ingestion:** Standard file upload middlewares buffer incoming binary payloads (e.g., 3D CAD renders, PNG material lists) directly into the Node.js server RAM. This led to heap exhaustion and server crashes on small-footprint server instances.
  * **Reverse-Geocoding Rate Limits & Latency:** Resolving coordinates captured on site by technicians into human-readable locations via external APIs (e.g., OpenStreetMap Nominatim) led to slow response times and rate-limiting blocks during peak operational hours.
  * **Financial Mutability Risks:** Field staff could inadvertently or maliciously edit/reduce the calculated government subsidy value on quotations after submission, creating financial liabilities and auditing discrepancy risks.
  * **Concurrent Execution of Progression Events:** Multiple field technicians concurrently completing tasks within a stage triggered race conditions, causing duplicate executions of stage completion logic and redundant `MaintenancePlan` creations.

* **Insights & Solutions:**
  * **Schema-Backed Order Indexing:** Added an explicit, indexing `order` column (`Int`) to the `ProjectStage` model. This decoupled stage representation from database insertion sequence, enabling the frontend to sort pipelines via a simple `(a, b) => a.order - b.order` function.
  * **Multer-Free Upload Streaming:** Implemented a direct upload stream bypassing local disk/RAM buffering. By piping the incoming multiform request stream directly into the Cloudinary SDK write stream, memory consumption was kept constant regardless of the file size.
  * **Structured Location JSON Serializing:** Stored geolocation coordinates and human-readable tags as a single stringified JSON object `{ lat, lng, tagName }` inside the existing `siteLocation` text field. This avoided unnecessary DB table bloating while enabling coordinate lookups on the frontend.
  * **Immutable DB Controller Guards:** Enforced rigid back-end controller checks in `quotationController.js` rejecting any `PATCH` payload that attempts to decrease the existing `subsidy` value. This was matched on the frontend with React form state locking.
  * **Pessimistic DB Locks & Idempotency Keys:** Wrapped the stage progression check inside a database transaction (`prisma.$transaction`) with pessimistic locks. This ensured that the post-installation 5-year maintenance plan is initialized exactly once per project.

---

### 3. OVERVIEW

Solar Vistar CRM is an enterprise-grade customer relationship management and compliance tracking platform designed to optimize the end-to-end solar installation lifecycle. The platform automates operations from lead acquisition and quotation calculations to technical site surveys, multi-agency compliance documentation, and post-installation maintenance. It features a robust asset processing pipeline that ingests and maps critical compliance files (such as DCR Certificates, net metering stamps, and 3D design layouts) to individual project stages, keeping workflows organized and audit-ready.

The system utilizes a decoupled, two-tier architecture consisting of a React 18 client application and a RESTful Node.js/Express backend. The frontend uses Redux Toolkit (RTK) Query to minimize redundant network calls through client-side state caching and instant UI cache invalidation. The backend handles business logic, security policies, and progress engines, interacting with a PostgreSQL database via the Prisma ORM. Asset storage is delegated to Cloudinary, ensuring the server remains lightweight and stateless.

---

### 4. KEY FEATURES

* **Document Management & Verification Pipeline**
  * Polymorphic document storage linked to multiple entities (Leads, Projects, Visits, Tasks) via nullable foreign keys.
  * Hard constraints on file types, permitting only `.png` uploads for Material Lists and `.pdf` files for 3D layout designs.
  * Cloudinary upload optimization storing metadata (secure URL, size in bytes, public ID, format) directly in the PostgreSQL database.
  * Audit logs and soft deletes (`deletedAt` timestamps) tracking document uploads and removals.

* **Dynamic Project Stage & Compliance Tracking**
  * Six-stage workflow progression tracking projects through Documentation, Technical & Financial, Installation, File Preparation, Government Approvals, and Subsidy.
  * Automated progress percentage computation derived programmatically from the ratio of completed to total stage tasks.
  * Auto-assignment of tasks to specific operational departments (e.g., routing Net Metering documents to the Government Approvals team).
  * Transactional state transitions executing automated stage promotion whenever all required tasks in the current stage are marked complete.

* **Quotation & Subsidy Control System**
  * Structured panel and inverter specs tracking, covering wattage capacity, physical counts, warranty terms, and layout photos.
  * Server-side immutability checks preventing down-adjustments to the `subsidy` field after its initial lock.
  * Custom cabling parameters documenting electrical constraints (DC/AC cable cross-section in sq mm, brand selections).
  * Instant financial calculations mapping overall installation size (kW) to regional subsidy brackets.

* **Field Operations & Geotagged Site Visits**
  * Integrated mobile geolocation logging via the HTML5 `Geolocation API`.
  * External reverse-geocoding using Nominatim to resolve coordinates into human-readable landmark descriptors.
  * Relaxed access policies enabling both administrators and field staff to schedule and assign site visits.
  * JSON-isolated notes sections supporting structured data collection for inverter configurations and shading analysis.

* **Automated 5-Year Maintenance Lifecycle**
  * Automated generation of a 5-year maintenance plan upon completion of the physical `INSTALLATION` stage.
  * Automatic scheduling of 5 annual maintenance checkups using the installation completion timestamp as the baseline.
  * State tracking monitoring checkup progression across `PENDING`, `SCHEDULED`, `COMPLETED`, `OVERDUE`, and `SKIPPED` statuses.
  * Admin assignment mechanisms and upload portals dedicated to annual physical inspection reports.

* **Administrative Analytics & Observability**
  * Centralized event log (`ActivityLog`) capturing changes with JSON diff payloads, tracking what changed, who changed it, and when.
  * Proactive alerts scanning the database for overdue maintenance visits and missing documents for active stages.
  * KPI metrics dashboards showcasing real-time data on active projects, monthly conversions, and pending government sanctions.

---

### 5. ARCHITECTURE

```
+-----------------------------------------------------------------------+
|                           React 18 Client                             |
|              (Vite, RTK Query, Redux Toolkit, Tailwind)               |
+------------------------------------+----------------------------------+
                                     |
                                     | JSON payload via REST (HTTP)
                                     v
+-----------------------------------------------------------------------+
|                    Node.js / Express Backend Server                   |
|       (Routing, JWT Authentication, Controller Logic, Services)       |
+---------+--------------------------+-----------------------+----------+
          |                          |                       |
          | Prisma Client            | Cloudinary SDK        | HTTP GET
          v                          v                       v
+------------------+       +-------------------+   +--------------------+
| PostgreSQL DB    |       |  Cloudinary API   |   | OSM Nominatim API  |
| (Relational)     |       | (Object Storage)  |   | (Reverse Geocode)  |
+------------------+       +-------------------+   +--------------------+
```

---

### 6. WORKFLOWS

#### Ingestion Flow
1. **Initiate Request:** A user uploads a file (e.g., a `DCR_CERTIFICATE` PDF) via the React frontend.
2. **Size and Type Sanity Check:** Client-side validation checks the file size (under 10MB) and format before sending a `multipart/form-data` request to `/api/documents`.
3. **Write-Through Streaming:** The Express server intercepts the upload, bypassing local disk storage by streaming the file chunks directly to the Cloudinary API.
4. **Cloudinary Response:** Cloudinary processes the file and returns metadata (secure URL, size, format, public ID).
5. **Database Transaction:** The backend initiates a transaction using Prisma:
   - Inserts a new `Document` row with the Cloudinary metadata.
   - Links the document ID to the corresponding `ProjectTask` and the current `User` (uploader).
6. **Task Progress Evaluation:** The backend checks if the upload satisfies a required task for the current stage.
7. **Transition Phase:** If yes, the `ProjectTask` is marked `COMPLETED` and the `Project` progress percentage is recalculated.
8. **Cache Invalidation:** The database transaction commits, and a `201 Created` response is returned. RTK Query invalidates the local state, refreshing the dashboard view for the user.

#### Query Flow
1. **Request Dispatch:** A user opens the Project Workspace page, dispatching a query to `GET /api/projects/:id`.
2. **Authorization Hook:** Request headers are inspected by the `protect` middleware to validate the JWT and map user permissions.
3. **Database Query:** The controller queries PostgreSQL via Prisma:
   - Fetches the `Project` record.
   - Eager-loads stages and tasks, sorted ascending by their `order` index.
   - Eager-loads associated documents, filtered by their category.
   - Eager-loads the `MaintenancePlan` and its related `MaintenanceCheckup` records.
4. **Dynamic Overdue Calculations:** The server iterates through any `PENDING` checkups. If the checkup's `dueDate` is older than the current date, its status is dynamically updated to `OVERDUE` in the response payload.
5. **Serialization:** The server formats the returned payload into a unified JSON structure containing the success state, HTTP status, and response data.
6. **State Hydration:** The React frontend updates its Redux store. The UI renders the custom sorted stages and dynamically highlights overdue maintenance milestones.

---

### 7. DATA MODEL

#### User
* **Role:** Represents system operators, salesmen, administrators, and field engineers.
* **Key Fields:** `id` (UUID, PK), `name`, `email` (Unique), `passwordHash`, `role` (Enum: `ADMIN`, `STAFF`), `isActive` (Boolean), `departmentId` (FK).
* **Isolation & Constraints:** Cascades deletions to logs; soft-deletable to retain operational history.

#### Lead
* **Role:** Tracks potential clients prior to contract conversion.
* **Key Fields:** `id` (UUID, PK), `customerName`, `phoneNumber`, `email`, `address`, `status` (Enum: `NEW`, `CONTACTED`, `INTERESTED`, `NOT_INTERESTED`, `CONVERTED`).
* **Isolation & Constraints:** Indexed on `customerName` and `phoneNumber` for fast search performance.

#### FollowUp
* **Role:** Tracks client interactions (calls, emails, WhatsApp messages).
* **Key Fields:** `id` (UUID, PK), `method` (Enum), `remarks`, `nextFollowUpDate`, `leadId` (FK).
* **Isolation & Constraints:** Cascadable delete from `Lead`.

#### Visit
* **Role:** Records physical site visits, surveys, and solar assessments.
* **Key Fields:** `id` (UUID, PK), `customerName`, `visitDatetime`, `status` (Enum), `siteLocation` (JSON string for coordinates), `solarNotes` (JSON), `inverterNotes` (JSON).
* **Isolation & Constraints:** Technical details are stored in JSON columns to accommodate flexible questionnaires without schema changes.

#### Quotation
* **Role:** Detailed technical and financial proposals.
* **Key Fields:** `id` (UUID, PK), `leadId` (FK), `amount` (Float), `panelName`, `numberOfPanels` (Int), `inverterSizeKw` (Float), `numberOfInverters` (Int), `subsidy` (Float, locked once set).
* **Isolation & Constraints:** Cascades delete from `Lead`.

#### Document
* **Role:** Metadata records for files stored on Cloudinary.
* **Key Fields:** `id` (UUID, PK), `url`, `publicId` (Unique), `format`, `bytes`, `category` (String), `leadId` (Nullable FK), `visitId` (Nullable FK), `projectId` (Nullable FK), `taskId` (Nullable FK).
* **Isolation & Constraints:** Indexes on foreign keys and categories ensure rapid retrieval of document lists.

#### Project
* **Role:** Represents converted leads undergoing active installation and compliance.
* **Key Fields:** `id` (UUID, PK), `leadId` (FK), `status` (Enum: `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`), `currentStage` (Enum: `StageName`), `progressPercent` (Float).
* **Isolation & Constraints:** Tracks overall progress percentage dynamically.

#### ProjectStage
* **Role:** Mid-level stages of the project pipeline.
* **Key Fields:** `id` (UUID, PK), `projectId` (FK), `name` (Enum: `StageName`), `status` (Enum), `order` (Int), `startedAt`, `completedAt`.
* **Isolation & Constraints:** Unique constraint on `[projectId, name]` prevents duplicate stages within a single project.

#### ProjectTask
* **Role:** Granular compliance steps required within a project stage.
* **Key Fields:** `id` (UUID, PK), `projectId` (FK), `stageId` (FK), `name`, `status` (Enum).
* **Isolation & Constraints:** Links to multiple documents in the verification pipeline.

#### GovtApprovalDetails
* **Role:** Tracks government clearance portal data.
* **Key Fields:** `id` (UUID, PK), `taskId` (FK, Unique), `portalName` (Enum), `referenceNumber`, `sanctionDate`.
* **Isolation & Constraints:** One-to-one relationship with `ProjectTask` to isolate portal-specific metadata.

#### SubsidyDetails
* **Role:** Tracks governmental subsidy applications and bank transactions.
* **Key Fields:** `id` (UUID, PK), `projectId` (FK, Unique), `status` (Enum), `redeemedAmount`, `disbursedAmount`, `transactionRef`.
* **Isolation & Constraints:** One-to-one relationship with `Project` to ensure distinct financial tracking.

#### MaintenancePlan
* **Role:** Tracks post-installation AMC and annual checkup operations.
* **Key Fields:** `id` (UUID, PK), `projectId` (FK, Unique), `installationDate` (DateTime).
* **Isolation & Constraints:** Generated automatically upon installation completion; has a 1-to-many relationship with checkups.

#### MaintenanceCheckup
* **Role:** Tracks yearly inspection visits over the 5-year maintenance period.
* **Key Fields:** `id` (UUID, PK), `planId` (FK), `year` (Int), `dueDate` (DateTime), `status` (Enum: `PENDING`, `SCHEDULED`, `COMPLETED`, `OVERDUE`, `SKIPPED`), `notes` (Text).
* **Isolation & Constraints:** Unique index on `[planId, year]` guarantees exactly one checkup per contract year.

---

### 8. OUTCOME

Solar Vistar CRM delivers a production-grade operations management system that guarantees clean separation of concerns, transactional reliability, and complete traceability. By using Prisma-managed database transactions, the system prevents race conditions and ensures data integrity during critical status changes and automated task creations. Financial safeguards, like locking subsidy fields, protect the business from revenue leakage. Combined with direct-stream asset uploads that prevent server overload, the application is built to scale reliably under heavy field usage, providing a solid foundation for solar installation management.
