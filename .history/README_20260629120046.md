# Docs

Docs is a local-first collaborative document editor built for the House of Edtech fullstack assignment. It combines offline-first editing, deterministic conflict resolution, role-based collaboration, granular version history, and AI writing helpers in a single Next.js 16 application.

## What This Project Does

- Lets users register, log in, and manage documents with JWT cookie-based auth.
- Stores document state locally in IndexedDB first, so typing never waits for the network.
- Queues offline changes and syncs them to the server when connectivity returns.
- Uses Yjs CRDT updates for deterministic merge behavior across collaborators.
- Supports `OWNER`, `EDITOR`, and `VIEWER` roles with server-side authorization checks.
- Allows owners to create named versions and restore older snapshots safely.
- Includes AI tools for summarize, improve writing, grammar fix, and continue writing.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- PostgreSQL
- TipTap
- Yjs
- Dexie
- Socket.IO
- Zod
- Vitest

## Core Features

### Local-first editing

The browser is the primary working copy while the user is editing:

1. Every Yjs update is accepted locally immediately.
2. The latest merged state is stored in IndexedDB through Dexie.
3. Incremental changes are added to a local sync queue.
4. When online, queued changes are pushed to the server.
5. The server merges remote and local state and returns the latest canonical state.

This means the UI does not block on network requests during typing.

### Offline sync engine

- Local document snapshots are stored in IndexedDB.
- Incremental updates are queued per document.
- The editor auto-syncs when the browser comes back online.
- A manual `Sync now` control is also available.
- Periodic pull sync keeps the local state aligned with server state.

### Deterministic conflict resolution

- Yjs CRDT updates are used for document state.
- Updates are commutative and idempotent.
- The server merges updates instead of replacing the document wholesale.
- Duplicate update IDs are ignored safely.

### Version history and restore

- Owners can create named document snapshots.
- Version history is listed in the document workspace.
- Restore creates a safe backup before replacing active state.
- Revision bumps are used so clients can detect restore events and avoid silently overwriting local work.

### Auth and authorization

- JWT session stored in an HttpOnly cookie.
- Password hashing with bcrypt.
- Protected routes require a valid session.
- Authorization is enforced server-side, not just in the UI.
- `VIEWER` users are blocked from realtime and sync write paths.

### Security and validation

- Public request payloads are validated with Zod.
- Sync update payloads are size-limited before decode/merge work begins.
- Prisma queries are scoped by document membership.
- Oversized or malformed sync packets are rejected to reduce OOM risk.

### AI add-on features

The editor includes:

- Summarize
- Improve writing
- Fix grammar
- Continue writing

If `GEMINI_API_KEY` is missing or Gemini fails, the API returns mock fallback output so the UI still works for demonstration.

## Project Structure

- `app/`
  Next.js App Router pages and API routes.
- `components/auth/`
  Login and registration UI.
- `components/dashboard/`
  Dashboard UI for listing and creating documents.
- `components/document/`
  Editor workspace, members panel, versions panel, and local-first sync UI.
- `lib/auth.ts`
  JWT cookie session helpers.
- `lib/client/dexie.ts`
  IndexedDB storage for local snapshots and queued sync updates.
- `lib/documents.ts`
  Server-side document access, sync merge logic, versions, restore flow, and error mapping.
- `lib/permissions.ts`
  Role checks.
- `lib/validation.ts`
  Zod schemas for auth, document, sync, member, version, and AI payloads.
- `lib/yjs.ts`
  Yjs encode/decode and state helpers.
- `prisma/schema.prisma`
  Database schema.
- `server.js`
  Custom Node server that runs Next.js and Socket.IO together.

## Database Model Overview

The schema contains:

- `User`
  Registered account with hashed password.
- `Document`
  Main collaborative document record and canonical state.
- `DocumentMember`
  Membership table that stores user role per document.
- `DocumentVersion`
  Named snapshots for restore and history.
- `SyncEvent`
  Stored sync updates for dedupe and auditability.

## Environment Variables

Create a `.env.local` file in the project root.

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docs"
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY=""
AI_API_KEY=""
```

Variable reference:

- `DATABASE_URL`
  Required. PostgreSQL connection string.
- `JWT_SECRET`
  Required. Must be at least 16 characters. In production, do not use the placeholder value `change-this-super-secret-jwt-key`.
- `NEXT_PUBLIC_APP_URL`
  Recommended. Public app origin used for origin-aware behavior and cookie/socket flow.
- `GEMINI_API_KEY`
  Optional. Enables real Gemini responses for AI features.
- `AI_API_KEY`
  Optional. Present in env parsing but not currently used by the app runtime.

## Prerequisites

Before running locally, make sure you have:

- Node.js 20+ installed
- npm installed
- PostgreSQL running locally or remotely

## Local Setup

### 1. Install dependencies

```bash
npm install
```

`postinstall` already runs Prisma client generation automatically.

### 2. Configure environment variables

Create `.env.local` using the example above.

### 3. Prepare the database

Run the Prisma migration:

```bash
npm run prisma:migrate:dev
```

If you only want to sync schema changes without creating a migration, you can use:

```bash
npm run prisma:db:push
```

### 4. Start the development server

```bash
npm run dev
```

The app will start on:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev`
  Starts the custom Next.js + Socket.IO development server.
