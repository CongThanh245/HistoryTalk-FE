import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Breadcrumb parent of /staff/admin/payment/history: no page of its own, so open the history. */
export default function AdminPaymentIndexPage() {
  redirect(ROUTES.STAFF.ADMIN.PAYMENT_HISTORY);
}
