import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { GroupWithMemberCount } from "@/features/groups/types/groups.types";

interface GroupCardProps {
  group: GroupWithMemberCount;
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

const ROLE_KEYS: Record<string, string> = {
  OWNER: "roleOwner",
  ADMIN: "roleAdmin",
  MEMBER: "roleMember",
};

export function GroupCard({ group }: GroupCardProps) {
  const t = useTranslations("groups");
  const tMembers = useTranslations("groups.members");
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{group.name}</CardTitle>
            <Badge variant={ROLE_VARIANT[group.currentUserRole] ?? "outline"}>
              {tMembers(ROLE_KEYS[group.currentUserRole] ?? "roleMember")}
            </Badge>
          </div>
          {group.description && (
            <CardDescription className="line-clamp-2">
              {group.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>
                {t("member", { count: group.memberCount })}
              </span>
            </div>
            <span>{group.currency}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
