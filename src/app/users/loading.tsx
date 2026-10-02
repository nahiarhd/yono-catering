import { RouteLoading } from "@/components/ui";
import { id } from "@/lib/id";

export default function Loading() {
  return <RouteLoading title={id.users.title} message={id.loading.users} maxWidth="max-w-4xl" />;
}
