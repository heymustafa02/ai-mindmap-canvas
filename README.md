# AI Mindmap Canvas

I built this project as a spatial alternative to a linear AI chat interface. Instead of presenting conversations as a scrolling list, AI interactions are represented as connected nodes on an infinite canvas, allowing ideas to branch and be explored visually.

I built this project as part of a take‑home challenge for a Front End Engineer role.

---

## Overview

* Infinite, pan‑and‑zoom canvas for visual conversations
* Floating query bar for starting or branching conversations
* AI responses generated using Gemini 3 Flash Preview
* Fixed‑position nodes for layout stability
* Persistent storage of nodes, edges, and metadata
* JWT‑based authentication
* Viewport‑based lazy loading for performance

---

## Demo Video

A short Loom video demonstrates:

1. The spatial canvas and node interactions
2. Persistence across page reloads
3. Authentication and lazy loading behavior

Loom link:
https://www.loom.com/share/69429adf7d364013ab062f65b6de8549

---

## Project Structure

```
ai-mindmap-canvas/
├── .env.example
├── .gitignore
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── signup/
│   │   │   └── verify/
│   │   └── mindmap/
│   │       ├── create/
│   │       ├── load/
│   │       └── update/
│   ├── canvas/
│   │   └── page.tsx
│   └── layout.tsx
├── components/
│   ├── Canvas.tsx
│   ├── MindmapNode.tsx
│   ├── QueryBar.tsx
│   └── ExpansionModal.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── gemini.ts
│   ├── jwt.ts
│   └── text.ts
├── store/
│   └── mindmapStore.ts
├── types/
│   └── index.ts
└── README.md
```

## Tech Stack

* TypeScript
* React
* Next.js (App Router)
* Tailwind CSS
* React Flow
* Zustand
* MongoDB
* Gemini API

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-mindmap-canvas.git
cd ai-mindmap-canvas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

An `.env.example` file is provided. Create a `.env.local` file and fill in the required values:

```env
GEMINI_API_KEY=
MONGODB_URI=
JWT_SECRET=
NODE_ENV=development
```

### 4. Run the development server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

## Authentication

* Signup page: `/signup`
* Login page: `/login`

Authentication is implemented using JWTs. All API routes related to AI generation and mindmap persistence are protected and require a valid token.

---

## Application Behavior

### Node Creation and Branching

* Submitting a query with no node selected creates a new conversation chain.
* Submitting a query while a node is selected creates a child node connected to that node.
* New chains start at the same X‑axis and are positioned below previous chains along the Y‑axis.
* Nodes are immovable once rendered to maintain a stable layout.

### Node Design

* The top section displays the user query (limited to 10 words).
* The bottom section displays the AI response (limited to 40 words).
* AI responses support basic Markdown rendering.

---

## Persistence and Metadata

* Nodes, edges, positions, and timestamps are stored in MongoDB.
* Refreshing the page restores the entire canvas exactly as it was.
* Each conversation chain is timestamped at creation.

---

## Performance and Lazy Loading

To maintain performance with large graphs:

* The full graph is stored in memory.
* Only nodes within the current viewport (plus a small buffer) are rendered.
* Edges are rendered only when both connected nodes are visible.

This approach ensures rendering cost scales with what is visible on screen rather than total graph size.

---

## Architecture Decision Record

### Canvas Library: React Flow

React Flow was chosen because it provides a solid foundation for node‑based interfaces, including built‑in support for pan, zoom, edges, and large canvases. It allows custom node rendering while avoiding the overhead of building a graph system from scratch.

### State Management: Zustand

Zustand was selected for its simplicity and low boilerplate. It works well for managing graph state such as nodes, edges, and selection without introducing unnecessary complexity.

### Database Choice

MongoDB was used as a NoSQL datastore to persist nodes, edges, and metadata. While DynamoDB was listed as a preference, MongoDB offers a flexible schema that fits graph‑like data well and supports rapid iteration.


