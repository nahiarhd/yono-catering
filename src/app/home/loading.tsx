import { RouteLoading } from "@/components/ui";
import { id } from "@/lib/id";

export default function Loading() {
  return <RouteLoading title={id.nav.home} message={id.loading.home} />;
}
