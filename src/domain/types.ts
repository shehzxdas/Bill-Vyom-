/**
 * Bill Vyom — Authoritative Domain Models & Types
 * Strictly enforces platform architecture constitution & multi-tenant boundaries.
 */

export interface StandardMetadata {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
  version: number;
}

export type BusinessStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface Address {
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
}

export interface Tenant {
  id: string;
  legal_name: string;
  trade_name: string;
  country_code: string;
  base_currency_code: string;
  timezone: string;
  business_type: string;
  industry: string;
  status: BusinessStatus;
  address: Address;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
  version: number;
}

export interface TaxRegistration {
  id: string;
  registration_type: string; // e.g., 'LOCAL_TAX_ID', 'VAT_REGISTRATION', 'CORPORATE_TAX_ID'
  registration_number: string;
  jurisdiction_code: string;
  is_primary: boolean;
}

export interface LegalEntity extends StandardMetadata {
  entity_code: string;
  legal_name: string;
  country_code: string;
  currency_code: string;
  timezone: string;
  jurisdiction_code: string;
  tax_registrations: TaxRegistration[];
  fiscal_start_month: number; // 1 to 12
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Branch extends StandardMetadata {
  legal_entity_id: string;
  branch_code: string;
  branch_name: string;
  country_code: string;
  timezone: string;
  currency_code: string;
  address: Address;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Warehouse extends StandardMetadata {
  branch_id: string;
  warehouse_code: string;
  warehouse_name: string;
  address: Address;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUnit extends StandardMetadata {
  legal_entity_id: string | null;
  parent_business_unit_id: string | null;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UserInvitation extends StandardMetadata {
  email: string;
  role_code: string;
  scope_type: 'TENANT' | 'LEGAL_ENTITY' | 'BRANCH' | 'OWN';
  scope_id: string | null;
  token_hash: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expires_at: string;
  accepted_at: string | null;
}

export interface Role extends StandardMetadata {
  role_code: string;
  role_name: string;
  description: string;
  is_system: boolean;
  permission_ids?: string[];
}

export interface Permission {
  id: string;
  module: string; // e.g., 'organization', 'sales', 'inventory', 'accounting', 'settings'
  resource: string; // e.g., 'branches', 'legal_entities', 'users'
  action: string; // e.g., 'view', 'create', 'edit', 'delete'
  scope: 'tenant' | 'legal_entity' | 'branch' | 'warehouse' | 'own';
}

export interface UserRoleAssignment {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  branch_id?: string | null;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface WorkflowDefinition extends StandardMetadata {
  name: string;
  trigger_action: string;
  steps: {
    step_order: number;
    approver_role_code: string;
    required_approvals: number;
  }[];
  status: 'ACTIVE' | 'DRAFT';
}

export interface WorkflowInstance extends StandardMetadata {
  workflow_definition_id: string;
  resource_type: string;
  resource_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  current_step: number;
  initiated_by: string;
}

export interface TenantNotification {
  id: string;
  tenant_id: string;
  recipient_user_id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
  read_at: string | null;
  created_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  business: {
    trade_name: string;
    legal_name: string;
    industry: string;
    business_type: string;
    timezone: string;
    base_currency: string;
  };
  localization: {
    date_format: string;
    time_format: string;
    number_format: string;
  };
  numbering_sequences: {
    prefix: string;
    next_number: number;
    document_type: string;
  }[];
  notifications: {
    email_alerts: boolean;
    approval_reminders: boolean;
  };
  security: {
    session_timeout_minutes: number;
    mfa_required: boolean;
  };
}

// ==========================================
// PHASE 2: MASTER DATA DOMAIN INTERFACES
// ==========================================

export type ProductType = 'GOODS' | 'SERVICE' | 'DIGITAL' | 'BUNDLE' | 'COMPOSITE';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface ProductCategory extends StandardMetadata {
  category_code: string;
  category_name: string;
  parent_id: string | null;
  path: string; // e.g. "Electronics/Computers/Laptops"
  sequence: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UOMGroup extends StandardMetadata {
  group_code: string;
  group_name: string;
  measurement_type: 'COUNT' | 'WEIGHT' | 'VOLUME' | 'LENGTH' | 'AREA' | 'TIME';
}

export interface UnitOfMeasure extends StandardMetadata {
  uom_group_id: string;
  uom_code: string;
  uom_name: string;
  symbol: string;
  decimal_places: number;
  is_base: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UOMConversion extends StandardMetadata {
  from_uom_id: string;
  to_uom_id: string;
  conversion_factor: number; // e.g. 1 Carton = 12 Units -> factor 12
  rounding_rule: 'NEAREST' | 'UP' | 'DOWN';
}

export interface Product extends StandardMetadata {
  product_code: string;
  name: string;
  description: string;
  category_id: string | null;
  brand_name: string;
  product_type: ProductType;
  status: ProductStatus;
  base_uom_id: string;
  purchase_uom_id: string;
  sales_uom_id: string;
  inventory_uom_id: string;
  attributes: Record<string, string | string[]>;
}

export interface ProductVariant extends StandardMetadata {
  product_id: string;
  variant_code: string;
  variant_name: string;
  sku: string;
  manufacturer_part_number: string;
  attributes: Record<string, string>;
  status: ProductStatus;
}

export interface ProductIdentifier extends StandardMetadata {
  variant_id: string;
  identifier_type: 'EAN' | 'UPC' | 'GTIN' | 'INTERNAL' | 'MPN' | 'EXTERNAL';
  identifier_value: string;
  scope: 'GLOBAL' | 'LEGAL_ENTITY' | 'BRANCH';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductTaxClassification extends StandardMetadata {
  product_id: string;
  jurisdiction_code: string; // e.g. 'IN', 'US', 'AE', 'GB', 'SG'
  classification_system: string; // e.g. 'HSN', 'SAC', 'UNSPSC', 'US_TAX_CODE', 'VAT_CATEGORY'
  classification_code: string;
  tax_category: 'STANDARD' | 'REDUCED' | 'ZERO' | 'EXEMPT' | 'OUT_OF_SCOPE';
  effective_from: string;
  effective_to: string | null;
}

// Customers & Contacts
export type CustomerType = 'BUSINESS' | 'INDIVIDUAL' | 'ORGANIZATION';

export interface CustomerGroup extends StandardMetadata {
  group_code: string;
  group_name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CustomerCreditConfig {
  credit_limit: string; // Decimal string e.g. "50000.00"
  credit_days: number;
  credit_status: 'APPROVED' | 'ON_HOLD' | 'SUSPENDED';
  payment_terms_id: string | null;
}

export interface Customer extends StandardMetadata {
  customer_code: string;
  customer_name: string;
  legal_name: string;
  customer_type: CustomerType;
  customer_group_id: string | null;
  contact_email: string;
  contact_phone: string;
  country_code: string;
  currency_code: string;
  payment_terms_id: string | null;
  tax_registrations: TaxRegistration[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  credit_config: CustomerCreditConfig;
}

export interface CustomerContact extends StandardMetadata {
  customer_id: string;
  contact_name: string;
  role_title: string;
  email: string;
  phone: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CustomerAddress extends StandardMetadata {
  customer_id: string;
  address_type: 'BILLING' | 'SHIPPING' | 'REGISTERED' | 'OFFICE' | 'OTHER';
  street_line1: string;
  street_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  is_primary: boolean;
}

// Vendors & Contacts
export type VendorType = 'BUSINESS' | 'ORGANIZATION' | 'INDIVIDUAL';

export interface VendorGroup extends StandardMetadata {
  group_code: string;
  group_name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VendorPaymentConfig {
  payment_terms_id: string | null;
  bank_name: string;
  account_number: string;
  routing_code: string;
  payment_method: string;
}

export interface Vendor extends StandardMetadata {
  vendor_code: string;
  vendor_name: string;
  legal_name: string;
  vendor_type: VendorType;
  vendor_group_id: string | null;
  contact_email: string;
  contact_phone: string;
  country_code: string;
  currency_code: string;
  payment_terms_id: string | null;
  tax_registrations: TaxRegistration[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  payment_config: VendorPaymentConfig;
}

export interface VendorContact extends StandardMetadata {
  vendor_id: string;
  contact_name: string;
  role_title: string;
  email: string;
  phone: string;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VendorAddress extends StandardMetadata {
  vendor_id: string;
  address_type: 'REMITTANCE' | 'PHYSICAL' | 'REGISTERED' | 'OFFICE';
  street_line1: string;
  street_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  is_primary: boolean;
}

// Warehouse Storage Locations
export interface StorageLocation extends StandardMetadata {
  warehouse_id: string;
  location_code: string;
  location_name: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  location_type: 'PICKING' | 'BULK' | 'RECEIVING' | 'STAGING' | 'QUARANTINE';
  status: 'ACTIVE' | 'INACTIVE';
}

// Currencies & Exchange Rates
export interface CurrencyReference {
  currency_code: string;
  currency_name: string;
  symbol: string;
  decimal_places: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ExchangeRate {
  id: string;
  tenant_id: string;
  from_currency: string;
  to_currency: string;
  rate: string; // e.g. "83.25"
  rate_type: 'SPOT' | 'CORPORATE' | 'CUSTOM';
  effective_date: string;
  source: string;
  created_at: string;
  created_by: string;
}

// Countries & Jurisdictions References
export interface CountryReference {
  country_code: string;
  country_name: string;
  iso_alpha3: string;
  default_currency_code: string;
  default_language_code: string;
}

export interface JurisdictionReference {
  jurisdiction_code: string;
  jurisdiction_name: string;
  country_code: string;
  tax_authority_name: string;
}

// Price Lists & Items
export interface PriceList extends StandardMetadata {
  price_list_code: string;
  price_list_name: string;
  currency_code: string;
  scope: 'GLOBAL' | 'LEGAL_ENTITY' | 'BRANCH';
  scope_id: string | null;
  customer_group_id: string | null;
  effective_from: string;
  effective_to: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PriceListItem extends StandardMetadata {
  price_list_id: string;
  variant_id: string;
  uom_id: string;
  min_quantity: number;
  unit_price: string; // e.g. "120.00"
  status: 'ACTIVE' | 'INACTIVE';
}

// Payment Terms
export interface PaymentTerms extends StandardMetadata {
  term_code: string;
  term_name: string;
  rule_type: 'IMMEDIATE' | 'NET_DAYS' | 'DUE_DATE' | 'INSTALLMENTS';
  net_days: number;
  discount_days: number;
  discount_percentage: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Document Numbering Configuration
export type DocumentType =
  | 'INVOICE'
  | 'QUOTATION'
  | 'SALES_ORDER'
  | 'PURCHASE_ORDER'
  | 'PURCHASE_REQUISITION'
  | 'RFQ'
  | 'SUPPLIER_QUOTATION'
  | 'GOODS_RECEIPT'
  | 'VENDOR_BILL'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'VENDOR_CREDIT_NOTE'
  | 'VENDOR_DEBIT_NOTE'
  | 'PAYMENT'
  | 'VENDOR_PAYMENT'
  | 'RECEIPT'
  | 'STOCK_TRANSFER'
  | 'FULFILLMENT'
  | 'SALES_RETURN'
  | 'PAYMENT_BATCH'
  | 'WRITE_OFF';

export interface DocumentNumberingConfig extends StandardMetadata {
  document_type: DocumentType;
  legal_entity_id: string | null;
  branch_id: string | null;
  prefix: string;
  suffix: string;
  sequence_length: number;
  current_sequence: number;
  fiscal_year: string;
  effective_from: string;
  effective_to: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  query?: string;
  status?: string;
  type?: string;
  category_id?: string;
  group_id?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}


export interface DashboardMetrics {
  currency_code: string;
  total_revenue: string; // '0.00'
  receivables: string; // '0.00'
  payables: string; // '0.00'
  inventory_value: string; // '0.00'
  cash_flow: string; // '0.00'
  net_profit: string; // '0.00'
  pending_approvals_count: number; // 0
  active_legal_entities_count: number;
  active_branches_count: number;
  active_warehouses_count: number;
  active_users_count: number;
}

// ==========================================
// PHASE 3: ACCOUNTING CORE & LEDGER INTERFACES
// ==========================================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type AccountSubtype =
  // Asset subtypes
  | 'CURRENT_ASSET'
  | 'NON_CURRENT_ASSET'
  | 'CASH_AND_EQUIVALENT'
  | 'BANK'
  | 'ACCOUNTS_RECEIVABLE'
  | 'INVENTORY'
  | 'FIXED_ASSET'
  | 'OTHER_ASSET'
  // Liability subtypes
  | 'CURRENT_LIABILITY'
  | 'NON_CURRENT_LIABILITY'
  | 'ACCOUNTS_PAYABLE'
  | 'TAX_PAYABLE'
  | 'OTHER_LIABILITY'
  // Equity subtypes
  | 'OWNERS_EQUITY'
  | 'RETAINED_EARNINGS'
  | 'CAPITAL'
  // Revenue subtypes
  | 'OPERATING_REVENUE'
  | 'NON_OPERATING_REVENUE'
  | 'SALES'
  // Expense subtypes
  | 'COST_OF_GOODS_SOLD'
  | 'OPERATING_EXPENSE'
  | 'ADMINISTRATIVE_EXPENSE'
  | 'TAX_EXPENSE'
  | 'FINANCE_COST';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export type CurrencyPolicy = 'SINGLE_CURRENCY' | 'MULTI_CURRENCY';

export interface Account extends StandardMetadata {
  legal_entity_id: string;
  accounting_book_id: string;
  code: string;
  name: string;
  account_type: AccountType;
  account_subtype: AccountSubtype;
  parent_account_id: string | null;
  normal_balance: NormalBalance;
  currency_policy: CurrencyPolicy;
  single_currency_code?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  description: string;
  is_system_account: boolean;
  posting_allowed: boolean;
}

export type AccountingBookType = 'PRIMARY' | 'STATUTORY' | 'MANAGEMENT' | 'REPORTING';

export interface AccountingBook extends StandardMetadata {
  legal_entity_id: string;
  book_code: string;
  book_name: string;
  book_type: AccountingBookType;
  base_currency_code: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FiscalCalendar extends StandardMetadata {
  legal_entity_id: string;
  calendar_name: string;
  start_month: number; // 1 to 12
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FiscalYear extends StandardMetadata {
  fiscal_calendar_id: string;
  year_name: string; // e.g. "FY 2026"
  start_date: string; // "2026-01-01"
  end_date: string;   // "2026-12-31"
  status: 'OPEN' | 'CLOSED';
}

export type FiscalPeriodStatus = 'OPEN' | 'SOFT_CLOSE' | 'CLOSED';

export interface FiscalPeriod extends StandardMetadata {
  fiscal_year_id: string;
  period_number: number; // 1 to 12
  period_name: string;   // "Jan 2026"
  start_date: string;
  end_date: string;
  status: FiscalPeriodStatus;
  closed_at?: string | null;
  closed_by?: string | null;
}

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'VOID';

export type JournalSourceType =
  | 'MANUAL'
  | 'INVOICE'
  | 'PAYMENT'
  | 'PURCHASE_BILL'
  | 'EXPENSE'
  | 'INVENTORY_ADJUSTMENT'
  | 'PAYROLL'
  | 'BANK_TRANSACTION'
  | 'REVERSAL';

export interface JournalEntry extends StandardMetadata {
  accounting_book_id: string;
  legal_entity_id: string;
  fiscal_period_id: string;
  entry_number: string;
  transaction_date: string;
  posting_date: string;
  document_date: string;
  reference: string;
  description: string;
  source_type: JournalSourceType;
  source_id: string | null;
  currency_code: string;
  exchange_rate: string; // Decimal string e.g. "1.0000" or "83.5000"
  status: JournalEntryStatus;
  created_by: string;
  posted_by?: string | null;
  posted_at?: string | null;
  reversal_of_entry_id?: string | null;
  reversed_by_entry_id?: string | null;
  idempotency_key?: string | null;
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  tenant_id: string;
  account_id: string;
  debit: string;  // Decimal string e.g. "1500.00"
  credit: string; // Decimal string e.g. "0.00"
  currency_code: string;
  exchange_rate: string;
  base_debit: string;  // Decimal string in book base currency
  base_credit: string; // Decimal string in book base currency
  description: string;
  dimensions: Record<string, string>; // e.g. { branch_id: '...', cost_center: '...', department: '...' }
  reference: string;
}

export interface AccountingDimension extends StandardMetadata {
  dimension_key: string;  // e.g. 'cost_center', 'department', 'project', 'branch_id'
  dimension_name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TaxAccountMapping extends StandardMetadata {
  tax_type: string;
  jurisdiction_code: string;
  receivable_account_id: string; // Purchase Tax Input Account
  payable_account_id: string;    // Sales Tax Output Account
  effective_date: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TrialBalanceItem {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  opening_debit: string;
  opening_credit: string;
  opening_balance: string; // Net opening
  period_debit: string;
  period_credit: string;
  closing_debit: string;
  closing_credit: string;
  closing_balance: string; // Net closing
}

export interface TrialBalanceReport {
  legal_entity_id: string;
  accounting_book_id: string;
  fiscal_period_id?: string | null;
  start_date: string;
  end_date: string;
  currency_code: string;
  is_balanced: boolean;
  total_opening_debit: string;
  total_opening_credit: string;
  total_period_debit: string;
  total_period_credit: string;
  total_closing_debit: string;
  total_closing_credit: string;
  items: TrialBalanceItem[];
}

export interface GeneralLedgerLine {
  id: string;
  journal_entry_id: string;
  entry_number: string;
  transaction_date: string;
  posting_date: string;
  reference: string;
  source_type: JournalSourceType;
  description: string;
  debit: string;
  credit: string;
  running_balance: string;
  currency_code: string;
  dimensions: Record<string, string>;
}

export interface GeneralLedgerStatement {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  currency_code: string;
  start_date: string;
  end_date: string;
  opening_balance: string;
  total_debit: string;
  total_credit: string;
  closing_balance: string;
  lines: GeneralLedgerLine[];
  total_count: number;
}

// ==========================================
// PHASE 4: SALES TRANSACTION ENGINE INTERFACES
// ==========================================

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface QuotationLine {
  id: string;
  quotation_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
}

export interface Quotation extends StandardMetadata {
  quotation_number: string;
  version_number: number;
  customer_id: string;
  contact_id?: string | null;
  legal_entity_id: string;
  branch_id?: string | null;
  billing_address: Address;
  shipping_address: Address;
  currency_code: string;
  exchange_rate: string;
  price_list_id?: string | null;
  quotation_date: string;
  valid_until: string;
  salesperson_id?: string | null;
  notes?: string;
  terms_and_conditions?: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  status: QuotationStatus;
  converted_sales_order_id?: string | null;
  lines: QuotationLine[];
}

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';

export interface SalesOrderLine {
  id: string;
  sales_order_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity_ordered: number;
  quantity_fulfilled: number;
  quantity_remaining: number;
  uom_id: string;
  unit_price: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
}

export interface SalesOrder extends StandardMetadata {
  order_number: string;
  customer_id: string;
  contact_id?: string | null;
  legal_entity_id: string;
  branch_id?: string | null;
  currency_code: string;
  exchange_rate: string;
  price_list_id?: string | null;
  order_date: string;
  requested_delivery_date?: string | null;
  salesperson_id?: string | null;
  payment_terms_id?: string | null;
  billing_address: Address;
  shipping_address: Address;
  source_quotation_id?: string | null;
  notes?: string;
  terms_and_conditions?: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  status: SalesOrderStatus;
  lines: SalesOrderLine[];
}

export type InvoiceType = 'STANDARD' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'PROFORMA' | 'TAX_INVOICE';
export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED' | 'CANCELLED';

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
  sales_order_line_id?: string | null;
}

export interface Invoice extends StandardMetadata {
  invoice_number: string;
  invoice_type: InvoiceType;
  customer_id: string;
  contact_id?: string | null;
  legal_entity_id: string;
  branch_id?: string | null;
  currency_code: string;
  exchange_rate: string;
  invoice_date: string;
  due_date: string;
  payment_terms_id?: string | null;
  billing_address: Address;
  shipping_address: Address;
  reference?: string;
  source_sales_order_id?: string | null;
  source_quotation_id?: string | null;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  status: InvoiceStatus;
  posted_at?: string | null;
  posted_by?: string | null;
  journal_entry_id?: string | null;
  voided_at?: string | null;
  voided_by?: string | null;
  reversal_journal_entry_id?: string | null;
  lines: InvoiceLine[];
}

export interface DeliveryReference extends StandardMetadata {
  delivery_number: string;
  sales_order_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  warehouse_id?: string | null;
  customer_id: string;
  delivery_date: string;
  status: 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  lines: {
    id: string;
    delivery_reference_id: string;
    sales_order_line_id: string;
    product_id: string;
    quantity_requested: number;
    quantity_fulfilled: number;
  }[];
}

export type FulfillmentStatus = 'PENDING' | 'READY' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';

export interface FulfillmentLine {
  id: string;
  fulfillment_id: string;
  tenant_id: string;
  sales_order_line_id: string;
  product_id: string;
  quantity: number;
  uom_id: string;
  warehouse_id?: string | null;
}

export interface Fulfillment extends StandardMetadata {
  fulfillment_number: string;
  sales_order_id: string;
  customer_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  status: FulfillmentStatus;
  lines: FulfillmentLine[];
  notes?: string;
}

export type CreditNoteStatus = 'DRAFT' | 'ISSUED' | 'VOIDED';

export interface CreditNoteLine {
  id: string;
  credit_note_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
  invoice_line_id?: string | null;
}

export interface CreditNote extends StandardMetadata {
  credit_note_number: string;
  original_invoice_id: string;
  customer_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  currency_code: string;
  exchange_rate: string;
  reason: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  status: CreditNoteStatus;
  posted_at?: string | null;
  posted_by?: string | null;
  journal_entry_id?: string | null;
  lines: CreditNoteLine[];
}

export type DebitNoteStatus = 'DRAFT' | 'ISSUED' | 'VOIDED';

export interface DebitNoteLine {
  id: string;
  debit_note_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
  invoice_line_id?: string | null;
}

export interface DebitNote extends StandardMetadata {
  debit_note_number: string;
  original_invoice_id?: string | null;
  customer_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  currency_code: string;
  exchange_rate: string;
  reason: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  status: DebitNoteStatus;
  posted_at?: string | null;
  posted_by?: string | null;
  journal_entry_id?: string | null;
  lines: DebitNoteLine[];
}

export interface SalesReturnLine {
  id: string;
  sales_return_id: string;
  tenant_id: string;
  product_id: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  reason: string;
  original_invoice_line_id?: string | null;
}

export interface SalesReturn extends StandardMetadata {
  return_number: string;
  original_invoice_id?: string | null;
  original_order_id?: string | null;
  customer_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  currency_code: string;
  exchange_rate: string;
  status: 'DRAFT' | 'APPROVED' | 'CANCELLED';
  lines: SalesReturnLine[];
  notes?: string;
}

export interface DocumentSnapshot {
  id: string;
  tenant_id: string;
  document_type: 'QUOTATION' | 'SALES_ORDER' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  document_id: string;
  customer_name_snapshot: string;
  billing_address_snapshot: Address;
  shipping_address_snapshot: Address;
  created_at: string;
}

export interface DocumentStatusHistory {
  id: string;
  tenant_id: string;
  document_type: 'QUOTATION' | 'SALES_ORDER' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'SALES_RETURN' | 'FULFILLMENT';
  document_id: string;
  from_status: string;
  to_status: string;
  actor_id: string;
  timestamp: string;
  reason?: string;
}

export interface DocumentAttachment {
  id: string;
  tenant_id: string;
  document_type: 'QUOTATION' | 'SALES_ORDER' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'FULFILLMENT' | 'SALES_RETURN';
  document_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface DocumentRelationship {
  id: string;
  tenant_id: string;
  source_type: 'QUOTATION' | 'SALES_ORDER' | 'DELIVERY' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'FULFILLMENT' | 'SALES_RETURN';
  source_id: string;
  target_type: 'QUOTATION' | 'SALES_ORDER' | 'DELIVERY' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'FULFILLMENT' | 'SALES_RETURN';
  target_id: string;
  relation_type: 'CONVERTED_FROM' | 'FULFILLED_BY' | 'INVOICED_BY' | 'REVERSED_BY';
  created_at: string;
}

export interface SalesDashboardOverview {
  currency_code: string;
  total_sales: string;
  total_outstanding: string;
  total_paid: string;
  total_overdue: string;
  quotations_count: number;
  sales_orders_count: number;
  invoices_count: number;
  quotation_conversion_rate: string;
}

export interface AccountPeriodBalance {
  id: string;
  tenant_id: string;
  account_id: string;
  period_id: string;
  opening_debit: string;
  opening_credit: string;
  debits: string;
  credits: string;
  closing_debit: string;
  closing_credit: string;
  updated_at: string;
}

export interface GLQueryFilters {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  periodId?: string;
  legalEntityId?: string;
  currencyCode?: string;
  dimensionType?: string;
  dimensionValue?: string;
}

export interface GLResultRow {
  journalId: string;
  entryCode: string;
  accountingDate: string;
  description: string;
  reference: string;
  debit: string;
  credit: string;
  runningBalance: string;
  dimensions: Record<string, string>;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: string;
  debitMovement: string;
  creditMovement: string;
  closingBalance: string;
}

// ==========================================
// PHASE 6: GLOBAL AR & CUSTOMER COLLECTIONS
// ==========================================

export type ReceivableStatus = 'OPEN' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'OVERDUE' | 'ON_HOLD' | 'WRITTEN_OFF' | 'CANCELLED';

export interface Receivable extends StandardMetadata {
  receivable_number: string;
  customer_id: string;
  legal_entity_id: string;
  branch_id: string | null;
  source_type: 'INVOICE' | 'DEBIT_NOTE' | 'OTHER';
  source_id: string;
  invoice_date: string;
  due_date: string;
  currency_code: string;
  original_amount: string; // Decimal string
  allocated_amount: string; // Decimal string
  outstanding_amount: string; // Decimal string
  status: ReceivableStatus;
  notes?: string;
}

export interface ReceivableSchedule extends StandardMetadata {
  receivable_id: string;
  due_date: string;
  amount: string;
  allocated_amount: string;
  outstanding_amount: string;
  currency_code: string;
  status: 'PENDING' | 'PAID';
}

export type PaymentStatus = 'RECEIVED' | 'CONFIRMED' | 'POSTED' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED' | 'UNAPPLIED' | 'REVERSED' | 'REFUNDED' | 'CANCELLED';

export interface Payment extends StandardMetadata {
  payment_number: string;
  customer_id: string;
  legal_entity_id: string;
  branch_id: string | null;
  payment_date: string;
  currency_code: string;
  amount: string;
  payment_method: string; // e.g. 'cash', 'bank transfer', 'card', 'cheque'
  payment_channel: string; // e.g. 'manual', 'bank integration', 'payment gateway'
  reference: string;
  external_reference?: string;
  status: PaymentStatus;
  received_account_id: string;
  journal_entry_id: string | null;
  notes?: string;
}

export interface PaymentAllocation extends StandardMetadata {
  payment_id: string;
  receivable_id: string;
  allocated_amount: string;
  allocation_date: string;
  currency_code: string;
}

export interface PaymentReversal extends StandardMetadata {
  payment_id: string;
  reversal_date: string;
  reason: string;
  journal_entry_id: string | null;
}

export interface Refund extends StandardMetadata {
  refund_number: string;
  original_payment_id: string;
  amount: string;
  currency_code: string;
  reason: string;
  destination: string;
  status: 'PENDING' | 'CONFIRMED' | 'POSTED' | 'FAILED' | 'CANCELLED';
  journal_entry_id: string | null;
}

export interface CustomerCreditProfile extends StandardMetadata {
  customer_id: string;
  credit_limit: string;
  credit_days: number;
  risk_classification: string;
  credit_status: 'APPROVED' | 'ON_HOLD' | 'SUSPENDED';
  review_date?: string;
  approval_information?: string;
  credit_hold_status: 'NONE' | 'ACTIVE';
}

export interface CreditHold extends StandardMetadata {
  customer_id: string;
  reason: string; // e.g., 'LIMIT_EXCEEDED', 'OVERDUE_THRESHOLD', 'MANUAL_HOLD'
  status: 'ACTIVE' | 'RELEASED';
  released_by?: string;
  released_at?: string;
  release_reason?: string;
}

export type CollectionCaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PROMISE_TO_PAY' | 'DISPUTED' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';

export interface CollectionCase extends StandardMetadata {
  case_number: string;
  customer_id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: CollectionCaseStatus;
  assigned_user_id?: string;
  amount_due: string;
  amount_overdue: string;
  next_action_date?: string;
  notes?: string;
}

export interface CollectionActivity extends StandardMetadata {
  case_id: string;
  activity_type: 'CALL' | 'EMAIL' | 'MESSAGE' | 'MEETING' | 'PROMISE_TO_PAY' | 'NOTE' | 'FOLLOW_UP';
  summary: string;
  notes?: string;
  completed_at: string;
  outcome?: string;
}

export interface PromiseToPay extends StandardMetadata {
  customer_id: string;
  receivable_id: string;
  promised_amount: string;
  promised_date: string;
  status: 'PENDING' | 'FULFILLED' | 'BROKEN' | 'CANCELLED';
  notes?: string;
}

export interface DunningPolicy extends StandardMetadata {
  policy_name: string;
  aging_threshold_days: number;
  customer_segment: string;
  action_type: 'EMAIL' | 'SMS' | 'LETTER' | 'CALL';
  delay_days: number;
  template_reference: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DunningEvent extends StandardMetadata {
  customer_id: string;
  receivable_id: string;
  policy_id: string;
  action_taken: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  delivery_status_message?: string;
}

export interface ARDispute extends StandardMetadata {
  customer_id: string;
  receivable_id: string;
  disputed_amount: string;
  reason: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED_FAVOR_CUSTOMER' | 'RESOLVED_FAVOR_COMPANY' | 'CANCELLED';
  assigned_user_id?: string;
  resolution_notes?: string;
}

export interface WriteOffRequest extends StandardMetadata {
  request_number: string;
  customer_id: string;
  receivable_id: string;
  amount: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
}

export interface WriteOff extends StandardMetadata {
  write_off_number: string;
  request_id: string;
  customer_id: string;
  receivable_id: string;
  amount: string;
  journal_entry_id: string | null;
}

export interface ARReconciliationRun extends StandardMetadata {
  run_number: string;
  reconciliation_date: string;
  subledger_total: string;
  gl_total: string;
  difference: string;
  status: 'RECONCILED' | 'EXCEPTION' | 'NOT_RUN';
}

export interface ARReconciliationException extends StandardMetadata {
  run_id: string;
  mismatch_amount: string;
  currency_code: string;
  detected_at: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  notes?: string;
}

// ==========================================
// PHASE 7: GLOBAL PROCUREMENT + ACCOUNTS PAYABLE
// ==========================================

export type PurchaseRequisitionStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CONVERTED';

export interface PurchaseRequisitionLine {
  id: string;
  requisition_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  estimated_unit_price: string;
  line_total: string;
}

export interface PurchaseRequisition extends StandardMetadata {
  requisition_number: string;
  requester_id: string;
  legal_entity_id: string;
  business_unit_id?: string | null;
  branch_id?: string | null;
  required_date: string;
  purpose: string;
  notes?: string;
  status: PurchaseRequisitionStatus;
  approval_decision?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  converted_po_id?: string | null;
  converted_rfq_id?: string | null;
  lines: PurchaseRequisitionLine[];
}

export type RFQStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';

export interface RFQLine {
  id: string;
  rfq_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
}

export interface RFQ extends StandardMetadata {
  rfq_number: string;
  title: string;
  closing_date: string;
  source_requisition_id?: string | null;
  supplier_ids: string[];
  status: RFQStatus;
  notes?: string;
  lines: RFQLine[];
}

export type SupplierQuotationStatus = 'RECEIVED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface SupplierQuotationLine {
  id: string;
  supplier_quotation_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  line_total: string;
}

export interface SupplierQuotation extends StandardMetadata {
  quotation_number: string;
  rfq_id?: string | null;
  vendor_id: string;
  vendor_reference: string;
  currency_code: string;
  validity_date: string;
  delivery_terms?: string;
  payment_terms_id?: string | null;
  status: SupplierQuotationStatus;
  grand_total: string;
  notes?: string;
  lines: SupplierQuotationLine[];
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'PARTIALLY_BILLED'
  | 'BILLED'
  | 'CANCELLED'
  | 'CLOSED';

export interface PurchaseOrderLine {
  id: string;
  po_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_billed: number;
  uom_id: string;
  unit_price: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
}

export interface PurchaseOrder extends StandardMetadata {
  po_number: string;
  vendor_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  warehouse_id?: string | null;
  currency_code: string;
  payment_terms_id?: string | null;
  order_date: string;
  expected_delivery_date?: string | null;
  reference?: string;
  notes?: string;
  status: PurchaseOrderStatus;
  revision_number: number;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  source_requisition_id?: string | null;
  source_quotation_id?: string | null;
  snapshot_data?: {
    vendor_legal_name: string;
    payment_terms_name: string;
    delivery_address: string;
    confirmed_at: string;
  };
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderRevision extends StandardMetadata {
  po_id: string;
  revision_number: number;
  snapshot_json: string;
  amended_by: string;
  amended_at: string;
  change_reason: string;
}

export type GoodsReceiptStatus = 'DRAFT' | 'RECEIVED' | 'PARTIALLY_ACCEPTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface GoodsReceiptLine {
  id: string;
  receipt_id: string;
  tenant_id: string;
  po_line_id: string;
  product_id: string;
  uom_id: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  condition_status: string;
}

export interface GoodsReceipt extends StandardMetadata {
  receipt_number: string;
  po_id: string;
  warehouse_id: string;
  receipt_date: string;
  received_by: string;
  status: GoodsReceiptStatus;
  reference?: string;
  notes?: string;
  lines: GoodsReceiptLine[];
}

export type VendorBillStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MATCHED'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'VOIDED';

export type MatchingStatus = 'MATCHED' | 'PARTIALLY_MATCHED' | 'VARIANCE' | 'BLOCKED' | 'NOT_REQUIRED';

export interface VendorBillLine {
  id: string;
  bill_id: string;
  tenant_id: string;
  po_line_id?: string | null;
  receipt_line_id?: string | null;
  product_id: string;
  sku: string;
  description: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_amount: string;
  tax_classification_code?: string | null;
  tax_rate: string;
  tax_amount: string;
  line_subtotal: string;
  line_total: string;
}

export interface VendorBill extends StandardMetadata {
  bill_number: string;
  vendor_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  currency_code: string;
  exchange_rate: string;
  bill_date: string;
  supplier_invoice_number: string;
  due_date: string;
  payment_terms_id?: string | null;
  source_po_id?: string | null;
  source_receipt_id?: string | null;
  reference?: string;
  status: VendorBillStatus;
  matching_status: MatchingStatus;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  posted_at?: string | null;
  posted_by?: string | null;
  journal_entry_id?: string | null;
  voided_at?: string | null;
  voided_by?: string | null;
  lines: VendorBillLine[];
}

export interface BillMatchingResult extends StandardMetadata {
  bill_id: string;
  po_id?: string | null;
  receipt_id?: string | null;
  match_type: 'TWO_WAY' | 'THREE_WAY';
  status: MatchingStatus;
  computed_at: string;
}

export interface BillMatchingException extends StandardMetadata {
  bill_id: string;
  exception_type: 'QTY_VARIANCE' | 'PRICE_VARIANCE' | 'MISSING_RECEIPT' | 'MISSING_PO' | 'DUPLICATE_INVOICE' | 'AMOUNT_VARIANCE';
  expected_value: string;
  actual_value: string;
  difference: string;
  status: 'OPEN' | 'RESOLVED' | 'WAIVED';
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

export type PayableStatus = 'OPEN' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'OVERDUE' | 'ON_HOLD' | 'WRITTEN_OFF' | 'CANCELLED';

export interface Payable extends StandardMetadata {
  payable_number: string;
  vendor_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  source_type: 'VENDOR_BILL' | 'DEBIT_NOTE' | 'OTHER';
  source_bill_id: string;
  bill_date: string;
  due_date: string;
  currency_code: string;
  original_amount: string;
  allocated_amount: string;
  outstanding_amount: string;
  status: PayableStatus;
  notes?: string;
}

export interface PayableSchedule extends StandardMetadata {
  payable_id: string;
  due_date: string;
  amount: string;
  allocated_amount: string;
  outstanding_amount: string;
  currency_code: string;
  status: 'PENDING' | 'PAID';
}

export type VendorPaymentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'REVERSED'
  | 'CANCELLED'
  | 'FAILED';

export interface VendorPayment extends StandardMetadata {
  payment_number: string;
  vendor_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  payment_date: string;
  currency_code: string;
  amount: string;
  payment_method: string;
  payment_channel: string;
  bank_account_id?: string | null;
  reference: string;
  external_reference?: string;
  status: VendorPaymentStatus;
  unapplied_amount: string;
  journal_entry_id?: string | null;
  notes?: string;
}

export interface VendorPaymentAllocation extends StandardMetadata {
  payment_id: string;
  payable_id: string;
  allocated_amount: string;
  allocation_date: string;
  currency_code: string;
}

export interface VendorPaymentReversal extends StandardMetadata {
  payment_id: string;
  reversal_date: string;
  reason: string;
  journal_entry_id?: string | null;
}

export interface VendorPaymentBatch extends StandardMetadata {
  batch_number: string;
  payment_date: string;
  payment_method: string;
  bank_account_id?: string | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';
  total_amount: string;
  currency_code: string;
  payment_ids: string[];
  notes?: string;
}

export interface VendorCreditNote extends StandardMetadata {
  credit_note_number: string;
  source_bill_id?: string | null;
  vendor_id: string;
  legal_entity_id: string;
  currency_code: string;
  reason: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  status: 'DRAFT' | 'ISSUED' | 'VOIDED';
  journal_entry_id?: string | null;
}

export interface VendorDebitNote extends StandardMetadata {
  debit_note_number: string;
  source_bill_id?: string | null;
  vendor_id: string;
  legal_entity_id: string;
  currency_code: string;
  reason: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  status: 'DRAFT' | 'ISSUED' | 'VOIDED';
  journal_entry_id?: string | null;
}

export interface VendorBankAccount extends StandardMetadata {
  vendor_id: string;
  bank_name: string;
  account_number: string;
  iban_swift?: string;
  routing_code?: string;
  beneficiary_name: string;
  is_primary: boolean;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
}

export interface VendorBankDetailChangeRequest extends StandardMetadata {
  vendor_id: string;
  bank_account_id?: string | null;
  requested_changes: Record<string, string>;
  requested_by: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  notes?: string;
}

export interface VendorHold extends StandardMetadata {
  vendor_id: string;
  reason: string;
  status: 'ACTIVE' | 'RELEASED';
  placed_by: string;
  released_by?: string | null;
  released_at?: string | null;
  release_reason?: string | null;
}

export interface APWriteOffRequest extends StandardMetadata {
  request_number: string;
  vendor_id: string;
  payable_id: string;
  amount: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string | null;
  approved_at?: string | null;
}

export interface APWriteOff extends StandardMetadata {
  write_off_number: string;
  request_id: string;
  vendor_id: string;
  payable_id: string;
  amount: string;
  journal_entry_id?: string | null;
}

export interface APReconciliationRun extends StandardMetadata {
  run_number: string;
  reconciliation_date: string;
  subledger_total: string;
  gl_total: string;
  difference: string;
  status: 'RECONCILED' | 'EXCEPTION' | 'NOT_RUN';
}

export interface APReconciliationException extends StandardMetadata {
  run_id: string;
  mismatch_amount: string;
  currency_code: string;
  detected_at: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  notes?: string;
}

// ==========================================
// PHASE 8: INVENTORY, WAREHOUSE, STOCK LEDGER, COSTING & VALUATION
// ==========================================

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type LocationStatus = 'ACTIVE' | 'BLOCKED' | 'MAINTENANCE' | 'CLOSED';
export type LocationType =
  | 'RECEIVING'
  | 'STORAGE'
  | 'PICKING'
  | 'PACKING'
  | 'SHIPPING'
  | 'QUARANTINE'
  | 'DAMAGED'
  | 'RETURNS'
  | 'TRANSIT'
  | 'OTHER';

export interface WarehouseZone extends StandardMetadata {
  warehouse_id: string;
  zone_code: string;
  zone_name: string;
  zone_type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'MAINTENANCE';
}

export interface WarehouseLocation extends StandardMetadata {
  warehouse_id: string;
  zone_id?: string | null;
  location_code: string; // e.g. A-01-R02-S03-B04
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  location_type: LocationType;
  status: LocationStatus;
  is_default_receiving: boolean;
  is_default_shipping: boolean;
  max_weight_capacity?: number | null;
  max_volume_capacity?: number | null;
}

export type LotStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'QUARANTINED' | 'BLOCKED';

export interface LotBatch extends StandardMetadata {
  legal_entity_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  batch_number: string;
  supplier_id?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  shelf_life_days?: number | null;
  status: LotStatus;
  source_receipt_id?: string | null;
}

export type SerialStatus =
  | 'IN_STOCK'
  | 'ISSUED'
  | 'QUARANTINED'
  | 'DAMAGED'
  | 'IN_TRANSIT'
  | 'RESERVED'
  | 'RETURNED'
  | 'SCRAPPED';

export interface SerialNumber extends StandardMetadata {
  product_id: string;
  variant_id?: string | null;
  sku: string;
  serial_number: string;
  status: SerialStatus;
  current_warehouse_id?: string | null;
  current_location_id?: string | null;
  lot_id?: string | null;
  source_receipt_id?: string | null;
  source_fulfillment_id?: string | null;
  warranty_start_date?: string | null;
  warranty_end_date?: string | null;
}

export type InventoryStatus = 'AVAILABLE' | 'QUARANTINED' | 'DAMAGED' | 'BLOCKED' | 'EXPIRED';

export type MovementType =
  | 'RECEIPT'
  | 'ISSUE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'RESERVATION'
  | 'RELEASE'
  | 'DAMAGE'
  | 'QUARANTINE'
  | 'UNQUARANTINE'
  | 'BLOCK'
  | 'UNBLOCK'
  | 'COUNT_ADJUSTMENT';

export type MovementDirection = 'IN' | 'OUT' | 'NONE';

export type MovementSourceType =
  | 'PURCHASE_ORDER'
  | 'PURCHASE_RECEIPT'
  | 'GOODS_RECEIPT'
  | 'SALES_ORDER'
  | 'SALES_FULFILLMENT'
  | 'SALES_RETURN'
  | 'POS_CHECKOUT'
  | 'POS_RETURN'
  | 'STOCK_TRANSFER'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_COUNT'
  | 'MANUAL';

export interface InventoryMovement extends StandardMetadata {
  movement_id: string;
  legal_entity_id: string;
  warehouse_id: string;
  location_id?: string | null;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  uom_id: string;
  quantity: number;
  direction: MovementDirection;
  movement_type: MovementType;
  source_type: MovementSourceType;
  source_id: string;
  source_line_id?: string | null;
  lot_id?: string | null;
  batch_number?: string | null;
  serial_id?: string | null;
  serial_number?: string | null;
  inventory_status: InventoryStatus;
  movement_date: string;
  posting_date: string;
  cost_reference?: string | null;
  unit_cost: string;
  total_cost: string;
  correlation_id: string;
  journal_entry_id?: string | null;
}

export interface StockBalance {
  id: string;
  tenant_id: string;
  legal_entity_id: string;
  warehouse_id: string;
  location_id?: string | null;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  uom_id: string;
  lot_id?: string | null;
  inventory_status: InventoryStatus;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  in_transit_quantity: number;
  quarantined_quantity: number;
  damaged_quantity: number;
  blocked_quantity: number;
  unit_cost_average: string;
  total_valuation: string;
  last_movement_at: string;
  updated_at: string;
}

export type StockReservationStatus =
  | 'REQUESTED'
  | 'RESERVED'
  | 'PARTIALLY_RESERVED'
  | 'RELEASED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface StockReservation extends StandardMetadata {
  reservation_number: string;
  legal_entity_id: string;
  source_type: 'SALES_ORDER' | 'TRANSFER' | 'MANUAL';
  source_id: string;
  source_line_id?: string | null;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  warehouse_id: string;
  location_id?: string | null;
  lot_id?: string | null;
  quantity_requested: number;
  quantity_reserved: number;
  quantity_fulfilled: number;
  uom_id: string;
  reservation_date: string;
  expiry_date?: string | null;
  status: StockReservationStatus;
  notes?: string;
}

export type StockTransferStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface StockTransferLine {
  id: string;
  transfer_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  uom_id: string;
  quantity_requested: number;
  quantity_shipped: number;
  quantity_received: number;
  source_location_id?: string | null;
  destination_location_id?: string | null;
  lot_id?: string | null;
  serial_numbers?: string[];
}

export interface StockTransfer extends StandardMetadata {
  transfer_number: string;
  source_legal_entity_id: string;
  destination_legal_entity_id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  transfer_date: string;
  shipped_at?: string | null;
  received_at?: string | null;
  status: StockTransferStatus;
  carrier?: string | null;
  tracking_number?: string | null;
  notes?: string;
  lines: StockTransferLine[];
}

export type StockAdjustmentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED';

export interface StockAdjustmentLine {
  id: string;
  adjustment_id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  location_id?: string | null;
  lot_id?: string | null;
  serial_id?: string | null;
  quantity: number;
  uom_id: string;
  adjustment_type: 'INCREASE' | 'DECREASE';
  unit_cost: string;
  line_total_cost: string;
  notes?: string;
}

export interface StockAdjustment extends StandardMetadata {
  adjustment_number: string;
  legal_entity_id: string;
  warehouse_id: string;
  adjustment_date: string;
  reason_code: string;
  reason_description: string;
  status: StockAdjustmentStatus;
  total_adjustment_value: string;
  approved_by?: string | null;
  approved_at?: string | null;
  journal_entry_id?: string | null;
  lines: StockAdjustmentLine[];
}

export type StockCountStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REVIEW'
  | 'APPROVED'
  | 'POSTED'
  | 'CANCELLED';

export interface StockCountLine {
  id: string;
  count_id: string;
  tenant_id: string;
  location_id?: string | null;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  lot_id?: string | null;
  expected_quantity: number;
  counted_quantity: number;
  variance_quantity: number;
  variance_percentage: string;
  unit_cost: string;
  variance_value: string;
  status: 'PENDING' | 'VERIFIED' | 'ADJUSTED';
}

export interface StockCount extends StandardMetadata {
  count_number: string;
  legal_entity_id: string;
  warehouse_id: string;
  count_name: string;
  count_type: 'FULL' | 'CYCLE' | 'LOCATION_SPECIFIC' | 'PRODUCT_SPECIFIC';
  is_blind_mode: boolean;
  scheduled_date: string;
  counted_by?: string | null;
  approved_by?: string | null;
  status: StockCountStatus;
  notes?: string;
  lines: StockCountLine[];
}

export type CostingMethod = 'FIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST' | 'SPECIFIC_IDENTIFICATION';

export interface InventoryCostLayer extends StandardMetadata {
  legal_entity_id: string;
  warehouse_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  lot_id?: string | null;
  receipt_movement_id: string;
  receipt_date: string;
  original_quantity: number;
  remaining_quantity: number;
  unit_cost: string;
  remaining_value: string;
  is_exhausted: boolean;
}

export interface InventoryCostTransaction extends StandardMetadata {
  movement_id: string;
  legal_entity_id: string;
  product_id: string;
  sku: string;
  transaction_type:
    | 'RECEIPT_COST'
    | 'COGS_ISSUE'
    | 'TRANSFER_COST'
    | 'ADJUSTMENT_COST'
    | 'LANDED_COST_ALLOCATION';
  quantity: number;
  unit_cost: string;
  total_cost: string;
  costing_method: CostingMethod;
  cost_layer_ids: string[];
  journal_entry_id?: string | null;
}

export interface LandedCostAllocation {
  id: string;
  landed_cost_id: string;
  receipt_id: string;
  receipt_line_id: string;
  product_id: string;
  allocated_amount: string;
  cost_per_unit: string;
}

export type LandedCostAllocationBasis = 'QUANTITY' | 'VALUE' | 'WEIGHT' | 'VOLUME' | 'MANUAL';

export interface LandedCostDocument extends StandardMetadata {
  document_number: string;
  legal_entity_id: string;
  vendor_id: string;
  bill_id?: string | null;
  cost_type: 'FREIGHT' | 'CUSTOMS_DUTY' | 'INSURANCE' | 'PORT_HANDLING' | 'OTHER';
  total_amount: string;
  currency_code: string;
  allocation_basis: LandedCostAllocationBasis;
  status: 'DRAFT' | 'ALLOCATED' | 'POSTED' | 'CANCELLED';
  goods_receipt_ids: string[];
  allocations: LandedCostAllocation[];
}

export interface InventoryReconciliationException extends StandardMetadata {
  run_id: string;
  product_id: string;
  sku: string;
  location_id?: string | null;
  subledger_qty: number;
  subledger_val: string;
  gl_val: string;
  difference: string;
  mismatch_reason: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
}

export interface InventoryReconciliationRun extends StandardMetadata {
  run_number: string;
  legal_entity_id: string;
  warehouse_id?: string | null;
  reconciliation_date: string;
  subledger_valuation_total: string;
  gl_inventory_account_total: string;
  variance_amount: string;
  currency_code: string;
  status: 'RECONCILED' | 'EXCEPTION' | 'IN_PROGRESS';
  exceptions: InventoryReconciliationException[];
}

export interface InventoryPeriodControl extends StandardMetadata {
  legal_entity_id: string;
  fiscal_period_id: string;
  status: 'OPEN' | 'CLOSING_IN_PROGRESS' | 'CLOSED';
  negative_stock_checked: boolean;
  unposted_movements_count: number;
  unreconciled_exceptions_count: number;
  closed_at?: string | null;
  closed_by?: string | null;
}

export type NegativeStockPolicy = 'ALLOW_NEGATIVE' | 'BLOCK_NEGATIVE' | 'ALLOW_WITH_APPROVAL';

export interface InventoryPolicySettings {
  negative_stock_policy: NegativeStockPolicy;
  default_costing_method: CostingMethod;
  enforce_location_tracking: boolean;
  enforce_lot_tracking_on_expiry: boolean;
  require_adjustment_approval_above_amount: string;
}

// ============================================================
// PHASE 9: GLOBAL POS + OMNICHANNEL SALES EXECUTION TYPES
// ============================================================

export type POSTerminalStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type POSSessionStatus = 'OPEN' | 'CLOSING' | 'CLOSED' | 'SUSPENDED';
export type CashSessionStatus = 'OPEN' | 'CLOSED';
export type CashMovementType = 'OPENING_FLOAT' | 'SALE' | 'REFUND' | 'PAID_IN' | 'PAID_OUT' | 'ADJUSTMENT' | 'CLOSING_COUNT';
export type POSCartStatus = 'OPEN' | 'HELD' | 'CHECKOUT' | 'COMPLETED' | 'CANCELLED';
export type POSTransactionType = 'SALE' | 'RETURN' | 'EXCHANGE';
export type POSTransactionStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'VOIDED';
export type POSPaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'STORE_CREDIT' | 'CUSTOMER_ACCOUNT';
export type POSPaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type ReturnCondition = 'RESELLABLE' | 'DAMAGED' | 'DEFECTIVE' | 'QUARANTINE';
export type OfflineCommandStatus = 'LOCAL_PENDING' | 'SYNCED' | 'CONFLICT' | 'REJECTED';
export type ConflictResolutionPolicy = 'REJECT' | 'ACCEPT_WITH_NEGATIVE_STOCK' | 'MANUAL_REVIEW';

export interface POSTerminalHardwareConfig {
  receipt_printer_enabled: boolean;
  receipt_printer_type?: 'THERMAL' | 'A4' | 'NETWORK' | 'USB';
  barcode_scanner_enabled: boolean;
  payment_terminal_integration?: 'MANUAL' | 'INTEGRATED';
}

export interface POSTerminal extends StandardMetadata {
  legal_entity_id: string;
  branch_id: string;
  warehouse_id: string;
  terminal_code: string;
  terminal_name: string;
  status: POSTerminalStatus;
  default_price_list_id?: string | null;
  default_customer_id?: string | null;
  hardware_config: POSTerminalHardwareConfig;
  current_session_id?: string | null;
}

export interface POSSession extends StandardMetadata {
  legal_entity_id: string;
  branch_id: string;
  warehouse_id: string;
  terminal_id: string;
  cashier_id: string;
  status: POSSessionStatus;
  opened_at: string;
  closed_at?: string | null;
  opening_float: string;
  expected_cash: string;
  counted_cash?: string | null;
  cash_variance?: string | null;
  total_sales_count: number;
  total_sales_amount: string;
  total_refunds_count: number;
  total_refunds_amount: string;
  total_discount_amount: string;
  total_tax_amount: string;
  opening_notes?: string | null;
  closing_notes?: string | null;
}

export interface CashDrawer extends StandardMetadata {
  branch_id: string;
  terminal_id: string;
  drawer_name: string;
  current_balance: string;
  currency_code: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
}

export interface CashSession extends StandardMetadata {
  branch_id: string;
  terminal_id: string;
  pos_session_id: string;
  cashier_id: string;
  status: CashSessionStatus;
  opened_at: string;
  closed_at?: string | null;
  opening_float: string;
  expected_cash: string;
  closing_counted?: string | null;
  cash_variance?: string | null;
}

export interface CashMovement extends StandardMetadata {
  branch_id: string;
  terminal_id: string;
  pos_session_id: string;
  cash_session_id?: string | null;
  cashier_id: string;
  movement_type: CashMovementType;
  amount: string;
  currency_code: string;
  reason?: string | null;
  reference_id?: string | null;
}

export interface POSCartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  lot_id?: string | null;
  serial_number?: string | null;
  notes?: string | null;
}

export interface POSCart extends StandardMetadata {
  legal_entity_id: string;
  branch_id: string;
  warehouse_id: string;
  terminal_id: string;
  session_id: string;
  cashier_id: string;
  customer_id?: string | null;
  cart_status: POSCartStatus;
  currency_code: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  items: POSCartItem[];
  held_at?: string | null;
  held_reason?: string | null;
  held_reference?: string | null;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  variant_id?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  quantity: number;
  uom_id: string;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  lot_id?: string | null;
  serial_number?: string | null;
  unit_cost?: string | null;
  cogs_amount?: string | null;
}

export interface POSPaymentLine {
  id: string;
  transaction_id: string;
  payment_id?: string | null;
  payment_method: POSPaymentMethod;
  amount: string;
  currency_code: string;
  tendered_amount?: string | null;
  change_returned?: string | null;
  reference_number?: string | null;
  terminal_auth_code?: string | null;
  status: POSPaymentStatus;
  created_at: string;
}

export interface POSTransaction extends StandardMetadata {
  legal_entity_id: string;
  branch_id: string;
  warehouse_id: string;
  terminal_id: string;
  session_id: string;
  cashier_id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  transaction_number: string;
  transaction_type: POSTransactionType;
  status: POSTransactionStatus;
  sales_order_id?: string | null;
  invoice_id?: string | null;
  currency_code: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  amount_paid: string;
  change_due: string;
  payment_status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  lines: POSTransactionItem[];
  payments: POSPaymentLine[];
  receipt_number: string;
  printed_at?: string | null;
  notes?: string | null;
  idempotency_key?: string | null;
}

export interface POSReceipt extends StandardMetadata {
  legal_entity_id: string;
  branch_id: string;
  terminal_id: string;
  transaction_id: string;
  receipt_number: string;
  format: 'DIGITAL' | 'THERMAL' | 'A4';
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  subtotal: string;
  tax_breakdown: Record<string, string>;
  grand_total: string;
  payments_summary: string;
  receipt_body: string;
  printed: boolean;
  emailed: boolean;
  sms_sent: boolean;
}

export interface POSReturnLine {
  id: string;
  return_id: string;
  original_line_id: string;
  product_id: string;
  sku: string;
  name: string;
  quantity_returned: number;
  unit_price: string;
  tax_refund_amount: string;
  line_refund_total: string;
  lot_id?: string | null;
  serial_number?: string | null;
  condition: ReturnCondition;
  notes?: string | null;
}

export interface POSReturn extends StandardMetadata {
  legal_entity_id: string;
  branch_id: string;
  warehouse_id: string;
  terminal_id: string;
  session_id: string;
  cashier_id: string;
  return_number: string;
  original_transaction_id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  return_reason: string;
  condition: ReturnCondition;
  target_inventory_status: 'AVAILABLE' | 'DAMAGED' | 'QUARANTINED';
  refund_total: string;
  refund_method: POSPaymentMethod;
  status: 'COMPLETED' | 'CANCELLED';
  lines: POSReturnLine[];
  refund_id?: string | null;
  journal_entry_id?: string | null;
}

export interface OfflineDevice extends StandardMetadata {
  branch_id: string;
  terminal_id: string;
  device_identifier: string;
  device_name: string;
  platform: string;
  app_version: string;
  last_sync_at?: string | null;
  status: 'REGISTERED' | 'BLOCKED' | 'PENDING_APPROVAL';
  registered_at: string;
}

export interface OfflineCommand extends StandardMetadata {
  device_id: string;
  sequence_number: number;
  idempotency_key: string;
  command_type: 'CREATE_SALE' | 'CASH_MOVEMENT' | 'OPEN_SESSION' | 'CLOSE_SESSION';
  payload: any;
  status: OfflineCommandStatus;
  conflict_details?: string | null;
  server_acknowledged_at?: string | null;
  error_message?: string | null;
}

export interface SyncConflict extends StandardMetadata {
  device_id: string;
  command_id: string;
  conflict_type: 'STOCK_UNAVAILABLE' | 'PRICE_MISMATCH' | 'SESSION_CLOSED' | 'DUPLICATE_TRANSACTION';
  details: string;
  resolution_policy: ConflictResolutionPolicy;
  status: 'OPEN' | 'RESOLVED';
  resolved_by?: string | null;
  resolved_at?: string | null;
}

export interface SalesReconciliationException {
  id: string;
  tenant_id: string;
  run_id: string;
  exception_type: 'SALES_MISMATCH' | 'PAYMENT_MISMATCH' | 'COGS_GL_MISMATCH' | 'INVENTORY_ISSUE_MISMATCH' | 'CASH_VARIANCE';
  expected_amount: string;
  actual_amount: string;
  difference: string;
  details: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
}

export interface SalesReconciliationRun extends StandardMetadata {
  legal_entity_id: string;
  branch_id?: string | null;
  terminal_id?: string | null;
  pos_session_id?: string | null;
  reconciliation_date: string;
  pos_sales_total: string;
  sales_order_domain_total: string;
  payment_collection_total: string;
  inventory_issue_cost_total: string;
  cogs_gl_total: string;
  gl_sales_revenue_total: string;
  variance_sales: string;
  variance_payments: string;
  variance_cogs: string;
  status: 'RECONCILED' | 'EXCEPTION';
  exceptions: SalesReconciliationException[];
}

// ============================================================
// PHASE 10: GLOBAL TAX ENGINE & COMPLIANCE FOUNDATION TYPES
// ============================================================

export type CountryTaxComplianceStatus =
  | 'ARCHITECTURE_READY'
  | 'CONFIGURED'
  | 'TESTED'
  | 'PRODUCTION_READY'
  | 'NOT_CONFIGURED'
  | 'UNDER_REVIEW';

export interface TaxCountryConfig {
  country_code: string; // ISO 3166-1 alpha-2 (e.g. US, IN, GB, DE, SG, AE, JP)
  country_name: string;
  iso_currency_code: string;
  locale: string;
  timezone: string;
  tax_compliance_status: CountryTaxComplianceStatus;
  e_invoicing_required: boolean;
  digital_reporting_required: boolean;
  hierarchy_levels: Array<'COUNTRY' | 'REGION' | 'STATE_PROVINCE' | 'COUNTY_DISTRICT' | 'CITY_LOCAL' | 'SPECIAL_ECONOMIC_ZONE'>;
  default_regime_codes: string[];
  notes?: string;
}

export type JurisdictionLevel =
  | 'COUNTRY'
  | 'REGION'
  | 'STATE_PROVINCE'
  | 'COUNTY_DISTRICT'
  | 'CITY_LOCAL'
  | 'SPECIAL_ECONOMIC_ZONE';

export interface TaxJurisdiction extends StandardMetadata {
  country_code: string;
  jurisdiction_code: string; // e.g. 'US-CA', 'IN-MH', 'GB-ENG'
  jurisdiction_name: string;
  level: JurisdictionLevel;
  parent_jurisdiction_id?: string | null;
  geographic_identifier: string; // e.g. ISO-3166-2 code, UN/LOCODE, FIPS
  status: 'ACTIVE' | 'INACTIVE';
}

export type TaxAuthorityType =
  | 'NATIONAL'
  | 'FEDERAL'
  | 'STATE_PROVINCIAL'
  | 'MUNICIPAL_LOCAL'
  | 'CUSTOMS_EXCISE';

export interface TaxAuthority extends StandardMetadata {
  jurisdiction_id: string;
  authority_code: string; // e.g. 'IRS', 'HMRC', 'GSTN', 'FTA'
  authority_name: string;
  authority_type: TaxAuthorityType;
  registration_prefix?: string | null;
  electronic_filing_enabled: boolean;
  filing_frequencies: Array<'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'BI_MONTHLY'>;
  effective_from: string;
  effective_to?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export type RegistrationValidationStatus =
  | 'VALID'
  | 'INVALID'
  | 'PENDING'
  | 'NOT_CONFIGURED'
  | 'UNAVAILABLE';

export interface GlobalTaxRegistration extends StandardMetadata {
  legal_entity_id: string;
  tax_authority_id: string;
  jurisdiction_id: string;
  registration_number: string;
  registration_type: string; // 'VAT', 'GST', 'SALES_TAX', 'TIN', 'EIN'
  effective_from: string;
  effective_to?: string | null;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED';
  validation_status: RegistrationValidationStatus;
  validated_at?: string | null;
  validation_provider?: string | null;
  validation_reference?: string | null;
}

export interface TaxRegime extends StandardMetadata {
  country_code: string;
  regime_code: string; // e.g. 'VAT', 'GST', 'SALES_TAX', 'CONSUMPTION_TAX', 'EXCISE', 'WITHHOLDING'
  regime_name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type TaxTypeCode =
  | 'OUTPUT_TAX'
  | 'INPUT_TAX'
  | 'WITHHOLDING_TAX'
  | 'REVERSE_CHARGE'
  | 'LOCAL_TAX'
  | 'EXCISE_TAX';

export interface TaxType extends StandardMetadata {
  regime_id: string;
  type_code: TaxTypeCode;
  type_name: string;
  is_recoverable: boolean;
  description: string;
}

export type TaxCategoryCode =
  | 'STANDARD'
  | 'REDUCED'
  | 'ZERO_RATED'
  | 'EXEMPT'
  | 'OUT_OF_SCOPE'
  | 'CUSTOM';

export interface TaxCategoryMaster extends StandardMetadata {
  category_code: TaxCategoryCode;
  category_name: string;
  description: string;
  is_taxable: boolean;
}

export interface TaxCodeMaster extends StandardMetadata {
  regime_id: string;
  tax_type_id: string;
  jurisdiction_id: string;
  code: string; // e.g. 'VAT-STD-20', 'GST-18', 'US-CA-ST-7.25'
  name: string;
  tax_category_id: string;
  liability_account_id?: string | null; // Phase 4 GL Account ID for Output Tax
  recoverable_account_id?: string | null; // Phase 4 GL Account ID for Input Tax
  expense_account_id?: string | null;
  effective_from: string;
  effective_to?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export type TaxRateType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'PER_UNIT'
  | 'TIERED'
  | 'COMPOUND';

export type TaxRoundingPolicy = 'HALF_UP' | 'HALF_EVEN' | 'CEILING' | 'FLOOR';

export interface TaxRateMaster extends StandardMetadata {
  tax_code_id: string;
  jurisdiction_id: string;
  rate_type: TaxRateType;
  rate_value: string; // e.g. '0.1800' for 18% or '5.00' for $5/unit
  unit_of_measure?: string | null;
  compound_priority?: number | null; // If 2, applies on (Base + Rate1_Tax)
  rounding_policy: TaxRoundingPolicy;
  rounding_precision: number; // e.g. 2 or 4
  effective_from: string;
  effective_to?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export type PlaceOfSupplyType =
  | 'ORIGIN_BASED'
  | 'DESTINATION_BASED'
  | 'SERVICE_PERFORMANCE'
  | 'DIGITAL_DELIVERY'
  | 'IMPORT_PORT';

export type TaxRuleApprovalStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'RETIRED';

export interface TaxRuleMaster extends StandardMetadata {
  rule_code: string;
  name: string;
  regime_id: string;
  seller_jurisdiction_id?: string | null;
  buyer_jurisdiction_id?: string | null;
  place_of_supply_type: PlaceOfSupplyType;
  tax_category_id?: string | null;
  customer_classification: 'B2B' | 'B2C' | 'GOVERNMENT' | 'NON_PROFIT' | 'ALL';
  vendor_classification: 'REGISTERED' | 'UNREGISTERED' | 'IMPORT' | 'ALL';
  transaction_type: 'SALES' | 'PURCHASE' | 'POS' | 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ALL';
  min_threshold_amount?: string | null;
  max_threshold_amount?: string | null;
  is_reverse_charge: boolean;
  is_withholding: boolean;
  tax_code_ids: string[]; // references TaxCodeMaster
  priority: number;
  version: number;
  approval_status: TaxRuleApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  effective_from: string;
  effective_to?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TaxExemptionRecord extends StandardMetadata {
  customer_id?: string | null;
  vendor_id?: string | null;
  product_id?: string | null;
  jurisdiction_id?: string | null;
  tax_code_id?: string | null;
  certificate_number: string;
  exemption_reason: string;
  effective_from: string;
  effective_to: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface TaxOverrideRecord extends StandardMetadata {
  document_type: 'INVOICE' | 'SALES_ORDER' | 'POS_SALE' | 'VENDOR_BILL' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  document_id: string;
  document_line_id?: string | null;
  original_tax_amount: string;
  override_tax_amount: string;
  difference: string;
  reason: string;
  authorized_actor_id: string;
  approval_status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

// ------------------------------------------------------------
// Tax Determination & Calculation Interfaces
// ------------------------------------------------------------

export interface TaxContextLine {
  line_id: string;
  product_id?: string | null;
  sku?: string | null;
  name?: string | null;
  tax_category_id?: string | null;
  tax_code_id?: string | null; // explicit override or assigned
  quantity: string | number;
  unit_price: string;
  discount_amount?: string;
  line_amount: string;
  uom?: string | null;
  is_exempt?: boolean;
  exemption_certificate?: string | null;
}

export interface TaxContext {
  tenant_id: string;
  legal_entity_id: string;
  branch_id?: string | null;
  transaction_date: string;
  supply_date?: string | null;
  currency_code: string;
  transaction_type: 'SALES' | 'PURCHASE' | 'POS' | 'IMPORT' | 'EXPORT';
  seller_country_code: string;
  seller_jurisdiction_code?: string;
  seller_address?: Address;
  buyer_country_code: string;
  buyer_jurisdiction_code?: string;
  buyer_address?: Address;
  customer_id?: string | null;
  vendor_id?: string | null;
  customer_classification?: 'B2B' | 'B2C' | 'GOVERNMENT' | 'NON_PROFIT';
  vendor_classification?: 'REGISTERED' | 'UNREGISTERED' | 'IMPORT';
  customer_tax_registration?: string | null;
  vendor_tax_registration?: string | null;
  lines: TaxContextLine[];
}

export type TaxErrorCode =
  | 'TAX_CONFIGURATION_MISSING'
  | 'TAX_RULE_NOT_FOUND'
  | 'TAX_REGISTRATION_REQUIRED'
  | 'TAX_REGISTRATION_INVALID'
  | 'TAX_RATE_UNAVAILABLE'
  | 'TAX_JURISDICTION_UNRESOLVED'
  | 'TAX_EXEMPTION_INVALID'
  | 'TAX_PROVIDER_UNAVAILABLE'
  | 'TAX_CALCULATION_FAILED';

export interface TaxLineResult {
  line_id: string;
  tax_code_id: string;
  tax_code: string;
  tax_type: TaxTypeCode;
  regime_code: string;
  jurisdiction_id: string;
  jurisdiction_name: string;
  rate_type: TaxRateType;
  rate_value: string;
  rate_percentage_display: string;
  taxable_base: string;
  tax_amount: string;
  is_reverse_charge: boolean;
  is_withholding: boolean;
  is_exempt: boolean;
  exemption_reason?: string | null;
  rule_id: string;
  rule_code: string;
  rule_version: number;
  compound_priority?: number | null;
}

export interface TaxDocumentSnapshot {
  id: string;
  tenant_id: string;
  document_type: string;
  document_id: string;
  snapshot_number: string;
  calculated_at: string;
  currency_code: string;
  rule_versions: Record<string, number>;
  total_taxable_amount: string;
  total_tax_amount: string;
  total_output_tax: string;
  total_input_tax: string;
  total_reverse_charge: string;
  total_withholding: string;
  lines: TaxLineResult[];
  tax_breakdown_by_code: Record<string, { code: string; rate: string; taxable_base: string; tax_amount: string }>;
  tax_registration_references: {
    legal_entity_registration?: string | null;
    counterparty_registration?: string | null;
  };
  immutable_hash: string;
}

export interface TaxCalculationResult {
  success: boolean;
  error_code?: TaxErrorCode | null;
  error_message?: string | null;
  currency_code: string;
  total_taxable_base: string;
  total_tax_amount: string;
  total_output_tax: string;
  total_input_tax: string;
  total_reverse_charge_tax: string;
  total_withholding_tax: string;
  lines: TaxLineResult[];
  tax_breakdown_by_code: Record<string, { code: string; name: string; rate: string; taxable_base: string; tax_amount: string; jurisdiction: string }>;
  determination_trace: {
    seller_jurisdiction: string;
    buyer_jurisdiction: string;
    place_of_supply: string;
    rules_matched: Array<{ line_id: string; rule_id: string; rule_code: string; rule_version: number; tax_code: string; rate: string; reason: string }>;
    timestamp: string;
  };
  snapshot?: TaxDocumentSnapshot;
}

// ------------------------------------------------------------
// Tax Periods & Returns Foundation
// ------------------------------------------------------------

export interface TaxPeriodRecord extends StandardMetadata {
  legal_entity_id: string;
  jurisdiction_id: string;
  tax_authority_id: string;
  period_code: string; // e.g. '2026-M08', '2026-Q3'
  period_name: string;
  start_date: string;
  end_date: string;
  filing_deadline: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  filing_status: 'NOT_STARTED' | 'IN_PREPARATION' | 'FILED' | 'ACCEPTED' | 'OVERDUE';
}

export type TaxReturnStatus =
  | 'OPEN'
  | 'IN_PREPARATION'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AMENDED'
  | 'CANCELLED';

export interface TaxReturnLine {
  id: string;
  box_code: string; // Box/Line on official return e.g. 'BOX_1', 'LINE_4A'
  description: string;
  tax_code_ids: string[];
  taxable_amount: string;
  tax_amount: string;
}

export interface TaxReturnRecord extends StandardMetadata {
  legal_entity_id: string;
  tax_period_id: string;
  jurisdiction_id: string;
  tax_authority_id: string;
  return_number: string;
  return_type: 'VAT_RETURN' | 'GST_RETURN' | 'SALES_TAX_RETURN' | 'WITHHOLDING_RETURN';
  status: TaxReturnStatus;
  prepared_by?: string | null;
  prepared_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  submitted_by?: string | null;
  submitted_at?: string | null;
  submission_reference?: string | null;
  external_provider_id?: string | null;
  total_taxable_sales: string;
  total_output_tax: string;
  total_taxable_purchases: string;
  total_input_tax: string;
  total_adjustments: string;
  net_tax_payable_or_refundable: string;
  lines: TaxReturnLine[];
  filing_payload_hash?: string | null;
  acknowledgement_details?: string | null;
}

export interface TaxAdjustmentRecord extends StandardMetadata {
  legal_entity_id: string;
  tax_period_id: string;
  adjustment_number: string;
  tax_code_id: string;
  amount: string;
  direction: 'ADDITION' | 'DEDUCTION';
  reason: string;
  accounting_journal_id?: string | null;
  status: 'DRAFT' | 'APPROVED' | 'POSTED';
  created_by: string;
  approved_by?: string | null;
}

export interface TaxReconciliationException {
  id: string;
  tenant_id: string;
  run_id: string;
  exception_type: 'OUTPUT_TAX_MISMATCH' | 'INPUT_TAX_MISMATCH' | 'UNMAPPED_TAX_CODE' | 'PERIOD_POSTING_LEAK';
  expected_amount: string;
  actual_amount: string;
  difference: string;
  details: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
}

export interface TaxReconciliationRun extends StandardMetadata {
  legal_entity_id: string;
  tax_period_id: string;
  run_number: string;
  reconciliation_date: string;
  tax_subledger_output_total: string;
  tax_subledger_input_total: string;
  gl_tax_liability_total: string;
  gl_tax_recoverable_total: string;
  variance_output: string;
  variance_input: string;
  status: 'RECONCILED' | 'EXCEPTION';
  exceptions: TaxReconciliationException[];
}

// ------------------------------------------------------------
// E-Invoicing & External Compliance Provider Foundation
// ------------------------------------------------------------

export type EInvoiceStatus =
  | 'NOT_REQUIRED'
  | 'READY'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED';

export interface EInvoiceDocument extends StandardMetadata {
  legal_entity_id: string;
  source_document_type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'POS_RECEIPT';
  source_document_id: string;
  source_document_number: string;
  einvoice_number: string;
  irn?: string | null; // Invoice Reference Number
  signed_qr_code?: string | null;
  status: EInvoiceStatus;
  provider_name: string;
  payload_hash: string;
  immutable_payload: string;
  submitted_at?: string | null;
  completed_at?: string | null;
}

export interface EInvoiceSubmissionRecord extends StandardMetadata {
  einvoice_document_id: string;
  idempotency_key: string;
  provider_name: string;
  submitted_payload: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'FAILED';
  provider_ack_number?: string | null;
  provider_response_code?: string | null;
  provider_response_message?: string | null;
  attempt_count: number;
}

export interface ComplianceCertificateRecord extends StandardMetadata {
  legal_entity_id: string;
  jurisdiction_id: string;
  certificate_name: string;
  certificate_type: 'DIGITAL_SIGNATURE' | 'E_INVOICING_AUTH' | 'TAX_EXEMPTION' | 'SEAL';
  issuer: string;
  serial_number: string;
  fingerprint_sha256: string;
  valid_from: string;
  valid_to: string;
  key_reference: string; // Identifier reference only, NO raw secrets in code
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  rotation_warning_days: number;
}

export interface TaxAuditTrailRecord {
  id: string;
  tenant_id: string;
  transaction_id: string;
  document_type: string;
  rule_version_id?: string | null;
  tax_code_id?: string | null;
  rate_applied?: string | null;
  taxable_base?: string | null;
  tax_amount?: string | null;
  actor_id: string;
  action_type: string;
  explanation_json: string;
  created_at: string;
}

// ------------------------------------------------------------
// Phase 11: Global Fiscal Document & E-Invoicing Execution Domain
// ------------------------------------------------------------

export type FiscalDocumentType =
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'RECEIPT'
  | 'SELF_BILLING'
  | 'PURCHASE_DOCUMENT'
  | 'TAX_ADJUSTMENT';

export type FiscalOriginChannel = 'POS' | 'WEB' | 'MOBILE' | 'B2B' | 'API' | 'MANUAL';

export type FiscalDocumentStatus =
  | 'DRAFT'
  | 'READY'
  | 'VALIDATING'
  | 'VALIDATION_FAILED'
  | 'FINALIZED'
  | 'QUEUED'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'AMENDMENT_REQUIRED'
  | 'FAILED'
  | 'MANUAL_REVIEW'
  | 'LOCAL_PENDING';

export interface FiscalSeriesRecord extends StandardMetadata {
  legal_entity_id: string;
  branch_id?: string | null;
  jurisdiction_id: string;
  series_code: string;
  document_type: FiscalDocumentType;
  prefix: string;
  current_sequence: number;
  min_sequence: number;
  max_sequence: number;
  effective_from: string;
  effective_to?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXHAUSTED';
}

export interface FiscalSnapshotLine {
  line_number: number;
  item_id?: string;
  item_code?: string;
  description: string;
  quantity: string;
  uom?: string;
  unit_price: string;
  discount_amount: string;
  taxable_amount: string;
  tax_code_id: string;
  tax_code: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
}

export interface FiscalDocumentSnapshot {
  document_id: string;
  document_number: string;
  document_type: FiscalDocumentType;
  issue_date: string;
  currency_code: string;
  exchange_rate: string;
  seller: {
    legal_name: string;
    trade_name?: string;
    tax_registration_number: string;
    tax_registration_type?: string;
    address: Address;
  };
  buyer: {
    legal_name: string;
    trade_name?: string;
    tax_registration_number?: string;
    tax_registration_type?: string;
    customer_type?: 'B2B' | 'B2C' | 'GOVERNMENT' | 'NON_PROFIT';
    address: Address;
  };
  lines: FiscalSnapshotLine[];
  subtotal: string;
  discount_total: string;
  taxable_total: string;
  tax_total: string;
  grand_total: string;
  tax_breakdowns: {
    tax_code_id: string;
    tax_code: string;
    tax_rate: string;
    taxable_amount: string;
    tax_amount: string;
  }[];
  tax_snapshot_reference_id?: string;
  rule_version_ids?: string[];
  payment_terms?: string;
  payment_method?: string;
  original_document_reference?: {
    document_id: string;
    document_number: string;
    issue_date: string;
    reason?: string;
  };
  metadata?: Record<string, any>;
}

export interface FiscalDocumentRecord extends StandardMetadata {
  legal_entity_id: string;
  branch_id?: string | null;
  source_document_type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'POS_RECEIPT' | 'VENDOR_BILL' | 'MANUAL';
  source_document_id: string;
  source_document_number: string;
  fiscal_document_type: FiscalDocumentType;
  fiscal_series_id: string;
  document_number: string;
  sequence_number: number;
  jurisdiction_id: string;
  country_code: string;
  tax_regime_code: string;
  issue_date: string;
  currency_code: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  status: FiscalDocumentStatus;
  origin_channel: FiscalOriginChannel;
  document_hash: string; // SHA-256 deterministic hash
  irn?: string | null; // Invoice Reference Number
  qr_code_payload?: string | null;
  signature_reference_id?: string | null;
  snapshot: FiscalDocumentSnapshot;
  schema_id?: string;
  schema_version?: string;
  compliance_profile_id?: string;
  rejection_reason?: string | null;
  finalized_at?: string | null;
  submitted_at?: string | null;
  accepted_at?: string | null;
}

export type ComplianceEnvironment = 'SANDBOX' | 'TEST' | 'PRODUCTION';
export type ComplianceProviderType =
  | 'GOVERNMENT_DIRECT'
  | 'CERTIFIED_INTERMEDIARY'
  | 'PEPPOL_ACCESS_POINT'
  | 'CLEARANCE_GATEWAY'
  | 'TRUST_SERVICE_PROVIDER';

export interface ComplianceProviderConfigRecord extends StandardMetadata {
  legal_entity_id: string;
  country_code: string;
  jurisdiction_id?: string;
  provider_name: string;
  provider_type: ComplianceProviderType;
  environment: ComplianceEnvironment;
  endpoint_url: string;
  credential_key_reference: string; // Vault / secret manager key ID only
  certificate_id?: string | null;
  rate_limit_per_minute: number;
  timeout_ms: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface ComplianceSubmissionAttemptRecord {
  id: string;
  tenant_id: string;
  submission_id: string;
  fiscal_document_id: string;
  attempt_number: number;
  provider_name: string;
  environment: ComplianceEnvironment;
  request_reference: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  status: 'SUCCESS' | 'REJECTED' | 'TRANSIENT_ERROR' | 'FATAL_ERROR';
  http_status_code?: number;
  error_code?: string | null;
  error_message?: string | null;
  response_reference?: string | null;
  payload_hash: string;
}

export interface ComplianceSubmissionRecord extends StandardMetadata {
  legal_entity_id: string;
  fiscal_document_id: string;
  provider_config_id: string;
  provider_name: string;
  environment: ComplianceEnvironment;
  idempotency_key: string;
  document_hash: string;
  status: FiscalDocumentStatus;
  priority: number;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at?: string | null;
  last_attempt_at?: string | null;
  authority_reference?: string | null;
  provider_ack_reference?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  raw_response_reference?: string | null;
  locked_until?: string | null;
}

export interface ComplianceWebhookEventRecord extends StandardMetadata {
  provider_name: string;
  event_id: string;
  event_type: string;
  fiscal_document_id?: string | null;
  authority_reference?: string | null;
  payload_json: string;
  signature_valid: boolean;
  processed: boolean;
  processed_at?: string | null;
  idempotency_hash: string;
}

export interface ComplianceManualReviewRecord extends StandardMetadata {
  legal_entity_id: string;
  fiscal_document_id: string;
  submission_id?: string;
  failure_reason: string;
  error_code: string;
  error_details: string;
  recommended_action: 'RETRY' | 'RESUBMIT_CORRECTED' | 'REQUEST_CANCELLATION' | 'MANUAL_OFFLINE_FILING';
  assigned_to_user_id?: string | null;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
}

export interface ComplianceReconciliationRecord extends StandardMetadata {
  legal_entity_id: string;
  period_id?: string | null;
  run_number: string;
  run_date: string;
  sales_documents_count: number;
  fiscal_documents_count: number;
  submitted_count: number;
  accepted_count: number;
  rejected_count: number;
  pending_count: number;
  fiscal_tax_total: string;
  tax_subledger_total: string;
  variance_amount: string;
  status: 'RECONCILED' | 'EXCEPTION';
  exceptions_count: number;
}

export interface ComplianceReconciliationExceptionRecord {
  id: string;
  tenant_id: string;
  run_id: string;
  exception_type: 'MISSING_FISCAL_DOC' | 'UNSUBMITTED_FISCAL_DOC' | 'STATUS_MISMATCH' | 'TAX_VARIANCE';
  source_id: string;
  description: string;
  expected_value: string;
  actual_value: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
}

export interface DocumentArchiveRecord extends StandardMetadata {
  fiscal_document_id: string;
  document_number: string;
  country_code: string;
  retention_years: number;
  retention_expiry_date: string;
  archive_format: 'UBL_XML' | 'JSON' | 'PDF_A' | 'ZATCA_XML' | 'FACTUR_X';
  payload_hash: string;
  storage_region: string;
  archived_at: string;
}







