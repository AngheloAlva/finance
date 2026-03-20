import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { GroupDialog } from "@/features/groups/components/group-dialog";
import { GroupList } from "@/features/groups/components/group-list";

export default async function GroupsPage() {
  const t = await getTranslations("groups");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <GroupDialog
          mode="create"
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" data-icon="inline-start" />
              {t("newGroup")}
            </Button>
          }
        />
      </div>

      <GroupList />
    </div>
  );
}
