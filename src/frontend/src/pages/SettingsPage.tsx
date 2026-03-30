import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { Page } from "../App";
import type { backendInterface } from "../backend";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";

interface Props {
  actor: backendInterface;
  navigate: (p: Page) => void;
}

export default function SettingsPage({ actor, navigate: _navigate }: Props) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => actor.getCompanySettings(),
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => actor.updateCompanySettings(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const inputClass =
    "bg-[#0E1626] border-[#223047] text-white placeholder:text-[#94A3B8] focus:border-blue-500";
  const labelClass = "block text-xs text-[#94A3B8] mb-1";
  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="bg-[#141E2E] border-[#223047]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <CardTitle className="text-white">Company Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="settings-companyName" className={labelClass}>
              Company Name
            </label>
            <Input
              id="settings-companyName"
              className={inputClass}
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="settings-address" className={labelClass}>
              Address
            </label>
            <Input
              id="settings-address"
              className={inputClass}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-phone" className={labelClass}>
                Phone
              </label>
              <Input
                id="settings-phone"
                className={inputClass}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="settings-email" className={labelClass}>
                Email
              </label>
              <Input
                id="settings-email"
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="settings-website" className={labelClass}>
              Website
            </label>
            <Input
              id="settings-website"
              className={inputClass}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
            {saved && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Saved successfully
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
