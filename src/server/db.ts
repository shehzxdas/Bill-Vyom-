/**
 * Bill Vyom — Authoritative Database Storage Engine & Isolation Repository
 * Enforces database-level row isolation and strict zero-data policy.
 */

import {
  Tenant,
  LegalEntity,
  Branch,
  Warehouse,
  User,
  TenantMembership,
  Role,
  Permission,
  UserRoleAssignment,
  AuditLog,
  WorkflowDefinition,
  WorkflowInstance,
  TenantNotification,
  TenantSettings,
  BusinessUnit,
  UserInvitation,
  DashboardMetrics,
  Product,
  ProductVariant,
  ProductIdentifier,
  ProductCategory,
  ProductTaxClassification,
  UOMGroup,
  UnitOfMeasure,
  UOMConversion,
  Customer,
  CustomerContact,
  CustomerAddress,
  CustomerGroup,
  Vendor,
  VendorContact,
  VendorAddress,
  VendorGroup,
  StorageLocation,
  CurrencyReference,
  ExchangeRate,
  CountryReference,
  JurisdictionReference,
  PriceList,
  PriceListItem,
  PaymentTerms,
  DocumentNumberingConfig,
  DocumentType,
  Address,
  PaginatedResult,
  PaginationParams,
  Account,
  AccountType,
  AccountSubtype,
  NormalBalance,
  AccountingBook,
  AccountingBookType,
  FiscalCalendar,
  FiscalYear,
  FiscalPeriod,
  FiscalPeriodStatus,
  JournalEntry,
  JournalLine,
  JournalEntryStatus,
  JournalSourceType,
  AccountingDimension,
  TaxAccountMapping,
  TrialBalanceItem,
  TrialBalanceReport,
  GeneralLedgerLine,
  GeneralLedgerStatement,
  Quotation,
  QuotationLine,
  QuotationStatus,
  SalesOrder,
  SalesOrderLine,
  SalesOrderStatus,
  Invoice,
  InvoiceLine,
  InvoiceType,
  InvoiceStatus,
  DeliveryReference,
  DocumentRelationship,
  SalesDashboardOverview,
  Fulfillment,
  FulfillmentLine,
  CreditNote,
  CreditNoteLine,
  DebitNote,
  DebitNoteLine,
  SalesReturn,
  SalesReturnLine,
  DocumentSnapshot,
  DocumentStatusHistory,
  DocumentAttachment,
  ReceivableStatus,
  Receivable,
  ReceivableSchedule,
  PaymentStatus,
  Payment,
  PaymentAllocation,
  PaymentReversal,
  Refund,
  CustomerCreditProfile,
  CreditHold,
  CollectionCaseStatus,
  CollectionCase,
  CollectionActivity,
  PromiseToPay,
  DunningPolicy,
  DunningEvent,
  ARDispute,
  WriteOffRequest,
  WriteOff,
  ARReconciliationRun,
  ARReconciliationException,
  PurchaseRequisition,
  PurchaseRequisitionLine,
  PurchaseRequisitionStatus,
  RFQ,
  RFQLine,
  RFQStatus,
  SupplierQuotation,
  SupplierQuotationLine,
  SupplierQuotationStatus,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  PurchaseOrderRevision,
  GoodsReceipt,
  GoodsReceiptLine,
  GoodsReceiptStatus,
  VendorBill,
  VendorBillLine,
  VendorBillStatus,
  MatchingStatus,
  BillMatchingResult,
  BillMatchingException,
  Payable,
  PayableSchedule,
  PayableStatus,
  VendorPayment,
  VendorPaymentStatus,
  VendorPaymentAllocation,
  VendorPaymentReversal,
  VendorPaymentBatch,
  VendorCreditNote,
  VendorDebitNote,
  VendorBankAccount,
  VendorBankDetailChangeRequest,
  VendorHold,
  APWriteOffRequest,
  APWriteOff,
  APReconciliationRun,
  APReconciliationException,
  WarehouseZone,
  WarehouseLocation,
  LotBatch,
  SerialNumber,
  InventoryMovement,
  StockBalance,
  StockReservation,
  StockTransfer,
  StockTransferLine,
  StockAdjustment,
  StockAdjustmentLine,
  StockCount,
  StockCountLine,
  InventoryCostLayer,
  InventoryCostTransaction,
  LandedCostDocument,
  LandedCostAllocation,
  InventoryReconciliationRun,
  InventoryReconciliationException,
  InventoryPeriodControl,
  InventoryPolicySettings,
  POSTerminal,
  POSSession,
  CashDrawer,
  CashSession,
  CashMovement,
  POSCart,
  POSCartItem,
  POSTransaction,
  POSTransactionItem,
  POSPaymentLine,
  POSReceipt,
  POSReturn,
  POSReturnLine,
  OfflineDevice,
  OfflineCommand,
  SyncConflict,
  SalesReconciliationRun,
  SalesReconciliationException,
  TaxCountryConfig,
  CountryTaxComplianceStatus,
  TaxJurisdiction,
  TaxAuthority,
  GlobalTaxRegistration,
  TaxRegime,
  TaxType,
  TaxCategoryMaster,
  TaxCodeMaster,
  TaxRateMaster,
  TaxRuleMaster,
  TaxExemptionRecord,
  TaxOverrideRecord,
  TaxDocumentSnapshot,
  TaxPeriodRecord,
  TaxReturnRecord,
  TaxReturnLine,
  TaxAdjustmentRecord,
  TaxReconciliationRun,
  TaxReconciliationException,
  EInvoiceDocument,
  EInvoiceSubmissionRecord,
  ComplianceCertificateRecord,
  TaxAuditTrailRecord,
  FiscalDocumentType,
  FiscalOriginChannel,
  FiscalDocumentStatus,
  FiscalSeriesRecord,
  FiscalSnapshotLine,
  FiscalDocumentSnapshot,
  FiscalDocumentRecord,
  ComplianceEnvironment,
  ComplianceProviderType,
  ComplianceProviderConfigRecord,
  ComplianceSubmissionAttemptRecord,
  ComplianceSubmissionRecord,
  ComplianceWebhookEventRecord,
  ComplianceManualReviewRecord,
  ComplianceReconciliationRecord,
  ComplianceReconciliationExceptionRecord,
  DocumentArchiveRecord,
} from '../domain/types';
import { Decimal, validateBalancedJournal } from '../domain/decimal';
import { buildComplete195CountryTaxList } from '../domain/taxCountries';

export class TenantDatabase {
  private static instance: TenantDatabase;

  public tenants: Map<string, Tenant> = new Map();
  public legalEntities: Map<string, LegalEntity> = new Map();
  public branches: Map<string, Branch> = new Map();
  public warehouses: Map<string, Warehouse> = new Map();
  public users: Map<string, User> = new Map();
  public memberships: Map<string, TenantMembership> = new Map();
  public roles: Map<string, Role> = new Map();
  public permissions: Map<string, Permission> = new Map();
  public userRoleAssignments: Map<string, UserRoleAssignment> = new Map();
  public auditLogs: AuditLog[] = [];
  public workflowDefinitions: Map<string, WorkflowDefinition> = new Map();
  public workflowInstances: Map<string, WorkflowInstance> = new Map();
  public notifications: Map<string, TenantNotification> = new Map();
  public settings: Map<string, TenantSettings> = new Map();
  public businessUnits: Map<string, BusinessUnit> = new Map();
  public invitations: Map<string, UserInvitation> = new Map();

  // Phase 2 Master Data Storage
  public products: Map<string, Product> = new Map();
  public productVariants: Map<string, ProductVariant> = new Map();
  public productIdentifiers: Map<string, ProductIdentifier> = new Map();
  public productCategories: Map<string, ProductCategory> = new Map();
  public productTaxClassifications: Map<string, ProductTaxClassification> = new Map();
  public uomGroups: Map<string, UOMGroup> = new Map();
  public uoms: Map<string, UnitOfMeasure> = new Map();
  public uomConversions: Map<string, UOMConversion> = new Map();
  public customers: Map<string, Customer> = new Map();
  public customerContacts: Map<string, CustomerContact> = new Map();
  public customerAddresses: Map<string, CustomerAddress> = new Map();
  public customerGroups: Map<string, CustomerGroup> = new Map();
  public vendors: Map<string, Vendor> = new Map();
  public vendorContacts: Map<string, VendorContact> = new Map();
  public vendorAddresses: Map<string, VendorAddress> = new Map();
  public vendorGroups: Map<string, VendorGroup> = new Map();
  public storageLocations: Map<string, StorageLocation> = new Map();
  public exchangeRates: Map<string, ExchangeRate> = new Map();
  public priceLists: Map<string, PriceList> = new Map();
  public priceListItems: Map<string, PriceListItem> = new Map();
  public paymentTerms: Map<string, PaymentTerms> = new Map();
  public documentNumberingConfigs: Map<string, DocumentNumberingConfig> = new Map();

  // Phase 3 Accounting Core Storage
  public accountingBooks: Map<string, AccountingBook> = new Map();
  public fiscalCalendars: Map<string, FiscalCalendar> = new Map();
  public fiscalYears: Map<string, FiscalYear> = new Map();
  public fiscalPeriods: Map<string, FiscalPeriod> = new Map();
  public accounts: Map<string, Account> = new Map();
  public journalEntries: Map<string, JournalEntry> = new Map();
  public journalLines: Map<string, JournalLine> = new Map();
  public accountingDimensions: Map<string, AccountingDimension> = new Map();
  public taxAccountMappings: Map<string, TaxAccountMapping> = new Map();
  public idempotencyKeys: Map<string, { journal_entry_id: string; created_at: string }> = new Map();

  // Phase 4 Sales Transaction Storage
  public quotations: Map<string, Quotation> = new Map();
  public quotationLines: Map<string, QuotationLine> = new Map();
  public quotationVersions: Map<string, Quotation[]> = new Map();
  public salesOrders: Map<string, SalesOrder> = new Map();
  public salesOrderLines: Map<string, SalesOrderLine> = new Map();
  public invoices: Map<string, Invoice> = new Map();
  public invoiceLines: Map<string, InvoiceLine> = new Map();
  public deliveryReferences: Map<string, DeliveryReference> = new Map();
  public documentRelationships: Map<string, DocumentRelationship> = new Map();

  // Phase 5 Sales Transaction Storage Addition
  public fulfillments: Map<string, Fulfillment> = new Map();
  public fulfillmentLines: Map<string, FulfillmentLine> = new Map();
  public creditNotes: Map<string, CreditNote> = new Map();
  public creditNoteLines: Map<string, CreditNoteLine> = new Map();
  public debitNotes: Map<string, DebitNote> = new Map();
  public debitNoteLines: Map<string, DebitNoteLine> = new Map();
  public salesReturns: Map<string, SalesReturn> = new Map();
  public salesReturnLines: Map<string, SalesReturnLine> = new Map();
  public documentSnapshots: Map<string, DocumentSnapshot> = new Map();
  public documentStatusHistories: Map<string, DocumentStatusHistory> = new Map();
  public documentAttachments: Map<string, DocumentAttachment> = new Map();

  // Phase 6: Global AR & Customer Collections Storage
  public receivables: Map<string, Receivable> = new Map();
  public receivableSchedules: Map<string, ReceivableSchedule> = new Map();
  public payments: Map<string, Payment> = new Map();
  public paymentAllocations: Map<string, PaymentAllocation> = new Map();
  public paymentReversals: Map<string, PaymentReversal> = new Map();
  public refunds: Map<string, Refund> = new Map();
  public customerCreditProfiles: Map<string, CustomerCreditProfile> = new Map();
  public creditHolds: Map<string, CreditHold> = new Map();
  public collectionCases: Map<string, CollectionCase> = new Map();
  public collectionActivities: Map<string, CollectionActivity> = new Map();
  public promisesToPay: Map<string, PromiseToPay> = new Map();
  public dunningPolicies: Map<string, DunningPolicy> = new Map();
  public dunningEvents: Map<string, DunningEvent> = new Map();
  public arDisputes: Map<string, ARDispute> = new Map();
  public writeOffRequests: Map<string, WriteOffRequest> = new Map();
  public writeOffs: Map<string, WriteOff> = new Map();
  public arReconciliationRuns: Map<string, ARReconciliationRun> = new Map();
  public arReconciliationExceptions: Map<string, ARReconciliationException> = new Map();

  // Phase 7: Global Procurement & Accounts Payable Storage
  public purchaseRequisitions: Map<string, PurchaseRequisition> = new Map();
  public purchaseRequisitionLines: Map<string, PurchaseRequisitionLine> = new Map();
  public rfqs: Map<string, RFQ> = new Map();
  public rfqLines: Map<string, RFQLine> = new Map();
  public supplierQuotations: Map<string, SupplierQuotation> = new Map();
  public supplierQuotationLines: Map<string, SupplierQuotationLine> = new Map();
  public purchaseOrders: Map<string, PurchaseOrder> = new Map();
  public purchaseOrderLines: Map<string, PurchaseOrderLine> = new Map();
  public purchaseOrderRevisions: Map<string, PurchaseOrderRevision> = new Map();
  public goodsReceipts: Map<string, GoodsReceipt> = new Map();
  public goodsReceiptLines: Map<string, GoodsReceiptLine> = new Map();
  public vendorBills: Map<string, VendorBill> = new Map();
  public vendorBillLines: Map<string, VendorBillLine> = new Map();
  public billMatchingResults: Map<string, BillMatchingResult> = new Map();
  public billMatchingExceptions: Map<string, BillMatchingException> = new Map();
  public payables: Map<string, Payable> = new Map();
  public payableSchedules: Map<string, PayableSchedule> = new Map();
  public vendorPayments: Map<string, VendorPayment> = new Map();
  public vendorPaymentAllocations: Map<string, VendorPaymentAllocation> = new Map();
  public vendorPaymentReversals: Map<string, VendorPaymentReversal> = new Map();
  public vendorPaymentBatches: Map<string, VendorPaymentBatch> = new Map();
  public vendorCreditNotes: Map<string, VendorCreditNote> = new Map();
  public vendorDebitNotes: Map<string, VendorDebitNote> = new Map();
  public vendorBankAccounts: Map<string, VendorBankAccount> = new Map();
  public vendorBankDetailChangeRequests: Map<string, VendorBankDetailChangeRequest> = new Map();
  public vendorHolds: Map<string, VendorHold> = new Map();
  public apWriteOffRequests: Map<string, APWriteOffRequest> = new Map();
  public apWriteOffs: Map<string, APWriteOff> = new Map();
  public apReconciliationRuns: Map<string, APReconciliationRun> = new Map();
  public apReconciliationExceptions: Map<string, APReconciliationException> = new Map();

  // Phase 8 Global Inventory & Warehouse Management Maps
  public warehouseZones: Map<string, WarehouseZone> = new Map();
  public warehouseLocations: Map<string, WarehouseLocation> = new Map();
  public lotBatches: Map<string, LotBatch> = new Map();
  public serialNumbers: Map<string, SerialNumber> = new Map();
  public inventoryMovements: Map<string, InventoryMovement> = new Map();
  public stockBalances: Map<string, StockBalance> = new Map();
  public stockReservations: Map<string, StockReservation> = new Map();
  public stockTransfers: Map<string, StockTransfer> = new Map();
  public stockTransferLines: Map<string, StockTransferLine> = new Map();
  public stockAdjustments: Map<string, StockAdjustment> = new Map();
  public stockAdjustmentLines: Map<string, StockAdjustmentLine> = new Map();
  public stockCounts: Map<string, StockCount> = new Map();
  public stockCountLines: Map<string, StockCountLine> = new Map();
  public inventoryCostLayers: Map<string, InventoryCostLayer> = new Map();
  public inventoryCostTransactions: Map<string, InventoryCostTransaction> = new Map();
  public landedCostDocuments: Map<string, LandedCostDocument> = new Map();
  public landedCostAllocations: Map<string, LandedCostAllocation> = new Map();
  public inventoryReconciliationRuns: Map<string, InventoryReconciliationRun> = new Map();
  public inventoryReconciliationExceptions: Map<string, InventoryReconciliationException> = new Map();
  public inventoryPeriodControls: Map<string, InventoryPeriodControl> = new Map();
  public inventoryPolicySettings: Map<string, InventoryPolicySettings> = new Map();

  // Phase 9 Global POS & Omnichannel Sales Execution Maps
  public posTerminals: Map<string, POSTerminal> = new Map();
  public posSessions: Map<string, POSSession> = new Map();
  public cashDrawers: Map<string, CashDrawer> = new Map();
  public cashSessions: Map<string, CashSession> = new Map();
  public cashMovements: Map<string, CashMovement> = new Map();
  public posCarts: Map<string, POSCart> = new Map();
  public posTransactions: Map<string, POSTransaction> = new Map();
  public posReceipts: Map<string, POSReceipt> = new Map();
  public posReturns: Map<string, POSReturn> = new Map();
  public offlineDevices: Map<string, OfflineDevice> = new Map();
  public offlineCommands: Map<string, OfflineCommand> = new Map();
  public syncConflicts: Map<string, SyncConflict> = new Map();
  public salesReconciliationRuns: Map<string, SalesReconciliationRun> = new Map();
  public salesReconciliationExceptions: Map<string, SalesReconciliationException> = new Map();

  // Phase 10 Global Tax Engine & Compliance Foundation Maps
  public taxCountryConfigs: Map<string, TaxCountryConfig> = new Map();
  public taxJurisdictions: Map<string, TaxJurisdiction> = new Map();
  public taxAuthorities: Map<string, TaxAuthority> = new Map();
  public taxRegistrations: Map<string, GlobalTaxRegistration> = new Map();
  public taxRegimes: Map<string, TaxRegime> = new Map();
  public taxTypes: Map<string, TaxType> = new Map();
  public taxCategories: Map<string, TaxCategoryMaster> = new Map();
  public taxCodes: Map<string, TaxCodeMaster> = new Map();
  public taxRates: Map<string, TaxRateMaster> = new Map();
  public taxRules: Map<string, TaxRuleMaster> = new Map();
  public taxExemptions: Map<string, TaxExemptionRecord> = new Map();
  public taxOverrides: Map<string, TaxOverrideRecord> = new Map();
  public taxDocumentSnapshots: Map<string, TaxDocumentSnapshot> = new Map();
  public taxPeriods: Map<string, TaxPeriodRecord> = new Map();
  public taxReturns: Map<string, TaxReturnRecord> = new Map();
  public taxAdjustments: Map<string, TaxAdjustmentRecord> = new Map();
  public taxReconciliationRuns: Map<string, TaxReconciliationRun> = new Map();
  public taxReconciliationExceptions: Map<string, TaxReconciliationException> = new Map();
  public einvoiceDocuments: Map<string, EInvoiceDocument> = new Map();
  public einvoiceSubmissions: Map<string, EInvoiceSubmissionRecord> = new Map();
  public complianceCertificates: Map<string, ComplianceCertificateRecord> = new Map();
  public taxAuditLogs: TaxAuditTrailRecord[] = [];

  // Phase 11 Global E-Invoicing & Fiscal Document Compliance Execution Maps
  public fiscalSeries: Map<string, FiscalSeriesRecord> = new Map();
  public fiscalDocuments: Map<string, FiscalDocumentRecord> = new Map();
  public complianceProviderConfigs: Map<string, ComplianceProviderConfigRecord> = new Map();
  public complianceSubmissions: Map<string, ComplianceSubmissionRecord> = new Map();
  public complianceSubmissionAttempts: Map<string, ComplianceSubmissionAttemptRecord> = new Map();
  public complianceWebhookEvents: Map<string, ComplianceWebhookEventRecord> = new Map();
  public complianceManualReviews: Map<string, ComplianceManualReviewRecord> = new Map();
  public complianceReconciliations: Map<string, ComplianceReconciliationRecord> = new Map();
  public complianceReconciliationExceptions: Map<string, ComplianceReconciliationExceptionRecord> = new Map();
  public documentArchives: Map<string, DocumentArchiveRecord> = new Map();

  // Reference Data (Global Standards)
  public countryReferences: Map<string, CountryReference> = new Map();
  public currencyReferences: Map<string, CurrencyReference> = new Map();
  public jurisdictionReferences: Map<string, JurisdictionReference> = new Map();

  private constructor() {
    this.initializeDefaultPermissions();
    this.initializeReferenceData();
  }

  public static getInstance(): TenantDatabase {
    if (!TenantDatabase.instance) {
      TenantDatabase.instance = new TenantDatabase();
    }
    return TenantDatabase.instance;
  }

  /**
   * Reset database (strictly for test isolation)
   */
  public clearAll(): void {
    this.tenants.clear();
    this.legalEntities.clear();
    this.branches.clear();
    this.warehouses.clear();
    this.users.clear();
    this.memberships.clear();
    this.roles.clear();
    this.userRoleAssignments.clear();
    this.auditLogs = [];
    this.workflowDefinitions.clear();
    this.workflowInstances.clear();
    this.notifications.clear();
    this.settings.clear();
    this.businessUnits.clear();
    this.invitations.clear();

    // Clear Master Data
    this.products.clear();
    this.productVariants.clear();
    this.productIdentifiers.clear();
    this.productCategories.clear();
    this.productTaxClassifications.clear();
    this.uomGroups.clear();
    this.uoms.clear();
    this.uomConversions.clear();
    this.customers.clear();
    this.customerContacts.clear();
    this.customerAddresses.clear();
    this.customerGroups.clear();
    this.vendors.clear();
    this.vendorContacts.clear();
    this.vendorAddresses.clear();
    this.vendorGroups.clear();
    this.storageLocations.clear();
    this.exchangeRates.clear();
    this.priceLists.clear();
    this.priceListItems.clear();
    this.paymentTerms.clear();
    this.documentNumberingConfigs.clear();

    // Clear Accounting & Sales Data
    this.accountingBooks.clear();
    this.fiscalCalendars.clear();
    this.fiscalYears.clear();
    this.fiscalPeriods.clear();
    this.accounts.clear();
    this.journalEntries.clear();
    this.journalLines.clear();
    this.accountingDimensions.clear();
    this.taxAccountMappings.clear();
    this.idempotencyKeys.clear();
    this.quotations.clear();
    this.quotationLines.clear();
    this.quotationVersions.clear();
    this.salesOrders.clear();
    this.salesOrderLines.clear();
    this.invoices.clear();
    this.invoiceLines.clear();
    this.deliveryReferences.clear();
    this.documentRelationships.clear();

    // Clear Phase 5 maps
    this.fulfillments.clear();
    this.fulfillmentLines.clear();
    this.creditNotes.clear();
    this.creditNoteLines.clear();
    this.debitNotes.clear();
    this.debitNoteLines.clear();
    this.salesReturns.clear();
    this.salesReturnLines.clear();
    this.documentSnapshots.clear();
    this.documentStatusHistories.clear();
    this.documentAttachments.clear();

    // Clear Phase 8 maps
    this.warehouseZones.clear();
    this.warehouseLocations.clear();
    this.lotBatches.clear();
    this.serialNumbers.clear();
    this.inventoryMovements.clear();
    this.stockBalances.clear();
    this.stockReservations.clear();
    this.stockTransfers.clear();
    this.stockTransferLines.clear();
    this.stockAdjustments.clear();
    this.stockAdjustmentLines.clear();
    this.stockCounts.clear();
    this.stockCountLines.clear();
    this.inventoryCostLayers.clear();
    this.inventoryCostTransactions.clear();
    this.landedCostDocuments.clear();
    this.landedCostAllocations.clear();
    this.inventoryReconciliationRuns.clear();
    this.inventoryReconciliationExceptions.clear();
    this.inventoryPeriodControls.clear();
    this.inventoryPolicySettings.clear();

    // Clear Phase 9 POS Maps
    this.posTerminals.clear();
    this.posSessions.clear();
    this.cashDrawers.clear();
    this.cashSessions.clear();
    this.cashMovements.clear();
    this.posCarts.clear();
    this.posTransactions.clear();
    this.posReceipts.clear();
    this.posReturns.clear();
    this.offlineDevices.clear();
    this.offlineCommands.clear();
    this.syncConflicts.clear();
    this.salesReconciliationRuns.clear();
    this.salesReconciliationExceptions.clear();

    // Clear Phase 10 Global Tax Maps
    this.taxJurisdictions.clear();
    this.taxAuthorities.clear();
    this.taxRegistrations.clear();
    this.taxRegimes.clear();
    this.taxTypes.clear();
    this.taxCategories.clear();
    this.taxCodes.clear();
    this.taxRates.clear();
    this.taxRules.clear();
    this.taxExemptions.clear();
    this.taxOverrides.clear();
    this.taxDocumentSnapshots.clear();
    this.taxPeriods.clear();
    this.taxReturns.clear();
    this.taxAdjustments.clear();
    this.taxReconciliationRuns.clear();
    this.taxReconciliationExceptions.clear();
    this.einvoiceDocuments.clear();
    this.einvoiceSubmissions.clear();
    this.complianceCertificates.clear();
    this.taxAuditLogs = [];

    // Clear Phase 11 maps
    this.fiscalSeries.clear();
    this.fiscalDocuments.clear();
    this.complianceProviderConfigs.clear();
    this.complianceSubmissions.clear();
    this.complianceSubmissionAttempts.clear();
    this.complianceWebhookEvents.clear();
    this.complianceManualReviews.clear();
    this.complianceReconciliations.clear();
    this.complianceReconciliationExceptions.clear();
    this.documentArchives.clear();

    this.initializeDefaultPermissions();
    this.initializeReferenceData();
  }

  private initializeDefaultPermissions(): void {
    const defaultPerms: Permission[] = [
      { id: 'perm_org_view', module: 'organization', resource: 'tenant', action: 'view', scope: 'tenant' },
      { id: 'perm_org_edit', module: 'organization', resource: 'tenant', action: 'edit', scope: 'tenant' },
      { id: 'perm_entity_view', module: 'organization', resource: 'legal_entities', action: 'view', scope: 'tenant' },
      { id: 'perm_entity_create', module: 'organization', resource: 'legal_entities', action: 'create', scope: 'tenant' },
      { id: 'perm_branch_view', module: 'organization', resource: 'branches', action: 'view', scope: 'tenant' },
      { id: 'perm_branch_create', module: 'organization', resource: 'branches', action: 'create', scope: 'tenant' },
      { id: 'perm_wh_view', module: 'inventory', resource: 'warehouses', action: 'view', scope: 'tenant' },
      { id: 'perm_wh_create', module: 'inventory', resource: 'warehouses', action: 'create', scope: 'tenant' },
      { id: 'perm_team_view', module: 'team', resource: 'users', action: 'view', scope: 'tenant' },
      { id: 'perm_team_invite', module: 'team', resource: 'users', action: 'invite', scope: 'tenant' },
      { id: 'perm_settings_view', module: 'settings', resource: 'config', action: 'view', scope: 'tenant' },
      { id: 'perm_settings_edit', module: 'settings', resource: 'config', action: 'edit', scope: 'tenant' },
      { id: 'perm_dashboard_view', module: 'dashboard', resource: 'metrics', action: 'view', scope: 'tenant' },

      // Phase 2 Master Data Permissions
      { id: 'perm_product_view', module: 'inventory', resource: 'products', action: 'view', scope: 'tenant' },
      { id: 'perm_product_create', module: 'inventory', resource: 'products', action: 'create', scope: 'tenant' },
      { id: 'perm_product_edit', module: 'inventory', resource: 'products', action: 'edit', scope: 'tenant' },
      { id: 'perm_product_archive', module: 'inventory', resource: 'products', action: 'delete', scope: 'tenant' },
      { id: 'perm_customer_view', module: 'sales', resource: 'customers', action: 'view', scope: 'tenant' },
      { id: 'perm_customer_create', module: 'sales', resource: 'customers', action: 'create', scope: 'tenant' },
      { id: 'perm_customer_edit', module: 'sales', resource: 'customers', action: 'edit', scope: 'tenant' },
      { id: 'perm_customer_archive', module: 'sales', resource: 'customers', action: 'delete', scope: 'tenant' },
      { id: 'perm_vendor_view', module: 'purchases', resource: 'vendors', action: 'view', scope: 'tenant' },
      { id: 'perm_vendor_create', module: 'purchases', resource: 'vendors', action: 'create', scope: 'tenant' },
      { id: 'perm_vendor_edit', module: 'purchases', resource: 'vendors', action: 'edit', scope: 'tenant' },
      { id: 'perm_vendor_archive', module: 'purchases', resource: 'vendors', action: 'delete', scope: 'tenant' },
      { id: 'perm_master_config', module: 'settings', resource: 'master', action: 'edit', scope: 'tenant' },

      // Phase 8 Global Inventory & Warehouse Management Permissions
      { id: 'perm_inv_view', module: 'inventory', resource: 'inventory', action: 'view', scope: 'tenant' },
      { id: 'perm_inv_manage', module: 'inventory', resource: 'inventory', action: 'create', scope: 'tenant' },
      { id: 'perm_inv_receive', module: 'inventory', resource: 'inventory', action: 'create', scope: 'tenant' },
      { id: 'perm_inv_issue', module: 'inventory', resource: 'inventory', action: 'create', scope: 'tenant' },
      { id: 'perm_inv_transfer', module: 'inventory', resource: 'inventory', action: 'create', scope: 'tenant' },
      { id: 'perm_inv_adjust', module: 'inventory', resource: 'inventory', action: 'create', scope: 'tenant' },
      { id: 'perm_inv_count', module: 'inventory', resource: 'inventory', action: 'create', scope: 'tenant' },
      { id: 'perm_inv_approve', module: 'inventory', resource: 'inventory', action: 'edit', scope: 'tenant' },
      { id: 'perm_inv_reconcile', module: 'inventory', resource: 'inventory', action: 'edit', scope: 'tenant' },

      // Phase 9 Global POS & Omnichannel Sales Permissions
      { id: 'pos.view', module: 'pos', resource: 'pos', action: 'view', scope: 'tenant' },
      { id: 'pos.sell', module: 'pos', resource: 'checkout', action: 'create', scope: 'tenant' },
      { id: 'pos.refund', module: 'pos', resource: 'refunds', action: 'create', scope: 'tenant' },
      { id: 'pos.void', module: 'pos', resource: 'transactions', action: 'delete', scope: 'tenant' },
      { id: 'pos.discount', module: 'pos', resource: 'discounts', action: 'create', scope: 'tenant' },
      { id: 'pos.discount_override', module: 'pos', resource: 'discounts', action: 'edit', scope: 'tenant' },
      { id: 'pos.open_session', module: 'pos', resource: 'sessions', action: 'create', scope: 'tenant' },
      { id: 'pos.close_session', module: 'pos', resource: 'sessions', action: 'edit', scope: 'tenant' },
      { id: 'pos.cash_in', module: 'pos', resource: 'cash', action: 'create', scope: 'tenant' },
      { id: 'pos.cash_out', module: 'pos', resource: 'cash', action: 'create', scope: 'tenant' },
      { id: 'pos.view_reports', module: 'pos', resource: 'reports', action: 'view', scope: 'tenant' },
      { id: 'pos.reconcile', module: 'pos', resource: 'reconciliation', action: 'create', scope: 'tenant' },
      { id: 'pos.override_stock', module: 'pos', resource: 'inventory', action: 'edit', scope: 'tenant' },
      { id: 'pos.manage_terminal', module: 'pos', resource: 'terminals', action: 'manage', scope: 'tenant' },

      // Phase 10 Global Tax Engine Permissions
      { id: 'tax.view', module: 'tax', resource: 'tax', action: 'view', scope: 'tenant' },
      { id: 'tax.manage', module: 'tax', resource: 'tax', action: 'create', scope: 'tenant' },
      { id: 'tax.manage_rules', module: 'tax', resource: 'rules', action: 'create', scope: 'tenant' },
      { id: 'tax.manage_rates', module: 'tax', resource: 'rates', action: 'create', scope: 'tenant' },
      { id: 'tax.manage_registrations', module: 'tax', resource: 'registrations', action: 'create', scope: 'tenant' },
      { id: 'tax.manage_exemptions', module: 'tax', resource: 'exemptions', action: 'create', scope: 'tenant' },
      { id: 'tax.override', module: 'tax', resource: 'overrides', action: 'create', scope: 'tenant' },
      { id: 'tax.approve_configuration', module: 'tax', resource: 'rules', action: 'edit', scope: 'tenant' },
      { id: 'tax.prepare_return', module: 'tax', resource: 'returns', action: 'create', scope: 'tenant' },
      { id: 'tax.approve_return', module: 'tax', resource: 'returns', action: 'edit', scope: 'tenant' },
      { id: 'tax.submit_return', module: 'tax', resource: 'returns', action: 'manage', scope: 'tenant' },
      { id: 'tax.reconcile', module: 'tax', resource: 'reconciliation', action: 'create', scope: 'tenant' },
      { id: 'tax.view_audit', module: 'tax', resource: 'audit', action: 'view', scope: 'tenant' },
      { id: 'einvoice.manage', module: 'tax', resource: 'einvoice', action: 'create', scope: 'tenant' },
      { id: 'einvoice.submit', module: 'tax', resource: 'einvoice', action: 'manage', scope: 'tenant' },

      // Phase 11 Global E-Invoicing & Fiscal Document Compliance Permissions
      { id: 'compliance.view', module: 'compliance', resource: 'fiscal_document', action: 'view', scope: 'tenant' },
      { id: 'compliance.manage', module: 'compliance', resource: 'fiscal_document', action: 'create', scope: 'tenant' },
      { id: 'compliance.submit', module: 'compliance', resource: 'submission', action: 'create', scope: 'tenant' },
      { id: 'compliance.retry', module: 'compliance', resource: 'submission', action: 'edit', scope: 'tenant' },
      { id: 'compliance.cancel', module: 'compliance', resource: 'fiscal_document', action: 'delete', scope: 'tenant' },
      { id: 'compliance.manual_review', module: 'compliance', resource: 'review', action: 'edit', scope: 'tenant' },
      { id: 'compliance.configure_provider', module: 'compliance', resource: 'provider', action: 'manage', scope: 'tenant' },
      { id: 'compliance.manage_certificates', module: 'compliance', resource: 'certificate', action: 'manage', scope: 'tenant' },
      { id: 'compliance.view_sensitive', module: 'compliance', resource: 'security', action: 'view', scope: 'tenant' },
      { id: 'compliance.reconcile', module: 'compliance', resource: 'reconciliation', action: 'create', scope: 'tenant' },
      { id: 'compliance.export', module: 'compliance', resource: 'export', action: 'view', scope: 'tenant' },
    ];

    for (const perm of defaultPerms) {
      this.permissions.set(perm.id, perm);
    }
  }