- `npm run build`
  Creates the production build.
- `npm run start`
  Starts the production server through `server.js`.
- `npm run prisma:generate`
  Generates the Prisma client.
- `npm run prisma:migrate:dev`
  Runs development migrations.
- `npm run prisma:migrate:deploy`
  Applies committed migrations in deployment environments.
- `npm run prisma:db:push`
  Pushes schema changes directly to the database.
- `npm run lint`
  Runs ESLint.
- `npm test`
  Runs Vitest.

## How To Run Production Locally

Build first:

```bash
npm run build
```

Then start:

```bash
npm run start
```

Important:

- `JWT_SECRET` must be set.
- In production mode, the app intentionally fails if `JWT_SECRET` is still `change-this-super-secret-jwt-key`.

## How To Test The App Manually

### Auth flow

1. Open `http://localhost:3000/register`
2. Create a user account.
3. Log in.
4. Confirm you land on the dashboard.

### Document flow

1. Create a new document from the dashboard.
2. Open the document.
3. Type content and confirm the UI remains responsive.
4. Refresh the page and confirm the content is still available.

### Offline-first behavior

1. Open a document.
2. Turn off the browser network or use DevTools offline mode.
3. Continue typing.
4. Confirm the editor still works and shows local save behavior.
5. Re-enable network.
6. Confirm queued updates sync successfully.

### Collaboration behavior

1. Create at least two users.
2. Log into separate browser sessions.
3. Invite the second user to a document as `EDITOR` or `VIEWER`.
4. Open the same document in both sessions.
5. Confirm updates propagate across sessions.
6. Confirm a `VIEWER` can read but cannot edit or sync updates.

### Version history

1. As the owner, create a named version.
2. Continue editing the document.
3. Restore the earlier version.
4. Confirm the document resets safely and version history updates.

### AI tools

1. Open a document with some content.
2. Try summarize, improve, grammar, and continue.
3. If `GEMINI_API_KEY` is not set, confirm the app still returns fallback mock output.

## API Surface

Main API routes included in the project:

- `POST /api/auth/register`
  Register a user and issue session cookie.
- `POST /api/auth/login`
  Log in and issue session cookie.
- `POST /api/auth/logout`
  Clear session cookie and redirect to login.
- `GET /api/documents`
  List current user's documents.
- `POST /api/documents`
  Create a new document.
- `GET /api/documents/[id]`
  Fetch one document for an authorized user.
- `PATCH /api/documents/[id]`
  Rename document, owner only.
- `DELETE /api/documents/[id]`
  Delete document, owner only.
- `GET /api/documents/[id]/members`
  List members for an authorized document user.
- `POST /api/documents/[id]/members`
  Invite or update a member, owner only.
- `PATCH /api/documents/[id]/members`
  Change member role, owner only.
- `GET /api/documents/[id]/sync`
  Pull latest canonical document state.
- `POST /api/documents/[id]/sync`
  Push queued updates and merge state.
- `GET /api/documents/[id]/versions`
  Fetch version history.
- `POST /api/documents/[id]/versions`
  Create a named version, owner only.
- `POST /api/documents/[id]/versions/[versionId]/restore`
  Restore a version, owner only.
- `POST /api/ai`
  AI helper endpoint.

## Automated Checks

These are the main project checks:

```bash
npm run lint
npm test
npm run build
```

## Deployment Notes

This repository uses a custom Node server in `server.js` so Next.js and Socket.IO can run together.

For deployment, make sure to:

- provide PostgreSQL
- set `DATABASE_URL`
- set a strong production `JWT_SECRET`
- set `NEXT_PUBLIC_APP_URL` to the real public origin
- run `npm run prisma:migrate:deploy`
- build with `npm run build`
- start with `npm run start`

Important hosting note:

- This codebase is built around a custom server, so a standard Vercel serverless deployment is not the best fit without refactoring the realtime layer.

## What Reviewers Should Look At

If someone is reading the code for evaluation, the most important files are:

- `components/document/editor-shell.tsx`
  Local-first editor behavior, queueing, sync, online/offline handling, and AI actions.
- `lib/client/dexie.ts`
  IndexedDB persistence layer.
- `lib/documents.ts`
  Server-side merge logic, validation handling, version restore flow, and authorization-aware data access.
- `server.js`
  Realtime Socket.IO server behavior.
- `lib/validation.ts`
  Payload validation and sync safety limits.

## Notes

- The app requires PostgreSQL to fully run.
- AI works with fallbacks even when Gemini is not configured.
- The repo currently includes unit tests, but not end-to-end browser tests.
