import type { Principal } from "@icp-sdk/core/principal";
import { CheckCircle, Loader2, Shield, UserMinus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { Page } from "../App";
import { UserRole } from "../backend";
import type { backendInterface } from "../backend";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

// UserEntry type — mirrors what the backend returns for listAllUsers
export interface UserEntry {
  principal: Principal;
  role: UserRole;
}

// Extended actor interface for user-management methods added by the
// authorization component (not yet reflected in the generated backend.ts)
interface UserMgmtActor extends backendInterface {
  listAllUsers(): Promise<Array<UserEntry>>;
  removeUser(user: Principal): Promise<void>;
}

interface UserManagementPageProps {
  actor: backendInterface;
  navigate: (page: Page) => void;
  identity: { getPrincipal: () => { toString: () => string } };
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    [UserRole.admin]:
      "bg-blue-500/15 text-blue-400 border border-blue-500/30 ring-0",
    [UserRole.user]:
      "bg-green-500/15 text-green-400 border border-green-500/30 ring-0",
    [UserRole.guest]:
      "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 ring-0",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize ${
        styles[role] ?? "bg-gray-500/15 text-gray-400 border border-gray-500/30"
      }`}
    >
      {role === UserRole.admin && <Shield className="w-3 h-3 mr-1" />}
      {role}
    </span>
  );
}

export default function UserManagementPage({
  actor,
  navigate: _navigate,
  identity,
}: UserManagementPageProps) {
  const mgmtActor = actor as unknown as UserMgmtActor;

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const currentPrincipal = identity.getPrincipal().toString();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await mgmtActor.listAllUsers();
      setUsers(result);
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only load
  useEffect(() => {
    loadUsers();
  }, []);

  const withAction = async (key: string, fn: () => Promise<void>) => {
    setActionKey(key);
    try {
      await fn();
      await loadUsers();
    } catch (e) {
      console.error("Action failed:", e);
    } finally {
      setActionKey(null);
    }
  };

  const handleApprove = (principal: Principal) =>
    withAction(principal.toString(), () =>
      actor.assignCallerUserRole(principal, UserRole.user),
    );

  const handlePromote = (principal: Principal) =>
    withAction(principal.toString(), () =>
      actor.assignCallerUserRole(principal, UserRole.admin),
    );

  const handleRemove = (principal: Principal) =>
    withAction(principal.toString(), () => mgmtActor.removeUser(principal));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-[#94A3B8] mt-1 text-sm">
            Approve new users and manage access roles
          </p>
        </div>
        <Button
          data-ocid="users.refresh.button"
          onClick={loadUsers}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-[#223047] text-[#94A3B8] hover:text-white hover:bg-white/5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {(
          [
            [
              "Admins",
              users.filter((u) => u.role === UserRole.admin).length,
              "text-blue-400",
              "bg-blue-500/10 border-blue-500/20",
            ],
            [
              "Users",
              users.filter((u) => u.role === UserRole.user).length,
              "text-green-400",
              "bg-green-500/10 border-green-500/20",
            ],
            [
              "Pending",
              users.filter((u) => u.role === UserRole.guest).length,
              "text-yellow-400",
              "bg-yellow-500/10 border-yellow-500/20",
            ],
          ] as const
        ).map(([label, count, textColor, cardColor]) => (
          <div
            key={label}
            className={`rounded-xl border px-4 py-3 ${cardColor}`}
          >
            <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
            <p className="text-[#94A3B8] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-[#141E2E] border border-[#223047] rounded-2xl overflow-hidden">
        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-ocid="users.loading_state"
          >
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-[#94A3B8] text-sm">Loading users&hellip;</p>
          </div>
        ) : users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center gap-3"
            data-ocid="users.empty_state"
          >
            <div className="w-12 h-12 bg-[#0B1220] rounded-full flex items-center justify-center border border-[#223047]">
              <Users className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <div>
              <p className="text-white font-medium">No users yet</p>
              <p className="text-[#94A3B8] text-sm mt-1">
                Users will appear here once they sign in
              </p>
            </div>
          </div>
        ) : (
          <Table data-ocid="users.table">
            <TableHeader>
              <TableRow className="border-[#223047] hover:bg-transparent">
                <TableHead className="text-[#94A3B8] font-medium">
                  Principal
                </TableHead>
                <TableHead className="text-[#94A3B8] font-medium">
                  Role
                </TableHead>
                <TableHead className="text-[#94A3B8] font-medium">
                  Status
                </TableHead>
                <TableHead className="text-[#94A3B8] font-medium text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((entry, idx) => {
                const principalStr = entry.principal.toString();
                const isCurrentUser = principalStr === currentPrincipal;
                const isBusy = actionKey === principalStr;

                return (
                  <TableRow
                    key={principalStr}
                    className="border-[#223047] hover:bg-white/[0.02] transition-colors"
                    data-ocid={`users.item.${idx + 1}`}
                  >
                    {/* Principal */}
                    <TableCell className="font-mono text-[#94A3B8] text-sm">
                      <span title={principalStr}>
                        {principalStr.slice(0, 12)}&hellip;
                      </span>
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-blue-400 font-sans">
                          (you)
                        </span>
                      )}
                    </TableCell>

                    {/* Role badge */}
                    <TableCell>
                      <RoleBadge role={entry.role} />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {entry.role === UserRole.guest ? (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400">
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                          Awaiting approval
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve guest */}
                        {entry.role === UserRole.guest && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => handleApprove(entry.principal)}
                            data-ocid={`users.confirm_button.${idx + 1}`}
                            className="h-7 px-2.5 text-xs bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/20"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            Approve
                          </Button>
                        )}

                        {/* Promote user → admin */}
                        {entry.role === UserRole.user && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => handlePromote(entry.principal)}
                            data-ocid={`users.edit_button.${idx + 1}`}
                            className="h-7 px-2.5 text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Shield className="w-3 h-3 mr-1" />
                            )}
                            Make Admin
                          </Button>
                        )}

                        {/* Remove — not for current user or admins */}
                        {!isCurrentUser && entry.role !== UserRole.admin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => handleRemove(entry.principal)}
                            data-ocid={`users.delete_button.${idx + 1}`}
                            className="h-7 px-2.5 text-xs bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserMinus className="w-3 h-3 mr-1" />
                            )}
                            Remove
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
