import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import {
  type Invoice,
  type InvoiceLineItem,
  Variant_paid_unpaid_draft,
  type backendInterface,
} from "../backend";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";

interface Props {
  actor: backendInterface;
  navigate: (p: Page) => void;
}

const fmtCurrency = (v: bigint) => `$${(Number(v) / 100).toFixed(2)}`;
const statusColor = (s: Variant_paid_unpaid_draft) => {
  if (s === Variant_paid_unpaid_draft.paid)
    return "bg-green-900/50 text-green-400 border-green-700/50";
  if (s === Variant_paid_unpaid_draft.unpaid)
    return "bg-red-900/50 text-red-400 border-red-700/50";
  return "bg-slate-800 text-slate-400 border-slate-600";
};
const dateToTs = (d: string) =>
  d ? BigInt(new Date(d).getTime()) * 1_000_000n : 0n;
const tsToDateStr = (ts: bigint) =>
  ts ? new Date(Number(ts) / 1_000_000).toISOString().split("T")[0] : "";

type InvoiceFormData = {
  projectId: string;
  invoiceNumber: string;
  status: Variant_paid_unpaid_draft;
  invoiceDate: string;
  invoiceMonth: string;
  dueDate: string;
  paymentTerms: string;
  costCenter: string;
  clientCompanyName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  clientWebsite: string;
  ourCompanyName: string;
  ourAddress: string;
  ourPhone: string;
  ourEmail: string;
  ourWebsite: string;
  taxPercent: string;
  discountPercent: string;
  lineItems: Array<{
    date: string;
    description: string;
    visitTime: string;
    hourlyRate: string;
    travelCost: string;
    materialCost: string;
  }>;
};

const emptyForm = (): InvoiceFormData => ({
  projectId: "0",
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  status: Variant_paid_unpaid_draft.draft,
  invoiceDate: new Date().toISOString().split("T")[0],
  invoiceMonth: new Date().toISOString().slice(0, 7),
  dueDate: "",
  paymentTerms: "Net 30",
  costCenter: "",
  clientCompanyName: "",
  clientAddress: "",
  clientPhone: "",
  clientEmail: "",
  clientWebsite: "",
  ourCompanyName: "",
  ourAddress: "",
  ourPhone: "",
  ourEmail: "",
  ourWebsite: "",
  taxPercent: "0",
  discountPercent: "0",
  lineItems: [
    {
      date: "",
      description: "",
      visitTime: "0",
      hourlyRate: "0",
      travelCost: "0",
      materialCost: "0",
    },
  ],
});

const calcLineItem = (li: InvoiceFormData["lineItems"][0]) => {
  const hrs = Number.parseFloat(li.visitTime || "0");
  const rate = Number.parseFloat(li.hourlyRate || "0");
  const travel = Number.parseFloat(li.travelCost || "0");
  const material = Number.parseFloat(li.materialCost || "0");
  return hrs * rate + travel + material;
};

const formToInvoice = (f: InvoiceFormData): Invoice => {
  const lineItems: InvoiceLineItem[] = f.lineItems.map((li) => ({
    date: dateToTs(li.date),
    description: li.description,
    visitTime: BigInt(Math.round(Number.parseFloat(li.visitTime || "0") * 100)),
    hourlyRate: BigInt(
      Math.round(Number.parseFloat(li.hourlyRate || "0") * 100),
    ),
    travelCost: BigInt(
      Math.round(Number.parseFloat(li.travelCost || "0") * 100),
    ),
    materialCost: BigInt(
      Math.round(Number.parseFloat(li.materialCost || "0") * 100),
    ),
    totalAmount: BigInt(Math.round(calcLineItem(li) * 100)),
  }));
  const subtotal = f.lineItems.reduce((sum, li) => sum + calcLineItem(li), 0);
  const tax = Number.parseFloat(f.taxPercent || "0");
  const discount = Number.parseFloat(f.discountPercent || "0");
  const grandTotal = subtotal * (1 + tax / 100) * (1 - discount / 100);
  const now = BigInt(Date.now()) * 1_000_000n;
  return {
    id: 0n,
    projectId: BigInt(Number.parseInt(f.projectId || "0")),
    invoiceNumber: f.invoiceNumber,
    status: f.status,
    invoiceDate: dateToTs(f.invoiceDate),
    invoiceMonth: f.invoiceMonth,
    dueDate: dateToTs(f.dueDate),
    paymentTerms: f.paymentTerms,
    costCenter: f.costCenter,
    clientCompanyName: f.clientCompanyName,
    clientAddress: f.clientAddress,
    clientPhone: f.clientPhone,
    clientEmail: f.clientEmail,
    clientWebsite: f.clientWebsite,
    ourCompanyName: f.ourCompanyName,
    ourAddress: f.ourAddress,
    ourPhone: f.ourPhone,
    ourEmail: f.ourEmail,
    ourWebsite: f.ourWebsite,
    lineItems,
    subtotal: BigInt(Math.round(subtotal * 100)),
    taxPercent: BigInt(Math.round(tax)),
    discountPercent: BigInt(Math.round(discount)),
    grandTotal: BigInt(Math.round(grandTotal * 100)),
    createdAt: now,
    updatedAt: now,
  };
};

