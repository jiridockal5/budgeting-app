"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Loader2,
  Trash2,
  Crown,
  Building2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  inviteEmail: string | null;
  inviteAccepted: boolean;
}

interface Org {
  id: string;
  name: string;
  userId: string;
  members: Member[];
  _count: { plans: number };
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: Users,
  VIEWER: Eye,
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  MEMBER:
    "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
  VIEWER:
    "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
};

export default function TeamPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">(
    "MEMBER"
  );
  const [inviting, setInviting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    memberId: string;
    orgId: string;
    email: string;
  } | null>(null);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/organization");
      const data = await res.json();
      if (data.success) setOrgs(data.data);
    } catch {
      toast("Failed to load organizations", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Organization created");
        setOrgName("");
        setShowCreateOrg(false);
        fetchOrgs();
      } else {
        toast(data.error || "Failed to create organization", "error");
      }
    } catch {
      toast("Failed to create organization", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !showInvite) return;
    setInviting(true);
    try {
      const res = await fetch("/api/organization/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: showInvite,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Invited ${inviteEmail.trim()}`);
        setInviteEmail("");
        setShowInvite(null);
        fetchOrgs();
      } else {
        toast(data.error || "Failed to invite member", "error");
      }
    } catch {
      toast("Failed to invite member", "error");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember() {
    if (!deleteTarget) return;
    try {
      const params = new URLSearchParams({
        memberId: deleteTarget.memberId,
        organizationId: deleteTarget.orgId,
      });
      const res = await fetch(`/api/organization/members?${params}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast("Member removed");
        fetchOrgs();
      } else {
        toast(data.error || "Failed to remove member", "error");
      }
    } catch {
      toast("Failed to remove member", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <FormSectionSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle="Manage organizations and team members"
        actions={
          <button
            onClick={() => setShowCreateOrg(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            New Organization
          </button>
        }
      />

      {showCreateOrg && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create Organization
          </h3>
          <form onSubmit={handleCreateOrg} className="flex gap-3">
            <input
              type="text"
              placeholder="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={creating || !orgName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateOrg(false);
                setOrgName("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {orgs.length === 0 && !showCreateOrg ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No organizations yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create an organization to collaborate with your team on forecasts.
          </p>
          <button
            onClick={() => setShowCreateOrg(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Create Organization
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              showInvite={showInvite}
              setShowInvite={setShowInvite}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              inviteRole={inviteRole}
              setInviteRole={setInviteRole}
              inviting={inviting}
              onInvite={handleInvite}
              onRemove={(memberId, email) =>
                setDeleteTarget({ memberId, orgId: org.id, email })
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Member"
        message={`Remove ${deleteTarget?.email ?? "this member"} from the organization?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemoveMember}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function OrgCard({
  org,
  showInvite,
  setShowInvite,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviting,
  onInvite,
  onRemove,
}: {
  org: Org;
  showInvite: string | null;
  setShowInvite: (id: string | null) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: "ADMIN" | "MEMBER" | "VIEWER";
  setInviteRole: (v: "ADMIN" | "MEMBER" | "VIEWER") => void;
  inviting: boolean;
  onInvite: (e: React.FormEvent) => void;
  onRemove: (memberId: string, email: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {org.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {org.members.length} member{org.members.length !== 1 ? "s" : ""} &middot;{" "}
            {org._count.plans} plan{org._count.plans !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() =>
            setShowInvite(showInvite === org.id ? null : org.id)
          }
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>
      </div>

      {showInvite === org.id && (
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <form
            onSubmit={onInvite}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(
                    e.target.value as "ADMIN" | "MEMBER" | "VIEWER"
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invite
            </button>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {org.members.map((member) => {
          const Icon = ROLE_ICONS[member.role] ?? Users;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-6 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.inviteEmail || member.userId}
                  </span>
                  {!member.inviteAccepted && (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ROLE_COLORS[member.role]
                  }`}
                >
                  {ROLE_LABELS[member.role]}
                </span>
                {member.role !== "OWNER" && (
                  <button
                    onClick={() =>
                      onRemove(
                        member.id,
                        member.inviteEmail || member.userId
                      )
                    }
                    className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
