import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { Client, backendInterface } from "../backend";
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

type ClientForm = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

const emptyForm = (): ClientForm => ({
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  website: "",
});

const clientToForm = (c: Client): ClientForm => ({
  companyName: c.companyName,
  contactName: c.contactName,
  email: c.email,
  phone: c.phone,
  address: c.address,
  website: c.website,
});

export default function ClientsPage({ actor, navigate: _navigate }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm());

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => actor.listClients(),
  });

  const createMutation = useMutation({
    mutationFn: (f: ClientForm) =>
      actor.createClient({
        id: 0n,
        ...f,
        createdAt: BigInt(Date.now()) * 1_000_000n,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: bigint; f: ClientForm }) =>
      actor.updateClient(id, { id, ...f, createdAt: 0n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm());
    setShowForm(true);
  };
  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm(clientToForm(c));
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingClient) updateMutation.mutate({ id: editingClient.id, f: form });
    else createMutation.mutate(form);
  };

  const filtered = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141E2E] border-[#223047] text-white placeholder:text-[#94A3B8]"
          />
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-[#94A3B8] col-span-3 py-8 text-center">
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-[#94A3B8] col-span-3 py-8 text-center">
            No clients found
          </p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id.toString()}
              className="bg-[#141E2E] border border-[#223047] rounded-xl p-5 hover:border-blue-600/40 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-white font-semibold">{c.companyName}</h3>
              <p className="text-[#94A3B8] text-sm">{c.contactName}</p>
              <div className="mt-3 space-y-1">
                {c.email && <p className="text-xs text-[#94A3B8]">{c.email}</p>}
                {c.phone && <p className="text-xs text-[#94A3B8]">{c.phone}</p>}
                {c.website && (
                  <p className="text-xs text-blue-400 truncate">{c.website}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#141E2E] border-[#223047] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingClient ? "Edit Client" : "New Client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(
              [
                "companyName",
                "contactName",
                "email",
                "phone",
                "address",
                "website",
              ] as (keyof ClientForm)[]
            ).map((field) => (
              <div key={field}>
                <label className="block text-xs text-[#94A3B8] mb-1 capitalize">
                  {field.replace(/([A-Z])/g, " $1")}
                </label>
                <Input
                  className="bg-[#0E1626] border-[#223047] text-white"
                  value={form[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
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
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
