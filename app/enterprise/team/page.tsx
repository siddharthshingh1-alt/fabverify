"use client";

import { useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

const ROLE_CARDS = [
  { emoji: "👑", label: "Owner", desc: "Full access", labelClass: "text-primary" },
  { emoji: "👔", label: "Manager", desc: "All except billing", labelClass: "text-white" },
  { emoji: "📋", label: "Merchandiser", desc: "Orders and vendors", labelClass: "text-white" },
  { emoji: "✏️", label: "Designer", desc: "Styles and tech packs", labelClass: "text-white" },
  { emoji: "💰", label: "Accounts", desc: "Payments only", labelClass: "text-white" },
];

type Role = "Owner" | "Manager" | "Merchandiser" | "Designer" | "Accounts";
const INVITE_ROLES: Role[] = ["Owner", "Manager", "Merchandiser", "Designer", "Accounts"];

type PermissionKey =
  | "viewOrders"
  | "updateMilestones"
  | "approvePayments"
  | "manageTeam"
  | "viewFinancials"
  | "accessVendorMaster";

const PERMISSION_LABELS: { key: PermissionKey; label: string }[] = [
  { key: "viewOrders", label: "View all orders" },
  { key: "updateMilestones", label: "Update production milestones" },
  { key: "approvePayments", label: "Approve payments" },
  { key: "manageTeam", label: "Manage team members" },
  { key: "viewFinancials", label: "View financial reports" },
  { key: "accessVendorMaster", label: "Access vendor master" },
];

const ROLE_PERMISSIONS: Record<Role, Record<PermissionKey, boolean>> = {
  Owner: {
    viewOrders: true,
    updateMilestones: true,
    approvePayments: true,
    manageTeam: true,
    viewFinancials: true,
    accessVendorMaster: true,
  },
  Manager: {
    viewOrders: true,
    updateMilestones: true,
    approvePayments: true,
    manageTeam: false,
    viewFinancials: true,
    accessVendorMaster: true,
  },
  Merchandiser: {
    viewOrders: true,
    updateMilestones: true,
    approvePayments: false,
    manageTeam: false,
    viewFinancials: true,
    accessVendorMaster: true,
  },
  Designer: {
    viewOrders: true,
    updateMilestones: false,
    approvePayments: false,
    manageTeam: false,
    viewFinancials: false,
    accessVendorMaster: false,
  },
  Accounts: {
    viewOrders: true,
    updateMilestones: false,
    approvePayments: true,
    manageTeam: false,
    viewFinancials: true,
    accessVendorMaster: false,
  },
};

const PERMISSIONS_TABLE_ROWS = [
  { label: "Orders", values: ["✓", "✓", "✓", "view", "view"] },
  { label: "Payments", values: ["✓", "✓", "✗", "✗", "✓"] },
  { label: "Team", values: ["✓", "view", "✗", "✗", "✗"] },
  { label: "Vendors", values: ["✓", "✓", "✓", "✗", "✗"] },
  { label: "Analytics", values: ["✓", "✓", "✓", "✗", "✓"] },
  { label: "Settings", values: ["✓", "✗", "✗", "✗", "✗"] },
];

const TIPS = [
  "Start with Merchandiser role for your core team",
  "Accounts role sees payments but cannot approve them",
  "Remove access instantly if someone leaves",
];

function PermissionCell({ value }: { value: string }) {
  if (value === "✓") return <span className="text-primary">✓</span>;
  if (value === "✗") return <span className="text-red-400">✗</span>;
  return <span className="text-text-secondary">{value}</span>;
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Merchandiser");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    ROLE_PERMISSIONS.Merchandiser
  );
  const [sent, setSent] = useState(false);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setPermissions(ROLE_PERMISSIONS[nextRole]);
  };

  const togglePermission = (key: PermissionKey) => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSend = () => {
    if (!name.trim()) return;
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-5"
      onClick={onClose}
    >
      <div
        className="hide-scrollbar relative w-full max-w-[480px] rounded-xl border border-border-dark bg-card p-7"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        {sent ? (
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-4 text-sm font-bold text-white">
              Invite sent to {name}
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              They will receive a WhatsApp message with a link to join your
              workspace.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-lg font-bold text-primary">Invite Team Member</p>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Phone number
              </label>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-border-dark focus-within:border-primary">
                <span className="flex items-center bg-background px-3 text-[13px] text-text-secondary">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-background p-2.5 text-[13px] text-text-primary outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Role
              </label>
              <select
                value={role}
                onChange={(event) => handleRoleChange(event.target.value as Role)}
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                {INVITE_ROLES.map((option) => (
                  <option key={option} value={option} className="bg-card text-text-primary">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-text-primary">
                What they can access
              </p>
              <div className="flex flex-col gap-2">
                {PERMISSION_LABELS.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 text-[13px] text-text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[item.key]}
                      onChange={() => togglePermission(item.key)}
                      className="h-4 w-4 accent-[#f2ca50]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border-dark py-3 text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="flex-[2] rounded-lg bg-primary py-3 text-sm font-bold text-navy"
              >
                Send Invite →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RoleCardsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {ROLE_CARDS.map((card) => (
        <div
          key={card.label}
          className="rounded-[8px] border border-border-dark bg-card p-3 text-center"
        >
          <div className="text-2xl">{card.emoji}</div>
          <p className={`mt-1 text-[13px] font-bold ${card.labelClass}`}>{card.label}</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}

function TeamTable({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
      <div style={{ minWidth: 640 }}>
        <div className="grid grid-cols-5 gap-2 border-b border-primary/40 bg-card px-4 py-3">
          {["Name", "Role", "Status", "Joined", "Actions"].map((col) => (
            <span
              key={col}
              className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
            >
              {col}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-5 items-center gap-2 border-b border-border-dark bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-navy">
              S
            </div>
            <span className="text-[13px] font-bold text-white">Siddharth Singh</span>
          </div>
          <span className="w-fit rounded-[20px] border border-primary bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">
            Owner
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
          </span>
          <span className="text-xs text-text-secondary">July 2026</span>
          <span className="text-xs text-text-secondary">—</span>
        </div>

        <div className="grid grid-cols-5 items-center gap-2 border-b border-border-dark bg-background px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xs font-bold text-navy">
              R
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Rahul Sharma</p>
              <p className="text-[11px] text-text-secondary">rahul@company.com</p>
            </div>
          </div>
          <span className="w-fit rounded-[20px] border border-secondary bg-secondary/15 px-2.5 py-1 text-[10px] font-semibold text-secondary">
            Merchandiser
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
          </span>
          <span className="text-xs text-text-secondary">—</span>
          <span className="text-xs text-text-secondary">
            <button type="button" className="text-text-secondary hover:text-primary">Edit</button>
            {" | "}
            <button type="button" className="text-text-secondary hover:text-red-400">Remove</button>
          </span>
        </div>

        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="grid grid-cols-5 items-center gap-2 border-b border-dashed border-border-dark px-4 py-3 last:border-b-0"
          >
            <span className="col-span-4 text-[13px] italic text-text-secondary">
              Invite a team member
            </span>
            <button
              type="button"
              onClick={onInvite}
              className="w-fit rounded-lg border border-primary px-3 py-1 text-[11px] font-semibold text-primary"
            >
              + Invite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolePermissionsPanel() {
  return (
    <>
      <p className="text-sm font-bold text-white">What each role can do</p>
      <div className="mt-3 overflow-x-auto hide-scrollbar">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="pb-2 text-left text-text-secondary"> </th>
              {["Owner", "Mgr", "Merch", "Des", "Acc"].map((col) => (
                <th key={col} className="pb-2 text-center font-semibold text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS_TABLE_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-border-dark">
                <td className="py-1.5 text-text-primary">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={index} className="py-1.5 text-center">
                    <PermissionCell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-primary">💡 Pro tips</p>
      <div className="mt-3 flex flex-col gap-2">
        {TIPS.map((tip) => (
          <p key={tip} className="text-xs text-text-secondary">
            → {tip}
          </p>
        ))}
      </div>
    </>
  );
}

export default function TeamManagement() {
  const authorized = useEnterpriseAccess();
  const [showInvite, setShowInvite] = useState(false);

  if (!authorized) return null;

  const inviteButton = (
    <button
      type="button"
      onClick={() => setShowInvite(true)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
    >
      + Invite Member
    </button>
  );

  const centrePanel = (
    <>
      <TopBar
        title="My Team"
        subtitle="Manage who has access to your FabVerify workspace"
        rightContent={inviteButton}
      />

      <div className="px-6 py-6">
        <RoleCardsRow />
        <TeamTable onInvite={() => setShowInvite(true)} />
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        left={<EnterpriseLeftPanel />}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}><RolePermissionsPanel /></div>}
      />

      <div
        className="flex flex-col pb-4 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
          {inviteButton}
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">My Team</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Manage who has access to your FabVerify workspace
          </p>

          <div className="mt-4">
            <RoleCardsRow />
          </div>
          <TeamTable onInvite={() => setShowInvite(true)} />

          <div className="mt-8 rounded-xl border border-border-dark bg-card p-4">
            <RolePermissionsPanel />
          </div>
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  );
}
