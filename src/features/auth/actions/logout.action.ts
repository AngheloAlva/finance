"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/features/auth/lib/auth.config";

export async function logoutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/login");
}
