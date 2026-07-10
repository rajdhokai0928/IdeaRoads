"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  generateApiKeyAction,
  revokeApiKeyAction,
} from "@/app/actions/api-keys";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

interface ApiKey {
  createdAt: Date;
  id: string;
  isEnabled: boolean;
  lastUsedAt: Date | null;
  name: string;
}

interface Props {
  keys: ApiKey[];
  workspaceId: string;
}

function NewKeyDisplay({ rawKey }: { rawKey: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-4 rounded-ir-card border border-ir-border bg-ir-muted-surface p-4">
      <p className="mb-1 text-sm font-medium text-ir-heading">
        Your new API key — copy it now
      </p>
      <p className="mb-3 text-xs text-ir-muted">
        This key will not be shown again. Store it securely.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-ir-sm border border-ir-border bg-ir-surface px-2.5 py-2 text-xs break-all text-ir-heading">
          {rawKey}
        </code>
        <Button onClick={copy} size="sm" type="button" variant="outline">
          {copied ? (
            <>
              <CheckIcon className="text-ir-success" data-icon="inline-start" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon data-icon="inline-start" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function ApiKeysSection({ workspaceId, keys }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNewKey(null);

    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }

    startTransition(async () => {
      const result = await generateApiKeyAction({
        workspaceId,
        name: name.trim(),
      });

      if (!result.success) {
        setNameError(result.error);
        return;
      }

      setNewKey(result.data.rawKey);
      setName("");
      router.refresh();
    });
  }

  function handleRevokeConfirm() {
    if (!revokeTarget) {
      return;
    }
    startTransition(async () => {
      const result = await revokeApiKeyAction({
        keyId: revokeTarget.id,
        workspaceId,
      });
      setRevokeTarget(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`API key "${revokeTarget.name}" revoked`);
      router.refresh();
    });
  }

  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

  return (
    <section>
      {/* Create form */}
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ir-heading">Create key</h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            Keys are prefixed with{" "}
            <code className="rounded-ir-xs bg-ir-muted-surface px-1 py-0.5 text-xs">
              ir_live_
            </code>{" "}
            and grant workspace-level access.
          </p>
        </div>

        <form
          className="rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs"
          onSubmit={handleGenerate}
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                aria-label="Key name"
                disabled={isPending}
                maxLength={64}
                onChange={(e) => setName(e.target.value)}
                placeholder="Key name (e.g. CI pipeline)"
                type="text"
                value={name}
              />
              {nameError && (
                <p className="mt-1 text-xs text-ir-danger">{nameError}</p>
              )}
            </div>
            <Button disabled={isPending || !name.trim()} type="submit">
              {isPending ? "Creating…" : "Create key"}
            </Button>
          </div>
        </form>

        {newKey && <NewKeyDisplay rawKey={newKey} />}
      </div>

      {/* Keys list */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ir-heading">Active keys</h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            {keys.length} key{keys.length === 1 ? "" : "s"} total
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-ir-card border border-dashed border-ir-border p-8 text-center">
            <p className="text-sm text-ir-muted">No API keys created yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-ir-border overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
            {keys.map((key) => (
              <div
                className="flex flex-col gap-2 p-4 transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface sm:flex-row sm:items-center sm:gap-4"
                key={key.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ir-heading">
                    {key.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ir-muted">
                    Created {fmt.format(new Date(key.createdAt))}
                    {key.lastUsedAt
                      ? ` · Last used ${fmt.format(new Date(key.lastUsedAt))}`
                      : " · Never used"}
                  </p>
                </div>
                <Button
                  className="shrink-0"
                  disabled={isPending}
                  onClick={() => setRevokeTarget(key)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Revoke key"
        description={`Revoke "${revokeTarget?.name ?? ""}"? Any systems using this key will immediately lose access.`}
        isPending={isPending}
        onConfirm={handleRevokeConfirm}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        open={!!revokeTarget}
        title="Revoke API key"
        variant="destructive"
      />
    </section>
  );
}
