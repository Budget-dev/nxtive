"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, ShieldCheck, Download, CheckCircle2 } from "lucide-react";
import { amountToWordsINR } from "@/utils/number-to-words";
import { formatCurrency } from "@/utils/format-currency";

interface InvoiceProps {
  order: any;
  backUrl?: string;
  isAdmin?: boolean;
}

export function OrderInvoice({ order, backUrl = "/admin/orders", isAdmin = true }: InvoiceProps) {
  const orderNumber = order?.orderNumber || order?.id || "NXTIVE-ORDER";
  const invoiceNumber = `INV-${orderNumber.replace(/^NX-|^NXTIVE-/, "")}`;
  
  // Format Date
  const rawDate = order?.createdAt || new Date().toISOString();
  const dateObj = new Date(rawDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Customer info & address
  const shippingAddress = order?.shippingAddress || {};
  const customerName =
    shippingAddress.fullName ||
    order?.customerName ||
    order?.userName ||
    "Valued Customer";
  const customerEmail =
    shippingAddress.email || order?.customerEmail || order?.email || "—";
  const customerPhone =
    shippingAddress.phone || order?.customerPhone || order?.phone || "—";
  const street = shippingAddress.street || shippingAddress.address || "—";
  const apartment = shippingAddress.apartment || "";
  const city = shippingAddress.city || "—";
  const state = shippingAddress.state || "Maharashtra";
  const postalCode = shippingAddress.postalCode || shippingAddress.pincode || "—";
  const country = shippingAddress.country || "India";

  // Items
  const items: any[] = Array.isArray(order?.items) ? order.items : [];

  // Totals
  const rawTotal =
    order?.total ??
    order?.amount ??
    order?.totalAmount ??
    items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const total = Number(rawTotal) || 0;
  const subtotal = order?.subtotal != null ? Number(order.subtotal) : total;
  const discount = Number(order?.discount || 0);
  const shippingFee = Number(order?.shipping || 0);

  // COD & Advance calculations
  const paymentMethod = String(order?.paymentMethod || "").toLowerCase();
  const isCod =
    paymentMethod.includes("cod") ||
    paymentMethod === "cash on delivery" ||
    order?.isCod === true;
  const advancePaid = isCod ? 149 : total;
  const codBalanceDue = isCod ? Math.max(0, total - advancePaid) : 0;

  // Transaction details
  const utr =
    order?.upiTransactionId ||
    order?.paymentTransactionId ||
    order?.razorpayPaymentId ||
    order?.transactionId ||
    "";

  // Delivery status detection
  const rawStatus = String(order?.status || "").toLowerCase();
  const isDelivered = rawStatus === "delivered";
  const trackingNumber = order?.trackingNumber || (order?.id ? `NXT-AWB-${String(order.id).slice(-6).toUpperCase()}` : "");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-container">
      {/* Top Action Controls (hidden during print) */}
      <div className="invoice-actions no-print">
        <Link href={backUrl} className="invoice-action-btn back-btn">
          <ArrowLeft size={16} />
          <span>Back to Order</span>
        </Link>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={handlePrint} className="invoice-action-btn print-btn">
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="invoice-paper" id="invoice-printable-area">
        {/* Header: Brand & Invoice Meta */}
        <div className="invoice-header">
          <div className="brand-column">
            <div className="brand-logo-text">NXTIVE</div>
            <div className="brand-subtext">NXTIVE CLOTHING & APPARELS</div>
            <div className="brand-tagline">Contemporary Luxury & Heavyweight Streetwear</div>
            <div className="company-details">
              Registered Office: Bandra West, Mumbai, Maharashtra 400050, India<br />
              Email: <strong>nxtiveclothing@gmail.com</strong> | Tel: +91 97004 46690
            </div>
          </div>

          <div className="meta-column">
            <div className="invoice-badge">RETAIL INVOICE</div>
            <div className="meta-field">
              <span className="meta-label">Invoice No:</span>
              <span className="meta-value-highlight">{invoiceNumber}</span>
            </div>
            <div className="meta-field">
              <span className="meta-label">Invoice Date:</span>
              <span className="meta-value">{formattedDate}</span>
            </div>
            <div className="meta-field">
              <span className="meta-label">Order Ref:</span>
              <span className="meta-value">{orderNumber}</span>
            </div>
            <div className="meta-field">
              <span className="meta-label">Place of Supply:</span>
              <span className="meta-value">{state}</span>
            </div>
          </div>
        </div>

        <div className="divider-line" />

        {/* Addresses Row */}
        <div className="addresses-grid">
          <div className="address-box">
            <div className="address-title">BILLED & SHIPPED TO</div>
            <div className="customer-name">{customerName}</div>
            <div className="address-text">
              {street}{apartment ? `, ${apartment}` : ""}<br />
              {city}, {state} — {postalCode}<br />
              {country}
            </div>
            <div className="contact-line">
              <strong>Phone:</strong> {customerPhone}
            </div>
            <div className="contact-line">
              <strong>Email:</strong> {customerEmail}
            </div>
          </div>

          <div className="address-box payment-meta-box">
            <div className="address-title">PAYMENT & FULFILLMENT SUMMARY</div>
            <div className="payment-row">
              <span className="pay-label">Payment Method:</span>
              <span className="pay-value">
                {isCod ? "Cash on Delivery (₹149 Advance Paid)" : "PhonePe / UPI (Prepaid)"}
              </span>
            </div>
            <div className="payment-row">
              <span className="pay-label">Payment Status:</span>
              <span className="pay-value status-tag">
                {isCod ? "ADVANCE PAID" : (order?.paymentStatus || "PAID").toUpperCase()}
              </span>
            </div>
            {utr && (
              <div className="payment-row">
                <span className="pay-label">UPI / Bank UTR:</span>
                <span className="pay-value font-mono">{utr}</span>
              </div>
            )}
            <div className="payment-row">
              <span className="pay-label">Order Placed:</span>
              <span className="pay-value">{formattedDate} {formattedTime}</span>
            </div>
            <div className="payment-row">
              <span className="pay-label">Delivery Service:</span>
              <span className="pay-value">NXTIVE Express Domestic (Free)</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>#</th>
              <th>Item Description & Specs</th>
              <th style={{ width: "70px", textAlign: "center" }}>Size</th>
              <th style={{ width: "60px", textAlign: "center" }}>Qty</th>
              <th style={{ width: "100px", textAlign: "right" }}>Unit Price</th>
              <th style={{ width: "110px", textAlign: "right" }}>Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#666" }}>
                  Standard Apparel Order ({orderNumber})
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const itemPrice = Number(item.price || 0);
                const itemQty = Number(item.quantity || 1);
                const itemTotal = itemPrice * itemQty;
                const size = item.selectedSize || item.size || "M";
                const color = item.selectedColor || item.color || "";

                return (
                  <tr key={index}>
                    <td style={{ textAlign: "center", color: "#888" }}>{index + 1}</td>
                    <td>
                      <div className="item-title">{item.title || item.name || "NXTIVE Apparel Item"}</div>
                      <div className="item-sku">
                        {item.sku ? `SKU: ${item.sku}` : `PID: ${item.productId || "NX-APP"}`}
                        {color ? ` • Color: ${color}` : ""}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{size}</td>
                    <td style={{ textAlign: "center" }}>{itemQty}</td>
                    <td style={{ textAlign: "right" }}>₹{itemPrice.toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹{itemTotal.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Financial Summary & Words */}
        <div className="financials-row">
          {/* Left: Fulfillment Status & Amount in Words */}
          <div className="financials-left">
            <div className="words-box">
              <span className="words-label">Invoice Amount in Words:</span>
              <div className="words-text">{amountToWordsINR(total)}</div>
            </div>

            <div className="fulfillment-summary-table">
              <div className="fulfillment-summary-title">Delivery & Fulfillment Status</div>
              <div className="fulfillment-row">
                <span>Delivery Status:</span>
                <span className={isDelivered ? "status-tag-delivered" : "status-tag-transit"}>
                  {isDelivered ? "✓ DELIVERED" : (order?.status || "CONFIRMED").toUpperCase()}
                </span>
              </div>
              <div className="fulfillment-row">
                <span>Courier Service:</span>
                <span>Shiprocket Express</span>
              </div>
              {trackingNumber && (
                <div className="fulfillment-row">
                  <span>AWB Number:</span>
                  <span className="font-mono">{trackingNumber}</span>
                </div>
              )}
              <div className="fulfillment-row">
                <span>Invoice Type:</span>
                <span>Retail Bill of Supply</span>
              </div>
            </div>
          </div>

          {/* Right: Calculations Subtotal, Shipping, Balance */}
          <div className="financials-right">
            <div className="calc-row">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {discount > 0 && (
              <div className="calc-row discount-row">
                <span>Discount:</span>
                <span>-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="calc-row">
              <span>Shipping & Handling:</span>
              <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee.toLocaleString("en-IN")}`}</span>
            </div>

            <div className="calc-row total-row">
              <span>Total Invoice Value:</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>

            {isCod ? (
              <div className="cod-breakdown-box">
                <div className="calc-row advance-paid-row">
                  <span>Advance Booking Paid (UPI):</span>
                  <span>-₹{advancePaid.toLocaleString("en-IN")}</span>
                </div>
                <div className="calc-row balance-due-row">
                  <span>Cash Payable on Delivery:</span>
                  <span>₹{codBalanceDue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ) : (
              <div className="paid-stamp-box">
                <CheckCircle2 size={16} color="#16A34A" />
                <span>PAID IN FULL VIA UPI / ONLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Signatory & Notes Footer */}
        <div className="invoice-footer">
          <div className="terms-col">
            <div className="terms-title">Terms & Conditions:</div>
            <ol className="terms-list">
              <li>Goods once sold can be exchanged or returned within 7 days in unworn condition with tags intact.</li>
              <li>This is an official computer-generated retail invoice and bill of supply. It does not require a physical signature.</li>
              <li>For returns, exchanges, or inquiries, contact <strong>nxtiveclothing@gmail.com</strong> with this invoice number.</li>
            </ol>
          </div>

          <div className="signatory-col">
            <div className="signatory-stamp">
              <div className="stamp-title">NXTIVE APPARELS</div>
              <div className="stamp-sub">AUTHORIZED SIGNATORY</div>
            </div>
            <div className="signatory-caption">Authorized Representative</div>
          </div>
        </div>
      </div>

      {/* Component Styles with strict @media print rules */}
      <style jsx global>{`
        .invoice-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 16px 60px 16px;
        }

        .invoice-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .invoice-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .back-btn {
          background-color: #27272A;
          color: #E4E4E7;
          border-color: #3F3F46;
        }

        .back-btn:hover {
          background-color: #3F3F46;
          color: #FFFFFF;
        }

        .print-btn {
          background-color: #F2AC24;
          color: #111110;
          border: none;
          box-shadow: 0 4px 12px rgba(242, 172, 36, 0.25);
        }

        .print-btn:hover {
          background-color: #D99518;
        }

        /* Printable Paper Sheet */
        .invoice-paper {
          background-color: #FFFFFF;
          color: #111110;
          padding: 44px 48px;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #E5E7EB;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 24px;
        }

        .brand-logo-text {
          font-size: 32px;
          font-weight: 900;
          letterSpacing: 0.1em;
          color: #111110;
          line-height: 1;
        }

        .brand-subtext {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #555;
          margin-top: 4px;
        }

        .brand-tagline {
          font-size: 12px;
          color: #777;
          margin-top: 2px;
          margin-bottom: 12px;
        }

        .company-details {
          font-size: 11.5px;
          color: #4B5563;
          line-height: 1.6;
        }

        .meta-column {
          text-align: right;
          min-width: 220px;
        }

        .invoice-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.14em;
          background-color: #111110;
          color: #FFFFFF;
          padding: 5px 14px;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .meta-field {
          margin-bottom: 4px;
          font-size: 12.5px;
        }

        .meta-label {
          color: #6B7280;
          margin-right: 8px;
        }

        .meta-value {
          font-weight: 600;
          color: #111110;
        }

        .meta-value-highlight {
          font-weight: 800;
          color: #111110;
          font-size: 14px;
          font-family: monospace;
        }

        .divider-line {
          height: 1px;
          background-color: #E5E7EB;
          margin: 28px 0;
        }

        .addresses-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-bottom: 28px;
        }

        .address-box {
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px 20px;
        }

        .address-title {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #6B7280;
          margin-bottom: 8px;
        }

        .customer-name {
          font-size: 15px;
          font-weight: 800;
          color: #111110;
          margin-bottom: 4px;
        }

        .address-text {
          font-size: 12.5px;
          color: #4B5563;
          line-height: 1.5;
          margin-bottom: 10px;
        }

        .contact-line {
          font-size: 12px;
          color: #374151;
          margin-bottom: 2px;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .pay-label {
          color: #6B7280;
        }

        .pay-value {
          font-weight: 600;
          color: #111110;
          text-align: right;
        }

        .status-tag {
          background-color: #DCFCE7;
          color: #15803D;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 11px;
        }

        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .items-table th {
          background-color: #F3F4F6;
          color: #374151;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 12px;
          border-top: 1px solid #D1D5DB;
          border-bottom: 1px solid #D1D5DB;
        }

        .items-table td {
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid #E5E7EB;
          vertical-align: middle;
        }

        .item-title {
          font-weight: 700;
          color: #111110;
        }

        .item-sku {
          font-size: 11px;
          color: #6B7280;
          margin-top: 2px;
        }

        /* Financials */
        .financials-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 28px;
          margin-bottom: 28px;
        }

        .words-box {
          background-color: #F9FAFB;
          border: 1px dashed #D1D5DB;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .words-label {
          font-size: 10.5px;
          color: #6B7280;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
          margin-bottom: 3px;
        }

        .words-text {
          font-size: 13px;
          font-weight: 700;
          color: #111110;
          font-style: italic;
        }

        .fulfillment-summary-table {
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          padding: 12px 16px;
        }

        .fulfillment-summary-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #6B7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .fulfillment-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: #4B5563;
          margin-bottom: 5px;
          align-items: center;
        }

        .status-tag-delivered {
          background-color: #DCFCE7;
          color: #15803D;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 10.5px;
          letter-spacing: 0.04em;
        }

        .status-tag-transit {
          background-color: #FEF3C7;
          color: #B45309;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 10.5px;
          letter-spacing: 0.04em;
        }

        .financials-right {
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #4B5563;
        }

        .discount-row {
          color: #16A34A;
          font-weight: 600;
        }

        .total-row {
          font-size: 16px;
          font-weight: 900;
          color: #111110;
          border-top: 2px solid #111110;
          padding-top: 10px;
          margin-top: 4px;
        }

        .cod-breakdown-box {
          margin-top: 8px;
          padding-top: 10px;
          border-top: 1px dashed #D1D5DB;
        }

        .advance-paid-row {
          color: #16A34A;
          font-weight: 700;
          font-size: 12.5px;
        }

        .balance-due-row {
          color: #B45309;
          font-weight: 900;
          font-size: 14.5px;
          margin-top: 6px;
          background-color: #FEF3C7;
          padding: 6px 10px;
          border-radius: 6px;
        }

        .paid-stamp-box {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 800;
          color: #16A34A;
          background-color: #DCFCE7;
          padding: 6px 10px;
          border-radius: 6px;
        }

        /* Footer */
        .invoice-footer {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 28px;
          border-top: 1px solid #E5E7EB;
          padding-top: 24px;
        }

        .terms-title {
          font-size: 11px;
          font-weight: 800;
          color: #374151;
          margin-bottom: 6px;
        }

        .terms-list {
          font-size: 10.5px;
          color: #6B7280;
          padding-left: 16px;
          line-height: 1.6;
          margin: 0;
        }

        .signatory-col {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }

        .signatory-stamp {
          border: 2px dashed #9CA3AF;
          border-radius: 8px;
          padding: 12px 20px;
          background-color: #F9FAFB;
          margin-bottom: 6px;
          display: inline-block;
        }

        .stamp-title {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #111110;
        }

        .stamp-sub {
          font-size: 9.5px;
          color: #6B7280;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .signatory-caption {
          font-size: 11px;
          color: #6B7280;
        }

        /* STRICT PRINT STYLES */
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
          }

          /* Hide admin wrappers, bars, headers, and buttons */
          .no-print,
          .admin-sidebar,
          .admin-header,
          .admin-nav,
          header,
          footer,
          nav,
          aside {
            display: none !important;
          }

          .invoice-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .invoice-paper {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
          }

          .items-table th {
            background-color: #E5E7EB !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .status-tag,
          .paid-stamp-box,
          .balance-due-row,
          .invoice-badge {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

