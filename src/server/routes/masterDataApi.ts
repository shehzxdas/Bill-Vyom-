/**
 * Bill Vyom — Global Master Data Foundation API Gateway
 * Strict multi-tenant isolation, contract validation, and audit trail generation.
 */

import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/tenantResolver';
import { requirePermission } from '../middleware/authorization';
import {
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
  ExchangeRate,
  PriceList,
  PriceListItem,
  PaymentTerms,
  DocumentNumberingConfig,
  DocumentType,
} from '../../domain/types';

export const masterDataRouter = Router();

// ==========================================
// 1. PRODUCTS & VARIANTS
// ==========================================

/**
 * GET /api/v1/master/products
 * Server-side paginated & filtered products query
 */
masterDataRouter.get('/products', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const query = (req.query.q as string) || '';
  const status = (req.query.status as string) || '';
  const type = (req.query.type as string) || '';
  const category_id = (req.query.category_id as string) || '';

  const result = db.getProductsByTenant(tenantId, {
    page,
    limit,
    query,
    status,
    type,
    category_id,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: result.items,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.total_pages,
    },
  });
});

/**
 * POST /api/v1/master/products
 */
masterDataRouter.post('/products', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const {
    product_code,
    name,
    description,
    category_id,
    brand_name,
    product_type,
    base_uom_id,
    purchase_uom_id,
    sales_uom_id,
    inventory_uom_id,
    attributes,
  } = req.body;

  if (!product_code || !name || !base_uom_id) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Product code, name, and base UOM are required.' }],
    });
  }

  // Code uniqueness check within tenant
  const existingProduct = Array.from(db.products.values()).find(
    (p) => p.tenant_id === tenant.id && p.product_code === product_code && p.deleted_at === null
  );
  if (existingProduct) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_DUPLICATE_CODE', message: 'A product with this product_code already exists.' }],
    });
  }

  const now = new Date().toISOString();
  const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newProduct: Product = {
    id: productId,
    tenant_id: tenant.id,
    product_code,
    name,
    description: description || '',
    category_id: category_id || null,
    brand_name: brand_name || '',
    product_type: product_type || 'GOODS',
    status: 'ACTIVE',
    base_uom_id,
    purchase_uom_id: purchase_uom_id || base_uom_id,
    sales_uom_id: sales_uom_id || base_uom_id,
    inventory_uom_id: inventory_uom_id || base_uom_id,
    attributes: attributes || {},
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  // Automatically create default primary variant
  const variantId = `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const defaultVariant: ProductVariant = {
    id: variantId,
    tenant_id: tenant.id,
    product_id: productId,
    variant_code: `${product_code}-DEF`,
    variant_name: `${name} (Default)`,
    sku: product_code,
    manufacturer_part_number: '',
    attributes: {},
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.products.set(newProduct.id, newProduct);
  db.productVariants.set(defaultVariant.id, defaultVariant);

  db.recordAuditLog({
    tenant_id: tenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'PRODUCT.CREATED',
    resource_type: 'product',
    resource_id: newProduct.id,
    changes: { product_code, name },
  });

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      ...newProduct,
      defaultVariant,
    },
  });
});

/**
 * GET /api/v1/master/products/:id
 */
masterDataRouter.get('/products/:id', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const product = db.getProductById(tenantId, req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Product not found or access denied.' }],
    });
  }

  const variants = db.getVariantsByProduct(tenantId, product.id);
  const taxClassifications = db.getTaxClassificationsByProduct(tenantId, product.id);

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      ...product,
      variants,
      taxClassifications,
    },
  });
});

/**
 * PUT /api/v1/master/products/:id
 */
masterDataRouter.put('/products/:id', requirePermission('edit', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const product = db.getProductById(tenant.id, req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Product not found.' }],
    });
  }

  // Optimistic concurrency check
  if (req.body.version !== undefined && req.body.version !== product.version) {
    return res.status(409).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'CONCURRENCY_CONFLICT', message: 'Record was modified by another user. Please reload.' }],
    });
  }

  const updated: Product = {
    ...product,
    name: req.body.name || product.name,
    description: req.body.description !== undefined ? req.body.description : product.description,
    category_id: req.body.category_id !== undefined ? req.body.category_id : product.category_id,
    brand_name: req.body.brand_name !== undefined ? req.body.brand_name : product.brand_name,
    product_type: req.body.product_type || product.product_type,
    status: req.body.status || product.status,
    base_uom_id: req.body.base_uom_id || product.base_uom_id,
    purchase_uom_id: req.body.purchase_uom_id || product.purchase_uom_id,
    sales_uom_id: req.body.sales_uom_id || product.sales_uom_id,
    inventory_uom_id: req.body.inventory_uom_id || product.inventory_uom_id,
    attributes: req.body.attributes ? { ...product.attributes, ...req.body.attributes } : product.attributes,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
    version: product.version + 1,
  };

  db.products.set(product.id, updated);

  db.recordAuditLog({
    tenant_id: tenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'PRODUCT.UPDATED',
    resource_type: 'product',
    resource_id: product.id,
    changes: req.body,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: updated,
  });
});

/**
 * DELETE /api/v1/master/products/:id (Soft Archive)
 */
masterDataRouter.delete('/products/:id', requirePermission('archive', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const product = db.getProductById(tenant.id, req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Product not found.' }],
    });
  }

  const now = new Date().toISOString();
  const archived: Product = {
    ...product,
    status: 'ARCHIVED',
    deleted_at: now,
    updated_at: now,
    updated_by: user.id,
    version: product.version + 1,
  };

  db.products.set(product.id, archived);

  db.recordAuditLog({
    tenant_id: tenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'PRODUCT.ARCHIVED',
    resource_type: 'product',
    resource_id: product.id,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: { id: product.id, status: 'ARCHIVED', deleted_at: now },
  });
});

// ==========================================
// 2. PRODUCT VARIANTS & IDENTIFIERS
// ==========================================

/**
 * POST /api/v1/master/products/:id/variants
 */
masterDataRouter.post('/products/:id/variants', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const product = db.getProductById(tenant.id, req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Parent product not found.' }],
    });
  }

  const { variant_code, variant_name, sku, manufacturer_part_number, attributes } = req.body;
  if (!variant_code || !variant_name || !sku) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Variant code, name, and SKU required.' }],
    });
  }

  const now = new Date().toISOString();
  const variant: ProductVariant = {
    id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    product_id: product.id,
    variant_code,
    variant_name,
    sku,
    manufacturer_part_number: manufacturer_part_number || '',
    attributes: attributes || {},
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.productVariants.set(variant.id, variant);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: variant,
  });
});

/**
 * POST /api/v1/master/variants/:id/identifiers
 */
masterDataRouter.post('/variants/:id/identifiers', requirePermission('edit', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const variant = db.productVariants.get(req.params.id);

  if (!variant || variant.tenant_id !== tenant.id || variant.deleted_at !== null) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Variant not found.' }],
    });
  }

  const { identifier_type, identifier_value, scope } = req.body;
  if (!identifier_type || !identifier_value) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Identifier type and value are required.' }],
    });
  }

  const now = new Date().toISOString();
  const identifier: ProductIdentifier = {
    id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    variant_id: variant.id,
    identifier_type,
    identifier_value,
    scope: scope || 'GLOBAL',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.productIdentifiers.set(identifier.id, identifier);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: identifier,
  });
});

// ==========================================
// 3. PRODUCT CATEGORIES
// ==========================================

/**
 * GET /api/v1/master/categories
 */
masterDataRouter.get('/categories', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const categories = db.getCategoriesByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: categories,
  });
});

/**
 * POST /api/v1/master/categories
 */
masterDataRouter.post('/categories', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { category_code, category_name, parent_id, sequence } = req.body;

  if (!category_code || !category_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Category code and name required.' }],
    });
  }

  let parentPath = '';
  if (parent_id) {
    const parent = db.productCategories.get(parent_id);
    if (parent && parent.tenant_id === tenant.id) {
      parentPath = parent.path;
    }
  }

  const path = parentPath ? `${parentPath}/${category_name}` : category_name;
  const now = new Date().toISOString();

  const newCat: ProductCategory = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    category_code,
    category_name,
    parent_id: parent_id || null,
    path,
    sequence: sequence || 1,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.productCategories.set(newCat.id, newCat);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: newCat,
  });
});

// ==========================================
// 4. UNITS OF MEASURE (UOM)
// ==========================================

/**
 * GET /api/v1/master/uom/groups
 */
masterDataRouter.get('/uom/groups', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const groups = db.getUOMGroupsByTenant(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: groups,
  });
});

/**
 * POST /api/v1/master/uom/groups
 */
masterDataRouter.post('/uom/groups', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { group_code, group_name, measurement_type } = req.body;

  if (!group_code || !group_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Group code and name required.' }],
    });
  }

  const now = new Date().toISOString();
  const group: UOMGroup = {
    id: `uomg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    group_code,
    group_name,
    measurement_type: measurement_type || 'COUNT',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.uomGroups.set(group.id, group);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: group,
  });
});

