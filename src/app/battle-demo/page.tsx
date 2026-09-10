import React from 'react';
import { BattlePlayer } from '@/features/remotion-battle/BattlePlayer';
import { BattleTimelineData } from '@/features/remotion-battle/types';

// Mock Data representing the result from the backend/AI
const mockBattleData: BattleTimelineData = {
  "battleId": "bach-dang-938",
  "battleName": "Trận Bạch Đằng năm 938",
  "backgroundImageUrl": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2600&auto=format&fit=crop",
  "totalDurationInSeconds": 130,
  "events": [
    {
      "step": 1,
      "timeLabel": "Năm 937",
      "title": "Họa phản nghịch và mưu đồ ngoại bang",
      "description": "Kiều Công Tiễn giết Dương Đình Nghệ để đoạt chức Tiết độ sứ. Bị quân dân phẫn nộ, Tiễn sợ hãi cầu cứu nhà Nam Hán. Vua Nam Hán chớp lấy cơ hội vàng này để lên kế hoạch xâm lược Giao Châu lần nữa.",
      "faction": "enemy",
      "positionX": 90,
      "positionY": 10,
      "displayDuration": 10
    },
    {
      "step": 2,
      "timeLabel": "Tháng 10 năm 938",
      "title": "Diệt thù trong, bẻ gãy nội ứng",
      "description": "Ngô Quyền nhanh chóng tập hợp lực lượng từ Ái Châu kéo ra Bắc (Đại La) như vũ bão, tiêu diệt tên phản bội Kiều Công Tiễn trước khi quân Nam Hán kịp kéo sang, làm thất bại ngay từ đầu âm mưu 'nội công ngoại kích' của giặc.",
      "faction": "ally",
      "positionX": 20,
      "positionY": 20,
      "displayDuration": 10
    },
    {
      "step": 3,
      "timeLabel": "Cuối năm 938",
      "title": "Quân Nam Hán xuất binh",
      "description": "Vua Nam Hán Lưu Cung phong con trai là Vạn Vương Hoằng Tháo làm Nam Giao Vương, thống lĩnh đạo thủy quân thiện chiến vượt biển tiến sang. Đích thân Lưu Cung đóng quân ở trấn Hải Môn (sát biên giới) để làm kế thanh viện.",
      "faction": "enemy",
      "positionX": 95,
      "positionY": 30,
      "displayDuration": 10
    },
    {
      "step": 4,
      "timeLabel": "Giai đoạn chuẩn bị",
      "title": "Hội thề Đại La và Kế sách cọc ngầm",
      "description": "Tại thành Đại La, Ngô Quyền họp các tướng, đánh giá Hoằng Tháo chỉ là 'đứa trẻ dại'. Ông vạch ra kế sách lợi dụng thủy triều và đóng cọc ngầm vạt nhọn bịt sắt ở cửa biển để vô hiệu hóa sức mạnh chiến thuyền của địch.",
      "faction": "ally",
      "positionX": 30,
      "positionY": 35,
      "displayDuration": 10
    },
    {
      "step": 5,
      "timeLabel": "Hơn một tháng trước trận",
      "title": "Xây dựng bãi cọc tử thần",
      "description": "Quân và dân ta ngày đêm vào rừng đốn gỗ lim, sến, vạt nhọn, bịt sắt và bí mật đóng thành những hàng dài chắc chắn dưới lòng sông Bạch Đằng. Khi triều lên bãi cọc ngập chìm, triều xuống cọc mới phơi ra.",
      "faction": "ally",
      "positionX": 50,
      "positionY": 50,
      "displayDuration": 10
    },
    {
      "step": 6,
      "timeLabel": "Trước khi giặc đến",
      "title": "Dàn thế trận mai phục",
      "description": "Ngô Quyền giấu quân trong các nhánh sông và rừng rậm. Dương Tam Kha phục kích tả ngạn, Đỗ Cảnh Thạc và Ngô Xương Ngập giữ hữu ngạn. Ngô Quyền đích thân chỉ huy đại quân ở trung tâm, sẵn sàng đánh vỗ mặt.",
      "faction": "ally",
      "positionX": 55,
      "positionY": 45,
      "displayDuration": 10
    },
    {
      "step": 7,
      "timeLabel": "Tháng 12 năm 938",
      "title": "Đoàn thuyền giặc xâm phạm",
      "description": "Đoàn binh thuyền Nam Hán do Hoằng Tháo chỉ huy ồ ạt vượt qua vùng biển Đông Bắc, len lỏi qua các đảo nhỏ vịnh Hạ Long và hung hăng tiến thẳng vào cửa sông Bạch Đằng mà không biết đang chui vào rọ.",
      "faction": "enemy",
      "positionX": 85,
      "positionY": 50,
      "displayDuration": 10
    },
    {
      "step": 8,
      "timeLabel": "Sáng sớm (nước triều dâng)",
      "title": "Thuyền nhẹ khiêu chiến",
      "description": "Khi mũi thuyền giặc vừa tới, mặt nước dâng mênh mông che lấp bãi cọc. Tướng Nguyễn Tất Tố thống lĩnh đội thuyền nhỏ, nhẹ lao ra khiêu chiến, vừa đánh vừa cố kìm chân giặc để chờ con nước lên đến đỉnh điểm.",
      "faction": "ally",
      "positionX": 75,
      "positionY": 50,
      "displayDuration": 10
    },
    {
      "step": 9,
      "timeLabel": "Trưa (triều đạt đỉnh)",
      "title": "Dụ địch vào rọ",
      "description": "Đội thuyền của Nguyễn Tất Tố giả vờ cạn kiệt sức lực, quay mũi tháo chạy. Hoằng Tháo chủ quan, ngạo mạn thúc đại quân hăng máu đuổi theo tiêu diệt, lọt hoàn toàn vào sâu bên trong trận địa cọc ngầm mai phục.",
      "faction": "enemy",
      "positionX": 65,
      "positionY": 50,
      "displayDuration": 10
    },
    {
      "step": 10,
      "timeLabel": "Chiều (triều bắt đầu rút)",
      "title": "Ngô Quyền phát lệnh tổng công kích",
      "description": "Nước triều bắt đầu rút. Nguyễn Tất Tố quay thuyền đánh quật lại. Từ ba phía, Ngô Quyền cùng các tướng Dương Tam Kha, Đỗ Cảnh Thạc tung toàn bộ thủy bộ binh đổ ra đánh vỗ mặt và kẹp chặt hai bên sườn địch.",
      "faction": "ally",
      "positionX": 60,
      "positionY": 50,
      "displayDuration": 10
    },
    {
      "step": 11,
      "timeLabel": "Cuối chiều (nước rút mạnh)",
      "title": "Cọc nhọn xuyên thủng thuyền giặc",
      "description": "Bị tiến công dữ dội, giặc rối loạn quay thuyền tháo chạy ra biển. Cùng lúc nước triều rút mạnh, hàng ngàn cọc gỗ bịt sắt nhô lên đâm thủng, xé toạc chiến thuyền Nam Hán, khiến chúng kẹt cứng và chìm dần.",
      "faction": "enemy",
      "positionX": 65,
      "positionY": 55,
      "displayDuration": 10
    },
    {
      "step": 12,
      "timeLabel": "Kết thúc trận chiến",
      "title": "Thủy quân Nam Hán bị xóa sổ",
      "description": "Toàn bộ đoàn binh thuyền hùng hậu bị đánh chìm xuống sông Bạch Đằng. Quân lính chết đuối quá nửa. Chủ tướng trẻ tuổi hung hăng Lưu Hoằng Tháo bị quân Ngô Quyền bắt sống và chém đầu tại trận.",
      "faction": "ally",
      "positionX": 65,
      "positionY": 60,
      "displayDuration": 10
    },
    {
      "step": 13,
      "timeLabel": "Hậu chiến",
      "title": "Nam Hán từ bỏ mộng xâm lăng",
      "description": "Tại trấn Hải Môn, vua Nam Hán Lưu Cung nghe tin con trai tử trận, đạo quân bị tiêu diệt hoàn toàn trong chớp nhoáng thì kinh hoàng, rụng rời tay chân. Y đành thương khóc, thu nhặt tàn quân tháo chạy về nước, vĩnh viễn bỏ mộng xâm lược.",
      "faction": "enemy",
      "positionX": 95,
      "positionY": 30,
      "displayDuration": 10
    }
  ]
};

export default function BattleDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-amber-500">HistoryTalk Remotion Demo</h1>
          <p className="text-slate-400">
            Đây là bản Proof of Concept. Video này KHÔNG PHẢI là file MP4, mà được Render trực tiếp bằng Code (React) theo thời gian thực dựa trên JSON Template.
          </p>
        </div>

        {/* The Remotion Player */}
        <BattlePlayer data={mockBattleData} />

        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h3 className="font-bold mb-4 text-emerald-400">JSON Data Input (Nhập từ Admin/AI):</h3>
          <pre className="text-xs text-slate-300 overflow-x-auto p-4 bg-black rounded">
            {JSON.stringify(mockBattleData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
