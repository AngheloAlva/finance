"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencySelect } from "@/features/settings/components/currency-select";
import { TimezoneSelect } from "@/features/settings/components/timezone-select";
import { updateProfileAction } from "@/features/settings/actions/update-profile.action";
import { INITIAL_VOID_STATE } from "@/shared/types/common.types";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    image: string | null;
    currency: string;
    timezone: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    INITIAL_VOID_STATE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Profile updated successfully");
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!state.success && state.error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={user.name}
          required
          autoComplete="name"
          aria-invalid={
            !state.success && state.fieldErrors?.name ? true : undefined
          }
        />
        {!state.success && state.fieldErrors?.name && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          disabled
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed here
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Avatar URL</Label>
        <Input
          id="image"
          name="image"
          type="text"
          defaultValue={user.image ?? ""}
          placeholder="https://..."
          autoComplete="photo"
          aria-invalid={
            !state.success && state.fieldErrors?.image ? true : undefined
          }
        />
        {!state.success && state.fieldErrors?.image && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.image[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Currency</Label>
        <CurrencySelect
          name="currency"
          defaultValue={user.currency}
          error={
            !state.success ? state.fieldErrors?.currency?.[0] : undefined
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Timezone</Label>
        <TimezoneSelect
          name="timezone"
          defaultValue={user.timezone}
          error={
            !state.success ? state.fieldErrors?.timezone?.[0] : undefined
          }
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-fit">
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