/**
 * GET /api/v1/master/uom/units
 */
masterDataRouter.get('/uom/units', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const groupId = req.query.group_id as string;
  const units = db.getUnitsByTenant(req.context!.tenant.id, groupId);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: units,
  });
});

/**
 * POST /api/v1/master/uom/units
 */
masterDataRouter.post('/uom/units', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { uom_group_id, uom_code, uom_name, symbol, decimal_places, is_base } = req.body;

  if (!uom_group_id || !uom_code || !uom_name || !symbol) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Group ID, code, name, and symbol required.' }],
    });
  }

  const now = new Date().toISOString();
  const unit: UnitOfMeasure = {
    id: `uom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    uom_group_id,
    uom_code,
    uom_name,
    symbol,
    decimal_places: decimal_places !== undefined ? decimal_places : 2,
    is_base: Boolean(is_base),
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.uoms.set(unit.id, unit);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: unit,
  });
});

// ==========================================
// 5. TAX CLASSIFICATIONS
// ==========================================

/**
 * POST /api/v1/master/tax-classifications
 */
masterDataRouter.post('/tax-classifications', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { product_id, jurisdiction_code, classification_system, classification_code, tax_category, effective_from } = req.body;

  if (!product_id || !jurisdiction_code || !classification_code) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Product ID, jurisdiction, and classification code required.' }],
    });
  }

  const now = new Date().toISOString();
  const taxClass: ProductTaxClassification = {
    id: `ptc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    product_id,
    jurisdiction_code,
    classification_system: classification_system || 'HSN',
    classification_code,
    tax_category: tax_category || 'STANDARD',
    effective_from: effective_from || now,
    effective_to: null,
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.productTaxClassifications.set(taxClass.id, taxClass);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: taxClass,
  });
});