  private initializeReferenceData(): void {
    // ISO Country References (Global Reference Standards - NOT fake tenant records)
    const countries: CountryReference[] = [
      { country_code: 'IN', country_name: 'India', iso_alpha3: 'IND', default_currency_code: 'INR', default_language_code: 'en-IN' },
      { country_code: 'US', country_name: 'United States', iso_alpha3: 'USA', default_currency_code: 'USD', default_language_code: 'en-US' },
      { country_code: 'AE', country_name: 'United Arab Emirates', iso_alpha3: 'ARE', default_currency_code: 'AED', default_language_code: 'ar-AE' },
      { country_code: 'GB', country_name: 'United Kingdom', iso_alpha3: 'GBR', default_currency_code: 'GBP', default_language_code: 'en-GB' },
      { country_code: 'SG', country_name: 'Singapore', iso_alpha3: 'SGP', default_currency_code: 'SGD', default_language_code: 'en-SG' },
      { country_code: 'CA', country_name: 'Canada', iso_alpha3: 'CAN', default_currency_code: 'CAD', default_language_code: 'en-CA' },
      { country_code: 'AU', country_name: 'Australia', iso_alpha3: 'AUS', default_currency_code: 'AUD', default_language_code: 'en-AU' },
      { country_code: 'DE', country_name: 'Germany', iso_alpha3: 'DEU', default_currency_code: 'EUR', default_language_code: 'de-DE' },
    ];
    for (const c of countries) {
      this.countryReferences.set(c.country_code, c);
    }

    // Currency References
    const currencies: CurrencyReference[] = [
      { currency_code: 'INR', currency_name: 'Indian Rupee', symbol: '₹', decimal_places: 2, status: 'ACTIVE' },
      { currency_code: 'USD', currency_name: 'United States Dollar', symbol: '$', decimal_places: 2, status: 'ACTIVE' },
      { currency_code: 'EUR', currency_name: 'Euro', symbol: '€', decimal_places: 2, status: 'ACTIVE' },
      { currency_code: 'GBP', currency_name: 'British Pound', symbol: '£', decimal_places: 2, status: 'ACTIVE' },
      { currency_code: 'AED', currency_name: 'UAE Dirham', symbol: 'AED', decimal_places: 2, status: 'ACTIVE' },
      { currency_code: 'SGD', currency_name: 'Singapore Dollar', symbol: 'S$', decimal_places: 2, status: 'ACTIVE' },
    ];
    for (const curr of currencies) {
      this.currencyReferences.set(curr.currency_code, curr);
    }

    // Jurisdiction References
    const jurisdictions: JurisdictionReference[] = [
      { jurisdiction_code: 'IN', jurisdiction_name: 'India Tax Authority', country_code: 'IN', tax_authority_name: 'CBIC / GSTN' },
      { jurisdiction_code: 'US', jurisdiction_name: 'United States State Tax Authorities', country_code: 'US', tax_authority_name: 'IRS / State Revenue' },
      { jurisdiction_code: 'AE', jurisdiction_name: 'Federal Tax Authority UAE', country_code: 'AE', tax_authority_name: 'FTA UAE' },
      { jurisdiction_code: 'GB', jurisdiction_name: 'HM Revenue & Customs', country_code: 'GB', tax_authority_name: 'HMRC' },
      { jurisdiction_code: 'SG', jurisdiction_name: 'Inland Revenue Authority of Singapore', country_code: 'SG', tax_authority_name: 'IRAS' },
    ];
    for (const j of jurisdictions) {
      this.jurisdictionReferences.set(j.jurisdiction_code, j);
    }

    // Initialize Canonical 195 Global Tax Country Configs
    const globalCountries = buildComplete195CountryTaxList();
    for (const c of globalCountries) {
      this.taxCountryConfigs.set(c.country_code, c);
    }
  }

  // ==========================================
  // TENANT ISOLATED QUERIES
  // ==========================================

  public getTenant(tenantId: string): Tenant | undefined {
    const tenant = this.tenants.get(tenantId);
    if (!tenant || tenant.deleted_at !== null) return undefined;
    return tenant;
  }

  public getLegalEntitiesByTenant(tenantId: string): LegalEntity[] {
    return Array.from(this.legalEntities.values()).filter(
      (e) => e.tenant_id === tenantId && e.deleted_at === null
    );
  }

  public getBranchesByTenant(tenantId: string, legalEntityId?: string): Branch[] {
    return Array.from(this.branches.values()).filter(
      (b) =>
        b.tenant_id === tenantId &&
        b.deleted_at === null &&
        (!legalEntityId || b.legal_entity_id === legalEntityId)
    );
  }

  public getWarehousesByTenant(tenantId: string, branchId?: string): Warehouse[] {
    return Array.from(this.warehouses.values()).filter(
      (w) =>
        w.tenant_id === tenantId &&
        w.deleted_at === null &&
        (!branchId || w.branch_id === branchId)
    );
  }

  public getBusinessUnitsByTenant(tenantId: string, legalEntityId?: string): BusinessUnit[] {
    return Array.from(this.businessUnits.values()).filter(
      (bu) =>
        bu.tenant_id === tenantId &&
        bu.deleted_at === null &&
        (!legalEntityId || bu.legal_entity_id === legalEntityId)
    );
  }

