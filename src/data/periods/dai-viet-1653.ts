// data/periods/dai-viet-1653.ts
// MOCK GeoJSON — polygon rất thô, dùng để demo hệ thống.
// TODO: Mở file này trong geojson.io, đè ảnh bản đồ 1653 lên, vẽ lại chính xác từng vùng.

import type { PeriodGeoJSON } from "@/services/period.service";

export const DAI_VIET_1653: PeriodGeoJSON = {
  type: "FeatureCollection",
  features: [
    // ─── Nhà Lê - Trịnh (Đàng Ngoài, vàng) ─────────────────
    {
      type: "Feature",
      properties: {
        regionId: "nha-le-trinh-1653",
        dynastyId: "le-trinh",
        name: "Nhà Lê - Trịnh",
        ruler: "Vua Lê Thần Tông - Chúa Trịnh Tráng",
        capital: "Thăng Long",
        color: "#f4c430",
        description:
          "Đàng Ngoài (Bắc Hà) — Vua Lê làm vì, Chúa Trịnh nắm thực quyền. Bao gồm vùng đồng bằng sông Hồng, sông Mã, sông Lam.",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hanoi_Imperial_Citadel_-_Doan_Mon_Gate.jpg/640px-Hanoi_Imperial_Citadel_-_Doan_Mon_Gate.jpg",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [103.4, 22.8],
            [104.8, 23.4],
            [106.2, 23.0],
            [107.5, 21.6],
            [108.0, 21.0],
            [107.0, 20.0],
            [106.5, 19.5],
            [106.0, 18.7],
            [105.8, 18.3],
            [105.2, 18.5],
            [104.5, 19.0],
            [103.8, 19.8],
            [102.9, 20.8],
            [102.8, 21.8],
            [103.4, 22.8],
          ],
        ],
      },
    },
    // ─── Nhà Mạc (Cao Bằng, xanh lá nhỏ) ───────────────────
    {
      type: "Feature",
      properties: {
        regionId: "nha-mac-1653",
        dynastyId: "mac",
        name: "Nhà Mạc",
        ruler: "Mạc Kính Vũ",
        capital: "Cao Bằng",
        color: "#8bc34a",
        description:
          "Tàn dư nhà Mạc cát cứ tại Cao Bằng sau khi bị nhà Lê - Trịnh đánh đuổi khỏi Thăng Long (1592). Tồn tại đến năm 1677.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.8, 23.0],
            [106.8, 23.4],
            [107.0, 22.7],
            [106.2, 22.5],
            [105.8, 23.0],
          ],
        ],
      },
    },
    // ─── Chúa Nguyễn (Đàng Trong, cam) ─────────────────────
    {
      type: "Feature",
      properties: {
        regionId: "chua-nguyen-1653",
        dynastyId: "nguyen",
        name: "Chúa Nguyễn",
        ruler: "Chúa Nguyễn Phúc Tần",
        capital: "Dinh Cát (Quảng Trị)",
        color: "#e8833a",
        description:
          "Đàng Trong (Nam Hà) — Chúa Nguyễn cai trị từ Thuận Hóa vào tận Phú Yên. Vừa mới đánh chiếm Phú Yên từ Champa năm 1611.",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hue_VietNam_CitadelMidgate.jpg/640px-Hue_VietNam_CitadelMidgate.jpg",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
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
      },
    },
    // ─── Panduranga - Champa (tím đậm, nhỏ) ────────────────
    {
      type: "Feature",
      properties: {
        regionId: "champa-1653",
        dynastyId: "champa",
        name: "Panduranga - Champa",
        ruler: "Vua Po Nraup",
        capital: "Phan Rang",
        color: "#5b2d8a",
        description:
          "Tiểu quốc Champa cuối cùng còn lại sau khi mất Phú Yên năm 1611. Tồn tại đến năm 1832 thì bị nhà Nguyễn sáp nhập hoàn toàn.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [108.4, 12.5],
            [109.2, 12.5],
            [109.3, 11.3],
            [108.7, 11.0],
            [108.4, 11.8],
            [108.4, 12.5],
          ],
        ],
      },
    },
    // ─── Nam Bàn (Tây Nguyên, tím nhạt) ────────────────────
    {
      type: "Feature",
      properties: {
        regionId: "nam-ban-1653",
        dynastyId: "nam-ban",
        name: "Nam Bàn",
        capital: "—",
        color: "#a874c4",
        description:
          "Vùng Tây Nguyên của các tộc thiểu số (Jrai, Êđê...), chưa thuộc về quốc gia nào. Vẫn tự trị.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.5, 14.5],
            [108.5, 14.5],
            [108.5, 12.5],
            [107.5, 12.0],
            [107.2, 13.0],
            [107.5, 14.5],
          ],
        ],
      },
    },
    // ─── Campuchia (tím hồng, miền Tây Nam Bộ + Cambodia) ──
    {
      type: "Feature",
      properties: {
        regionId: "campuchia-1653",
        dynastyId: "khmer",
        name: "Chân Lạp (Campuchia)",
        ruler: "Vua Ang Sur",
        capital: "Oudong",
        color: "#b85ca8",
        description:
          "Vương quốc Chân Lạp (Khmer) bao gồm cả vùng đồng bằng sông Cửu Long. Người Việt mới chỉ bắt đầu di cư vào khai phá.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [103.5, 14.0],
            [105.5, 14.0],
            [107.2, 13.0],
            [107.5, 12.0],
            [107.0, 10.5],
            [106.5, 10.0],
            [105.5, 9.5],
            [104.5, 10.0],
            [103.5, 11.0],
            [103.0, 12.5],
            [103.5, 14.0],
          ],
        ],
      },
    },
    // ─── Lan Xang (Lào, xanh ô liu) ────────────────────────
    {
      type: "Feature",
      properties: {
        regionId: "lan-xang-1653",
        dynastyId: "lan-xang",
        name: "Lan Xang (Lào)",
        ruler: "Vua Sourigna Vongsa",
        capital: "Vientiane",
        color: "#8b9e3b",
        description:
          "Vương quốc Lan Xang (Triệu Voi) thời hoàng kim dưới triều vua Sourigna Vongsa. Tồn tại đến 1707 thì bị chia 3.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [101.0, 22.5],
            [103.4, 22.8],
            [102.9, 20.8],
            [103.8, 19.8],
            [104.5, 19.0],
            [105.2, 18.5],
            [105.0, 17.5],
            [104.5, 16.0],
            [104.0, 15.0],
            [103.5, 14.0],
            [103.0, 14.5],
            [101.5, 17.0],
            [101.0, 19.5],
            [101.0, 22.5],
          ],
        ],
      },
    },
  ],
};