// ==========================================
// 6. CUSTOMERS & GROUPS
// ==========================================

/**
 * GET /api/v1/master/customers
 */
masterDataRouter.get('/customers', requirePermission('view', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const query = (req.query.q as string) || '';
  const status = (req.query.status as string) || '';
  const type = (req.query.type as string) || '';
  const group_id = (req.query.group_id as string) || '';

  const result = db.getCustomersByTenant(tenantId, {
    page,
    limit,
    query,
    status,
    type,
    group_id,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: result.items,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.total_pages,
    },
  });
});

/**
 * POST /api/v1/master/customers
 */
masterDataRouter.post('/customers', requirePermission('create', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const {
    customer_code,
    customer_name,
    legal_name,
    customer_type,
    customer_group_id,
    contact_email,
    contact_phone,
    country_code,
    currency_code,
    payment_terms_id,
    tax_registrations,
    credit_limit,
    credit_days,
  } = req.body;

  if (!customer_code || !customer_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Customer code and customer name are required.' }],
    });
  }

  // Duplicate check
  const existing = Array.from(db.customers.values()).find(
    (c) => c.tenant_id === tenant.id && c.customer_code === customer_code && c.deleted_at === null
  );
  if (existing) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_DUPLICATE_CODE', message: 'A customer with this customer_code already exists.' }],
    });
  }

  const now = new Date().toISOString();
  const newCustomer: Customer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    customer_code,
    customer_name,
    legal_name: legal_name || customer_name,
    customer_type: customer_type || 'BUSINESS',
    customer_group_id: customer_group_id || null,
    contact_email: contact_email || '',
    contact_phone: contact_phone || '',
    country_code: country_code || tenant.country_code,
    currency_code: currency_code || tenant.base_currency_code,
    payment_terms_id: payment_terms_id || null,
    tax_registrations: tax_registrations || [],
    status: 'ACTIVE',
    credit_config: {
      credit_limit: credit_limit || '0.00',
      credit_days: credit_days || 30,
      credit_status: 'APPROVED',
      payment_terms_id: payment_terms_id || null,
    },
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.customers.set(newCustomer.id, newCustomer);

  db.recordAuditLog({
    tenant_id: tenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'CUSTOMER.CREATED',
    resource_type: 'customer',
    resource_id: newCustomer.id,
    changes: { customer_code, customer_name },
  });

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: newCustomer,
  });
});

