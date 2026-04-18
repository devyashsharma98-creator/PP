import { redirect } from "next/navigation";

/** Site entry: always open on the public landing (Parichay). Auth and ERP routes use /login and /dashboard. */
export default function Page() {
  redirect("/parichay");
}
