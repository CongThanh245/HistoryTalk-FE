// data/periods/dai-viet-1658.ts
// MOCK GeoJSON — kế thừa từ 1653, Chúa Nguyễn khai phá thêm Trấn Biên - Gia Định.

import type { PeriodGeoJSON } from "@/services/period.service";
import { DAI_VIET_1653 } from "./dai-viet-1653";

// Clone từ 1653 và override 1 số region
const baseFeatures = DAI_VIET_1653.features.filter(
  (f) =>
    f.properties.dynastyId !== "nguyen" &&
    f.properties.dynastyId !== "khmer",
);

export const DAI_VIET_1658: PeriodGeoJSON = {
  type: "FeatureCollection",
  features: [
    ...baseFeatures,
    // Chúa Nguyễn — thêm 1 mảnh Trấn Biên - Gia Định
    {
      type: "Feature",
      properties: {
        regionId: "chua-nguyen-1658",
        dynastyId: "nguyen",
        name: "Chúa Nguyễn",
        ruler: "Chúa Nguyễn Phúc Tần",
        capital: "Kim Long (Phú Xuân)",
        color: "#e8833a",
        description:
          "Năm 1658 Chúa Nguyễn bắt đầu khai phá vùng Trấn Biên - Gia Định, thu nhận người Hoa di cư (nhóm Trần Thượng Xuyên, Dương Ngạn Địch).",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hue_VietNam_CitadelMidgate.jpg/640px-Hue_VietNam_CitadelMidgate.jpg",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          // Vùng chính (Thuận Hóa → Phú Yên)
          [
            [
              [105.8, 18.3],
              [106.0, 18.7],
              [107.0, 17.5],
              [108.2, 16.0],
              [109.2, 14.5],
              [109.5, 13.0],
              [109.2, 12.5],
              [108.5, 12.7],
              [108.0, 13.5],
              [107.5, 14.5],
              [107.0, 15.5],
              [106.8, 16.5],
              [106.3, 17.5],
              [105.8, 18.3],
            ],
          ],
          // Trấn Biên - Gia Định (mới)
          [
            [
              [106.3, 11.0],
              [107.2, 11.0],
              [107.2, 10.3],
              [106.5, 10.2],
              [106.3, 10.6],
              [106.3, 11.0],
            ],
          ],
        ],
      },
    },
    // Chân Lạp — co lại 1 chút ở phía Đông Nam Bộ
    {
      type: "Feature",
      properties: {
        regionId: "campuchia-1658",
        dynastyId: "khmer",
        name: "Chân Lạp (Campuchia)",
        ruler: "Vua Ang Sur",
        capital: "Oudong",
        color: "#b85ca8",
        description:
          "Chân Lạp suy yếu do tranh chấp nội bộ, vùng Đông Nam Bộ dần thuộc về Chúa Nguyễn.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [103.5, 14.0],
            [105.5, 14.0],
            [107.2, 13.0],
            [107.2, 11.0],
            [106.3, 11.0],
            [106.3, 10.6],
            [106.5, 10.2],
            [105.5, 9.5],
            [104.5, 10.0],
            [103.5, 11.0],
            [103.0, 12.5],
            [103.5, 14.0],
          ],
        ],
      },
    },
  ],
};
