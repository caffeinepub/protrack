import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import type { Page } from "../App";
import type { backendInterface } from "../backend";
import { Button } from "../components/ui/button";

interface Props {
  actor: backendInterface;
  invoiceId: bigint;
  navigate: (p: Page) => void;
}

const fmtCurrency = (v: bigint) => `$${(Number(v) / 100).toFixed(2)}`;
const tsToDate = (ts: bigint) =>
  ts ? new Date(Number(ts) / 1_000_000).toLocaleDateString() : "\u2014";
const tsToDateShort = (ts: bigint) =>
  ts ? new Date(Number(ts) / 1_000_000).toISOString().split("T")[0] : "\u2014";

export default function InvoiceDetailPage({
  actor,
  invoiceId,
  navigate,
}: Props) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId.toString()],
    queryFn: () => actor.getInvoice(invoiceId),
  });

  if (isLoading)
    return <div className="text-[#94A3B8] text-center py-20">Loading...</div>;
  if (!invoice)
    return (
      <div className="text-[#94A3B8] text-center py-20">Invoice not found</div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ name: "invoices" })}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>
        <Button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      {/* Invoice Document */}
      <div
        id="invoice-print"
        className="bg-white text-gray-900 rounded-xl p-8 max-w-4xl mx-auto print:rounded-none print:shadow-none"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-500 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                invoice.status === "paid"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : invoice.status === "unpaid"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              From
            </p>
            <p className="font-bold text-gray-900">
              {invoice.ourCompanyName || "\u2014"}
            </p>
            <p className="text-gray-600 text-sm whitespace-pre-line">
              {invoice.ourAddress}
            </p>
            {invoice.ourPhone && (
              <p className="text-gray-600 text-sm">{invoice.ourPhone}</p>
            )}
            {invoice.ourEmail && (
              <p className="text-gray-600 text-sm">{invoice.ourEmail}</p>
            )}
            {invoice.ourWebsite && (
              <p className="text-blue-600 text-sm">{invoice.ourWebsite}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Bill To
            </p>
            <p className="font-bold text-gray-900">
              {invoice.clientCompanyName || "\u2014"}
            </p>
            <p className="text-gray-600 text-sm whitespace-pre-line">
              {invoice.clientAddress}
            </p>
            {invoice.clientPhone && (
              <p className="text-gray-600 text-sm">{invoice.clientPhone}</p>
            )}
            {invoice.clientEmail && (
              <p className="text-gray-600 text-sm">{invoice.clientEmail}</p>
            )}
            {invoice.clientWebsite && (
              <p className="text-blue-600 text-sm">{invoice.clientWebsite}</p>
            )}
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-400">Invoice Date</p>
            <p className="font-semibold text-gray-900">
              {tsToDate(invoice.invoiceDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Due Date</p>
            <p className="font-semibold text-gray-900">
              {tsToDate(invoice.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Payment Terms</p>
            <p className="font-semibold text-gray-900">
              {invoice.paymentTerms || "\u2014"}
            </p>
          </div>
          {invoice.costCenter && (
            <div>
              <p className="text-xs text-gray-400">Cost Center</p>
              <p className="font-semibold text-gray-900">
                {invoice.costCenter}
              </p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">
                Date
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">
                Description
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2">
                Hours
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2">
                Rate
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2">
                Travel
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2">
                Material
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr
                key={String(li.date) + li.description + String(li.visitTime)}
                className="border-b border-gray-100"
              >
                <td className="py-3 text-sm text-gray-700">
                  {tsToDateShort(li.date)}
                </td>
                <td className="py-3 text-sm text-gray-900">{li.description}</td>
                <td className="py-3 text-sm text-gray-700 text-right">
                  {(Number(li.visitTime) / 100).toFixed(1)}
                </td>
                <td className="py-3 text-sm text-gray-700 text-right">
                  ${(Number(li.hourlyRate) / 100).toFixed(2)}
                </td>
                <td className="py-3 text-sm text-gray-700 text-right">
                  ${(Number(li.travelCost) / 100).toFixed(2)}
                </td>
                <td className="py-3 text-sm text-gray-700 text-right">
                  ${(Number(li.materialCost) / 100).toFixed(2)}
                </td>
                <td className="py-3 text-sm font-semibold text-gray-900 text-right">
                  {fmtCurrency(li.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">
                {fmtCurrency(invoice.subtotal)}
              </span>
            </div>
            {Number(invoice.taxPercent) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">
                  Tax ({Number(invoice.taxPercent)}%)
                </span>
                <span className="text-gray-900">
                  {fmtCurrency(
                    BigInt(
                      Math.round(
                        (Number(invoice.subtotal) *
                          Number(invoice.taxPercent)) /
                          100,
                      ),
                    ),
                  )}
                </span>
              </div>
            )}
            {Number(invoice.discountPercent) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">
                  Discount ({Number(invoice.discountPercent)}%)
                </span>
                <span className="text-red-600">
                  -
                  {fmtCurrency(
                    BigInt(
                      Math.round(
                        (Number(invoice.subtotal) *
                          Number(invoice.discountPercent)) /
                          100,
                      ),
                    ),
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-200 font-bold text-base">
              <span className="text-gray-900">Grand Total</span>
              <span className="text-blue-600">
                {fmtCurrency(invoice.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
