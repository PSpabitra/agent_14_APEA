import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-text">Page not found</h1>
        <p className="mt-1 text-sm text-subtext">The route you requested doesn't exist.</p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