/**
 * GET /api/v1/master/customers/:id
 */
masterDataRouter.get('/customers/:id', requirePermission('view', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const customer = db.getCustomerById(tenantId, req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Customer not found.' }],
    });
  }

  const contacts = db.getCustomerContacts(tenantId, customer.id);
  const addresses = db.getCustomerAddresses(tenantId, customer.id);

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      ...customer,
      contacts,
      addresses,
    },
  });
});

/**
 * POST /api/v1/master/customers/:id/contacts
 */
masterDataRouter.post('/customers/:id/contacts', requirePermission('edit', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const customer = db.getCustomerById(tenant.id, req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Customer not found.' }],
    });
  }

  const { contact_name, role_title, email, phone, is_primary } = req.body;
  const now = new Date().toISOString();

  const contact: CustomerContact = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    customer_id: customer.id,
    contact_name: contact_name || 'Primary Contact',
    role_title: role_title || 'Representative',
    email: email || '',
    phone: phone || '',
    is_primary: Boolean(is_primary),
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.customerContacts.set(contact.id, contact);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: contact,
  });
});

/**
 * POST /api/v1/master/customers/:id/addresses
 */
masterDataRouter.post('/customers/:id/addresses', requirePermission('edit', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const customer = db.getCustomerById(tenant.id, req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Customer not found.' }],
    });
  }

  const { address_type, street_line1, street_line2, city, state_province, postal_code, country_code, is_primary } = req.body;
  const now = new Date().toISOString();

  const address: CustomerAddress = {
    id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    customer_id: customer.id,
    address_type: address_type || 'BILLING',
    street_line1: street_line1 || '',
    street_line2: street_line2 || '',
    city: city || '',
    state_province: state_province || '',
    postal_code: postal_code || '',
    country_code: country_code || tenant.country_code,
    is_primary: Boolean(is_primary),
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.customerAddresses.set(address.id, address);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: address,
  });
});

/**
 * GET/POST /api/v1/master/customer-groups
 */
masterDataRouter.get('/customer-groups', requirePermission('view', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const groups = db.getCustomerGroups(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: groups,
  });
});

