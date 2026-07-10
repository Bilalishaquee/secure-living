import { redirect } from "next/navigation";

// The breadcrumb trail (components/layout/TopBar.tsx) generates an intermediate
// link to "/admin" for every "/admin/*" page (e.g. "/admin/dashboard",
// "/admin/audit-logs"), but there is no standalone "/admin" page. Redirect to
// the Super Admin Dashboard so that link resolves instead of 404ing.
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
