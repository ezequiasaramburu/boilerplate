import type { NextFunction, Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import type {
  ApiResponse,
  AuthUser,
  CreateInvoiceRequest,
  InvoiceListRequest,
} from '@my/types';

import fs from 'fs/promises';
import path from 'path';

export class InvoiceController {
  // Create a new invoice
  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const requestData: CreateInvoiceRequest = {
        ...req.body,
        userId, // Ensure user ID matches authenticated user
      };

      const invoice = await invoiceService.createInvoice(requestData);

      const response: ApiResponse = {
        success: true,
        message: 'Invoice created successfully',
        data: { invoice },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Create invoice from subscription usage
  async createInvoiceFromUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const { billingPeriodStart, billingPeriodEnd } = req.body;

      if (!billingPeriodStart || !billingPeriodEnd) {
        const response: ApiResponse = {
          success: false,
          message: 'Billing period start and end dates are required',
        };
        res.status(400).json(response);
        return;
      }

      const invoice = await invoiceService.createInvoiceFromUsage(
        subscriptionId,
        new Date(billingPeriodStart),
        new Date(billingPeriodEnd),
      );

      const response: ApiResponse = {
        success: true,
        message: 'Invoice created from usage successfully',
        data: { invoice },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get invoice by ID
  async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const userId = (req.user as AuthUser).id;
      const userRole = (req.user as AuthUser).role;

      // Allow admins to view any invoice, users only their own
      const invoice = await invoiceService.getInvoiceById(
        invoiceId,
        userRole === 'ADMIN' ? undefined : userId,
      );

      if (!invoice) {
        const response: ApiResponse = {
          success: false,
          message: 'Invoice not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Invoice retrieved successfully',
        data: { invoice },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // List invoices with filtering and pagination
  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const userRole = (req.user as AuthUser).role;

      // Middleware has already validated the query, so we can trust it's properly typed
      const requestData: InvoiceListRequest = {
        ...req.query,
        userId: userRole === 'ADMIN' ? req.query.userId : userId,
      } as InvoiceListRequest;

      const result = await invoiceService.listInvoices(requestData);

      const response: ApiResponse = {
        success: true,
        message: 'Invoices retrieved successfully',
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update invoice
  async updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const userId = (req.user as AuthUser).id;
      const userRole = (req.user as AuthUser).role;

      // Check if user can update this invoice
      const existingInvoice = await invoiceService.getInvoiceById(
        invoiceId,
        userRole === 'ADMIN' ? undefined : userId,
      );

      if (!existingInvoice) {
        const response: ApiResponse = {
          success: false,
          message: 'Invoice not found',
        };
        res.status(404).json(response);
        return;
      }

      // Users can only update certain fields, admins can update all
      const allowedUpdates = userRole === 'ADMIN'
        ? req.body
        : { customerNotes: req.body.customerNotes };

      const invoice = await invoiceService.updateInvoice(invoiceId, allowedUpdates);

      const response: ApiResponse = {
        success: true,
        message: 'Invoice updated successfully',
        data: { invoice },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Generate invoice PDF
  async generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const userId = (req.user as AuthUser).id;
      const userRole = (req.user as AuthUser).role;

      const requestData = {
        invoiceId,
        ...req.body,
      };

      // Check if user can access this invoice
      const invoice = await invoiceService.getInvoiceById(
        invoiceId,
        userRole === 'ADMIN' ? undefined : userId,
      );

      if (!invoice) {
        const response: ApiResponse = {
          success: false,
          message: 'Invoice not found',
        };
        res.status(404).json(response);
        return;
      }

      const pdfResult = await invoiceService.generatePdf(requestData);

      const response: ApiResponse = {
        success: true,
        message: 'Invoice PDF generated successfully',
        data: pdfResult,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Download invoice PDF
  async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const userId = (req.user as AuthUser).id;
      const userRole = (req.user as AuthUser).role;

      // Check if user can access this invoice
      const invoice = await invoiceService.getInvoiceById(
        invoiceId,
        userRole === 'ADMIN' ? undefined : userId,
      );

      if (!invoice) {
        const response: ApiResponse = {
          success: false,
          message: 'Invoice not found',
        };
        res.status(404).json(response);
        return;
      }

      await this.servePdfFile(invoice, invoiceId, res);
    } catch (error) {
      next(error);
    }
  }

  // Get invoice summary for dashboard
  async getInvoiceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const userRole = (req.user as AuthUser).role;

      // Admins can see global summary, users only their own
      const summary = await invoiceService.getInvoiceSummary(
        userRole === 'ADMIN' ? undefined : userId,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Invoice summary retrieved successfully',
        data: { summary },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Mark overdue invoices
  async markOverdueInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = (req.user as AuthUser).role;

      if (userRole !== 'ADMIN') {
        const response: ApiResponse = {
          success: false,
          message: 'Insufficient permissions',
        };
        res.status(403).json(response);
        return;
      }

      const count = await invoiceService.markOverdueInvoices();

      const response: ApiResponse = {
        success: true,
        message: `Marked ${count} invoices as overdue`,
        data: { count },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get invoice by number (public endpoint for customer access)
  async getInvoiceByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceNumber } = req.params;
      const { email } = req.query;

      if (!email) {
        const response: ApiResponse = {
          success: false,
          message: 'Email parameter is required',
        };
        res.status(400).json(response);
        return;
      }

      // Find invoice by number and customer email
      const invoice = await invoiceService.getInvoiceById(invoiceNumber);

      if (!invoice || invoice.customerEmail !== email) {
        const response: ApiResponse = {
          success: false,
          message: 'Invoice not found',
        };
        res.status(404).json(response);
        return;
      }

      // Remove sensitive information for public access
      const publicInvoice = {
        ...invoice,
        user: undefined,
        subscription: undefined,
        notes: undefined, // Hide internal notes
      };

      const response: ApiResponse = {
        success: true,
        message: 'Invoice retrieved successfully',
        data: { invoice: publicInvoice },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  private async servePdfFile(invoice: any, invoiceId: string, res: Response): Promise<void> {
    // Generate PDF if not exists
    if (!invoice.pdfUrl) {
      await invoiceService.generatePdf({
        invoiceId,
        template: 'standard',
        includeUsageDetails: true,
      });
    }

    // Serve PDF file
    const filename = `invoice-${invoice.invoiceNumber.toLowerCase()}.pdf`;
    const filepath = path.join(process.cwd(), 'temp', filename);

    try {
      await fs.access(filepath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const fileBuffer = await fs.readFile(filepath);
      res.send(fileBuffer);
    } catch (fileError) {
      const response: ApiResponse = {
        success: false,
        message: 'PDF file not found. Please generate it first.',
      };
      res.status(404).json(response);
    }
  }
}
