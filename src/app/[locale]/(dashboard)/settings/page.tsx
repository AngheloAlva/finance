import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export default async function SettingsPage() {
  const session = await requireSession();
  const t = await getTranslations("settings");
  const tCat = await getTranslations("categorization");

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

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={dbUser} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" />
                {tCat("title")}
              </CardTitle>
              <CardDescription>{tCat("pageDescription")}</CardDescription>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/settings/categorization" />}>
              {tCat("manage")}
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
