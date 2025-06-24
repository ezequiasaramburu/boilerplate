import { prisma } from '@my/database';
import type {
  CreateInvoiceRequest,
  GenerateInvoicePdfRequest,
  GenerateInvoicePdfResponse,
  Invoice,
  InvoiceListRequest,
  InvoiceListResponse,
  InvoiceStatus,
  InvoiceSummary,
  InvoiceType,
  InvoiceWithDetails,
  UpdateInvoiceRequest,
} from '@my/types';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';
import { notificationService } from './notification.service.js';

class InvoiceService {
  // Create a new invoice
  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceWithDetails> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { id: true, email: true, name: true, stripeCustomerId: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate line item totals
      const lineItems = request.lineItems.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));

      // Calculate invoice totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalAmount = subtotal;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice (using any to bypass TS issues until client regenerates)
      const invoice = await (prisma as any).invoice.create({
        data: {
          invoiceNumber,
          userId: request.userId,
          subscriptionId: request.subscriptionId,
          stripeCustomerId: user.stripeCustomerId,
          status: 'DRAFT',
          type: request.type,
          subtotal,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount,
          currency: 'usd',
          billingPeriodStart: request.billingPeriodStart,
          billingPeriodEnd: request.billingPeriodEnd,
          issueDate: new Date(),
          dueDate: request.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          customerName: user.name,
          customerEmail: user.email,
          description: request.description,
          customerNotes: request.customerNotes,
          metadata: request.metadata,
          lineItems: {
            create: lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              usageRecordId: item.usageRecordId,
              metricType: item.metricType,
              productName: item.productName,
              periodStart: item.periodStart,
              periodEnd: item.periodEnd,
              metadata: item.metadata,
            })),
          },
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          subscription: {
            include: { plan: true },
          },
          lineItems: true,
          payments: true,
        },
      });

      return invoice as InvoiceWithDetails;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  // Create invoice from subscription usage
  async createInvoiceFromUsage(
    subscriptionId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
  ): Promise<InvoiceWithDetails> {
    try {
      // Get subscription details
      const subscription = await (prisma as any).subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          user: { select: { id: true, email: true, name: true, stripeCustomerId: true } },
          plan: true,
        },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get usage records for the billing period
      const usageRecords = await (prisma as any).usageRecord.findMany({
        where: {
          subscriptionId,
          billingPeriodStart: { gte: billingPeriodStart },
          billingPeriodEnd: { lte: billingPeriodEnd },
          invoiced: false,
        },
      });

      if (usageRecords.length === 0) {
        throw new Error('No usage records found for the billing period');
      }

      // Create line items from usage records
      const lineItems = usageRecords.map((record: any) => ({
        description: `${record.metricType} usage - ${record.description || 'Usage charges'}`,
        quantity: record.quantity,
        unitPrice: record.unitPrice || 0.01, // Default unit price
        usageRecordId: record.id,
        metricType: record.metricType,
        productName: `${record.metricType} Usage`,
        periodStart: record.billingPeriodStart,
        periodEnd: record.billingPeriodEnd,
        metadata: record.metadata,
      }));

      // Create invoice request
      const invoiceRequest: CreateInvoiceRequest = {
        userId: subscription.userId,
        subscriptionId,
        type: 'USAGE' as InvoiceType,
        description: `Usage charges for ${billingPeriodStart.toDateString()} - ${
          billingPeriodEnd.toDateString()
        }`,
        billingPeriodStart,
        billingPeriodEnd,
        lineItems,
      };

      const invoice = await this.createInvoice(invoiceRequest);

      // Mark usage records as invoiced
      await (prisma as any).usageRecord.updateMany({
        where: {
          id: { in: usageRecords.map((r: any) => r.id) },
        },
        data: { invoiced: true },
      });

      return invoice;
    } catch (error) {
      console.error('Error creating invoice from usage:', error);
      throw new Error('Failed to create invoice from usage');
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: string, userId?: string): Promise<InvoiceWithDetails | null> {
    try {
      const whereClause: any = { id: invoiceId };
      if (userId) {
        whereClause.userId = userId;
      }

      const invoice = await (prisma as any).invoice.findUnique({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          subscription: {
            include: { plan: true },
          },
          lineItems: true,
          payments: true,
        },
      });

      return invoice as InvoiceWithDetails | null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw new Error('Failed to get invoice');
    }
  }

  // Get invoice by number and email (public access)
  async getInvoiceByNumber(
    invoiceNumber: string,
    email: string,
  ): Promise<InvoiceWithDetails | null> {
    try {
      const invoice = await (prisma as any).invoice.findFirst({
        where: {
          invoiceNumber,
          customerEmail: email,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          subscription: {
            include: { plan: true },
          },
          lineItems: true,
          payments: true,
        },
      });

      return invoice as InvoiceWithDetails | null;
    } catch (error) {
      console.error('Error getting invoice by number:', error);
      throw new Error('Failed to get invoice');
    }
  }

  // List invoices with filtering and pagination
  async listInvoices(request: InvoiceListRequest): Promise<InvoiceListResponse> {
    try {
      const {
        userId,
        subscriptionId,
        status,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        sortBy = 'issueDate',
        sortOrder = 'desc',
      } = request;

      const whereClause = this.buildInvoiceWhereClause({
        userId,
        subscriptionId,
        status,
        type,
        startDate,
        endDate,
      });

      // Get total count
      const total = await (prisma as any).invoice.count({ where: whereClause });

      // Get invoices
      const invoices = await (prisma as any).invoice.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          subscription: {
            include: { plan: true },
          },
          lineItems: true,
          payments: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const summary = await this.calculateInvoiceSummary(whereClause);

      return {
        invoices: invoices as Invoice[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        summary,
      };
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw new Error('Failed to list invoices');
    }
  }

  private buildInvoiceWhereClause(filters: {
    userId?: string;
    subscriptionId?: string;
    status?: string[];
    type?: string[];
    startDate?: Date;
    endDate?: Date;
  }): any {
    const whereClause: any = {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.subscriptionId && { subscriptionId: filters.subscriptionId }),
      ...(filters.status?.length && { status: { in: filters.status } }),
      ...(filters.type?.length && { type: { in: filters.type } }),
    };

    const dateFilter = this.buildDateFilter(filters.startDate, filters.endDate);
    if (dateFilter) whereClause.issueDate = dateFilter;

    return whereClause;
  }

  private buildDateFilter(startDate?: Date, endDate?: Date): any {
    if (!startDate && !endDate) return null;
    return {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  private async calculateInvoiceSummary(whereClause: any) {
    const allInvoices = await (prisma as any).invoice.findMany({
      where: whereClause,
      select: { totalAmount: true, status: true },
    });

    const totalAmount = allInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    const paidAmount = allInvoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    const outstandingAmount = allInvoices
      .filter((inv: any) => ['PENDING', 'PARTIALLY_PAID'].includes(inv.status))
      .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    const overdueAmount = allInvoices
      .filter((inv: any) => inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

    const countByStatus = allInvoices.reduce((acc: any, inv: any) => {
      acc[inv.status.toLowerCase()] = (acc[inv.status.toLowerCase()] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      count: {
        total: allInvoices.length,
        paid: countByStatus.paid || 0,
        pending: countByStatus.pending || 0,
        overdue: countByStatus.overdue || 0,
      },
    };
  }

  // Update invoice
  async updateInvoice(
    invoiceId: string,
    updates: UpdateInvoiceRequest,
  ): Promise<InvoiceWithDetails> {
    try {
      const invoice = await (prisma as any).invoice.update({
        where: { id: invoiceId },
        data: updates,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          subscription: {
            include: { plan: true },
          },
          lineItems: true,
          payments: true,
        },
      });

      // Send notification if status changed
      if (updates.status) {
        await notificationService.sendEmail({
          to: invoice.user.email,
          subject: 'Invoice Status Updated',
          template: 'invoice-status-changed',
          data: {
            userName: invoice.user.name || 'there',
            invoiceNumber: invoice.invoiceNumber,
            status: updates.status,
            invoiceUrl: `${process.env.FRONTEND_URL}/invoices/${invoiceId}`,
          },
        });
      }

      return invoice as InvoiceWithDetails;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }

  // Generate PDF for invoice
  async generatePdf(request: GenerateInvoicePdfRequest): Promise<GenerateInvoicePdfResponse> {
    try {
      const invoice = await this.getInvoiceById(request.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      const filepath = path.join(process.cwd(), 'temp', filename);

      await this.createPdfDocument(invoice, filepath);
      await this.updateInvoiceWithPdfInfo(request.invoiceId, filename);

      return {
        pdfUrl: `/temp/${filename}`,
        downloadUrl: `/temp/${filename}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private async createPdfDocument(invoice: InvoiceWithDetails, filepath: string): Promise<void> {
    const doc = new PDFDocument({ margin: 50 });
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    const stream = await fs.open(filepath, 'w');
    doc.pipe(stream.createWriteStream());

    this.addPdfHeader(doc, invoice);
    this.addPdfCustomerDetails(doc, invoice);
    const subtotal = this.addPdfLineItems(doc, invoice);
    this.addPdfTotals(doc, invoice, subtotal);
    this.addPdfNotes(doc, invoice);

    doc.end();
    await new Promise(resolve => doc.on('end', resolve));
    await stream.close();
  }

  private addPdfHeader(doc: any, invoice: InvoiceWithDetails): void {
    doc.fontSize(20).text('Your Company Name', 50, 50);
    doc.fontSize(10).text('123 Business Street', 50, 80);
    doc.text('City, State 12345', 50, 95);
    doc.text('contact@company.com', 50, 110);

    doc.fontSize(16).text(`Invoice ${invoice.invoiceNumber}`, 400, 50);
    doc.fontSize(10).text(`Issue Date: ${invoice.issueDate.toDateString()}`, 400, 80);
    if (invoice.dueDate) {
      doc.text(`Due Date: ${invoice.dueDate.toDateString()}`, 400, 95);
    }
    doc.text(`Status: ${invoice.status}`, 400, 110);
  }

  private addPdfCustomerDetails(doc: any, invoice: InvoiceWithDetails): void {
    doc.fontSize(12).text('Bill To:', 50, 150);
    doc.fontSize(10).text(invoice.customerName || 'Customer', 50, 170);
    doc.text(invoice.customerEmail, 50, 185);
  }

  private addPdfLineItems(doc: any, invoice: InvoiceWithDetails): number {
    let y = 230;
    doc.fontSize(10).text('Description', 50, y);
    doc.text('Qty', 300, y);
    doc.text('Unit Price', 350, y);
    doc.text('Total', 450, y);
    doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
    y += 25;

    let subtotal = 0;
    for (const item of invoice.lineItems) {
      doc.text(item.description, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 350, y);
      doc.text(`$${item.totalPrice.toFixed(2)}`, 450, y);
      subtotal += item.totalPrice;
      y += 20;
    }
    return subtotal;
  }

  private addPdfTotals(doc: any, invoice: InvoiceWithDetails, subtotal: number): void {
    const y = 230 + 25 + (invoice.lineItems.length * 20) + 20;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 400, y);
    doc.text(`Tax: $${invoice.taxAmount.toFixed(2)}`, 400, y + 15);
    doc.text(`Discount: -$${invoice.discountAmount.toFixed(2)}`, 400, y + 30);
    doc.fontSize(12).text(`Total: $${invoice.totalAmount.toFixed(2)}`, 400, y + 45);
  }

  private addPdfNotes(doc: any, invoice: InvoiceWithDetails): void {
    if (invoice.customerNotes) {
      const y = 230 + 25 + (invoice.lineItems.length * 20) + 100;
      doc.fontSize(10).text('Notes:', 50, y);
      doc.text(invoice.customerNotes, 50, y + 15);
    }
  }

  private async updateInvoiceWithPdfInfo(invoiceId: string, filename: string): Promise<void> {
    await (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        pdfUrl: `/temp/${filename}`,
        pdfGeneratedAt: new Date(),
      },
    });
  }

  // Get invoice summary statistics
  async getInvoiceSummary(userId?: string): Promise<InvoiceSummary> {
    try {
      const whereClause: any = {};
      if (userId) whereClause.userId = userId;

      const invoices = await (prisma as any).invoice.findMany({
        where: whereClause,
        select: { totalAmount: true, status: true, type: true },
      });

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
      const paidAmount = invoices
        .filter((inv: any) => inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
      const outstandingAmount = invoices
        .filter((inv: any) => ['PENDING', 'PARTIALLY_PAID'].includes(inv.status))
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
      const overdueAmount = invoices
        .filter((inv: any) => inv.status === 'OVERDUE')
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

      const monthlyRecurring = invoices
        .filter((inv: any) => inv.type === 'SUBSCRIPTION')
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
      const usageBased = invoices
        .filter((inv: any) => inv.type === 'USAGE')
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        outstandingAmount,
        overdueAmount,
        averageAmount: totalInvoices > 0 ? totalAmount / totalInvoices : 0,
        monthlyRecurring,
        usageBased,
      };
    } catch (error) {
      console.error('Error getting invoice summary:', error);
      throw new Error('Failed to get invoice summary');
    }
  }

  // Mark overdue invoices
  async markOverdueInvoices(): Promise<number> {
    try {
      const overdueDate = new Date();
      const result = await (prisma as any).invoice.updateMany({
        where: {
          dueDate: { lt: overdueDate },
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
        data: { status: 'OVERDUE' },
      });

      return result.count;
    } catch (error) {
      console.error('Error marking overdue invoices:', error);
      throw new Error('Failed to mark overdue invoices');
    }
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