const invoiceToForm = (inv: Invoice): InvoiceFormData => ({
  projectId: String(Number(inv.projectId)),
  invoiceNumber: inv.invoiceNumber,
  status: inv.status,
  invoiceDate: tsToDateStr(inv.invoiceDate),
  invoiceMonth: inv.invoiceMonth,
  dueDate: tsToDateStr(inv.dueDate),
  paymentTerms: inv.paymentTerms,
  costCenter: inv.costCenter,
  clientCompanyName: inv.clientCompanyName,
  clientAddress: inv.clientAddress,
  clientPhone: inv.clientPhone,
  clientEmail: inv.clientEmail,
  clientWebsite: inv.clientWebsite,
  ourCompanyName: inv.ourCompanyName,
  ourAddress: inv.ourAddress,
  ourPhone: inv.ourPhone,
  ourEmail: inv.ourEmail,
  ourWebsite: inv.ourWebsite,
  taxPercent: String(Number(inv.taxPercent)),
  discountPercent: String(Number(inv.discountPercent)),
  lineItems: inv.lineItems.map((li) => ({
    date: tsToDateStr(li.date),
    description: li.description,
    visitTime: String(Number(li.visitTime) / 100),
    hourlyRate: String(Number(li.hourlyRate) / 100),
    travelCost: String(Number(li.travelCost) / 100),
    materialCost: String(Number(li.materialCost) / 100),
  })),
});

