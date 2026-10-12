# Specification & Implementation Plan: Parent-Child Multi-Tenancy Hierarchy, Impersonation & Automated Credentials

**Client:** Amenity Op’s LLC  
**Feature Set:** 
1. Global Access & Parent-Child Multi-Tenancy Hierarchy
2. Admin Access to Specialist Dashboard (View as Specialist / Impersonation)
3. Cryptographically Secure Temporary Password Generator & Salted Hashes
4. Asynchronous Welcome & Credential Email Delivery (Resend API)

---

## 1. Architectural Overview & Entity Hierarchy

```
                            ┌──────────────────────────────────────────────┐
                            │    Level 1: Amenity Op's Master HQ           │
                            │  (is_global_admin = true, full platform access) │
                            └──────────────────────┬───────────────────────┘
                                                   │
                            ┌──────────────────────┴───────────────────────┐
                            │    Level 2: Parent Corporate Organization    │
                            │  (parent_organization_id is null / Master Tenant) │
                            └──────────────────────┬───────────────────────┘
                                                   │
                     ┌─────────────────────────────┴─────────────────────────────┐
                     ▼                                                           ▼
       ┌───────────────────────────┐                               ┌───────────────────────────┐
       │   Level 3: Child Tenant   │                               │   Level 3: Child Tenant   │
       │     (Regional Branch A)   │                               │     (Regional Branch B)   │
       │ parent_organization_id =  │                               │ parent_organization_id =  │
       │     Parent Org ID         │                               │     Parent Org ID         │
       └───────────────────────────┘                               └───────────────────────────┘
```

---

## 2. Detailed Technical Components

### A. Parent-Child Multi-Tenancy Hierarchy
- **Schema Update**: Added `parent_organization_id uuid references tenants(id) on delete set null` to the `tenants` table.
- **Query Filter Logic**: 
  - Global Admins (`is_global_admin = true`) query across all tenants.
  - Parent Organization Admins automatically inherit and query data from all child organizations whose `parent_organization_id` matches their tenant ID.
  - Child Tenant users are strictly confined to their local `tenant_id`.

### B. Admin "View as Specialist" Dashboard Access
- Admins can inspect any specialist profile at `/admin/team/[id]` and click **"View Specialist Dashboard"**.
- Opens `/inspector?viewAs=[specialistId]` allowing admins to see the exact inspection board, active checklists, and schedule assigned to that specialist without logging out or disturbing sessions.

### C. Cryptographically Secure Password Generation
- `generateSecureTemporaryPassword()` creates 12-character high-entropy strings using Node.js `crypto.randomBytes`.
- Passed directly to `supabase.auth.admin.createUser`, ensuring it is securely salted and hashed in Supabase Auth.
- Forces `must_reset_password = true` in `profiles` so the user is immediately routed to `/force-password-change` upon first sign-in.

### D. Asynchronous Welcome Credential Email Delivery
- Asynchronously dispatches a branded email via **Resend** upon account creation without blocking the admin UI response.
- Contains the login URL (`https://amenityops.app/login`), email address, temporary password, and notice of mandatory first-time password reset.
