import { StaffMapPage } from "@/components/historical-map/StaffMapPage";
import { ROUTES } from "@/constants/routes";

export default function ContentAdminMapPage() {
  return <StaffMapPage closeHref={ROUTES.STAFF.HOME} />;
}
