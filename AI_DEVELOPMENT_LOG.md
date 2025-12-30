# AI DEVELOPMENT LOG & HANDOVER NOTES

> **NOTICE TO FUTURE AI DEVELOPERS:**
> This file serves as a persistent memory for the Eckerdt Grant Manager project. 
> BEFORE modifying code, review this log to understand past bugs, architectural decisions, and regression risks.
> 
> **YOUR GOAL:** Prevent regression. Do not remove features (like delete buttons or detailed columns) when refactoring.
> **YOUR ACTION:** After every significant code update, append a brief summary of what changed and why to the bottom of this file.

---

## 1. Project Architecture & Stack
- **Framework:** React 18 + Vite + TypeScript
- **Wrapper:** Electron (Main process handles file I/O)
- **Database:** LocalStorage (Simulated via `services/dbService.ts`). *Do not introduce complex async DBs without user request.*
- **Styling:** Tailwind CSS (via CDN for simplicity, or local config).
- **Icons:** Lucide-React.

## 2. Critical Lessons Learned & Regression Risks

### A. Receipt & File Handling
* **Issue:** "Failed to load PDF document" or broken image icons.
* **Cause:** 1. The backend (`main.cjs`) was strictly stripping `data:image/...` headers but missing `data:application/pdf...`.
    2. The Frontend was trying to render PDFs in `<img>` tags.
* **Solution (Do Not Revert):**
    * **Backend:** Use generic regex `base64.replace(/^data:.+;base64,/, "")` in `ipcMain.handle('save-receipt')`.
    * **Frontend:** Check `receiptImage.startsWith('blob:')` or `application/pdf`. If PDF, render an `<iframe />`. If Image, render an `<img />`.
    * **Blobs:** Always convert Base64 PDFs to **Blob URLs** in the frontend (`handleViewReceipt`) before rendering to avoid Chrome/Electron viewer crashes.

### B. UI/UX & Electron Constraints
* **Issue:** `Uncaught Error: prompt() is and will not be supported.`
* **Cause:** Electron environments often disable native browser popups like `alert()`, `confirm()`, and `prompt()`.
* **Solution:** Never use `prompt()`. Build custom React Modals (e.g., `addingCommunityTo` state in `GrantManager.tsx`). `window.confirm()` usually works but custom UI is safer.

### C. Tree View & Data Display
* **Issue:** Loss of detail in the Grant Portfolio Tree View.
* **Regression Risk:** When refactoring the `GrantManager` tree, ensure the "Expenditure" level (deepest node) displays **Date**, **Vendor**, **Purchaser**, **Justification**, and **Amount**. Do not simplify this to just "Amount".
* **Feature:** The "Add Deliverable" button must work for both Primary Grants AND Sub-Recipients.

### D. Data Integrity & Types
* **Issue:** `Received NaN for the value attribute` / `Cannot read properties of null (reading 'toLocaleString')`.
* **Cause:** TypeScript allows `number | undefined`, but React Inputs dislike `undefined` or `NaN`.
* **Solution:** * Inputs: `onChange={e => setField(safeParseFloat(e.target.value))}`.
    * Display: `{(value || 0).toLocaleString()}`. Always fallback to `0`.

---

## 3. Change Log & Feature History

### [Initial Build - v1.0]
* Basic Grant, Deliverable, and Category structure established.
* Expenditure input via manual form or AI Receipt Scanning (Gemini).

### [Fix: Receipt Viewer]
* **Problem:** Viewer modal was nested inside `if(!isEditing)` and vanished during Edit Mode.
* **Fix:** Moved `receiptImage` modal to the root of the component return.

### [Feature: Sub-Recipients / Community Funds]
* **Added:** `subRecipients` array to `Grant` type.
* **UI:** Updated Tree View to have two distinct sections: "Primary Grant Activities" and "Community Distributions".
* **Logic:** Updated `unallocated` calculations to account for money moved into Sub-Recipients.

### [Fix: Expenditure Management]
* **Problem:** Users could not delete or edit bad entries.
* **Fix:** 1. Added `saveExpenditure` and `deleteExpenditure` to `dbService`.
    2. Added "Edit" (Pencil) and "Delete" (Trash) icons to the Expenditure Detail Modal in `GrantManager`.
    3. Added "Delete" (Trash) icon to the table rows in `Reporting.tsx`.

### [Fix: Blank Screen on Edit]
* **Problem:** Syntax error (missing `}`) in `GrantManager.tsx` caused the component to crash.
* **Fix:** Audit of all closing braces and moved `DeliverablesEditor` component outside of the main function scope to prevent focus loss and render issues.

---

## 4. Current "To-Do" / Known State
* **Sub-Recipient Management:** Fully functional in Tree View (Add/Edit/Delete) and Edit View.
* **Expenditures:** Fully editable/deletable in all views.
* **Reporting:** CSV Download and Pie Charts are active.