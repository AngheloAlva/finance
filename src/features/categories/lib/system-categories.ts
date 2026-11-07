/**
 * Single source of truth for the default (SYSTEM) categories.
 *
 * `prisma/seed.ts` writes this catalog to the database and the app resolves the
 * translated names from it, keyed by the `sys_cat_<slug>` id. The database keeps
 * the English name only as a fallback, and user-created categories are never
 * translated.
 */

type LocalizedName = { en: string; es: string }

export type SystemCategoryChild = {
	slug: string
	name: LocalizedName
	icon: string
	isRecurring?: boolean
	isAvoidable?: boolean
}

export type SystemCategory = SystemCategoryChild & {
	color: string
	transactionType: "EXPENSE" | "INCOME" | "TRANSFER"
	children?: SystemCategoryChild[]
}

const SYSTEM_CATEGORY_ID_PREFIX = "sys_cat_"

export function systemCategoryId(slug: string): string {
	return `${SYSTEM_CATEGORY_ID_PREFIX}${slug}`
}

export const SYSTEM_CATEGORIES: SystemCategory[] = [
	// EXPENSE
	{
		slug: "food-dining",
		name: { en: "Food & Dining", es: "Comida" },
		icon: "utensils",
		color: "#ef4444",
		transactionType: "EXPENSE",
		children: [
			{ slug: "groceries", name: { en: "Groceries", es: "Supermercado" }, icon: "shopping-cart" },
			{ slug: "produce-market", name: { en: "Produce Market", es: "Feria y verdulería" }, icon: "store" },
			{ slug: "bakery", name: { en: "Bakery", es: "Panadería" }, icon: "sandwich" },
			{ slug: "convenience-store", name: { en: "Convenience Store", es: "Minimarket y kiosco" }, icon: "store" },
			{ slug: "restaurants", name: { en: "Restaurants", es: "Restaurantes" }, icon: "chef-hat" },
			{ slug: "work-lunch", name: { en: "Work Lunch", es: "Colación" }, icon: "sandwich" },
			{ slug: "coffee", name: { en: "Coffee", es: "Cafetería" }, icon: "coffee" },
			{ slug: "fast-food", name: { en: "Fast Food", es: "Comida rápida" }, icon: "pizza", isAvoidable: true },
			{ slug: "food-delivery", name: { en: "Food Delivery", es: "Delivery de comida" }, icon: "truck", isAvoidable: true },
			{ slug: "alcohol", name: { en: "Alcohol & Drinks", es: "Alcohol y bebidas" }, icon: "wine", isAvoidable: true },
		],
	},
	{
		slug: "housing",
		name: { en: "Housing", es: "Vivienda" },
		icon: "home",
		color: "#8b5cf6",
		transactionType: "EXPENSE",
		children: [
			{ slug: "rent", name: { en: "Rent", es: "Arriendo" }, icon: "key-round", isRecurring: true },
			{ slug: "mortgage", name: { en: "Mortgage", es: "Dividendo" }, icon: "building-2", isRecurring: true },
			{ slug: "common-expenses", name: { en: "HOA Fees", es: "Gastos comunes" }, icon: "building-2", isRecurring: true },
			{ slug: "property-tax", name: { en: "Property Tax", es: "Contribuciones" }, icon: "landmark", isRecurring: true },
			{ slug: "maintenance", name: { en: "Repairs & Maintenance", es: "Reparaciones y mantención" }, icon: "wrench" },
			{ slug: "home-improvement", name: { en: "Home Improvement", es: "Mejoras del hogar" }, icon: "hammer" },
			{ slug: "furniture", name: { en: "Furniture & Decor", es: "Muebles y decoración" }, icon: "sofa" },
			{ slug: "appliances", name: { en: "Appliances", es: "Electrodomésticos" }, icon: "tv" },
			{ slug: "household-supplies", name: { en: "Household Supplies", es: "Artículos de aseo" }, icon: "sparkles" },
			{ slug: "housekeeping", name: { en: "Housekeeping", es: "Servicio doméstico" }, icon: "home" },
			{ slug: "gardening", name: { en: "Gardening", es: "Jardín y plantas" }, icon: "flower-2" },
			{ slug: "moving", name: { en: "Moving", es: "Mudanza" }, icon: "package" },
		],
	},
	{
		slug: "bills",
		name: { en: "Bills & Utilities", es: "Cuentas y servicios" },
		icon: "receipt",
		color: "#eab308",
		transactionType: "EXPENSE",
		isRecurring: true,
		children: [
			{ slug: "electricity", name: { en: "Electricity", es: "Luz" }, icon: "zap" },
			{ slug: "water", name: { en: "Water", es: "Agua" }, icon: "droplet" },
			{ slug: "gas", name: { en: "Gas", es: "Gas" }, icon: "flame" },
			{ slug: "internet", name: { en: "Internet", es: "Internet" }, icon: "wifi" },
			{ slug: "mobile-phone", name: { en: "Mobile Phone", es: "Plan de celular" }, icon: "smartphone" },
			{ slug: "cable-tv", name: { en: "Cable TV", es: "Televisión por cable" }, icon: "tv" },
			{ slug: "utilities", name: { en: "Other Utilities", es: "Otras cuentas" }, icon: "lightbulb" },
		],
	},
	{
		slug: "transport",
		name: { en: "Transport", es: "Transporte" },
		icon: "car",
		color: "#f59e0b",
		transactionType: "EXPENSE",
		children: [
			{ slug: "fuel", name: { en: "Fuel", es: "Bencina" }, icon: "fuel" },
			{ slug: "public-transit", name: { en: "Public Transit", es: "Transporte público" }, icon: "train-front" },
			{ slug: "taxi-rideshare", name: { en: "Taxi & Rideshare", es: "Taxi y apps de transporte" }, icon: "map-pin" },
			{ slug: "intercity-bus", name: { en: "Intercity Bus", es: "Buses interurbanos" }, icon: "bus" },
			{ slug: "parking", name: { en: "Parking", es: "Estacionamiento" }, icon: "square-parking" },
			{ slug: "tolls", name: { en: "Tolls", es: "Peajes y TAG" }, icon: "ticket" },
			{ slug: "car-maintenance", name: { en: "Car Maintenance", es: "Mantención del auto" }, icon: "wrench" },
			{ slug: "car-wash", name: { en: "Car Wash", es: "Lavado de auto" }, icon: "droplet" },
			{ slug: "car-paperwork", name: { en: "Registration & Inspection", es: "Permiso de circulación y revisión técnica" }, icon: "file-text" },
			{ slug: "car-payment", name: { en: "Car Payment", es: "Cuota del auto" }, icon: "car-front", isRecurring: true },
			{ slug: "bike-scooter", name: { en: "Bike & Scooter", es: "Bicicleta y scooter" }, icon: "bike" },
		],
	},
	{
		slug: "health",
		name: { en: "Health", es: "Salud" },
		icon: "heart-pulse",
		color: "#10b981",
		transactionType: "EXPENSE",
		children: [
			{ slug: "health-plan", name: { en: "Health Plan", es: "Plan de salud" }, icon: "shield-check", isRecurring: true },
			{ slug: "medical", name: { en: "Doctor Visits", es: "Consultas médicas" }, icon: "stethoscope" },
			{ slug: "dental", name: { en: "Dentist", es: "Dentista" }, icon: "smile" },
			{ slug: "pharmacy", name: { en: "Pharmacy", es: "Farmacia" }, icon: "pill" },
			{ slug: "lab-tests", name: { en: "Lab Tests", es: "Exámenes" }, icon: "file-text" },
			{ slug: "hospital", name: { en: "Hospital", es: "Hospitalización" }, icon: "hospital" },
			{ slug: "mental-health", name: { en: "Mental Health", es: "Salud mental" }, icon: "brain" },
			{ slug: "optical", name: { en: "Eye Care", es: "Óptica" }, icon: "glasses" },
			{ slug: "gym", name: { en: "Gym & Sports", es: "Gimnasio y deporte" }, icon: "dumbbell" },
		],
	},
	{
		slug: "personal-care",
		name: { en: "Personal Care", es: "Cuidado personal" },
		icon: "sparkles",
		color: "#d946ef",
		transactionType: "EXPENSE",
		children: [
			{ slug: "hair-barber", name: { en: "Hair & Barber", es: "Peluquería y barbería" }, icon: "scissors" },
			{ slug: "cosmetics", name: { en: "Cosmetics", es: "Cosméticos" }, icon: "palette" },
			{ slug: "toiletries", name: { en: "Toiletries", es: "Higiene personal" }, icon: "droplet" },
			{ slug: "spa-massage", name: { en: "Spa & Massage", es: "Spa y masajes" }, icon: "flower-2" },
		],
	},
	{
		slug: "clothing",
		name: { en: "Clothing", es: "Ropa y calzado" },
		icon: "shirt",
		color: "#06b6d4",
		transactionType: "EXPENSE",
		children: [
			{ slug: "clothes", name: { en: "Clothes", es: "Ropa" }, icon: "shirt" },
			{ slug: "shoes", name: { en: "Shoes", es: "Calzado" }, icon: "shopping-bag" },
			{ slug: "accessories", name: { en: "Accessories", es: "Accesorios" }, icon: "glasses" },
			{ slug: "laundry", name: { en: "Laundry & Dry Cleaning", es: "Lavandería" }, icon: "droplet" },
		],
	},
	{
		slug: "entertainment",
		name: { en: "Entertainment", es: "Entretenimiento" },
		icon: "gamepad-2",
		color: "#ec4899",
		transactionType: "EXPENSE",
		children: [
			{ slug: "movies-theater", name: { en: "Movies & Theater", es: "Cine y teatro" }, icon: "popcorn" },
			{ slug: "concerts-events", name: { en: "Concerts & Events", es: "Conciertos y eventos" }, icon: "ticket" },
			{ slug: "bars-nightlife", name: { en: "Bars & Nightlife", es: "Bares y salidas" }, icon: "wine", isAvoidable: true },
			{ slug: "video-games", name: { en: "Video Games", es: "Videojuegos" }, icon: "gamepad-2" },
			{ slug: "hobbies", name: { en: "Hobbies", es: "Pasatiempos" }, icon: "palette" },
			{ slug: "books", name: { en: "Books", es: "Libros" }, icon: "book-open" },
			{ slug: "gambling", name: { en: "Gambling & Lottery", es: "Apuestas y lotería" }, icon: "dices", isAvoidable: true },
		],
	},
	{
		slug: "subscriptions",
		name: { en: "Subscriptions", es: "Suscripciones" },
		icon: "repeat",
		color: "#6366f1",
		transactionType: "EXPENSE",
		isRecurring: true,
		children: [
			{ slug: "video-streaming", name: { en: "Video Streaming", es: "Streaming de video" }, icon: "film" },
			{ slug: "music-streaming", name: { en: "Music Streaming", es: "Streaming de música" }, icon: "music" },
			{ slug: "apps-software", name: { en: "Apps & Software", es: "Apps y software" }, icon: "monitor" },
			{ slug: "cloud-storage", name: { en: "Cloud Storage", es: "Almacenamiento en la nube" }, icon: "cloud" },
			{ slug: "news-magazines", name: { en: "News & Magazines", es: "Diarios y revistas" }, icon: "newspaper" },
			{ slug: "memberships", name: { en: "Memberships", es: "Membresías" }, icon: "tag" },
		],
	},
	{
		slug: "education",
		name: { en: "Education", es: "Educación" },
		icon: "graduation-cap",
		color: "#3b82f6",
		transactionType: "EXPENSE",
		children: [
			{ slug: "tuition", name: { en: "Tuition", es: "Matrícula y mensualidad" }, icon: "graduation-cap", isRecurring: true },
			{ slug: "courses", name: { en: "Courses & Workshops", es: "Cursos y talleres" }, icon: "laptop" },
			{ slug: "languages", name: { en: "Language Classes", es: "Clases de idiomas" }, icon: "book-open" },
			{ slug: "school-supplies", name: { en: "School Supplies", es: "Útiles y materiales" }, icon: "package" },
			{ slug: "student-loan", name: { en: "Student Loan", es: "Crédito universitario" }, icon: "landmark", isRecurring: true },
		],
	},
	{
		slug: "shopping",
		name: { en: "Shopping", es: "Compras" },
		icon: "shopping-bag",
		color: "#f97316",
		transactionType: "EXPENSE",
		children: [
			{ slug: "electronics", name: { en: "Electronics", es: "Tecnología" }, icon: "laptop" },
			{ slug: "online-shopping", name: { en: "Online Shopping", es: "Compras online" }, icon: "package" },
			{ slug: "department-stores", name: { en: "Department Stores", es: "Multitiendas" }, icon: "store" },
			{ slug: "hardware-store", name: { en: "Hardware Store", es: "Ferretería" }, icon: "hammer" },
		],
	},
	{
		slug: "insurance",
		name: { en: "Insurance", es: "Seguros" },
		icon: "shield-check",
		color: "#14b8a6",
		transactionType: "EXPENSE",
		isRecurring: true,
		children: [
			{ slug: "life-insurance", name: { en: "Life Insurance", es: "Seguro de vida" }, icon: "heart" },
			{ slug: "health-insurance", name: { en: "Supplemental Health Insurance", es: "Seguro complementario de salud" }, icon: "heart-pulse" },
			{ slug: "car-insurance", name: { en: "Car Insurance", es: "Seguro de auto" }, icon: "car" },
			{ slug: "home-insurance", name: { en: "Home Insurance", es: "Seguro de hogar" }, icon: "home" },
		],
	},
	{
		slug: "financial",
		name: { en: "Banking & Debt", es: "Banco y deudas" },
		icon: "credit-card",
		color: "#0d9488",
		transactionType: "EXPENSE",
		children: [
			{ slug: "bank-fees", name: { en: "Bank Fees", es: "Comisiones bancarias" }, icon: "landmark" },
			{ slug: "card-fees", name: { en: "Card Fees", es: "Mantención de tarjeta" }, icon: "credit-card" },
			{ slug: "interest-paid", name: { en: "Interest Paid", es: "Intereses" }, icon: "percent" },
			{ slug: "loan-payment", name: { en: "Loan Payment", es: "Cuota de crédito" }, icon: "hand-coins", isRecurring: true },
		],
	},
	{
		slug: "taxes-fees",
		name: { en: "Taxes & Fees", es: "Impuestos y trámites" },
		icon: "landmark",
		color: "#78716c",
		transactionType: "EXPENSE",
		children: [
			{ slug: "income-tax", name: { en: "Income Tax", es: "Impuesto a la renta" }, icon: "receipt-text" },
			{ slug: "fines", name: { en: "Fines", es: "Multas" }, icon: "scale", isAvoidable: true },
			{ slug: "paperwork", name: { en: "Notary & Paperwork", es: "Notaría y trámites" }, icon: "file-text" },
		],
	},
	{
		slug: "kids",
		name: { en: "Kids", es: "Hijos" },
		icon: "baby",
		color: "#a855f7",
		transactionType: "EXPENSE",
		children: [
			{ slug: "childcare", name: { en: "Childcare", es: "Sala cuna y cuidado" }, icon: "baby" },
			{ slug: "school-fees", name: { en: "School Fees", es: "Colegio" }, icon: "graduation-cap", isRecurring: true },
			{ slug: "baby-supplies", name: { en: "Baby Supplies", es: "Pañales y artículos de bebé" }, icon: "package" },
			{ slug: "kids-clothing", name: { en: "Kids' Clothing", es: "Ropa de niños" }, icon: "shirt" },
			{ slug: "toys", name: { en: "Toys", es: "Juguetes" }, icon: "gift" },
			{ slug: "kids-activities", name: { en: "Kids' Activities", es: "Actividades de niños" }, icon: "party-popper" },
		],
	},
	{
		slug: "pets",
		name: { en: "Pets", es: "Mascotas" },
		icon: "paw-print",
		color: "#84cc16",
		transactionType: "EXPENSE",
		children: [
			{ slug: "pet-food", name: { en: "Pet Food", es: "Comida de mascotas" }, icon: "bone" },
			{ slug: "vet", name: { en: "Vet", es: "Veterinario" }, icon: "stethoscope" },
			{ slug: "pet-grooming", name: { en: "Pet Grooming", es: "Peluquería de mascotas" }, icon: "scissors" },
			{ slug: "pet-supplies", name: { en: "Pet Supplies", es: "Accesorios de mascotas" }, icon: "paw-print" },
		],
	},
	{
		slug: "travel",
		name: { en: "Travel", es: "Viajes" },
		icon: "plane",
		color: "#0ea5e9",
		transactionType: "EXPENSE",
		children: [
			{ slug: "flights", name: { en: "Flights", es: "Pasajes aéreos" }, icon: "plane" },
			{ slug: "lodging", name: { en: "Lodging", es: "Alojamiento" }, icon: "hotel" },
			{ slug: "car-rental", name: { en: "Car Rental", es: "Arriendo de auto" }, icon: "car-front" },
			{ slug: "tours-activities", name: { en: "Tours & Activities", es: "Tours y actividades" }, icon: "map-pin" },
			{ slug: "travel-expenses", name: { en: "Travel Spending", es: "Gastos de viaje" }, icon: "luggage" },
		],
	},
	{
		slug: "gifts-donations",
		name: { en: "Gifts & Donations", es: "Regalos y donaciones" },
		icon: "gift",
		color: "#f43f5e",
		transactionType: "EXPENSE",
		children: [
			{ slug: "gifts", name: { en: "Gifts", es: "Regalos" }, icon: "gift" },
			{ slug: "donations", name: { en: "Donations", es: "Donaciones" }, icon: "hand-coins" },
			{ slug: "celebrations", name: { en: "Celebrations", es: "Celebraciones" }, icon: "party-popper" },
		],
	},
	{
		slug: "work-expenses",
		name: { en: "Work Expenses", es: "Gastos de trabajo" },
		icon: "briefcase",
		color: "#475569",
		transactionType: "EXPENSE",
		children: [
			{ slug: "coworking", name: { en: "Coworking", es: "Coworking" }, icon: "building-2" },
			{ slug: "work-equipment", name: { en: "Work Equipment", es: "Equipos de trabajo" }, icon: "laptop" },
			{ slug: "professional-services", name: { en: "Professional Services", es: "Servicios profesionales" }, icon: "briefcase" },
		],
	},
	{
		slug: "other-expenses",
		name: { en: "Other Expenses", es: "Otros gastos" },
		icon: "wallet",
		color: "#9ca3af",
		transactionType: "EXPENSE",
	},

	// INCOME
	{
		slug: "salary",
		name: { en: "Salary", es: "Sueldo" },
		icon: "briefcase",
		color: "#22c55e",
		transactionType: "INCOME",
		isRecurring: true,
		children: [
			{ slug: "bonus", name: { en: "Bonus", es: "Bonos" }, icon: "trophy", isRecurring: false },
			{ slug: "overtime", name: { en: "Overtime", es: "Horas extra" }, icon: "banknote", isRecurring: false },
			{ slug: "holiday-bonus", name: { en: "Holiday Bonus", es: "Aguinaldo" }, icon: "gift", isRecurring: false },
		],
	},
	{
		slug: "freelance",
		name: { en: "Freelance", es: "Trabajos independientes" },
		icon: "laptop",
		color: "#16a34a",
		transactionType: "INCOME",
	},
	{
		slug: "investment-returns",
		name: { en: "Investment Returns", es: "Rentabilidad de inversiones" },
		icon: "trending-up",
		color: "#15803d",
		transactionType: "INCOME",
		children: [
			{ slug: "dividends", name: { en: "Dividends", es: "Dividendos" }, icon: "coins" },
			{ slug: "interest-earned", name: { en: "Interest Earned", es: "Intereses ganados" }, icon: "percent" },
			{ slug: "capital-gains", name: { en: "Capital Gains", es: "Ganancias de capital" }, icon: "chart-line" },
		],
	},
	{
		slug: "rental-income",
		name: { en: "Rental Income", es: "Arriendos recibidos" },
		icon: "key-round",
		color: "#65a30d",
		transactionType: "INCOME",
		isRecurring: true,
	},
	{
		slug: "refunds",
		name: { en: "Refunds", es: "Reembolsos y devoluciones" },
		icon: "undo-2",
		color: "#4d7c0f",
		transactionType: "INCOME",
	},
	{
		slug: "sales",
		name: { en: "Sales", es: "Ventas" },
		icon: "tag",
		color: "#059669",
		transactionType: "INCOME",
	},
	{
		slug: "gifts-received",
		name: { en: "Gifts Received", es: "Regalos recibidos" },
		icon: "gift",
		color: "#34d399",
		transactionType: "INCOME",
	},
	{
		slug: "benefits-pension",
		name: { en: "Benefits & Pension", es: "Beneficios y pensión" },
		icon: "hand-coins",
		color: "#047857",
		transactionType: "INCOME",
	},
	{
		slug: "other-income",
		name: { en: "Other Income", es: "Otros ingresos" },
		icon: "circle-dollar-sign",
		color: "#4ade80",
		transactionType: "INCOME",
	},

	// TRANSFER
	{
		slug: "transfer",
		name: { en: "Transfer", es: "Transferencia" },
		icon: "arrow-left-right",
		color: "#64748b",
		transactionType: "TRANSFER",
		children: [
			{ slug: "between-accounts", name: { en: "Between Accounts", es: "Entre cuentas" }, icon: "arrow-left-right" },
			{ slug: "card-payment", name: { en: "Credit Card Payment", es: "Pago de tarjeta" }, icon: "credit-card" },
			{ slug: "to-savings", name: { en: "To Savings", es: "Ahorro" }, icon: "piggy-bank" },
			{ slug: "to-investments", name: { en: "To Investments", es: "Inversión" }, icon: "trending-up" },
			{ slug: "from-savings", name: { en: "From Savings", es: "Desde ahorro" }, icon: "piggy-bank" },
			{ slug: "from-investments", name: { en: "From Investments", es: "Desde inversiones" }, icon: "trending-down" },
			{ slug: "cash-withdrawal", name: { en: "Cash Withdrawal", es: "Retiro de efectivo" }, icon: "banknote" },
			{ slug: "opening-balance", name: { en: "Opening Balance", es: "Saldo inicial" }, icon: "wallet" },
		],
	},
]

