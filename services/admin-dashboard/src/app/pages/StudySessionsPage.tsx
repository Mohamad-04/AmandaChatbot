import { useState, useEffect, useId } from "react";
import { BookOpen, RefreshCw, UserCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Assignment {
  email: string;
  project_key: string;
  session_number: number;
}

type SaveState = "idle" | "loading" | "success" | "error";

const SESSION_LABELS: Record<number, string> = {
  1: "Session 1 – Parent–child relationship",
  2: "Session 2 – Praise & communication",
  3: "Session 3 – Routines & conflict",
  4: "Session 4 – Parental stress",
  5: "Session 5 – Pressure & guilt",
  6: "Session 6 – Final reflection",
};

export function StudySessionsPage() {
  const emailId = useId();
  const sessionId = useId();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);

  const [email, setEmail] = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function fetchAssignments() {
    setLoadingTable(true);
    fetch("/api/admin/study-assignments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setAssignments(Array.isArray(d) ? d : []);
        setLoadingTable(false);
      })
      .catch(() => setLoadingTable(false));
  }

  useEffect(() => {
    fetchAssignments();
  }, []);

  function validateEmail(value: string): boolean {
    if (!value.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setSaveState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/study-user", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), session_number: sessionNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to save assignment.");
        setSaveState("error");
        return;
      }
      setSaveState("success");
      setEmail("");
      setSessionNumber(1);
      fetchAssignments();
      setTimeout(() => setSaveState("idle"), 3000);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSaveState("error");
    }
  }

  function toggleSelect(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === assignments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(assignments.map((a) => a.email)));
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/study-user", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelected(new Set());
        fetchAssignments();
      }
    } catch {
      // silent — table will stay unchanged
    } finally {
      setDeleting(false);
    }
  }

  const allSelected = assignments.length > 0 && selected.size === assignments.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 style={{ fontFamily: "Lexend Deca" }}>Study Sessions</h1>
        <p className="text-muted-foreground mt-1">
          Manage Romanian ADHD study participant assignments
        </p>
      </div>

      {/* Assignment form */}
      <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm max-w-lg">
        <div className="flex items-center gap-2 mb-5">
          <UserCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold" style={{ fontFamily: "Lexend Deca" }}>
            Assign Participant
          </h2>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={emailId}>Participant email</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="participant@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              aria-describedby={emailError ? `${emailId}-error` : undefined}
              aria-invalid={!!emailError}
              className="rounded-lg bg-input/50 border-border"
            />
            {emailError && (
              <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={sessionId}>Session</Label>
            <select
              id={sessionId}
              value={sessionNumber}
              onChange={(e) => setSessionNumber(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {SESSION_LABELS[n]}
                </option>
              ))}
            </select>
          </div>

          {saveState === "error" && errorMsg && (
            <p className="text-sm text-destructive" role="alert">
              {errorMsg}
            </p>
          )}

          <div
            aria-live="polite"
            aria-atomic="true"
            className={`text-sm font-medium transition-opacity duration-300 ${
              saveState === "success"
                ? "text-green-600 dark:text-green-400 opacity-100"
                : "opacity-0 select-none"
            }`}
          >
            {saveState === "success" ? "Assignment saved successfully." : "\u00A0"}
          </div>

          <Button
            type="submit"
            disabled={saveState === "loading"}
            className="rounded-full w-full"
          >
            {saveState === "loading" ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                Saving…
              </span>
            ) : (
              "Save Assignment"
            )}
          </Button>
        </form>
      </div>

      {/* Assignments table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold" style={{ fontFamily: "Lexend Deca" }}>
              Current Assignments
            </h2>
            {selected.size > 0 && (
              <span className="text-sm text-muted-foreground ml-1">
                {selected.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                )}
                Delete{selected.size > 1 ? ` (${selected.size})` : ""}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={fetchAssignments}
              aria-label="Refresh assignments"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      aria-label="Select all participants"
                      className="rounded cursor-pointer accent-primary w-4 h-4"
                      disabled={loadingTable || assignments.length === 0}
                    />
                  </th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Project</th>
                  <th className="text-left p-4 font-medium">Session</th>
                  <th className="text-left p-4 font-medium">Session Title</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No participants assigned yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a, index) => {
                    const isSelected = selected.has(a.email);
                    return (
                      <tr
                        key={a.email}
                        onClick={() => toggleSelect(a.email)}
                        className={`border-b border-border/50 cursor-pointer transition-colors ${
                          index === assignments.length - 1 ? "border-b-0" : ""
                        } ${isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-accent/30"}`}
                      >
                        <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(a.email)}
                            aria-label={`Select ${a.email}`}
                            className="rounded cursor-pointer accent-primary w-4 h-4"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium text-sm shrink-0">
                              {a.email.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm">{a.email}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {a.project_key.replace(/_/g, " ")}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-semibold text-sm">
                            {a.session_number}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {SESSION_LABELS[a.session_number] ?? `Session ${a.session_number}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
