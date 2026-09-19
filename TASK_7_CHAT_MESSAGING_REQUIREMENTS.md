# Task 7: Specialist In-App Chat & Messaging — Client Brief & Explanation

## 1. Actual Client Requirement & Message
From the client's original feature list and project scope:

> **"Specialist Chat / Messaging Section:**  
> An in-app communication section allowing specialists in the field to message and communicate with admins, dispatchers, or property managers directly, with support for real-time messaging, photos/attachments, and context-specific threads linked to inspections."

---

## 2. Clear Breakdown: What It Is & How It Works

### Core Functionality
1. **Direct Communication**:
   * Replaces external phone calls, SMS, or WhatsApp with a centralized communication channel inside the Amenity Op's portal.
   * Direct 1-on-1 chats between specialists (OCS) and administrators.

2. **Inspection-Linked / Incident Chats**:
   * When an audit is active, the specialist can open a chat thread directly tied to that specific inspection.
   * Allows specialists to ask questions about on-site blockers (e.g., locked gates, access codes, safety alerts, or clarification on specific checklist items).

3. **Real-Time Delivery**:
   * Uses real-time WebSockets (Supabase Realtime) so messages appear instantly on both desktop (admin) and mobile (specialist) without refreshing the page.

4. **Photo & Attachment Sharing**:
   * Specialists can attach and send live photos of obstructions or questions for immediate resolution before submitting the final report.

5. **Where It Appears in the App**:
   * **Active Inspection Checklist**: A floating "Contact Dispatch / Admin" button to quickly send a message while performing an audit.
   * **Specialist Messaging Tab**: An inbox showing conversation threads and unread messages.
   * **Admin Messaging Hub**: Central dashboard for management to monitor and respond to field inquiries in real time.
