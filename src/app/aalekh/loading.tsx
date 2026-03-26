export default function AalekhLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse space-y-4 w-full max-w-2xl px-6">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
