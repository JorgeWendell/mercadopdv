import { boolean, decimal, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role").default("NENHUM"),
  emailVerified: boolean("email_verified").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),  
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const suppliersTable = pgTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const customersTable = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cpf: text("cpf"),
  cnpj: text("cnpj"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  barcode: text("barcode").unique(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categoriesTable.id, { onDelete: "restrict" }),
  supplierId: text("supplier_id").references(() => suppliersTable.id, {
    onDelete: "set null",
  }),
  unit: text("unit").notNull(),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }),
  stock: decimal("stock", { precision: 10, scale: 3 }).notNull().default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 3 }).default("0"),
  maxStock: decimal("max_stock", { precision: 10, scale: 3 }),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const paymentMethodsTable = pgTable("payment_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const purchasesTable = pgTable("purchases", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number"),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => suppliersTable.id, { onDelete: "restrict" }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
});

export const purchaseItemsTable = pgTable("purchase_items", {
  id: text("id").primaryKey(),
  purchaseId: text("purchase_id")
    .notNull()
    .references(() => purchasesTable.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "restrict" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  batch: text("batch"),
  manufacturingDate: timestamp("manufacturing_date"),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const salesTable = pgTable("sales", {
  id: text("id").primaryKey(),
  saleNumber: text("sale_number").unique(),
  customerId: text("customer_id").references(() => customersTable.id, {
    onDelete: "set null",
  }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
    .default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
});

export const saleItemsTable = pgTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .references(() => salesTable.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "restrict" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const salePaymentsTable = pgTable("sale_payments", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .references(() => salesTable.id, { onDelete: "cascade" }),
  paymentMethodId: text("payment_method_id")
    .notNull()
    .references(() => paymentMethodsTable.id, { onDelete: "restrict" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const stockMovementsTable = pgTable("stock_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 10, scale: 3 }).notNull(),
  newStock: decimal("new_stock", { precision: 10, scale: 3 }).notNull(),
  referenceId: text("reference_id"),
  referenceType: text("reference_type"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
});

export const cashSessionsTable = pgTable("cash_sessions", {
  id: text("id").primaryKey(),
  openedAt: timestamp("opened_at").notNull(),
  closedAt: timestamp("closed_at"),
  openingAmount: decimal("opening_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  closingAmount: decimal("closing_amount", { precision: 12, scale: 2 }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const cashMovementsTable = pgTable("cash_movements", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => cashSessionsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
});

export const saleReturnsTable = pgTable("sale_returns", {
  id: text("id").primaryKey(),
  saleId: text("sale_id").notNull().references(() => salesTable.id, { onDelete: "restrict" }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  createdBy: text("created_by").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
});

export const saleReturnItemsTable = pgTable("sale_return_items", {
  id: text("id").primaryKey(),
  returnId: text("return_id").notNull().references(() => saleReturnsTable.id, { onDelete: "cascade" }),
  saleItemId: text("sale_item_id").references(() => saleItemsTable.id, { onDelete: "set null" }),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "restrict" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const inventorySessionsTable = pgTable("inventory_sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  startedAt: timestamp("started_at").notNull(),
  closedAt: timestamp("closed_at"),
  createdBy: text("created_by").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const inventoryCountsTable = pgTable("inventory_counts", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => inventorySessionsTable.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "restrict" }),
  countedQty: decimal("counted_qty", { precision: 10, scale: 3 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 10, scale: 3 }).notNull(),
  difference: decimal("difference", { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const inventoryAdjustmentsTable = pgTable("inventory_adjustments", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => inventorySessionsTable.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "restrict" }),
  adjustmentQty: decimal("adjustment_qty", { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  createdBy: text("created_by").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
});

export const promotionsTable = pgTable("promotions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const promotionRulesTable = pgTable("promotion_rules", {
  id: text("id").primaryKey(),
  promotionId: text("promotion_id").notNull().references(() => promotionsTable.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => productsTable.id, { onDelete: "set null" }),
  categoryId: text("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  minQty: decimal("min_qty", { precision: 10, scale: 3 }),
  percentOff: decimal("percent_off", { precision: 5, scale: 2 }),
  valueOff: decimal("value_off", { precision: 10, scale: 2 }),
  comboSku: text("combo_sku"),
  comboQty: decimal("combo_qty", { precision: 10, scale: 3 }),
  timeStart: text("time_start"),
  timeEnd: text("time_end"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});