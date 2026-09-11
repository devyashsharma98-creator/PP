"use client";

import { useEffect, useState } from "react";
import { Search, ShieldAlert, RefreshCw, User, X } from "lucide-react";

import { useAssignees, toAssigneeListState } from "@/hooks/api/use-assignees";
import { useT } from "@/lib/useT";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AssigneePickerProps {
  value: string;
  selectedName: string;
  onChange: (userId: string, displayName: string) => void;
  /** Only render the picker when the caller may actually assign work. */
  canAssign: boolean;
  labelId: string;
}

/**
 * Scoped assignee search. The four outcomes a picker can have — still loading,
 * not permitted, request failed, nobody matched — are each shown distinctly,
 * because "no members found" is a very different message from "you are not
 * allowed to see this list".
 */
export function AssigneePicker({
  value,
  selectedName,
  onChange,
  canAssign,
  labelId,
}: AssigneePickerProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(handle);
  }, [search]);

  const query = useAssignees(debounced, canAssign);
  const state = toAssigneeListState(query, debounced);

  if (!canAssign) {
    return (
      <div
        className="rounded-md border border-dashed p-3 text-xs text-muted-foreground"
        role="note"
      >
        {t(
          "You can update this task but not change who it is assigned to.",
          "आप यह कार्य अद्यतन कर सकते हैं, पर जिम्मेदारी नहीं बदल सकते।",
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          className="pl-8 pr-8"
          placeholder={t("Search members...", "सदस्य खोजें...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-labelledby={labelId}
          aria-describedby={`${labelId}-status`}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-2.5"
            onClick={() => {
              onChange("", "");
              setSearch("");
            }}
            aria-label={t("Clear assignee", "जिम्मेदार हटाएँ")}
          >
            <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
      </div>

      {value && selectedName && (
        <p className="text-[11px] text-muted-foreground">
          {t("Assigned to", "सौंपा गया")}: <span className="font-medium text-foreground">{selectedName}</span>
        </p>
      )}

      <div
        id={`${labelId}-status`}
        role="listbox"
        aria-label={t("Assignable members", "नियुक्त करने योग्य सदस्य")}
        aria-busy={state.kind === "loading"}
        className="max-h-40 overflow-y-auto rounded-md border"
      >
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 p-3 text-xs text-muted-foreground" role="status">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            {t("Searching members…", "सदस्य खोजे जा रहे हैं…")}
          </p>
        )}

        {state.kind === "forbidden" && (
          <p className="flex items-start gap-2 p-3 text-xs text-amber-700 dark:text-amber-400" role="status">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {t(
                "You do not have the authority to assign work. Ask a unit head to assign this task.",
                "आपके पास कार्य सौंपने का अधिकार नहीं है। यह कार्य सौंपने हेतु इकाई प्रमुख से कहें।",
              )}
            </span>
          </p>
        )}

        {state.kind === "failed" && (
          <div className="space-y-2 p-3" role="alert">
            <p className="text-xs text-destructive">
              {t(
                "The member list could not be loaded.",
                "सदस्य सूची लोड नहीं हो सकी।",
              )}
            </p>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={state.retry}>
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden="true" />
              {t("Try again", "पुनः प्रयास करें")}
            </Button>
          </div>
        )}

        {state.kind === "empty" && (
          <p className="p-3 text-xs text-muted-foreground" role="status">
            {state.searching
              ? t("No member matches that name.", "उस नाम का कोई सदस्य नहीं मिला।")
              : t(
                  "No members are within your scope to assign.",
                  "आपके क्षेत्र में सौंपने योग्य कोई सदस्य नहीं है।",
                )}
          </p>
        )}

        {state.kind === "ready" &&
          state.options.map((user) => {
            const name = user.displayName ?? user.displayNameHi ?? "";
            const selected = value === user.id;
            return (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  selected ? "bg-primary/10 font-medium" : ""
                }`}
                onClick={() => onChange(selected ? "" : user.id, selected ? "" : name)}
              >
                <User className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block break-words">{name}</span>
                  {user.responsibility && (
                    <span className="block text-[10px] text-muted-foreground break-words">
                      {user.responsibility}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
