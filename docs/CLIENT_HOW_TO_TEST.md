# How to test the new updates

Use this after the latest update is live. Sign in as the HQ admin unless a step says to sign in as a specialist.

Use a test company and a test property. Do not delete a real company while testing. Deleting a tenant also removes its properties and inspections.

---

## 1. Checklists on a company and on a property

A company chooses which checklists it is allowed to use. A property then turns on one or more of those checklists.

1. Go to **Tenants & Licenses**.
2. Click **Provision Tenant**.
3. Fill in the company name.
4. Under **Checklist access**, tick more than one checklist (for example Luxury and Commercial).
5. Create the tenant.
6. Go to **Properties** and add a property for that company.
7. Under **Checklists for this property**, tick the checklists that building should use. You can tick more than one.
8. Save the property.

**Pass:** The property page lists the checklists you turned on. You do not have to create a separate inspection to hand those checklists out.

---

## 2. Assign the property, and keep the checklist available

The specialist is assigned to the property. The checklists on that property show up on their board.

**Available 24/7** means: after they submit a checklist, a new blank copy stays waiting for the next visit.

1. On the property, leave **Available 24/7** turned on.
2. In the property’s specialist roster, assign an inspector.
3. Sign in as that inspector (or use **Open User Panel** from Team).
4. Open their dashboard. The property’s checklists should already be there as pending work.
5. Complete and submit one checklist.
6. Go back to the inspector dashboard.

**Pass:** The finished visit is saved as a report, and the same checklist is pending again.

Then turn the switch off:

1. Sign back in as HQ admin.
2. Edit the property and uncheck **Available 24/7**.
3. As the inspector, submit the open checklist again.

**Pass:** That visit is saved, and a new blank copy does **not** appear on its own.

The property page no longer has a **New Inspection** form. Assignment is done from the specialist roster on the property.

---

## 3. Email when an inspector is assigned

1. Assign an inspector to a property. Use someone other than the account you are logged in as.
2. Check that person’s email inbox.

**Pass:** They receive an email that they were assigned to that property. It names the property, the address, and the checklists turned on for it.

Assigning the same person again should not send a second email.

---

## 4. Property type and pay tier

Pay is based on two choices: what kind of building it is, and which price tier it uses.

1. Add or edit a property.
2. Under **Specialist Audit Compensation & Payout Tier**, set both:
   - **Property type:** Luxury Condominium, 55+ Active Adult Community, or Commercial Multi-Tenant
   - **Compensation tier:** Tier 1, Tier 2, or Tier 3
3. Save.
4. Have a specialist complete an inspection on that property.
5. Open **Payouts** (payouts must be turned on for that company).

**Pass:** The earnings line uses the rate for that property type and that tier together, from the 3 by 3 rate grid. A Luxury Tier 1 property should not pay the same as a Commercial Tier 3 property if those cells have different amounts.

---

## 5. Bank details on the specialist profile

1. Sign in as a specialist.
2. Open **Profile**.
3. Find **Payment information (ACH)**.
4. Turn on **Enable direct deposit**.
5. Enter:
   - Bank name
   - Account number (4 to 17 digits)
   - Routing number (9 digits)
6. Click **Save Profile**.
7. Refresh the page.

**Pass:** The bank details are still there.

8. Turn **Enable direct deposit** off and save again.

**Pass:** The bank fields are cleared.

---

## 6. HQ opens one company’s dashboard

HQ can open a company’s own admin screen in a new tab, the same idea as **Open User Panel** on the team page. While that tab is open, HQ should only see that company’s properties, people, and reports.

1. Sign in as HQ.
2. Go to **Tenants & Licenses**.
3. On a company card, click **Open dashboard**. It opens in a new tab.
4. Look at the orange bar at the top. It should say you are viewing that company’s dashboard.
5. Open **Properties**, **Team**, and **Reports**.

**Pass:** You only see that company’s records, not every company at once.

6. Click **Exit to HQ** on the bar.

**Pass:** You return to **Tenants & Licenses** and can see all companies again.

One note: the view is stored in the browser. If the original HQ tab still looks like that one company, click **Exit to HQ** there as well.
