import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';

@Component({
  selector: 'app-view-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-invoices.component.html',
  styleUrls: ['./view-invoices.component.scss']
})
export class ViewInvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  loading: boolean = true;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.loading = true;
    this.invoiceService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.loading = false;
      }
    });
  }

  viewInvoice(id: number) {
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        console.log('Invoice details:', invoice);
        // You can implement a modal or navigation to show details
      },
      error: (error) => {
        console.error('Error loading invoice details:', error);
      }
    });
  }

  updateStatus(id: number) {
    // Example: Update to 'PAID' status
    this.invoiceService.updateInvoiceStatus(id, 'PAID').subscribe({
      next: (updatedInvoice) => {
        console.log('Invoice updated:', updatedInvoice);
        this.loadInvoices(); // Reload the list
      },
      error: (error) => {
        console.error('Error updating invoice:', error);
      }
    });
  }
} 