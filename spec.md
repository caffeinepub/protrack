# ProTrack - Project Management & Invoicing System

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full authentication system with Admin and User roles
- Dashboard with KPI cards: total earnings, pending invoices, active projects, completed projects
- Recent activity feed on dashboard
- Project management: CRUD with all fields (Ticket ID, Client Company, Project Handle Client/Team, Tech details, Visit location, Status, Visit date, Time in/out, Total time, Client rate, Tech rate, Client paid, Tech paid, Travel cost, Material cost, Profit, Tech Bank details)
- Task tracking per project: add/complete tasks, track time spent
- Invoice generation per project with full client + our company info, invoice metadata, line items (Date, Description, visit time, hourly rate, travel cost, material cost, total), totals (subtotal, tax, discount, grand total), PDF download, paid/unpaid status
- Client management: CRUD for clients with company name, email, phone, address, website
- Notifications: deadline alerts, payment reminders for unpaid invoices
- Reports: monthly earnings, project performance analytics with charts
- Dark/light mode toggle
- Sidebar navigation with icons
- Mobile responsive layout

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko): Auth with roles, projects CRUD, tasks CRUD, invoices CRUD, clients CRUD, notifications store, reports aggregation
2. Frontend: Sidebar layout, Dashboard page, Projects page, Project detail page with tasks, Invoice page with PDF export, Clients page, Reports page with charts, Notifications panel, Dark/light mode
3. Use authorization component for role-based access
