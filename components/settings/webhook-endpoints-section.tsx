"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createWebhookEndpointAction,
  deleteWebhookEndpointAction,
  getWebhookSecretAction,
  updateWebhookEndpointAction,
} from "@/app/actions/webhooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useDirtyState } from "@/hooks/use-dirty-state";
import {
  ALL_WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  type WebhookEvent,
} from "@/lib/webhooks/events";

// Arrays aren't reference-comparable, so dirty-tracking compares a stable,
// order-independent string form of the selected events instead.
function eventsKey(events: string[]): string {
  return [...events].sort().join(",");
}

interface Endpoint {
  consecutiveFailures: number;
  createdAt: Date;
  disabledReason: string | null;
  events: string[];
  id: string;
  isEnabled: boolean;
  updatedAt: Date;
  url: string;
  workspaceId: string;
}

interface Props {
  encryptionAvailable: boolean;
  endpoints: Endpoint[];
  workspaceId: string;
}

function SecretDisplay({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-ir-sm border border-ir-border bg-ir-muted-surface p-2.5 font-mono text-xs break-all">
      <span className="flex-1 select-all">{secret}</span>
      <button
        className="shrink-0 rounded-ir-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
        onClick={copy}
        type="button"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

interface EndpointFormProps {
  endpointId?: string;
  initialEvents?: string[];
  initialUrl?: string;
  onCancel?: () => void;
  onSuccess: () => void;
  workspaceId: string;
}

function EndpointForm({
  workspaceId,
  onSuccess,
  onCancel,
  initialUrl = "",
  initialEvents = [],
  endpointId,
}: EndpointFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [events, setEvents] = useState<string[]>(initialEvents);
  const [urlError, setUrlError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { isDirty, markClean } = useDirtyState({
    url,
    events: eventsKey(events),
  });

  function toggleEvent(ev: WebhookEvent) {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError("");

    if (!url.startsWith("https://")) {
      setUrlError("URL must start with https://");
      return;
    }
    if (events.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    startTransition(async () => {
      let result: { success: boolean; error?: string; data?: unknown };

      if (endpointId) {
        result = await updateWebhookEndpointAction({
          endpointId,
          workspaceId,
          url,
          events,
        });
      } else {
        result = await createWebhookEndpointAction({
          workspaceId,
          url,
          events,
        });
      }

      if (!result.success) {
        toast.error((result as { error: string }).error);
        return;
      }

      if (endpointId) {
        toast.success("Endpoint updated");
      } else {
        const rawKey = (result as { data: { secret: string } }).data.secret;
        toast.success(`Endpoint created. Secret: ${rawKey}`, {
          duration: 10_000,
          description: "Store this secret now — it won't be shown again.",
        });
      }

      markClean({ url, events: eventsKey(events) });
      onSuccess();
    });
  }

  return (
    <form
      className="space-y-4 rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs"
      onSubmit={handleSubmit}
    >
      <p className="text-sm font-medium text-ir-heading">
        {endpointId ? "Edit endpoint" : "New endpoint"}
      </p>

      <div>
        <label
          className="mb-1 block text-xs font-medium text-ir-heading"
          htmlFor="wh-url"
        >
          URL
        </label>
        <Input
          disabled={isPending}
          id="wh-url"
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhook"
          required
          type="url"
          value={url}
        />
        {urlError && <p className="mt-1 text-xs text-ir-danger">{urlError}</p>}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-ir-heading">Events</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_WEBHOOK_EVENTS.map((ev) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a Radix custom control nested inside the label, which already associates it correctly
            <label className="flex cursor-pointer items-center gap-2" key={ev}>
              <Checkbox
                checked={events.includes(ev)}
                disabled={isPending}
                onCheckedChange={() => toggleEvent(ev)}
              />
              <span className="text-xs text-ir-heading">
                {WEBHOOK_EVENT_LABELS[ev]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        )}
        <Button disabled={isPending || !isDirty} type="submit">
          {isPending
            ? "Saving…"
            : endpointId
              ? "Save changes"
              : "Create endpoint"}
        </Button>
      </div>
    </form>
  );
}

export function WebhookEndpointsSection({
  workspaceId,
  endpoints,
  encryptionAvailable,
}: Props) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<{
    id: string;
    secret: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleEnabled(endpoint: Endpoint) {
    startTransition(async () => {
      const result = await updateWebhookEndpointAction({
        endpointId: endpoint.id,
        workspaceId,
        isEnabled: !endpoint.isEnabled,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        endpoint.isEnabled ? "Endpoint disabled" : "Endpoint enabled"
      );
      router.refresh();
    });
  }

  function handleRevealSecret(endpoint: Endpoint) {
    startTransition(async () => {
      const result = await getWebhookSecretAction({
        endpointId: endpoint.id,
        workspaceId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRevealedSecret({ id: endpoint.id, secret: result.data.secret });
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    startTransition(async () => {
      const result = await deleteWebhookEndpointAction({
        endpointId: deleteTarget.id,
        workspaceId,
      });
      setDeleteTarget(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Endpoint deleted");
      router.refresh();
    });
  }

  if (!encryptionAvailable) {
    return (
      <div className="rounded-ir-card border border-dashed border-ir-border p-8 text-center">
        <p className="text-sm font-medium text-ir-heading">
          Webhooks unavailable
        </p>
        <p className="mt-1 text-xs text-ir-muted">
          The{" "}
          <code className="rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
            ENCRYPTION_KEY
          </code>{" "}
          environment variable is not configured. Contact your server
          administrator.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ir-heading">Endpoints</h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            Events are sent as signed POST requests to your HTTPS URL.
          </p>
        </div>
        {!showCreateForm && (
          <Button
            className="shrink-0"
            onClick={() => setShowCreateForm(true)}
            type="button"
          >
            Add endpoint
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-4">
          <EndpointForm
            onCancel={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              router.refresh();
            }}
            workspaceId={workspaceId}
          />
        </div>
      )}

      {endpoints.length === 0 && !showCreateForm ? (
        <div className="rounded-ir-card border border-dashed border-ir-border p-8 text-center">
          <p className="text-sm text-ir-muted">
            No webhook endpoints configured.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ir-border overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
          {endpoints.map((ep) => (
            <div key={ep.id}>
              {editingId === ep.id ? (
                <div className="p-4">
                  <EndpointForm
                    endpointId={ep.id}
                    initialEvents={ep.events}
                    initialUrl={ep.url}
                    onCancel={() => setEditingId(null)}
                    onSuccess={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                    workspaceId={workspaceId}
                  />
                </div>
              ) : (
                <div className="p-4 transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-mono text-sm font-medium text-ir-heading">
                          {ep.url}
                        </p>
                        <span
                          className={`inline-block shrink-0 rounded-ir-xs px-1.5 py-0.5 text-2xs font-medium ${
                            ep.isEnabled
                              ? "bg-ir-success/10 text-ir-success"
                              : "bg-ir-muted-surface text-ir-muted"
                          }`}
                        >
                          {ep.isEnabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ir-muted">
                        {ep.events.length} event
                        {ep.events.length === 1 ? "" : "s"}
                        {ep.consecutiveFailures > 0 && (
                          <span className="ml-2 text-ir-danger">
                            {ep.consecutiveFailures} consecutive failure
                            {ep.consecutiveFailures === 1 ? "" : "s"}
                          </span>
                        )}
                      </p>
                      {revealedSecret?.id === ep.id && (
                        <SecretDisplay secret={revealedSecret.secret} />
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button
                        disabled={isPending}
                        onClick={() => handleRevealSecret(ep)}
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        Secret
                      </Button>
                      <Button
                        disabled={isPending}
                        onClick={() => setEditingId(ep.id)}
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={isPending}
                        onClick={() => handleToggleEnabled(ep)}
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        {ep.isEnabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        disabled={isPending}
                        onClick={() => setDeleteTarget(ep)}
                        size="xs"
                        type="button"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Delete endpoint"
        description={`Delete the webhook endpoint "${deleteTarget?.url ?? ""}"? All delivery history will also be deleted.`}
        isPending={isPending}
        onConfirm={handleDeleteConfirm}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
        title="Delete endpoint"
        variant="destructive"
      />
    </section>
  );
}
