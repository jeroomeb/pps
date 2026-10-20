# Checklist Creation Update: Risk Area Selection & Testing Guide

**Date:** October 21, 2026  
**Target:** Platform Admin / Super Admin Review  

---

## Overview

Based on your feedback, we have updated the **New Checklist Type** creator (`/admin/checklists/new`) so you can now designate the **Risk Area** (risk category) for each item directly during checklist creation, matching the dropdown available on existing checklists.

---

## What Was Added

1. **Risk Area Dropdown on Every Item**:
   - Each checklist item draft now includes the **Risk Area** dropdown (`Choose an area`).
   - Standard scoring categories available:
     - **Life-safety and liability**
     - **Appearance and city rules**
     - **Asset protection**
   - If left unselected, the engine will automatically infer the appropriate category from item keywords as a fallback.

2. **Smart Category Autocomplete**:
   - As you type in the **Service Category** field, the system displays quick suggestions based on existing categories in your checklists (e.g., *Common Area Fire & Life Safety*, *Clubhouse & Amenities*, etc.).
   - New categories typed in Item 1 immediately become suggested for subsequent items in the same form.

3. **Predictive Scoring Linkage**:
   - Tagged risk areas immediately feed into the predictive risk engine and pre-shift recurrence tracking as soon as inspections are scheduled using this template.

---

## Step-by-Step Testing Guide

Follow these quick steps to test the update:

### Step 1: Open the New Checklist Creator
1. Log in to the Admin Dashboard.
2. In the navigation bar, go to **Checklists**.
3. Click the **+ New Checklist** button (or navigate to `/admin/checklists/new`).

### Step 2: Fill in Checklist Details
1. Enter a **Checklist Name** (e.g., `Test Risk Area Checklist`).
2. Verify that **Enable Predictive Risk Scoring for this Checklist** is checked.

### Step 3: Add Items & Select Risk Areas
1. In **Item 1**:
   - Start typing in **Service Category** (notice the autocomplete suggestions from existing categories).
   - Enter an **Item Name** (e.g., `Emergency Exit Path`).
   - Add an optional description note.
   - Click the **Risk Area** dropdown and select **Life-safety and liability**.
2. Click **+ Add Item** to add a second item:
   - Notice the category typed above is now suggested in the dropdown.
   - Select **Appearance and city rules** for **Risk Area**.

### Step 4: Save & Verify
1. Click **Save Checklist Type**.
2. You will be redirected to the newly created checklist page (`/admin/checklists/[id]`).
3. Scroll down to review the items:
   - Each item reflects its chosen Risk Area badge.
   - You can also adjust or reorder them at any time.

---

*If you need any adjustments or further enhancements, please let us know!*