/**
 * TRANSFER categories that move money out of, or back into, the cash the user
 * can spend; the opening balance counts as an inflow. Only these transfers
 * change the accumulated balance; the others (card payments, between
 * accounts, cash withdrawals) keep it unchanged.
 */
export const BALANCE_OUTFLOW_TRANSFER_CATEGORY_IDS = ["to-savings", "to-investments"].map(
	systemCategoryId,
)
export const BALANCE_INFLOW_TRANSFER_CATEGORY_IDS = [
	"from-savings",
	"from-investments",
	"opening-balance",
].map(systemCategoryId)

/** Starting cash a user records once; counts toward the balance, never as income. */
export const OPENING_BALANCE_CATEGORY_ID = systemCategoryId("opening-balance")

const NAMES_BY_ID = new Map<string, LocalizedName>(
	SYSTEM_CATEGORIES.flatMap((root) => [root, ...(root.children ?? [])]).map(
		(entry) => [systemCategoryId(entry.slug), entry.name],
	),
)

/** Display name of a category; only SYSTEM ids are translated. */
export function localizeCategoryName(
	category: { id: string; name: string },
	locale: string,
): string {
	const names = NAMES_BY_ID.get(category.id)
	if (!names) return category.name
	return locale === "es" ? names.es : names.en
}

/**
 * Returns the categories, and any children, with `name` translated and sorted
 * by that translated name, since the database can only sort by the stored one.
 */
export function localizeCategories<
	T extends { id: string; name: string; children?: { id: string; name: string }[] },
>(categories: T[], locale: string): T[] {
	const collator = new Intl.Collator(locale)
	const byName = (a: { name: string }, b: { name: string }) =>
		collator.compare(a.name, b.name)
	const translate = <C extends { id: string; name: string }>(category: C): C => ({
		...category,
		name: localizeCategoryName(category, locale),
	})

	return categories
		.map((category) => ({
			...translate(category),
			...(category.children && {
				children: category.children.map(translate).sort(byName),
			}),
		}))
		.sort(byName)
}
