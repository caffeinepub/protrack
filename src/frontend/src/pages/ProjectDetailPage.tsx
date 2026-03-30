import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import {
  type Task,
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
  projectId: bigint;
  navigate: (p: Page) => void;
}

const tsToDate = (ts: bigint) =>
  ts ? new Date(Number(ts) / 1_000_000).toLocaleDateString() : "\u2014";
const tsToTime = (ts: bigint) => {
  if (!ts) return "\u2014";
  const d = new Date(Number(ts) / 1_000_000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const fmtCurrency = (v: bigint) => `$${(Number(v) / 100).toFixed(2)}`;

const statusColor = (s: Variant_cancelled_pending_completed) => {
  if (s === Variant_cancelled_pending_completed.completed)
    return "bg-green-900/50 text-green-400 border-green-700/50";
  if (s === Variant_cancelled_pending_completed.pending)
    return "bg-amber-900/50 text-amber-400 border-amber-700/50";
  return "bg-red-900/50 text-red-400 border-red-700/50";
};

export default function ProjectDetailPage({
  actor,
  projectId,
  navigate,
}: Props) {
  const qc = useQueryClient();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    hoursSpent: "0",
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId.toString()],
    queryFn: () => actor.getProject(projectId),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", projectId.toString()],
    queryFn: () => actor.listTasksByProject(projectId),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["project-invoices", projectId.toString()],
    queryFn: () => actor.listInvoicesByProject(projectId),
  });

  const createTask = useMutation({
    mutationFn: () =>
      actor.createTask({
        id: 0n,
        projectId,
        title: taskForm.title,
        description: taskForm.description,
        completed: false,
        hoursSpent: BigInt(Number.parseInt(taskForm.hoursSpent || "0")),
        createdAt: BigInt(Date.now()) * 1_000_000n,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId.toString()] });
      setShowTaskForm(false);
      setTaskForm({ title: "", description: "", hoursSpent: "0" });
    },
  });

  const toggleTask = useMutation({
    mutationFn: (task: Task) =>
      actor.updateTask(task.id, { ...task, completed: !task.completed }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["tasks", projectId.toString()] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: bigint) => actor.deleteTask(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["tasks", projectId.toString()] }),
  });

  if (isLoading)
    return <div className="text-[#94A3B8] text-center py-20">Loading...</div>;
  if (!project)
    return (
      <div className="text-[#94A3B8] text-center py-20">Project not found</div>
    );

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalHours = tasks.reduce((sum, t) => sum + Number(t.hoursSpent), 0);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ name: "projects" })}
        className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Project Header */}
      <div className="bg-[#141E2E] border border-[#223047] rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {project.clientCompanyName || "Unnamed Project"}
            </h2>
            <p className="text-[#94A3B8] text-sm mt-1">
              {project.visitLocation}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusColor(project.status)}`}
          >
            {project.status}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
            <span>Progress</span>
            <span>{Number(project.progress)}%</span>
          </div>
          <div className="h-2 bg-[#1F2A3A] rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all"
              style={{ width: `${Number(project.progress)}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <DetailItem
            label="Project Handle (Client)"
            value={project.projectHandleClient || "\u2014"}
          />
          <DetailItem
            label="Project Handle (Team)"
            value={project.projectHandleTeam || "\u2014"}
          />
          <DetailItem label="Visit Date" value={tsToDate(project.visitDate)} />
          <DetailItem label="Time In" value={tsToTime(project.timeIn)} />
          <DetailItem label="Time Out" value={tsToTime(project.timeOut)} />
          <DetailItem
            label="Total Time"
            value={`${Number(project.totalTime)}h`}
          />
          <DetailItem
            label="Client Rate"
            value={fmtCurrency(project.clientAgreedRate)}
          />
          <DetailItem
            label="Tech Rate"
            value={fmtCurrency(project.techAgreedRate)}
          />
          <DetailItem
            label="Travel Cost"
            value={fmtCurrency(project.travelCost)}
          />
          <DetailItem
            label="Material Cost"
            value={fmtCurrency(project.materialCost)}
          />
          <DetailItem
            label="Profit"
            value={fmtCurrency(project.profit)}
            highlight
          />
          <DetailItem
            label="Client Paid"
            value={project.clientPaid ? "Yes" : "No"}
          />
          <DetailItem
            label="Tech Paid"
            value={project.techPaid ? "Yes" : "No"}
          />
          {project.techBankDetails && (
            <DetailItem
              label="Tech Bank Details"
              value={project.techBankDetails}
            />
          )}
        </div>

        {project.techDetails && (
          <div className="mt-4">
            <p className="text-xs text-[#94A3B8] mb-1">Tech Details</p>
            <p className="text-sm text-white">{project.techDetails}</p>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="bg-[#141E2E] border border-[#223047] rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#223047]">
          <div>
            <h3 className="text-white font-semibold">Tasks</h3>
            <p className="text-xs text-[#94A3B8]">
              {completedTasks}/{tasks.length} completed &bull; {totalHours}h
              total
            </p>
          </div>
          <Button
            onClick={() => setShowTaskForm(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </Button>
        </div>
        <div className="divide-y divide-[#223047]/50">
          {tasks.length === 0 ? (
            <p className="text-[#94A3B8] text-sm px-6 py-8 text-center">
              No tasks yet. Add one above.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id.toString()}
                className="flex items-start gap-3 px-6 py-4 hover:bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => toggleTask.mutate(task)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#94A3B8]" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.completed
                        ? "line-through text-[#94A3B8]"
                        : "text-white"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8]">
                      {Number(task.hoursSpent)}h
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask.mutate(task.id)}
                  className="p-1 text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Invoices */}
      <div className="bg-[#141E2E] border border-[#223047] rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#223047]">
          <h3 className="text-white font-semibold">Invoices</h3>
          <Button
            onClick={() => navigate({ name: "invoices" })}
            size="sm"
            variant="outline"
            className="border-[#223047] text-[#94A3B8] hover:text-white"
          >
            Manage Invoices
          </Button>
        </div>
        <div className="divide-y divide-[#223047]/50">
          {invoices.length === 0 ? (
            <p className="text-[#94A3B8] text-sm px-6 py-8 text-center">
              No invoices for this project.
            </p>
          ) : (
            invoices.map((inv) => (
              <button
                type="button"
                key={inv.id.toString()}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 text-left"
                onClick={() =>
                  navigate({ name: "invoice-detail", invoiceId: inv.id })
                }
              >
                <div>
                  <p className="text-sm text-white font-medium">
                    {inv.invoiceNumber}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {new Date(
                      Number(inv.invoiceDate) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">
                    ${(Number(inv.grandTotal) / 100).toFixed(2)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      inv.status === "paid"
                        ? "bg-green-900/50 text-green-400 border-green-700/50"
                        : inv.status === "unpaid"
                          ? "bg-red-900/50 text-red-400 border-red-700/50"
                          : "bg-slate-800 text-slate-400 border-slate-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="bg-[#141E2E] border-[#223047] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="task-title"
                className="block text-xs text-[#94A3B8] mb-1"
              >
                Title
              </label>
              <Input
                id="task-title"
                className="bg-[#0E1626] border-[#223047] text-white"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="task-description"
                className="block text-xs text-[#94A3B8] mb-1"
              >
                Description
              </label>
              <Input
                id="task-description"
                className="bg-[#0E1626] border-[#223047] text-white"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="task-hoursSpent"
                className="block text-xs text-[#94A3B8] mb-1"
              >
                Hours Spent
              </label>
              <Input
                id="task-hoursSpent"
                type="number"
                className="bg-[#0E1626] border-[#223047] text-white"
                value={taskForm.hoursSpent}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, hoursSpent: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTaskForm(false)}
              className="border-[#223047] text-[#94A3B8]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTask.mutate()}
              disabled={createTask.isPending || !taskForm.title}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight,
}: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[#94A3B8]">{label}</p>
      <p
        className={`text-sm font-medium mt-0.5 ${
          highlight ? "text-green-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
