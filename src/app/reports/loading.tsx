import { RouteLoading } from "@/components/ui";
import { id } from "@/lib/id";

export default function Loading() {
  return <RouteLoading title={id.reports.title} message={id.loading.reports} maxWidth="max-w-4xl" />;
}
