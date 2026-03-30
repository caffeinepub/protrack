import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import {
  type Project,
  Variant_cancelled_pending_completed,
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

const statusColor = (s: Variant_cancelled_pending_completed) => {
  if (s === Variant_cancelled_pending_completed.completed)
    return "bg-green-900/50 text-green-400 border-green-700/50";
  if (s === Variant_cancelled_pending_completed.pending)
    return "bg-amber-900/50 text-amber-400 border-amber-700/50";
  return "bg-red-900/50 text-red-400 border-red-700/50";
};

const tsToDate = (ts: bigint): string => {
  if (!ts) return "";
  return new Date(Number(ts) / 1_000_000).toISOString().split("T")[0];
};

const tsToTime = (ts: bigint): string => {
  if (!ts) return "";
  const d = new Date(Number(ts) / 1_000_000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const dateToTs = (date: string): bigint => {
  if (!date) return 0n;
  return BigInt(new Date(date).getTime()) * 1_000_000n;
};

const timeToTs = (time: string, dateTs: bigint): bigint => {
  if (!time || !dateTs) return dateTs;
  const [h, m] = time.split(":").map(Number);
  const d = new Date(Number(dateTs) / 1_000_000);
  d.setHours(h, m, 0, 0);
  return BigInt(d.getTime()) * 1_000_000n;
};

type ProjectFormData = {
  clientCompanyName: string;
  projectHandleClient: string;
  projectHandleTeam: string;
  techDetails: string;
  visitLocation: string;
  status: Variant_cancelled_pending_completed;
  visitDate: string;
  timeIn: string;
  timeOut: string;
  totalTime: string;
  clientAgreedRate: string;
  techAgreedRate: string;
  clientPaid: boolean;
  techPaid: boolean;
  travelCost: string;
  materialCost: string;
  techBankDetails: string;
  progress: string;
  clientId: string;
};

const emptyForm = (): ProjectFormData => ({
  clientCompanyName: "",
  projectHandleClient: "",
  projectHandleTeam: "",
  techDetails: "",
  visitLocation: "",
  status: Variant_cancelled_pending_completed.pending,
  visitDate: "",
  timeIn: "",
  timeOut: "",
  totalTime: "",
  clientAgreedRate: "",
  techAgreedRate: "",
  clientPaid: false,
  techPaid: false,
  travelCost: "",
  materialCost: "",
  techBankDetails: "",
  progress: "0",
  clientId: "0",
});

const projectToForm = (p: Project): ProjectFormData => ({
  clientCompanyName: p.clientCompanyName,
  projectHandleClient: p.projectHandleClient,
  projectHandleTeam: p.projectHandleTeam,
  techDetails: p.techDetails,
  visitLocation: p.visitLocation,
  status: p.status,
  visitDate: tsToDate(p.visitDate),
  timeIn: tsToTime(p.timeIn),
  timeOut: tsToTime(p.timeOut),
  totalTime: String(Number(p.totalTime)),
  clientAgreedRate: String(Number(p.clientAgreedRate) / 100),
  techAgreedRate: String(Number(p.techAgreedRate) / 100),
  clientPaid: p.clientPaid,
  techPaid: p.techPaid,
  travelCost: String(Number(p.travelCost) / 100),
  materialCost: String(Number(p.materialCost) / 100),
  techBankDetails: p.techBankDetails,
  progress: String(Number(p.progress)),
  clientId: String(Number(p.clientId)),
});

const formToProject = (
  f: ProjectFormData,
): Omit<Project, "id" | "createdAt" | "updatedAt" | "profit"> & {
  profit: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  id: bigint;
} => {
  const visitDateTs = dateToTs(f.visitDate);
  const now = BigInt(Date.now()) * 1_000_000n;
  const clientRate = BigInt(
    Math.round(Number.parseFloat(f.clientAgreedRate || "0") * 100),
  );
  const techRate = BigInt(
    Math.round(Number.parseFloat(f.techAgreedRate || "0") * 100),
  );
  const travelCost = BigInt(
    Math.round(Number.parseFloat(f.travelCost || "0") * 100),
  );
  const materialCost = BigInt(
    Math.round(Number.parseFloat(f.materialCost || "0") * 100),
  );
  const profit = clientRate - techRate - travelCost - materialCost;
  return {
    id: 0n,
    clientCompanyName: f.clientCompanyName,
    projectHandleClient: f.projectHandleClient,
    projectHandleTeam: f.projectHandleTeam,
    techDetails: f.techDetails,
    visitLocation: f.visitLocation,
    status: f.status,
    visitDate: visitDateTs,
    timeIn: timeToTs(f.timeIn, visitDateTs),
    timeOut: timeToTs(f.timeOut, visitDateTs),
    totalTime: BigInt(Number.parseInt(f.totalTime || "0")),
    clientAgreedRate: clientRate,
    techAgreedRate: techRate,
    clientPaid: f.clientPaid,
    techPaid: f.techPaid,
    travelCost,
    materialCost,
    profit,
    techBankDetails: f.techBankDetails,
    progress: BigInt(Number.parseInt(f.progress || "0")),
    clientId: BigInt(Number.parseInt(f.clientId || "0")),
    createdAt: now,
    updatedAt: now,
  };
};

export default function ProjectsPage({ actor, navigate }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm());

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => actor.listProjects(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) =>
      actor.createProject(formToProject(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: bigint; data: ProjectFormData }) =>
      actor.updateProject(id, formToProject(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const openCreate = () => {
    setEditingProject(null);
    setForm(emptyForm());
    setShowForm(true);
  };
  const openEdit = (p: Project) => {
    setEditingProject(p);
    setForm(projectToForm(p));
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.clientCompanyName.toLowerCase().includes(search.toLowerCase()) ||
      p.visitLocation.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141E2E] border-[#223047] text-white placeholder:text-[#94A3B8]"
          />
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="bg-[#141E2E] border border-[#223047] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#223047]">
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                Client
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3 hidden md:table-cell">
                Location
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3 hidden lg:table-cell">
                Visit Date
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                Progress
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs text-[#94A3B8] px-4 py-3 hidden xl:table-cell">
                Profit
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
                  No projects found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id.toString()}
                  className="border-b border-[#223047]/50 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium">
                      {p.clientCompanyName || "\u2014"}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {p.projectHandleClient}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8] hidden md:table-cell">
                    {p.visitLocation || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8] hidden lg:table-cell">
                    {tsToDate(p.visitDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 h-1.5 bg-[#1F2A3A] rounded-full">
                        <div
                          className="h-1.5 bg-blue-500 rounded-full"
                          style={{ width: `${Number(p.progress)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#94A3B8]">
                        {Number(p.progress)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white hidden xl:table-cell">
                    ${(Number(p.profit) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ name: "project-detail", projectId: p.id })
                        }
                        className="p-1.5 text-[#94A3B8] hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(p.id)}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#141E2E] border-[#223047] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-[#223047] text-[#94A3B8] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectForm({
  form,
  setForm,
}: { form: ProjectFormData; setForm: (f: ProjectFormData) => void }) {
  const set = (key: keyof ProjectFormData, val: string | boolean) =>
    setForm({ ...form, [key]: val });
  const inputClass =
    "bg-[#0E1626] border-[#223047] text-white placeholder:text-[#94A3B8] focus:border-blue-500";
  const labelClass = "block text-xs text-[#94A3B8] mb-1";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="proj-clientCompanyName" className={labelClass}>
          Client Company Name
        </label>
        <Input
          id="proj-clientCompanyName"
          className={inputClass}
          value={form.clientCompanyName}
          onChange={(e) => set("clientCompanyName", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-projectHandleClient" className={labelClass}>
          Project Handle (Client)
        </label>
        <Input
          id="proj-projectHandleClient"
          className={inputClass}
          value={form.projectHandleClient}
          onChange={(e) => set("projectHandleClient", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-projectHandleTeam" className={labelClass}>
          Project Handle (Our Team)
        </label>
        <Input
          id="proj-projectHandleTeam"
          className={inputClass}
          value={form.projectHandleTeam}
          onChange={(e) => set("projectHandleTeam", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-visitLocation" className={labelClass}>
          Visit Location
        </label>
        <Input
          id="proj-visitLocation"
          className={inputClass}
          value={form.visitLocation}
          onChange={(e) => set("visitLocation", e.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="proj-techDetails" className={labelClass}>
          Tech Details
        </label>
        <Input
          id="proj-techDetails"
          className={inputClass}
          value={form.techDetails}
          onChange={(e) => set("techDetails", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-status" className={labelClass}>
          Status
        </label>
        <select
          id="proj-status"
          className="w-full bg-[#0E1626] border border-[#223047] text-white rounded-md px-3 py-2 text-sm"
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value={Variant_cancelled_pending_completed.pending}>
            Pending
          </option>
          <option value={Variant_cancelled_pending_completed.completed}>
            Completed
          </option>
          <option value={Variant_cancelled_pending_completed.cancelled}>
            Cancelled
          </option>
        </select>
      </div>
      <div>
        <label htmlFor="proj-progress" className={labelClass}>
          Progress (%)
        </label>
        <Input
          id="proj-progress"
          type="number"
          min="0"
          max="100"
          className={inputClass}
          value={form.progress}
          onChange={(e) => set("progress", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-visitDate" className={labelClass}>
          Visit Date
        </label>
        <Input
          id="proj-visitDate"
          type="date"
          className={inputClass}
          value={form.visitDate}
          onChange={(e) => set("visitDate", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-timeIn" className={labelClass}>
          Time In
        </label>
        <Input
          id="proj-timeIn"
          type="time"
          className={inputClass}
          value={form.timeIn}
          onChange={(e) => set("timeIn", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-timeOut" className={labelClass}>
          Time Out
        </label>
        <Input
          id="proj-timeOut"
          type="time"
          className={inputClass}
          value={form.timeOut}
          onChange={(e) => set("timeOut", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-totalTime" className={labelClass}>
          Total Time (hours)
        </label>
        <Input
          id="proj-totalTime"
          type="number"
          className={inputClass}
          value={form.totalTime}
          onChange={(e) => set("totalTime", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-clientAgreedRate" className={labelClass}>
          Client Agreed Rate ($)
        </label>
        <Input
          id="proj-clientAgreedRate"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.clientAgreedRate}
          onChange={(e) => set("clientAgreedRate", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-techAgreedRate" className={labelClass}>
          Tech Agreed Rate ($)
        </label>
        <Input
          id="proj-techAgreedRate"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.techAgreedRate}
          onChange={(e) => set("techAgreedRate", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-travelCost" className={labelClass}>
          Travel Cost ($)
        </label>
        <Input
          id="proj-travelCost"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.travelCost}
          onChange={(e) => set("travelCost", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="proj-materialCost" className={labelClass}>
          Material Cost ($)
        </label>
        <Input
          id="proj-materialCost"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.materialCost}
          onChange={(e) => set("materialCost", e.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="proj-techBankDetails" className={labelClass}>
          Tech Bank Details
        </label>
        <Input
          id="proj-techBankDetails"
          className={inputClass}
          value={form.techBankDetails}
          onChange={(e) => set("techBankDetails", e.target.value)}
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.clientPaid}
            onChange={(e) => set("clientPaid", e.target.checked)}
            className="accent-blue-500 w-4 h-4"
          />
          <span className="text-sm text-[#94A3B8]">Client Paid</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.techPaid}
            onChange={(e) => set("techPaid", e.target.checked)}
            className="accent-blue-500 w-4 h-4"
          />
          <span className="text-sm text-[#94A3B8]">Tech Paid</span>
        </label>
      </div>
    </div>
  );
}