  public getInvitationsByTenant(tenantId: string): UserInvitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.tenant_id === tenantId && inv.deleted_at === null
    );
  }

  public getMembershipsByUser(userId: string): TenantMembership[] {
    return Array.from(this.memberships.values()).filter(
      (m) => m.user_id === userId && m.status === 'ACTIVE'
    );
  }

  public getMembership(userId: string, tenantId: string): TenantMembership | undefined {
    return Array.from(this.memberships.values()).find(
      (m) => m.user_id === userId && m.tenant_id === tenantId && m.status === 'ACTIVE'
    );
  }

  public getUsersByTenant(tenantId: string): { user: User; membership: TenantMembership; roles: Role[] }[] {
    const memberships = Array.from(this.memberships.values()).filter(
      (m) => m.tenant_id === tenantId && m.status === 'ACTIVE'
    );

    return memberships.map((m) => {
      const user = this.users.get(m.user_id)!;
      const assignments = Array.from(this.userRoleAssignments.values()).filter(
        (a) => a.tenant_id === tenantId && a.user_id === m.user_id
      );
      const roles = assignments
        .map((a) => this.roles.get(a.role_id))
        .filter((r): r is Role => r !== undefined);

      return { user, membership: m, roles };
    });
  }

  public getRolesByTenant(tenantId: string): Role[] {
    return Array.from(this.roles.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null
    );
  }

  public getAuditLogsByTenant(tenantId: string): AuditLog[] {
    return this.auditLogs.filter((log) => log.tenant_id === tenantId);
  }

  public getNotificationsByUser(tenantId: string, userId: string): TenantNotification[] {
    return Array.from(this.notifications.values()).filter(
      (n) => n.tenant_id === tenantId && n.recipient_user_id === userId
    );
  }

  public getDashboardMetrics(tenantId: string): DashboardMetrics {
    const tenant = this.getTenant(tenantId);
    const legalEntities = this.getLegalEntitiesByTenant(tenantId);
    const branches = this.getBranchesByTenant(tenantId);
    const warehouses = this.getWarehousesByTenant(tenantId);
    const users = this.getUsersByTenant(tenantId);

    // Calculate real financial metrics from posted journal lines if posted journals exist
    const postedLines = Array.from(this.journalLines.values()).filter(
      (l) => l.tenant_id === tenantId
    );

    let revDec = Decimal.zero(4);
    let expDec = Decimal.zero(4);
    let recDec = Decimal.zero(4);
    let payDec = Decimal.zero(4);
    let invDec = Decimal.zero(4);
    let cashDec = Decimal.zero(4);

    if (postedLines.length > 0) {
      for (const line of postedLines) {
        const account = this.accounts.get(line.account_id);
        if (!account) continue;

        const deb = new Decimal(line.base_debit || '0');
        const cred = new Decimal(line.base_credit || '0');

        if (account.account_type === 'REVENUE') {
          revDec = revDec.add(cred).sub(deb);
        } else if (account.account_type === 'EXPENSE') {
          expDec = expDec.add(deb).sub(cred);
        } else if (account.account_subtype === 'ACCOUNTS_RECEIVABLE') {
          recDec = recDec.add(deb).sub(cred);
        } else if (account.account_subtype === 'ACCOUNTS_PAYABLE') {
          payDec = payDec.add(cred).sub(deb);
        } else if (account.account_subtype === 'INVENTORY') {
          invDec = invDec.add(deb).sub(cred);
        } else if (account.account_subtype === 'CASH_AND_EQUIVALENT' || account.account_subtype === 'BANK') {
          cashDec = cashDec.add(deb).sub(cred);
        }
      }
    }

    const netProfitDec = revDec.sub(expDec);

    return {
      currency_code: tenant?.base_currency_code || 'INR',
      total_revenue: revDec.toString(2),
      receivables: recDec.toString(2),
      payables: payDec.toString(2),
      inventory_value: invDec.toString(2),
      cash_flow: cashDec.toString(2),
      net_profit: netProfitDec.toString(2),
      pending_approvals_count: 0,
      active_legal_entities_count: legalEntities.length,
      active_branches_count: branches.length,
      active_warehouses_count: warehouses.length,
      active_users_count: users.length,
    };
  }

  public recordAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const auditRecord: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(auditRecord);
    return auditRecord;
  }

  // ==========================================
  // MASTER DATA: PRODUCTS & VARIANTS
  // ==========================================

  public getProductsByTenant(tenantId: string, params?: PaginationParams): PaginatedResult<Product> {
    let items = Array.from(this.products.values()).filter(
      (p) => p.tenant_id === tenantId && p.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((p) => p.status === params.status);
    }
    if (params?.type) {
      items = items.filter((p) => p.product_type === params.type);
    }
    if (params?.category_id) {
      items = items.filter((p) => p.category_id === params.category_id);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (p) =>
          p.product_code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.brand_name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getProductById(tenantId: string, productId: string): Product | undefined {
    const p = this.products.get(productId);
    if (!p || p.tenant_id !== tenantId || p.deleted_at !== null) return undefined;
    return p;
  }

  public getVariantsByProduct(tenantId: string, productId: string): ProductVariant[] {
    return Array.from(this.productVariants.values()).filter(
      (v) => v.tenant_id === tenantId && v.product_id === productId && v.deleted_at === null
    );
  }

  public getIdentifiersByVariant(tenantId: string, variantId: string): ProductIdentifier[] {
    return Array.from(this.productIdentifiers.values()).filter(
      (i) => i.tenant_id === tenantId && i.variant_id === variantId && i.deleted_at === null
    );
  }

  public getTaxClassificationsByProduct(tenantId: string, productId: string): ProductTaxClassification[] {
    return Array.from(this.productTaxClassifications.values()).filter(
      (tc) => tc.tenant_id === tenantId && tc.product_id === productId && tc.deleted_at === null
    );
  }

  // Categories
  public getCategoriesByTenant(tenantId: string): ProductCategory[] {
    return Array.from(this.productCategories.values())
      .filter((c) => c.tenant_id === tenantId && c.deleted_at === null)
      .sort((a, b) => a.sequence - b.sequence);
  }

  // UOM
  public getUOMGroupsByTenant(tenantId: string): UOMGroup[] {
    return Array.from(this.uomGroups.values()).filter(
      (g) => g.tenant_id === tenantId && g.deleted_at === null
    );
  }

  public getUnitsByTenant(tenantId: string, groupId?: string): UnitOfMeasure[] {
    return Array.from(this.uoms.values()).filter(
      (u) =>
        u.tenant_id === tenantId &&
        u.deleted_at === null &&
        (!groupId || u.uom_group_id === groupId)
    );
  }

  public getConversionsByTenant(tenantId: string): UOMConversion[] {
    return Array.from(this.uomConversions.values()).filter(
      (c) => c.tenant_id === tenantId && c.deleted_at === null
    );
  }

  // ==========================================
  // MASTER DATA: CUSTOMERS & VENDORS
  // ==========================================

  public getCustomersByTenant(tenantId: string, params?: PaginationParams): PaginatedResult<Customer> {
    let items = Array.from(this.customers.values()).filter(
      (c) => c.tenant_id === tenantId && c.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((c) => c.status === params.status);
    }
    if (params?.type) {
      items = items.filter((c) => c.customer_type === params.type);
    }
    if (params?.group_id) {
      items = items.filter((c) => c.customer_group_id === params.group_id);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (c) =>
          c.customer_code.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q) ||
          c.legal_name.toLowerCase().includes(q) ||
          c.contact_email.toLowerCase().includes(q)
      );
    }

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getCustomerById(tenantId: string, customerId: string): Customer | undefined {
    const c = this.customers.get(customerId);
    if (!c || c.tenant_id !== tenantId || c.deleted_at !== null) return undefined;
    return c;
  }

  public getCustomerContacts(tenantId: string, customerId: string): CustomerContact[] {
    return Array.from(this.customerContacts.values()).filter(
      (cnt) => cnt.tenant_id === tenantId && cnt.customer_id === customerId && cnt.deleted_at === null
    );
  }

  public getCustomerAddresses(tenantId: string, customerId: string): CustomerAddress[] {
    return Array.from(this.customerAddresses.values()).filter(
      (addr) => addr.tenant_id === tenantId && addr.customer_id === customerId && addr.deleted_at === null
    );
  }

  public getCustomerGroups(tenantId: string): CustomerGroup[] {
    return Array.from(this.customerGroups.values()).filter(
      (g) => g.tenant_id === tenantId && g.deleted_at === null
    );
  }

  public getVendorsByTenant(tenantId: string, params?: PaginationParams): PaginatedResult<Vendor> {
    let items = Array.from(this.vendors.values()).filter(
      (v) => v.tenant_id === tenantId && v.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((v) => v.status === params.status);
    }
    if (params?.type) {
      items = items.filter((v) => v.vendor_type === params.type);
    }
    if (params?.group_id) {
      items = items.filter((v) => v.vendor_group_id === params.group_id);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (v) =>
          v.vendor_code.toLowerCase().includes(q) ||
          v.vendor_name.toLowerCase().includes(q) ||
          v.legal_name.toLowerCase().includes(q) ||
          v.contact_email.toLowerCase().includes(q)
      );
    }

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getVendorById(tenantId: string, vendorId: string): Vendor | undefined {
    const v = this.vendors.get(vendorId);
    if (!v || v.tenant_id !== tenantId || v.deleted_at !== null) return undefined;
    return v;
  }

  public getVendorContacts(tenantId: string, vendorId: string): VendorContact[] {
    return Array.from(this.vendorContacts.values()).filter(
      (cnt) => cnt.tenant_id === tenantId && cnt.vendor_id === vendorId && cnt.deleted_at === null
    );
  }

  public getVendorAddresses(tenantId: string, vendorId: string): VendorAddress[] {
    return Array.from(this.vendorAddresses.values()).filter(
      (addr) => addr.tenant_id === tenantId && addr.vendor_id === vendorId && addr.deleted_at === null
    );
  }

  public getVendorGroups(tenantId: string): VendorGroup[] {
    return Array.from(this.vendorGroups.values()).filter(
      (g) => g.tenant_id === tenantId && g.deleted_at === null
    );
  }

  // ==========================================
  // STORAGE LOCATIONS & WAREHOUSES
  // ==========================================

  public getStorageLocations(tenantId: string, warehouseId: string): StorageLocation[] {
    return Array.from(this.storageLocations.values()).filter(
      (loc) => loc.tenant_id === tenantId && loc.warehouse_id === warehouseId && loc.deleted_at === null
    );
  }

  // ==========================================
  // CURRENCIES, RATES & PRICE LISTS
  // ==========================================

  public getExchangeRates(tenantId: string): ExchangeRate[] {
    return Array.from(this.exchangeRates.values()).filter(
      (r) => r.tenant_id === tenantId
    );
  }

  public lookupExchangeRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
    date?: string
  ): { rate: string; source: string } | null {
    if (fromCurrency === toCurrency) {
      return { rate: '1.000000', source: 'IDENTICAL_CURRENCY' };
    }

    const rates = this.getExchangeRates(tenantId).filter(
      (r) => r.from_currency === fromCurrency && r.to_currency === toCurrency
    );

    if (rates.length === 0) {
      return null;
    }

    // Return the latest effective rate
    rates.sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
    return { rate: rates[0].rate, source: rates[0].source };
  }

  public getPriceLists(tenantId: string): PriceList[] {
    return Array.from(this.priceLists.values()).filter(
      (pl) => pl.tenant_id === tenantId && pl.deleted_at === null
    );
  }

  public getPriceListItems(tenantId: string, priceListId: string): PriceListItem[] {
    return Array.from(this.priceListItems.values()).filter(
      (pli) => pli.tenant_id === tenantId && pli.price_list_id === priceListId && pli.deleted_at === null
    );
  }

  public getPaymentTerms(tenantId: string): PaymentTerms[] {
    return Array.from(this.paymentTerms.values()).filter(
      (pt) => pt.tenant_id === tenantId && pt.deleted_at === null
    );
  }

  // ==========================================
  // ATOMIC DOCUMENT NUMBERING GENERATOR
  // ==========================================

  public getDocumentNumberingConfigs(tenantId: string): DocumentNumberingConfig[] {
    return Array.from(this.documentNumberingConfigs.values()).filter(
      (cfg) => cfg.tenant_id === tenantId && cfg.deleted_at === null
    );
  }

  public generateNextDocumentNumber(
    tenantId: string,
    documentType: DocumentType,
    legalEntityId?: string,
    branchId?: string
  ): string {
    const configs = this.getDocumentNumberingConfigs(tenantId).filter(
      (cfg) =>
        cfg.document_type === documentType &&
        cfg.status === 'ACTIVE' &&
        (!legalEntityId || cfg.legal_entity_id === null || cfg.legal_entity_id === legalEntityId) &&
        (!branchId || cfg.branch_id === null || cfg.branch_id === branchId)
    );

    let config = configs[0];
    const now = new Date();
    const fiscalYear = String(now.getFullYear());

    if (!config) {
      // Create default config atomically for tenant
      const prefixMap: Record<DocumentType, string> = {
        INVOICE: 'INV',
        QUOTATION: 'QTN',
        SALES_ORDER: 'SO',
        PURCHASE_ORDER: 'PO',
        PURCHASE_REQUISITION: 'PR',
        RFQ: 'RFQ',
        SUPPLIER_QUOTATION: 'SQ',
        GOODS_RECEIPT: 'GRN',
        VENDOR_BILL: 'BILL',
        CREDIT_NOTE: 'CN',
        DEBIT_NOTE: 'DN',
        VENDOR_CREDIT_NOTE: 'VCN',
        VENDOR_DEBIT_NOTE: 'VDN',
        PAYMENT: 'PAY',
        VENDOR_PAYMENT: 'VPAY',
        RECEIPT: 'RCT',
        STOCK_TRANSFER: 'ST',
        FULFILLMENT: 'FUL',
        SALES_RETURN: 'SRT',
        PAYMENT_BATCH: 'BAT',
        WRITE_OFF: 'WO',
      };

      const newConfig: DocumentNumberingConfig = {
        id: `dnc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: tenantId,
        legal_entity_id: legalEntityId || null,
        branch_id: branchId || null,
        document_type: documentType,
        prefix: prefixMap[documentType] || 'DOC',
        suffix: '',
        sequence_length: 6,
        current_sequence: 1,
        fiscal_year: fiscalYear,
        effective_from: now.toISOString(),
        effective_to: null,
        status: 'ACTIVE',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        created_by: 'system',
        updated_by: 'system',
        deleted_at: null,
        version: 1,
      };

      this.documentNumberingConfigs.set(newConfig.id, newConfig);
      config = newConfig;
    }

    const seq = config.current_sequence;
    config.current_sequence += 1;
    config.updated_at = now.toISOString();

    const paddedSeq = String(seq).padStart(config.sequence_length, '0');
    const parts = [config.prefix, config.fiscal_year, paddedSeq].filter(Boolean);
    const docNumber = parts.join('-') + (config.suffix ? `-${config.suffix}` : '');

    return docNumber;
  }

  // ==========================================
  // PHASE 3: ACCOUNTING CORE ENGINE
  // ==========================================

  public getOrCreateDefaultAccountingBook(tenantId: string, legalEntityId: string): AccountingBook {
    const books = Array.from(this.accountingBooks.values()).filter(
      (b) => b.tenant_id === tenantId && b.legal_entity_id === legalEntityId && b.deleted_at === null
    );
    if (books.length > 0) return books[0];

    const le = this.legalEntities.get(legalEntityId);
    const tenant = this.getTenant(tenantId);
    const now = new Date().toISOString();

    const book: AccountingBook = {
      id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      book_code: 'MAIN',
      book_name: 'Primary General Ledger Book',
      book_type: 'PRIMARY',
      base_currency_code: le?.currency_code || tenant?.base_currency_code || 'INR',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      created_by: 'system',
      updated_by: 'system',
      deleted_at: null,
      version: 1,
    };

    this.accountingBooks.set(book.id, book);
    return book;
  }

  public getOrCreateDefaultFiscalCalendar(
    tenantId: string,
    legalEntityId: string
  ): { calendar: FiscalCalendar; fiscalYear: FiscalYear; periods: FiscalPeriod[] } {
    let calendar = Array.from(this.fiscalCalendars.values()).find(
      (c) => c.tenant_id === tenantId && c.legal_entity_id === legalEntityId && c.deleted_at === null
    );

    const now = new Date();
    const currentYearNum = now.getFullYear();
    const nowIso = now.toISOString();

    if (!calendar) {
      calendar = {
        id: `fcal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        calendar_name: `Standard Calendar (${currentYearNum})`,
        start_month: 1,
        status: 'ACTIVE',
        created_at: nowIso,
        updated_at: nowIso,
        created_by: 'system',
        updated_by: 'system',
        deleted_at: null,
        version: 1,
      };
      this.fiscalCalendars.set(calendar.id, calendar);
    }

    let fiscalYear = Array.from(this.fiscalYears.values()).find(
      (y) => y.tenant_id === tenantId && y.fiscal_calendar_id === calendar!.id && y.year_name === `FY ${currentYearNum}`
    );

    if (!fiscalYear) {
      fiscalYear = {
        id: `fyr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: tenantId,
        fiscal_calendar_id: calendar.id,
        year_name: `FY ${currentYearNum}`,
        start_date: `${currentYearNum}-01-01`,
        end_date: `${currentYearNum}-12-31`,
        status: 'OPEN',
        created_at: nowIso,
        updated_at: nowIso,
        created_by: 'system',
        updated_by: 'system',
        deleted_at: null,
        version: 1,
      };
      this.fiscalYears.set(fiscalYear.id, fiscalYear);
    }

    let periods = Array.from(this.fiscalPeriods.values()).filter(
      (p) => p.tenant_id === tenantId && p.fiscal_year_id === fiscalYear!.id
    );

    if (periods.length === 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 1; m <= 12; m++) {
        const monthPadded = String(m).padStart(2, '0');
        const lastDay = new Date(currentYearNum, m, 0).getDate();
        const period: FiscalPeriod = {
          id: `fp_${currentYearNum}_${m}_${Math.random().toString(36).substring(2, 6)}`,
          tenant_id: tenantId,
          fiscal_year_id: fiscalYear.id,
          period_number: m,
          period_name: `${monthNames[m - 1]} ${currentYearNum}`,
          start_date: `${currentYearNum}-${monthPadded}-01`,
          end_date: `${currentYearNum}-${monthPadded}-${String(lastDay).padStart(2, '0')}`,
          status: 'OPEN',
          closed_at: null,
          closed_by: null,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: 'system',
          updated_by: 'system',
          deleted_at: null,
          version: 1,
        };
        this.fiscalPeriods.set(period.id, period);
        periods.push(period);
      }
    }

    return { calendar, fiscalYear, periods };
  }

  public getAccounts(tenantId: string, legalEntityId?: string, bookId?: string): Account[] {
    return Array.from(this.accounts.values()).filter(
      (a) =>
        a.tenant_id === tenantId &&
        a.deleted_at === null &&
        (!legalEntityId || a.legal_entity_id === legalEntityId) &&
        (!bookId || a.accounting_book_id === bookId)
    );
  }

  public createAccount(
    input: Partial<Account> & {
      tenant_id: string;
      legal_entity_id: string;
      code: string;
      name: string;
      account_type: AccountType;
      account_subtype: AccountSubtype;
      normal_balance: NormalBalance;
      created_by: string;
    }
  ): Account {
    // Unique code check
    const existing = Array.from(this.accounts.values()).find(
      (a) =>
        a.tenant_id === input.tenant_id &&
        a.legal_entity_id === input.legal_entity_id &&
        a.code.toUpperCase() === input.code.toUpperCase() &&
        a.deleted_at === null
    );
    if (existing) {
      throw new Error(`Account code ${input.code} already exists for this legal entity.`);
    }

    const book = this.getOrCreateDefaultAccountingBook(input.tenant_id, input.legal_entity_id);
    const now = new Date().toISOString();

    if (input.parent_account_id) {
      const parent = this.accounts.get(input.parent_account_id);
      if (!parent || parent.tenant_id !== input.tenant_id) {
        throw new Error('Parent account does not exist or belongs to a different tenant.');
      }
    }

    const account: Account = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      accounting_book_id: book.id,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      account_type: input.account_type,
      account_subtype: input.account_subtype,
      parent_account_id: input.parent_account_id || null,
      normal_balance: input.normal_balance,
      currency_policy: input.currency_policy || 'MULTI_CURRENCY',
      single_currency_code: input.single_currency_code || null,
      status: 'ACTIVE',
      description: input.description || '',
      is_system_account: input.is_system_account || false,
      posting_allowed: input.posting_allowed !== undefined ? input.posting_allowed : true,
      created_at: now,
      updated_at: now,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.accounts.set(account.id, account);
    return account;
  }

  public updateAccount(
    tenantId: string,
    accountId: string,
    updates: Partial<Account>,
    actorId: string
  ): Account {
    const account = this.accounts.get(accountId);
    if (!account || account.tenant_id !== tenantId || account.deleted_at !== null) {
      throw new Error('Account not found.');
    }

    // Check if postings exist for this account
    const hasPostings = Array.from(this.journalLines.values()).some(
      (l) => l.tenant_id === tenantId && l.account_id === accountId
    );

    if (hasPostings && updates.account_type && updates.account_type !== account.account_type) {
      throw new Error('Cannot change Account Type on an account with existing journal postings.');
    }

    const now = new Date().toISOString();
    const updated: Account = {
      ...account,
      ...updates,
      updated_at: now,
      updated_by: actorId,
      version: account.version + 1,
    };

    this.accounts.set(accountId, updated);
    return updated;
  }

  public createJournalDraft(
    input: {
      tenant_id: string;
      legal_entity_id: string;
      description: string;
      lines: Array<{
        account_id: string;
        debit: string;
        credit: string;
        description?: string;
        dimensions?: Record<string, string>;
      }>;
      created_by: string;
      transaction_date?: string;
      document_date?: string;
      currency_code?: string;
      exchange_rate?: string;
      reference?: string;
      source_type?: JournalSourceType;
      source_id?: string | null;
      idempotency_key?: string;
    }
  ): JournalEntry {
    const book = this.getOrCreateDefaultAccountingBook(input.tenant_id, input.legal_entity_id);
    const { periods } = this.getOrCreateDefaultFiscalCalendar(input.tenant_id, input.legal_entity_id);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const transDate = input.transaction_date || todayStr;

    const matchedPeriod = periods.find(
      (p) => transDate >= p.start_date && transDate <= p.end_date
    ) || periods[0];

    const entryId = `je_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = now.toISOString();

    const formattedLines: JournalLine[] = (input.lines || []).map((l, idx) => {
      const lineRate = input.exchange_rate || '1.0000';
      const deb = new Decimal(l.debit || '0').toFixed(2);
      const cred = new Decimal(l.credit || '0').toFixed(2);

      const baseDeb = new Decimal(deb).mul(lineRate).toFixed(2);
      const baseCred = new Decimal(cred).mul(lineRate).toFixed(2);

      return {
        id: `jel_${entryId}_${idx + 1}`,
        journal_entry_id: entryId,
        tenant_id: input.tenant_id,
        account_id: l.account_id,
        debit: deb,
        credit: cred,
        currency_code: input.currency_code || book.base_currency_code,
        exchange_rate: lineRate,
        base_debit: baseDeb,
        base_credit: baseCred,
        description: l.description || input.description || '',
        dimensions: l.dimensions || {},
        reference: input.reference || '',
      };
    });

    const entry: JournalEntry = {
      id: entryId,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      accounting_book_id: book.id,
      fiscal_period_id: matchedPeriod.id,
      entry_number: `DRAFT-${Date.now().toString().slice(-6)}`,
      transaction_date: transDate,
      posting_date: transDate,
      document_date: input.document_date || transDate,
      reference: input.reference || '',
      description: input.description.trim(),
      source_type: input.source_type || 'MANUAL',
      source_id: input.source_id || null,
      currency_code: input.currency_code || book.base_currency_code,
      exchange_rate: input.exchange_rate || '1.0000',
      status: 'DRAFT',
      created_by: input.created_by,
      updated_by: input.created_by,
      idempotency_key: input.idempotency_key || null,
      created_at: nowIso,
      updated_at: nowIso,
      deleted_at: null,
      version: 1,
      lines: formattedLines,
    };

    this.journalEntries.set(entry.id, entry);
    for (const line of formattedLines) {
      this.journalLines.set(line.id, line);
    }

    return entry;
  }

  public postJournalEntry(
    input: {
      tenant_id: string;
      legal_entity_id: string;
      description: string;
      lines: Array<{
        account_id: string;
        debit: string;
        credit: string;
        description?: string;
        dimensions?: Record<string, string>;
      }>;
      posted_by: string;
      id?: string;
      transaction_date?: string;
      document_date?: string;
      currency_code?: string;
      exchange_rate?: string;
      reference?: string;
      source_type?: JournalSourceType;
      source_id?: string | null;
      idempotency_key?: string;
    }
  ): JournalEntry {
    const tenantId = input.tenant_id;
    const legalEntityId = input.legal_entity_id;

    // Validate Legal Entity belongs to Tenant
    const legalEntity = this.legalEntities.get(legalEntityId);
    if (!legalEntity || legalEntity.tenant_id !== tenantId) {
      throw new Error(`Legal entity ID ${legalEntityId} not found or unauthorized for tenant.`);
    }

    // 1. Idempotency Check
    if (input.idempotency_key) {
      const existingIdem = this.idempotencyKeys.get(`${tenantId}_${input.idempotency_key}`);
      if (existingIdem) {
        const existingEntry = this.journalEntries.get(existingIdem.journal_entry_id);
        if (existingEntry) return existingEntry;
      }
    }

    // 2. Validate Lines count >= 2
    if (!input.lines || input.lines.length < 2) {
      throw new Error('Accounting rule violation: A posted journal entry must contain at least 2 lines (debit & credit).');
    }

    // 3. Exact Double-Entry Balance Check
    const check = validateBalancedJournal(
      input.lines.map((l) => ({
        debit: l.debit,
        credit: l.credit,
        exchange_rate: input.exchange_rate || '1.0000',
      }))
    );

    if (!check.isBalanced) {
      throw new Error(
        `Accounting double-entry balancing failure: Total Debits (${check.totalDebit}) do not equal Total Credits (${check.totalCredit}). Difference = ${check.difference}`
      );
    }

    // 4. Validate Accounts & Posting Allowed
    for (const line of input.lines) {
      const account = this.accounts.get(line.account_id);
      if (!account || account.tenant_id !== tenantId || account.deleted_at !== null) {
        throw new Error(`Invalid account ID ${line.account_id}: Account not found in tenant COA.`);
      }
      if (account.status !== 'ACTIVE') {
        throw new Error(`Account ${account.code} - ${account.name} is INACTIVE. Posting rejected.`);
      }
      if (!account.posting_allowed) {
        throw new Error(`Account ${account.code} - ${account.name} is a header account. Direct postings not allowed.`);
      }
    }

    // 5. Fiscal Period Open Check
    const book = this.getOrCreateDefaultAccountingBook(tenantId, legalEntityId);
    const { periods } = this.getOrCreateDefaultFiscalCalendar(tenantId, legalEntityId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const transDate = input.transaction_date || todayStr;

    const matchedPeriod = periods.find(
      (p) => transDate >= p.start_date && transDate <= p.end_date
    );

    if (matchedPeriod && matchedPeriod.status === 'CLOSED') {
      throw new Error(`Fiscal period ${matchedPeriod.period_name} is CLOSED. Postings into closed periods are rejected.`);
    }

    const fiscalPeriodId = matchedPeriod ? matchedPeriod.id : periods[0]?.id || `fp_fallback`;

    // 6. Generate Sequential Entry Number
    const entryNumber = this.generateNextDocumentNumber(tenantId, 'JOURNAL' as any, legalEntityId);

    const entryId = input.id && this.journalEntries.has(input.id)
      ? input.id
      : `je_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const nowIso = now.toISOString();

    const formattedLines: JournalLine[] = input.lines.map((l, idx) => {
      const lineRate = input.exchange_rate || '1.0000';
      const deb = new Decimal(l.debit || '0').toFixed(2);
      const cred = new Decimal(l.credit || '0').toFixed(2);

      const baseDeb = new Decimal(deb).mul(lineRate).toFixed(2);
      const baseCred = new Decimal(cred).mul(lineRate).toFixed(2);

      return {
        id: `jel_${entryId}_${idx + 1}`,
        journal_entry_id: entryId,
        tenant_id: tenantId,
        account_id: l.account_id,
        debit: deb,
        credit: cred,
        currency_code: input.currency_code || book.base_currency_code,
        exchange_rate: lineRate,
        base_debit: baseDeb,
        base_credit: baseCred,
        description: l.description || input.description || '',
        dimensions: l.dimensions || {},
        reference: input.reference || '',
      };
    });

    const entry: JournalEntry = {
      id: entryId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      accounting_book_id: book.id,
      fiscal_period_id: fiscalPeriodId,
      entry_number: entryNumber,
      transaction_date: transDate,
      posting_date: nowIso.split('T')[0],
      document_date: input.document_date || transDate,
      reference: input.reference || '',
      description: input.description.trim(),
      source_type: input.source_type || 'MANUAL',
      source_id: input.source_id || null,
      currency_code: input.currency_code || book.base_currency_code,
      exchange_rate: input.exchange_rate || '1.0000',
      status: 'POSTED',
      created_by: input.posted_by,
      updated_by: input.posted_by,
      posted_by: input.posted_by,
      posted_at: nowIso,
      idempotency_key: input.idempotency_key || null,
      created_at: nowIso,
      updated_at: nowIso,
      deleted_at: null,
      version: 1,
      lines: formattedLines,
    };

    // Atomic persistence
    this.journalEntries.set(entry.id, entry);
    for (const line of formattedLines) {
      this.journalLines.set(line.id, line);
    }

    if (input.idempotency_key) {
      this.idempotencyKeys.set(`${tenantId}_${input.idempotency_key}`, {
        journal_entry_id: entry.id,
        created_at: nowIso,
      });
    }

    // Audit log
    this.recordAuditLog({
      tenant_id: tenantId,
      actor_id: input.posted_by,
      actor_email: 'user@system',
      action: 'ACCOUNTING.JOURNAL_POSTED',
      resource_type: 'journal_entry',
      resource_id: entry.id,
      changes: { entry_number: entry.entry_number, amount: check.totalDebit },
    });

    return entry;
  }

  public reverseJournalEntry(
    tenantId: string,
    journalId: string,
    actorId: string,
    reason?: string
  ): { original: JournalEntry; reversal: JournalEntry } {
    const original = this.journalEntries.get(journalId);
    if (!original || original.tenant_id !== tenantId || original.deleted_at !== null) {
      throw new Error('Journal entry not found.');
    }

    if (original.status !== 'POSTED') {
      throw new Error(`Only POSTED journal entries can be reversed. Current status is ${original.status}.`);
    }

    if (original.reversed_by_entry_id) {
      throw new Error(`Journal entry ${original.entry_number} has already been reversed.`);
    }

    // Reversing lines swap debit <-> credit
    const reversalLines = original.lines.map((line) => ({
      account_id: line.account_id,
      debit: line.credit,
      credit: line.debit,
      description: `Reversal of ${original.entry_number}: ${line.description}`,
      dimensions: line.dimensions,
    }));

    const reversal = this.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: original.legal_entity_id,
      description: `REVERSAL of ${original.entry_number}${reason ? `: ${reason}` : ''}`,
      lines: reversalLines,
      posted_by: actorId,
      source_type: 'REVERSAL',
      source_id: original.id,
      currency_code: original.currency_code,
      exchange_rate: original.exchange_rate,
      reference: `REV-${original.entry_number}`,
    });

    // Update original entry
    original.status = 'REVERSED';
    original.reversed_by_entry_id = reversal.id;
    original.updated_at = new Date().toISOString();
    original.version += 1;

    reversal.reversal_of_entry_id = original.id;

    this.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'user@system',
      action: 'ACCOUNTING.JOURNAL_REVERSED',
      resource_type: 'journal_entry',
      resource_id: original.id,
      changes: { reversal_entry_id: reversal.id, reason },
    });

    return { original, reversal };
  }

  public calculateTrialBalance(
    tenantId: string,
    legalEntityId: string,
    bookId?: string,
    startDate?: string,
    endDate?: string
  ): TrialBalanceReport {
    const book = bookId ? this.accountingBooks.get(bookId) : this.getOrCreateDefaultAccountingBook(tenantId, legalEntityId);
    const targetBookId = book ? book.id : '';

    const allAccounts = this.getAccounts(tenantId, legalEntityId, targetBookId).filter((a) => a.posting_allowed);
    const postedEntries = Array.from(this.journalEntries.values()).filter(
      (e) =>
        e.tenant_id === tenantId &&
        e.legal_entity_id === legalEntityId &&
        (e.status === 'POSTED' || e.status === 'REVERSED') &&
        (!targetBookId || e.accounting_book_id === targetBookId)
    );

    const sDate = startDate || '1970-01-01';
    const eDate = endDate || '2099-12-31';

    let totalOpeningDeb = Decimal.zero(4);
    let totalOpeningCred = Decimal.zero(4);
    let totalPeriodDeb = Decimal.zero(4);
    let totalPeriodCred = Decimal.zero(4);
    let totalClosingDeb = Decimal.zero(4);
    let totalClosingCred = Decimal.zero(4);

    const items: TrialBalanceItem[] = [];

    for (const acc of allAccounts) {
      let openDeb = Decimal.zero(4);
      let openCred = Decimal.zero(4);
      let perDeb = Decimal.zero(4);
      let perCred = Decimal.zero(4);

      for (const entry of postedEntries) {
        const transDate = entry.transaction_date;
        const isBeforeStart = transDate < sDate;
        const isInPeriod = transDate >= sDate && transDate <= eDate;

        if (!isBeforeStart && !isInPeriod) continue;

        for (const line of entry.lines) {
          if (line.account_id !== acc.id) continue;

          const deb = new Decimal(line.base_debit || '0');
          const cred = new Decimal(line.base_credit || '0');

          if (isBeforeStart) {
            openDeb = openDeb.add(deb);
            openCred = openCred.add(cred);
          } else if (isInPeriod) {
            perDeb = perDeb.add(deb);
            perCred = perCred.add(cred);
          }
        }
      }

      const netOpen = openDeb.sub(openCred);
      const openBalStr = netOpen.toString(2);

      const closeDeb = openDeb.add(perDeb);
      const closeCred = openCred.add(perCred);
      const netClose = closeDeb.sub(closeCred);
      const closeBalStr = netClose.toString(2);

      totalOpeningDeb = totalOpeningDeb.add(openDeb);
      totalOpeningCred = totalOpeningCred.add(openCred);
      totalPeriodDeb = totalPeriodDeb.add(perDeb);
      totalPeriodCred = totalPeriodCred.add(perCred);
      totalClosingDeb = totalClosingDeb.add(closeDeb);
      totalClosingCred = totalClosingCred.add(closeCred);

      items.push({
        account_id: acc.id,
        account_code: acc.code,
        account_name: acc.name,
        account_type: acc.account_type,
        normal_balance: acc.normal_balance,
        opening_debit: openDeb.toString(2),
        opening_credit: openCred.toString(2),
        opening_balance: openBalStr,
        period_debit: perDeb.toString(2),
        period_credit: perCred.toString(2),
        closing_debit: closeDeb.toString(2),
        closing_credit: closeCred.toString(2),
        closing_balance: closeBalStr,
      });
    }

    const isBalanced = totalClosingDeb.equals(totalClosingCred);

    return {
      legal_entity_id: legalEntityId,
      accounting_book_id: targetBookId,
      start_date: sDate,
      end_date: eDate,
      currency_code: book?.base_currency_code || 'INR',
      is_balanced: isBalanced,
      total_opening_debit: totalOpeningDeb.toString(2),
      total_opening_credit: totalOpeningCred.toString(2),
      total_period_debit: totalPeriodDeb.toString(2),
      total_period_credit: totalPeriodCred.toString(2),
      total_closing_debit: totalClosingDeb.toString(2),
      total_closing_credit: totalClosingCred.toString(2),
      items,
    };
  }

  public queryGeneralLedger(
    tenantId: string,
    accountId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 50
  ): GeneralLedgerStatement {
    const account = this.accounts.get(accountId);
    if (!account || account.tenant_id !== tenantId) {
      throw new Error(`Account ${accountId} not found in tenant COA.`);
    }

    const sDate = startDate || '1970-01-01';
    const eDate = endDate || '2099-12-31';

    const postedEntries = Array.from(this.journalEntries.values()).filter(
      (e) => e.tenant_id === tenantId && (e.status === 'POSTED' || e.status === 'REVERSED')
    );

    postedEntries.sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime() ||
        a.entry_number.localeCompare(b.entry_number)
    );

    let openingBalance = Decimal.zero(4);

    // Compute Opening Balance
    for (const entry of postedEntries) {
      if (entry.transaction_date >= sDate) break;
      for (const line of entry.lines) {
        if (line.account_id !== accountId) continue;
        const deb = new Decimal(line.base_debit || '0');
        const cred = new Decimal(line.base_credit || '0');
        if (account.normal_balance === 'DEBIT') {
          openingBalance = openingBalance.add(deb).sub(cred);
        } else {
          openingBalance = openingBalance.add(cred).sub(deb);
        }
      }
    }

    const periodLines: GeneralLedgerLine[] = [];
    let runningBalance = openingBalance;
    let totalDebit = Decimal.zero(4);
    let totalCredit = Decimal.zero(4);

    for (const entry of postedEntries) {
      if (entry.transaction_date < sDate) continue;
      if (entry.transaction_date > eDate) break;

      for (const line of entry.lines) {
        if (line.account_id !== accountId) continue;

        const deb = new Decimal(line.base_debit || '0');
        const cred = new Decimal(line.base_credit || '0');

        totalDebit = totalDebit.add(deb);
        totalCredit = totalCredit.add(cred);

        if (account.normal_balance === 'DEBIT') {
          runningBalance = runningBalance.add(deb).sub(cred);
        } else {
          runningBalance = runningBalance.add(cred).sub(deb);
        }

        periodLines.push({
          id: line.id,
          journal_entry_id: entry.id,
          entry_number: entry.entry_number,
          transaction_date: entry.transaction_date,
          posting_date: entry.posting_date,
          reference: line.reference || entry.reference,
          source_type: entry.source_type,
          description: line.description || entry.description,
          debit: deb.toString(2),
          credit: cred.toString(2),
          running_balance: runningBalance.toString(2),
          currency_code: line.currency_code,
          dimensions: line.dimensions,
        });
      }
    }

    const totalCount = periodLines.length;
    const startIndex = (page - 1) * limit;
    const paginatedLines = periodLines.slice(startIndex, startIndex + limit);

    return {
      account_id: account.id,
      account_code: account.code,
      account_name: account.name,
      account_type: account.account_type,
      normal_balance: account.normal_balance,
      currency_code: account.single_currency_code || 'INR',
      start_date: sDate,
      end_date: eDate,
      opening_balance: openingBalance.toString(2),
      total_debit: totalDebit.toString(2),
      total_credit: totalCredit.toString(2),
      closing_balance: runningBalance.toString(2),
      lines: paginatedLines,
      total_count: totalCount,
    };
  }

  // ==========================================
  // PHASE 4: SALES ENGINE & PRICING / TAX SERVICES
  // ==========================================

  public getOrCreateDefaultSalesAccounts(
    tenantId: string,
    legalEntityId: string,
    actorId: string = 'system'
  ): { arAccount: Account; revenueAccount: Account; taxPayableAccount: Account } {
    const existingAccounts = this.getAccounts(tenantId, legalEntityId);

    let arAccount = existingAccounts.find(
      (a) => a.account_subtype === 'ACCOUNTS_RECEIVABLE' && a.status === 'ACTIVE'
    );
    if (!arAccount) {
      arAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '1200',
        name: 'Accounts Receivable',
        account_type: 'ASSET',
        account_subtype: 'ACCOUNTS_RECEIVABLE',
        normal_balance: 'DEBIT',
        description: 'Default System Accounts Receivable',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    let revenueAccount = existingAccounts.find(
      (a) => (a.account_subtype === 'SALES' || a.account_subtype === 'OPERATING_REVENUE') && a.status === 'ACTIVE'
    );
    if (!revenueAccount) {
      revenueAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '4000',
        name: 'Sales Revenue',
        account_type: 'REVENUE',
        account_subtype: 'SALES',
        normal_balance: 'CREDIT',
        description: 'Default System Operating Sales Revenue',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    let taxPayableAccount = existingAccounts.find(
      (a) => a.account_subtype === 'TAX_PAYABLE' && a.status === 'ACTIVE'
    );
    if (!taxPayableAccount) {
      taxPayableAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '2200',
        name: 'Tax Output Payable',
        account_type: 'LIABILITY',
        account_subtype: 'TAX_PAYABLE',
        normal_balance: 'CREDIT',
        description: 'Default System Sales Tax Output Payable',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    return { arAccount, revenueAccount, taxPayableAccount };
  }

  public resolvePrice(
    tenantId: string,
    customerId: string,
    productId: string,
    variantId?: string | null,
    currencyCode: string = 'INR',
    quantity: number = 1
  ): { unit_price: string; price_list_id: string | null } {
    const customer = this.getCustomerById(tenantId, customerId);
    const activeLists = Array.from(this.priceLists.values()).filter(
      (pl) =>
        pl.tenant_id === tenantId &&
        pl.status === 'ACTIVE' &&
        pl.currency_code === (currencyCode || customer?.currency_code || 'INR') &&
        pl.deleted_at === null
    );

    // Filter matching price lists by customer group or general
    let matchingList = activeLists.find(
      (pl) => customer?.customer_group_id && pl.customer_group_id === customer.customer_group_id
    );
    if (!matchingList) {
      matchingList = activeLists[0];
    }

    if (matchingList) {
      const items = Array.from(this.priceListItems.values()).filter(
        (pli) =>
          pli.tenant_id === tenantId &&
          pli.price_list_id === matchingList!.id &&
          pli.status === 'ACTIVE' &&
          pli.min_quantity <= quantity &&
          pli.deleted_at === null
      );

      const matchItem = items.find(
        (pli) => (variantId && pli.variant_id === variantId) || pli.variant_id === productId
      ) || items[0];

      if (matchItem) {
        return { unit_price: matchItem.unit_price, price_list_id: matchingList.id };
      }
    }

    // Default base resolution
    return { unit_price: '100.00', price_list_id: matchingList?.id || null };
  }

  public calculateTax(
    tenantId: string,
    productId: string,
    jurisdictionCode?: string
  ): { tax_classification_code: string | null; tax_rate: string } {
    const classifs = this.getTaxClassificationsByProduct(tenantId, productId);
    if (classifs.length === 0) {
      throw new Error('Tax configuration unavailable');
    }
    const matched = classifs.find((c) => !jurisdictionCode || c.jurisdiction_code === jurisdictionCode) || classifs[0];

    if (!matched) {
      throw new Error('Tax configuration unavailable');
    }

    let rate = '18.00';
    if (matched.tax_category === 'REDUCED') rate = '5.00';
    else if (matched.tax_category === 'ZERO' || matched.tax_category === 'EXEMPT' || matched.tax_category === 'OUT_OF_SCOPE') rate = '0.00';

    return {
      tax_classification_code: matched.classification_code,
      tax_rate: rate,
    };
  }

  // --- QUOTATIONS ---

  public getQuotations(tenantId: string, params?: PaginationParams): PaginatedResult<Quotation> {
    let items = Array.from(this.quotations.values()).filter(
      (q) => q.tenant_id === tenantId && q.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((q) => q.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (q) =>
          q.quotation_number.toLowerCase().includes(qry) ||
          q.notes?.toLowerCase().includes(qry)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getQuotationById(tenantId: string, quotationId: string): Quotation | undefined {
    const q = this.quotations.get(quotationId);
    if (!q || q.tenant_id !== tenantId || q.deleted_at !== null) return undefined;
    return q;
  }

  public getQuotationVersions(tenantId: string, quotationId: string): Quotation[] {
    return (this.quotationVersions.get(quotationId) || []).filter((v) => v.tenant_id === tenantId);
  }

  public createQuotation(input: {
    tenant_id: string;
    customer_id: string;
    contact_id?: string | null;
    legal_entity_id: string;
    branch_id?: string | null;
    billing_address: Address;
    shipping_address: Address;
    currency_code?: string;
    exchange_rate?: string;
    price_list_id?: string | null;
    quotation_date?: string;
    valid_until?: string;
    salesperson_id?: string | null;
    notes?: string;
    terms_and_conditions?: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED';
      discount_value?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
    }>;
    created_by: string;
  }): Quotation {
    const customer = this.getCustomerById(input.tenant_id, input.customer_id);
    if (!customer) throw new Error('Customer does not exist.');

    const qtnNumber = this.generateNextDocumentNumber(input.tenant_id, 'QUOTATION', input.legal_entity_id, input.branch_id || undefined);
    const qtnId = `qtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const qtnDate = input.quotation_date || nowIso.split('T')[0];
    const validUntil = input.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    let docSubtotal = Decimal.zero(2);
    let docDiscount = Decimal.zero(2);
    let docTax = Decimal.zero(2);

    const formattedLines: QuotationLine[] = (input.lines || []).map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const priceRes = l.unit_price ? { unit_price: l.unit_price } : this.resolvePrice(input.tenant_id, input.customer_id, l.product_id, l.variant_id, input.currency_code, qty);
      const taxRes = l.tax_rate ? { tax_classification_code: l.tax_classification_code || null, tax_rate: l.tax_rate } : this.calculateTax(input.tenant_id, l.product_id);

      const unitPriceDec = new Decimal(priceRes.unit_price, 2);
      const subtotalDec = unitPriceDec.mul(qty);

      const discType = l.discount_type || 'PERCENTAGE';
      const discValDec = new Decimal(l.discount_value || '0', 2);
      let discAmtDec = Decimal.zero(2);
      if (discType === 'PERCENTAGE') {
        discAmtDec = subtotalDec.mul(discValDec.toString()).mul('0.01');
      } else {
        discAmtDec = discValDec;
      }

      const netLineDec = subtotalDec.sub(discAmtDec);
      const taxRateDec = new Decimal(taxRes.tax_rate, 2);
      const taxAmtDec = netLineDec.mul(taxRateDec.toString()).mul('0.01');
      const lineTotalDec = netLineDec.add(taxAmtDec);

      docSubtotal = docSubtotal.add(subtotalDec);
      docDiscount = docDiscount.add(discAmtDec);
      docTax = docTax.add(taxAmtDec);

      return {
        id: `qtnl_${qtnId}_${idx + 1}`,
        quotation_id: qtnId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Line item',
        quantity: qty,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        unit_price: unitPriceDec.toString(2),
        discount_type: discType,
        discount_value: discValDec.toString(2),
        discount_amount: discAmtDec.toString(2),
        tax_classification_code: taxRes.tax_classification_code,
        tax_rate: taxRateDec.toString(2),
        tax_amount: taxAmtDec.toString(2),
        line_subtotal: subtotalDec.toString(2),
        line_total: lineTotalDec.toString(2),
      };
    });

    const grandTotalDec = docSubtotal.sub(docDiscount).add(docTax);

    const quotation: Quotation = {
      id: qtnId,
      tenant_id: input.tenant_id,
      quotation_number: qtnNumber,
      version_number: 1,
      customer_id: input.customer_id,
      contact_id: input.contact_id || null,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      currency_code: input.currency_code || customer.currency_code || 'INR',
      exchange_rate: input.exchange_rate || '1.0000',
      price_list_id: input.price_list_id || null,
      quotation_date: qtnDate,
      valid_until: validUntil,
      salesperson_id: input.salesperson_id || null,
      notes: input.notes || '',
      terms_and_conditions: input.terms_and_conditions || 'Standard terms apply.',
      subtotal: docSubtotal.toString(2),
      discount_total: docDiscount.toString(2),
      tax_total: docTax.toString(2),
      grand_total: grandTotalDec.toString(2),
      status: 'DRAFT',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.quotations.set(quotation.id, quotation);
    for (const line of formattedLines) {
      this.quotationLines.set(line.id, line);
    }

    return quotation;
  }

  public updateQuotationStatus(
    tenantId: string,
    quotationId: string,
    newStatus: QuotationStatus,
    actorId: string
  ): Quotation {
    const quotation = this.getQuotationById(tenantId, quotationId);
    if (!quotation) throw new Error('Quotation not found.');

    const allowedTransitions: Record<QuotationStatus, QuotationStatus[]> = {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      ACCEPTED: ['CANCELLED'],
      REJECTED: [],
      EXPIRED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[quotation.status].includes(newStatus)) {
      throw new Error(`Invalid quotation state transition from ${quotation.status} to ${newStatus}.`);
    }

    // Versioning check: if transitioning from SENT or ACCEPTED, preserve current version in history
    if (quotation.status === 'SENT' || quotation.status === 'ACCEPTED') {
      const existingHistory = this.quotationVersions.get(quotationId) || [];
      existingHistory.push({ ...quotation });
      this.quotationVersions.set(quotationId, existingHistory);
    }

    const now = new Date().toISOString();
    quotation.status = newStatus;
    quotation.updated_at = now;
    quotation.updated_by = actorId;

    this.quotations.set(quotation.id, quotation);
    return quotation;
  }

  public convertQuotationToSalesOrder(
    tenantId: string,
    quotationId: string,
    actorId: string
  ): SalesOrder {
    const quotation = this.getQuotationById(tenantId, quotationId);
    if (!quotation) throw new Error('Quotation not found.');

    if (quotation.converted_sales_order_id) {
      const existingSO = this.salesOrders.get(quotation.converted_sales_order_id);
      if (existingSO) return existingSO;
    }

    if (quotation.status !== 'SENT' && quotation.status !== 'ACCEPTED') {
      throw new Error('Only SENT or ACCEPTED quotations can be converted to Sales Orders.');
    }

    const soNumber = this.generateNextDocumentNumber(tenantId, 'SALES_ORDER', quotation.legal_entity_id, quotation.branch_id || undefined);
    const soId = `so_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const orderLines: SalesOrderLine[] = quotation.lines.map((ql, idx) => ({
      id: `sol_${soId}_${idx + 1}`,
      sales_order_id: soId,
      tenant_id: tenantId,
      product_id: ql.product_id,
      variant_id: ql.variant_id,
      sku: ql.sku,
      description: ql.description,
      quantity_ordered: ql.quantity,
      quantity_fulfilled: 0,
      quantity_remaining: ql.quantity,
      uom_id: ql.uom_id,
      unit_price: ql.unit_price,
      discount_type: ql.discount_type,
      discount_value: ql.discount_value,
      discount_amount: ql.discount_amount,
      tax_classification_code: ql.tax_classification_code,
      tax_rate: ql.tax_rate,
      tax_amount: ql.tax_amount,
      line_subtotal: ql.line_subtotal,
      line_total: ql.line_total,
    }));

    const salesOrder: SalesOrder = {
      id: soId,
      tenant_id: tenantId,
      order_number: soNumber,
      customer_id: quotation.customer_id,
      contact_id: quotation.contact_id,
      legal_entity_id: quotation.legal_entity_id,
      branch_id: quotation.branch_id,
      currency_code: quotation.currency_code,
      exchange_rate: quotation.exchange_rate,
      price_list_id: quotation.price_list_id,
      order_date: nowIso.split('T')[0],
      billing_address: quotation.billing_address,
      shipping_address: quotation.shipping_address,
      source_quotation_id: quotationId,
      notes: quotation.notes,
      terms_and_conditions: quotation.terms_and_conditions,
      subtotal: quotation.subtotal,
      discount_total: quotation.discount_total,
      tax_total: quotation.tax_total,
      grand_total: quotation.grand_total,
      status: 'CONFIRMED',
      lines: orderLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    this.salesOrders.set(salesOrder.id, salesOrder);
    for (const line of orderLines) {
      this.salesOrderLines.set(line.id, line);
    }

    quotation.status = 'ACCEPTED';
    quotation.converted_sales_order_id = salesOrder.id;
    quotation.updated_at = nowIso;
    this.quotations.set(quotation.id, quotation);

    const relId = `docrel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.documentRelationships.set(relId, {
      id: relId,
      tenant_id: tenantId,
      source_type: 'QUOTATION',
      source_id: quotationId,
      target_type: 'SALES_ORDER',
      target_id: salesOrder.id,
      relation_type: 'CONVERTED_FROM',
      created_at: nowIso,
    });

    return salesOrder;
  }

  // --- SALES ORDERS ---

  public getSalesOrders(tenantId: string, params?: PaginationParams): PaginatedResult<SalesOrder> {
    let items = Array.from(this.salesOrders.values()).filter(
      (so) => so.tenant_id === tenantId && so.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((so) => so.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (so) => so.order_number.toLowerCase().includes(qry) || so.notes?.toLowerCase().includes(qry)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getSalesOrderById(tenantId: string, orderId: string): SalesOrder | undefined {
    const so = this.salesOrders.get(orderId);
    if (!so || so.tenant_id !== tenantId || so.deleted_at !== null) return undefined;
    return so;
  }

  public createSalesOrder(input: {
    tenant_id: string;
    customer_id: string;
    contact_id?: string | null;
    legal_entity_id: string;
    branch_id?: string | null;
    billing_address: Address;
    shipping_address: Address;
    currency_code?: string;
    exchange_rate?: string;
    order_date?: string;
    requested_delivery_date?: string | null;
    notes?: string;
    terms_and_conditions?: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED';
      discount_value?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
    }>;
    created_by: string;
  }): SalesOrder {
    const customer = this.getCustomerById(input.tenant_id, input.customer_id);
    if (!customer) throw new Error('Customer does not exist.');

    const soNumber = this.generateNextDocumentNumber(input.tenant_id, 'SALES_ORDER', input.legal_entity_id, input.branch_id || undefined);
    const soId = `so_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    let docSubtotal = Decimal.zero(2);
    let docDiscount = Decimal.zero(2);
    let docTax = Decimal.zero(2);

    const formattedLines: SalesOrderLine[] = (input.lines || []).map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const priceRes = l.unit_price ? { unit_price: l.unit_price } : this.resolvePrice(input.tenant_id, input.customer_id, l.product_id, l.variant_id, input.currency_code, qty);
      const taxRes = l.tax_rate ? { tax_classification_code: l.tax_classification_code || null, tax_rate: l.tax_rate } : this.calculateTax(input.tenant_id, l.product_id);

      const unitPriceDec = new Decimal(priceRes.unit_price, 2);
      const subtotalDec = unitPriceDec.mul(qty);

      const discType = l.discount_type || 'PERCENTAGE';
      const discValDec = new Decimal(l.discount_value || '0', 2);
      let discAmtDec = Decimal.zero(2);
      if (discType === 'PERCENTAGE') {
        discAmtDec = subtotalDec.mul(discValDec.toString()).mul('0.01');
      } else {
        discAmtDec = discValDec;
      }

      const netLineDec = subtotalDec.sub(discAmtDec);
      const taxRateDec = new Decimal(taxRes.tax_rate, 2);
      const taxAmtDec = netLineDec.mul(taxRateDec.toString()).mul('0.01');
      const lineTotalDec = netLineDec.add(taxAmtDec);

      docSubtotal = docSubtotal.add(subtotalDec);
      docDiscount = docDiscount.add(discAmtDec);
      docTax = docTax.add(taxAmtDec);

      return {
        id: `sol_${soId}_${idx + 1}`,
        sales_order_id: soId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Order Item',
        quantity_ordered: qty,
        quantity_fulfilled: 0,
        quantity_remaining: qty,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        unit_price: unitPriceDec.toString(2),
        discount_type: discType,
        discount_value: discValDec.toString(2),
        discount_amount: discAmtDec.toString(2),
        tax_classification_code: taxRes.tax_classification_code,
        tax_rate: taxRateDec.toString(2),
        tax_amount: taxAmtDec.toString(2),
        line_subtotal: subtotalDec.toString(2),
        line_total: lineTotalDec.toString(2),
      };
    });

    const grandTotalDec = docSubtotal.sub(docDiscount).add(docTax);

    const salesOrder: SalesOrder = {
      id: soId,
      tenant_id: input.tenant_id,
      order_number: soNumber,
      customer_id: input.customer_id,
      contact_id: input.contact_id || null,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      currency_code: input.currency_code || customer.currency_code || 'INR',
      exchange_rate: input.exchange_rate || '1.0000',
      order_date: input.order_date || nowIso.split('T')[0],
      requested_delivery_date: input.requested_delivery_date || null,
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      notes: input.notes || '',
      terms_and_conditions: input.terms_and_conditions || 'Standard terms apply.',
      subtotal: docSubtotal.toString(2),
      discount_total: docDiscount.toString(2),
      tax_total: docTax.toString(2),
      grand_total: grandTotalDec.toString(2),
      status: 'CONFIRMED',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.salesOrders.set(salesOrder.id, salesOrder);
    for (const line of formattedLines) {
      this.salesOrderLines.set(line.id, line);
    }

    return salesOrder;
  }

  public updateSalesOrderStatus(
    tenantId: string,
    orderId: string,
    newStatus: SalesOrderStatus,
    actorId: string
  ): SalesOrder {
    const order = this.getSalesOrderById(tenantId, orderId);
    if (!order) throw new Error('Sales Order not found.');

    const allowedTransitions: Record<SalesOrderStatus, SalesOrderStatus[]> = {
      DRAFT: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
      ON_HOLD: ['CONFIRMED', 'CANCELLED'],
      PARTIALLY_FULFILLED: ['FULFILLED', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
      FULFILLED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[order.status].includes(newStatus)) {
      throw new Error(`Invalid order state transition from ${order.status} to ${newStatus}.`);
    }

    const now = new Date().toISOString();
    order.status = newStatus;
    order.updated_at = now;
    order.updated_by = actorId;

    this.salesOrders.set(order.id, order);
    return order;
  }

  public convertSalesOrderToInvoice(
    tenantId: string,
    orderId: string,
    actorId: string
  ): Invoice {
    const order = this.getSalesOrderById(tenantId, orderId);
    if (!order) throw new Error('Sales Order not found.');

    const invLines = order.lines.map((sol) => ({
      product_id: sol.product_id,
      variant_id: sol.variant_id,
      sku: sol.sku,
      description: sol.description,
      quantity: sol.quantity_ordered,
      uom_id: sol.uom_id,
      unit_price: sol.unit_price,
      discount_type: sol.discount_type,
      discount_value: sol.discount_value,
      tax_classification_code: sol.tax_classification_code,
      tax_rate: sol.tax_rate,
      sales_order_line_id: sol.id,
    }));

    const invoice = this.createInvoiceDraft({
      tenant_id: tenantId,
      customer_id: order.customer_id,
      contact_id: order.contact_id,
      legal_entity_id: order.legal_entity_id,
      branch_id: order.branch_id,
      currency_code: order.currency_code,
      exchange_rate: order.exchange_rate,
      billing_address: order.billing_address,
      shipping_address: order.shipping_address,
      source_sales_order_id: orderId,
      source_quotation_id: order.source_quotation_id,
      lines: invLines,
      created_by: actorId,
    });

    const relId = `docrel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.documentRelationships.set(relId, {
      id: relId,
      tenant_id: tenantId,
      source_type: 'SALES_ORDER',
      source_id: orderId,
      target_type: 'INVOICE',
      target_id: invoice.id,
      relation_type: 'INVOICED_BY',
      created_at: new Date().toISOString(),
    });

    return invoice;
  }

  // --- INVOICE ENGINE ---

  public getInvoices(tenantId: string, params?: PaginationParams): PaginatedResult<Invoice> {
    let items = Array.from(this.invoices.values()).filter(
      (inv) => inv.tenant_id === tenantId && inv.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((inv) => inv.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (inv) => inv.invoice_number.toLowerCase().includes(qry) || inv.reference?.toLowerCase().includes(qry)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getInvoiceById(tenantId: string, invoiceId: string): Invoice | undefined {
    const inv = this.invoices.get(invoiceId);
    if (!inv || inv.tenant_id !== tenantId || inv.deleted_at !== null) return undefined;
    return inv;
  }

  public createInvoiceDraft(input: {
    tenant_id: string;
    invoice_type?: InvoiceType;
    customer_id: string;
    contact_id?: string | null;
    legal_entity_id: string;
    branch_id?: string | null;
    currency_code?: string;
    exchange_rate?: string;
    invoice_date?: string;
    due_date?: string;
    payment_terms_id?: string | null;
    billing_address: Address;
    shipping_address: Address;
    reference?: string;
    source_sales_order_id?: string | null;
    source_quotation_id?: string | null;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED';
      discount_value?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
      sales_order_line_id?: string | null;
    }>;
    created_by: string;
  }): Invoice {
    const customer = this.getCustomerById(input.tenant_id, input.customer_id);
    if (!customer) throw new Error('Customer does not exist.');

    const invType = input.invoice_type || 'STANDARD';
    const docType: DocumentType = invType === 'CREDIT_NOTE' ? 'CREDIT_NOTE' : invType === 'DEBIT_NOTE' ? 'DEBIT_NOTE' : 'INVOICE';
    const invNumber = this.generateNextDocumentNumber(input.tenant_id, docType, input.legal_entity_id, input.branch_id || undefined);
    const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const invDate = input.invoice_date || nowIso.split('T')[0];
    const dueDate = input.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    let docSubtotal = Decimal.zero(2);
    let docDiscount = Decimal.zero(2);
    let docTax = Decimal.zero(2);

    const formattedLines: InvoiceLine[] = (input.lines || []).map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const priceRes = l.unit_price ? { unit_price: l.unit_price } : this.resolvePrice(input.tenant_id, input.customer_id, l.product_id, l.variant_id, input.currency_code, qty);
      const taxRes = l.tax_rate ? { tax_classification_code: l.tax_classification_code || null, tax_rate: l.tax_rate } : this.calculateTax(input.tenant_id, l.product_id);

      const unitPriceDec = new Decimal(priceRes.unit_price, 2);
      const subtotalDec = unitPriceDec.mul(qty);

      const discType = l.discount_type || 'PERCENTAGE';
      const discValDec = new Decimal(l.discount_value || '0', 2);
      let discAmtDec = Decimal.zero(2);
      if (discType === 'PERCENTAGE') {
        discAmtDec = subtotalDec.mul(discValDec.toString()).mul('0.01');
      } else {
        discAmtDec = discValDec;
      }

      const netLineDec = subtotalDec.sub(discAmtDec);
      const taxRateDec = new Decimal(taxRes.tax_rate, 2);
      const taxAmtDec = netLineDec.mul(taxRateDec.toString()).mul('0.01');
      const lineTotalDec = netLineDec.add(taxAmtDec);

      docSubtotal = docSubtotal.add(subtotalDec);
      docDiscount = docDiscount.add(discAmtDec);
      docTax = docTax.add(taxAmtDec);

      return {
        id: `invl_${invId}_${idx + 1}`,
        invoice_id: invId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Invoice item',
        quantity: qty,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        unit_price: unitPriceDec.toString(2),
        discount_type: discType,
        discount_value: discValDec.toString(2),
        discount_amount: discAmtDec.toString(2),
        tax_classification_code: taxRes.tax_classification_code,
        tax_rate: taxRateDec.toString(2),
        tax_amount: taxAmtDec.toString(2),
        line_subtotal: subtotalDec.toString(2),
        line_total: lineTotalDec.toString(2),
        sales_order_line_id: l.sales_order_line_id || null,
      };
    });

    const grandTotalDec = docSubtotal.sub(docDiscount).add(docTax);

    const invoice: Invoice = {
      id: invId,
      tenant_id: input.tenant_id,
      invoice_number: invNumber,
      invoice_type: invType,
      customer_id: input.customer_id,
      contact_id: input.contact_id || null,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      currency_code: input.currency_code || customer.currency_code || 'INR',
      exchange_rate: input.exchange_rate || '1.0000',
      invoice_date: invDate,
      due_date: dueDate,
      payment_terms_id: input.payment_terms_id || null,
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      reference: input.reference || '',
      source_sales_order_id: input.source_sales_order_id || null,
      source_quotation_id: input.source_quotation_id || null,
      subtotal: docSubtotal.toString(2),
      discount_total: docDiscount.toString(2),
      tax_total: docTax.toString(2),
      grand_total: grandTotalDec.toString(2),
      status: 'DRAFT',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.invoices.set(invoice.id, invoice);
    for (const line of formattedLines) {
      this.invoiceLines.set(line.id, line);
    }

    return invoice;
  }

  /**
   * ATOMIC INVOICE POSTING ENGINE
   * Invokes General Ledger Posting Service in a strict atomic boundary.
   */
  public postInvoice(
    tenantId: string,
    invoiceId: string,
    actorId: string,
    idempotencyKey?: string
  ): Invoice {
    const invoice = this.getInvoiceById(tenantId, invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.status === 'POSTED') {
      return invoice; // Idempotent return
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error(`Cannot post invoice in ${invoice.status} status.`);
    }

    // 1. Get/Create System Sales Accounts for Legal Entity
    const { arAccount, revenueAccount, taxPayableAccount } = this.getOrCreateDefaultSalesAccounts(
      tenantId,
      invoice.legal_entity_id,
      actorId
    );

    // 2. Prepare Ledger Lines for Accounting Integration
    // Accounts Receivable (DEBIT) = Grand Total
    // Revenue (CREDIT) = Subtotal - Discount
    // Tax Output Payable (CREDIT) = Tax Total
    const netRevenueStr = new Decimal(invoice.subtotal, 2).sub(new Decimal(invoice.discount_total, 2)).toString(2);

    const journalLines = [
      {
        account_id: arAccount.id,
        debit: invoice.grand_total,
        credit: '0.00',
        description: `Accounts Receivable for Invoice ${invoice.invoice_number}`,
      },
      {
        account_id: revenueAccount.id,
        debit: '0.00',
        credit: netRevenueStr,
        description: `Sales Revenue for Invoice ${invoice.invoice_number}`,
      },
    ];

    if (new Decimal(invoice.tax_total, 2).isPositive()) {
      journalLines.push({
        account_id: taxPayableAccount.id,
        debit: '0.00',
        credit: invoice.tax_total,
        description: `Sales Tax Payable for Invoice ${invoice.invoice_number}`,
      });
    }

    // 3. Post to General Ledger atomically
    try {
      const journalEntry = this.postJournalEntry({
        tenant_id: tenantId,
        legal_entity_id: invoice.legal_entity_id,
        description: `Sales Invoice ${invoice.invoice_number}`,
        transaction_date: invoice.invoice_date,
        document_date: invoice.invoice_date,
        currency_code: invoice.currency_code,
        exchange_rate: invoice.exchange_rate,
        reference: invoice.invoice_number,
        source_type: 'INVOICE',
        source_id: invoice.id,
        posted_by: actorId,
        idempotency_key: idempotencyKey || `post_inv_${invoice.id}`,
        lines: journalLines,
      });

      // Update Invoice status ONLY on journal commit success
      const now = new Date().toISOString();
      invoice.status = 'POSTED';
      invoice.posted_at = now;
      invoice.posted_by = actorId;
      invoice.journal_entry_id = journalEntry.id;
      invoice.updated_at = now;
      invoice.updated_by = actorId;

      this.invoices.set(invoice.id, invoice);

      // Create AR Receivable automatically
      try {
        this.createReceivableFromInvoice(tenantId, invoice, actorId);
      } catch (arErr) {
        console.error('Failed to create AR receivable for posted invoice:', arErr);
      }

      // Record Audit Event
      this.auditLogs.push({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenant_id: tenantId,
        actor_id: actorId,
        actor_email: 'user@tenant.com',
        action: 'INVOICE_POSTED',
        resource_type: 'INVOICE',
        resource_id: invoice.id,
        timestamp: now,
      });

      return invoice;
    } catch (err: unknown) {
      // ATOMIC ROLLBACK: invoice stays in DRAFT
      throw new Error(`Invoice Posting Failed: ${(err as Error).message}`);
    }
  }

  public voidInvoice(
    tenantId: string,
    invoiceId: string,
    reason: string,
    actorId: string
  ): Invoice {
    const invoice = this.getInvoiceById(tenantId, invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.status === 'VOIDED') return invoice;

    const now = new Date().toISOString();

    if (invoice.status === 'POSTED' && invoice.journal_entry_id) {
      // Perform journal reversal
      const reversalEntry = this.reverseJournalEntry(
        tenantId,
        invoice.journal_entry_id,
        `Voiding Invoice ${invoice.invoice_number}: ${reason}`,
        actorId
      );
      invoice.reversal_journal_entry_id = reversalEntry.reversal.id;
    }

    invoice.status = 'VOIDED';
    invoice.voided_at = now;
    invoice.voided_by = actorId;
    invoice.updated_at = now;
    invoice.updated_by = actorId;

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  // --- SALES DASHBOARD METRICS ---

  public getSalesDashboardOverview(
    tenantId: string,
    legalEntityId?: string
  ): SalesDashboardOverview {
    const invoices = Array.from(this.invoices.values()).filter(
      (i) => i.tenant_id === tenantId && (!legalEntityId || i.legal_entity_id === legalEntityId) && i.deleted_at === null
    );
    const quotations = Array.from(this.quotations.values()).filter(
      (q) => q.tenant_id === tenantId && (!legalEntityId || q.legal_entity_id === legalEntityId) && q.deleted_at === null
    );
    const salesOrders = Array.from(this.salesOrders.values()).filter(
      (so) => so.tenant_id === tenantId && (!legalEntityId || so.legal_entity_id === legalEntityId) && so.deleted_at === null
    );

    let salesDec = Decimal.zero(2);
    let outstandingDec = Decimal.zero(2);
    let paidDec = Decimal.zero(2);
    let overdueDec = Decimal.zero(2);

    const todayStr = new Date().toISOString().split('T')[0];

    for (const inv of invoices) {
      if (inv.status === 'POSTED') {
        const grandDec = new Decimal(inv.grand_total, 2);
        salesDec = salesDec.add(grandDec);
        outstandingDec = outstandingDec.add(grandDec);

        if (inv.due_date < todayStr) {
          overdueDec = overdueDec.add(grandDec);
        }
      } else if (inv.status === 'PAID') {
        const grandDec = new Decimal(inv.grand_total, 2);
        salesDec = salesDec.add(grandDec);
        paidDec = paidDec.add(grandDec);
      }
    }

    const totalQuotes = quotations.length;
    const acceptedQuotes = quotations.filter((q) => q.status === 'ACCEPTED').length;
    const convRate = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) + '%' : '0.0%';

    const currencyCode = invoices[0]?.currency_code || quotations[0]?.currency_code || 'INR';

    return {
      currency_code: currencyCode,
      total_sales: salesDec.toString(2),
      total_outstanding: outstandingDec.toString(2),
      total_paid: paidDec.toString(2),
      total_overdue: overdueDec.toString(2),
      quotations_count: quotations.length,
      sales_orders_count: salesOrders.length,
      invoices_count: invoices.length,
      quotation_conversion_rate: convRate,
    };
  }

  // ==========================================
  // PHASE 5: FULL COMMERCIAL DOCUMENTS ENGINE
  // ==========================================

  // --- FULFILLMENTS ---

  public getFulfillments(tenantId: string, params?: PaginationParams): PaginatedResult<Fulfillment> {
    let items = Array.from(this.fulfillments.values()).filter(
      (f) => f.tenant_id === tenantId && f.deleted_at === null
    );
    if (params?.status) {
      items = items.filter((f) => f.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (f) => f.fulfillment_number.toLowerCase().includes(qry) || f.notes?.toLowerCase().includes(qry)
      );
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getFulfillmentById(tenantId: string, id: string): Fulfillment | undefined {
    const f = this.fulfillments.get(id);
    if (!f || f.tenant_id !== tenantId || f.deleted_at !== null) return undefined;
    return f;
  }

  public createFulfillment(input: {
    tenant_id: string;
    sales_order_id: string;
    notes?: string;
    created_by: string;
    lines: Array<{
      sales_order_line_id: string;
      product_id: string;
      quantity: number;
      uom_id: string;
      warehouse_id?: string | null;
    }>;
  }): Fulfillment {
    const order = this.getSalesOrderById(input.tenant_id, input.sales_order_id);
    if (!order) throw new Error('Sales Order not found.');

    if (order.status !== 'CONFIRMED' && order.status !== 'PARTIALLY_FULFILLED') {
      throw new Error(`Cannot fulfill sales order in status ${order.status}.`);
    }

    const fulNumber = this.generateNextDocumentNumber(input.tenant_id, 'FULFILLMENT' as any, order.legal_entity_id, order.branch_id || undefined);
    const fulId = `ful_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const formattedLines: FulfillmentLine[] = [];

    for (const l of input.lines) {
      const orderLine = order.lines.find((sol) => sol.id === l.sales_order_line_id);
      if (!orderLine) throw new Error(`Sales Order Line ${l.sales_order_line_id} not found.`);

      if (l.quantity <= 0) throw new Error('Fulfillment quantity must be greater than zero.');
      if (l.quantity > orderLine.quantity_remaining) {
        throw new Error(`Fulfillment quantity ${l.quantity} exceeds remaining order line quantity ${orderLine.quantity_remaining}.`);
      }

      // Update remaining quantity on sales order line
      orderLine.quantity_fulfilled += l.quantity;
      orderLine.quantity_remaining -= l.quantity;

      formattedLines.push({
        id: `full_${fulId}_${formattedLines.length + 1}`,
        fulfillment_id: fulId,
        tenant_id: input.tenant_id,
        sales_order_line_id: l.sales_order_line_id,
        product_id: l.product_id,
        quantity: l.quantity,
        uom_id: l.uom_id,
        warehouse_id: l.warehouse_id || null,
      });
    }

    // Determine new status for the Sales Order
    const allFulfilled = order.lines.every((sol) => sol.quantity_remaining === 0);
    const anyFulfilled = order.lines.some((sol) => sol.quantity_fulfilled > 0);

    if (allFulfilled) {
      order.status = 'FULFILLED';
    } else if (anyFulfilled) {
      order.status = 'PARTIALLY_FULFILLED';
    }
    order.updated_at = nowIso;
    order.updated_by = input.created_by;
    order.version += 1;
    this.salesOrders.set(order.id, order);

    const fulfillment: Fulfillment = {
      id: fulId,
      tenant_id: input.tenant_id,
      fulfillment_number: fulNumber,
      sales_order_id: input.sales_order_id,
      customer_id: order.customer_id,
      legal_entity_id: order.legal_entity_id,
      branch_id: order.branch_id,
      status: 'FULFILLED',
      lines: formattedLines,
      notes: input.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.fulfillments.set(fulfillment.id, fulfillment);
    for (const line of formattedLines) {
      this.fulfillmentLines.set(line.id, line);
    }

    // Document Status History
    const histId = `fsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.documentStatusHistories.set(histId, {
      id: histId,
      tenant_id: input.tenant_id,
      document_type: 'FULFILLMENT',
      document_id: fulfillment.id,
      from_status: 'PENDING',
      to_status: 'FULFILLED',
      actor_id: input.created_by,
      timestamp: nowIso,
      reason: 'Fulfillment processed.',
    });

    // Document relationship
    const relId = `docrel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.documentRelationships.set(relId, {
      id: relId,
      tenant_id: input.tenant_id,
      source_type: 'SALES_ORDER',
      source_id: input.sales_order_id,
      target_type: 'DELIVERY',
      target_id: fulfillment.id,
      relation_type: 'FULFILLED_BY',
      created_at: nowIso,
    });

    // Audit Log
    this.auditLogs.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: input.tenant_id,
      actor_id: input.created_by,
      actor_email: 'user@tenant.com',
      action: 'FULFILLMENT_CREATED',
      resource_type: 'FULFILLMENT' as any,
      resource_id: fulfillment.id,
      timestamp: nowIso,
    });

    return fulfillment;
  }

  // --- CREDIT NOTES ---

  public getCreditNotes(tenantId: string, params?: PaginationParams): PaginatedResult<CreditNote> {
    let items = Array.from(this.creditNotes.values()).filter(
      (cn) => cn.tenant_id === tenantId && cn.deleted_at === null
    );
    if (params?.status) {
      items = items.filter((cn) => cn.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (cn) => cn.credit_note_number.toLowerCase().includes(qry) || cn.reason.toLowerCase().includes(qry)
      );
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getCreditNoteById(tenantId: string, id: string): CreditNote | undefined {
    const cn = this.creditNotes.get(id);
    if (!cn || cn.tenant_id !== tenantId || cn.deleted_at !== null) return undefined;
    return cn;
  }

  public createCreditNoteDraft(input: {
    tenant_id: string;
    original_invoice_id: string;
    reason: string;
    created_by: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED';
      discount_value?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
      invoice_line_id?: string | null;
    }>;
  }): CreditNote {
    const invoice = this.getInvoiceById(input.tenant_id, input.original_invoice_id);
    if (!invoice) throw new Error('Original Invoice not found.');

    if (invoice.status !== 'POSTED') {
      throw new Error('Can only issue credit note against a posted invoice.');
    }

    const cnNumber = this.generateNextDocumentNumber(input.tenant_id, 'CREDIT_NOTE', invoice.legal_entity_id, invoice.branch_id || undefined);
    const cnId = `cn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    let docSubtotal = Decimal.zero(2);
    let docDiscount = Decimal.zero(2);
    let docTax = Decimal.zero(2);

    const formattedLines: CreditNoteLine[] = input.lines.map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const priceRes = l.unit_price ? { unit_price: l.unit_price } : this.resolvePrice(input.tenant_id, invoice.customer_id, l.product_id, l.variant_id, invoice.currency_code, qty);
      const taxRes = l.tax_rate ? { tax_classification_code: l.tax_classification_code || null, tax_rate: l.tax_rate } : this.calculateTax(input.tenant_id, l.product_id);

      const unitPriceDec = new Decimal(priceRes.unit_price, 2);
      const subtotalDec = unitPriceDec.mul(qty);

      const discType = l.discount_type || 'PERCENTAGE';
      const discValDec = new Decimal(l.discount_value || '0', 2);
      let discAmtDec = Decimal.zero(2);
      if (discType === 'PERCENTAGE') {
        discAmtDec = subtotalDec.mul(discValDec.toString()).mul('0.01');
      } else {
        discAmtDec = discValDec;
      }

      const netLineDec = subtotalDec.sub(discAmtDec);
      const taxRateDec = new Decimal(taxRes.tax_rate, 2);
      const taxAmtDec = netLineDec.mul(taxRateDec.toString()).mul('0.01');
      const lineTotalDec = netLineDec.add(taxAmtDec);

      docSubtotal = docSubtotal.add(subtotalDec);
      docDiscount = docDiscount.add(discAmtDec);
      docTax = docTax.add(taxAmtDec);

      return {
        id: `cnl_${cnId}_${idx + 1}`,
        credit_note_id: cnId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Credit item',
        quantity: qty,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        unit_price: unitPriceDec.toString(2),
        discount_type: discType,
        discount_value: discValDec.toString(2),
        discount_amount: discAmtDec.toString(2),
        tax_classification_code: taxRes.tax_classification_code,
        tax_rate: taxRateDec.toString(2),
        tax_amount: taxAmtDec.toString(2),
        line_subtotal: subtotalDec.toString(2),
        line_total: lineTotalDec.toString(2),
        invoice_line_id: l.invoice_line_id || null,
      };
    });

    const grandTotalDec = docSubtotal.sub(docDiscount).add(docTax);

    // Ensure we don't over-credit: total credit notes on this invoice shouldn't exceed grand_total
    const existingCNs = Array.from(this.creditNotes.values()).filter(
      (c) => c.tenant_id === input.tenant_id && c.original_invoice_id === input.original_invoice_id && c.status === 'ISSUED'
    );
    let alreadyCredited = Decimal.zero(2);
    for (const ec of existingCNs) {
      alreadyCredited = alreadyCredited.add(new Decimal(ec.grand_total, 2));
    }
    const eligibleAmount = new Decimal(invoice.grand_total, 2).sub(alreadyCredited);
    if (grandTotalDec.sub(eligibleAmount).isPositive()) {
      throw new Error(`Credit Note amount ${grandTotalDec.toString(2)} exceeds remaining eligible invoice amount ${eligibleAmount.toString(2)}.`);
    }

    const creditNote: CreditNote = {
      id: cnId,
      tenant_id: input.tenant_id,
      credit_note_number: cnNumber,
      original_invoice_id: input.original_invoice_id,
      customer_id: invoice.customer_id,
      legal_entity_id: invoice.legal_entity_id,
      branch_id: invoice.branch_id,
      currency_code: invoice.currency_code,
      exchange_rate: invoice.exchange_rate,
      reason: input.reason,
      subtotal: docSubtotal.toString(2),
      discount_total: docDiscount.toString(2),
      tax_total: docTax.toString(2),
      grand_total: grandTotalDec.toString(2),
      status: 'DRAFT',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.creditNotes.set(creditNote.id, creditNote);
    for (const line of formattedLines) {
      this.creditNoteLines.set(line.id, line);
    }

    // Create Document Snapshot for History Immutability
    this.createDocumentSnapshot(
      input.tenant_id,
      'CREDIT_NOTE',
      creditNote.id,
      invoice.customer_id,
      invoice.billing_address,
      invoice.shipping_address
    );

    return creditNote;
  }

  public postCreditNote(
    tenantId: string,
    creditNoteId: string,
    actorId: string,
    idempotencyKey?: string
  ): CreditNote {
    const cn = this.getCreditNoteById(tenantId, creditNoteId);
    if (!cn) throw new Error('Credit Note not found.');

    if (cn.status === 'ISSUED') {
      return cn; // Idempotent
    }

    if (cn.status !== 'DRAFT') {
      throw new Error(`Cannot post credit note in ${cn.status} status.`);
    }

    // Get Accounts for Posting
    const { arAccount, revenueAccount, taxPayableAccount } = this.getOrCreateDefaultSalesAccounts(
      tenantId,
      cn.legal_entity_id,
      actorId
    );

    const netRevenueStr = new Decimal(cn.subtotal, 2).sub(new Decimal(cn.discount_total, 2)).toString(2);

    const journalLines = [
      {
        account_id: arAccount.id,
        debit: '0.00',
        credit: cn.grand_total,
        description: `Accounts Receivable Credit for Credit Note ${cn.credit_note_number}`,
      },
      {
        account_id: revenueAccount.id,
        debit: netRevenueStr,
        credit: '0.00',
        description: `Sales Revenue Reversal for Credit Note ${cn.credit_note_number}`,
      },
    ];

    if (new Decimal(cn.tax_total, 2).isPositive()) {
      journalLines.push({
        account_id: taxPayableAccount.id,
        debit: cn.tax_total,
        credit: '0.00',
        description: `Sales Tax Reversal for Credit Note ${cn.credit_note_number}`,
      });
    }

    try {
      const journalEntry = this.postJournalEntry({
        tenant_id: tenantId,
        legal_entity_id: cn.legal_entity_id,
        description: `Credit Note ${cn.credit_note_number}`,
        transaction_date: cn.created_at.split('T')[0],
        document_date: cn.created_at.split('T')[0],
        currency_code: cn.currency_code,
        exchange_rate: cn.exchange_rate,
        reference: cn.credit_note_number,
        source_type: 'CREDIT_NOTE' as any,
        source_id: cn.id,
        posted_by: actorId,
        idempotency_key: idempotencyKey || `post_cn_${cn.id}`,
        lines: journalLines,
      });

      const now = new Date().toISOString();
      cn.status = 'ISSUED';
      cn.posted_at = now;
      cn.posted_by = actorId;
      cn.journal_entry_id = journalEntry.id;
      cn.updated_at = now;
      cn.updated_by = actorId;

      this.creditNotes.set(cn.id, cn);

      // Create Document Status History
      const histId = `cnsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.documentStatusHistories.set(histId, {
        id: histId,
        tenant_id: tenantId,
        document_type: 'CREDIT_NOTE',
        document_id: cn.id,
        from_status: 'DRAFT',
        to_status: 'ISSUED',
        actor_id: actorId,
        timestamp: now,
        reason: 'Credit Note posted.',
      });

      // Create Document Relationship
      const relId = `docrel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.documentRelationships.set(relId, {
        id: relId,
        tenant_id: tenantId,
        source_type: 'CREDIT_NOTE',
        source_id: cn.id,
        target_type: 'INVOICE',
        target_id: cn.original_invoice_id,
        relation_type: 'REVERSED_BY',
        created_at: now,
      });

      // Record Audit Event
      this.auditLogs.push({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenant_id: tenantId,
        actor_id: actorId,
        actor_email: 'user@tenant.com',
        action: 'CREDIT_NOTE_POSTED',
        resource_type: 'CREDIT_NOTE' as any,
        resource_id: cn.id,
        timestamp: now,
      });

      return cn;
    } catch (err: unknown) {
      throw new Error(`Credit Note Posting Failed: ${(err as Error).message}`);
    }
  }

  // --- DEBIT NOTES ---

  public getDebitNotes(tenantId: string, params?: PaginationParams): PaginatedResult<DebitNote> {
    let items = Array.from(this.debitNotes.values()).filter(
      (dn) => dn.tenant_id === tenantId && dn.deleted_at === null
    );
    if (params?.status) {
      items = items.filter((dn) => dn.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (dn) => dn.debit_note_number.toLowerCase().includes(qry) || dn.reason.toLowerCase().includes(qry)
      );
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getDebitNoteById(tenantId: string, id: string): DebitNote | undefined {
    const dn = this.debitNotes.get(id);
    if (!dn || dn.tenant_id !== tenantId || dn.deleted_at !== null) return undefined;
    return dn;
  }

  public createDebitNoteDraft(input: {
    tenant_id: string;
    original_invoice_id?: string | null;
    customer_id: string;
    legal_entity_id: string;
    branch_id?: string | null;
    currency_code?: string;
    exchange_rate?: string;
    reason: string;
    created_by: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED';
      discount_value?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
      invoice_line_id?: string | null;
    }>;
  }): DebitNote {
    const customer = this.getCustomerById(input.tenant_id, input.customer_id);
    if (!customer) throw new Error('Customer does not exist.');

    const dnNumber = this.generateNextDocumentNumber(input.tenant_id, 'DEBIT_NOTE', input.legal_entity_id, input.branch_id || undefined);
    const dnId = `dn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    let docSubtotal = Decimal.zero(2);
    let docDiscount = Decimal.zero(2);
    let docTax = Decimal.zero(2);

    const formattedLines: DebitNoteLine[] = input.lines.map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const priceRes = l.unit_price ? { unit_price: l.unit_price } : this.resolvePrice(input.tenant_id, input.customer_id, l.product_id, l.variant_id, input.currency_code, qty);
      const taxRes = l.tax_rate ? { tax_classification_code: l.tax_classification_code || null, tax_rate: l.tax_rate } : this.calculateTax(input.tenant_id, l.product_id);

      const unitPriceDec = new Decimal(priceRes.unit_price, 2);
      const subtotalDec = unitPriceDec.mul(qty);

      const discType = l.discount_type || 'PERCENTAGE';
      const discValDec = new Decimal(l.discount_value || '0', 2);
      let discAmtDec = Decimal.zero(2);
      if (discType === 'PERCENTAGE') {
        discAmtDec = subtotalDec.mul(discValDec.toString()).mul('0.01');
      } else {
        discAmtDec = discValDec;
      }

      const netLineDec = subtotalDec.sub(discAmtDec);
      const taxRateDec = new Decimal(taxRes.tax_rate, 2);
      const taxAmtDec = netLineDec.mul(taxRateDec.toString()).mul('0.01');
      const lineTotalDec = netLineDec.add(taxAmtDec);

      docSubtotal = docSubtotal.add(subtotalDec);
      docDiscount = docDiscount.add(discAmtDec);
      docTax = docTax.add(taxAmtDec);

      return {
        id: `dnl_${dnId}_${idx + 1}`,
        debit_note_id: dnId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Debit item',
        quantity: qty,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        unit_price: unitPriceDec.toString(2),
        discount_type: discType,
        discount_value: discValDec.toString(2),
        discount_amount: discAmtDec.toString(2),
        tax_classification_code: taxRes.tax_classification_code,
        tax_rate: taxRateDec.toString(2),
        tax_amount: taxAmtDec.toString(2),
        line_subtotal: subtotalDec.toString(2),
        line_total: lineTotalDec.toString(2),
        invoice_line_id: l.invoice_line_id || null,
      };
    });

    const grandTotalDec = docSubtotal.sub(docDiscount).add(docTax);

    const debitNote: DebitNote = {
      id: dnId,
      tenant_id: input.tenant_id,
      debit_note_number: dnNumber,
      original_invoice_id: input.original_invoice_id || null,
      customer_id: input.customer_id,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      currency_code: input.currency_code || customer.currency_code || 'INR',
      exchange_rate: input.exchange_rate || '1.0000',
      reason: input.reason,
      subtotal: docSubtotal.toString(2),
      discount_total: docDiscount.toString(2),
      tax_total: docTax.toString(2),
      grand_total: grandTotalDec.toString(2),
      status: 'DRAFT',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.debitNotes.set(debitNote.id, debitNote);
    for (const line of formattedLines) {
      this.debitNoteLines.set(line.id, line);
    }

    // Determine addresses
    const invoice = input.original_invoice_id ? this.getInvoiceById(input.tenant_id, input.original_invoice_id) : null;
    const billAddr: Address = invoice?.billing_address || { street_address: 'Billing Address', city: '', state_province: '', postal_code: '', country_code: 'IN' };
    const shipAddr: Address = invoice?.shipping_address || { street_address: 'Shipping Address', city: '', state_province: '', postal_code: '', country_code: 'IN' };

    this.createDocumentSnapshot(
      input.tenant_id,
      'DEBIT_NOTE',
      debitNote.id,
      input.customer_id,
      billAddr,
      shipAddr
    );

    return debitNote;
  }

  public postDebitNote(
    tenantId: string,
    debitNoteId: string,
    actorId: string,
    idempotencyKey?: string
  ): DebitNote {
    const dn = this.getDebitNoteById(tenantId, debitNoteId);
    if (!dn) throw new Error('Debit Note not found.');

    if (dn.status === 'ISSUED') {
      return dn; // Idempotent
    }

    if (dn.status !== 'DRAFT') {
      throw new Error(`Cannot post debit note in ${dn.status} status.`);
    }

    // Get Accounts for Posting
    const { arAccount, revenueAccount, taxPayableAccount } = this.getOrCreateDefaultSalesAccounts(
      tenantId,
      dn.legal_entity_id,
      actorId
    );

    const netRevenueStr = new Decimal(dn.subtotal, 2).sub(new Decimal(dn.discount_total, 2)).toString(2);

    const journalLines = [
      {
        account_id: arAccount.id,
        debit: dn.grand_total,
        credit: '0.00',
        description: `Accounts Receivable Debit for Debit Note ${dn.debit_note_number}`,
      },
      {
        account_id: revenueAccount.id,
        debit: '0.00',
        credit: netRevenueStr,
        description: `Sales Revenue Increment for Debit Note ${dn.debit_note_number}`,
      },
    ];

    if (new Decimal(dn.tax_total, 2).isPositive()) {
      journalLines.push({
        account_id: taxPayableAccount.id,
        debit: '0.00',
        credit: dn.tax_total,
        description: `Sales Tax Increment for Debit Note ${dn.debit_note_number}`,
      });
    }

    try {
      const journalEntry = this.postJournalEntry({
        tenant_id: tenantId,
        legal_entity_id: dn.legal_entity_id,
        description: `Debit Note ${dn.debit_note_number}`,
        transaction_date: dn.created_at.split('T')[0],
        document_date: dn.created_at.split('T')[0],
        currency_code: dn.currency_code,
        exchange_rate: dn.exchange_rate,
        reference: dn.debit_note_number,
        source_type: 'DEBIT_NOTE' as any,
        source_id: dn.id,
        posted_by: actorId,
        idempotency_key: idempotencyKey || `post_dn_${dn.id}`,
        lines: journalLines,
      });

      const now = new Date().toISOString();
      dn.status = 'ISSUED';
      dn.posted_at = now;
      dn.posted_by = actorId;
      dn.journal_entry_id = journalEntry.id;
      dn.updated_at = now;
      dn.updated_by = actorId;

      this.debitNotes.set(dn.id, dn);

      // Create Document Status History
      const histId = `dnsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.documentStatusHistories.set(histId, {
        id: histId,
        tenant_id: tenantId,
        document_type: 'DEBIT_NOTE',
        document_id: dn.id,
        from_status: 'DRAFT',
        to_status: 'ISSUED',
        actor_id: actorId,
        timestamp: now,
        reason: 'Debit Note posted.',
      });

      if (dn.original_invoice_id) {
        const relId = `docrel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.documentRelationships.set(relId, {
          id: relId,
          tenant_id: tenantId,
          source_type: 'DEBIT_NOTE' as any,
          source_id: dn.id,
          target_type: 'INVOICE',
          target_id: dn.original_invoice_id,
          relation_type: 'INVOICED_BY',
          created_at: now,
        });
      }

      // Record Audit Event
      this.auditLogs.push({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenant_id: tenantId,
        actor_id: actorId,
        actor_email: 'user@tenant.com',
        action: 'DEBIT_NOTE_POSTED',
        resource_type: 'DEBIT_NOTE' as any,
        resource_id: dn.id,
        timestamp: now,
      });

      return dn;
    } catch (err: unknown) {
      throw new Error(`Debit Note Posting Failed: ${(err as Error).message}`);
    }
  }

  // --- SALES RETURNS ---

  public getSalesReturns(tenantId: string, params?: PaginationParams): PaginatedResult<SalesReturn> {
    let items = Array.from(this.salesReturns.values()).filter(
      (sr) => sr.tenant_id === tenantId && sr.deleted_at === null
    );
    if (params?.status) {
      items = items.filter((sr) => sr.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (sr) => sr.return_number.toLowerCase().includes(qry) || sr.notes?.toLowerCase().includes(qry)
      );
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getSalesReturnById(tenantId: string, id: string): SalesReturn | undefined {
    const sr = this.salesReturns.get(id);
    if (!sr || sr.tenant_id !== tenantId || sr.deleted_at !== null) return undefined;
    return sr;
  }

  public createSalesReturn(input: {
    tenant_id: string;
    original_invoice_id?: string | null;
    original_order_id?: string | null;
    customer_id: string;
    legal_entity_id: string;
    branch_id?: string | null;
    currency_code?: string;
    exchange_rate?: string;
    created_by: string;
    notes?: string;
    lines: Array<{
      product_id: string;
      quantity: number;
      uom_id: string;
      unit_price: string;
      reason: string;
      original_invoice_line_id?: string | null;
    }>;
  }): SalesReturn {
    const customer = this.getCustomerById(input.tenant_id, input.customer_id);
    if (!customer) throw new Error('Customer does not exist.');

    const srNumber = this.generateNextDocumentNumber(input.tenant_id, 'SALES_RETURN' as any, input.legal_entity_id, input.branch_id || undefined);
    const srId = `sr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const formattedLines: SalesReturnLine[] = input.lines.map((l, idx) => {
      if (l.quantity <= 0) throw new Error('Return quantity must be greater than zero.');
      return {
        id: `srl_${srId}_${idx + 1}`,
        sales_return_id: srId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        quantity: l.quantity,
        uom_id: l.uom_id,
        unit_price: l.unit_price,
        reason: l.reason,
        original_invoice_line_id: l.original_invoice_line_id || null,
      };
    });

    const salesReturn: SalesReturn = {
      id: srId,
      tenant_id: input.tenant_id,
      return_number: srNumber,
      original_invoice_id: input.original_invoice_id || null,
      original_order_id: input.original_order_id || null,
      customer_id: input.customer_id,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      currency_code: input.currency_code || customer.currency_code || 'INR',
      exchange_rate: input.exchange_rate || '1.0000',
      status: 'DRAFT',
      lines: formattedLines,
      notes: input.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.salesReturns.set(salesReturn.id, salesReturn);
    for (const line of formattedLines) {
      this.salesReturnLines.set(line.id, line);
    }

    return salesReturn;
  }

  public approveSalesReturn(tenantId: string, returnId: string, actorId: string): SalesReturn {
    const sr = this.getSalesReturnById(tenantId, returnId);
    if (!sr) throw new Error('Sales Return not found.');

    if (sr.status !== 'DRAFT') {
      throw new Error(`Cannot approve sales return in ${sr.status} status.`);
    }

    const nowIso = new Date().toISOString();
    sr.status = 'APPROVED';
    sr.updated_at = nowIso;
    sr.updated_by = actorId;
    sr.version += 1;

    this.salesReturns.set(sr.id, sr);

    // Create Document Status History
    const histId = `srsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.documentStatusHistories.set(histId, {
      id: histId,
      tenant_id: tenantId,
      document_type: 'SALES_RETURN',
      document_id: sr.id,
      from_status: 'DRAFT',
      to_status: 'APPROVED',
      actor_id: actorId,
      timestamp: nowIso,
      reason: 'Sales Return approved.',
    });

    // Record Audit Event
    this.auditLogs.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'user@tenant.com',
      action: 'SALES_RETURN_APPROVED',
      resource_type: 'SALES_RETURN' as any,
      resource_id: sr.id,
      timestamp: nowIso,
    });

    return sr;
  }

  // --- DOCUMENT SNAPSHOTS ---

  public createDocumentSnapshot(
    tenantId: string,
    documentType: 'QUOTATION' | 'SALES_ORDER' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE',
    documentId: string,
    customerId: string,
    billingAddress: Address,
    shippingAddress: Address
  ): DocumentSnapshot {
    const customer = this.getCustomerById(tenantId, customerId);
    const snapId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const snapshot: DocumentSnapshot = {
      id: snapId,
      tenant_id: tenantId,
      document_type: documentType,
      document_id: documentId,
      customer_name_snapshot: customer ? customer.customer_name : 'Unknown Customer',
      billing_address_snapshot: { ...billingAddress },
      shipping_address_snapshot: { ...shippingAddress },
      created_at: new Date().toISOString(),
    };
    this.documentSnapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  public getDocumentSnapshotByDocumentId(tenantId: string, documentId: string): DocumentSnapshot | undefined {
    return Array.from(this.documentSnapshots.values()).find(
      (s) => s.tenant_id === tenantId && s.document_id === documentId
    );
  }

  // --- DOCUMENT STATUS HISTORY ---

  public getDocumentStatusHistoryByDocumentId(tenantId: string, documentId: string): DocumentStatusHistory[] {
    return Array.from(this.documentStatusHistories.values())
      .filter((h) => h.tenant_id === tenantId && h.document_id === documentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- DOCUMENT ATTACHMENTS ---

  public createDocumentAttachment(input: {
    tenant_id: string;
    document_type: 'QUOTATION' | 'SALES_ORDER' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'FULFILLMENT' | 'SALES_RETURN';
    document_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: string;
  }): DocumentAttachment {
    const attachId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const attachment: DocumentAttachment = {
      id: attachId,
      tenant_id: input.tenant_id,
      document_type: input.document_type,
      document_id: input.document_id,
      file_name: input.file_name,
      file_path: input.file_path,
      file_size: input.file_size,
      mime_type: input.mime_type,
      uploaded_by: input.uploaded_by,
      uploaded_at: now,
    };
    this.documentAttachments.set(attachment.id, attachment);
    return attachment;
  }

  public getDocumentAttachmentsByDocumentId(tenantId: string, documentId: string): DocumentAttachment[] {
    return Array.from(this.documentAttachments.values()).filter(
      (a) => a.tenant_id === tenantId && a.document_id === documentId
    );
  }

  // --- CUSTOMER CREDIT CONTROL ---

  public evaluateCustomerCredit(
    tenantId: string,
    customerId: string,
    orderTotal: string
  ): 'APPROVED' | 'REQUIRES_REVIEW' | 'BLOCKED' | 'NOT_CONFIGURED' {
    const customer = this.getCustomerById(tenantId, customerId);
    if (!customer) throw new Error('Customer not found.');

    const profile = this.getCustomerCreditProfile(tenantId, customerId);
    if (!profile && !customer.credit_config) {
      return 'NOT_CONFIGURED';
    }

    const creditStatus = customer.credit_config?.credit_status || profile?.credit_status;
    const holdStatus = profile?.credit_hold_status || 'NONE';

    if (creditStatus === 'SUSPENDED' || holdStatus === 'ACTIVE' || customer.status === 'SUSPENDED') {
      return 'BLOCKED';
    }

    if (creditStatus === 'ON_HOLD') {
      return 'REQUIRES_REVIEW';
    }

    const limitStr = customer.credit_config?.credit_limit || profile?.credit_limit || '0';
    const limit = new Decimal(limitStr, 2);
    const currentExposure = new Decimal(this.getCurrentARExposure(tenantId, customerId), 2);
    const proposedTotal = currentExposure.add(new Decimal(orderTotal, 2));

    if (proposedTotal.sub(limit).isPositive()) {
      return 'BLOCKED';
    }

    return 'APPROVED';
  }

  // ==========================================
  // PHASE 6: ACCOUNTS RECEIVABLE ENGINE
  // ==========================================

  public createReceivableFromInvoice(
    tenantId: string,
    invoice: Invoice,
    actorId: string
  ): Receivable {
    if (invoice.status !== 'POSTED') {
      throw new Error('Invoice must be posted to create accounts receivable.');
    }

    const existing = Array.from(this.receivables.values()).find(
      (r) => r.tenant_id === tenantId && r.source_type === 'INVOICE' && r.source_id === invoice.id
    );
    if (existing) {
      return existing; // Idempotent return
    }

    const now = new Date().toISOString();
    const id = `rec_${invoice.id}`;
    
    const receivable: Receivable = {
      id,
      tenant_id: tenantId,
      receivable_number: `REC-${invoice.invoice_number}`,
      customer_id: invoice.customer_id,
      legal_entity_id: invoice.legal_entity_id,
      branch_id: invoice.branch_id || null,
      source_type: 'INVOICE',
      source_id: invoice.id,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      currency_code: invoice.currency_code,
      original_amount: invoice.grand_total,
      allocated_amount: '0.00',
      outstanding_amount: invoice.grand_total,
      status: 'OPEN',
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.receivables.set(id, receivable);

    // Create a schedule record for the receivable
    const scheduleId = `sched_${id}_1`;
    const schedule: ReceivableSchedule = {
      id: scheduleId,
      tenant_id: tenantId,
      receivable_id: id,
      due_date: invoice.due_date,
      amount: invoice.grand_total,
      allocated_amount: '0.00',
      outstanding_amount: invoice.grand_total,
      currency_code: invoice.currency_code,
      status: 'PENDING',
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };
    this.receivableSchedules.set(scheduleId, schedule);

    // Record Audit
    this.auditLogs.push({
      id: `audit_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'user@tenant.com',
      action: 'RECEIVABLE_CREATED',
      resource_type: 'RECEIVABLE',
      resource_id: id,
      timestamp: now,
    });

    return receivable;
  }

  public getReceivables(tenantId: string): Receivable[] {
    return Array.from(this.receivables.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null
    );
  }

  public getReceivableById(tenantId: string, id: string): Receivable | undefined {
    const r = this.receivables.get(id);
    if (r && r.tenant_id === tenantId && r.deleted_at === null) {
      return r;
    }
    return undefined;
  }

  // --- PAYMENT MODEL & LIFECYCLE ---

  public createPayment(
    tenantId: string,
    input: {
      customer_id: string;
      legal_entity_id: string;
      branch_id?: string | null;
      payment_date: string;
      currency_code: string;
      amount: string;
      payment_method: string;
      payment_channel: string;
      received_account_id: string;
      reference: string;
      external_reference?: string;
      notes?: string;
    },
    actorId: string,
    idempotencyKey?: string
  ): Payment {
    const amt = new Decimal(input.amount, 2);
    if (!amt.isPositive()) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const customer = this.getCustomerById(tenantId, input.customer_id);
    if (!customer) throw new Error('Customer not found.');

    const period = Array.from(this.fiscalPeriods.values()).find(
      (p) => p.tenant_id === tenantId && input.payment_date >= p.start_date && input.payment_date <= p.end_date && p.deleted_at === null
    );
    if (period && period.status === 'CLOSED') {
      throw new Error('Cannot post payment in a closed accounting period.');
    }

    // Idempotency check
    const ikey = idempotencyKey || `pay_${input.reference}_${input.amount}_${input.payment_date}`;
    const duplicate = Array.from(this.payments.values()).find(
      (p) => p.tenant_id === tenantId && (p.external_reference === ikey || p.reference === input.reference) && p.deleted_at === null
    );
    if (duplicate) {
      return duplicate;
    }

    const now = new Date().toISOString();
    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payment_number = `PMT-${Date.now().toString().slice(-6)}`;

    const payment: Payment = {
      id,
      tenant_id: tenantId,
      payment_number,
      customer_id: input.customer_id,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      payment_date: input.payment_date,
      currency_code: input.currency_code,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_channel: input.payment_channel,
      reference: input.reference,
      external_reference: input.external_reference || ikey,
      status: 'RECEIVED',
      received_account_id: input.received_account_id,
      journal_entry_id: null,
      notes: input.notes,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.payments.set(id, payment);

    this.auditLogs.push({
      id: `audit_pay_${Date.now()}`,
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'user@tenant.com',
      action: 'PAYMENT_RECEIVED',
      resource_type: 'PAYMENT',
      resource_id: id,
      timestamp: now,
    });

    return payment;
  }

  public confirmPayment(tenantId: string, paymentId: string, actorId: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.tenant_id !== tenantId) {
      throw new Error('Payment not found.');
    }

    if (payment.status !== 'RECEIVED') {
      return payment; // Idempotent confirm
    }

    // Find legal entity accounts
    const { arAccount } = this.getOrCreateDefaultSalesAccounts(tenantId, payment.legal_entity_id, actorId);
    
    // Balance journal posting
    const journalLines = [
      {
        account_id: payment.received_account_id,
        debit: payment.amount,
        credit: '0.00',
        description: `Receipt for Payment ${payment.payment_number}`,
      },
      {
        account_id: arAccount.id,
        debit: '0.00',
        credit: payment.amount,
        description: `Accounts Receivable credit for Payment ${payment.payment_number}`,
      },
    ];

    try {
      const entry = this.postJournalEntry({
        tenant_id: tenantId,
        legal_entity_id: payment.legal_entity_id,
        description: `Payment confirmation ${payment.payment_number}`,
        transaction_date: payment.payment_date,
        document_date: payment.payment_date,
        currency_code: payment.currency_code,
        exchange_rate: '1.000000',
        reference: payment.payment_number,
        source_type: 'PAYMENT',
        source_id: payment.id,
        posted_by: actorId,
        idempotency_key: `confirm_pay_${payment.id}`,
        lines: journalLines,
      });

      payment.status = 'UNAPPLIED';
      payment.journal_entry_id = entry.id;
      payment.updated_at = new Date().toISOString();
      payment.updated_by = actorId;

      this.payments.set(payment.id, payment);

      this.auditLogs.push({
        id: `audit_pay_conf_${Date.now()}`,
        tenant_id: tenantId,
        actor_id: actorId,
        actor_email: 'user@tenant.com',
        action: 'PAYMENT_CONFIRMED',
        resource_type: 'PAYMENT',
        resource_id: payment.id,
        timestamp: payment.updated_at,
      });

      return payment;
    } catch (err: unknown) {
      throw new Error(`Payment confirmation failed: ${(err as Error).message}`);
    }
  }

  // --- ALLOCATION WORKFLOWS ---

  public allocatePayment(
    tenantId: string,
    paymentId: string,
    allocations: Array<{ receivable_id: string; amount: string }>,
    actorId: string
  ): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.tenant_id !== tenantId) {
      throw new Error('Payment not found.');
    }

    if (payment.status !== 'UNAPPLIED' && payment.status !== 'PARTIALLY_ALLOCATED') {
      throw new Error(`Cannot allocate payment in status ${payment.status}.`);
    }

    // Check existing allocations of this payment
    const existingAllocs = Array.from(this.paymentAllocations.values()).filter(
      (a) => a.payment_id === paymentId && a.deleted_at === null
    );
    const allocatedSum = existingAllocs.reduce(
      (sum, item) => sum.add(new Decimal(item.allocated_amount, 2)),
      new Decimal('0.00', 2)
    );

    const proposedSum = allocations.reduce(
      (sum, item) => sum.add(new Decimal(item.amount, 2)),
      new Decimal('0.00', 2)
    );

    const totalProposedAllocated = allocatedSum.add(proposedSum);
    const paymentTotal = new Decimal(payment.amount, 2);

    if (totalProposedAllocated.sub(paymentTotal).isPositive()) {
      throw new Error('Total proposed allocations exceed the unallocated payment balance.');
    }

    const now = new Date().toISOString();

    for (const allocInput of allocations) {
      const rec = this.receivables.get(allocInput.receivable_id);
      if (!rec || rec.tenant_id !== tenantId) {
        throw new Error(`Receivable ${allocInput.receivable_id} not found.`);
      }

      if (rec.customer_id !== payment.customer_id) {
        throw new Error('Cross-customer allocation is strictly forbidden.');
      }

      if (rec.currency_code !== payment.currency_code) {
        throw new Error('Cross-currency allocation without explicit FX exchange rate is forbidden.');
      }

      const outstanding = new Decimal(rec.outstanding_amount, 2);
      const toAlloc = new Decimal(allocInput.amount, 2);

      if (!toAlloc.isPositive()) {
        throw new Error('Allocation amount must be positive.');
      }

      if (toAlloc.sub(outstanding).isPositive()) {
        throw new Error(`Proposed allocation amount ${toAlloc.toString()} exceeds outstanding receivable balance ${outstanding.toString()}.`);
      }

      // Create allocation record
      const allocId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const allocation: PaymentAllocation = {
        id: allocId,
        tenant_id: tenantId,
        payment_id: paymentId,
        receivable_id: rec.id,
        allocated_amount: allocInput.amount,
        allocation_date: now.split('T')[0],
        currency_code: payment.currency_code,
        created_by: actorId,
        updated_by: actorId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        version: 1,
      };

      this.paymentAllocations.set(allocId, allocation);

      // Update receivable balances
      const newAllocated = new Decimal(rec.allocated_amount, 2).add(toAlloc).toString(2);
      const newOutstanding = outstanding.sub(toAlloc).toString(2);

      rec.allocated_amount = newAllocated;
      rec.outstanding_amount = newOutstanding;
      rec.status = new Decimal(newOutstanding, 2).isZero() ? 'SETTLED' : 'PARTIALLY_SETTLED';
      rec.updated_at = now;
      rec.updated_by = actorId;
      this.receivables.set(rec.id, rec);

      // Update receivable schedule status
      const schedule = Array.from(this.receivableSchedules.values()).find((s) => s.receivable_id === rec.id);
      if (schedule) {
        schedule.allocated_amount = newAllocated;
        schedule.outstanding_amount = newOutstanding;
        schedule.status = new Decimal(newOutstanding, 2).isZero() ? 'PAID' : 'PENDING';
        this.receivableSchedules.set(schedule.id, schedule);
      }
    }

    // Update payment status
    const newAllocatedSum = allocatedSum.add(proposedSum);
    if (newAllocatedSum.equals(paymentTotal)) {
      payment.status = 'FULLY_ALLOCATED';
    } else {
      payment.status = 'PARTIALLY_ALLOCATED';
    }

    payment.updated_at = now;
    payment.updated_by = actorId;
    this.payments.set(payment.id, payment);

    this.auditLogs.push({
      id: `audit_alloc_${Date.now()}`,
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'user@tenant.com',
      action: 'PAYMENT_ALLOCATED',
      resource_type: 'PAYMENT',
      resource_id: paymentId,
      timestamp: now,
    });

    return payment;
  }

  // --- REVERSALS ---

  public reversePayment(tenantId: string, paymentId: string, reason: string, actorId: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.tenant_id !== tenantId) {
      throw new Error('Payment not found.');
    }

    if (payment.status === 'REVERSED') {
      throw new Error('Payment has already been reversed.');
    }

    const period = Array.from(this.fiscalPeriods.values()).find(
      (p) => p.tenant_id === tenantId && payment.payment_date >= p.start_date && payment.payment_date <= p.end_date && p.deleted_at === null
    );
    if (period && period.status === 'CLOSED') {
      throw new Error('Cannot reverse payment in a closed historical period.');
    }

    const now = new Date().toISOString();

    // Revert associated allocations
    const allocs = Array.from(this.paymentAllocations.values()).filter(
      (a) => a.payment_id === paymentId && a.deleted_at === null
    );

    for (const alloc of allocs) {
      const rec = this.receivables.get(alloc.receivable_id);
      if (rec) {
        const amt = new Decimal(alloc.allocated_amount, 2);
        rec.allocated_amount = new Decimal(rec.allocated_amount, 2).sub(amt).toString(2);
        rec.outstanding_amount = new Decimal(rec.outstanding_amount, 2).add(amt).toString(2);
        rec.status = 'OPEN';
        rec.updated_at = now;
        rec.updated_by = actorId;
        this.receivables.set(rec.id, rec);

        const schedule = Array.from(this.receivableSchedules.values()).find((s) => s.receivable_id === rec.id);
        if (schedule) {
          schedule.allocated_amount = rec.allocated_amount;
          schedule.outstanding_amount = rec.outstanding_amount;
          schedule.status = 'PENDING';
          this.receivableSchedules.set(schedule.id, schedule);
        }
      }
      alloc.deleted_at = now;
      this.paymentAllocations.set(alloc.id, alloc);
    }

    // GL Accounting Reversal
    if (payment.journal_entry_id) {
      const originalEntry = this.journalEntries.get(payment.journal_entry_id);
      if (originalEntry) {
        const reversalLines = originalEntry.lines.map((line) => ({
          account_id: line.account_id,
          debit: line.credit,
          credit: line.debit,
          description: `REVERSAL: ${line.description}`,
        }));

        this.postJournalEntry({
          tenant_id: tenantId,
          legal_entity_id: payment.legal_entity_id,
          description: `REVERSAL of Payment ${payment.payment_number}`,
          lines: reversalLines,
          posted_by: actorId,
          transaction_date: payment.payment_date,
          currency_code: payment.currency_code,
          source_type: 'REVERSAL',
          source_id: payment.id,
        });
      }
    }

    payment.status = 'REVERSED';
    payment.updated_at = now;
    payment.updated_by = actorId;
    this.payments.set(payment.id, payment);

    const revId = `rev_${Date.now()}`;
    const reversal: PaymentReversal = {
      id: revId,
      tenant_id: tenantId,
      payment_id: paymentId,
      reversal_date: now.split('T')[0],
      reason,
      journal_entry_id: payment.journal_entry_id,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };
    this.paymentReversals.set(revId, reversal);

    this.auditLogs.push({
      id: `audit_rev_${Date.now()}`,
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'user@tenant.com',
      action: 'PAYMENT_REVERSED',
      resource_type: 'PAYMENT',
      resource_id: paymentId,
      timestamp: now,
    });

    return payment;
  }

  // --- REFUNDS ---

  public createRefund(
    tenantId: string,
    paymentId: string,
    amount: string,
    reason: string,
    destination: string,
    actorId: string
  ): Refund {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.tenant_id !== tenantId) {
      throw new Error('Payment not found.');
    }

    const refAmt = new Decimal(amount, 2);
    if (!refAmt.isPositive()) {
      throw new Error('Refund amount must be positive.');
    }

    const payAmt = new Decimal(payment.amount, 2);
    if (refAmt.sub(payAmt).isPositive()) {
      throw new Error('Refund amount cannot exceed payment amount.');
    }

    const now = new Date().toISOString();
    const id = `ref_${Date.now()}`;
    const refund: Refund = {
      id,
      tenant_id: tenantId,
      refund_number: `REF-${Date.now().toString().slice(-6)}`,
      original_payment_id: paymentId,
      amount,
      currency_code: payment.currency_code,
      reason,
      destination,
      status: 'CONFIRMED',
      journal_entry_id: null,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    // Post to accounting
    const { arAccount } = this.getOrCreateDefaultSalesAccounts(tenantId, payment.legal_entity_id, actorId);
    const journalLines = [
      {
        account_id: arAccount.id,
        debit: amount,
        credit: '0.00',
        description: `Refund debit back to Accounts Receivable for Payment ${payment.payment_number}`,
      },
      {
        account_id: payment.received_account_id,
        debit: '0.00',
        credit: amount,
        description: `Refund credit out of cash/bank for Payment ${payment.payment_number}`,
      },
    ];

    const entry = this.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: payment.legal_entity_id,
      description: `Refund journal posting for ${refund.refund_number}`,
      transaction_date: now.split('T')[0],
      currency_code: refund.currency_code,
      posted_by: actorId,
      lines: journalLines,
    });

    refund.journal_entry_id = entry.id;
    this.refunds.set(id, refund);

    payment.status = 'REFUNDED';
    this.payments.set(payment.id, payment);

    return refund;
  }

  // --- CUSTOMER CREDIT PROFILE & HOLDS ---

  public getCustomerCreditProfile(tenantId: string, customerId: string): CustomerCreditProfile {
    let cp = Array.from(this.customerCreditProfiles.values()).find(
      (p) => p.tenant_id === tenantId && p.customer_id === customerId && p.deleted_at === null
    );
    const customer = this.getCustomerById(tenantId, customerId);
    if (!cp) {
      const now = new Date().toISOString();
      const limit = customer?.credit_config?.credit_limit || '50000.00';
      const days = customer?.credit_config?.credit_days || 30;
      const status = customer?.credit_config?.credit_status || 'APPROVED';

      cp = {
        id: `ccp_${customerId}`,
        tenant_id: tenantId,
        customer_id: customerId,
        credit_limit: limit,
        credit_days: days,
        risk_classification: 'MEDIUM',
        credit_status: status as any,
        credit_hold_status: 'NONE',
        created_by: 'system',
        updated_by: 'system',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        version: 1,
      };
      this.customerCreditProfiles.set(cp.id, cp);
    } else if (customer?.credit_config) {
      cp.credit_limit = customer.credit_config.credit_limit;
      cp.credit_days = customer.credit_config.credit_days;
      cp.credit_status = customer.credit_config.credit_status;
    }
    return cp;
  }

  public updateCustomerCreditProfile(
    tenantId: string,
    customerId: string,
    input: Partial<CustomerCreditProfile>,
    actorId: string
  ): CustomerCreditProfile {
    const profile = this.getCustomerCreditProfile(tenantId, customerId);
    const now = new Date().toISOString();

    const updated = {
      ...profile,
      ...input,
      updated_at: now,
      updated_by: actorId,
    };
    this.customerCreditProfiles.set(profile.id, updated);
    return updated;
  }

  public getCurrentARExposure(tenantId: string, customerId: string): string {
    const recs = Array.from(this.receivables.values()).filter(
      (r) => r.tenant_id === tenantId && r.customer_id === customerId && r.deleted_at === null
    );
    const sum = recs.reduce(
      (tot, r) => tot.add(new Decimal(r.outstanding_amount, 2)),
      new Decimal('0.00', 2)
    );
    return sum.toString(2);
  }

  public createCreditHold(tenantId: string, customerId: string, reason: string, actorId: string): CreditHold {
    const profile = this.getCustomerCreditProfile(tenantId, customerId);
    profile.credit_hold_status = 'ACTIVE';
    this.customerCreditProfiles.set(profile.id, profile);

    const now = new Date().toISOString();
    const hold: CreditHold = {
      id: `hold_${Date.now()}`,
      tenant_id: tenantId,
      customer_id: customerId,
      reason,
      status: 'ACTIVE',
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };
    this.creditHolds.set(hold.id, hold);
    return hold;
  }

  public releaseCreditHold(
    tenantId: string,
    customerId: string,
    releaseReason: string,
    actorId: string
  ): CreditHold | undefined {
    const profile = this.getCustomerCreditProfile(tenantId, customerId);
    profile.credit_hold_status = 'NONE';
    this.customerCreditProfiles.set(profile.id, profile);

    const activeHold = Array.from(this.creditHolds.values()).find(
      (h) => h.tenant_id === tenantId && h.customer_id === customerId && h.status === 'ACTIVE'
    );
    if (activeHold) {
      activeHold.status = 'RELEASED';
      activeHold.released_by = actorId;
      activeHold.released_at = new Date().toISOString();
      activeHold.release_reason = releaseReason;
      this.creditHolds.set(activeHold.id, activeHold);
      return activeHold;
    }
    return undefined;
  }

  // --- AR AGING & STATEMENTS ---

  public getARAgingReport(tenantId: string, reportDateStr: string): any {
    const reportDate = new Date(reportDateStr);
    const recs = this.getReceivables(tenantId).filter((r) => r.status !== 'SETTLED');

    const customerGroups: Record<string, {
      customer_id: string;
      customer_name: string;
      current: string;
      days_1_30: string;
      days_31_60: string;
      days_61_90: string;
      days_91_120: string;
      days_120_plus: string;
      total: string;
    }> = {};

    for (const r of recs) {
      const customer = this.getCustomerById(tenantId, r.customer_id);
      const name = customer ? customer.customer_name : 'Unknown Customer';

      if (!customerGroups[r.customer_id]) {
        customerGroups[r.customer_id] = {
          customer_id: r.customer_id,
          customer_name: name,
          current: '0.00',
          days_1_30: '0.00',
          days_31_60: '0.00',
          days_61_90: '0.00',
          days_91_120: '0.00',
          days_120_plus: '0.00',
          total: '0.00',
        };
      }

      const grp = customerGroups[r.customer_id];
      const dueDate = new Date(r.due_date);
      const diffMs = reportDate.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const amt = new Decimal(r.outstanding_amount, 2);

      if (diffDays <= 0) {
        grp.current = new Decimal(grp.current, 2).add(amt).toString(2);
      } else if (diffDays <= 30) {
        grp.days_1_30 = new Decimal(grp.days_1_30, 2).add(amt).toString(2);
      } else if (diffDays <= 60) {
        grp.days_31_60 = new Decimal(grp.days_31_60, 2).add(amt).toString(2);
      } else if (diffDays <= 90) {
        grp.days_61_90 = new Decimal(grp.days_61_90, 2).add(amt).toString(2);
      } else if (diffDays <= 120) {
        grp.days_91_120 = new Decimal(grp.days_91_120, 2).add(amt).toString(2);
      } else {
        grp.days_120_plus = new Decimal(grp.days_120_plus, 2).add(amt).toString(2);
      }

      grp.total = new Decimal(grp.total, 2).add(amt).toString(2);
    }

    return Object.values(customerGroups);
  }

  public getCustomerStatement(
    tenantId: string,
    customerId: string,
    startDateStr: string,
    endDateStr: string
  ): any {
    const recs = Array.from(this.receivables.values()).filter(
      (r) => r.tenant_id === tenantId && r.customer_id === customerId && r.deleted_at === null
    );

    const pmts = Array.from(this.payments.values()).filter(
      (p) => p.tenant_id === tenantId && p.customer_id === customerId && p.status !== 'REVERSED' && p.deleted_at === null
    );

    const writeOffs = Array.from(this.writeOffs.values()).filter(
      (w) => w.tenant_id === tenantId && w.customer_id === customerId && w.deleted_at === null
    );

    // Calculate opening balance
    let opening = new Decimal('0.00', 2);
    for (const r of recs) {
      if (r.invoice_date < startDateStr) {
        opening = opening.add(new Decimal(r.original_amount, 2));
      }
    }
    // Subtract allocations made before startDate
    const allocs = Array.from(this.paymentAllocations.values()).filter(
      (a) => a.tenant_id === tenantId && a.deleted_at === null
    );
    for (const a of allocs) {
      const rec = this.receivables.get(a.receivable_id);
      if (rec && rec.customer_id === customerId && a.allocation_date < startDateStr) {
        opening = opening.sub(new Decimal(a.allocated_amount, 2));
      }
    }
    // Subtract write-offs made before startDate
    for (const w of writeOffs) {
      if (w.created_at.split('T')[0] < startDateStr) {
        opening = opening.sub(new Decimal(w.amount, 2));
      }
    }

    const statementLines: any[] = [];
    let running = opening;

    // Add Invoices / Receivables
    for (const r of recs) {
      if (r.invoice_date >= startDateStr && r.invoice_date <= endDateStr) {
        statementLines.push({
          date: r.invoice_date,
          reference: r.receivable_number,
          description: `Invoice receivable`,
          debit: r.original_amount,
          credit: '0.00',
          type: 'DEBIT',
        });
      }
    }

    // Add Payments confirmed in the period
    for (const p of pmts) {
      if (p.payment_date >= startDateStr && p.payment_date <= endDateStr) {
        statementLines.push({
          date: p.payment_date,
          reference: p.payment_number,
          description: `Payment received`,
          debit: '0.00',
          credit: p.amount,
          type: 'CREDIT',
        });
      }
    }

    // Add write-offs in period
    for (const w of writeOffs) {
      const dt = w.created_at.split('T')[0];
      if (dt >= startDateStr && dt <= endDateStr) {
        statementLines.push({
          date: dt,
          reference: w.write_off_number,
          description: `Bad debt write-off`,
          debit: '0.00',
          credit: w.amount,
          type: 'CREDIT',
        });
      }
    }

    // Sort lines chronologically
    statementLines.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    const reconciledLines = statementLines.map((line) => {
      const deb = new Decimal(line.debit, 2);
      const cred = new Decimal(line.credit, 2);
      running = running.add(deb).sub(cred);
      return {
        ...line,
        running_balance: running.toString(2),
      };
    });

    return {
      opening_balance: opening.toString(2),
      closing_balance: running.toString(2),
      lines: reconciledLines,
    };
  }

  // --- COLLECTIONS CASES & PROMISES ---

  public createCollectionCase(tenantId: string, customerId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', actorId: string): CollectionCase {
    const recs = this.getReceivables(tenantId).filter((r) => r.customer_id === customerId && r.status === 'OVERDUE');
    if (recs.length === 0) {
      throw new Error('No overdue receivables found for this customer. Collections case cannot be created.');
    }

    const overdueSum = recs.reduce(
      (tot, r) => tot.add(new Decimal(r.outstanding_amount, 2)),
      new Decimal('0.00', 2)
    );

    const now = new Date().toISOString();
    const id = `col_${Date.now()}`;
    const colCase: CollectionCase = {
      id,
      tenant_id: tenantId,
      case_number: `COL-${Date.now().toString().slice(-6)}`,
      customer_id: customerId,
      priority,
      status: 'OPEN',
      amount_due: overdueSum.toString(2),
      amount_overdue: overdueSum.toString(2),
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.collectionCases.set(id, colCase);
    return colCase;
  }

  public createCollectionActivity(
    tenantId: string,
    caseId: string,
    input: {
      activity_type: 'CALL' | 'EMAIL' | 'MESSAGE' | 'MEETING' | 'PROMISE_TO_PAY' | 'NOTE' | 'FOLLOW_UP';
      summary: string;
      notes?: string;
    },
    actorId: string
  ): CollectionActivity {
    const colCase = this.collectionCases.get(caseId);
    if (!colCase || colCase.tenant_id !== tenantId) {
      throw new Error('Collection case not found.');
    }

    const now = new Date().toISOString();
    const actId = `act_${Date.now()}`;
    const activity: CollectionActivity = {
      id: actId,
      tenant_id: tenantId,
      case_id: caseId,
      activity_type: input.activity_type,
      summary: input.summary,
      notes: input.notes,
      completed_at: now,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.collectionActivities.set(actId, activity);

    colCase.updated_at = now;
    colCase.updated_by = actorId;
    this.collectionCases.set(caseId, colCase);

    return activity;
  }

  public createPromiseToPay(
    tenantId: string,
    customerId: string,
    receivableId: string,
    promisedAmount: string,
    promisedDate: string,
    notes: string | undefined,
    actorId: string
  ): PromiseToPay {
    const now = new Date().toISOString();
    const id = `ptp_${Date.now()}`;
    const ptp: PromiseToPay = {
      id,
      tenant_id: tenantId,
      customer_id: customerId,
      receivable_id: receivableId,
      promised_amount: promisedAmount,
      promised_date: promisedDate,
      status: 'PENDING',
      notes,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };
    this.promisesToPay.set(id, ptp);
    return ptp;
  }

  // --- WRITE-OFFS & BAD DEBTS ---

  public createWriteOffRequest(
    tenantId: string,
    customerId: string,
    receivableId: string,
    amount: string,
    reason: string,
    actorId: string
  ): WriteOffRequest {
    const rec = this.receivables.get(receivableId);
    if (!rec || rec.tenant_id !== tenantId) {
      throw new Error('Receivable not found.');
    }

    const recOutstanding = new Decimal(rec.outstanding_amount, 2);
    const writeOffAmt = new Decimal(amount, 2);

    if (writeOffAmt.sub(recOutstanding).isPositive()) {
      throw new Error('Write-off amount cannot exceed the outstanding receivable amount.');
    }

    const now = new Date().toISOString();
    const id = `req_${Date.now()}`;
    const req: WriteOffRequest = {
      id,
      tenant_id: tenantId,
      request_number: `WOR-${Date.now().toString().slice(-6)}`,
      customer_id: customerId,
      receivable_id: receivableId,
      amount,
      reason,
      status: 'PENDING',
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.writeOffRequests.set(id, req);
    return req;
  }

  public approveAndPostWriteOff(tenantId: string, requestId: string, actorId: string): WriteOff {
    const req = this.writeOffRequests.get(requestId);
    if (!req || req.tenant_id !== tenantId) {
      throw new Error('Write-off request not found.');
    }

    if (req.status !== 'PENDING') {
      throw new Error(`Request has already been processed: status ${req.status}`);
    }

    const rec = this.receivables.get(req.receivable_id);
    if (!rec) {
      throw new Error('Associated receivable not found.');
    }

    const now = new Date().toISOString();

    // 1. Double entry postings to general ledger
    const { arAccount } = this.getOrCreateDefaultSalesAccounts(tenantId, rec.legal_entity_id, actorId);
    const { writeOffExpenseAccount } = this.getOrCreateDefaultReceivingAccounts(tenantId, rec.legal_entity_id, actorId);

    const journalLines = [
      {
        account_id: writeOffExpenseAccount.id,
        debit: req.amount,
        credit: '0.00',
        description: `Bad Debt Write-off Expense for ${rec.receivable_number}`,
      },
      {
        account_id: arAccount.id,
        debit: '0.00',
        credit: req.amount,
        description: `Reduction of Accounts Receivable for ${rec.receivable_number}`,
      },
    ];

    const entry = this.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: rec.legal_entity_id,
      description: `Write-off journal entry for ${rec.receivable_number}`,
      transaction_date: now.split('T')[0],
      currency_code: rec.currency_code,
      posted_by: actorId,
      lines: journalLines,
    });

    // 2. Commit balances
    rec.allocated_amount = new Decimal(rec.allocated_amount, 2).add(new Decimal(req.amount, 2)).toString(2);
    rec.outstanding_amount = new Decimal(rec.outstanding_amount, 2).sub(new Decimal(req.amount, 2)).toString(2);
    rec.status = new Decimal(rec.outstanding_amount, 2).isZero() ? 'WRITTEN_OFF' : 'PARTIALLY_SETTLED';
    rec.updated_at = now;
    rec.updated_by = actorId;
    this.receivables.set(rec.id, rec);

    req.status = 'APPROVED';
    req.approved_by = actorId;
    req.approved_at = now;
    this.writeOffRequests.set(req.id, req);

    const writeOffId = `wo_${Date.now()}`;
    const writeOff: WriteOff = {
      id: writeOffId,
      tenant_id: tenantId,
      write_off_number: `WOF-${Date.now().toString().slice(-6)}`,
      request_id: req.id,
      customer_id: req.customer_id,
      receivable_id: req.receivable_id,
      amount: req.amount,
      journal_entry_id: entry.id,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.writeOffs.set(writeOffId, writeOff);

    return writeOff;
  }

  // --- REBUILD PROJECTIONS ---

  public rebuildCustomerARProjections(tenantId: string, customerId: string): void {
    const recs = Array.from(this.receivables.values()).filter(
      (r) => r.tenant_id === tenantId && r.customer_id === customerId && r.deleted_at === null
    );

    for (const r of recs) {
      const allocs = Array.from(this.paymentAllocations.values()).filter(
        (a) => a.receivable_id === r.id && a.deleted_at === null
      );
      const allocatedSum = allocs.reduce(
        (sum, a) => sum.add(new Decimal(a.allocated_amount, 2)),
        new Decimal('0.00', 2)
      );

      const writeOffs = Array.from(this.writeOffs.values()).filter(
        (w) => w.receivable_id === r.id && w.deleted_at === null
      );
      const writeOffSum = writeOffs.reduce(
        (sum, w) => sum.add(new Decimal(w.amount, 2)),
        new Decimal('0.00', 2)
      );

      const totalCredits = allocatedSum.add(writeOffSum);
      const original = new Decimal(r.original_amount, 2);
      const outstanding = original.sub(totalCredits);

      r.allocated_amount = allocatedSum.toString(2);
      r.outstanding_amount = outstanding.toString(2);
      
      if (outstanding.isZero()) {
        r.status = writeOffSum.isPositive() ? 'WRITTEN_OFF' : 'SETTLED';
      } else {
        r.status = totalCredits.isPositive() ? 'PARTIALLY_SETTLED' : 'OPEN';
      }

      r.updated_at = new Date().toISOString();
      this.receivables.set(r.id, r);
    }
  }

  // --- RECONCILIATION ---

  public runARReconciliation(tenantId: string, actorId: string): ARReconciliationRun {
    const recs = this.getReceivables(tenantId);
    const subledgerTotal = recs.reduce(
      (tot, r) => tot.add(new Decimal(r.outstanding_amount, 2)),
      new Decimal('0.00', 2)
    );

    // Sum matching accounts receivable GL account balance
    let glTotal = new Decimal('0.00', 2);
    const entries = Array.from(this.journalEntries.values()).filter(
      (e) => e.tenant_id === tenantId && e.status === 'POSTED'
    );

    for (const entry of entries) {
      const { arAccount } = this.getOrCreateDefaultSalesAccounts(tenantId, entry.legal_entity_id, actorId);
      for (const line of entry.lines) {
        if (line.account_id === arAccount.id) {
          glTotal = glTotal.add(new Decimal(line.debit, 2)).sub(new Decimal(line.credit, 2));
        }
      }
    }

    const diff = subledgerTotal.sub(glTotal);
    const status = diff.isZero() ? 'RECONCILED' : 'EXCEPTION';

    const now = new Date().toISOString();
    const id = `rec_run_${Date.now()}`;
    const run: ARReconciliationRun = {
      id,
      tenant_id: tenantId,
      run_number: `REC-${Date.now().toString().slice(-6)}`,
      reconciliation_date: now.split('T')[0],
      subledger_total: subledgerTotal.toString(2),
      gl_total: glTotal.toString(2),
      difference: diff.toString(2),
      status,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    this.arReconciliationRuns.set(id, run);

    if (status === 'EXCEPTION') {
      const exceptionId = `exc_${Date.now()}`;
      const exception: ARReconciliationException = {
        id: exceptionId,
        tenant_id: tenantId,
        run_id: id,
        mismatch_amount: diff.abs().toString(2),
        currency_code: 'INR',
        detected_at: now,
        status: 'OPEN',
        notes: `Difference of ${diff.toString()} detected between subledger and general ledger.`,
        created_by: actorId,
        updated_by: actorId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        version: 1,
      };
      this.arReconciliationExceptions.set(exceptionId, exception);
    }

    return run;
  }

  public getOrCreateDefaultReceivingAccounts(
    tenantId: string,
    legalEntityId: string,
    actorId: string = 'system'
  ): { cashAccount: Account; writeOffExpenseAccount: Account } {
    const existingAccounts = this.getAccounts(tenantId, legalEntityId);

    let cashAccount = existingAccounts.find(
      (a) => a.account_subtype === 'CASH_AND_EQUIVALENT' && a.status === 'ACTIVE'
    );
    if (!cashAccount) {
      cashAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '101000',
        name: 'Cash and Bank Account',
        account_type: 'ASSET',
        account_subtype: 'CASH_AND_EQUIVALENT',
        normal_balance: 'DEBIT',
        created_by: actorId,
      });
    }

    let writeOffExpenseAccount = existingAccounts.find(
      (a) => a.account_type === 'EXPENSE' && a.name.includes('Bad Debt')
    );
    if (!writeOffExpenseAccount) {
      writeOffExpenseAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '605000',
        name: 'Bad Debt & Write-off Expense',
        account_type: 'EXPENSE',
        account_subtype: 'FINANCE_COST',
        normal_balance: 'DEBIT',
        created_by: actorId,
      });
    }

    return { cashAccount, writeOffExpenseAccount };
  }

  // ==========================================
  // PHASE 7: PROCUREMENT & ACCOUNTS PAYABLE ENGINE
  // ==========================================

  public getOrCreateDefaultAPAccounts(
    tenantId: string,
    legalEntityId: string,
    actorId: string = 'system'
  ): { apAccount: Account; expenseAccount: Account; taxInputAccount: Account; bankAccount: Account } {
    const existingAccounts = this.getAccounts(tenantId, legalEntityId);

    let apAccount = existingAccounts.find(
      (a) => a.account_subtype === 'ACCOUNTS_PAYABLE' && a.status === 'ACTIVE'
    );
    if (!apAccount) {
      apAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '2100',
        name: 'Accounts Payable',
        account_type: 'LIABILITY',
        account_subtype: 'ACCOUNTS_PAYABLE',
        normal_balance: 'CREDIT',
        description: 'Default System Accounts Payable Control',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    let expenseAccount = existingAccounts.find(
      (a) => (a.account_subtype === 'OPERATING_EXPENSE' || a.account_subtype === 'COST_OF_GOODS_SOLD') && a.status === 'ACTIVE'
    );
    if (!expenseAccount) {
      expenseAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '6000',
        name: 'Purchase Expense',
        account_type: 'EXPENSE',
        account_subtype: 'OPERATING_EXPENSE',
        normal_balance: 'DEBIT',
        description: 'Default System Operating Expense',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    let taxInputAccount = existingAccounts.find(
      (a) => (a.code === '1400' || a.name.toLowerCase().includes('input tax')) && a.status === 'ACTIVE'
    );
    if (!taxInputAccount) {
      taxInputAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '1400',
        name: 'Purchase Tax Input Receivable',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        normal_balance: 'DEBIT',
        description: 'Default System Tax Input Receivable',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    let bankAccount = existingAccounts.find(
      (a) => (a.account_subtype === 'BANK' || a.account_subtype === 'CASH_AND_EQUIVALENT') && a.status === 'ACTIVE'
    );
    if (!bankAccount) {
      bankAccount = this.createAccount({
        tenant_id: tenantId,
        legal_entity_id: legalEntityId,
        code: '1000',
        name: 'Operating Bank Account',
        account_type: 'ASSET',
        account_subtype: 'BANK',
        normal_balance: 'DEBIT',
        description: 'Default System Operating Bank Account',
        is_system_account: true,
        posting_allowed: true,
        created_by: actorId,
      });
    }

    return { apAccount, expenseAccount, taxInputAccount, bankAccount };
  }

  // --- PURCHASE REQUISITIONS ---

  public getPurchaseRequisitions(tenantId: string, params?: PaginationParams): PaginatedResult<PurchaseRequisition> {
    let items = Array.from(this.purchaseRequisitions.values()).filter(
      (pr) => pr.tenant_id === tenantId && pr.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((pr) => pr.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (pr) => pr.requisition_number.toLowerCase().includes(qry) || pr.purpose.toLowerCase().includes(qry)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getPurchaseRequisitionById(tenantId: string, reqId: string): PurchaseRequisition | undefined {
    const pr = this.purchaseRequisitions.get(reqId);
    if (!pr || pr.tenant_id !== tenantId || pr.deleted_at !== null) return undefined;
    return pr;
  }

  public createPurchaseRequisition(input: {
    tenant_id: string;
    requester_id: string;
    legal_entity_id: string;
    business_unit_id?: string | null;
    branch_id?: string | null;
    required_date: string;
    purpose: string;
    notes?: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      estimated_unit_price?: string;
    }>;
    created_by: string;
  }): PurchaseRequisition {
    const reqNumber = this.generateNextDocumentNumber(input.tenant_id, 'PURCHASE_REQUISITION', input.legal_entity_id, input.branch_id || undefined);
    const reqId = `pr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const formattedLines: PurchaseRequisitionLine[] = input.lines.map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const unitPrice = l.estimated_unit_price || '100.00';
      const lineTotal = new Decimal(unitPrice).mul(qty).toFixed(2);

      return {
        id: `prl_${reqId}_${idx + 1}`,
        requisition_id: reqId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Requisition item',
        quantity: qty,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        estimated_unit_price: new Decimal(unitPrice).toFixed(2),
        line_total: lineTotal,
      };
    });

    const pr: PurchaseRequisition = {
      id: reqId,
      tenant_id: input.tenant_id,
      requisition_number: reqNumber,
      requester_id: input.requester_id,
      legal_entity_id: input.legal_entity_id,
      business_unit_id: input.business_unit_id || null,
      branch_id: input.branch_id || null,
      required_date: input.required_date,
      purpose: input.purpose,
      notes: input.notes || '',
      status: 'DRAFT',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.purchaseRequisitions.set(pr.id, pr);
    for (const line of formattedLines) {
      this.purchaseRequisitionLines.set(line.id, line);
    }

    return pr;
  }

  public updatePurchaseRequisitionStatus(
    tenantId: string,
    requisitionId: string,
    newStatus: PurchaseRequisitionStatus,
    actorId: string,
    approvalDecision?: string
  ): PurchaseRequisition {
    const pr = this.getPurchaseRequisitionById(tenantId, requisitionId);
    if (!pr) throw new Error('Purchase Requisition not found.');

    const now = new Date().toISOString();
    pr.status = newStatus;
    if (approvalDecision) pr.approval_decision = approvalDecision;
    if (newStatus === 'APPROVED') {
      pr.approved_by = actorId;
      pr.approved_at = now;
    }
    pr.updated_at = now;
    pr.updated_by = actorId;

    this.purchaseRequisitions.set(pr.id, pr);
    return pr;
  }

  public convertRequisitionToPO(
    tenantId: string,
    requisitionId: string,
    vendorId: string,
    actorId: string
  ): PurchaseOrder {
    const pr = this.getPurchaseRequisitionById(tenantId, requisitionId);
    if (!pr) throw new Error('Purchase Requisition not found.');

    if (pr.status !== 'APPROVED') {
      throw new Error('Only APPROVED requisitions can be converted to Purchase Orders.');
    }

    const vendor = this.getVendorById(tenantId, vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    const po = this.createPurchaseOrder({
      tenant_id: tenantId,
      vendor_id: vendorId,
      legal_entity_id: pr.legal_entity_id,
      branch_id: pr.branch_id,
      currency_code: vendor.currency_code || 'INR',
      source_requisition_id: pr.id,
      lines: pr.lines.map((l) => ({
        product_id: l.product_id,
        variant_id: l.variant_id,
        sku: l.sku,
        description: l.description,
        quantity: l.quantity,
        uom_id: l.uom_id,
        unit_price: l.estimated_unit_price,
      })),
      created_by: actorId,
    });

    pr.status = 'CONVERTED';
    pr.converted_po_id = po.id;
    pr.updated_at = new Date().toISOString();
    this.purchaseRequisitions.set(pr.id, pr);

    return po;
  }

  public convertRequisitionToRFQ(
    tenantId: string,
    requisitionId: string,
    actorId: string
  ): RFQ {
    const pr = this.getPurchaseRequisitionById(tenantId, requisitionId);
    if (!pr) throw new Error('Purchase Requisition not found.');

    const rfq = this.createRFQ({
      tenant_id: tenantId,
      title: `RFQ for PR ${pr.requisition_number} - ${pr.purpose}`,
      closing_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      source_requisition_id: pr.id,
      supplier_ids: [],
      lines: pr.lines.map((l) => ({
        product_id: l.product_id,
        variant_id: l.variant_id,
        sku: l.sku,
        description: l.description,
        quantity: l.quantity,
        uom_id: l.uom_id,
      })),
      created_by: actorId,
    });

    pr.converted_rfq_id = rfq.id;
    pr.updated_at = new Date().toISOString();
    this.purchaseRequisitions.set(pr.id, pr);

    return rfq;
  }

  // --- RFQs & SUPPLIER QUOTATIONS ---

  public getRFQs(tenantId: string, params?: PaginationParams): PaginatedResult<RFQ> {
    let items = Array.from(this.rfqs.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((r) => r.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter((r) => r.rfq_number.toLowerCase().includes(qry) || r.title.toLowerCase().includes(qry));
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getRFQById(tenantId: string, rfqId: string): RFQ | undefined {
    const r = this.rfqs.get(rfqId);
    if (!r || r.tenant_id !== tenantId || r.deleted_at !== null) return undefined;
    return r;
  }

  public createRFQ(input: {
    tenant_id: string;
    title: string;
    closing_date: string;
    source_requisition_id?: string | null;
    supplier_ids?: string[];
    notes?: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
    }>;
    created_by: string;
  }): RFQ {
    const rfqNumber = this.generateNextDocumentNumber(input.tenant_id, 'RFQ', null, undefined);
    const rfqId = `rfq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const formattedLines: RFQLine[] = input.lines.map((l, idx) => ({
      id: `rfql_${rfqId}_${idx + 1}`,
      rfq_id: rfqId,
      tenant_id: input.tenant_id,
      product_id: l.product_id,
      variant_id: l.variant_id || null,
      sku: l.sku || 'SKU-000',
      description: l.description || 'RFQ line',
      quantity: l.quantity || 1,
      uom_id: l.uom_id || 'uom_unit',
    }));

    const rfq: RFQ = {
      id: rfqId,
      tenant_id: input.tenant_id,
      rfq_number: rfqNumber,
      title: input.title,
      closing_date: input.closing_date,
      source_requisition_id: input.source_requisition_id || null,
      supplier_ids: input.supplier_ids || [],
      status: 'DRAFT',
      notes: input.notes || '',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.rfqs.set(rfq.id, rfq);
    for (const l of formattedLines) {
      this.rfqLines.set(l.id, l);
    }

    return rfq;
  }

  public updateRFQStatus(tenantId: string, rfqId: string, status: RFQStatus, actorId: string): RFQ {
    const r = this.getRFQById(tenantId, rfqId);
    if (!r) throw new Error('RFQ not found.');

    r.status = status;
    r.updated_at = new Date().toISOString();
    r.updated_by = actorId;
    this.rfqs.set(r.id, r);
    return r;
  }

  public getSupplierQuotations(tenantId: string, params?: PaginationParams): PaginatedResult<SupplierQuotation> {
    let items = Array.from(this.supplierQuotations.values()).filter(
      (sq) => sq.tenant_id === tenantId && sq.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((sq) => sq.status === params.status);
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getSupplierQuotationById(tenantId: string, sqId: string): SupplierQuotation | undefined {
    const sq = this.supplierQuotations.get(sqId);
    if (!sq || sq.tenant_id !== tenantId || sq.deleted_at !== null) return undefined;
    return sq;
  }

  public createSupplierQuotation(input: {
    tenant_id: string;
    rfq_id?: string | null;
    vendor_id: string;
    vendor_reference: string;
    currency_code?: string;
    validity_date: string;
    delivery_terms?: string;
    payment_terms_id?: string | null;
    notes?: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price: string;
    }>;
    created_by: string;
  }): SupplierQuotation {
    const qtnNumber = this.generateNextDocumentNumber(input.tenant_id, 'SUPPLIER_QUOTATION', null, undefined);
    const sqId = `sq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    let grandTotal = Decimal.zero(2);

    const formattedLines: SupplierQuotationLine[] = input.lines.map((l, idx) => {
      const qty = l.quantity || 1;
      const uPrice = new Decimal(l.unit_price || '0', 2);
      const lTotal = uPrice.mul(qty);
      grandTotal = grandTotal.add(lTotal);

      return {
        id: `sql_${sqId}_${idx + 1}`,
        supplier_quotation_id: sqId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || 'SKU-000',
        description: l.description || 'Quotation line',
        quantity: qty,
        uom_id: l.uom_id || 'uom_unit',
        unit_price: uPrice.toString(2),
        line_total: lTotal.toString(2),
      };
    });

    const sq: SupplierQuotation = {
      id: sqId,
      tenant_id: input.tenant_id,
      quotation_number: qtnNumber,
      rfq_id: input.rfq_id || null,
      vendor_id: input.vendor_id,
      vendor_reference: input.vendor_reference,
      currency_code: input.currency_code || 'INR',
      validity_date: input.validity_date,
      delivery_terms: input.delivery_terms || '',
      payment_terms_id: input.payment_terms_id || null,
      status: 'RECEIVED',
      grand_total: grandTotal.toString(2),
      notes: input.notes || '',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.supplierQuotations.set(sq.id, sq);
    for (const l of formattedLines) {
      this.supplierQuotationLines.set(l.id, l);
    }

    return sq;
  }

  public updateSupplierQuotationStatus(
    tenantId: string,
    sqId: string,
    status: SupplierQuotationStatus,
    actorId: string
  ): SupplierQuotation {
    const sq = this.getSupplierQuotationById(tenantId, sqId);
    if (!sq) throw new Error('Supplier Quotation not found.');

    sq.status = status;
    sq.updated_at = new Date().toISOString();
    sq.updated_by = actorId;
    this.supplierQuotations.set(sq.id, sq);
    return sq;
  }

  // --- PURCHASE ORDERS & REVISIONS ---

  public getPurchaseOrders(tenantId: string, params?: PaginationParams): PaginatedResult<PurchaseOrder> {
    let items = Array.from(this.purchaseOrders.values()).filter(
      (po) => po.tenant_id === tenantId && po.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((po) => po.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (po) => po.po_number.toLowerCase().includes(qry) || po.reference?.toLowerCase().includes(qry)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getPurchaseOrderById(tenantId: string, poId: string): PurchaseOrder | undefined {
    const po = this.purchaseOrders.get(poId);
    if (!po || po.tenant_id !== tenantId || po.deleted_at !== null) return undefined;
    return po;
  }

  public createPurchaseOrder(input: {
    tenant_id: string;
    vendor_id: string;
    legal_entity_id: string;
    branch_id?: string | null;
    warehouse_id?: string | null;
    currency_code?: string;
    payment_terms_id?: string | null;
    order_date?: string;
    expected_delivery_date?: string | null;
    reference?: string;
    notes?: string;
    source_requisition_id?: string | null;
    source_quotation_id?: string | null;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price?: string;
      discount_amount?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
    }>;
    created_by: string;
  }): PurchaseOrder {
    const vendor = this.getVendorById(input.tenant_id, input.vendor_id);
    if (!vendor) throw new Error('Vendor does not exist.');

    const poNumber = this.generateNextDocumentNumber(input.tenant_id, 'PURCHASE_ORDER', input.legal_entity_id, input.branch_id || undefined);
    const poId = `po_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    let subtotal = Decimal.zero(2);
    let discountTotal = Decimal.zero(2);
    let taxTotal = Decimal.zero(2);

    const formattedLines: PurchaseOrderLine[] = input.lines.map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const uPrice = new Decimal(l.unit_price || '100.00', 2);
      const discAmt = new Decimal(l.discount_amount || '0', 2);
      const taxRate = new Decimal(l.tax_rate || '18.00', 2);

      const lineSub = uPrice.mul(qty);
      const netSub = lineSub.sub(discAmt);
      const taxAmt = netSub.mul(taxRate.toString()).mul('0.01');
      const lineTotal = netSub.add(taxAmt);

      subtotal = subtotal.add(lineSub);
      discountTotal = discountTotal.add(discAmt);
      taxTotal = taxTotal.add(taxAmt);

      return {
        id: `pol_${poId}_${idx + 1}`,
        po_id: poId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'PO Line',
        quantity_ordered: qty,
        quantity_received: 0,
        quantity_billed: 0,
        uom_id: l.uom_id || product?.sales_uom_id || 'uom_unit',
        unit_price: uPrice.toString(2),
        discount_amount: discAmt.toString(2),
        tax_classification_code: l.tax_classification_code || null,
        tax_rate: taxRate.toString(2),
        tax_amount: taxAmt.toString(2),
        line_subtotal: lineSub.toString(2),
        line_total: lineTotal.toString(2),
      };
    });

    const grandTotal = subtotal.sub(discountTotal).add(taxTotal);

    const po: PurchaseOrder = {
      id: poId,
      tenant_id: input.tenant_id,
      po_number: poNumber,
      vendor_id: input.vendor_id,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      warehouse_id: input.warehouse_id || null,
      currency_code: input.currency_code || vendor.currency_code || 'INR',
      payment_terms_id: input.payment_terms_id || vendor.payment_terms_id || null,
      order_date: input.order_date || nowIso.split('T')[0],
      expected_delivery_date: input.expected_delivery_date || null,
      reference: input.reference || '',
      notes: input.notes || '',
      status: 'DRAFT',
      revision_number: 1,
      subtotal: subtotal.toString(2),
      discount_total: discountTotal.toString(2),
      tax_total: taxTotal.toString(2),
      grand_total: grandTotal.toString(2),
      source_requisition_id: input.source_requisition_id || null,
      source_quotation_id: input.source_quotation_id || null,
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.purchaseOrders.set(po.id, po);
    for (const l of formattedLines) {
      this.purchaseOrderLines.set(l.id, l);
    }

    return po;
  }

  public updatePurchaseOrderStatus(
    tenantId: string,
    poId: string,
    newStatus: PurchaseOrderStatus,
    actorId: string
  ): PurchaseOrder {
    const po = this.getPurchaseOrderById(tenantId, poId);
    if (!po) throw new Error('Purchase Order not found.');

    const now = new Date().toISOString();

    if (newStatus === 'CONFIRMED' && po.status !== 'CONFIRMED') {
      const vendor = this.getVendorById(tenantId, po.vendor_id);
      po.snapshot_data = {
        vendor_legal_name: vendor?.legal_name || vendor?.vendor_name || 'Vendor',
        payment_terms_name: 'Standard Payment Terms',
        delivery_address: 'Primary Warehouse',
        confirmed_at: now,
      };
    }

    po.status = newStatus;
    po.updated_at = now;
    po.updated_by = actorId;
    this.purchaseOrders.set(po.id, po);
    return po;
  }

  public amendPurchaseOrder(
    tenantId: string,
    poId: string,
    changes: {
      notes?: string;
      lines?: Array<{
        line_id?: string;
        product_id: string;
        quantity_ordered: number;
        unit_price: string;
      }>;
    },
    actorId: string,
    reason: string
  ): PurchaseOrder {
    const po = this.getPurchaseOrderById(tenantId, poId);
    if (!po) throw new Error('Purchase Order not found.');

    const now = new Date().toISOString();

    // Create revision snapshot record
    const revisionId = `porev_${Date.now()}`;
    const revision: PurchaseOrderRevision = {
      id: revisionId,
      tenant_id: tenantId,
      po_id: poId,
      revision_number: po.revision_number,
      snapshot_json: JSON.stringify(po),
      amended_by: actorId,
      amended_at: now,
      change_reason: reason,
      created_at: now,
      updated_at: now,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.purchaseOrderRevisions.set(revisionId, revision);

    po.revision_number += 1;
    if (changes.notes !== undefined) po.notes = changes.notes;

    if (changes.lines && changes.lines.length > 0) {
      let subtotal = Decimal.zero(2);
      let taxTotal = Decimal.zero(2);

      po.lines = changes.lines.map((l, idx) => {
        const uPrice = new Decimal(l.unit_price || '100.00', 2);
        const qty = l.quantity_ordered || 1;
        const lineSub = uPrice.mul(qty);
        const taxRate = new Decimal('18.00', 2);
        const taxAmt = lineSub.mul('0.18');
        const lineTotal = lineSub.add(taxAmt);

        subtotal = subtotal.add(lineSub);
        taxTotal = taxTotal.add(taxAmt);

        return {
          id: l.line_id || `pol_${poId}_${idx + 1}`,
          po_id: poId,
          tenant_id: tenantId,
          product_id: l.product_id,
          sku: 'SKU-000',
          description: 'Amended line item',
          quantity_ordered: qty,
          quantity_received: 0,
          quantity_billed: 0,
          uom_id: 'uom_unit',
          unit_price: uPrice.toString(2),
          discount_amount: '0.00',
          tax_rate: '18.00',
          tax_amount: taxAmt.toString(2),
          line_subtotal: lineSub.toString(2),
          line_total: lineTotal.toString(2),
        };
      });

      po.subtotal = subtotal.toString(2);
      po.tax_total = taxTotal.toString(2);
      po.grand_total = subtotal.add(taxTotal).toString(2);
    }

    po.updated_at = now;
    po.updated_by = actorId;
    this.purchaseOrders.set(po.id, po);

    return po;
  }

  // --- GOODS RECEIPTS ---

  public getGoodsReceipts(tenantId: string, params?: PaginationParams): PaginatedResult<GoodsReceipt> {
    let items = Array.from(this.goodsReceipts.values()).filter(
      (gr) => gr.tenant_id === tenantId && gr.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((gr) => gr.status === params.status);
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getGoodsReceiptById(tenantId: string, grId: string): GoodsReceipt | undefined {
    const gr = this.goodsReceipts.get(grId);
    if (!gr || gr.tenant_id !== tenantId || gr.deleted_at !== null) return undefined;
    return gr;
  }

  public createGoodsReceipt(input: {
    tenant_id: string;
    po_id: string;
    warehouse_id: string;
    receipt_date?: string;
    received_by: string;
    reference?: string;
    notes?: string;
    lines: Array<{
      po_line_id: string;
      product_id: string;
      uom_id?: string;
      quantity_ordered: number;
      quantity_received: number;
      quantity_accepted?: number;
      quantity_rejected?: number;
      condition_status?: string;
    }>;
    created_by: string;
  }): GoodsReceipt {
    const po = this.getPurchaseOrderById(input.tenant_id, input.po_id);
    if (!po) throw new Error('Purchase Order not found.');

    const grNumber = this.generateNextDocumentNumber(input.tenant_id, 'GOODS_RECEIPT', po.legal_entity_id, po.branch_id || undefined);
    const grId = `gr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const formattedLines: GoodsReceiptLine[] = input.lines.map((l, idx) => {
      const qRec = l.quantity_received || 0;
      const qAcc = l.quantity_accepted !== undefined ? l.quantity_accepted : qRec;
      const qRej = l.quantity_rejected || 0;

      // Update PO line received quantity
      const poLine = po.lines.find((pol) => pol.id === l.po_line_id);
      if (poLine) {
        poLine.quantity_received += qAcc;
      }

      return {
        id: `grl_${grId}_${idx + 1}`,
        receipt_id: grId,
        tenant_id: input.tenant_id,
        po_line_id: l.po_line_id,
        product_id: l.product_id,
        uom_id: l.uom_id || 'uom_unit',
        quantity_ordered: l.quantity_ordered,
        quantity_received: qRec,
        quantity_accepted: qAcc,
        quantity_rejected: qRej,
        condition_status: l.condition_status || 'GOOD',
      };
    });

    const gr: GoodsReceipt = {
      id: grId,
      tenant_id: input.tenant_id,
      receipt_number: grNumber,
      po_id: input.po_id,
      warehouse_id: input.warehouse_id,
      receipt_date: input.receipt_date || nowIso.split('T')[0],
      received_by: input.received_by,
      status: 'ACCEPTED',
      reference: input.reference || '',
      notes: input.notes || '',
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.goodsReceipts.set(gr.id, gr);
    for (const l of formattedLines) {
      this.goodsReceiptLines.set(l.id, l);
    }

    // Check PO overall received status
    const allReceived = po.lines.every((pol) => pol.quantity_received >= pol.quantity_ordered);
    po.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    po.updated_at = nowIso;
    this.purchaseOrders.set(po.id, po);

    this.recordAuditLog({
      tenant_id: input.tenant_id,
      actor_id: input.created_by,
      actor_email: 'system@billvyom.internal',
      action: 'GOODS_RECEIPT_CREATED',
      resource_type: 'GoodsReceipt',
      resource_id: gr.id,
      changes: { receipt_number: gr.receipt_number, po_id: po.id },
    });

    return gr;
  }

  // --- VENDOR BILLS & MATCHING ENGINE ---

  public getVendorBills(tenantId: string, params?: PaginationParams): PaginatedResult<VendorBill> {
    let items = Array.from(this.vendorBills.values()).filter(
      (vb) => vb.tenant_id === tenantId && vb.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((vb) => vb.status === params.status);
    }
    if (params?.query) {
      const qry = params.query.toLowerCase();
      items = items.filter(
        (vb) =>
          vb.bill_number.toLowerCase().includes(qry) ||
          vb.supplier_invoice_number.toLowerCase().includes(qry)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getVendorBillById(tenantId: string, billId: string): VendorBill | undefined {
    const vb = this.vendorBills.get(billId);
    if (!vb || vb.tenant_id !== tenantId || vb.deleted_at !== null) return undefined;
    return vb;
  }

  public createVendorBillDraft(input: {
    tenant_id: string;
    vendor_id: string;
    legal_entity_id: string;
    branch_id?: string | null;
    currency_code?: string;
    exchange_rate?: string;
    bill_date?: string;
    supplier_invoice_number: string;
    due_date: string;
    payment_terms_id?: string | null;
    source_po_id?: string | null;
    source_receipt_id?: string | null;
    reference?: string;
    lines: Array<{
      po_line_id?: string | null;
      receipt_line_id?: string | null;
      product_id: string;
      sku?: string;
      description?: string;
      quantity: number;
      uom_id?: string;
      unit_price: string;
      discount_amount?: string;
      tax_classification_code?: string | null;
      tax_rate?: string;
    }>;
    created_by: string;
  }): VendorBill {
    // Duplicate invoice check
    const existingDup = Array.from(this.vendorBills.values()).find(
      (vb) =>
        vb.tenant_id === input.tenant_id &&
        vb.vendor_id === input.vendor_id &&
        vb.legal_entity_id === input.legal_entity_id &&
        vb.supplier_invoice_number.trim().toLowerCase() === input.supplier_invoice_number.trim().toLowerCase() &&
        vb.deleted_at === null
    );

    if (existingDup) {
      throw new Error(`Duplicate Vendor Invoice detected! Supplier Invoice #${input.supplier_invoice_number} already exists for this vendor.`);
    }

    const billNumber = this.generateNextDocumentNumber(input.tenant_id, 'VENDOR_BILL', input.legal_entity_id, input.branch_id || undefined);
    const billId = `vb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    let subtotal = Decimal.zero(2);
    let discountTotal = Decimal.zero(2);
    let taxTotal = Decimal.zero(2);

    const formattedLines: VendorBillLine[] = input.lines.map((l, idx) => {
      const product = this.getProductById(input.tenant_id, l.product_id);
      const qty = l.quantity || 1;
      const uPrice = new Decimal(l.unit_price || '0', 2);
      const discAmt = new Decimal(l.discount_amount || '0', 2);
      const taxRate = new Decimal(l.tax_rate || '18.00', 2);

      const lineSub = uPrice.mul(qty);
      const netSub = lineSub.sub(discAmt);
      const taxAmt = netSub.mul(taxRate.toString()).mul('0.01');
      const lineTotal = netSub.add(taxAmt);

      subtotal = subtotal.add(lineSub);
      discountTotal = discountTotal.add(discAmt);
      taxTotal = taxTotal.add(taxAmt);

      return {
        id: `vbl_${billId}_${idx + 1}`,
        bill_id: billId,
        tenant_id: input.tenant_id,
        po_line_id: l.po_line_id || null,
        receipt_line_id: l.receipt_line_id || null,
        product_id: l.product_id,
        sku: l.sku || product?.product_code || 'SKU-000',
        description: l.description || product?.name || 'Bill Line Item',
        quantity: qty,
        uom_id: l.uom_id || 'uom_unit',
        unit_price: uPrice.toString(2),
        discount_amount: discAmt.toString(2),
        tax_classification_code: l.tax_classification_code || null,
        tax_rate: taxRate.toString(2),
        tax_amount: taxAmt.toString(2),
        line_subtotal: lineSub.toString(2),
        line_total: lineTotal.toString(2),
      };
    });

    const grandTotal = subtotal.sub(discountTotal).add(taxTotal);

    const vb: VendorBill = {
      id: billId,
      tenant_id: input.tenant_id,
      bill_number: billNumber,
      vendor_id: input.vendor_id,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      currency_code: input.currency_code || 'INR',
      exchange_rate: input.exchange_rate || '1.0000',
      bill_date: input.bill_date || nowIso.split('T')[0],
      supplier_invoice_number: input.supplier_invoice_number.trim(),
      due_date: input.due_date,
      payment_terms_id: input.payment_terms_id || null,
      source_po_id: input.source_po_id || null,
      source_receipt_id: input.source_receipt_id || null,
      reference: input.reference || '',
      status: 'DRAFT',
      matching_status: input.source_po_id ? 'VARIANCE' : 'NOT_REQUIRED',
      subtotal: subtotal.toString(2),
      discount_total: discountTotal.toString(2),
      tax_total: taxTotal.toString(2),
      grand_total: grandTotal.toString(2),
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.vendorBills.set(vb.id, vb);
    for (const l of formattedLines) {
      this.vendorBillLines.set(l.id, l);
    }

    // Auto-run matching if PO attached
    if (vb.source_po_id) {
      this.performBillMatching(input.tenant_id, vb.id);
    }

    return vb;
  }

  public performBillMatching(
    tenantId: string,
    billId: string
  ): { result: BillMatchingResult; exceptions: BillMatchingException[] } {
    const bill = this.getVendorBillById(tenantId, billId);
    if (!bill) throw new Error('Vendor Bill not found.');

    const po = bill.source_po_id ? this.getPurchaseOrderById(tenantId, bill.source_po_id) : undefined;
    const receipt = bill.source_receipt_id ? this.getGoodsReceiptById(tenantId, bill.source_receipt_id) : undefined;

    const matchType: 'TWO_WAY' | 'THREE_WAY' = receipt ? 'THREE_WAY' : 'TWO_WAY';
    const exceptions: BillMatchingException[] = [];
    const nowIso = new Date().toISOString();

    if (!po) {
      const matchResult: BillMatchingResult = {
        id: `bm_${Date.now()}`,
        tenant_id: tenantId,
        bill_id: billId,
        po_id: null,
        receipt_id: null,
        match_type: 'TWO_WAY',
        status: 'NOT_REQUIRED',
        computed_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: 'system',
        updated_by: 'system',
        deleted_at: null,
        version: 1,
      };
      this.billMatchingResults.set(matchResult.id, matchResult);
      bill.matching_status = 'NOT_REQUIRED';
      this.vendorBills.set(bill.id, bill);
      return { result: matchResult, exceptions: [] };
    }

    // Perform Price & Quantity Check against PO lines
    for (const bline of bill.lines) {
      const poline = po.lines.find((p) => p.id === bline.po_line_id || p.product_id === bline.product_id);
      if (!poline) {
        exceptions.push({
          id: `bmex_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          tenant_id: tenantId,
          bill_id: billId,
          exception_type: 'MISSING_PO',
          expected_value: 'Valid PO Line',
          actual_value: `Product ${bline.product_id}`,
          difference: '0.00',
          status: 'OPEN',
          created_at: nowIso,
          updated_at: nowIso,
          created_by: 'system',
          updated_by: 'system',
          deleted_at: null,
          version: 1,
        });
        continue;
      }

      // Quantity Variance Check
      if (bline.quantity !== poline.quantity_ordered) {
        exceptions.push({
          id: `bmex_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          tenant_id: tenantId,
          bill_id: billId,
          exception_type: 'QTY_VARIANCE',
          expected_value: poline.quantity_ordered.toString(),
          actual_value: bline.quantity.toString(),
          difference: (bline.quantity - poline.quantity_ordered).toString(),
          status: 'OPEN',
          created_at: nowIso,
          updated_at: nowIso,
          created_by: 'system',
          updated_by: 'system',
          deleted_at: null,
          version: 1,
        });
      }

      // Price Variance Check
      const bPrice = new Decimal(bline.unit_price);
      const pPrice = new Decimal(poline.unit_price);
      if (!bPrice.equals(pPrice)) {
        exceptions.push({
          id: `bmex_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          tenant_id: tenantId,
          bill_id: billId,
          exception_type: 'PRICE_VARIANCE',
          expected_value: pPrice.toString(2),
          actual_value: bPrice.toString(2),
          difference: bPrice.sub(pPrice).toString(2),
          status: 'OPEN',
          created_at: nowIso,
          updated_at: nowIso,
          created_by: 'system',
          updated_by: 'system',
          deleted_at: null,
          version: 1,
        });
      }
    }

    const matchingStatus: MatchingStatus = exceptions.length === 0 ? 'MATCHED' : 'VARIANCE';

    const result: BillMatchingResult = {
      id: `bm_${Date.now()}`,
      tenant_id: tenantId,
      bill_id: billId,
      po_id: po.id,
      receipt_id: receipt?.id || null,
      match_type: matchType,
      status: matchingStatus,
      computed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: 'system',
      updated_by: 'system',
      deleted_at: null,
      version: 1,
    };

    this.billMatchingResults.set(result.id, result);
    for (const ex of exceptions) {
      this.billMatchingExceptions.set(ex.id, ex);
    }

    bill.matching_status = matchingStatus;
    this.vendorBills.set(bill.id, bill);

    return { result, exceptions };
  }

  public updateVendorBillStatus(
    tenantId: string,
    billId: string,
    newStatus: VendorBillStatus,
    actorId: string
  ): VendorBill {
    const bill = this.getVendorBillById(tenantId, billId);
    if (!bill) throw new Error('Vendor Bill not found.');

    const now = new Date().toISOString();
    bill.status = newStatus;
    bill.updated_at = now;
    bill.updated_by = actorId;
    this.vendorBills.set(bill.id, bill);
    return bill;
  }

  public postVendorBill(
    tenantId: string,
    billId: string,
    actorId: string
  ): { bill: VendorBill; journalEntry: JournalEntry; payable: Payable } {
    const bill = this.getVendorBillById(tenantId, billId);
    if (!bill) throw new Error('Vendor Bill not found.');

    if (bill.status === 'POSTED') {
      throw new Error('Vendor Bill is already POSTED.');
    }

    const { apAccount, expenseAccount, taxInputAccount } = this.getOrCreateDefaultAPAccounts(
      tenantId,
      bill.legal_entity_id,
      actorId
    );

    const subtotalDec = new Decimal(bill.subtotal, 2);
    const taxTotalDec = new Decimal(bill.tax_total, 2);
    const grandTotalDec = new Decimal(bill.grand_total, 2);

    // Journal Entry Lines
    const journalLines = [
      {
        account_id: expenseAccount.id,
        debit: subtotalDec.toString(2),
        credit: '0.00',
        description: `Purchase Expense for Vendor Bill ${bill.bill_number}`,
      },
    ];

    if (taxTotalDec.greaterThan(0)) {
      journalLines.push({
        account_id: taxInputAccount.id,
        debit: taxTotalDec.toString(2),
        credit: '0.00',
        description: `Tax Input for Vendor Bill ${bill.bill_number}`,
      });
    }

    journalLines.push({
      account_id: apAccount.id,
      debit: '0.00',
      credit: grandTotalDec.toString(2),
      description: `Accounts Payable Liability for Vendor Bill ${bill.bill_number}`,
    });

    const journalEntry = this.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: bill.legal_entity_id,
      currency_code: bill.currency_code,
      exchange_rate: bill.exchange_rate,
      transaction_date: bill.bill_date,
      document_date: bill.bill_date,
      reference: bill.bill_number,
      description: `Vendor Bill Posting: ${bill.supplier_invoice_number}`,
      source_type: 'VENDOR_BILL' as any,
      lines: journalLines,
      posted_by: actorId,
    });

    // Create Payable record in AP subledger
    const payableNumber = this.generateNextDocumentNumber(tenantId, 'INVOICE' as any, bill.legal_entity_id, bill.branch_id || undefined);
    const payableId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const payable: Payable = {
      id: payableId,
      tenant_id: tenantId,
      payable_number: payableNumber,
      vendor_id: bill.vendor_id,
      legal_entity_id: bill.legal_entity_id,
      branch_id: bill.branch_id,
      source_type: 'VENDOR_BILL',
      source_bill_id: bill.id,
      bill_date: bill.bill_date,
      due_date: bill.due_date,
      currency_code: bill.currency_code,
      original_amount: grandTotalDec.toString(2),
      allocated_amount: '0.00',
      outstanding_amount: grandTotalDec.toString(2),
      status: 'OPEN',
      notes: `Payable for Vendor Invoice #${bill.supplier_invoice_number}`,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    this.payables.set(payable.id, payable);

    // Update Vendor Bill
    bill.status = 'POSTED';
    bill.posted_at = nowIso;
    bill.posted_by = actorId;
    bill.journal_entry_id = journalEntry.id;
    bill.updated_at = nowIso;
    bill.updated_by = actorId;

    this.vendorBills.set(bill.id, bill);

    // Update PO quantity_billed if source PO exists
    if (bill.source_po_id) {
      const po = this.getPurchaseOrderById(tenantId, bill.source_po_id);
      if (po) {
        for (const bline of bill.lines) {
          const poline = po.lines.find((p) => p.id === bline.po_line_id || p.product_id === bline.product_id);
          if (poline) {
            poline.quantity_billed += bline.quantity;
          }
        }
        const allBilled = po.lines.every((p) => p.quantity_billed >= p.quantity_ordered);
        po.status = allBilled ? 'BILLED' : 'PARTIALLY_BILLED';
        po.updated_at = nowIso;
        this.purchaseOrders.set(po.id, po);
      }
    }

    this.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'system@billvyom.internal',
      action: 'VENDOR_BILL_POSTED',
      resource_type: 'VendorBill',
      resource_id: bill.id,
      changes: { bill_number: bill.bill_number, grand_total: bill.grand_total, journal_entry_id: journalEntry.id },
    });

    return { bill, journalEntry, payable };
  }

  // --- ACCOUNTS PAYABLE SUBLEDGER & VENDOR AP LEDGER ---

  public getPayables(tenantId: string, params?: PaginationParams): PaginatedResult<Payable> {
    let items = Array.from(this.payables.values()).filter(
      (p) => p.tenant_id === tenantId && p.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((p) => p.status === params.status);
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getPayableById(tenantId: string, payableId: string): Payable | undefined {
    const p = this.payables.get(payableId);
    if (!p || p.tenant_id !== tenantId || p.deleted_at !== null) return undefined;
    return p;
  }

  public getVendorAPLedger(
    tenantId: string,
    vendorId: string,
    startDate?: string,
    endDate?: string
  ): {
    vendor_id: string;
    opening_balance: string;
    total_bills: string;
    total_payments: string;
    closing_balance: string;
    payables: Payable[];
    payments: VendorPayment[];
  } {
    const vendorPayables = Array.from(this.payables.values()).filter(
      (p) => p.tenant_id === tenantId && p.vendor_id === vendorId && p.deleted_at === null
    );

    const vendorPayments = Array.from(this.vendorPayments.values()).filter(
      (vp) => vp.tenant_id === tenantId && vp.vendor_id === vendorId && vp.status === 'CONFIRMED' && vp.deleted_at === null
    );

    let totalBills = Decimal.zero(2);
    let totalPayments = Decimal.zero(2);

    for (const p of vendorPayables) {
      totalBills = totalBills.add(new Decimal(p.original_amount));
    }
    for (const vp of vendorPayments) {
      totalPayments = totalPayments.add(new Decimal(vp.amount));
    }

    const closingBal = totalBills.sub(totalPayments);

    return {
      vendor_id: vendorId,
      opening_balance: '0.00',
      total_bills: totalBills.toString(2),
      total_payments: totalPayments.toString(2),
      closing_balance: closingBal.toString(2),
      payables: vendorPayables,
      payments: vendorPayments,
    };
  }

  public getAPAging(
    tenantId: string,
    legalEntityId?: string,
    asOfDate?: string
  ): {
    as_of_date: string;
    total_payable: string;
    buckets: {
      current: string;
      days_1_30: string;
      days_31_60: string;
      days_61_90: string;
      days_90_plus: string;
    };
    payables_count: number;
  } {
    const targetDateStr = asOfDate || new Date().toISOString().split('T')[0];
    const targetDate = new Date(targetDateStr).getTime();

    let openPayables = Array.from(this.payables.values()).filter(
      (p) =>
        p.tenant_id === tenantId &&
        (!legalEntityId || p.legal_entity_id === legalEntityId) &&
        (p.status === 'OPEN' || p.status === 'PARTIALLY_SETTLED' || p.status === 'OVERDUE') &&
        p.deleted_at === null
    );

    let cur = Decimal.zero(2);
    let d1_30 = Decimal.zero(2);
    let d31_60 = Decimal.zero(2);
    let d61_90 = Decimal.zero(2);
    let d90Plus = Decimal.zero(2);
    let grandTotal = Decimal.zero(2);

    for (const p of openPayables) {
      const outstanding = new Decimal(p.outstanding_amount);
      if (outstanding.equals(0)) continue;

      grandTotal = grandTotal.add(outstanding);
      const dueDate = new Date(p.due_date).getTime();
      const diffDays = Math.floor((targetDate - dueDate) / (1000 * 3600 * 24));

      if (diffDays <= 0) cur = cur.add(outstanding);
      else if (diffDays <= 30) d1_30 = d1_30.add(outstanding);
      else if (diffDays <= 60) d31_60 = d31_60.add(outstanding);
      else if (diffDays <= 90) d61_90 = d61_90.add(outstanding);
      else d90Plus = d90Plus.add(outstanding);
    }

    return {
      as_of_date: targetDateStr,
      total_payable: grandTotal.toString(2),
      buckets: {
        current: cur.toString(2),
        days_1_30: d1_30.toString(2),
        days_31_60: d31_60.toString(2),
        days_61_90: d61_90.toString(2),
        days_90_plus: d90Plus.toString(2),
      },
      payables_count: openPayables.length,
    };
  }

  // --- VENDOR PAYMENTS, ALLOCATIONS & REVERSALS ---

  public getVendorPayments(tenantId: string, params?: PaginationParams): PaginatedResult<VendorPayment> {
    let items = Array.from(this.vendorPayments.values()).filter(
      (vp) => vp.tenant_id === tenantId && vp.deleted_at === null
    );

    if (params?.status) {
      items = items.filter((vp) => vp.status === params.status);
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public getVendorPaymentById(tenantId: string, paymentId: string): VendorPayment | undefined {
    const vp = this.vendorPayments.get(paymentId);
    if (!vp || vp.tenant_id !== tenantId || vp.deleted_at !== null) return undefined;
    return vp;
  }

  public createVendorPayment(input: {
    tenant_id: string;
    vendor_id: string;
    legal_entity_id: string;
    branch_id?: string | null;
    payment_date?: string;
    currency_code?: string;
    amount: string;
    payment_method: string;
    payment_channel?: string;
    bank_account_id?: string | null;
    reference?: string;
    external_reference?: string;
    notes?: string;
    created_by: string;
  }): VendorPayment {
    const vendor = this.getVendorById(input.tenant_id, input.vendor_id);
    if (!vendor) throw new Error('Vendor does not exist.');

    // Check Vendor Hold status
    const activeHold = Array.from(this.vendorHolds.values()).find(
      (vh) => vh.tenant_id === input.tenant_id && vh.vendor_id === input.vendor_id && vh.status === 'ACTIVE'
    );
    if (activeHold) {
      throw new Error(`Vendor ${vendor.vendor_name} is currently on PAYMENT HOLD (${activeHold.reason}). Payment generation blocked.`);
    }

    const paymentNumber = this.generateNextDocumentNumber(input.tenant_id, 'VENDOR_PAYMENT', input.legal_entity_id, input.branch_id || undefined);
    const paymentId = `vp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const amtDec = new Decimal(input.amount, 2);

    const vp: VendorPayment = {
      id: paymentId,
      tenant_id: input.tenant_id,
      payment_number: paymentNumber,
      vendor_id: input.vendor_id,
      legal_entity_id: input.legal_entity_id,
      branch_id: input.branch_id || null,
      payment_date: input.payment_date || nowIso.split('T')[0],
      currency_code: input.currency_code || vendor.currency_code || 'INR',
      amount: amtDec.toString(2),
      payment_method: input.payment_method || 'BANK_TRANSFER',
      payment_channel: input.payment_channel || 'ACH',
      bank_account_id: input.bank_account_id || null,
      reference: input.reference || `REF-${paymentNumber}`,
      external_reference: input.external_reference || '',
      status: 'APPROVED',
      unapplied_amount: amtDec.toString(2),
      notes: input.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.vendorPayments.set(vp.id, vp);
    return vp;
  }

  public confirmVendorPayment(
    tenantId: string,
    paymentId: string,
    allocations: Array<{ payable_id: string; amount: string }>,
    actorId: string
  ): { payment: VendorPayment; journalEntry: JournalEntry } {
    const payment = this.getVendorPaymentById(tenantId, paymentId);
    if (!payment) throw new Error('Vendor Payment not found.');

    if (payment.status === 'CONFIRMED') {
      throw new Error('Vendor Payment is already CONFIRMED.');
    }

    const { apAccount, bankAccount } = this.getOrCreateDefaultAPAccounts(
      tenantId,
      payment.legal_entity_id,
      actorId
    );

    const totalAmtDec = new Decimal(payment.amount, 2);
    let totalAllocated = Decimal.zero(2);

    for (const alloc of allocations) {
      const payable = this.getPayableById(tenantId, alloc.payable_id);
      if (!payable) throw new Error(`Payable ${alloc.payable_id} not found.`);

      const allocAmtDec = new Decimal(alloc.amount, 2);
      const outstandingDec = new Decimal(payable.outstanding_amount, 2);

      if (allocAmtDec.greaterThan(outstandingDec)) {
        throw new Error(`Allocation amount ${alloc.amount} exceeds outstanding payable balance ${payable.outstanding_amount}.`);
      }

      const newAllocated = new Decimal(payable.allocated_amount).add(allocAmtDec);
      const newOutstanding = outstandingDec.sub(allocAmtDec);

      payable.allocated_amount = newAllocated.toString(2);
      payable.outstanding_amount = newOutstanding.toString(2);
      payable.status = newOutstanding.equals(0) ? 'SETTLED' : 'PARTIALLY_SETTLED';
      payable.updated_at = new Date().toISOString();
      this.payables.set(payable.id, payable);

      // Record Allocation entity
      const allocRecordId = `vpa_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      this.vendorPaymentAllocations.set(allocRecordId, {
        id: allocRecordId,
        tenant_id: tenantId,
        payment_id: paymentId,
        payable_id: payable.id,
        allocated_amount: allocAmtDec.toString(2),
        allocation_date: payment.payment_date,
        currency_code: payment.currency_code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: actorId,
        updated_by: actorId,
        deleted_at: null,
        version: 1,
      });

      totalAllocated = totalAllocated.add(allocAmtDec);
    }

    const unappliedDec = totalAmtDec.sub(totalAllocated);

    // Journal Entry for Payment:
    // Debit Accounts Payable (totalAmtDec)
    // Credit Operating Bank Account (totalAmtDec)
    const journalEntry = this.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: payment.legal_entity_id,
      currency_code: payment.currency_code,
      transaction_date: payment.payment_date,
      document_date: payment.payment_date,
      reference: payment.payment_number,
      description: `Vendor Payment Confirmation ${payment.payment_number}`,
      source_type: 'VENDOR_PAYMENT' as any,
      lines: [
        {
          account_id: apAccount.id,
          debit: totalAmtDec.toString(2),
          credit: '0.00',
          description: `AP Settlement by Vendor Payment ${payment.payment_number}`,
        },
        {
          account_id: bankAccount.id,
          debit: '0.00',
          credit: totalAmtDec.toString(2),
          description: `Bank Disbursement for Vendor Payment ${payment.payment_number}`,
        },
      ],
      posted_by: actorId,
    });

    payment.status = 'CONFIRMED';
    payment.unapplied_amount = unappliedDec.toString(2);
    payment.journal_entry_id = journalEntry.id;
    payment.updated_at = new Date().toISOString();
    payment.updated_by = actorId;

    this.vendorPayments.set(payment.id, payment);

    this.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'system@billvyom.internal',
      action: 'VENDOR_PAYMENT_CONFIRMED',
      resource_type: 'VendorPayment',
      resource_id: payment.id,
      changes: { payment_number: payment.payment_number, amount: payment.amount, journal_entry_id: journalEntry.id },
    });

    return { payment, journalEntry };
  }

  public reverseVendorPayment(
    tenantId: string,
    paymentId: string,
    reason: string,
    actorId: string
  ): { payment: VendorPayment; reversalEntry: JournalEntry } {
    const payment = this.getVendorPaymentById(tenantId, paymentId);
    if (!payment) throw new Error('Vendor Payment not found.');

    if (payment.status === 'REVERSED') {
      throw new Error('Vendor Payment is already REVERSED.');
    }

    const nowIso = new Date().toISOString();

    // Reverse Allocations on Payables
    const allocs = Array.from(this.vendorPaymentAllocations.values()).filter(
      (vpa) => vpa.tenant_id === tenantId && vpa.payment_id === paymentId
    );

    for (const vpa of allocs) {
      const payable = this.getPayableById(tenantId, vpa.payable_id);
      if (payable) {
        const allocAmt = new Decimal(vpa.allocated_amount, 2);
        const curAllocated = new Decimal(payable.allocated_amount, 2);
        const curOutstanding = new Decimal(payable.outstanding_amount, 2);

        payable.allocated_amount = curAllocated.sub(allocAmt).toString(2);
        payable.outstanding_amount = curOutstanding.add(allocAmt).toString(2);
        payable.status = 'OPEN';
        payable.updated_at = nowIso;
        this.payables.set(payable.id, payable);
      }
    }

    // Reverse Journal Entry
    let reversalEntry: JournalEntry;
    if (payment.journal_entry_id) {
      const result = this.reverseJournalEntry(
        tenantId,
        payment.journal_entry_id,
        `Reversal of Vendor Payment ${payment.payment_number}: ${reason}`,
        actorId
      );
      reversalEntry = result.reversal;
    } else {
      const { apAccount, bankAccount } = this.getOrCreateDefaultAPAccounts(
        tenantId,
        payment.legal_entity_id,
        actorId
      );
      reversalEntry = this.postJournalEntry({
        tenant_id: tenantId,
        legal_entity_id: payment.legal_entity_id,
        currency_code: payment.currency_code,
        transaction_date: nowIso.split('T')[0],
        document_date: nowIso.split('T')[0],
        reference: `REV-${payment.payment_number}`,
        description: `Reversal of Vendor Payment ${payment.payment_number}: ${reason}`,
        source_type: 'VENDOR_PAYMENT' as any,
        lines: [
          {
            account_id: bankAccount.id,
            debit: payment.amount,
            credit: '0.00',
            description: `Bank refund on payment reversal`,
          },
          {
            account_id: apAccount.id,
            debit: '0.00',
            credit: payment.amount,
            description: `Restoring AP liability on payment reversal`,
          },
        ],
        posted_by: actorId,
      });
    }

    // Record Reversal entity
    const reversalRecord: VendorPaymentReversal = {
      id: `vpr_${Date.now()}`,
      tenant_id: tenantId,
      payment_id: paymentId,
      reversal_date: nowIso.split('T')[0],
      reason,
      journal_entry_id: reversalEntry.id,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.vendorPaymentReversals.set(reversalRecord.id, reversalRecord);

    payment.status = 'REVERSED';
    payment.updated_at = nowIso;
    payment.updated_by = actorId;
    this.vendorPayments.set(payment.id, payment);

    return { payment, reversalEntry };
  }

  // --- VENDOR PAYMENT BATCHES ---

  public getVendorPaymentBatches(tenantId: string, params?: PaginationParams): PaginatedResult<VendorPaymentBatch> {
    let items = Array.from(this.vendorPaymentBatches.values()).filter(
      (vpb) => vpb.tenant_id === tenantId && vpb.deleted_at === null
    );

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public createVendorPaymentBatch(input: {
    tenant_id: string;
    payment_ids: string[];
    bank_account_id?: string | null;
    payment_method?: string;
    created_by: string;
  }): VendorPaymentBatch {
    const batchNumber = `BATCH-${Date.now().toString().slice(-6)}`;
    const batchId = `vpb_${Date.now()}`;
    const nowIso = new Date().toISOString();

    let totalAmt = Decimal.zero(2);
    for (const pid of input.payment_ids) {
      const p = this.getVendorPaymentById(input.tenant_id, pid);
      if (p) totalAmt = totalAmt.add(new Decimal(p.amount));
    }

    const batch: VendorPaymentBatch = {
      id: batchId,
      tenant_id: input.tenant_id,
      batch_number: batchNumber,
      payment_date: nowIso.split('T')[0],
      payment_method: input.payment_method || 'BANK_TRANSFER',
      bank_account_id: input.bank_account_id || null,
      status: 'APPROVED',
      total_amount: totalAmt.toString(2),
      currency_code: 'INR',
      payment_ids: input.payment_ids,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.vendorPaymentBatches.set(batch.id, batch);
    return batch;
  }

  // --- VENDOR CREDIT NOTES & DEBIT NOTES ---

  public createVendorCreditNote(input: {
    tenant_id: string;
    vendor_id: string;
    legal_entity_id: string;
    source_bill_id?: string | null;
    currency_code?: string;
    reason: string;
    amount: string;
    created_by: string;
  }): VendorCreditNote {
    const cnNumber = this.generateNextDocumentNumber(input.tenant_id, 'VENDOR_CREDIT_NOTE', input.legal_entity_id, undefined);
    const cnId = `vcn_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const amtDec = new Decimal(input.amount, 2);

    const cn: VendorCreditNote = {
      id: cnId,
      tenant_id: input.tenant_id,
      credit_note_number: cnNumber,
      source_bill_id: input.source_bill_id || null,
      vendor_id: input.vendor_id,
      legal_entity_id: input.legal_entity_id,
      currency_code: input.currency_code || 'INR',
      reason: input.reason,
      subtotal: amtDec.toString(2),
      tax_total: '0.00',
      grand_total: amtDec.toString(2),
      status: 'ISSUED',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.vendorCreditNotes.set(cn.id, cn);
    return cn;
  }

  public createVendorDebitNote(input: {
    tenant_id: string;
    vendor_id: string;
    legal_entity_id: string;
    source_bill_id?: string | null;
    currency_code?: string;
    reason: string;
    amount: string;
    created_by: string;
  }): VendorDebitNote {
    const dnNumber = this.generateNextDocumentNumber(input.tenant_id, 'VENDOR_DEBIT_NOTE', input.legal_entity_id, undefined);
    const dnId = `vdn_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const amtDec = new Decimal(input.amount, 2);

    const dn: VendorDebitNote = {
      id: dnId,
      tenant_id: input.tenant_id,
      debit_note_number: dnNumber,
      source_bill_id: input.source_bill_id || null,
      vendor_id: input.vendor_id,
      legal_entity_id: input.legal_entity_id,
      currency_code: input.currency_code || 'INR',
      reason: input.reason,
      subtotal: amtDec.toString(2),
      tax_total: '0.00',
      grand_total: amtDec.toString(2),
      status: 'ISSUED',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.vendorDebitNotes.set(dn.id, dn);
    return dn;
  }

  // --- VENDOR BANK ACCOUNTS & VENDOR HOLDS ---

  public getVendorBankAccounts(tenantId: string, vendorId: string): VendorBankAccount[] {
    return Array.from(this.vendorBankAccounts.values()).filter(
      (vba) => vba.tenant_id === tenantId && vba.vendor_id === vendorId && vba.deleted_at === null
    );
  }

  public addVendorBankAccount(input: {
    tenant_id: string;
    vendor_id: string;
    bank_name: string;
    account_number: string;
    iban_swift?: string;
    routing_code?: string;
    beneficiary_name: string;
    is_primary?: boolean;
    created_by: string;
  }): VendorBankAccount {
    const id = `vba_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const vba: VendorBankAccount = {
      id,
      tenant_id: input.tenant_id,
      vendor_id: input.vendor_id,
      bank_name: input.bank_name,
      account_number: input.account_number,
      iban_swift: input.iban_swift || '',
      routing_code: input.routing_code || '',
      beneficiary_name: input.beneficiary_name,
      is_primary: input.is_primary || false,
      status: 'APPROVED',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.vendorBankAccounts.set(vba.id, vba);
    return vba;
  }

  public getVendorHolds(tenantId: string, vendorId: string): VendorHold[] {
    return Array.from(this.vendorHolds.values()).filter(
      (vh) => vh.tenant_id === tenantId && vh.vendor_id === vendorId && vh.deleted_at === null
    );
  }

  public createVendorHold(tenantId: string, vendorId: string, reason: string, actorId: string): VendorHold {
    const id = `vh_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const hold: VendorHold = {
      id,
      tenant_id: tenantId,
      vendor_id: vendorId,
      reason,
      status: 'ACTIVE',
      placed_by: actorId,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    this.vendorHolds.set(hold.id, hold);
    return hold;
  }

  public releaseVendorHold(tenantId: string, holdId: string, releaseReason: string, actorId: string): VendorHold {
    const hold = this.vendorHolds.get(holdId);
    if (!hold || hold.tenant_id !== tenantId) throw new Error('Vendor hold not found.');

    const nowIso = new Date().toISOString();
    hold.status = 'RELEASED';
    hold.released_by = actorId;
    hold.released_at = nowIso;
    hold.release_reason = releaseReason;
    hold.updated_at = nowIso;
    hold.updated_by = actorId;

    this.vendorHolds.set(hold.id, hold);
    return hold;
  }

  // --- AP WRITE-OFFS & AP RECONCILIATION ---

  public createAPWriteOffRequest(input: {
    tenant_id: string;
    vendor_id: string;
    payable_id: string;
    amount: string;
    reason: string;
    created_by: string;
  }): APWriteOffRequest {
    const reqNumber = `APWO-${Date.now().toString().slice(-6)}`;
    const id = `apwor_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const req: APWriteOffRequest = {
      id,
      tenant_id: input.tenant_id,
      request_number: reqNumber,
      vendor_id: input.vendor_id,
      payable_id: input.payable_id,
      amount: new Decimal(input.amount, 2).toString(2),
      reason: input.reason,
      status: 'PENDING',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    this.apWriteOffRequests.set(req.id, req);
    return req;
  }

  public approveAndPostAPWriteOff(
    tenantId: string,
    requestId: string,
    actorId: string
  ): { request: APWriteOffRequest; writeOff: APWriteOff; journalEntry: JournalEntry } {
    const req = this.apWriteOffRequests.get(requestId);
    if (!req || req.tenant_id !== tenantId) throw new Error('AP Write-Off Request not found.');

    const payable = this.getPayableById(tenantId, req.payable_id);
    if (!payable) throw new Error('Target Payable not found.');

    const { apAccount, expenseAccount } = this.getOrCreateDefaultAPAccounts(
      tenantId,
      payable.legal_entity_id,
      actorId
    );

    const nowIso = new Date().toISOString();

    // Journal Entry for AP Write-Off:
    // Debit Accounts Payable (req.amount)
    // Credit Purchase Expense / Adjustment Gain (req.amount)
    const journalEntry = this.postJournalEntry({
      tenant_id: tenantId,
      legal_entity_id: payable.legal_entity_id,
      currency_code: payable.currency_code,
      transaction_date: nowIso.split('T')[0],
      document_date: nowIso.split('T')[0],
      reference: req.request_number,
      description: `AP Write-Off for Payable ${payable.payable_number}: ${req.reason}`,
      source_type: 'WRITE_OFF' as any,
      lines: [
        {
          account_id: apAccount.id,
          debit: req.amount,
          credit: '0.00',
          description: `Writing off AP Liability`,
        },
        {
          account_id: expenseAccount.id,
          debit: '0.00',
          credit: req.amount,
          description: `AP Write-Off Adjustment Gain/Recovery`,
        },
      ],
      posted_by: actorId,
    });

    req.status = 'APPROVED';
    req.approved_by = actorId;
    req.approved_at = nowIso;
    req.updated_at = nowIso;
    this.apWriteOffRequests.set(req.id, req);

    payable.outstanding_amount = '0.00';
    payable.status = 'WRITTEN_OFF';
    payable.updated_at = nowIso;
    this.payables.set(payable.id, payable);

    const writeOffId = `apwo_${Date.now()}`;
    const writeOff: APWriteOff = {
      id: writeOffId,
      tenant_id: tenantId,
      write_off_number: `WO-${req.request_number}`,
      request_id: req.id,
      vendor_id: req.vendor_id,
      payable_id: req.payable_id,
      amount: req.amount,
      journal_entry_id: journalEntry.id,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.apWriteOffs.set(writeOff.id, writeOff);

    return { request: req, writeOff, journalEntry };
  }

  public runAPReconciliation(
    tenantId: string,
    legalEntityId: string,
    actorId: string
  ): APReconciliationRun {
    const openPayables = Array.from(this.payables.values()).filter(
      (p) =>
        p.tenant_id === tenantId &&
        p.legal_entity_id === legalEntityId &&
        (p.status === 'OPEN' || p.status === 'PARTIALLY_SETTLED' || p.status === 'OVERDUE') &&
        p.deleted_at === null
    );

    let subledgerTotal = Decimal.zero(2);
    for (const p of openPayables) {
      subledgerTotal = subledgerTotal.add(new Decimal(p.outstanding_amount));
    }

    const { apAccount } = this.getOrCreateDefaultAPAccounts(tenantId, legalEntityId, actorId);
    let glTotal = Decimal.zero(2);

    const postedEntries = Array.from(this.journalEntries.values()).filter(
      (je) => je.tenant_id === tenantId && je.legal_entity_id === legalEntityId && je.status === 'POSTED'
    );

    for (const je of postedEntries) {
      for (const line of je.lines) {
        if (line.account_id === apAccount.id) {
          const cred = new Decimal(line.base_credit || '0');
          const deb = new Decimal(line.base_debit || '0');
          glTotal = glTotal.add(cred).sub(deb);
        }
      }
    }

    const diff = subledgerTotal.sub(glTotal);
    const status = diff.equals(0) ? 'RECONCILED' : 'EXCEPTION';

    const nowIso = new Date().toISOString();
    const runId = `aprec_${Date.now()}`;
    const run: APReconciliationRun = {
      id: runId,
      tenant_id: tenantId,
      run_number: `APREC-${Date.now().toString().slice(-6)}`,
      reconciliation_date: nowIso.split('T')[0],
      subledger_total: subledgerTotal.toString(2),
      gl_total: glTotal.toString(2),
      difference: diff.toString(2),
      status,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    this.apReconciliationRuns.set(run.id, run);

    if (status === 'EXCEPTION') {
      const excId = `apexc_${Date.now()}`;
      const exc: APReconciliationException = {
        id: excId,
        tenant_id: tenantId,
        run_id: run.id,
        mismatch_amount: diff.abs().toString(2),
        currency_code: 'INR',
        detected_at: nowIso,
        status: 'OPEN',
        notes: `AP Subledger (${subledgerTotal.toString(2)}) differs from GL AP Control Account (${glTotal.toString(2)}) by ${diff.toString(2)}.`,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: actorId,
        updated_by: actorId,
        deleted_at: null,
        version: 1,
      };
      this.apReconciliationExceptions.set(exc.id, exc);
    }

    return run;
  }

  // ============================================================
  // PHASE 10: GLOBAL TAX ENGINE & COMPLIANCE DATABASE METHODS
  // ============================================================

  public getTaxCountryConfig(countryCode: string): TaxCountryConfig | undefined {
    return this.taxCountryConfigs.get(countryCode.toUpperCase());
  }

  public getAllTaxCountryConfigs(): TaxCountryConfig[] {
    return Array.from(this.taxCountryConfigs.values()).sort((a, b) => a.country_name.localeCompare(b.country_name));
  }

  public getTaxJurisdictionsByTenant(tenantId: string): TaxJurisdiction[] {
    return Array.from(this.taxJurisdictions.values()).filter(
      (j) => j.tenant_id === tenantId && j.deleted_at === null
    );
  }

  public getTaxAuthoritiesByTenant(tenantId: string): TaxAuthority[] {
    return Array.from(this.taxAuthorities.values()).filter(
      (a) => a.tenant_id === tenantId && a.deleted_at === null
    );
  }

  public getTaxRegistrationsByTenant(tenantId: string, legalEntityId?: string): GlobalTaxRegistration[] {
    return Array.from(this.taxRegistrations.values()).filter(
      (r) =>
        r.tenant_id === tenantId &&
        r.deleted_at === null &&
        (!legalEntityId || r.legal_entity_id === legalEntityId)
    );
  }

  public getTaxRegimesByTenant(tenantId: string): TaxRegime[] {
    return Array.from(this.taxRegimes.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null
    );
  }

  public getTaxTypesByTenant(tenantId: string, regimeId?: string): TaxType[] {
    return Array.from(this.taxTypes.values()).filter(
      (t) =>
        t.tenant_id === tenantId &&
        t.deleted_at === null &&
        (!regimeId || t.regime_id === regimeId)
    );
  }

  public getTaxCategoriesByTenant(tenantId: string): TaxCategoryMaster[] {
    return Array.from(this.taxCategories.values()).filter(
      (c) => c.tenant_id === tenantId && c.deleted_at === null
    );
  }

  public getTaxCodesByTenant(tenantId: string, regimeId?: string): TaxCodeMaster[] {
    return Array.from(this.taxCodes.values()).filter(
      (c) =>
        c.tenant_id === tenantId &&
        c.deleted_at === null &&
        (!regimeId || c.regime_id === regimeId)
    );
  }

  public getTaxRatesByTenant(tenantId: string, taxCodeId?: string): TaxRateMaster[] {
    return Array.from(this.taxRates.values()).filter(
      (r) =>
        r.tenant_id === tenantId &&
        r.deleted_at === null &&
        (!taxCodeId || r.tax_code_id === taxCodeId)
    );
  }

  public getTaxRulesByTenant(tenantId: string, regimeId?: string): TaxRuleMaster[] {
    return Array.from(this.taxRules.values()).filter(
      (r) => r.tenant_id === tenantId && r.deleted_at === null && (!regimeId || r.regime_id === regimeId)
    );
  }

  public getTaxExemptionsByTenant(tenantId: string): TaxExemptionRecord[] {
    return Array.from(this.taxExemptions.values()).filter(
      (e) => e.tenant_id === tenantId && e.deleted_at === null
    );
  }

  public getTaxOverridesByTenant(tenantId: string): TaxOverrideRecord[] {
    return Array.from(this.taxOverrides.values()).filter(
      (o) => o.tenant_id === tenantId && o.deleted_at === null
    );
  }

  public getTaxDocumentSnapshotsByTenant(tenantId: string): TaxDocumentSnapshot[] {
    return Array.from(this.taxDocumentSnapshots.values()).filter(
      (s) => s.tenant_id === tenantId
    );
  }

  public getTaxPeriodsByTenant(tenantId: string, legalEntityId?: string): TaxPeriodRecord[] {
    return Array.from(this.taxPeriods.values()).filter(
      (p) =>
        p.tenant_id === tenantId &&
        p.deleted_at === null &&
        (!legalEntityId || p.legal_entity_id === legalEntityId)
    );
  }

  public getTaxReturnsByTenant(tenantId: string, legalEntityId?: string): TaxReturnRecord[] {
    return Array.from(this.taxReturns.values()).filter(
      (r) =>
        r.tenant_id === tenantId &&
        r.deleted_at === null &&
        (!legalEntityId || r.legal_entity_id === legalEntityId)
    );
  }

  public getTaxAdjustmentsByTenant(tenantId: string, legalEntityId?: string): TaxAdjustmentRecord[] {
    return Array.from(this.taxAdjustments.values()).filter(
      (a) =>
        a.tenant_id === tenantId &&
        a.deleted_at === null &&
        (!legalEntityId || a.legal_entity_id === legalEntityId)
    );
  }

  public getTaxReconciliationRunsByTenant(tenantId: string, legalEntityId?: string): TaxReconciliationRun[] {
    return Array.from(this.taxReconciliationRuns.values()).filter(
      (r) =>
        r.tenant_id === tenantId &&
        r.deleted_at === null &&
        (!legalEntityId || r.legal_entity_id === legalEntityId)
    );
  }

  public getEInvoiceDocumentsByTenant(tenantId: string, legalEntityId?: string): EInvoiceDocument[] {
    return Array.from(this.einvoiceDocuments.values()).filter(
      (e) =>
        e.tenant_id === tenantId &&
        e.deleted_at === null &&
        (!legalEntityId || e.legal_entity_id === legalEntityId)
    );
  }

  public getComplianceCertificatesByTenant(tenantId: string, legalEntityId?: string): ComplianceCertificateRecord[] {
    return Array.from(this.complianceCertificates.values()).filter(
      (c) =>
        c.tenant_id === tenantId &&
        c.deleted_at === null &&
        (!legalEntityId || c.legal_entity_id === legalEntityId)
    );
  }

  public getTaxAuditLogsByTenant(tenantId: string): TaxAuditTrailRecord[] {
    return this.taxAuditLogs.filter((l) => l.tenant_id === tenantId);
  }

  public createTaxAuditTrailRecord(data: Omit<TaxAuditTrailRecord, 'id' | 'created_at'>): TaxAuditTrailRecord {
    const record: TaxAuditTrailRecord = {
      id: `txaud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      ...data,
    };
    this.taxAuditLogs.push(record);
    return record;
  }

  /**
   * Derive official Tax Return from posted Tax Subledger transactions and Tax Adjustments
   */
  public deriveTaxReturnFromSubledger(
    tenantId: string,
    legalEntityId: string,
    taxPeriodId: string,
    actorId: string
  ): TaxReturnRecord {
    const period = this.taxPeriods.get(taxPeriodId);
    if (!period || period.tenant_id !== tenantId || period.deleted_at !== null) {
      throw new Error(`Tax Period ${taxPeriodId} not found.`);
    }

    const startDate = period.start_date;
    const endDate = period.end_date;

    // 1. Gather all posted Invoices (AR Sales)
    const invoices = Array.from(this.invoices.values()).filter(
      (inv) =>
        inv.tenant_id === tenantId &&
        inv.legal_entity_id === legalEntityId &&
        inv.deleted_at === null &&
        inv.status !== 'DRAFT' &&
        inv.status !== 'CANCELLED' &&
        inv.invoice_date >= startDate &&
        inv.invoice_date <= endDate
    );

    // 2. Gather all completed POS Sales
    const posSales = Array.from(this.posTransactions.values()).filter(
      (pos) =>
        pos.tenant_id === tenantId &&
        pos.legal_entity_id === legalEntityId &&
        pos.deleted_at === null &&
        pos.status === 'COMPLETED' &&
        pos.created_at.split('T')[0] >= startDate &&
        pos.created_at.split('T')[0] <= endDate
    );

    // 3. Gather all posted Vendor Bills (AP Purchases)
    const vendorBills = Array.from(this.vendorBills.values()).filter(
      (b) =>
        b.tenant_id === tenantId &&
        b.legal_entity_id === legalEntityId &&
        b.deleted_at === null &&
        b.status === 'POSTED' &&
        b.bill_date >= startDate &&
        b.bill_date <= endDate
    );

    let totalTaxableSales = Decimal.zero(4);
    let totalOutputTax = Decimal.zero(4);
    let totalTaxablePurchases = Decimal.zero(4);
    let totalInputTax = Decimal.zero(4);

    for (const inv of invoices) {
      totalTaxableSales = totalTaxableSales.add(new Decimal(inv.subtotal || '0'));
      totalOutputTax = totalOutputTax.add(new Decimal(inv.tax_total || '0'));
    }

    for (const pos of posSales) {
      totalTaxableSales = totalTaxableSales.add(new Decimal(pos.subtotal || '0'));
      totalOutputTax = totalOutputTax.add(new Decimal(pos.tax_total || '0'));
    }

    for (const vb of vendorBills) {
      totalTaxablePurchases = totalTaxablePurchases.add(new Decimal(vb.subtotal || '0'));
      totalInputTax = totalInputTax.add(new Decimal(vb.tax_total || '0'));
    }

    // 4. Gather Approved Tax Adjustments
    const adjustments = Array.from(this.taxAdjustments.values()).filter(
      (a) =>
        a.tenant_id === tenantId &&
        a.legal_entity_id === legalEntityId &&
        a.tax_period_id === taxPeriodId &&
        a.status === 'APPROVED' &&
        a.deleted_at === null
    );

    let totalAdjustments = Decimal.zero(4);
    for (const adj of adjustments) {
      const adjAmt = new Decimal(adj.amount || '0');
      if (adj.direction === 'ADDITION') {
        totalAdjustments = totalAdjustments.add(adjAmt);
      } else {
        totalAdjustments = totalAdjustments.sub(adjAmt);
      }
    }

    // Net tax payable = Output Tax - Input Tax + Adjustments
    const netTaxPayable = totalOutputTax.sub(totalInputTax).add(totalAdjustments);

    const nowIso = new Date().toISOString();
    const returnId = `txret_${Date.now()}`;
    const returnNumber = `TXRET-${period.period_code}-${Date.now().toString().slice(-4)}`;

    const lines: TaxReturnLine[] = [
      {
        id: `line_box1`,
        box_code: 'BOX_1_SALES_OUTPUT',
        description: 'Total Taxable Sales and Output Tax Liability',
        tax_code_ids: [],
        taxable_amount: totalTaxableSales.toString(2),
        tax_amount: totalOutputTax.toString(2),
      },
      {
        id: `line_box2`,
        box_code: 'BOX_2_PURCHASES_INPUT',
        description: 'Total Taxable Purchases and Recoverable Input Tax',
        tax_code_ids: [],
        taxable_amount: totalTaxablePurchases.toString(2),
        tax_amount: totalInputTax.toString(2),
      },
      {
        id: `line_box3`,
        box_code: 'BOX_3_ADJUSTMENTS',
        description: 'Authorized Tax Adjustments and Penalties',
        tax_code_ids: [],
        taxable_amount: '0.00',
        tax_amount: totalAdjustments.toString(2),
      },
      {
        id: `line_box4`,
        box_code: 'BOX_4_NET_PAYABLE',
        description: 'Net Tax Payable (Refundable if Negative)',
        tax_code_ids: [],
        taxable_amount: totalTaxableSales.sub(totalTaxablePurchases).toString(2),
        tax_amount: netTaxPayable.toString(2),
      },
    ];

    const taxReturn: TaxReturnRecord = {
      id: returnId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      tax_period_id: taxPeriodId,
      jurisdiction_id: period.jurisdiction_id,
      tax_authority_id: period.tax_authority_id,
      return_number: returnNumber,
      return_type: 'VAT_RETURN',
      status: 'IN_PREPARATION',
      prepared_by: actorId,
      prepared_at: nowIso,
      approved_by: null,
      approved_at: null,
      submitted_by: null,
      submitted_at: null,
      submission_reference: null,
      external_provider_id: null,
      total_taxable_sales: totalTaxableSales.toString(2),
      total_output_tax: totalOutputTax.toString(2),
      total_taxable_purchases: totalTaxablePurchases.toString(2),
      total_input_tax: totalInputTax.toString(2),
      total_adjustments: totalAdjustments.toString(2),
      net_tax_payable_or_refundable: netTaxPayable.toString(2),
      lines,
      filing_payload_hash: null,
      acknowledgement_details: null,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    this.taxReturns.set(taxReturn.id, taxReturn);
    return taxReturn;
  }

  /**
   * Run Strict Tax Reconciliation (Subledger vs General Ledger Control Accounts)
   */
  public runTaxReconciliation(
    tenantId: string,
    legalEntityId: string,
    taxPeriodId: string,
    actorId: string
  ): TaxReconciliationRun {
    const period = this.taxPeriods.get(taxPeriodId);
    if (!period || period.tenant_id !== tenantId || period.deleted_at !== null) {
      throw new Error(`Tax Period ${taxPeriodId} not found.`);
    }

    const startDate = period.start_date;
    const endDate = period.end_date;

    // Subledger totals
    let subledgerOutputTotal = Decimal.zero(4);
    let subledgerInputTotal = Decimal.zero(4);

    const invoices = Array.from(this.invoices.values()).filter(
      (i) => i.tenant_id === tenantId && i.legal_entity_id === legalEntityId && i.status !== 'DRAFT' && i.status !== 'CANCELLED' && i.invoice_date >= startDate && i.invoice_date <= endDate
    );
    for (const inv of invoices) {
      subledgerOutputTotal = subledgerOutputTotal.add(new Decimal(inv.tax_total || '0'));
    }

    const posSales = Array.from(this.posTransactions.values()).filter(
      (p) => p.tenant_id === tenantId && p.legal_entity_id === legalEntityId && p.status === 'COMPLETED' && p.created_at.split('T')[0] >= startDate && p.created_at.split('T')[0] <= endDate
    );
    for (const pos of posSales) {
      subledgerOutputTotal = subledgerOutputTotal.add(new Decimal(pos.tax_total || '0'));
    }

    const vendorBills = Array.from(this.vendorBills.values()).filter(
      (b) => b.tenant_id === tenantId && b.legal_entity_id === legalEntityId && b.status === 'POSTED' && b.bill_date >= startDate && b.bill_date <= endDate
    );
    for (const b of vendorBills) {
      subledgerInputTotal = subledgerInputTotal.add(new Decimal(b.tax_total || '0'));
    }

    // GL Tax Accounts Totals
    const taxLiabilityAccounts = Array.from(this.accounts.values()).filter(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.code.includes('TAX') || a.name.toLowerCase().includes('tax') || a.account_type === 'LIABILITY')
    );
    const taxRecoverableAccounts = Array.from(this.accounts.values()).filter(
      (a) => a.tenant_id === tenantId && a.legal_entity_id === legalEntityId && (a.account_type === 'ASSET' && a.name.toLowerCase().includes('tax'))
    );

    let glTaxLiabilityTotal = Decimal.zero(4);
    let glTaxRecoverableTotal = Decimal.zero(4);

    const postedJournals = Array.from(this.journalEntries.values()).filter(
      (je) => je.tenant_id === tenantId && je.legal_entity_id === legalEntityId && je.status === 'POSTED' && je.posting_date >= startDate && je.posting_date <= endDate
    );

    for (const je of postedJournals) {
      for (const l of je.lines) {
        if (taxLiabilityAccounts.some((acc) => acc.id === l.account_id)) {
          // Liability balance = Credit - Debit
          glTaxLiabilityTotal = glTaxLiabilityTotal.add(new Decimal(l.base_credit || '0')).sub(new Decimal(l.base_debit || '0'));
        }
        if (taxRecoverableAccounts.some((acc) => acc.id === l.account_id)) {
          // Asset balance = Debit - Credit
          glTaxRecoverableTotal = glTaxRecoverableTotal.add(new Decimal(l.base_debit || '0')).sub(new Decimal(l.base_credit || '0'));
        }
      }
    }

    // If no GL accounts existed yet or 0 entries, compute difference
    const varianceOutput = subledgerOutputTotal.sub(glTaxLiabilityTotal);
    const varianceInput = subledgerInputTotal.sub(glTaxRecoverableTotal);

    const isReconciled = varianceOutput.isZero() && varianceInput.isZero();
    const status = isReconciled ? 'RECONCILED' : 'EXCEPTION';

    const nowIso = new Date().toISOString();
    const runId = `txrec_${Date.now()}`;
    const exceptions: TaxReconciliationException[] = [];

    if (!varianceOutput.isZero()) {
      exceptions.push({
        id: `txexc_out_${Date.now()}`,
        tenant_id: tenantId,
        run_id: runId,
        exception_type: 'OUTPUT_TAX_MISMATCH',
        expected_amount: subledgerOutputTotal.toString(2),
        actual_amount: glTaxLiabilityTotal.toString(2),
        difference: varianceOutput.abs().toString(2),
        details: `Output Tax Subledger (${subledgerOutputTotal.toString(2)}) differs from GL Tax Liability balance (${glTaxLiabilityTotal.toString(2)}).`,
        status: 'OPEN',
        created_at: nowIso,
      });
    }

    if (!varianceInput.isZero()) {
      exceptions.push({
        id: `txexc_inp_${Date.now()}`,
        tenant_id: tenantId,
        run_id: runId,
        exception_type: 'INPUT_TAX_MISMATCH',
        expected_amount: subledgerInputTotal.toString(2),
        actual_amount: glTaxRecoverableTotal.toString(2),
        difference: varianceInput.abs().toString(2),
        details: `Input Tax Subledger (${subledgerInputTotal.toString(2)}) differs from GL Recoverable Tax balance (${glTaxRecoverableTotal.toString(2)}).`,
        status: 'OPEN',
        created_at: nowIso,
      });
    }

    const run: TaxReconciliationRun = {
      id: runId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      tax_period_id: taxPeriodId,
      run_number: `TXREC-${Date.now().toString().slice(-6)}`,
      reconciliation_date: nowIso.split('T')[0],
      tax_subledger_output_total: subledgerOutputTotal.toString(2),
      tax_subledger_input_total: subledgerInputTotal.toString(2),
      gl_tax_liability_total: glTaxLiabilityTotal.toString(2),
      gl_tax_recoverable_total: glTaxRecoverableTotal.toString(2),
      variance_output: varianceOutput.toString(2),
      variance_input: varianceInput.toString(2),
      status,
      exceptions,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    this.taxReconciliationRuns.set(run.id, run);
    for (const exc of exceptions) {
      this.taxReconciliationExceptions.set(exc.id, exc);
    }

    return run;
  }

  /**
   * Seed Standard Tax Foundation Template for a Legal Entity (e.g. standard country setup)
   */
  public seedStandardTaxDataForTenant(
    tenantId: string,
    legalEntityId: string,
    countryCode: string = 'US',
    actorId: string = 'system'
  ): {
    jurisdiction: TaxJurisdiction;
    authority: TaxAuthority;
    regime: TaxRegime;
    outputTaxType: TaxType;
    inputTaxType: TaxType;
    standardCategory: TaxCategoryMaster;
    taxCode: TaxCodeMaster;
    taxRate: TaxRateMaster;
    rule: TaxRuleMaster;
    registration: GlobalTaxRegistration;
  } {
    const nowIso = new Date().toISOString();
    const upperCountry = countryCode.toUpperCase();

    // 1. Jurisdiction
    const jurId = `jur_${upperCountry}_${Date.now()}`;
    const jurisdiction: TaxJurisdiction = {
      id: jurId,
      tenant_id: tenantId,
      country_code: upperCountry,
      jurisdiction_code: `${upperCountry}-NAT`,
      jurisdiction_name: `${upperCountry} National Tax Jurisdiction`,
      level: 'COUNTRY',
      geographic_identifier: upperCountry,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxJurisdictions.set(jurisdiction.id, jurisdiction);

    // 2. Tax Authority
    const authId = `auth_${upperCountry}_${Date.now()}`;
    const authority: TaxAuthority = {
      id: authId,
      tenant_id: tenantId,
      jurisdiction_id: jurisdiction.id,
      authority_code: `${upperCountry}-REV`,
      authority_name: `${upperCountry} Inland Revenue Authority`,
      authority_type: 'NATIONAL',
      registration_prefix: upperCountry,
      electronic_filing_enabled: true,
      filing_frequencies: ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
      effective_from: '2020-01-01',
      effective_to: null,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxAuthorities.set(authority.id, authority);

    // 3. Tax Registration for Legal Entity
    const regId = `treg_${upperCountry}_${Date.now()}`;
    const registration: GlobalTaxRegistration = {
      id: regId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      tax_authority_id: authority.id,
      jurisdiction_id: jurisdiction.id,
      registration_number: `${upperCountry}998877665`,
      registration_type: upperCountry === 'US' ? 'EIN' : upperCountry === 'IN' ? 'GSTIN' : 'VAT',
      effective_from: '2020-01-01',
      effective_to: null,
      is_primary: true,
      status: 'ACTIVE',
      validation_status: 'VALID',
      validated_at: nowIso,
      validation_provider: 'AUTHORITY_DIRECT_API',
      validation_reference: `VAL-REF-${Date.now()}`,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxRegistrations.set(registration.id, registration);

    // 4. Tax Regime
    const regimeId = `regime_${upperCountry}_${Date.now()}`;
    const regimeCode = upperCountry === 'US' ? 'SALES_TAX' : upperCountry === 'IN' ? 'GST' : 'VAT';
    const regime: TaxRegime = {
      id: regimeId,
      tenant_id: tenantId,
      country_code: upperCountry,
      regime_code: regimeCode,
      regime_name: `${upperCountry} Standard ${regimeCode} Regime`,
      description: `Authoritative statutory ${regimeCode} regime for ${upperCountry}`,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxRegimes.set(regime.id, regime);

    // 5. Tax Types
    const outTypeId = `ttype_out_${upperCountry}_${Date.now()}`;
    const outputTaxType: TaxType = {
      id: outTypeId,
      tenant_id: tenantId,
      regime_id: regime.id,
      type_code: 'OUTPUT_TAX',
      type_name: 'Output Tax Liability',
      is_recoverable: false,
      description: 'Tax collected on supplies/sales',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxTypes.set(outputTaxType.id, outputTaxType);

    const inpTypeId = `ttype_inp_${upperCountry}_${Date.now()}`;
    const inputTaxType: TaxType = {
      id: inpTypeId,
      tenant_id: tenantId,
      regime_id: regime.id,
      type_code: 'INPUT_TAX',
      type_name: 'Recoverable Input Tax',
      is_recoverable: true,
      description: 'Tax paid on purchases/procurement',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxTypes.set(inputTaxType.id, inputTaxType);

    // 6. Tax Category
    const catId = `tcat_std_${Date.now()}`;
    const standardCategory: TaxCategoryMaster = {
      id: catId,
      tenant_id: tenantId,
      category_code: 'STANDARD',
      category_name: 'Standard Rated Goods & Services',
      description: 'Default standard tax category',
      is_taxable: true,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxCategories.set(standardCategory.id, standardCategory);

    // 7. Tax Code
    const codeId = `tcode_${upperCountry}_STD_${Date.now()}`;
    const taxCode: TaxCodeMaster = {
      id: codeId,
      tenant_id: tenantId,
      regime_id: regime.id,
      tax_type_id: outputTaxType.id,
      jurisdiction_id: jurisdiction.id,
      code: `${regimeCode}-STD`,
      name: `${upperCountry} Standard ${regimeCode}`,
      tax_category_id: standardCategory.id,
      liability_account_id: null,
      recoverable_account_id: null,
      expense_account_id: null,
      effective_from: '2020-01-01',
      effective_to: null,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxCodes.set(taxCode.id, taxCode);

    // 8. Tax Rate (Default standard rate e.g. 0.1800 for 18% or 0.1000 for 10% or 0.2000 for 20%)
    let rateValue = '0.1000'; // default 10%
    if (upperCountry === 'IN') rateValue = '0.1800'; // 18%
    if (upperCountry === 'GB') rateValue = '0.2000'; // 20%
    if (upperCountry === 'DE') rateValue = '0.1900'; // 19%
    if (upperCountry === 'AE') rateValue = '0.0500'; // 5%
    if (upperCountry === 'SG') rateValue = '0.0900'; // 9%

    const rateId = `trate_${upperCountry}_${Date.now()}`;
    const taxRate: TaxRateMaster = {
      id: rateId,
      tenant_id: tenantId,
      tax_code_id: taxCode.id,
      jurisdiction_id: jurisdiction.id,
      rate_type: 'PERCENTAGE',
      rate_value: rateValue,
      unit_of_measure: null,
      compound_priority: null,
      rounding_policy: 'HALF_UP',
      rounding_precision: 2,
      effective_from: '2020-01-01',
      effective_to: null,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.taxRates.set(taxRate.id, taxRate);

    // 9. Tax Rule (Active and Approved)
    const ruleId = `trule_${upperCountry}_STD_${Date.now()}`;
    const rule: TaxRuleMaster = {
      id: ruleId,
      tenant_id: tenantId,
      rule_code: `RULE-${upperCountry}-STD`,
      name: `${upperCountry} Standard Domestic Supply Rule`,
      regime_id: regime.id,
      seller_jurisdiction_id: jurisdiction.id,
      buyer_jurisdiction_id: jurisdiction.id,
      place_of_supply_type: 'DESTINATION_BASED',
      tax_category_id: standardCategory.id,
      customer_classification: 'ALL',
      vendor_classification: 'ALL',
      transaction_type: 'ALL',
      min_threshold_amount: null,
      max_threshold_amount: null,
      is_reverse_charge: false,
      is_withholding: false,
      tax_code_ids: [taxCode.id],
      priority: 100,
      version: 1,
      approval_status: 'ACTIVE',
      approved_by: actorId,
      approved_at: nowIso,
      effective_from: '2020-01-01',
      effective_to: null,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
    };
    this.taxRules.set(rule.id, rule);

    return {
      jurisdiction,
      authority,
      regime,
      outputTaxType,
      inputTaxType,
      standardCategory,
      taxCode,
      taxRate,
      rule,
      registration,
    };
  }

  // ==========================================
  // Phase 11: Global Fiscal Document & Compliance Queries & Seeds
  // ==========================================

  public getFiscalDocumentsByTenant(tenantId: string): FiscalDocumentRecord[] {
    return Array.from(this.fiscalDocuments.values()).filter((f) => f.tenant_id === tenantId);
  }

  public getFiscalSeriesByTenant(tenantId: string): FiscalSeriesRecord[] {
    return Array.from(this.fiscalSeries.values()).filter((s) => s.tenant_id === tenantId);
  }

  public getComplianceSubmissionsByTenant(tenantId: string): ComplianceSubmissionRecord[] {
    return Array.from(this.complianceSubmissions.values()).filter((s) => s.tenant_id === tenantId);
  }

  public getComplianceProviderConfigsByTenant(tenantId: string): ComplianceProviderConfigRecord[] {
    return Array.from(this.complianceProviderConfigs.values()).filter((c) => c.tenant_id === tenantId);
  }

  public getComplianceManualReviewsByTenant(tenantId: string): ComplianceManualReviewRecord[] {
    return Array.from(this.complianceManualReviews.values()).filter((m) => m.tenant_id === tenantId);
  }

  public getComplianceReconciliationsByTenant(tenantId: string): ComplianceReconciliationRecord[] {
    return Array.from(this.complianceReconciliations.values()).filter((r) => r.tenant_id === tenantId);
  }

  public seedStandardComplianceDataForTenant(
    tenantId: string,
    legalEntityId: string,
    countryCode: string,
    actorId: string
  ): {
    series: FiscalSeriesRecord;
    providerConfig: ComplianceProviderConfigRecord;
    certificate: ComplianceCertificateRecord;
  } {
    const upperCountry = countryCode.toUpperCase();
    const nowIso = new Date().toISOString();

    // 1. Fiscal Series
    const seriesId = `fseries_${upperCountry}_${Date.now()}`;
    const series: FiscalSeriesRecord = {
      id: seriesId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      branch_id: null,
      jurisdiction_id: upperCountry,
      series_code: `SERIES-${upperCountry}-STANDARD`,
      document_type: 'INVOICE',
      prefix: `FISC-${upperCountry}-`,
      current_sequence: 0,
      min_sequence: 1,
      max_sequence: 999999,
      effective_from: '2020-01-01',
      effective_to: null,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.fiscalSeries.set(series.id, series);

    // 2. Compliance Provider Configuration
    const provId = `prov_${upperCountry}_${Date.now()}`;
    const providerConfig: ComplianceProviderConfigRecord = {
      id: provId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      country_code: upperCountry,
      jurisdiction_id: upperCountry,
      provider_name: `${upperCountry} National Clearance Authority API`,
      provider_type: 'GOVERNMENT_DIRECT',
      environment: 'SANDBOX',
      endpoint_url: `https://api.compliance.${upperCountry.toLowerCase()}.gov/v1`,
      credential_key_reference: `vault://secrets/tenant_${tenantId}/${upperCountry}_api_key`,
      certificate_id: null,
      rate_limit_per_minute: 600,
      timeout_ms: 10000,
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.complianceProviderConfigs.set(providerConfig.id, providerConfig);

    // 3. Digital Certificate Record (vault key reference, never raw secret)
    const certId = `cert_${upperCountry}_${Date.now()}`;
    const certificate: ComplianceCertificateRecord = {
      id: certId,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      jurisdiction_id: upperCountry,
      certificate_name: `${upperCountry} Sovereign E-Signing & Compliance Certificate`,
      certificate_type: 'DIGITAL_SIGNATURE',
      issuer: `${upperCountry} Trust Network CA`,
      serial_number: `SN-${Date.now().toString(16).toUpperCase()}`,
      fingerprint_sha256: `SHA256:${Date.now()}${Math.random().toString(36)}`,
      valid_from: '2025-01-01T00:00:00Z',
      valid_to: '2028-12-31T23:59:59Z',
      key_reference: `vault://keys/tenant_${tenantId}/${upperCountry}_ds_key_v1`,
      status: 'ACTIVE',
      rotation_warning_days: 30,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };
    this.complianceCertificates.set(certificate.id, certificate);

    providerConfig.certificate_id = certificate.id;
    this.complianceProviderConfigs.set(providerConfig.id, providerConfig);

    return {
      series,
      providerConfig,
      certificate,
    };
  }

}

export const db = TenantDatabase.getInstance();



