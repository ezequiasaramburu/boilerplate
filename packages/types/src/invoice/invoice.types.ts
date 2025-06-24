import { z } from 'zod';
import { UsageMetricType } from '../billing/billing.types.js';

// Invoice-related enums
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED'
}

export enum InvoiceType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  USAGE = 'USAGE',
  ONE_TIME = 'ONE_TIME',
  CREDIT = 'CREDIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED'
}

// Base entity interface for common fields
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice-related interfaces
export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  userId: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  status: InvoiceStatus;
  type: InvoiceType;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  issueDate: Date;
  dueDate?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  customerName?: string;
  customerEmail: string;
  customerAddress?: Record<string, any>;
  companyName?: string;
  companyAddress?: Record<string, any>;
  companyTaxId?: string;
  description?: string;
  notes?: string;
  customerNotes?: string;
  metadata?: Record<string, any>;
  pdfUrl?: string;
  pdfGeneratedAt?: Date;
  lineItems?: InvoiceLineItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceLineItem extends BaseEntity {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  usageRecordId?: string;
  metricType?: UsageMetricType;
  productName?: string;
  productId?: string;
  priceId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, any>;
}

export interface InvoicePayment extends BaseEntity {
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  failureReason?: string;
  failureCode?: string;
  metadata?: Record<string, any>;
}

// Invoice API types
export interface CreateInvoiceRequest {
  userId: string;
  subscriptionId?: string;
  type: InvoiceType;
  description?: string;
  customerNotes?: string;
  dueDate?: Date;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  lineItems: CreateInvoiceLineItemRequest[];
  metadata?: Record<string, any>;
}

export interface CreateInvoiceLineItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  usageRecordId?: string;
  metricType?: UsageMetricType;
  productName?: string;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  description?: string;
  customerNotes?: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
}

export interface InvoiceListRequest {
  userId?: string;
  subscriptionId?: string;
  status?: InvoiceStatus[];
  type?: InvoiceType[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'issueDate' | 'dueDate' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
    count: {
      total: number;
      paid: number;
      pending: number;
      overdue: number;
    };
  };
}

export interface GenerateInvoicePdfRequest {
  invoiceId: string;
  template?: 'standard' | 'detailed' | 'minimal';
  includeUsageDetails?: boolean;
}

export interface GenerateInvoicePdfResponse {
  pdfUrl: string;
  downloadUrl: string;
  expiresAt: Date;
}

// Invoice summary types
export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  averageAmount: number;
  monthlyRecurring: number;
  usageBased: number;
}

// Utility types for invoice operations
export type CreateInvoiceInput = Omit<Invoice, keyof BaseEntity | 'invoiceNumber' | 'lineItems' | 'payments'>;
export type UpdateInvoiceInput = Partial<Pick<Invoice, 'status' | 'description' | 'customerNotes' | 'dueDate' | 'metadata'>>;
export type InvoiceWithDetails = Invoice & {
  user: Pick<any, 'id' | 'email' | 'name'>;
  subscription?: Pick<any, 'id' | 'plan'>;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
};

// Invoice validation schemas
export const createInvoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  usageRecordId: z.string().optional(),
  metricType: z.nativeEnum(UsageMetricType).optional(),
  productName: z.string().optional(),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const createInvoiceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  subscriptionId: z.string().optional(),
  type: z.nativeEnum(InvoiceType),
  description: z.string().optional(),
  customerNotes: z.string().optional(),
  dueDate: z.date().optional(),
  billingPeriodStart: z.date().optional(),
  billingPeriodEnd: z.date().optional(),
  lineItems: z.array(createInvoiceLineItemSchema).min(1, 'At least one line item is required'),
  metadata: z.record(z.any()).optional(),
});

export const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  description: z.string().optional(),
  customerNotes: z.string().optional(),
  dueDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const invoiceListRequestSchema = z.object({
  userId: z.string().optional(),
  subscriptionId: z.string().optional(),
  status: z.array(z.nativeEnum(InvoiceStatus)).optional(),
  type: z.array(z.nativeEnum(InvoiceType)).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['issueDate', 'dueDate', 'totalAmount', 'status']).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const generateInvoicePdfSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  template: z.enum(['standard', 'detailed', 'minimal']).default('standard'),
  includeUsageDetails: z.boolean().default(true),
});
