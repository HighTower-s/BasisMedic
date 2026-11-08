export type EvalCategory =
  | "memory_dump"
  | "timeout"
  | "job_failure"
  | "lock_issue"
  | "update_error"
  | "transport_error"
  | "user_auth"
  | "rfc_error"
  | "out_of_scope";

export type EscalateTo = "basis" | "developer" | "security" | "dba" | "network" | "sap_support";
export type Confidence = "high" | "medium" | "low";

export interface TriageStep {
  action: string;
  tcode: string | null;
}

export interface TriageResult {
  category: EvalCategory;
  summary: string;
  tcodes: string[];
  unverified_tcodes: string[];
  steps: TriageStep[];
  escalate_to: EscalateTo | null;
  sources: string[];
  confidence: Confidence;
}

export const CATEGORY_LABEL: Record<EvalCategory, string> = {
  memory_dump: "Memory / Short Dump",
  timeout: "Timeout",
  job_failure: "Background Jobs",
  lock_issue: "Lock",
  update_error: "Update",
  transport_error: "Transport",
  user_auth: "Authorization",
  rfc_error: "RFC",
  out_of_scope: "Out of scope",
};

export class TriageApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function runTriage(log: string): Promise<TriageResult> {
  const res = await fetch("/api/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ log }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && (body.error ?? (Array.isArray(body.detail) ? body.detail.map((d: { msg: string }) => d.msg).join(", ") : body.detail))) ||
      res.statusText;
    throw new TriageApiError(res.status, message);
  }
  return res.json();
}
