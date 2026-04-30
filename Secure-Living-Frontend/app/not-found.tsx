import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-brand-blue">404</p>
      <h1 className="font-display text-2xl font-semibold text-brand-navy">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]">
        That URL does not exist in this app. If you are running locally, make sure the dev server
        is started from the <code className="rounded bg-surface-gray px-1 py-0.5 text-xs">secure-living</code>{" "}
        folder.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
