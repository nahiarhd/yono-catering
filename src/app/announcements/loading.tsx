import { RouteLoading } from "@/components/ui";
import { id } from "@/lib/id";

export default function Loading() {
  return <RouteLoading title={id.announcements.title} message={id.loading.announcements} />;
}
