import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, integer, jsonb, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'verified', 'rejected']);
export const propertyStatusEnum = pgEnum('property_status', ['draft', 'active', 'fully_funded', 'closed']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'investment', 'dividend', 'refund']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'reversed']);
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'success', 'warning', 'error', 'investment', 'dividend', 'transaction']);
export const cardTypeEnum = pgEnum('card_type', ['debit', 'credit']);

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    
    // e-Mongolia Integration
    eMongoliaId: varchar('e_mongolia_id', { length: 100 }).unique(),
    
    // KYC Status
    kycStatus: kycStatusEnum('kyc_status').default('pending'),
    kycVerifiedAt: timestamp('kyc_verified_at', { withTimezone: true }),
    kycData: jsonb('kyc_data'),
    
    // Wallet Balance (stored as numeric to avoid floating point errors)
    walletBalance: numeric('wallet_balance', { precision: 20, scale: 2 }).default('0.00').notNull(),
    
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
}, (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    eMongoliaIdIdx: index('idx_users_e_mongolia_id').on(table.eMongoliaId),
    kycStatusIdx: index('idx_users_kyc_status').on(table.kycStatus),
}));

// Properties table
export const properties = pgTable('properties', {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Property Details
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    address: text('address').notNull(),
    propertyType: varchar('property_type', { length: 50 }).notNull(),
    
    // Location
    district: varchar('district', { length: 100 }),
    latitude: numeric('latitude', { precision: 10, scale: 8 }),
    longitude: numeric('longitude', { precision: 11, scale: 8 }),
    
    // Financials (all in MNT)
    totalValuation: numeric('total_valuation', { precision: 20, scale: 2 }).notNull(),
    pricePerShare: numeric('price_per_share', { precision: 20, scale: 2 }).notNull(),
    totalShares: integer('total_shares').notNull(),
    availableShares: integer('available_shares').notNull(),
    
    // Rental Information
    expectedAnnualYield: numeric('expected_annual_yield', { precision: 5, scale: 2 }),
    monthlyRent: numeric('monthly_rent', { precision: 20, scale: 2 }).default('0.00'),
    
    // Property Images and Documents
    images: jsonb('images').default([]),
    documents: jsonb('documents').default([]),
    
    // Status
    status: propertyStatusEnum('status').default('draft'),
    
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    fundedAt: timestamp('funded_at', { withTimezone: true }),
}, (table) => ({
    statusIdx: index('idx_properties_status').on(table.status),
    typeIdx: index('idx_properties_type').on(table.propertyType),
    districtIdx: index('idx_properties_district').on(table.district),
}));

// Investments table
export const investments = pgTable('investments', {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // References
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
    
    // Investment Details
    sharesOwned: integer('shares_owned').notNull(),
    purchasePricePerShare: numeric('purchase_price_per_share', { precision: 20, scale: 2 }).notNull(),
    totalInvested: numeric('total_invested', { precision: 20, scale: 2 }).notNull(),
    
    // Performance Tracking
    totalDividendsReceived: numeric('total_dividends_received', { precision: 20, scale: 2 }).default('0.00'),
    
    // Metadata
    investedAt: timestamp('invested_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('idx_investments_user_id').on(table.userId),
    propertyIdIdx: index('idx_investments_property_id').on(table.propertyId),
    userPropertyIdx: index('idx_investments_user_property').on(table.userId, table.propertyId),
    uniqueUserProperty: unique('unique_user_property').on(table.userId, table.propertyId),
}));

// Transactions table
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // References
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
    
    // Transaction Details
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 2 }).notNull(),
    
    // Balance Snapshot
    balanceBefore: numeric('balance_before', { precision: 20, scale: 2 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 20, scale: 2 }).notNull(),
    
    // Additional Context
    description: text('description'),
    metadata: jsonb('metadata').default({}),
    
    // Status
    status: transactionStatusEnum('status').default('completed'),
    
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    
    // Reference to related transaction
    relatedTransactionId: uuid('related_transaction_id').references(() => transactions.id),
}, (table) => ({
    userIdIdx: index('idx_transactions_user_id').on(table.userId),
    propertyIdIdx: index('idx_transactions_property_id').on(table.propertyId),
    typeIdx: index('idx_transactions_type').on(table.transactionType),
    createdAtIdx: index('idx_transactions_created_at').on(table.createdAt),
    userCreatedIdx: index('idx_transactions_user_created').on(table.userId, table.createdAt),
}));

// Notifications table
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // References
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Notification Details
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message'),
    type: notificationTypeEnum('type').default('info'),
    
    // Status
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    
    // Additional data
    metadata: jsonb('metadata').default({}),
}, (table) => ({
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
    userReadIdx: index('idx_notifications_user_read').on(table.userId, table.isRead),
    createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
    userCreatedIdx: index('idx_notifications_user_created').on(table.userId, table.createdAt),
}));

// Saved Cards table
export const savedCards = pgTable('saved_cards', {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // References
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Card Details
    cardType: cardTypeEnum('card_type').default('debit'),
    bankName: varchar('bank_name', { length: 100 }).notNull(),
    lastFourDigits: varchar('last_four_digits', { length: 4 }).notNull(),
    cardHolderName: varchar('card_holder_name', { length: 255 }),
    
    // Card Metadata
    isDefault: boolean('is_default').default(false).notNull(),
    expiryMonth: integer('expiry_month'),
    expiryYear: integer('expiry_year'),
    
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
    userIdIdx: index('idx_saved_cards_user_id').on(table.userId),
    userActiveIdx: index('idx_saved_cards_user_active').on(table.userId, table.isActive),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    investments: many(investments),
    transactions: many(transactions),
    notifications: many(notifications),
    savedCards: many(savedCards),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
    investments: many(investments),
    transactions: many(transactions),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
    user: one(users, {
        fields: [investments.userId],
        references: [users.id],
    }),
    property: one(properties, {
        fields: [investments.propertyId],
        references: [properties.id],
    }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    property: one(properties, {
        fields: [transactions.propertyId],
        references: [properties.id],
    }),
    relatedTransaction: one(transactions, {
        fields: [transactions.relatedTransactionId],
        references: [transactions.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const savedCardsRelations = relations(savedCards, ({ one }) => ({
    user: one(users, {
        fields: [savedCards.userId],
        references: [users.id],
    }),
}));
