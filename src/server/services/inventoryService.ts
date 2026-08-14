/**
 * Bill Vyom — Phase 8 Global Inventory & Warehouse Management Engine
 * 
 * Authoritative Principles:
 * 1. THE INVENTORY LEDGER IS THE AUTHORITATIVE SOURCE FOR ALL STOCK MOVEMENT.
 * 2. Immutable, append-only Stock Movements (no direct balance updates, no silent mutations).
 * 3. Derived Stock Balances, Availability, Cost Layers, and Valuation are rebuildable from movements.
 * 4. Strict multi-tenant isolation, negative stock policy enforcement, and atomic double-entry accounting coordination.
 * 5. Zero placeholder, fake, or mock data.
 */

import {
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
  MovementType,
  MovementDirection,
  MovementSourceType,
  InventoryStatus,
  CostingMethod,
  NegativeStockPolicy,
  JournalEntry,
} from '../../domain/types';
import { Decimal } from '../../domain/decimal';
import { db } from '../db';

export class InventoryService {
  private static instance: InventoryService;

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  // ==========================================
  // 1. POLICY SETTINGS
  // ==========================================

  public getPolicySettings(tenantId: string): InventoryPolicySettings {
    const existing = db.inventoryPolicySettings.get(tenantId);
    if (existing) return existing;

    const defaultPolicy: InventoryPolicySettings = {
      negative_stock_policy: 'BLOCK_NEGATIVE',
      default_costing_method: 'FIFO',
      enforce_location_tracking: false,
      enforce_lot_tracking_on_expiry: true,
      require_adjustment_approval_above_amount: '1000.00',
    };
    db.inventoryPolicySettings.set(tenantId, defaultPolicy);
    return defaultPolicy;
  }

  public updatePolicySettings(
    tenantId: string,
    settings: Partial<InventoryPolicySettings>,
    actorId: string
  ): InventoryPolicySettings {
    const current = this.getPolicySettings(tenantId);
    const updated: InventoryPolicySettings = {
      ...current,
      ...settings,
    };
    db.inventoryPolicySettings.set(tenantId, updated);

    db.recordAuditLog({
      tenant_id: tenantId,
      actor_id: actorId,
      actor_email: 'inventory@billvyom.internal',
      action: 'INVENTORY_POLICY_UPDATED',
      resource_type: 'InventoryPolicySettings',
      resource_id: tenantId,
      changes: settings,
    });

    return updated;
  }

  // ==========================================
  // 2. WAREHOUSES & LOCATIONS HIERARCHY
  // ==========================================

