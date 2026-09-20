import { StaffMapPage } from "@/components/historical-map/StaffMapPage";
import { ROUTES } from "@/constants/routes";

export default function SystemAdminMapPage() {
  return <StaffMapPage closeHref={ROUTES.STAFF.ADMIN.HOME} />;
}