export default function InvoicesPage({ actor, navigate }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(emptyForm());

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => actor.listAllInvoices(),
  });

  const createMutation = useMutation({
    mutationFn: (f: InvoiceFormData) => actor.createInvoice(formToInvoice(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: bigint; f: InvoiceFormData }) =>
      actor.updateInvoice(id, formToInvoice(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor.deleteInvoice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const openCreate = () => {
    setEditingInvoice(null);
    setForm(emptyForm());
    setShowForm(true);
  };
  const openEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setForm(invoiceToForm(inv));
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingInvoice)
      updateMutation.mutate({ id: editingInvoice.id, f: form });
    else createMutation.mutate(form);
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientCompanyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141E2E] border-[#223047] text-white placeholder:text-[#94A3B8]"
          />
        </div>
        <select
          className="bg-[#141E2E] border border-[#223047] text-white rounded-md px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="draft">Draft</option>
        </select>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Button>
      </div>

      <div className="bg-[#141E2E] border border-[#223047] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#223047]">
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                Invoice #
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3 hidden md:table-cell">
                Client
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3 hidden lg:table-cell">
                Date
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3 hidden lg:table-cell">
                Due
              </th>
              <th className="text-right text-xs text-[#94A3B8] px-4 py-3">
                Total
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                Status
              </th>
              <th className="text-right text-xs text-[#94A3B8] px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[#94A3B8]"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[#94A3B8]"
                >
                  No invoices found
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr
                  key={inv.id.toString()}
                  className="border-b border-[#223047]/50 hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8] hidden md:table-cell">
                    {inv.clientCompanyName}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8] hidden lg:table-cell">
                    {tsToDateStr(inv.invoiceDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8] hidden lg:table-cell">
                    {tsToDateStr(inv.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white text-right font-semibold">
                    {fmtCurrency(inv.grandTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate({
                            name: "invoice-detail",
                            invoiceId: inv.id,
                          })
                        }
                        className="p-1.5 text-[#94A3B8] hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(inv)}
                        className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(inv.id)}
                        className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#141E2E] border-[#223047] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingInvoice ? "Edit Invoice" : "New Invoice"}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-[#223047] text-[#94A3B8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingInvoice ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceForm({
  form,
  setForm,
}: { form: InvoiceFormData; setForm: (f: InvoiceFormData) => void }) {
  const inputClass =
    "bg-[#0E1626] border-[#223047] text-white placeholder:text-[#94A3B8] focus:border-blue-500";
  const labelClass = "block text-xs text-[#94A3B8] mb-1";
  const set = (k: keyof InvoiceFormData, v: string) =>
    setForm({ ...form, [k]: v });

  const updateLineItem = (idx: number, field: string, val: string) => {
    const items = [...form.lineItems];
    items[idx] = { ...items[idx], [field]: val };
    setForm({ ...form, lineItems: items });
  };

  const addLineItem = () =>
    setForm({
      ...form,
      lineItems: [
        ...form.lineItems,
        {
          date: "",
          description: "",
          visitTime: "0",
          hourlyRate: "0",
          travelCost: "0",
          materialCost: "0",
        },
      ],
    });

  const removeLineItem = (idx: number) =>
    setForm({
      ...form,
      lineItems: form.lineItems.filter((_, i) => i !== idx),
    });

  const subtotal = form.lineItems.reduce(
    (sum, li) => sum + calcLineItem(li),
    0,
  );
  const tax = Number.parseFloat(form.taxPercent || "0");
  const discount = Number.parseFloat(form.discountPercent || "0");
  const grandTotal = subtotal * (1 + tax / 100) * (1 - discount / 100);

  return (
    <div className="space-y-6">
      {/* Invoice Info */}
      <div>
        <h4 className="text-white font-semibold mb-3">Invoice Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Invoice Number</label>
            <Input
              className={inputClass}
              value={form.invoiceNumber}
              onChange={(e) => set("invoiceNumber", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              className="w-full bg-[#0E1626] border border-[#223047] text-white rounded-md px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Cost Center</label>
            <Input
              className={inputClass}
              value={form.costCenter}
              onChange={(e) => set("costCenter", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Invoice Date</label>
            <Input
              type="date"
              className={inputClass}
              value={form.invoiceDate}
              onChange={(e) => set("invoiceDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Invoice Month</label>
            <Input
              type="month"
              className={inputClass}
              value={form.invoiceMonth}
              onChange={(e) => set("invoiceMonth", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <Input
              type="date"
              className={inputClass}
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className={labelClass}>Payment Terms</label>
            <Input
              className={inputClass}
              value={form.paymentTerms}
              onChange={(e) => set("paymentTerms", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Client + Our Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-white font-semibold mb-3">Client Information</h4>
          <div className="space-y-3">
            {(
              [
                "clientCompanyName",
                "clientAddress",
                "clientPhone",
                "clientEmail",
                "clientWebsite",
              ] as (keyof InvoiceFormData)[]
            ).map((f) => (
              <div key={f}>
                <label className={labelClass}>
                  {f
                    .replace("client", "")
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                </label>
                <Input
                  className={inputClass}
                  value={form[f] as string}
                  onChange={(e) => set(f, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Our Company</h4>
          <div className="space-y-3">
            {(
              [
                "ourCompanyName",
                "ourAddress",
                "ourPhone",
                "ourEmail",
                "ourWebsite",
              ] as (keyof InvoiceFormData)[]
            ).map((f) => (
              <div key={f}>
                <label className={labelClass}>
                  {f
                    .replace("our", "")
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                </label>
                <Input
                  className={inputClass}
                  value={form[f] as string}
                  onChange={(e) => set(f, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-semibold">Line Items</h4>
          <Button
            size="sm"
            onClick={addLineItem}
            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Row
          </Button>
        </div>
        <div className="space-y-3">
          {form.lineItems.map((li, idx) => (
            <div
              key={idx}
              className="bg-[#0E1626] border border-[#223047] rounded-lg p-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className={labelClass}>Date</label>
                  <Input
                    type="date"
                    className={inputClass}
                    value={li.date}
                    onChange={(e) =>
                      updateLineItem(idx, "date", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <Input
                    className={inputClass}
                    value={li.description}
                    onChange={(e) =>
                      updateLineItem(idx, "description", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Visit Time (hrs)</label>
                  <Input
                    type="number"
                    step="0.5"
                    className={inputClass}
                    value={li.visitTime}
                    onChange={(e) =>
                      updateLineItem(idx, "visitTime", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Hourly Rate ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={li.hourlyRate}
                    onChange={(e) =>
                      updateLineItem(idx, "hourlyRate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Travel Cost ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={li.travelCost}
                    onChange={(e) =>
                      updateLineItem(idx, "travelCost", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Material Cost ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={li.materialCost}
                    onChange={(e) =>
                      updateLineItem(idx, "materialCost", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#94A3B8]">
                  Line Total:{" "}
                  <span className="text-white font-semibold">
                    ${calcLineItem(li).toFixed(2)}
                  </span>
                </span>
                {form.lineItems.length > 1 && (
                  <button
                    onClick={() => removeLineItem(idx)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    × Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-[#0E1626] border border-[#223047] rounded-lg p-4">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-[#94A3B8]">Tax (%)</span>
              <Input
                type="number"
                className="w-20 h-7 text-xs bg-[#141E2E] border-[#223047] text-white"
                value={form.taxPercent}
                onChange={(e) => set("taxPercent", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-[#94A3B8]">Discount (%)</span>
              <Input
                type="number"
                className="w-20 h-7 text-xs bg-[#141E2E] border-[#223047] text-white"
                value={form.discountPercent}
                onChange={(e) => set("discountPercent", e.target.value)}
              />
            </div>
            <div className="flex justify-between text-base font-bold border-t border-[#223047] pt-2">
              <span className="text-white">Grand Total</span>
              <span className="text-blue-400">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