masterDataRouter.post('/customer-groups', requirePermission('create', 'customers'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { group_code, group_name, description } = req.body;

  if (!group_code || !group_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Group code and name required.' }],
    });
  }

  const now = new Date().toISOString();
  const group: CustomerGroup = {
    id: `cg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    group_code,
    group_name,
    description: description || '',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.customerGroups.set(group.id, group);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: group,
  });
});

// ==========================================
// 7. VENDORS & GROUPS
// ==========================================

/**
 * GET /api/v1/master/vendors
 */
masterDataRouter.get('/vendors', requirePermission('view', 'vendors'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const query = (req.query.q as string) || '';
  const status = (req.query.status as string) || '';
  const type = (req.query.type as string) || '';
  const group_id = (req.query.group_id as string) || '';

  const result = db.getVendorsByTenant(tenantId, {
    page,
    limit,
    query,
    status,
    type,
    group_id,
  });

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: result.items,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.total_pages,
    },
  });
});

/**
 * POST /api/v1/master/vendors
 */
masterDataRouter.post('/vendors', requirePermission('create', 'vendors'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const {
    vendor_code,
    vendor_name,
    legal_name,
    vendor_type,
    vendor_group_id,
    contact_email,
    contact_phone,
    country_code,
    currency_code,
    payment_terms_id,
    tax_registrations,
    bank_name,
    account_number,
    routing_code,
    payment_method,
  } = req.body;

  if (!vendor_code || !vendor_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Vendor code and vendor name are required.' }],
    });
  }

  // Duplicate check
  const existing = Array.from(db.vendors.values()).find(
    (v) => v.tenant_id === tenant.id && v.vendor_code === vendor_code && v.deleted_at === null
  );
  if (existing) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_DUPLICATE_CODE', message: 'A vendor with this vendor_code already exists.' }],
    });
  }

  const now = new Date().toISOString();
  const newVendor: Vendor = {
    id: `vend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    vendor_code,
    vendor_name,
    legal_name: legal_name || vendor_name,
    vendor_type: vendor_type || 'BUSINESS',
    vendor_group_id: vendor_group_id || null,
    contact_email: contact_email || '',
    contact_phone: contact_phone || '',
    country_code: country_code || tenant.country_code,
    currency_code: currency_code || tenant.base_currency_code,
    payment_terms_id: payment_terms_id || null,
    tax_registrations: tax_registrations || [],
    status: 'ACTIVE',
    payment_config: {
      payment_terms_id: payment_terms_id || null,
      bank_name: bank_name || '',
      account_number: account_number || '',
      routing_code: routing_code || '',
      payment_method: payment_method || 'BANK_TRANSFER',
    },
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.vendors.set(newVendor.id, newVendor);

  db.recordAuditLog({
    tenant_id: tenant.id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'VENDOR.CREATED',
    resource_type: 'vendor',
    resource_id: newVendor.id,
    changes: { vendor_code, vendor_name },
  });

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: newVendor,
  });
});

/**
 * GET /api/v1/master/vendors/:id
 */
masterDataRouter.get('/vendors/:id', requirePermission('view', 'vendors'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const vendor = db.getVendorById(tenantId, req.params.id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Vendor not found.' }],
    });
  }

  const contacts = db.getVendorContacts(tenantId, vendor.id);
  const addresses = db.getVendorAddresses(tenantId, vendor.id);

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      ...vendor,
      contacts,
      addresses,
    },
  });
});

/**
 * GET/POST /api/v1/master/vendor-groups
 */
masterDataRouter.get('/vendor-groups', requirePermission('view', 'vendors'), (req: AuthenticatedRequest, res: Response) => {
  const groups = db.getVendorGroups(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: groups,
  });
});

