import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Breadcrumb parent of /staff/admin/accounts/[role]: no page of its own, so open the first account list. */
export default function AdminAccountsIndexPage() {
  redirect(ROUTES.STAFF.ADMIN.ACCOUNTS.CUSTOMER);
}
