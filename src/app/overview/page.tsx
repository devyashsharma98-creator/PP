import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function OverviewPage() {
  await requirePageSession("/overview");
  redirect("/dashboard");
}