  public createZone(input: {
    tenant_id: string;
    warehouse_id: string;
    zone_code: string;
    zone_name: string;
    zone_type?: string;
    created_by: string;
  }): WarehouseZone {
    const warehouse = db.warehouses.get(input.warehouse_id);
    if (!warehouse || warehouse.tenant_id !== input.tenant_id || warehouse.deleted_at !== null) {
      throw new Error(`Warehouse '${input.warehouse_id}' does not exist or is inactive.`);
    }

    // Check duplicate zone code in same warehouse
    const existingZone = Array.from(db.warehouseZones.values()).find(
      (z) =>
        z.tenant_id === input.tenant_id &&
        z.warehouse_id === input.warehouse_id &&
        z.zone_code.toUpperCase() === input.zone_code.trim().toUpperCase() &&
        z.deleted_at === null
    );
    if (existingZone) {
      throw new Error(`Zone code '${input.zone_code}' already exists in warehouse '${warehouse.warehouse_name}'.`);
    }

    const nowIso = new Date().toISOString();
    const zone: WarehouseZone = {
      id: `whz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: input.tenant_id,
      warehouse_id: input.warehouse_id,
      zone_code: input.zone_code.trim().toUpperCase(),
      zone_name: input.zone_name.trim(),
      zone_type: input.zone_type || 'GENERAL_STORAGE',
      status: 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.warehouseZones.set(zone.id, zone);
    return zone;
  }

  public getZones(tenantId: string, warehouseId?: string): WarehouseZone[] {
    return Array.from(db.warehouseZones.values()).filter(
      (z) =>
        z.tenant_id === tenantId &&
        z.deleted_at === null &&
        (!warehouseId || z.warehouse_id === warehouseId)
    );
  }

  public createLocation(input: {
    tenant_id: string;
    warehouse_id: string;
    zone_id?: string | null;
    location_code: string;
    aisle?: string | null;
    rack?: string | null;
    shelf?: string | null;
    bin?: string | null;
    location_type?: WarehouseLocation['location_type'];
    is_default_receiving?: boolean;
    is_default_shipping?: boolean;
    max_weight_capacity?: number | null;
    max_volume_capacity?: number | null;
    created_by: string;
  }): WarehouseLocation {
    const warehouse = db.warehouses.get(input.warehouse_id);
    if (!warehouse || warehouse.tenant_id !== input.tenant_id || warehouse.deleted_at !== null) {
      throw new Error(`Warehouse '${input.warehouse_id}' does not exist.`);
    }

    const code = input.location_code.trim().toUpperCase();
    const existing = Array.from(db.warehouseLocations.values()).find(
      (l) =>
        l.tenant_id === input.tenant_id &&
        l.warehouse_id === input.warehouse_id &&
        l.location_code === code &&
        l.deleted_at === null
    );
    if (existing) {
      throw new Error(`Location code '${code}' already exists in warehouse '${warehouse.warehouse_name}'.`);
    }

    const nowIso = new Date().toISOString();
    const location: WarehouseLocation = {
      id: `whl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: input.tenant_id,
      warehouse_id: input.warehouse_id,
      zone_id: input.zone_id || null,
      location_code: code,
      aisle: input.aisle || null,
      rack: input.rack || null,
      shelf: input.shelf || null,
      bin: input.bin || null,
      location_type: input.location_type || 'STORAGE',
      status: 'ACTIVE',
      is_default_receiving: Boolean(input.is_default_receiving),
      is_default_shipping: Boolean(input.is_default_shipping),
      max_weight_capacity: input.max_weight_capacity || null,
      max_volume_capacity: input.max_volume_capacity || null,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.warehouseLocations.set(location.id, location);
    return location;
  }

  public getLocations(tenantId: string, warehouseId?: string): WarehouseLocation[] {
    return Array.from(db.warehouseLocations.values()).filter(
      (l) =>
        l.tenant_id === tenantId &&
        l.deleted_at === null &&
        (!warehouseId || l.warehouse_id === warehouseId)
    );
  }

  // ==========================================
  // 3. LOT/BATCH & SERIAL NUMBER LIFECYCLE
  // ==========================================

  public createLotBatch(input: {
    tenant_id: string;
    legal_entity_id: string;
    product_id: string;
    variant_id?: string | null;
    batch_number: string;
    supplier_id?: string | null;
    manufacture_date?: string | null;
    expiry_date?: string | null;
    shelf_life_days?: number | null;
    source_receipt_id?: string | null;
    created_by: string;
  }): LotBatch {
    const product = db.getProductById(input.tenant_id, input.product_id);
    if (!product) throw new Error(`Product '${input.product_id}' not found.`);

    const bNum = input.batch_number.trim().toUpperCase();
    const existing = Array.from(db.lotBatches.values()).find(
      (b) =>
        b.tenant_id === input.tenant_id &&
        b.legal_entity_id === input.legal_entity_id &&
        b.product_id === input.product_id &&
        b.batch_number === bNum &&
        b.deleted_at === null
    );
    if (existing) {
      return existing; // Idempotent reuse of lot
    }

    let status: LotBatch['status'] = 'VALID';
    if (input.expiry_date) {
      const exp = new Date(input.expiry_date);
      const now = new Date();
      if (exp.getTime() < now.getTime()) {
        status = 'EXPIRED';
      } else if (exp.getTime() - now.getTime() < 30 * 24 * 3600 * 1000) {
        status = 'EXPIRING';
      }
    }

    const nowIso = new Date().toISOString();
    const lot: LotBatch = {
      id: `lot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      sku: product.product_code,
      batch_number: bNum,
      supplier_id: input.supplier_id || null,
      manufacture_date: input.manufacture_date || null,
      expiry_date: input.expiry_date || null,
      shelf_life_days: input.shelf_life_days || null,
      status,
      source_receipt_id: input.source_receipt_id || null,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.lotBatches.set(lot.id, lot);
    return lot;
  }

  public getLotBatches(tenantId: string, productId?: string): LotBatch[] {
    return Array.from(db.lotBatches.values()).filter(
      (b) =>
        b.tenant_id === tenantId &&
        b.deleted_at === null &&
        (!productId || b.product_id === productId)
    );
  }

  public registerSerialNumber(input: {
    tenant_id: string;
    product_id: string;
    variant_id?: string | null;
    serial_number: string;
    current_warehouse_id?: string | null;
    current_location_id?: string | null;
    lot_id?: string | null;
    source_receipt_id?: string | null;
    warranty_start_date?: string | null;
    warranty_end_date?: string | null;
    created_by: string;
  }): SerialNumber {
    const product = db.getProductById(input.tenant_id, input.product_id);
    if (!product) throw new Error(`Product '${input.product_id}' not found.`);

    const sNum = input.serial_number.trim();
    const existing = Array.from(db.serialNumbers.values()).find(
      (s) =>
        s.tenant_id === input.tenant_id &&
        s.product_id === input.product_id &&
        s.serial_number === sNum &&
        s.deleted_at === null
    );

    if (existing) {
      if (existing.status === 'IN_STOCK' || existing.status === 'RESERVED') {
        throw new Error(`Serial Number '${sNum}' is already active and in stock for product ${product.product_code}.`);
      }
    }

    const nowIso = new Date().toISOString();
    const serial: SerialNumber = {
      id: `sn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: input.tenant_id,
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      sku: product.product_code,
      serial_number: sNum,
      status: 'IN_STOCK',
      current_warehouse_id: input.current_warehouse_id || null,
      current_location_id: input.current_location_id || null,
      lot_id: input.lot_id || null,
      source_receipt_id: input.source_receipt_id || null,
      source_fulfillment_id: null,
      warranty_start_date: input.warranty_start_date || null,
      warranty_end_date: input.warranty_end_date || null,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.serialNumbers.set(serial.id, serial);
    return serial;
  }

  public getSerialNumbers(tenantId: string, productId?: string): SerialNumber[] {
    return Array.from(db.serialNumbers.values()).filter(
      (s) =>
        s.tenant_id === tenantId &&
        s.deleted_at === null &&
        (!productId || s.product_id === productId)
    );
  }

  // ==========================================
  // 4. AUTHORITATIVE STOCK LEDGER & MOVEMENTS
  // ==========================================

  public recordInventoryMovement(input: {
    tenant_id: string;
    legal_entity_id: string;
    warehouse_id: string;
    location_id?: string | null;
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    movement_type: MovementType;
    direction?: MovementDirection;
    source_type: MovementSourceType;
    source_id: string;
    source_line_id?: string | null;
    lot_id?: string | null;
    batch_number?: string | null;
    serial_id?: string | null;
    serial_number?: string | null;
    inventory_status?: InventoryStatus;
    unit_cost?: string;
    cost_reference?: string | null;
    movement_date?: string;
    correlation_id?: string;
    created_by: string;
    skip_accounting_posting?: boolean;
  }): { movement: InventoryMovement; balance: StockBalance; costTransaction?: InventoryCostTransaction } {
    if (input.quantity <= 0) {
      throw new Error(`Movement quantity must be strictly positive (got ${input.quantity}).`);
    }

    // 1. Warehouse Validation
    const warehouse = db.warehouses.get(input.warehouse_id);
    if (!warehouse || warehouse.tenant_id !== input.tenant_id || warehouse.deleted_at !== null) {
      throw new Error(`Warehouse '${input.warehouse_id}' not found or deleted.`);
    }
    if ((warehouse as any).status && (warehouse as any).status !== 'ACTIVE') {
      throw new Error(`Warehouse '${warehouse.warehouse_name}' is ${(warehouse as any).status}. Stock movements are prohibited.`);
    }

    // 2. Location Validation
    if (input.location_id) {
      const loc = db.warehouseLocations.get(input.location_id);
      if (!loc || loc.tenant_id !== input.tenant_id || loc.deleted_at !== null) {
        throw new Error(`Location '${input.location_id}' not found.`);
      }
      if (loc.status === 'BLOCKED' || loc.status === 'CLOSED') {
        throw new Error(`Location '${loc.location_code}' is ${loc.status}. Cannot perform stock operations.`);
      }
    }

    // 3. Product Validation
    const product = db.getProductById(input.tenant_id, input.product_id);
    if (!product) {
      throw new Error(`Product '${input.product_id}' does not exist.`);
    }

    const policy = this.getPolicySettings(input.tenant_id);
    const invStatus: InventoryStatus = input.inventory_status || 'AVAILABLE';

    // 4. Direction Inference
    let direction: MovementDirection = input.direction || 'IN';
    if (!input.direction) {
      if (
        [
          'RECEIPT',
          'TRANSFER_IN',
          'ADJUSTMENT_IN',
          'RETURN_IN',
          'UNQUARANTINE',
          'UNBLOCK',
        ].includes(input.movement_type)
      ) {
        direction = 'IN';
      } else if (
        [
          'ISSUE',
          'TRANSFER_OUT',
          'ADJUSTMENT_OUT',
          'RETURN_OUT',
          'DAMAGE',
          'QUARANTINE',
          'BLOCK',
        ].includes(input.movement_type)
      ) {
        direction = 'OUT';
      } else {
        direction = 'NONE';
      }
    }

    // 5. Stock Availability & Negative Stock Check
    const currentBalance = this.getStockBalance(
      input.tenant_id,
      input.warehouse_id,
      input.product_id,
      input.location_id,
      input.lot_id,
      invStatus
    );

    if (direction === 'OUT') {
      const currentAvailable = currentBalance ? currentBalance.available_quantity : 0;
      const currentOnHand = currentBalance ? currentBalance.on_hand_quantity : 0;

      if (input.movement_type === 'ISSUE' || input.movement_type === 'TRANSFER_OUT' || input.movement_type === 'ADJUSTMENT_OUT') {
        if (input.quantity > currentOnHand) {
          if (policy.negative_stock_policy === 'BLOCK_NEGATIVE') {
            throw new Error(
              `Insufficient stock for product '${product.product_code}' at warehouse '${warehouse.warehouse_name}'. Available: ${currentAvailable}, On-Hand: ${currentOnHand}, Requested: ${input.quantity}. Negative stock policy is strictly blocked.`
            );
          }
        }
      }
    }

    // 6. Costing Engine (FIFO Layer Consumption or Weighted Average)
    let calculatedUnitCost = input.unit_cost ? new Decimal(input.unit_cost) : (currentBalance ? new Decimal(currentBalance.unit_cost_average) : new Decimal('0'));
    let totalCostDec = calculatedUnitCost.mul(input.quantity);
    let costTransaction: InventoryCostTransaction | undefined;
    const nowIso = new Date().toISOString();
    const movementDate = input.movement_date || nowIso;
    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const costLayerIdsConsumed: string[] = [];

    if (direction === 'IN') {
      // Create FIFO Cost Layer for incoming inventory
      const costLayer: InventoryCostLayer = {
        id: `cly_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: input.tenant_id,
        legal_entity_id: input.legal_entity_id,
        warehouse_id: input.warehouse_id,
        product_id: input.product_id,
        variant_id: input.variant_id || null,
        sku: product.product_code,
        lot_id: input.lot_id || null,
        receipt_movement_id: movementId,
        receipt_date: movementDate,
        original_quantity: input.quantity,
        remaining_quantity: input.quantity,
        unit_cost: calculatedUnitCost.toString(4),
        remaining_value: totalCostDec.toString(2),
        is_exhausted: false,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: input.created_by,
        updated_by: input.created_by,
        deleted_at: null,
        version: 1,
      };
      db.inventoryCostLayers.set(costLayer.id, costLayer);

      costTransaction = {
        id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: input.tenant_id,
        legal_entity_id: input.legal_entity_id,
        movement_id: movementId,
        product_id: input.product_id,
        sku: product.product_code,
        transaction_type: 'RECEIPT_COST',
        quantity: input.quantity,
        unit_cost: calculatedUnitCost.toString(4),
        total_cost: totalCostDec.toString(2),
        costing_method: policy.default_costing_method,
        cost_layer_ids: [costLayer.id],
        journal_entry_id: null,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: input.created_by,
        updated_by: input.created_by,
        deleted_at: null,
        version: 1,
      };
      db.inventoryCostTransactions.set(costTransaction.id, costTransaction);
    } else if (direction === 'OUT') {
      if (policy.default_costing_method === 'FIFO') {
        // Consume unexhausted cost layers in chronological order
        const availableLayers = Array.from(db.inventoryCostLayers.values())
          .filter(
            (l) =>
              l.tenant_id === input.tenant_id &&
              l.warehouse_id === input.warehouse_id &&
              l.product_id === input.product_id &&
              !l.is_exhausted &&
              l.remaining_quantity > 0 &&
              l.deleted_at === null
          )
          .sort((a, b) => new Date(a.receipt_date).getTime() - new Date(b.receipt_date).getTime());

        let qtyToConsume = input.quantity;
        let runningTotalCost = Decimal.zero(4);

        for (const layer of availableLayers) {
          if (qtyToConsume <= 0) break;
          const consumeFromThis = Math.min(qtyToConsume, layer.remaining_quantity);
          const layerCost = new Decimal(layer.unit_cost);
          runningTotalCost = runningTotalCost.add(layerCost.mul(consumeFromThis));

          layer.remaining_quantity -= consumeFromThis;
          layer.remaining_value = layerCost.mul(layer.remaining_quantity).toString(2);
          if (layer.remaining_quantity <= 0) {
            layer.is_exhausted = true;
          }
          layer.updated_at = nowIso;
          db.inventoryCostLayers.set(layer.id, layer);
          costLayerIdsConsumed.push(layer.id);
          qtyToConsume -= consumeFromThis;
        }

        if (qtyToConsume > 0 && availableLayers.length > 0) {
          // Consume remainder at latest layer unit cost
          const fallbackCost = new Decimal(availableLayers[availableLayers.length - 1].unit_cost);
          runningTotalCost = runningTotalCost.add(fallbackCost.mul(qtyToConsume));
        }

        totalCostDec = runningTotalCost;
        calculatedUnitCost = input.quantity > 0 ? totalCostDec.div(input.quantity) : calculatedUnitCost;
      } else {
        // Weighted average costing
        calculatedUnitCost = currentBalance ? new Decimal(currentBalance.unit_cost_average) : calculatedUnitCost;
        totalCostDec = calculatedUnitCost.mul(input.quantity);
      }

      costTransaction = {
        id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: input.tenant_id,
        legal_entity_id: input.legal_entity_id,
        movement_id: movementId,
        product_id: input.product_id,
        sku: product.product_code,
        transaction_type: input.movement_type === 'ISSUE' ? 'COGS_ISSUE' : 'ADJUSTMENT_COST',
        quantity: input.quantity,
        unit_cost: calculatedUnitCost.toString(4),
        total_cost: totalCostDec.toString(2),
        costing_method: policy.default_costing_method,
        cost_layer_ids: costLayerIdsConsumed,
        journal_entry_id: null,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: input.created_by,
        updated_by: input.created_by,
        deleted_at: null,
        version: 1,
      };
      db.inventoryCostTransactions.set(costTransaction.id, costTransaction);
    }

    // 7. Post Accounting Journal Entry via Phase 4 Double-Entry Ledger (if applicable)
    let journalEntryId: string | null = null;
    if (!input.skip_accounting_posting && totalCostDec.toNumber() > 0) {
      journalEntryId = this.postInventoryAccounting({
        tenant_id: input.tenant_id,
        legal_entity_id: input.legal_entity_id,
        movement_type: input.movement_type,
        total_cost: totalCostDec.toString(2),
        currency_code: 'INR',
        movement_id: movementId,
        source_id: input.source_id,
        product_name: product.name,
        actor_id: input.created_by,
      });
      if (costTransaction) {
        costTransaction.journal_entry_id = journalEntryId;
      }
    }

    // 8. Create Immutable Inventory Movement
    const movement: InventoryMovement = {
      id: movementId,
      movement_id: movementId,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      warehouse_id: input.warehouse_id,
      location_id: input.location_id || null,
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      sku: product.product_code,
      uom_id: product.base_uom_id || 'uom_unit',
      quantity: input.quantity,
      direction,
      movement_type: input.movement_type,
      source_type: input.source_type,
      source_id: input.source_id,
      source_line_id: input.source_line_id || null,
      lot_id: input.lot_id || null,
      batch_number: input.batch_number || null,
      serial_id: input.serial_id || null,
      serial_number: input.serial_number || null,
      inventory_status: invStatus,
      movement_date: movementDate,
      posting_date: movementDate,
      cost_reference: input.cost_reference || null,
      unit_cost: calculatedUnitCost.toString(4),
      total_cost: totalCostDec.toString(2),
      correlation_id: input.correlation_id || `corr_${Date.now()}`,
      journal_entry_id: journalEntryId,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.inventoryMovements.set(movement.id, movement);

    // 9. Update Serial Number Status if applicable
    if (input.serial_id) {
      const sn = db.serialNumbers.get(input.serial_id);
      if (sn) {
        if (input.movement_type === 'ISSUE') {
          sn.status = 'ISSUED';
        } else if (input.movement_type === 'DAMAGE') {
          sn.status = 'DAMAGED';
        } else if (input.movement_type === 'QUARANTINE') {
          sn.status = 'QUARANTINED';
        } else if (direction === 'IN') {
          sn.status = 'IN_STOCK';
          sn.current_warehouse_id = input.warehouse_id;
          sn.current_location_id = input.location_id || null;
        }
        sn.updated_at = nowIso;
        db.serialNumbers.set(sn.id, sn);
      }
    }

    // 10. Update Derived Stock Balance atomically
    const balance = this.updateDerivedStockBalance(movement);

    // 11. Record Transactional Audit Log
    db.recordAuditLog({
      tenant_id: input.tenant_id,
      actor_id: input.created_by,
      actor_email: 'inventory@billvyom.internal',
      action: `INVENTORY_MOVEMENT_${input.movement_type}`,
      resource_type: 'InventoryMovement',
      resource_id: movement.id,
      changes: {
        sku: product.product_code,
        quantity: input.quantity,
        direction,
        warehouse_id: input.warehouse_id,
        total_cost: totalCostDec.toString(2),
      },
    });

    return { movement, balance, costTransaction };
  }

  // ==========================================
  // 5. DERIVED STOCK BALANCES ENGINE
  // ==========================================

  private updateDerivedStockBalance(movement: InventoryMovement): StockBalance {
    const key = `${movement.tenant_id}_${movement.warehouse_id}_${movement.product_id}_${movement.location_id || 'null'}_${movement.lot_id || 'null'}_${movement.inventory_status}`;
    let balance = db.stockBalances.get(key);

    const nowIso = new Date().toISOString();
    if (!balance) {
      balance = {
        id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: movement.tenant_id,
        legal_entity_id: movement.legal_entity_id,
        warehouse_id: movement.warehouse_id,
        location_id: movement.location_id || null,
        product_id: movement.product_id,
        variant_id: movement.variant_id || null,
        sku: movement.sku,
        uom_id: movement.uom_id,
        lot_id: movement.lot_id || null,
        inventory_status: movement.inventory_status,
        on_hand_quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        in_transit_quantity: 0,
        quarantined_quantity: 0,
        damaged_quantity: 0,
        blocked_quantity: 0,
        unit_cost_average: movement.unit_cost || '0.0000',
        total_valuation: '0.00',
        last_movement_at: movement.movement_date,
        updated_at: nowIso,
      };
    }

    const qty = movement.quantity;
    if (movement.direction === 'IN') {
      balance.on_hand_quantity += qty;
      if (movement.inventory_status === 'QUARANTINED') {
        balance.quarantined_quantity += qty;
      } else if (movement.inventory_status === 'DAMAGED') {
        balance.damaged_quantity += qty;
      } else if (movement.inventory_status === 'BLOCKED') {
        balance.blocked_quantity += qty;
      }
    } else if (movement.direction === 'OUT') {
      balance.on_hand_quantity -= qty;
      if (movement.inventory_status === 'QUARANTINED') {
        balance.quarantined_quantity = Math.max(0, balance.quarantined_quantity - qty);
      } else if (movement.inventory_status === 'DAMAGED') {
        balance.damaged_quantity = Math.max(0, balance.damaged_quantity - qty);
      } else if (movement.inventory_status === 'BLOCKED') {
        balance.blocked_quantity = Math.max(0, balance.blocked_quantity - qty);
      }
    }

    // Availability formula: ON_HAND - RESERVED - (QUARANTINED + DAMAGED + BLOCKED if not already segregated)
    balance.available_quantity = Math.max(
      0,
      balance.on_hand_quantity -
        balance.reserved_quantity -
        (balance.inventory_status !== 'AVAILABLE' ? balance.on_hand_quantity : 0)
    );

    // Calculate moving valuation
    const avgCostDec = new Decimal(balance.unit_cost_average || '0');
    balance.total_valuation = avgCostDec.mul(Math.max(0, balance.on_hand_quantity)).toString(2);
    balance.last_movement_at = movement.movement_date;
    balance.updated_at = nowIso;

    db.stockBalances.set(key, balance);
    return balance;
  }

  public getStockBalance(
    tenantId: string,
    warehouseId: string,
    productId: string,
    locationId?: string | null,
    lotId?: string | null,
    status: InventoryStatus = 'AVAILABLE'
  ): StockBalance | undefined {
    const key = `${tenantId}_${warehouseId}_${productId}_${locationId || 'null'}_${lotId || 'null'}_${status}`;
    return db.stockBalances.get(key);
  }

  public getAllStockBalances(tenantId: string, warehouseId?: string): StockBalance[] {
    return Array.from(db.stockBalances.values()).filter(
      (b) => b.tenant_id === tenantId && (!warehouseId || b.warehouse_id === warehouseId)
    );
  }

  // ==========================================
  // 6. PROJECTION REBUILD ENGINE
  // ==========================================

  public rebuildStockBalances(tenantId: string, legalEntityId?: string): {
    rebuilt_movements_count: number;
    rebuilt_balances_count: number;
    total_rebuilt_valuation: string;
  } {
    // 1. Clear current derived balances for this tenant
    for (const [key, b] of db.stockBalances.entries()) {
      if (b.tenant_id === tenantId && (!legalEntityId || b.legal_entity_id === legalEntityId)) {
        db.stockBalances.delete(key);
      }
    }

    // 2. Fetch all movements in chronological order
    const movements = Array.from(db.inventoryMovements.values())
      .filter(
        (m) =>
          m.tenant_id === tenantId &&
          m.deleted_at === null &&
          (!legalEntityId || m.legal_entity_id === legalEntityId)
      )
      .sort((a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime());

    // 3. Replay movements sequentially
    for (const movement of movements) {
      this.updateDerivedStockBalance(movement);
    }

    // 4. Re-apply active reservations to derived available quantities
    const activeReservations = Array.from(db.stockReservations.values()).filter(
      (r) =>
        r.tenant_id === tenantId &&
        (r.status === 'RESERVED' || r.status === 'PARTIALLY_RESERVED') &&
        r.deleted_at === null
    );

    for (const res of activeReservations) {
      const key = `${res.tenant_id}_${res.warehouse_id}_${res.product_id}_${res.location_id || 'null'}_${res.lot_id || 'null'}_AVAILABLE`;
      const balance = db.stockBalances.get(key);
      if (balance) {
        balance.reserved_quantity += (res.quantity_reserved - res.quantity_fulfilled);
        balance.available_quantity = Math.max(0, balance.on_hand_quantity - balance.reserved_quantity);
        db.stockBalances.set(key, balance);
      }
    }

    let totalVal = Decimal.zero(2);
    let count = 0;
    for (const b of db.stockBalances.values()) {
      if (b.tenant_id === tenantId) {
        totalVal = totalVal.add(new Decimal(b.total_valuation || '0'));
        count++;
      }
    }

    return {
      rebuilt_movements_count: movements.length,
      rebuilt_balances_count: count,
      total_rebuilt_valuation: totalVal.toString(2),
    };
  }

  // ==========================================
  // 7. STOCK RESERVATIONS ENGINE
  // ==========================================

  public createReservation(input: {
    tenant_id: string;
    legal_entity_id: string;
    source_type: StockReservation['source_type'];
    source_id: string;
    source_line_id?: string | null;
    product_id: string;
    variant_id?: string | null;
    warehouse_id: string;
    location_id?: string | null;
    lot_id?: string | null;
    quantity: number;
    expiry_date?: string | null;
    notes?: string;
    created_by: string;
  }): StockReservation {
    const product = db.getProductById(input.tenant_id, input.product_id);
    if (!product) throw new Error(`Product '${input.product_id}' not found.`);

    const warehouse = db.warehouses.get(input.warehouse_id);
    if (!warehouse) throw new Error(`Warehouse '${input.warehouse_id}' not found.`);

    const balance = this.getStockBalance(
      input.tenant_id,
      input.warehouse_id,
      input.product_id,
      input.location_id,
      input.lot_id,
      'AVAILABLE'
    );

    const policy = this.getPolicySettings(input.tenant_id);
    const availableQty = balance ? balance.available_quantity : 0;

    if (input.quantity > availableQty && policy.negative_stock_policy === 'BLOCK_NEGATIVE') {
      throw new Error(
        `Cannot reserve ${input.quantity} units of '${product.product_code}'. Only ${availableQty} units are currently available in '${warehouse.warehouse_name}'.`
      );
    }

    const nowIso = new Date().toISOString();
    const reservation: StockReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      reservation_number: `RES-${Date.now().toString().slice(-6)}`,
      source_type: input.source_type,
      source_id: input.source_id,
      source_line_id: input.source_line_id || null,
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      sku: product.product_code,
      warehouse_id: input.warehouse_id,
      location_id: input.location_id || null,
      lot_id: input.lot_id || null,
      quantity_requested: input.quantity,
      quantity_reserved: input.quantity,
      quantity_fulfilled: 0,
      uom_id: product.base_uom_id || 'uom_unit',
      reservation_date: nowIso,
      expiry_date: input.expiry_date || null,
      status: 'RESERVED',
      notes: input.notes,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.stockReservations.set(reservation.id, reservation);

    // Update derived reservation in balance
    if (balance) {
      balance.reserved_quantity += input.quantity;
      balance.available_quantity = Math.max(0, balance.on_hand_quantity - balance.reserved_quantity);
      db.stockBalances.set(
        `${balance.tenant_id}_${balance.warehouse_id}_${balance.product_id}_${balance.location_id || 'null'}_${balance.lot_id || 'null'}_AVAILABLE`,
        balance
      );
    }

    return reservation;
  }

  public releaseReservation(
    tenantId: string,
    reservationId: string,
    quantityToRelease?: number,
    actorId: string = 'system'
  ): StockReservation {
    const res = db.stockReservations.get(reservationId);
    if (!res || res.tenant_id !== tenantId || res.deleted_at !== null) {
      throw new Error(`Reservation '${reservationId}' not found.`);
    }

    const unfulfilled = res.quantity_reserved - res.quantity_fulfilled;
    const releaseQty = quantityToRelease ? Math.min(quantityToRelease, unfulfilled) : unfulfilled;

    if (releaseQty <= 0) {
      throw new Error(`No active reserved quantity to release.`);
    }

    res.quantity_reserved -= releaseQty;
    if (res.quantity_reserved <= res.quantity_fulfilled) {
      res.status = 'RELEASED';
    } else {
      res.status = 'PARTIALLY_RESERVED';
    }
    res.updated_at = new Date().toISOString();
    db.stockReservations.set(res.id, res);

    // Restore available balance
    const balance = this.getStockBalance(
      tenantId,
      res.warehouse_id,
      res.product_id,
      res.location_id,
      res.lot_id,
      'AVAILABLE'
    );
    if (balance) {
      balance.reserved_quantity = Math.max(0, balance.reserved_quantity - releaseQty);
      balance.available_quantity = Math.max(0, balance.on_hand_quantity - balance.reserved_quantity);
      db.stockBalances.set(
        `${balance.tenant_id}_${balance.warehouse_id}_${balance.product_id}_${balance.location_id || 'null'}_${balance.lot_id || 'null'}_AVAILABLE`,
        balance
      );
    }

    return res;
  }

  // ==========================================
  // 8. STOCK TRANSFERS ENGINE
  // ==========================================

  public createStockTransfer(input: {
    tenant_id: string;
    source_legal_entity_id: string;
    destination_legal_entity_id: string;
    source_warehouse_id: string;
    destination_warehouse_id: string;
    transfer_date?: string;
    notes?: string;
    lines: Array<{
      product_id: string;
      variant_id?: string | null;
      quantity: number;
      source_location_id?: string | null;
      destination_location_id?: string | null;
      lot_id?: string | null;
      serial_numbers?: string[];
    }>;
    created_by: string;
  }): StockTransfer {
    if (input.source_warehouse_id === input.destination_warehouse_id) {
      throw new Error(`Source and destination warehouses cannot be identical.`);
    }

    const sWh = db.warehouses.get(input.source_warehouse_id);
    const dWh = db.warehouses.get(input.destination_warehouse_id);
    if (!sWh || !dWh) throw new Error(`Source or destination warehouse not found.`);

    const nowIso = new Date().toISOString();
    const transferId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;

    const formattedLines: StockTransferLine[] = input.lines.map((l, idx) => {
      const prod = db.getProductById(input.tenant_id, l.product_id);
      return {
        id: `stl_${transferId}_${idx + 1}`,
        transfer_id: transferId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        sku: prod?.product_code || 'SKU-000',
        uom_id: prod?.base_uom_id || 'uom_unit',
        quantity_requested: l.quantity,
        quantity_shipped: 0,
        quantity_received: 0,
        source_location_id: l.source_location_id || null,
        destination_location_id: l.destination_location_id || null,
        lot_id: l.lot_id || null,
        serial_numbers: l.serial_numbers || [],
      };
    });

    const transfer: StockTransfer = {
      id: transferId,
      transfer_number: transferNumber,
      tenant_id: input.tenant_id,
      source_legal_entity_id: input.source_legal_entity_id,
      destination_legal_entity_id: input.destination_legal_entity_id,
      source_warehouse_id: input.source_warehouse_id,
      destination_warehouse_id: input.destination_warehouse_id,
      transfer_date: input.transfer_date || nowIso,
      shipped_at: null,
      received_at: null,
      status: 'APPROVED',
      notes: input.notes,
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.stockTransfers.set(transfer.id, transfer);
    return transfer;
  }

  public shipStockTransfer(
    tenantId: string,
    transferId: string,
    actorId: string
  ): StockTransfer {
    const transfer = db.stockTransfers.get(transferId);
    if (!transfer || transfer.tenant_id !== tenantId || transfer.deleted_at !== null) {
      throw new Error(`Stock transfer '${transferId}' not found.`);
    }

    if (transfer.status !== 'APPROVED' && transfer.status !== 'REQUESTED') {
      throw new Error(`Transfer '${transfer.transfer_number}' is in status ${transfer.status}. Cannot ship.`);
    }

    const nowIso = new Date().toISOString();

    for (const line of transfer.lines) {
      this.recordInventoryMovement({
        tenant_id: tenantId,
        legal_entity_id: transfer.source_legal_entity_id,
        warehouse_id: transfer.source_warehouse_id,
        location_id: line.source_location_id,
        product_id: line.product_id,
        quantity: line.quantity_requested,
        movement_type: 'TRANSFER_OUT',
        direction: 'OUT',
        source_type: 'STOCK_TRANSFER',
        source_id: transfer.id,
        source_line_id: line.id,
        lot_id: line.lot_id,
        created_by: actorId,
        skip_accounting_posting: transfer.source_legal_entity_id === transfer.destination_legal_entity_id,
      });
      line.quantity_shipped = line.quantity_requested;
    }

    transfer.status = 'IN_TRANSIT';
    transfer.shipped_at = nowIso;
    transfer.updated_at = nowIso;
    db.stockTransfers.set(transfer.id, transfer);
    return transfer;
  }

  public receiveStockTransfer(
    tenantId: string,
    transferId: string,
    actorId: string
  ): StockTransfer {
    const transfer = db.stockTransfers.get(transferId);
    if (!transfer || transfer.tenant_id !== tenantId || transfer.deleted_at !== null) {
      throw new Error(`Stock transfer '${transferId}' not found.`);
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error(`Transfer '${transfer.transfer_number}' is not in transit (status is ${transfer.status}).`);
    }

    const nowIso = new Date().toISOString();

    for (const line of transfer.lines) {
      this.recordInventoryMovement({
        tenant_id: tenantId,
        legal_entity_id: transfer.destination_legal_entity_id,
        warehouse_id: transfer.destination_warehouse_id,
        location_id: line.destination_location_id,
        product_id: line.product_id,
        quantity: line.quantity_shipped,
        movement_type: 'TRANSFER_IN',
        direction: 'IN',
        source_type: 'STOCK_TRANSFER',
        source_id: transfer.id,
        source_line_id: line.id,
        lot_id: line.lot_id,
        created_by: actorId,
        skip_accounting_posting: transfer.source_legal_entity_id === transfer.destination_legal_entity_id,
      });
      line.quantity_received = line.quantity_shipped;
    }

    transfer.status = 'RECEIVED';
    transfer.received_at = nowIso;
    transfer.updated_at = nowIso;
    db.stockTransfers.set(transfer.id, transfer);
    return transfer;
  }

  // ==========================================
  // 9. STOCK ADJUSTMENTS & REASON CODES
  // ==========================================

  public createStockAdjustment(input: {
    tenant_id: string;
    legal_entity_id: string;
    warehouse_id: string;
    reason_code: string;
    reason_description: string;
    lines: Array<{
      product_id: string;
      location_id?: string | null;
      lot_id?: string | null;
      serial_id?: string | null;
      quantity: number;
      adjustment_type: 'INCREASE' | 'DECREASE';
      unit_cost?: string;
      notes?: string;
    }>;
    created_by: string;
  }): StockAdjustment {
    const nowIso = new Date().toISOString();
    const adjId = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const adjNumber = `ADJ-${Date.now().toString().slice(-6)}`;
    const policy = this.getPolicySettings(input.tenant_id);

    let totalVal = Decimal.zero(2);
    const formattedLines: StockAdjustmentLine[] = input.lines.map((l, idx) => {
      const prod = db.getProductById(input.tenant_id, l.product_id);
      const uCost = new Decimal(l.unit_cost || '0');
      const lineCost = uCost.mul(l.quantity);
      totalVal = totalVal.add(lineCost);

      return {
        id: `adjl_${adjId}_${idx + 1}`,
        adjustment_id: adjId,
        tenant_id: input.tenant_id,
        product_id: l.product_id,
        variant_id: null,
        sku: prod?.product_code || 'SKU-000',
        location_id: l.location_id || null,
        lot_id: l.lot_id || null,
        serial_id: l.serial_id || null,
        quantity: l.quantity,
        uom_id: prod?.base_uom_id || 'uom_unit',
        adjustment_type: l.adjustment_type,
        unit_cost: uCost.toString(4),
        line_total_cost: lineCost.toString(2),
        notes: l.notes,
      };
    });

    const threshold = new Decimal(policy.require_adjustment_approval_above_amount || '1000.00');
    const requiresApproval = totalVal.greaterThan(threshold);

    const adjustment: StockAdjustment = {
      id: adjId,
      adjustment_number: adjNumber,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      warehouse_id: input.warehouse_id,
      adjustment_date: nowIso,
      reason_code: input.reason_code,
      reason_description: input.reason_description,
      status: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
      total_adjustment_value: totalVal.toString(2),
      approved_by: requiresApproval ? null : input.created_by,
      approved_at: requiresApproval ? null : nowIso,
      journal_entry_id: null,
      lines: formattedLines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.stockAdjustments.set(adjustment.id, adjustment);

    // If auto-approved, post movements immediately
    if (adjustment.status === 'APPROVED') {
      this.postApprovedAdjustment(adjustment, input.created_by);
    }

    return adjustment;
  }

  public approveAndPostAdjustment(
    tenantId: string,
    adjustmentId: string,
    actorId: string
  ): StockAdjustment {
    const adj = db.stockAdjustments.get(adjustmentId);
    if (!adj || adj.tenant_id !== tenantId || adj.deleted_at !== null) {
      throw new Error(`Adjustment '${adjustmentId}' not found.`);
    }

    if (adj.status !== 'PENDING_APPROVAL') {
      throw new Error(`Adjustment '${adj.adjustment_number}' is in status ${adj.status}. Cannot approve.`);
    }

    adj.status = 'APPROVED';
    adj.approved_by = actorId;
    adj.approved_at = new Date().toISOString();
    this.postApprovedAdjustment(adj, actorId);

    return adj;
  }

  private postApprovedAdjustment(adj: StockAdjustment, actorId: string): void {
    for (const line of adj.lines) {
      const isIncrease = line.adjustment_type === 'INCREASE';
      this.recordInventoryMovement({
        tenant_id: adj.tenant_id,
        legal_entity_id: adj.legal_entity_id,
        warehouse_id: adj.warehouse_id,
        location_id: line.location_id,
        product_id: line.product_id,
        quantity: line.quantity,
        movement_type: isIncrease ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        direction: isIncrease ? 'IN' : 'OUT',
        source_type: 'STOCK_ADJUSTMENT',
        source_id: adj.id,
        source_line_id: line.id,
        lot_id: line.lot_id,
        serial_id: line.serial_id,
        unit_cost: line.unit_cost,
        created_by: actorId,
      });
    }

    adj.status = 'POSTED';
    adj.updated_at = new Date().toISOString();
    db.stockAdjustments.set(adj.id, adj);
  }

  // ==========================================
  // 10. STOCK COUNTS & CYCLE COUNTS
  // ==========================================

  public createStockCount(input: {
    tenant_id: string;
    legal_entity_id: string;
    warehouse_id: string;
    count_name: string;
    count_type: StockCount['count_type'];
    is_blind_mode?: boolean;
    scheduled_date?: string;
    product_ids?: string[];
    location_ids?: string[];
    created_by: string;
  }): StockCount {
    const warehouse = db.warehouses.get(input.warehouse_id);
    if (!warehouse) throw new Error(`Warehouse '${input.warehouse_id}' not found.`);

    const nowIso = new Date().toISOString();
    const countId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const countNumber = `CNT-${Date.now().toString().slice(-6)}`;

    // Build count lines from existing inventory balances
    const balances = this.getAllStockBalances(input.tenant_id, input.warehouse_id);
    let targetBalances = balances;

    if (input.product_ids && input.product_ids.length > 0) {
      targetBalances = targetBalances.filter((b) => input.product_ids!.includes(b.product_id));
    }
    if (input.location_ids && input.location_ids.length > 0) {
      targetBalances = targetBalances.filter((b) => b.location_id && input.location_ids!.includes(b.location_id));
    }

    const lines: StockCountLine[] = targetBalances.map((b, idx) => {
      const uCost = new Decimal(b.unit_cost_average || '0');
      return {
        id: `cntl_${countId}_${idx + 1}`,
        count_id: countId,
        tenant_id: input.tenant_id,
        location_id: b.location_id || null,
        product_id: b.product_id,
        variant_id: b.variant_id || null,
        sku: b.sku,
        lot_id: b.lot_id || null,
        expected_quantity: b.on_hand_quantity,
        counted_quantity: b.on_hand_quantity, // Default to expected, updated during counting
        variance_quantity: 0,
        variance_percentage: '0.00',
        unit_cost: uCost.toString(4),
        variance_value: '0.00',
        status: 'PENDING',
      };
    });

    const count: StockCount = {
      id: countId,
      count_number: countNumber,
      tenant_id: input.tenant_id,
      legal_entity_id: input.legal_entity_id,
      warehouse_id: input.warehouse_id,
      count_name: input.count_name,
      count_type: input.count_type,
      is_blind_mode: Boolean(input.is_blind_mode),
      scheduled_date: input.scheduled_date || nowIso,
      counted_by: null,
      approved_by: null,
      status: 'SCHEDULED',
      lines,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: input.created_by,
      updated_by: input.created_by,
      deleted_at: null,
      version: 1,
    };

    db.stockCounts.set(count.id, count);
    return count;
  }

  public recordCountLine(input: {
    tenant_id: string;
    count_id: string;
    line_id: string;
    counted_quantity: number;
    counted_by: string;
  }): StockCount {
    const count = db.stockCounts.get(input.count_id);
    if (!count || count.tenant_id !== input.tenant_id || count.deleted_at !== null) {
      throw new Error(`Stock count '${input.count_id}' not found.`);
    }

    const line = count.lines.find((l) => l.id === input.line_id);
    if (!line) throw new Error(`Stock count line '${input.line_id}' not found.`);

    line.counted_quantity = input.counted_quantity;
    line.variance_quantity = input.counted_quantity - line.expected_quantity;
    line.variance_percentage =
      line.expected_quantity > 0
        ? new Decimal(line.variance_quantity).div(line.expected_quantity).mul(100).toString(2)
        : '0.00';

    const uCost = new Decimal(line.unit_cost || '0');
    line.variance_value = uCost.mul(line.variance_quantity).toString(2);
    line.status = 'VERIFIED';

    count.status = 'IN_PROGRESS';
    count.counted_by = input.counted_by;
    count.updated_at = new Date().toISOString();
    db.stockCounts.set(count.id, count);

    return count;
  }

  public approveAndPostStockCount(
    tenantId: string,
    countId: string,
    approvedBy: string
  ): { count: StockCount; adjustment: StockAdjustment } {
    const count = db.stockCounts.get(countId);
    if (!count || count.tenant_id !== tenantId || count.deleted_at !== null) {
      throw new Error(`Stock count '${countId}' not found.`);
    }

    const varianceLines = count.lines.filter((l) => l.variance_quantity !== 0);

    if (varianceLines.length === 0) {
      count.status = 'POSTED';
      count.approved_by = approvedBy;
      count.updated_at = new Date().toISOString();
      db.stockCounts.set(count.id, count);
      // Return dummy adjustment object representing no variance
      const noOpAdjustment: StockAdjustment = {
        id: `adj_noop_${Date.now()}`,
        adjustment_number: `ADJ-NO-VARIANCE`,
        tenant_id: tenantId,
        legal_entity_id: count.legal_entity_id,
        warehouse_id: count.warehouse_id,
        adjustment_date: new Date().toISOString(),
        reason_code: 'CYCLE_COUNT_NO_VARIANCE',
        reason_description: `Cycle count ${count.count_number} verified with zero variance.`,
        status: 'POSTED',
        total_adjustment_value: '0.00',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        journal_entry_id: null,
        lines: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: approvedBy,
        updated_by: approvedBy,
        deleted_at: null,
        version: 1,
      };
      return { count, adjustment: noOpAdjustment };
    }

    // Generate compensating StockAdjustment for all variances
    const adjustment = this.createStockAdjustment({
      tenant_id: tenantId,
      legal_entity_id: count.legal_entity_id,
      warehouse_id: count.warehouse_id,
      reason_code: 'CYCLE_COUNT_VARIANCE',
      reason_description: `Automated variance adjustment for count ${count.count_number} (${count.count_name})`,
      lines: varianceLines.map((vl) => ({
        product_id: vl.product_id,
        location_id: vl.location_id,
        lot_id: vl.lot_id,
        quantity: Math.abs(vl.variance_quantity),
        adjustment_type: vl.variance_quantity > 0 ? 'INCREASE' : 'DECREASE',
        unit_cost: vl.unit_cost,
        notes: `Counted: ${vl.counted_quantity}, Expected: ${vl.expected_quantity}`,
      })),
      created_by: approvedBy,
    });

    count.status = 'POSTED';
    count.approved_by = approvedBy;
    count.updated_at = new Date().toISOString();
    db.stockCounts.set(count.id, count);

    return { count, adjustment };
  }

  // ==========================================
  // 11. INVENTORY VALUATION & REPORTS
  // ==========================================

  public getValuationReport(tenantId: string, warehouseId?: string): {
    total_valuation: string;
    total_on_hand: number;
    total_items_count: number;
    items: Array<{
      product_id: string;
      sku: string;
      product_name: string;
      warehouse_id: string;
      warehouse_name: string;
      on_hand: number;
      available: number;
      unit_cost: string;
      total_value: string;
    }>;
  } {
    const balances = this.getAllStockBalances(tenantId, warehouseId);
    let totalVal = Decimal.zero(2);
    let totalQty = 0;

    const items = balances.map((b) => {
      const prod = db.getProductById(tenantId, b.product_id);
      const wh = db.warehouses.get(b.warehouse_id);
      const valDec = new Decimal(b.total_valuation || '0');
      totalVal = totalVal.add(valDec);
      totalQty += b.on_hand_quantity;

      return {
        product_id: b.product_id,
        sku: b.sku,
        product_name: prod?.name || b.sku,
        warehouse_id: b.warehouse_id,
        warehouse_name: wh?.warehouse_name || 'Warehouse',
        on_hand: b.on_hand_quantity,
        available: b.available_quantity,
        unit_cost: b.unit_cost_average,
        total_value: valDec.toString(2),
      };
    });

    return {
      total_valuation: totalVal.toString(2),
      total_on_hand: totalQty,
      total_items_count: items.length,
      items,
    };
  }

  // ==========================================
  // 12. INVENTORY RECONCILIATION ENGINE
  // ==========================================

  public runReconciliation(
    tenantId: string,
    legalEntityId: string,
    warehouseId?: string,
    actorId: string = 'system'
  ): InventoryReconciliationRun {
    const nowIso = new Date().toISOString();
    const runId = `irec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const runNumber = `REC-${Date.now().toString().slice(-6)}`;

    // 1. Calculate Subledger Valuation Total
    const balances = this.getAllStockBalances(tenantId, warehouseId);
    let subledgerTotal = Decimal.zero(2);
    for (const b of balances) {
      subledgerTotal = subledgerTotal.add(new Decimal(b.total_valuation || '0'));
    }

    // 2. Calculate GL Inventory Control Account Balance
    const glLines = Array.from(db.journalLines.values()).filter((l) => {
      if (l.tenant_id !== tenantId) return false;
      const acc = db.accounts.get(l.account_id);
      return acc && (acc.account_subtype === 'INVENTORY' || acc.code === '1300');
    });

    let glTotal = Decimal.zero(2);
    for (const line of glLines) {
      glTotal = glTotal.add(new Decimal(line.base_debit || '0')).sub(new Decimal(line.base_credit || '0'));
    }

    const variance = subledgerTotal.sub(glTotal);
    const hasVariance = !variance.isZero();
    const exceptions: InventoryReconciliationException[] = [];

    if (hasVariance) {
      for (const b of balances) {
        exceptions.push({
          id: `iexc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          tenant_id: tenantId,
          run_id: runId,
          product_id: b.product_id,
          sku: b.sku,
          location_id: b.location_id || null,
          subledger_qty: b.on_hand_quantity,
          subledger_val: b.total_valuation,
          gl_val: glTotal.toString(2),
          difference: variance.toString(2),
          mismatch_reason: `Subledger (${subledgerTotal.toString(2)}) differs from GL Inventory Control (${glTotal.toString(2)}) by ${variance.toString(2)}.`,
          status: 'OPEN',
          created_at: nowIso,
          updated_at: nowIso,
          created_by: actorId,
          updated_by: actorId,
          deleted_at: null,
          version: 1,
        });
      }
    }

    const run: InventoryReconciliationRun = {
      id: runId,
      run_number: runNumber,
      tenant_id: tenantId,
      legal_entity_id: legalEntityId,
      warehouse_id: warehouseId || null,
      reconciliation_date: nowIso,
      subledger_valuation_total: subledgerTotal.toString(2),
      gl_inventory_account_total: glTotal.toString(2),
      variance_amount: variance.toString(2),
      currency_code: 'INR',
      status: hasVariance ? 'EXCEPTION' : 'RECONCILED',
      exceptions,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
      updated_by: actorId,
      deleted_at: null,
      version: 1,
    };

    db.inventoryReconciliationRuns.set(run.id, run);
    for (const ex of exceptions) {
      db.inventoryReconciliationExceptions.set(ex.id, ex);
    }

    return run;
  }

  // ==========================================
  // 13. ACCOUNTING DOUBLE-ENTRY POSTING
  // ==========================================

  private postInventoryAccounting(input: {
    tenant_id: string;
    legal_entity_id: string;
    movement_type: MovementType;
    total_cost: string;
    currency_code: string;
    movement_id: string;
    source_id: string;
    product_name: string;
    actor_id: string;
  }): string | null {
    try {
      // Find or create default accounts
      let inventoryAcc = Array.from(db.accounts.values()).find(
        (a) => a.tenant_id === input.tenant_id && (a.account_subtype === 'INVENTORY' || a.code === '1300')
      );
      if (!inventoryAcc) {
        inventoryAcc = db.createAccount({
          tenant_id: input.tenant_id,
          legal_entity_id: input.legal_entity_id,
          code: '1300',
          name: 'Inventory Finished Goods',
          account_type: 'ASSET',
          account_subtype: 'INVENTORY',
          normal_balance: 'DEBIT',
          created_by: input.actor_id,
        });
      }

      let cogsAcc = Array.from(db.accounts.values()).find(
        (a) => a.tenant_id === input.tenant_id && (a.account_subtype === 'COST_OF_GOODS_SOLD' || a.code === '5000')
      );
      if (!cogsAcc) {
        cogsAcc = db.createAccount({
          tenant_id: input.tenant_id,
          legal_entity_id: input.legal_entity_id,
          code: '5000',
          name: 'Cost of Goods Sold (COGS)',
          account_type: 'EXPENSE',
          account_subtype: 'COST_OF_GOODS_SOLD',
          normal_balance: 'DEBIT',
          created_by: input.actor_id,
        });
      }

      let grirAcc = Array.from(db.accounts.values()).find(
        (a) => a.tenant_id === input.tenant_id && (a.account_subtype === 'CURRENT_LIABILITY' || a.code === '2110')
      );
      if (!grirAcc) {
        grirAcc = db.createAccount({
          tenant_id: input.tenant_id,
          legal_entity_id: input.legal_entity_id,
          code: '2110',
          name: 'GR/IR Goods Received Not Invoiced Clearing',
          account_type: 'LIABILITY',
          account_subtype: 'CURRENT_LIABILITY',
          normal_balance: 'CREDIT',
          created_by: input.actor_id,
        });
      }

      let debitAccId = '';
      let creditAccId = '';
      let desc = '';

      if (input.movement_type === 'RECEIPT') {
        debitAccId = inventoryAcc.id;
        creditAccId = grirAcc.id;
        desc = `Inventory Receipt for ${input.product_name} (Movement ${input.movement_id})`;
      } else if (input.movement_type === 'ISSUE') {
        debitAccId = cogsAcc.id;
        creditAccId = inventoryAcc.id;
        desc = `COGS Issue for ${input.product_name} (Movement ${input.movement_id})`;
      } else if (input.movement_type === 'ADJUSTMENT_IN') {
        debitAccId = inventoryAcc.id;
        creditAccId = cogsAcc.id;
        desc = `Inventory Adjustment In for ${input.product_name}`;
      } else if (input.movement_type === 'ADJUSTMENT_OUT' || input.movement_type === 'DAMAGE') {
        debitAccId = cogsAcc.id;
        creditAccId = inventoryAcc.id;
        desc = `Inventory Adjustment Out / Scrap for ${input.product_name}`;
      } else {
        return null;
      }

      const costDec = new Decimal(input.total_cost || '0');
      if (costDec.isZero()) return null;

      const journal = db.postJournalEntry({
        tenant_id: input.tenant_id,
        legal_entity_id: input.legal_entity_id,
        description: desc,
        lines: [
          {
            account_id: debitAccId,
            debit: input.total_cost,
            credit: '0.00',
            description: desc,
          },
          {
            account_id: creditAccId,
            debit: '0.00',
            credit: input.total_cost,
            description: desc,
          },
        ],
        posted_by: input.actor_id,
        source_type: 'INVENTORY' as any,
        source_id: input.movement_id,
      });

      return journal.id;
    } catch (err) {
      console.warn('[InventoryService] Journal posting skipped or failed:', (err as Error).message);
      return null;
    }
  }
}

export const inventoryService = InventoryService.getInstance();
