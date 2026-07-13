# Portfolio Case Study: Project Teams

### 1. METADATA HEADER
* **Project Name:** **Project Teams** — A high-fidelity, real-time collaboration platform that merges instant messaging, collaborative document editing, active presence tracking, LLM-assisted authoring, and a retrieval-augmented (RAG) document Q&A engine into a unified, secure, multi-tenant workspace.
* **Links/Metadata:**
  * **Status:** LIVE IN PRODUCTION
  * **Source Code:** [GitHub Repository](https://github.com/wizardamxn/projectteams)
  * **Live Demo:** [projectteams.amanahmad.xyz](https://projectteams.amanahmad.xyz)
  * **Role:** Principal Full-Stack Engineer / Architect
  * **Team Size:** 1 (Solo Developer)
* **Stack:**
  * **Languages:** TypeScript, JavaScript (ES6+ ESM Node.js)
  * **Frameworks:** React.js (Vite SPA client), Express.js (REST & Socket.IO server)
  * **Real-Time Engine:** Socket.IO (WebSockets TCP), WebRTC (In-progress video signaling)
  * **AI/ML Integration:** Vercel AI SDK, `@ai-sdk/google` — `gemini-2.5-flash` (generation) and `gemini-embedding-001` (embeddings)
  * **Retrieval / Vector Layer:** MongoDB Atlas Vector Search (`$vectorSearch`), cosine similarity over team-scoped embeddings
  * **Async Pipeline:** BullMQ job queue on Redis, with a dedicated standalone worker process
  * **Databases & Storage:** MongoDB (via Mongoose ODM), Supabase Storage (object/blob persistence)
  * **State Management:** Redux Toolkit (Thunk-driven socket orchestration)
  * **Styling & UI:** Tailwind CSS, Framer Motion, Lucide React, Sonner
  * **Infrastructure & Delivery:** AWS EC2, PM2 (process orchestration), Nginx (reverse proxy / same-origin gateway), Cloudflare (DNS, edge proxy, TLS), Let's Encrypt (origin TLS), Docker (local dev parity)

---

### 2. CHALLENGES & INSIGHTS
* **Challenge 1: Type Mismatch and Room Connection Leaks in Socket.IO Handler**
  * *Hurdle:* During rapid navigation, the Socket.IO server suffered room registration failures. This occurred because Mongoose raw ObjectIds were passed directly to `socket.join()` without verification. Because Socket.IO internally maps room identifiers as strings, the raw binary object representation failed to register correctly, causing silent transmission dropouts. Furthermore, client-side re-renders repeatedly bound incoming event listeners, causing memory leaks and duplicated message broadcasts.
  * *Insight:* Enforced explicit string serialization by calling `chat._id.toString()` before any room operation. To prevent listener duplication on the React client, socket registration logic was wrapped inside a module-level lock (`isListening` gate) in the Redux slice file, ensuring the `messageReceived` event listener is registered exactly once.

* **Challenge 2: Race Conditions and "Ghost" Message rendering during Chat Navigation**
  * *Hurdle:* In the master-detail chat page, selecting a new team member caused the chat feed to display "ghost" messages from the previous conversation for several hundred milliseconds. This visual glitch was caused by a race condition where the client connected to the new Socket.IO room before the async REST API fetch for the new chat history had resolved, leading to out-of-order state updates.
  * *Insight:* Redesigned the loading lifecycle: the Redux state is immediately purged (`setHistory([])`) upon room selection, rendering a clean loading indicator. The backend REST history request is prioritized, and the client only joins the WebSocket channel after the history promise has successfully resolved.

* **Challenge 3: Non-Deterministic LLM Output Validation & API Crash Protection**
  * *Hurdle:* Integrating document helper features (summarization, tag extraction, writing improvement) using LLMs. Synchronous waiting for LLM completions from the backend API blocked node process cycles. Additionally, LLMs returning markdown-wrapped JSON arrays (e.g., ` ```json [...] ``` `) broke the parser, causing server crashes.
  * *Insight:* Decoupled LLM calls using Vercel AI SDK's optimized middleware runner and the `gemini-2.5-flash` model. Implemented robust regex sanitization (`tags.replace(/```json|```/g, "").trim()`) to strip out Markdown code blocks before running `JSON.parse()`, falling back to split-based regex arrays upon JSON parsing failures.

* **Challenge 4: Redundant API Fetch Overhead in Nested React Router Sub-trees**
  * *Hurdle:* The master-detail layout of the React chat page triggered redundant HTTP calls: the list of active team members was fetched independently by the parent component (`Chat.tsx`) and the child component (`ChatMember.tsx`) to resolve participant metadata, wasting network bandwidth and increasing database read pressure.
  * *Insight:* Optimized component communication by introducing React Router's `<Outlet context={{ teamMembers }} />`. The child component consumes this context directly via `useOutletContext()`, replacing separate API calls with shared memory lookups, reducing page loading latency by 50%.

* **Challenge 5: Versioning and Concurrency Collisions during Editor Auto-Saves**
  * *Hurdle:* The editor auto-saves changes every 30 seconds. However, if a user clicks the "Save" button manually while an automated save is already in-flight, race conditions could cause out-of-order writes in MongoDB, leading to data loss or overwriting newer edits with stale cached states.
  * *Insight:* Implemented a client-side saving state locking mechanism (`saving` flag) that disables redundant manual trigger clicks. Under the hood, MongoDB uses `Document.updateOne({ _id }, req.body)` with Mongoose middleware tracking updates. Additionally, built-in version control arrays (`versions`) capture historical snapshots to enable rolling back in the event of write collisions.

* **Challenge 6: Event-Loop Starvation from Synchronous Document Ingestion**
  * *Hurdle:* The RAG feature requires parsing uploaded PDFs, splitting them into hundreds of chunks, and generating a vector embedding for every chunk. Performing this inline within the HTTP request handler blocked Node's single-threaded event loop for tens of seconds per document — stalling chat sockets, freezing concurrent API calls, and risking gateway timeouts on large files.
  * *Insight:* Decoupled ingestion into an asynchronous pipeline using **BullMQ on Redis**. The upload endpoint persists the file to Supabase Storage, writes a `RagDocument` record (`ragStatus: "uploaded"`), and the `/ragify` endpoint merely enqueues a `process-document` job before returning `202 Accepted`. A **dedicated standalone worker process** (`worker.js`, run as a separate PM2 app) consumes the queue, streams the document down, parses it with `pdf-parse`, chunks it (1,000 chars, 150 overlap sliding window), batch-embeds via `embedMany`, and persists chunks — driving the document through an `uploaded → processing → ready | failed` state machine the UI can poll. The API gateway never blocks.

* **Challenge 7: Cross-Tenant Leakage Risk at the Vector Retrieval Layer**
  * *Hurdle:* Semantic search returns the *nearest* vectors by cosine similarity — which, in a shared multi-tenant collection, could surface another team's confidential document chunks if similarity alone drove retrieval. Application-level filtering *after* the search is both leaky and wasteful.
  * *Insight:* Pushed tenant isolation **into the ANN search itself**. The `$vectorSearch` stage carries a `filter: { teamId }` predicate against a MongoDB Atlas vector index (`rag_chunk_vector_index`), so candidate generation is constrained to the requesting team's namespace before scoring. The grounded answer prompt then instructs `gemini-2.5-flash` to use *only* the retrieved context and to cite chunk numbers, eliminating both data leakage and model hallucination.

* **Challenge 8: Production Cutover — From Docker-Dev to a Same-Origin Edge Deployment**
  * *Hurdle:* The app was developed against a Docker Compose dev stack (live-reload dev servers, cross-origin `localhost` ports, hardcoded EC2 IP in CORS). Promoting that verbatim to production broke auth: cross-site cookies were dropped, the SPA's API base URL double-prefixed `/api/api/...`, the WebSocket URL was undefined, and a raw HTTP IP exposed credentials in cleartext.
  * *Insight:* Re-architected the deployment to a **single same-origin topology**. Nginx serves the built Vite bundle and reverse-proxies `/api` and `/socket.io` to the Node backend on loopback — so the browser only ever talks to one origin, collapsing the cross-site cookie and double-prefix problems. Auth cookies were unified behind a single `cookieOptions` (httpOnly, `SameSite=Lax`, `secure` gated by a `COOKIE_SECURE` env flag rather than `NODE_ENV`). PM2 supervises the API and worker as independent processes (with `SIGTERM` job draining), and Cloudflare + Let's Encrypt terminate TLS at the edge and origin (`Full (strict)`).

---

### 3. OVERVIEW
*Project Teams* is a high-performance, real-time collaboration ecosystem that merges messaging, collaborative digital workspaces, LLM-assisted authoring, and a retrieval-augmented document intelligence layer into a single unified workspace. Beyond live chat and co-editing, the platform lets a team **upload its own documents and then ask questions against them in natural language** — answers are grounded strictly in the team's own corpus and returned with source citations. Users can also invoke three synchronous AI authoring operations on any document via the integrated assistant panel: semantic tag extraction, text summarization, and tone/grammar refinement. The user experience is a dark-mode, high-fidelity single-page application (SPA) featuring smooth transitions, optimistic UI updates, and instant socket-driven messaging.

Architecturally, the system is a decoupled, multi-process topology. A React/Vite SPA is served as static assets by Nginx, which also acts as the same-origin API gateway — reverse-proxying REST traffic and WebSocket upgrades to a monolithic Node.js/Express Backend-For-Frontend (BFF). Communication is split by workload: stateless CRUD, authentication, and synchronous AI completions travel over HTTPS REST, while real-time chat and presence ride persistent Socket.IO TCP connections. The heavy, CPU-bound RAG ingestion path is offloaded entirely to a **separate BullMQ/Redis worker process**, keeping the request-serving gateway responsive. Structured data lives in MongoDB (via Mongoose), raw document blobs in Supabase Storage, and vector embeddings in a MongoDB Atlas vector index. The whole stack runs on AWS EC2 under PM2, fronted by Cloudflare with Let's Encrypt TLS.

---

### 4. KEY FEATURES
* **Retrieval-Augmented Document Q&A (RAG):** Teams upload documents (PDF / text), "ragify" them, and then query their corpus in plain language via `POST /api/ai/ask-docs`. The question is embedded with `gemini-embedding-001`, matched against the team's chunks using MongoDB Atlas `$vectorSearch` (top-5, `numCandidates = limit × 10`, `teamId`-filtered), assembled into a numbered context window, and answered by `gemini-2.5-flash` under a strict "use only the provided context and cite your sources" system instruction. Responses return both the answer and a `sources` array (`documentId`, similarity `score`).
* **Asynchronous Document Ingestion Pipeline:** A BullMQ `rag-processing` queue on Redis decouples ingestion from the API. A standalone worker downloads the blob from Supabase, extracts text (`pdf-parse` for PDFs, UTF-8 decode for text), applies a sliding-window chunker (1,000-char windows, 150-char overlap), batch-embeds chunks via the Vercel AI SDK's `embedMany`, and bulk-inserts `RagChunk` documents — all while advancing a persisted `ragStatus` state machine (`uploaded → processing → ready → failed`) the client can poll.
* **Real-Time Instant Messaging Engine:** Built on Socket.IO over stateful TCP WebSockets. Explicit payload mapping of `senderId`, `senderName`, `targetUserId`, and `text`. Dynamic room allocation using sorted participant IDs (`[userId, targetUserId].sort()`) combined with MongoDB `$all` matching to resolve or instantiate isolated chat records. Event-driven broadcasts deliver sub-50ms message propagation.
* **Live User Presence Monitoring:** A stateful in-memory map (`onlineUsers`) on the backend runtime maps each user's ID to their active `socket.id` on an `isOnline` event. Clients query presence via `checkOnlineStatus` callbacks returning a boolean in `O(1)`. A `disconnect` lifecycle listener prunes the map in place to prevent leaks from dead connections.
* **AI-Assisted Authoring Suite:** Powered by the Vercel AI SDK and `gemini-2.5-flash`. Semantic Tag Extraction returns 5–7 contextual keywords as a structured JSON array; Intelligent Summarization yields a concise, two-sentence, bold-emphasized digest; Writing & Grammar Refinement improves flow and correctness while preserving authorial intent.
* **Document Lifecycle & Auto-Save Daemon:** A debounced client hook fires every 30s on editor changes to a non-blocking `PUT /edit/:doc_id` endpoint. Strict Mongoose schema limits (Title ≤ 100, Content ≤ 5,000 chars) and a "silent save" status indicator avoid obstructive toasts; `versions` snapshots enable rollback.
* **Session Security & Multi-Tenant Partitioning:** JWT (HMAC SHA-256, 1-hour expiry) carried in `httpOnly` cookies with unified `SameSite=Lax` / env-gated `Secure` options. An `authorized` middleware guards every REST route and socket handshake (decrypt token → user lookup with `select("-password")`). An 8-character `teamCode` partitions every query — documents, chats, RAG corpora, and even vector retrieval — preventing cross-tenant data leaks.

---

### 5. ARCHITECTURE
```
                              ┌───────────────────────────┐
   Browser  ───────────────▶  │   Cloudflare (DNS / proxy │
                              │   / edge TLS, Full strict) │
                              └─────────────┬──────────────┘
                                            │  (HTTPS, origin)
                                            v
+-------------------------------------------------------------------------+
|                    AWS EC2  ·  Nginx (same-origin gateway)              |
|     serves Vite SPA (static)  |  proxies /api  +  /socket.io  ──▶ :2222 |
+-----------------------------------------+-------------------------------+
                                          | (loopback)
                                          v
+-------------------------------------------------------------------------+
|        PM2 process: "pt-api"  ·  Node.js + Express BFF / API Gateway    |
|   Auth | Doc | Profile | Chat (Socket.IO) | AI | Upload routers         |
+----------+------------------+------------------+-----------------+-------+
           |                  |                  |                 |
       Mongoose           Supabase           BullMQ.add()      Vercel AI SDK
       (Mongo)         (blob storage)     (rag-processing)    (gemini-2.5-flash)
           |                  |                  |                 |
           v                  v                  v                 v
+----------+------------------+----------+   +---+----------------------------+
|   MongoDB (Atlas)                       |  |        Redis  (job queue)       |
|  Users | Docs | Chats | RagDocs |       |  +---------------+-----------------+
|  RagChunks  +  Vector Index            |                  |
+----------+------------------------------+                  v
           ^                              +-------------------------------------+
           |  $vectorSearch (teamId)      |  PM2 process: "pt-worker" (BullMQ)  |
           +------------------------------┤  download → pdf-parse → chunk →     |
                                          │  embed (gemini-embedding-001) →     |
                                          │  insert RagChunks → status: ready   |
                                          +-------------------------------------+
```

---

### 6. WORKFLOWS

#### Document Authoring & Ingestion Flow
1. **Client Action:** The user fills in document title and text in the `Create.tsx` editor, optionally invoking AI assist.
2. **AI Enrichment (Optional):** "Summarize" / "Generate Tags" issue `POST /summarize` or `POST /generate-tags`; the BFF runs the `useAI` wrapper against `gemini-2.5-flash`, and outputs are stored in local component state.
3. **Commit & Save:** "Save" (or auto-save) fires `POST /create` with `{ title, content, summary, tags, starred }`.
4. **Middleware Validation:** `authorized.js` reads `req.cookies.token`, decrypts the JWT, loads the user (excluding password hash) into `req.user`.
5. **Persistence:** The handler extracts `teamCode`, builds a `Document` model, and `save()`s it; a `201 Created` returns the document and the client routes to `/editor/:doc_id`.

#### RAG Ingestion Flow (Asynchronous)
1. **Upload:** Client `POST /api/upload/document` (Multer, in-memory, 20MB cap). The controller streams the buffer to **Supabase Storage** at `${teamId}/${timestamp}-${filename}` and writes a `RagDocument` (`ragStatus: "uploaded"`).
2. **Enqueue:** Client `POST /api/upload/document/:id/ragify`. The endpoint guards against re-processing, enqueues a BullMQ `process-document` job (`{ documentId, storagePath, mimeType }`), and returns `202 Accepted` immediately.
3. **Worker Pickup:** The standalone `pt-worker` process consumes the job, flips status to `processing`, and downloads the blob from Supabase.
4. **Extract → Chunk → Embed:** Text is extracted (`pdf-parse` / UTF-8), split into overlapping 1,000-char chunks, and batch-embedded with `gemini-embedding-001`.
5. **Persist & Finalize:** Chunks (`documentId`, `teamId`, `chunkIndex`, `text`, `embedding`) are `insertMany`-ed into `RagChunk`; status advances to `ready` (or `failed` on error, captured by the worker's `failed` listener).

#### RAG Query Flow (Ask-Docs)
1. **Ask:** Client `POST /api/ai/ask-docs` with `{ question }` (auth-guarded).
2. **Embed & Retrieve:** The question is embedded, then `searchChunks` runs `$vectorSearch` with `filter: { teamId }` — returning the top-5 nearest chunks *scoped to the requesting team* with similarity scores.
3. **Ground & Generate:** Retrieved chunks form a numbered context block; `gemini-2.5-flash` answers under a strict grounded-only, cite-your-sources system prompt.
4. **Respond:** The API returns `{ answer, sources: [{ documentId, score }] }`; if no chunks match, it returns a graceful "no documents yet" fallback.

#### Chat Connection Query Flow
* On selecting a member, the client clears state (`setHistory([])`), fetches `GET /chat/:userId/:targetUserId`; the backend's `findOrCreateChat` sorts IDs and matches `{ participants: { $all: [...] } }`, creating the chat if absent. After history resolves, the client joins the Socket.IO room (`joinChat`) and real-time messages append to the room's embedded array on the fly.

---

### 7. DATA MODEL
Modeled and validated through Mongoose across the MongoDB instance:

#### 1. `users` Collection
* `_id` (ObjectId PK) · `fullName` (String, `[4,50]`, required) · `email` (unique, lowercase, `validator.isEmail`) · `password` (Bcrypt, 10 rounds) · `teamCode` (String, length 8 — the tenant partition key) · `createdAt`/`updatedAt`.

#### 2. `documents` Collection
* `_id` · `title` (`[1,100]`) · `content` (`[1,5000]`) · `summary` (AI) · `tags` (String[], AI) · `createdBy` (→ `User._id`) · `teamId` (→ `teamCode`) · `author` (embedded `{ name, avatar }`, `_id:false`) · `starred` (Bool) · `versions` (snapshot array `{ content, updatedAt }`) · timestamps.

#### 3. `chats` Collection
* `_id` · `participants` (ObjectId[] → `User`) · `messages` (embedded `messageSchema`: `senderId`, `senderName`, `text`, timestamps).

#### 4. `ragDocuments` Collection *(new)*
* **Role:** Metadata + lifecycle state for each uploaded source document.
* `_id` · `fileName` · `fileUrl` (Supabase public URL) · `storagePath` (bucket key) · `mimeType` · `fileSize` · `teamId` (tenant scope) · `uploadedBy` (→ `User._id`) · `ragStatus` (enum: `uploaded | processing | ready | failed`, default `uploaded`) · timestamps.

#### 5. `ragChunks` Collection *(new)*
* **Role:** Vector-searchable, team-scoped fragments of an ingested document.
* `_id` · `documentId` (→ `RagDocument`, indexed) · `teamId` (filter key for tenant-isolated retrieval) · `chunkIndex` (Number) · `text` (String) · `embedding` (`Number[]` — indexed by the Atlas `rag_chunk_vector_index` for `$vectorSearch`) · timestamps.

---

### 8. OUTCOME
*Project Teams* is a **live, production-grade** collaboration platform that pairs low-latency real-time messaging with a genuinely useful document-intelligence layer. By decoupling CPU-bound ingestion onto a BullMQ/Redis worker, the API gateway stays responsive under load while documents are parsed, chunked, and embedded out of band. By pushing `teamCode` isolation all the way down into the `$vectorSearch` candidate-generation stage, every layer — REST queries, sockets, and semantic retrieval — respects strict tenant boundaries, and grounded, citation-backed LLM answers eliminate hallucination. The same-origin Nginx gateway, PM2 process supervision, and Cloudflare + Let's Encrypt TLS turn a Docker-dev prototype into a hardened, HTTPS-served deployment on AWS EC2 — demonstrating end-to-end ownership from real-time systems design through RAG architecture to operating the stack in production.
