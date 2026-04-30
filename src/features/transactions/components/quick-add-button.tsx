import { getUserCategories } from "@/features/categories/lib/categories.queries"
import { QuickAddDrawer } from "@/features/transactions/components/quick-add-drawer"
import { requireSession } from "@/shared/lib/auth"

export async function QuickAddButton() {
	const session = await requireSession()
	const categories = await getUserCategories(session.user.id)
	return <QuickAddDrawer categories={categories} />
}
