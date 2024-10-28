### Collab Notes

**A Smart Collaboration Platform for Agile Teams**

---

## Overview

**Collab Notes** is a dynamic collaboration platform that combines artificial intelligence with agile project management to simplify task management and boost real-time communication. This platform automates key processes like task recording, scope document creation, and flow diagram generation, freeing up teams to focus on strategic tasks and accelerating their workflows.

## Pain Points Addressed

Project managers, Product Owners, and technical teams often encounter challenges with traditional Kanban tools, such as difficulty in capturing business-focused user stories and keeping documents consistently updated. Updating tasks based on meeting discussions or chat messages is also time-consuming and prone to errors.

**Collab Notes** addresses these issues by synchronizing call transcripts and chat history with Kanban boards, documents, and flow diagrams in a real-time collaborative environment. For instance, if a new business rule is discussed during a meeting, it can instantly become a recorded task, with further refinement possible later—reducing manual work and enhancing accuracy.

Examples of practical use include:
- Instantly updating a task’s status when mentioned in chat by a team member.
- Automatically checking off checklist items as related tasks are discussed in chat.

These features make communication more efficient and amplify the effectiveness of agile methodologies.

## Key Features

- **Video Calls**
  - Real-time transcription of discussions
  - Automated updates to task boards, documents, and diagrams based on meeting content
- **Chats**
  - Real-time updates to task boards and documents directly from chat discussions
- **Shared Calendar** to organize team schedules
- **Kanban Task Boards** for organized task management
- **Collaborative Documents** for co-authoring
- **Flow Diagrams** for process visualization and planning

## SuperViz Components Used

### SuperViz Video SDK
This SDK powers video calls on the platform, while the **AI Transcript API** enables automatic transcription and identifies key points in discussions to update boards and documents instantly.

### SuperViz Collaboration
With **Who-is-Online** and **Form Elements**, participants can see who is online and keep fields synchronized across chats, boards, diagrams, and documents in real time using WebSockets, ensuring updated and accurate information.

## AI Integration

AI in Collab Notes processes call transcripts and chat messages to identify relevant updates for task boards, documents, and flow diagrams. The system provides notifications for users to review and confirm changes, ensuring that updates are accurate and meaningful.

## Technology Stack

- **Backend:** Kotlin and Spring Boot for robust backend support
- **Frontend:** React for responsive user interface
- **Real-Time Communication:** SuperViz for seamless collaboration
- **Artificial Intelligence:** Groq (free LLM with API) for intelligent processing

---

**Collab Notes** revolutionizes agile team interactions, updating tasks, documents, and workflows in real time through AI-powered insights. It empowers teams to work smarter, faster, and with enhanced collaboration, setting a new standard for productive, real-time project management.

[Figma File](https://www.figma.com/design/GkXOedLfl2oHMJK32C6FbQ/Untitled?node-id=0-1&t=V0ILuM5VIygzFMoA-1)
