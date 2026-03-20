import { getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export default async function SettingsPage() {
  const session = await requireSession();
  const t = await getTranslations("settings");

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      currency: true,
      timezone: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>
            {t("profileDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={dbUser} />
        </CardContent>
      </Card>
    </div>
  );
}