masterDataRouter.post('/vendor-groups', requirePermission('create', 'vendors'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { group_code, group_name, description } = req.body;

  if (!group_code || !group_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Group code and name required.' }],
    });
  }

  const now = new Date().toISOString();
  const group: VendorGroup = {
    id: `vg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    group_code,
    group_name,
    description: description || '',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.vendorGroups.set(group.id, group);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: group,
  });
});

// ==========================================
// 8. STORAGE LOCATIONS (WAREHOUSE BINS)
// ==========================================

/**
 * GET /api/v1/master/warehouses/:warehouseId/locations
 */
masterDataRouter.get('/warehouses/:warehouseId/locations', requirePermission('view', 'tenant'), (req: AuthenticatedRequest, res: Response) => {
  const locations = db.getStorageLocations(req.context!.tenant.id, req.params.warehouseId);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: locations,
  });
});

/**
 * POST /api/v1/master/warehouses/:warehouseId/locations
 */
masterDataRouter.post('/warehouses/:warehouseId/locations', requirePermission('create', 'warehouses'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const warehouse = db.warehouses.get(req.params.warehouseId);

  if (!warehouse || warehouse.tenant_id !== tenant.id || warehouse.deleted_at !== null) {
    return res.status(404).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'NOT_FOUND', message: 'Warehouse not found.' }],
    });
  }

  const { location_code, location_name, aisle, rack, shelf, bin, location_type } = req.body;
  if (!location_code || !location_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Location code and name required.' }],
    });
  }

  const now = new Date().toISOString();
  const location: StorageLocation = {
    id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    warehouse_id: warehouse.id,
    location_code,
    location_name,
    aisle: aisle || '',
    rack: rack || '',
    shelf: shelf || '',
    bin: bin || '',
    location_type: location_type || 'PICKING',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.storageLocations.set(location.id, location);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: location,
  });
});

// ==========================================
// 9. CURRENCIES & EXCHANGE RATES
// ==========================================

/**
 * GET /api/v1/master/currencies
 */
masterDataRouter.get('/currencies', (req: AuthenticatedRequest, res: Response) => {
  const currencies = Array.from(db.currencyReferences.values());
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: currencies,
  });
});

/**
 * GET /api/v1/master/exchange-rates
 */
masterDataRouter.get('/exchange-rates', (req: AuthenticatedRequest, res: Response) => {
  const rates = db.getExchangeRates(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: rates,
  });
});

/**
 * POST /api/v1/master/exchange-rates
 */
masterDataRouter.post('/exchange-rates', requirePermission('edit', 'config'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { from_currency, to_currency, rate, rate_type, effective_date, source } = req.body;

  if (!from_currency || !to_currency || !rate) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'From currency, to currency, and rate are required.' }],
    });
  }

  const now = new Date().toISOString();
  const exchangeRate: ExchangeRate = {
    id: `fx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    from_currency,
    to_currency,
    rate: String(rate),
    rate_type: rate_type || 'CORPORATE',
    effective_date: effective_date || now.split('T')[0],
    source: source || 'CENTRAL_BANK',
    created_at: now,
    created_by: user.id,
  };

  db.exchangeRates.set(exchangeRate.id, exchangeRate);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: exchangeRate,
  });
});

/**
 * GET /api/v1/master/exchange-rates/lookup
 * Truthful lookup that fails explicitly when rate is missing.
 */
masterDataRouter.get('/exchange-rates/lookup', (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const from = (req.query.from as string) || '';
  const to = (req.query.to as string) || '';

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_PARAMS', message: 'Both "from" and "to" currency parameters are required.' }],
    });
  }

  const rateResult = db.lookupExchangeRate(tenantId, from, to);
  if (!rateResult) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'FX_RATE_NOT_CONFIGURED', message: `Exchange rate not configured between ${from} and ${to}.` }],
    });
  }

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      from_currency: from,
      to_currency: to,
      rate: rateResult.rate,
      source: rateResult.source,
    },
  });
});

// ==========================================
// 10. PRICE LISTS & PAYMENT TERMS
// ==========================================

/**
 * GET/POST /api/v1/master/price-lists
 */
masterDataRouter.get('/price-lists', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const lists = db.getPriceLists(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: lists,
  });
});

masterDataRouter.post('/price-lists', requirePermission('create', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { price_list_code, price_list_name, currency_code, scope, scope_id, customer_group_id, effective_from } = req.body;

  if (!price_list_code || !price_list_name || !currency_code) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Price list code, name, and currency are required.' }],
    });
  }

  const now = new Date().toISOString();
  const list: PriceList = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    price_list_code,
    price_list_name,
    currency_code,
    scope: scope || 'GLOBAL',
    scope_id: scope_id || null,
    customer_group_id: customer_group_id || null,
    effective_from: effective_from || now,
    effective_to: null,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.priceLists.set(list.id, list);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: list,
  });
});

