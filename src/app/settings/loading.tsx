import { RouteLoading } from "@/components/ui";
import { id } from "@/lib/id";

export default function Loading() {
  return <RouteLoading title={id.settings.title} message={id.loading.settings} />;
}
