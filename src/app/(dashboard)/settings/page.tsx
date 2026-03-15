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
      <h1 className="mb-6 text-lg font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={dbUser} />
        </CardContent>
      </Card>
    </div>
  );
}