/**
 * GET/POST /api/v1/master/price-lists/:id/items
 */
masterDataRouter.get('/price-lists/:id/items', requirePermission('view', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const items = db.getPriceListItems(req.context!.tenant.id, req.params.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: items,
  });
});

masterDataRouter.post('/price-lists/:id/items', requirePermission('edit', 'products'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { variant_id, uom_id, min_quantity, unit_price } = req.body;

  if (!variant_id || !uom_id || !unit_price) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Variant ID, UOM ID, and unit price required.' }],
    });
  }

  const now = new Date().toISOString();
  const item: PriceListItem = {
    id: `pli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    price_list_id: req.params.id,
    variant_id,
    uom_id,
    min_quantity: min_quantity || 1,
    unit_price: String(unit_price),
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.priceListItems.set(item.id, item);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: item,
  });
});

/**
 * GET/POST /api/v1/master/payment-terms
 */
masterDataRouter.get('/payment-terms', (req: AuthenticatedRequest, res: Response) => {
  const terms = db.getPaymentTerms(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: terms,
  });
});

masterDataRouter.post('/payment-terms', requirePermission('edit', 'config'), (req: AuthenticatedRequest, res: Response) => {
  const { tenant, user } = req.context!;
  const { term_code, term_name, rule_type, net_days, discount_days, discount_percentage } = req.body;

  if (!term_code || !term_name) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'Term code and name required.' }],
    });
  }

  const now = new Date().toISOString();
  const term: PaymentTerms = {
    id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: tenant.id,
    term_code,
    term_name,
    rule_type: rule_type || 'NET_DAYS',
    net_days: net_days !== undefined ? net_days : 30,
    discount_days: discount_days || 0,
    discount_percentage: discount_percentage || '0.00',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    created_by: user.id,
    updated_by: user.id,
    deleted_at: null,
    version: 1,
  };

  db.paymentTerms.set(term.id, term);

  return res.status(201).json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: term,
  });
});

// ==========================================
// 11. DOCUMENT NUMBERING & REFERENCES
// ==========================================

/**
 * GET /api/v1/master/numbering-configs
 */
masterDataRouter.get('/numbering-configs', requirePermission('view', 'config'), (req: AuthenticatedRequest, res: Response) => {
  const configs = db.getDocumentNumberingConfigs(req.context!.tenant.id);
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: configs,
  });
});

/**
 * POST /api/v1/master/numbering/generate
 * Atomic sequence generator endpoint
 */
masterDataRouter.post('/numbering/generate', requirePermission('view', 'tenant'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.context!.tenant.id;
  const { document_type, legal_entity_id, branch_id } = req.body;

  if (!document_type) {
    return res.status(400).json({
      success: false,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      errors: [{ code: 'VAL_MISSING_FIELDS', message: 'document_type is required.' }],
    });
  }

  const generatedNumber = db.generateNextDocumentNumber(
    tenantId,
    document_type as DocumentType,
    legal_entity_id,
    branch_id
  );

  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: {
      document_type,
      document_number: generatedNumber,
    },
  });
});

/**
 * GET /api/v1/master/reference/countries
 */
masterDataRouter.get('/reference/countries', (req: AuthenticatedRequest, res: Response) => {
  const countries = Array.from(db.countryReferences.values());
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: countries,
  });
});

/**
 * GET /api/v1/master/reference/jurisdictions
 */
masterDataRouter.get('/reference/jurisdictions', (req: AuthenticatedRequest, res: Response) => {
  const jurisdictions = Array.from(db.jurisdictionReferences.values());
  return res.json({
    success: true,
    meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    data: jurisdictions,
  });
});
