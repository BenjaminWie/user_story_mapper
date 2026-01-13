# Product Requirements Document: VisionBoard.ai

**Version:** 1.0  
**Status:** Active Development  
**Product:** VisionBoard.ai (LiveOS Core)

---

## 1. Executive Summary
**VisionBoard.ai** is a collaborative, AI-native project management platform designed to replace flat, list-based task managers (like Jira or Trello) with a visual **User Story Map**. 

By leveraging Google's Gemini Multimodal AI, the platform automates the tedious aspects of product definition—generating user personas, writing technical specs, creating acceptance criteria, and even managing the board via real-time voice conversation.

## 2. Problem Statement
*   **Loss of Context:** In traditional list views, developers lose sight of the "User Journey." Tickets become isolated tasks rather than steps in a narrative.
*   **"Blank Page" Syndrome:** Product Managers spend hours writing boilerplate tickets, acceptance criteria, and release notes.
*   **Disconnect from Users:** Personas are often PDF documents hidden in a drive, rarely referenced during actual development.
*   **Friction:** Managing a board requires constant clicking and typing, breaking flow during brainstorming sessions.

## 3. Core Concept: The Story Map
Unlike a Kanban board (which tracks status), VisionBoard uses a 2D grid layout:
*   **X-Axis (The Backbone):** The chronological User Journey (e.g., Search -> Add to Cart -> Checkout).
*   **Y-Axis (The Swimlanes):** Releases or Slices (e.g., MVP, V2 Scale, Q3 Update).
*   **The Cells:** The intersection where atomic **User Stories** live.

---

## 4. Feature Specifications

### 4.1. The Backbone (User Journey)
**What:** The top row of the board representing the sequential steps a user takes.
*   **Feature:** Steps are grouped by **Persona**. If "Onboarding" and "Profile Setup" are done by the "Subscriber" persona, they are visually grouped under a single Persona header.
*   **Feature:** Drag-and-drop reordering of steps.
*   **Why:** Ensures every feature built can be traced back to a specific step in the user's life. If a feature doesn't fit a step, it likely shouldn't be built.

### 4.2. Persona Management
**What:** A dedicated system to define who the users are.
*   **AI Feature:** **Persona Generator**. Input a title (e.g., "Impulse Buyer"), and the AI generates a bio, pain points, and a unique, illustrative avatar image.
*   **Why:** Visualizing the user directly above their user steps builds empathy. AI avatars make the personas feel "real" without needing a designer.

### 4.3. Slice Management (Releases)
**What:** Horizontal swimlanes that represent time-boxed releases.
*   **Feature:** Create new slices with target dates and goals.
*   **Why:** Allows teams to prioritize *across* the journey. Instead of building the entire "Search" feature at once, you build the "MVP Search" in Slice 1 and "Advanced Filters" in Slice 2.

### 4.4. Atomic User Stories
**What:** The actual tickets (cards) placed on the board.
*   **Feature:** Cards display category (Feature, Bug, Infra), status, and title.
*   **Interaction:** Drag-and-drop cards between steps (columns) or releases (rows).
*   **Contextual Creation:** "Ghost" + buttons appear in every cell to add a story exactly where it belongs.

### 4.5. Deep Dive Modals & Magic Fill
**What:** Detailed views for specific Tasks or Stories.
*   **AI Feature (Magic Fill - Tasks):** When viewing a backbone step, the AI acts as a Solution Architect. It analyzes the Product Vision and the Step Title to generate a **Technical Research** brief (e.g., "For Search, use ElasticSearch vs. Algolia").
*   **AI Feature (Magic Fill - Stories):** When viewing a specific story, the AI acts as a QA Lead. It generates Gherkin-style **Acceptance Criteria** automatically.
*   **Why:** drastic reduction in documentation time. It moves the human from "Writer" to "Editor."

### 4.6. AI Release Notes
**What:** Automated documentation generation.
*   **Feature:** One-click generation of release notes for a specific slice.
*   **Logic:** The AI reads all tickets in a release row, categorizes them (New Features, Bug Fixes), and writes a summary based on the Product Vision.
*   **Why:** Engineers and PMs often neglect documentation. This ensures stakeholders are updated with zero effort.

### 4.7. Live Voice Agent (LiveOS)
**What:** A multimodal, real-time voice interface.
*   **Feature:** Users can speak to the board: *"Add a ticket to the MVP release for Stripe Integration under the Checkout step."*
*   **Tech:** Uses Gemini Live API (WebSockets) for low-latency conversational audio.
*   **Function Calling:** The AI interprets natural language and executes actual code functions (`addStory`) to update the React state in real-time.
*   **Why:** rapid brainstorming. A team can stand around a screen, discuss ideas, and have the AI scribe for them.

---

## 5. Technical Architecture

### 5.1. Frontend Stack
*   **Framework:** React 19 (TypeScript)
*   **Styling:** Tailwind CSS (for rapid, responsive UI)
*   **State Management:** Local React State (MVP) / Context API.
*   **Drag and Drop:** `@dnd-kit/core` for accessible, robust drag interactions.

### 5.2. AI Integration (@google/genai)
*   **Gemini 2.5 Flash:** Used for high-speed text generation (Release notes, Magic Fill).
*   **Gemini 2.5 Flash Image:** Used for generating consistent persona avatars.
*   **Gemini Live API:** Used for the Voice Agent. Handles audio streaming (PCM 16kHz) and Tool Calling.

### 5.3. Data Structure
*   **ProductBoard:** The root object containing lists of Personas, Tasks, Releases, and Stories.
*   **Relationships:**
    *   Stories link to `release_id` and `parent_task_id`.
    *   Tasks link to `personaId`.

## 6. Success Metrics
*   **Time-to-Ticket:** Reduction in time required to create a fully specified user story.
*   **Planning Velocity:** Speed at which a team can map out an MVP using the drag-and-drop interface.
*   **AI Adoption:** Percentage of stories/tasks that use "Magic Fill" content versus manual entry.
