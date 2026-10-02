import { RouteLoading } from "@/components/ui";
import { id } from "@/lib/id";

export default function Loading() {
  return <RouteLoading title={id.nav.kitchen} message={id.loading.kitchen} />;
}
