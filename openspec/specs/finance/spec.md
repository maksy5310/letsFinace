# Finance Collaboration System Spec

## Overview
A web-based financial management system for collaborative projects. It manages project activities, auto-calculates profits, handles supplier payment reconciliation, invoice management, supports Excel import/export, and multi-user collaboration.

## Requirements

### Requirement: Project Management
The system SHALL allow users to create and manage collaborative projects.

#### Scenario: Create project
- GIVEN a user with admin role
- WHEN the user creates a project with name, description, and member list
- THEN the project is persisted with a unique ID
- AND all members receive an invitation

#### Scenario: Add activity to project
- GIVEN an existing project
- WHEN a member adds an activity with title, date, and category
- THEN the activity is linked to the project
- AND visible to all project members

### Requirement: Income and Expense Tracking
The system SHALL record all income and expense transactions per project.

#### Scenario: Record transaction
- GIVEN a project with active status
- WHEN a member records a transaction with type (income/expense), amount, date, and description
- THEN the transaction is stored and reflected in project totals
- AND the member who recorded it is tracked

#### Scenario: Filter transactions
- GIVEN a project with multiple transactions
- WHEN a user filters by date range or category
- THEN only matching transactions are displayed
- AND totals are recalculated for the filtered set

### Requirement: Auto Profit Calculation
The system SHALL automatically calculate profit distribution among partners.

#### Scenario: Calculate profit
- GIVEN a project with income, expenses, and partner ratios defined
- WHEN the profit calculation is triggered
- THEN the net profit (income - expenses) is computed
- AND each partner's share is calculated based on their ratio

#### Scenario: Handle loss
- GIVEN a project where expenses exceed income
- WHEN the profit calculation is triggered
- THEN the loss is distributed according to partner ratios
- AND negative balances are shown per partner

### Requirement: Supplier Payment Reconciliation
The system SHALL track payments to suppliers and support reconciliation.

#### Scenario: Record supplier payment
- GIVEN a project with supplier information
- WHEN a payment to a supplier is recorded
- THEN the payment status updates (pending/paid/overdue)
- AND the supplier balance is updated

#### Scenario: Reconcile supplier account
- GIVEN a supplier with multiple recorded payments
- WHEN the user initiates reconciliation
- THEN all payments are listed with statuses
- AND any discrepancies are highlighted

### Requirement: Invoice Management
The system SHALL manage invoices with OCR support.

#### Scenario: Upload invoice
- GIVEN a user with editor role
- WHEN an invoice image or PDF is uploaded
- THEN the system extracts key fields via OCR (amount, date, invoice number)
- AND the invoice is linked to a transaction

#### Scenario: Export invoice ledger
- GIVEN a project with stored invoices
- WHEN the user requests an export
- THEN all invoice data is compiled into Excel format
- AND the file is available for download

### Requirement: Excel Import/Export
The system SHALL support bulk data operations via Excel.

#### Scenario: Import transactions
- GIVEN an Excel file with transaction data
- WHEN the user uploads the file
- THEN rows are validated and imported as transactions
- AND invalid rows are reported with reasons

#### Scenario: Export financial report
- GIVEN a project with complete data
- WHEN the user requests export
- THEN an Excel file with transactions, profit summary, and invoices is generated

### Requirement: Multi-User Collaboration
The system SHALL support real-time collaboration with role-based access.

#### Scenario: Invite member
- GIVEN a project admin
- WHEN the admin invites a user by email
- THEN the user receives an invitation link
- AND upon acceptance, gains access according to assigned role

#### Scenario: Concurrent edit
- GIVEN two users with editor role
- WHEN both edit project data simultaneously
- THEN changes are merged without data loss
- AND both users see the updated state
