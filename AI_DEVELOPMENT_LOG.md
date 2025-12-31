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

### E. Financial Math & Display
* **Issue:** Balances showing as `-0.00` in red due to floating point errors (e.g., -0.000000001).
* **Solution:** When styling negative numbers (red text), use a tolerance check: `value < -0.01` instead of `value < 0`.

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

### [Feature: Sub-Award Pools & Enhanced Editing]
* **Added:** `utils/financialCalculations.ts` to centralize math.
* **Refactor:** `GrantManager.tsx` separated "Primary Deliverables" from "Sub-Award" logic.
* **Logic:** * "0.0: Sub-Award" deliverable is treated as a funding pool.
    * Community Distributions Header calculates: `Pool - Allocated = Remaining`.
* **UI:** * Right-aligned Status Dropdowns.
    * Added `HighContrastCurrencyInput` for better comma formatting.
    * Added `NotesSection` (timestamped logs) to Grants, Deliverables, and Communities.
    * Added `DeliverableModal` supporting Start/End/Completion dates.
    * Restored Attachments to Grant Details and Reports tabs.

### [Major Stability Update: Inputs & Robustness]
* **Currency Input Overhaul:** Replaced basic inputs with `HighContrastCurrencyInput`. This component separates "display state" (commas) from "edit state" to prevent the cursor jump bug when typing decimals.
* **Burn Rate & Forecasting:** Added visual burn rate calculation to the Dashboard. It now predicts how many months of funding are left based on current spending velocity.
* **Match Tracking:** Added specific tracking for Cost Share/Match vs. Grant Funds. Dashboard now alerts if Match is falling behind the required ratio.
* **Indirect Costs (IDC):** Added "Apply Indirect Cost" checkbox to the Expenditure Input. When checked, it automatically generates a second transaction for the overhead amount based on the grant's configured IDC rate.
* **Audit Logs:** Implemented `logAudit` in `dbService`. Critical actions (Create/Update/Delete) now write to a persistent, timestamped `auditLog` array on the Grant object.

### [Feature: Direct Deliverable Spending]
* **Logic Change:** Deliverables with no budget categories are now treated as single budget items.
* **UI Update:** "To Allocate" warning is hidden in `GrantManager` if a deliverable has no categories.
* **Data Entry:** `ExpenditureInput` now allows selecting "Direct to Deliverable (No Categories)" in the Category dropdown, assigning a special `direct` ID to the transaction.

### [Feature: Database Import & Sync]
* **Issue:** Clients were forced to create a new DB on every install, losing access to shared Drive files.
* **Backend:** Added `ipcMain.handle('open-db-file')` to allow selecting an existing JSON file without overwriting it.
* **Service:** Added `db.switchDatabase()` to change the active file path and `db.mergeData()` to import records from an external JSON file (handling ID de-duplication).
* **UI:** Updated `DataManagement.tsx` to split "Connect to Existing Database" (Sync) from "Create New Database" (Reset). Added "Import/Merge" button for consolidating offline work.