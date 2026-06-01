I will implement a month selector in the Transactions page to filter transactions and update financial cards accordingly.

### 1. New State for Month Selection
- Add a `selectedMonth` state (initialized to current date) in `TransactionsPage` within `src/routes/transactions.tsx`.

### 2. Header and Month Selector
- Replace the current fixed period selector with a month selector next to the "Transações" title.
- Implement it as a clean, clickable button displaying "Month Year" (e.g., "Maio de 2026").
- Use a `Popover` with a month/year picker or simple "Previous/Next" arrows and a dropdown for quick navigation.

### 3. Updated Filtering Logic
- Update `filteredTransactions` to filter specifically by the `selectedMonth`.
- Logic: `data_inicio` must be within the first and last day of `selectedMonth`.
- Ensure other filters (Category, Method) still work on top of the month filter.

### 4. Recalculated Card Totals
- **Entradas**: Sum transactions where `tipo = "entrada"` and `data_inicio` is in the selected month.
- **Saídas**: Sum transactions where `tipo = "saida"` and `data_inicio` is in the selected month, ignoring "Crédito à vista" and "Crédito Parcelado".
- **Economia**: `Entradas (month) - Saídas (month)`.
- **Total em Conta (Accumulated)**: Sum all `entradas` minus all `saidas` (excluding credit methods) from the beginning of time up to the *last day* of the selected month.
- **Spending Distribution**: Filtered to include only expenses from the selected month.

### 5. Code Refinement
- Update `matchPeriod` or create a new `matchMonth` helper.
- Update `totals` calculation logic to handle the accumulated "Total em Conta" requirement.
- Clean up unused code related to the previous period filter if no longer needed.

Technical details:
- Use `date-fns` for date manipulations (`startOfMonth`, `endOfMonth`, `isSameMonth`, `format`).
- Portuguese locale for date formatting.
- Ensure the month selector is accessible and modern.