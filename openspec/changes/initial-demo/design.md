# Design: Initial Demo Implementation

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Web UI    │◄────►│  REST API    │◄────►│ In-Memory   │
│ (HTML/JS)   │      │  (Express)   │      │   Store     │
└─────────────┘      └──────────────┘      └─────────────┘
```

## Tech Stack
- **Backend**: Node.js 20+, Express 4, Jest (testing)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Data**: In-memory storage with JSON serialization
- **Excel**: SheetJS (xlsx) for import/export
- **OCR**: Simulated (mock) OCR for demo

## API Endpoints

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/members` - Add member

### Transactions
- `POST /api/projects/:id/transactions` - Record transaction
- `GET /api/projects/:id/transactions` - List transactions
- `GET /api/projects/:id/transactions?from=&to=` - Filter by date

### Profit
- `GET /api/projects/:id/profit` - Calculate and return profit distribution

### Suppliers
- `POST /api/projects/:id/suppliers` - Add supplier
- `POST /api/projects/:id/suppliers/:sid/payments` - Record payment
- `GET /api/projects/:id/suppliers/:sid/reconcile` - Reconcile account

### Invoices
- `POST /api/projects/:id/invoices` - Upload invoice (mock OCR)
- `GET /api/projects/:id/invoices` - List invoices

### Excel
- `POST /api/projects/:id/import` - Import transactions from Excel
- `GET /api/projects/:id/export` - Export financial report to Excel

## Data Models

### Project
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "members": [{"userId": "string", "role": "admin|editor|viewer", "ratio": 0.5}],
  "createdAt": "ISO date"
}
```

### Transaction
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "type": "income|expense",
  "amount": 1000.00,
  "date": "ISO date",
  "description": "string",
  "category": "string",
  "recordedBy": "userId"
}
```

### Supplier
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "name": "string",
  "contact": "string",
  "payments": [{"id": "uuid", "amount": 500, "status": "pending|paid|overdue", "dueDate": "ISO date"}]
}
```

### Invoice
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "transactionId": "uuid",
  "amount": 1000.00,
  "date": "ISO date",
  "invoiceNumber": "string",
  "fileName": "string"
}
```
