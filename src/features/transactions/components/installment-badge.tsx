interface InstallmentBadgeProps {
  installmentNumber: number | null;
  totalInstallments: number | null;
}

export function InstallmentBadge({
  installmentNumber,
  totalInstallments,
}: InstallmentBadgeProps) {
  if (installmentNumber == null || totalInstallments == null) {
    return null;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {installmentNumber}/{totalInstallments}
    </span>
  );
}
