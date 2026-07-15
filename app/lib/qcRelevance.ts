import type { UserType } from "../context/UserContext";

// Which real inspectionTypes are relevant to each supply-side viewer, and
// what label to show for each on cards/modals. "Pre-production" and "In-line"
// are hidden by name for these viewers — "In-line" capability is instead
// surfaced under a role-appropriate label (e.g. "Product Quality Check").
// Buyers (and any type not listed here) see every real type, unrelabelled.
type QcTypeMapping = { matchType: string; label: string };

const QC_RELEVANT_TYPES: Partial<Record<UserType, QcTypeMapping[]>> = {
  trim_supplier: [
    { matchType: "Pre-dispatch", label: "Pre-dispatch" },
  ],
  fabric_mill: [
    { matchType: "In-line", label: "Fabric Quality Inspection" },
    { matchType: "Pre-dispatch", label: "Pre-dispatch" },
  ],
  job_worker: [
    { matchType: "Pre-dispatch", label: "Pre-dispatch" },
    { matchType: "In-line", label: "Process Quality Check" },
  ],
  manufacturer: [
    { matchType: "Pre-production", label: "Pre-production" },
    { matchType: "In-line", label: "In-line Inspection" },
    { matchType: "Pre-dispatch", label: "Pre-dispatch" },
  ],
  artisan: [
    { matchType: "In-line", label: "Product Quality Check" },
    { matchType: "Pre-dispatch", label: "Pre-dispatch" },
  ],
};

export function getVisibleQcPills(inspectionTypes: string[], userType: UserType): string[] {
  const mapping = QC_RELEVANT_TYPES[userType];
  if (!mapping) return inspectionTypes;
  const pills: string[] = [];
  mapping.forEach(({ matchType, label }) => {
    if (inspectionTypes.includes(matchType) && !pills.includes(label)) {
      pills.push(label);
    }
  });
  return pills;
}

export function qcInspectorMatchesViewer(inspectionTypes: string[], userType: UserType): boolean {
  const mapping = QC_RELEVANT_TYPES[userType];
  if (!mapping) return true;
  return inspectionTypes.includes("Pre-dispatch");
}
