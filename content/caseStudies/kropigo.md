# **Kropigo: A High-Throughput Peer-to-Peer Agricultural Marketplace Monorepo**

> **Kropigo** is a production-grade peer-to-peer agricultural marketplace monorepo designed to connect Indian farmers (*Kisans*) directly with bulk buyers. It streamlines agricultural trade via real-time listing negotiations, automated price benchmarking against national market rates, and transactional order fulfillment pipelines.

---

### **1. METADATA HEADER**

*   **Project Name:** **Kropigo** — *A modern, real-time agricultural marketplace monorepo connecting farmers directly to bulk buyers, powered by Next.js 15, Express.js, and MongoDB.*
*   **Links/Metadata:**
    *   **Status:** `COMPLETED`
    *   **Source Code:** [GitHub Repository](https://github.com/wizardamxn/Kropigo) (Private Sandbox)
    *   **Live Demo:** [kropigo.freelance.internal](http://localhost:3000) (Staging)
    *   **Role:** Lead Full-Stack AI & Systems Engineer
    *   **Team Size:** 1 (Solo Developer)
*   **Stack:**
    *   **Languages:** TypeScript (v5.4), JavaScript (ESNext)
    *   **Frontend Framework:** Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI
    *   **State Management & Caching:** Redux Toolkit (RTK), RTK Query (RTKQ)
    *   **Backend Framework:** Node.js, Express.js
    *   **Database & ODM:** MongoDB, Mongoose (v8.x)
    *   **Real-Time Transport:** Socket.io (WebSocket), Socket.io-client
    *   **Data Validation:** Zod (v3.x)
    *   **Task Scheduling:** Node-cron (Timezone: `Asia/Kolkata`)
    *   **Media Storage:** Cloudinary CDN (Direct Signature Upload)
    *   **Monorepo Tooling:** pnpm Workspaces

---

### **2. CHALLENGES & INSIGHTS**

#### **Challenges**
1.  **Race Conditions and Double-Allocation in Deal Confirmation:** When a farmer accepts an interest on a high-demand crop listing, multiple concurrent incoming API requests could attempt to confirm the same listing. This threatened to spawn duplicate orders or double-allocate the same harvest crop to different buyers.
2.  **State Synchronization and Room Leaks in Real-time WebSockets:** Maintaining authenticated real-time WebSocket channels in a multi-role (Kisan, Buyer, Admin) workspace. Standard headers are not easily sent during native WebSocket upgrades. We had to parse secure `httpOnly` JWT cookies directly from handshake headers and prevent connection leaks during client route changes.
3.  **Cross-Boundary Validation Duplication in pnpm Monorepos:** Code duplication between frontend form inputs, server route validation middleware, and Mongoose schema layers. Standardizing structural shapes across client and server threatened to cause circular dependency locks or bundler compilation issues.
4.  **Orphaned Cloudinary Assets from API Failures:** During listing creation, buyers upload up to 6 media files directly to Cloudinary. If the subsequent MongoDB write failed due to validation or network issues, those uploaded files became orphaned, bloating cloud storage.
5.  **Timezone Shifts in Batch Operations:** Expiration checks and automated publishing windows (e.g., closing trading hours at 5:00 PM) behaved inconsistently. Server deployments running on UTC containers caused listings to expire ahead of Indian Standard Time (IST), disrupting the farmers' trading schedules.

#### **Insights**
1.  **ACID Transactions with Mongoose Sessions:** Enforced transactional isolation in `acceptInterest` using MongoDB sessions. Wrapped listing status changes, duplicate check locks, other interest rejections, and order creations into a single atomic transaction block (`session.withTransaction`). This guarantees that either all state changes commit together, or the entire operation rolls back.
2.  **Cookie-Authenticated Socket.io Handshakes:** Designed a custom Socket.io authorization middleware. This middleware extracts raw cookie strings from `socket.handshake.headers.cookie` during the WebSocket upgrade handshake. It decodes the JWT token server-side, binds authenticated user identities to Socket rooms (`socket.join(userId)`), and assigns admins to a global `admin_room`.
3.  **Shared Monorepo Schemas Package:** Abstracted shared validation shapes into a local monorepo package `packages/schemas`. Created single-source-of-truth Zod schemas (e.g., `updateOrderStatusSchema`) and exported compiled TypeScript interfaces. This package is referenceable by both `apps/web` (for React Hook Form validation) and `apps/server` (for route middleware validation).
4.  **Transaction-Aware Reverse Cloudinary Cleanup:** Designed a defensive upload pipeline. The client fetches a signed upload URL from `GET /api/v1/media/signature`, uploads directly to Cloudinary, and passes secure URLs to the server. If the server database write fails, the server intercepts the exception and fires an immediate API call to Cloudinary's admin SDK to delete the newly uploaded assets using their secure URLs.
5.  **Timezone-Pinned Node-Cron Scheduling:** Explicitly configured all `node-cron` schedules with the `{ timezone: "Asia/Kolkata" }` parameter. Pinned the application process environment to `process.env.TZ = 'Asia/Kolkata'` to ensure deterministic execution of daily batch transitions at 5:00 PM IST and midnight IST.

---

### **3. OVERVIEW**

Kropigo is a modern peer-to-peer agricultural marketplace monorepo designed to eliminate exploitative middlemen and connect Indian farmers (*Kisans*) directly with bulk buyers. The system is designed around a transparent pricing model, allowing farmers to list their harvests and compare asking prices dynamically with real-time national market rates (*Mandi Rates*). Buyers browse listings, submit custom offers (specifying proposed prices, quantities, and notes), and negotiate directly with farmers. Once a farmer accepts an offer, the system locks the listing and initiates an administrative order fulfillment process.

Architecturally, Kropigo is built as a pnpm monorepo consisting of a Next.js 15 App Router frontend (serving as the BFF/client layer), an Express.js Node API gateway, and a shared schema compilation package. Data is stored in MongoDB, utilizing index structures optimized for geo-queries and state filters. Real-time updates—such as bid notifications and fulfillment status updates—are pushed to client devices via a cookie-authorized WebSocket server. The monorepo layout facilitates strict separation of concerns, providing type safety from the database schema to the UI components.

---

### **4. KEY FEATURES**

#### **1. Dual-Role Authentication & Cookie Isolation**
*   **Secure JWT Authentication:** Implements stateless JWT authentication stored in secure, `httpOnly`, `sameSite: 'lax'` cookie headers to shield user sessions from cross-site scripting (XSS) and client-side access.
*   **Role-Based Access Control (RBAC):** Protects routes on the server using an Express middleware stack (`authenticate`, `requireRole('kisan' | 'buyer' | 'admin')`) and enforces client-side layout gates (`RoleGuard`).
*   **Role-Specific Navigations:** Renders distinct navigation layouts for buyers (Marketplace, My Interests, Profile) and farmers (Listings, Received Offers, Orders, Profile) based on decodable claims inside the cookie payload.
*   **Token Refresh & Security Hashes:** Generates secure token hashes and validates session longevity using rotating refresh tokens persisted in the database.

#### **2. Kisan Listing Management Engine**
*   **Time-Bounded Publishing Windows:** Operates under a "Market Hours" constraint (10:00 AM – 5:00 PM IST). Listings created during these hours remain in `draft` status and are batch-published to `open` at 5:00 PM IST daily.
*   **Strict Media Constraints:** Limits image and video uploads to a maximum of 6 files per listing, validated at both client and server boundaries to prevent endpoint spam.
*   **Geospatial & Address Metadata:** Captures precise farm coordinates (`lat`, `lng`), state, and district, enabling proximity filtering for buyers.
*   **Automated Expiration Workflows:** Integrates background cron workers to auto-expire open listings past their `expiresAt` limits, transitioning them to `cancelled` and triggering SMS alerts.

#### **3. Buyer Interest & Negotiation Pipeline**
*   **Granular Bidding Mechanics:** Allows authenticated buyers to submit bids (`price`, `quantity`, `notes`) against `open` or `interest_received` crop listings.
*   **Concurrency Blockers:** Prevents duplicate bid submissions by checking existing collections for active `pending` statuses from the same buyer on a given listing, returning a `409 Conflict` on violation.
*   **Optimistic Status Counters:** Dynamically increments the `interestedBuyerCount` and transitions the listing's state from `open` to `interest_received` upon the first valid interest submission.
*   **Bid Withdrawal Capabilities:** Empowers buyers to withdraw pending bids, reverting the listing status back to `open` if no other active interests remain.

#### **4. Automated Mandi Rate Comparison & Grounding**
*   **Agmarknet API Integration:** Syncs daily market prices (minimum, maximum, and modal price) per crop variety and state from national agricultural databases.
*   **Real-Time Price Deltas:** Computes price differences on the fly, showing buyers and sellers visual indicators of how listing prices align with current market rates (e.g., "₹200 below market").
*   **Unit-Conversion Normalization:** Normalizes price-per-unit metrics (e.g., converting prices from kilogram to quintal or ton) to ensure comparisons remain consistent.
*   **Temporal Cache Expiry:** Stores mandi rates in MongoDB with automatic index-based date sorting, prioritizing today's rate and falling back to manual admin overrides if API sync fails.

#### **5. Order Generation & Milestone Tracker**
*   **Atomic State Transition:** Accepts bids within a transaction, instantly creating an `Order` document and setting its state to `sale_confirmed`.
*   **Fulfillment Timeline Arrays:** Tracks logistical progress via an embedded `timeline` array containing states: `sale_confirmed`, `admin_notified`, `qc_scheduled`, `qc_passed`, `qc_failed`, `pickup_scheduled`, `in_transit`, and `delivered`.
*   **Admin-Only Transitions:** Restricts critical milestone updates (such as Quality Control checks and transport dispatch) to authenticated Admin accounts.
*   **Automatic Bill Generation:** Generates and attaches secure bill URLs to the order record upon successful delivery and payment.

#### **6. Event-Driven Notification Engine**
*   **Unified WebSocket Emitter:** Features a server-side socket service (`createAndEmitNotification`) that persists notifications to MongoDB and pushes WebSocket events simultaneously.
*   **Room-Based Isolation:** Routes notifications to specific rooms named after the destination `userId` or role-specific rooms (e.g., `admin_room`).
*   **Persistent Notification Fallback:** Records all events in a `Notification` collection, allowing users to pull unread history via HTTP requests if WebSocket connection drops.
*   **Contextual Payloads:** Attaches rich payloads (crop names, transaction amounts, order IDs, contact info) to events, enabling dynamic client rendering.

---

### **5. ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT BROWSER                                   │
│        (Next.js 15 SPA / React 19 Client components / RTK Query Hooks)           │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │ HTTP / HTTPS                    │ WebSockets (Socket.io)
                        ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             NEXT.JS 15 BFF LAYER                                │
│       (Route Handlers, App Router Server Components, Reverse Proxy)             │
└───────────────────────┬─────────────────────────────────────────────────────────┘
                        │ HTTP Router / Secure CORS
                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS.JS BACKEND CORE                               │
│  (Auth Middleware, Zod Validation, WebSocket Gateway, Services, Controllers)   │
└───────────┬──────────────┬──────────────────┬──────────────────────┬────────────┘
            │              │                  │                      │
            │ Mongoose     │ Socket.io Event  │ HTTPS Request        │ Admin SDK
            ▼              ▼                  ▼                      ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐       ┌──────────────┐
│  MONGODB     │   │   SOCKET.IO  │   │  AGMARKNET   │       │  CLOUDINARY  │
│  DATABASE    │   │  SERVER CORE │   │  MANDI API   │       │     CDN      │
│  (Data Store)│   │(Push Engine) │   │ (Rates Sync) │       │ (Image Host) │
└──────────────┘   └──────────────┘   └──────────────┘       └──────────────┘
            ▲
            │ Schedule Writes
┌───────────┴─────────────────────────────────────────────────────────────────────┐
│                            BACKGROUND WORKERS (CRON)                            │
│  - Publish Listings (5:00 PM IST)                                               │
│  - Cancel Expired Listings (Midnight IST)                                       │
│  - Fetch Mandi Rates (8:00 AM IST)                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### **6. WORKFLOWS**

#### **Ingestion Flow (Listing Creation & Publication)**
```
[ Farmer (Client) ] ──(1. Selects Crop & inputs details)──> [ Next.js Client Form ]
                                                                      │
[ Cloudinary CDN ] <──(3. Uploads files directly & gets URLs)─────── [ Media Selection ]
        │
        ▼ (Returns URLs)
[ Farmer (Client) ] ──(4. Submits form: details + media URLs)──> [ Express Router ]
                                                                      │
                                                              [ Validate Middleware ]
                                                              (Checks Zod Schema)
                                                                      │
                                                                      ▼ (Valid)
                                                                [ Express Controller ]
                                                                      │
                                                              [ DB Write Action ]
                                                              (Creates Listing as "draft")
                                                                      │
                                                                      ▼
                                                              [ Scheduled Cron ] (5:00 PM IST)
                                                              (Queries all drafts created today)
                                                                      │
                                                                      ▼ (Transitions status)
                                                              [ Listing status -> "open" ]
                                                              (Exposed to marketplace search)
```

#### **Query Flow (Marketplace Search & Negotiation)**
```
[ Buyer (Client) ] ──(1. Enters Search/Filters: Crop, State, Dist)──> [ Next.js BFF ]
                                                                           │
                                                                     [ Express Router ]
                                                                           │
                                                                    [ DB Index Match ]
                                                                    (Executes query using 
                                                                     compound indexes)
                                                                           │
                                                                           ▼
                                                                    [ Mandi Rates Lookup ]
                                                                    (Fetches today's modal 
                                                                     prices for cropId)
                                                                           │
                                                                           ▼
                                                                    [ Build Response ]
                                                                    (Combines Listing details 
                                                                     + Market Price deltas)
                                                                           │
                                                                           ▼ (Response Array)
[ Buyer (Client) ] <──(2. Displays listings + Mandi comparisons)───── [ Next.js Client ]
                                                                           │
                                                                     [ Express POST ]
                                                                     (Submit interest: price, qty)
                                                                           │
                                                                           ▼
                                                                    [ Run Transaction ]
                                                                    (If Kisan accepts: 
                                                                     Locks listing status, 
                                                                     creates Order, rejects 
                                                                     other bids in session)
                                                                           │
                                                                           ▼
                                                                    [ Socket Emitter ]
                                                                    (Pushes NEW_DEAL to Admin 
                                                                     and OFFER_ACCEPTED to Buyer)
```

---

### **7. DATA MODEL**

#### **1. User Collection (`User`)**
*   **Role:** Persists user identities, credentials, role claims, and validation documents.
*   **Scope:** Global user repository supporting farmers, buyers, drivers, and admins.
*   **Structural Schema Details:**
    *   `_id`: `ObjectId` (Primary Key)
    *   `email`: `String` (Unique, index-backed, lowercased)
    *   `password`: `String` (Hashed via bcrypt, hidden from default queries via `{ select: false }`)
    *   `phone`: `String` (Unique, index-backed, sparse for users signing up without phones)
    *   `role`: `String` (`enum: ["kisan", "buyer", "driver", "admin"]`, defaults to `kisan`)
    *   `profilePhoto`: `String` (Cloudinary URL string)
    *   `location`: `String` (Descriptive base address)
    *   `bankDetails`: `Object` (Contains nested `accountNumber`, `ifscCode`, and `bankName`)
    *   `isVerified`: `Boolean` (Determines if Kisan document review passed)
    *   `verifiedAt`: `Date`
    *   `averageRating` / `totalRatings`: `Number` (Used for user feedback scores)
    *   `refreshTokenHash`: `String` (For secure JWT rotation validation)
    *   `isActive`: `Boolean` (Soft-delete switch)

#### **2. Listing Collection (`Listing`)**
*   **Role:** Represents crop harvests offered for sale, listing status, and locations.
*   **Scope:** Publicly queryable crop listings.
*   **Structural Schema Details:**
    *   `_id`: `ObjectId` (Primary Key)
    *   `cropId`: `ObjectId` (References `Crop` collection, required)
    *   `sellerId`: `ObjectId` (References `User` collection, index-backed)
    *   `quantity`: `Number` (Greater than 0)
    *   `variety`: `String` (Specific crop sub-type)
    *   `unit`: `String` (`enum: ["kg", "quintal", "ton"]`)
    *   `description`: `String` (Max length 1000 characters)
    *   `mediaUrls`: `[String]` (Validated array, maximum 6 elements)
    *   `status`: `String` (`enum: ["draft", "open", "interest_received", "sale_confirmed", "cancelled", "expired", "closed"]`)
    *   `confirmedBuyerId`: `ObjectId` (References `User` collection, default `null`)
    *   `farmAddress` / `farmState` / `farmDistrict`: `String` (Indexed for regional marketplace queries)
    *   `farmCoordinates`: `Object` (Nested `lat` and `lng` floats)
    *   `expiresAt`: `Date` (Automated date; defaults to 7 days from creation)
    *   `viewCount` / `interestedBuyerCount`: `Number` (Dynamic trackers)
*   **Indexes:**
    *   `{ sellerId: 1, status: 1 }` (Farmer dashboard queries)
    *   `{ status: 1, createdAt: -1 }` (Marketplace chronological feed queries)
    *   `{ cropId: 1, status: 1 }` (Filtered crop queries)
    *   `{ farmDistrict: 1, status: 1 }` (Geographic filtering)

#### **3. Interest Collection (`Interest`)**
*   **Role:** Stores buyer offers, prices, and status indicators.
*   **Scope:** Sub-resource of `Listing`, mapping negotiations.
*   **Structural Schema Details:**
    *   `_id`: `ObjectId` (Primary Key)
    *   `listingId`: `ObjectId` (References `Listing` collection, cascade-aware index)
    *   `buyerId`: `ObjectId` (References `User` collection, index-backed)
    *   `price`: `Number` (Offered unit price)
    *   `quantity`: `Number` (Optional custom purchase size)
    *   `status`: `String` (`enum: ["pending", "accepted", "rejected", "withdrawn"]`)
    *   `notes`: `String` (Max length 500 characters)
    *   `isReadBySeller`: `Boolean` (Notification counter trigger)
    *   `orderId`: `ObjectId` (References `Order` collection, populated post-acceptance)
*   **Indexes:**
    *   `{ listingId: 1, status: 1 }` (Kisan received offers feed)
    *   `{ buyerId: 1, status: 1 }` (Buyer offer history feed)

#### **4. Order Collection (`Order`)**
*   **Role:** Represents confirmed transactions and logistical milestone tracking.
*   **Scope:** Post-negotiation transaction records.
*   **Structural Schema Details:**
    *   `_id`: `ObjectId` (Primary Key)
    *   `listingId`: `ObjectId` (References `Listing` collection)
    *   `interestId`: `ObjectId` (References `Interest` collection)
    *   `buyerId` / `sellerId`: `ObjectId` (References `User` collection)
    *   `agreedPrice`: `Number` (Frozen transaction rate)
    *   `quantity`: `Number` (Total sold amount)
    *   `unit`: `String` (Unit of measure)
    *   `totalAmount`: `Number` (`agreedPrice * quantity`)
    *   `status`: `String` (`enum: ["sale_confirmed", "admin_notified", "qc_scheduled", "qc_passed", "qc_failed", "pickup_scheduled", "in_transit", "delivered"]`)
    *   `timeline`: `[TimelineEntrySchema]` (Sub-document array tracking actors, status changes, and notes)
    *   `billUrl`: `String` (Secure PDF path, defaults to `null`)
*   **Indexes:**
    *   `{ buyerId: 1, status: 1 }` (Buyer order dashboard)
    *   `{ sellerId: 1, status: 1 }` (Kisan order dashboard)

#### **5. MandiRate Collection (`MandiRate`)**
*   **Role:** Logs market rate comparisons.
*   **Scope:** Time-series price reference collection.
*   **Structural Schema Details:**
    *   `_id`: `ObjectId` (Primary Key)
    *   `cropId`: `ObjectId` (References `Crop` collection)
    *   `market`: `String` (Mandi name, trimmed)
    *   `state`: `String` (State location)
    *   `minPrice` / `maxPrice` / `modalPrice`: `Number` (Market price thresholds)
    *   `unit`: `String` (`enum: ["kg", "quintal", "ton"]`)
    *   `date`: `Date` (Pricing record date)
    *   `source`: `String` (`enum: ["agmarknet", "manual"]`)
*   **Indexes:**
    *   `{ cropId: 1, date: -1 }` (Retrieval of the latest market price record)

---

### **8. OUTCOME**

The resulting Kropigo implementation establishes an elite, production-grade agricultural marketplace platform. By isolating vector interactions, enforcing ACID consistency at the negotiation boundary with MongoDB sessions, and securing connection lifecycles via handshaked JWT cookie extraction, the system achieves a resilient, secure profile. Data traceability is maintained from the client-side media signing request down to the order execution timeline entries. The architecture cleanly separates concerns using shared Zod contracts and explicit monorepo workspace boundaries, demonstrating a high-performance system capable of managing large-scale trade transactions.
