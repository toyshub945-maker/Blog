const styles: Record<string, string> = {
  published: "bg-green-500/15 text-green-600 dark:text-green-400",
  scheduled: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  draft: "bg-gray-500/15 text-muted-foreground",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        styles[status] || styles.draft
      }`}
    >
      {status}
    </span>
  );
}
