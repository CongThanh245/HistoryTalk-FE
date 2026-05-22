// data/periods/dai-viet-1679.ts
// MOCK GeoJSON — 1679: Chúa Nguyễn dời thủ phủ về Phú Xuân, Nhà Mạc mất Cao Bằng (1677).

import type { PeriodGeoJSON } from "@/services/period.service";
import { DAI_VIET_1658 } from "./dai-viet-1658";

// Clone từ 1658, bỏ Nhà Mạc (đã mất Cao Bằng năm 1677), update Chúa Nguyễn
const baseFeatures = DAI_VIET_1658.features.filter(
  (f) =>
    f.properties.dynastyId !== "nguyen" && f.properties.dynastyId !== "mac",
);

// Lấy lại Cao Bằng để gộp vào Nhà Lê - Trịnh
const updatedFeatures = baseFeatures.map((f) => {
  if (f.properties.dynastyId === "le-trinh") {
    return {
      ...f,
      properties: {
        ...f.properties,
        description:
          "Đàng Ngoài — Năm 1677, Nhà Lê - Trịnh đánh tan Nhà Mạc, thu hồi Cao Bằng, hoàn thành thống nhất Bắc Hà.",
      },
    };
  }
  return f;
});

export const DAI_VIET_1679: PeriodGeoJSON = {
  type: "FeatureCollection",
  features: [
    ...updatedFeatures,
    // Chúa Nguyễn — dời thủ phủ về Phú Xuân
    {
      type: "Feature",
      properties: {
        regionId: "chua-nguyen-1679",
        dynastyId: "nguyen",
        name: "Chúa Nguyễn",
        ruler: "Chúa Nguyễn Phúc Tần",
        capital: "Phú Xuân (Huế)",
        color: "#e8833a",
        description:
          "Năm 1679, Chúa Nguyễn chính thức dời thủ phủ về Phú Xuân (Huế). Đón nhận 3000 quân Minh tỵ nạn đến khai phá Mỹ Tho, Biên Hòa.",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hue_VietNam_CitadelMidgate.jpg/640px-Hue_VietNam_CitadelMidgate.jpg",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          // Vùng chính
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
          // Trấn Biên - Gia Định mở rộng thêm Mỹ Tho - Biên Hòa
          [
            [
              [106.0, 11.2],
              [107.3, 11.2],
              [107.3, 10.3],
              [106.7, 10.1],
              [106.0, 10.3],
              [105.8, 10.7],
              [106.0, 11.2],
            ],
          ],
        ],
      },
    },
  ],
};
