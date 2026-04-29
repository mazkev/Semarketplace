# Marketplace Application Design Document (React & Local Storage)

This document outlines the conceptual design, user workflow, and data structure for a simplified Marketplace application. The system features a clear separation between the customer interface (**Front Office**) and the management interface (**Back Office**).

---

## 1. Application Architecture
The application is built as a Single Page Application (SPA) that leverages the browser's native storage to simulate a database environment.

* **Frontend:** React.js (Component-based UI)
* **Database:** Browser Local Storage (For data persistence without an external server)
* **Environments:**
    * **Front Office:** Client-facing storefront.
    * **Back Office:** Admin-facing management dashboard.

---

## 2. Key Features

### A. Back Office (Inventory Management)
This module allows administrators to manage the products available for sale.
1.  **Product Entry:** A form to input Product Name, Price, and Image URL.
2.  **Inventory List:** A table view to monitor and manage all added items.
3.  **Data Synchronization:** Automatically saves and updates the `products` key in Local Storage.

### B. Front Office (Customer Storefront)
The primary interface for users to browse and purchase items.
1.  **Product Catalog:** Dynamically displays product cards based on the data stored in Local Storage.
2.  **Shopping Cart:** Allows users to select multiple items. Cart data is managed via temporary state.
3.  **Checkout Logic:** Calculates the total price and processes the final order.

### C. Receipt System (Invoicing)
An automated post-purchase feature that generates a digital bill.
1.  **Transaction ID:** Generated uniquely using a timestamp string.
2.  **Itemized Breakdown:** Displays a list of purchased items and their individual costs.
3.  **Grand Total:** The final sum of the transaction.

---

## 3. Data Structure (JSON Schema)

The data is persisted in the browser using JSON format. The two primary keys are:

### Product Data (`products`)
```json
[
  {
    "id": 1712345678,
    "name": "Product Name",
    "price": 100.00,
    "image": "image_url.jpg"
  }
]
Transaction History (transactions)
JSON
[
  {
    "id": "TRX-1712345678",
    "date": "2026-04-21 10:00",
    "items": [...],
    "total": 300.00
  }
]
4. User Journey (Workflow)
Setup: The Admin accesses the Back Office to populate the store with items.

Shopping: The Customer browses the Front Office, adds items to the cart, and reviews their selection.

Purchase: The Customer clicks "Buy Now." The system then:

Aggregates the total cost.

Logs the transaction history to Local Storage.

Triggers the Receipt view.

Completion: The receipt is displayed as confirmation. The user can then return to the main store.

5. System Constraints & Notes
Storage Limit: Data is subject to the browser's Local Storage limit (typically 5MB - 10MB).

Privacy: Data is stored locally on the user's machine; clearing browser cache will erase all data.

Concurrency: No real-time synchronization exists between different browsers or devices.