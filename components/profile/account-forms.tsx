"use client";

import { Loader2, TriangleAlert, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  type ActionState,
  type AvatarActionState,
  changeEmailAction,
  deleteAccountAction,
  type NameActionState,
  removeAvatarAction,
  updateAvatarAction,
  updateNameAction,
} from "@/app/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = {};
const initialAvatarState: AvatarActionState = {};
const initialNameState: NameActionState = {};
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="bg-destructive/10 p-3 text-destructive text-sm">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="bg-success-subtle p-3 text-success-foreground text-sm">
        {state.success}
      </p>
    );
  }
  return null;
}

function AvatarUploadRow({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const [avatarState, avatarAction, avatarPending] = useActionState(
    updateAvatarAction,
    initialAvatarState
  );
  const [isRemoving, startRemoveTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState(image);
  const previousPreviewRef = useRef(image);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (avatarState.error) {
      toast.error(avatarState.error);
      setPreviewUrl(previousPreviewRef.current);
    } else if (avatarState.success && avatarState.imageUrl !== undefined) {
      setPreviewUrl(avatarState.imageUrl);
      previousPreviewRef.current = avatarState.imageUrl;
      toast.success(avatarState.success);
    }
  }, [avatarState]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error("Use a PNG, JPEG, WEBP, or GIF image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 4MB or smaller.");
      e.target.value = "";
      return;
    }

    previousPreviewRef.current = previewUrl;
    setPreviewUrl(URL.createObjectURL(file));
    formRef.current?.requestSubmit();
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const result = await removeAvatarAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      previousPreviewRef.current = null;
      setPreviewUrl(null);
      toast.success(result.success ?? "Profile picture removed.");
    });
  }

  const pending = avatarPending || isRemoving;
  const initials = name.trim().charAt(0).toUpperCase();

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
        <div className="w-full pt-0.5 sm:w-40 sm:shrink-0">
          <p className="text-sm font-medium text-foreground">Profile picture</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PNG, JPEG, WEBP, or GIF. Max 4MB.
          </p>
        </div>
        <form action={avatarAction} className="min-w-0 flex-1" ref={formRef}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar size="lg">
                {previewUrl && <AvatarImage alt={name} src={previewUrl} />}
                <AvatarFallback>
                  {initials || <UserRound className="size-4" />}
                </AvatarFallback>
              </Avatar>
              {pending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Loader2 className="size-4 animate-spin text-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                type="button"
                variant="secondary"
              >
                {previewUrl ? "Change photo" : "Upload photo"}
              </Button>
              {previewUrl && (
                <Button
                  disabled={pending}
                  onClick={handleRemove}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              name="avatar"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export function AccountIdentityForms({
  email,
  image,
  name,
}: {
  email: string;
  image: string | null;
  name: string;
}) {
  const router = useRouter();
  const [nameState, nameAction, namePending] = useActionState(
    updateNameAction,
    initialNameState
  );
  const [nameValue, setNameValue] = useState(name);
  const avatarName = nameValue.trim() || email;
  const [emailState, emailAction, emailPending] = useActionState(
    changeEmailAction,
    initialState
  );

  useEffect(() => {
    if (nameState.success && nameState.name !== undefined) {
      setNameValue(nameState.name);
      router.refresh();
    }
  }, [nameState.success, nameState.name, router]);

  return (
    <div className="border border-border divide-y divide-border">
      {/* Profile picture */}
      <AvatarUploadRow image={image} name={avatarName} />

      {/* Display name */}
      <div className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <div className="w-full pt-0.5 sm:w-40 sm:shrink-0">
            <p className="text-sm font-medium text-foreground">Display name</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Shown in audit logs and admin views.
            </p>
          </div>
          <form action={nameAction} className="min-w-0 flex-1 space-y-3">
            <Input
              id="name"
              maxLength={100}
              name="name"
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Enter your profile name..."
              value={nameValue}
            />
            <ActionMessage state={nameState} />
            <Button disabled={namePending} size="sm" type="submit">
              {namePending ? "Saving…" : "Save name"}
            </Button>
          </form>
        </div>
      </div>

      {/* Email address */}
      <div className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <div className="w-full pt-0.5 sm:w-40 sm:shrink-0">
            <p className="text-sm font-medium text-foreground">Email address</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used for magic-link sign-in. Changing it requires confirming a
              link sent to the new address.
            </p>
          </div>
          <form action={emailAction} className="min-w-0 flex-1 space-y-3">
            <Input
              defaultValue={email}
              id="email"
              name="email"
              placeholder="Enter your email address..."
              required
              type="email"
            />
            <ActionMessage state={emailState} />
            <Button disabled={emailPending} size="sm" type="submit">
              {emailPending ? "Sending…" : "Send confirmation link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(
    deleteAccountAction,
    initialState
  );

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Danger zone</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Irreversible and destructive actions.
        </p>
      </div>

      <div className="border border-destructive/30 p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex size-8 shrink-0 items-center justify-center bg-destructive/10">
            <TriangleAlert className="size-4 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Delete your account
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This permanently deletes your profile, all active sessions, and
              linked authentication accounts. Audit records are kept for
              operator history. This action cannot be undone.
            </p>
          </div>
        </div>

        <form action={action} className="space-y-3">
          <div>
            <label
              className="mb-1.5 block text-xs font-medium text-foreground"
              htmlFor="confirmEmail"
            >
              Type <span className="font-mono text-foreground/70">{email}</span>{" "}
              to confirm
            </label>
            <Input
              autoComplete="off"
              id="confirmEmail"
              name="confirmEmail"
              placeholder={email}
            />
          </div>
          <ActionMessage state={state} />
          <Button
            className="border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
            disabled={pending}
            size="sm"
            type="submit"
            variant="outline"
          >
            {pending ? "Deleting…" : "Delete my account"}
          </Button>
        </form>
      </div>
    </section>
  );
}
