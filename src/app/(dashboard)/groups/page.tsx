import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GroupDialog } from "@/features/groups/components/group-dialog";
import { GroupList } from "@/features/groups/components/group-list";

export default function GroupsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Groups</h1>
        <GroupDialog
          mode="create"
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" data-icon="inline-start" />
              New Group
            </Button>
          }
        />
      </div>

      <GroupList />
    </div>
  );
}
