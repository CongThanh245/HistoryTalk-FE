# AI sinh kịch bản kể chuyện và lược đồ trận đánh

Đặc tả cho team BE (AI service FastAPI `history-talk-backend-AI`). FE đã có editor và trình phát chạy bằng dữ liệu giả. Tài liệu này mô tả các endpoint AI cần thêm để staff không phải soạn tay từ đầu.

- **Phần A: Kịch bản kể chuyện** (visual novel thay cho video giới thiệu): AI viết bản nháp, staff duyệt trong editor kéo thả ở `/staff/stories`.
- **Phần B: Lược đồ trận đánh**: AI lập "kế hoạch trận đánh" (phe, điểm mốc, giai đoạn, ký hiệu). Staff đặt vài điểm mốc lên ảnh, FE tự vẽ ký hiệu.

> Nguyên tắc chung: **AI chỉ sinh nội dung có cấu trúc (JSON), không sinh toạ độ hay bố cục.** FE tự dựng đồ thị kịch bản và tự tính vị trí ký hiệu. Như vậy model nhỏ (Ollama) vẫn cho kết quả dùng được, và FE kiểm soát được hiển thị.

---

## 0. Quy ước chung cho cả hai phần

### 0.1 Đường dẫn và dạng response

Theo các endpoint hiện có trong `presentation/chat/router.py` (prefix `/v1/ai`):

```json
{
  "data": { "...": "..." },
  "tokenUsage": { "promptTokens": 0, "completionTokens": 0, "totalTokens": 0 }
}
```

`tokenUsage` đặt trong `data` hay ở ngoài thì theo đúng cách endpoint `/exam/question` đang làm, miễn là thống nhất.

### 0.2 Sinh dài thì chạy dạng job

Ollama chạy local có thể mất 30–120 giây cho một kịch bản đầy đủ, nên các thao tác "sinh toàn bộ" chạy dạng job:

| Bước | Endpoint | Trả về |
|---|---|---|
| Tạo job | `POST /v1/ai/story/generate` (hoặc `/battle-map/plan`) với `"async": true` | `202` + `{ "data": { "jobId": "..." } }` |
| Theo dõi | `GET /v1/ai/jobs/{jobId}` | `{ status, stage, progress, result?, error? }` |
| Huỷ (tuỳ chọn) | `DELETE /v1/ai/jobs/{jobId}` | `204` |

- `status`: `queued` | `running` | `succeeded` | `failed` | `cancelled`
- `stage` (để FE hiện tiến độ): `retrieving` (đọc tài liệu) → `generating` (đang viết) → `validating` (kiểm tra) → `repairing` (đang sửa lỗi) → `done`
- `progress`: 0–100, ước lượng là được.
- Job có thể giữ trong bộ nhớ (dict + TTL 30 phút) ở giai đoạn đầu, chưa cần DB.
- Các thao tác nhỏ (viết tiếp, viết lại một câu, tạo một câu hỏi) chạy **đồng bộ** (`"async": false`, mặc định), trả kết quả ngay.

### 0.3 Lấy tài liệu (RAG)

- Dùng lại phần truy xuất tài liệu theo `contextId` đang dùng cho chat và vấn đáp.
- Lấy khoảng 8–15 đoạn liên quan nhất, mỗi đoạn có **id ổn định** (ví dụ `chunk_12`, hoặc id của document + chỉ số đoạn) để model trích dẫn lại trong trường `sources`.
- Nếu bối cảnh không có tài liệu thì trả `422` với `detail` dễ hiểu ("Bối cảnh chưa có tài liệu tham khảo"). Không để model tự bịa.

### 0.4 Ép model trả JSON đúng schema

- Ollama (từ bản 0.5) cho truyền **JSON schema vào trường `format`**, thay cho `"json"` như ở `service.py:83`. Dùng `PydanticModel.model_json_schema()`.
- `temperature` khoảng 0.4–0.6; `num_ctx` đủ lớn cho tài liệu cộng prompt (≥ 8192).
- Sau khi nhận JSON:
  1. Parse bằng Pydantic. Lỗi kiểu dữ liệu thì chuyển sang bước sửa.
  2. Chạy **bộ kiểm tra nghiệp vụ** (mục A.5 và B.5).
  3. Nếu có lỗi: gọi model **thêm 1 lần** với prompt sửa lỗi (mục A.7), kèm JSON cũ và danh sách lỗi.
  4. Vẫn còn lỗi thì vẫn trả kết quả, kèm `warnings[]`. FE mở bản nháp và đánh dấu chỗ lỗi cho staff sửa tay. Chỉ trả `500` khi không parse được JSON.

### 0.5 Chống bịa (bắt buộc)

- Mỗi đoạn nội dung (lời thoại, lời thuyết minh giai đoạn, câu hỏi) có trường `sources: string[]` chứa id các đoạn tài liệu đã dùng.
- BE lọc bỏ id không có trong danh sách đã truy xuất.
- Đoạn nào `sources` rỗng thì FE gắn nhãn "Cần kiểm chứng". BE không cần chặn.

### 0.6 Quyền

Chỉ `CONTENT_ADMIN` và `SYSTEM_ADMIN` được gọi các endpoint này (giống các thao tác soạn nội dung khác). Nếu AI service không tự kiểm tra role thì Java BE làm proxy.

---

## Phần A: Kịch bản kể chuyện

### A.1 Luồng

```
Staff chọn bối cảnh, nhân vật kể, độ dài, số lựa chọn, số câu hỏi, ghi chú
  → FE gọi POST /v1/ai/story/generate (mode=full, async)
  → BE: RAG → prompt → Ollama (format = schema) → kiểm tra → sửa 1 lần nếu cần
  → FE nhận `steps`, tự dựng node/edge, tự sắp xếp, mở trong editor ở trạng thái Nháp
  → Staff sửa, xem thử, xuất bản
```

Trong editor còn các nút AI nhỏ, dùng **cùng endpoint**, khác `mode`:

| mode | Dùng khi | Đầu vào thêm | Đầu ra |
|---|---|---|---|
| `full` | Tạo mới cả kịch bản | — | Toàn bộ `steps` |
| `continue` | "AI viết tiếp từ đây" | `previousSteps` (các bước dẫn tới bước đang chọn), `count` (3–5) | 3–5 bước mới nối tiếp |
| `rewrite` | "Viết lại" một lời thoại | `step` cần viết lại, `instruction` (ví dụ "ngắn hơn", "đúng giọng nhân vật") | 1 bước `line` |
| `quiz` | "Tạo câu hỏi cho đoạn này" | `previousSteps` | 1 bước `quiz` |

**Không có** loại bước "hỏi nhân vật tự do". Việc hỏi tự do đi qua tính năng chat hiện có; trình phát có nút mở chat với nhân vật đang nói.

### A.2 Request

`POST /v1/ai/story/generate`

```json
{
  "mode": "full",
  "async": true,
  "contextId": "ctx-bach-dang-938",
  "narratorId": "char-ngo-quyen",
  "characterIds": ["char-ngo-quyen"],
  "options": {
    "gradeLevel": "THCS",
    "targetMinutes": 3,
    "choiceCount": 1,
    "quizCount": 1,
    "tone": "trang trọng, xưng ta – ngươi",
    "notes": "Nhấn mạnh vai trò của thuỷ triều"
  },
  "backgrounds": [
    { "id": "river-dawn", "name": "Sông lúc bình minh" },
    { "id": "river-night", "name": "Sông về đêm" },
    { "id": "camp", "name": "Doanh trại" },
    { "id": "battle", "name": "Trận chiến" },
    { "id": "palace", "name": "Cung điện" }
  ],
  "previousSteps": [],
  "step": null,
  "instruction": null,
  "count": null
}
```

| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `mode` | có | `full` \| `continue` \| `rewrite` \| `quiz` |
| `async` | không | Mặc định `false`. FE gửi `true` cho `full`. |
| `contextId` | có | Dùng để RAG và lấy tên, mô tả bối cảnh. |
| `narratorId` | không | Nhân vật kể chính, xưng "ta". `null` thì dùng người dẫn truyện. |
| `characterIds` | không | Các nhân vật được phép xuất hiện. Mặc định là các nhân vật gắn với bối cảnh. |
| `options.targetMinutes` | không | 2–6, mặc định 3. Khoảng 15 ký tự/giây khi đọc, cộng ~8 giây cho mỗi lựa chọn hoặc câu hỏi. |
| `options.choiceCount` | không | 0–3, mặc định 1. |
| `options.quizCount` | không | 0–3, mặc định 1. |
| `options.notes` | không | Ghi chú tự do của staff, tối đa 500 ký tự. |
| `backgrounds` | có | Danh sách cảnh nền FE đang có. Model chỉ được chọn trong danh sách này. |
| `previousSteps` | khi `continue`/`quiz` | Các bước dẫn tới vị trí hiện tại, đúng định dạng A.3. |
| `step`, `instruction` | khi `rewrite` | |
| `count` | khi `continue` | 3–5 |

Giống `/exam/question`, nên cho phép truyền kèm `contextData` / `characterData` để FE dùng khi dữ liệu chưa lưu xuống DB.

### A.3 Response: định dạng `steps`

Model trả về **danh sách bước phẳng**, mỗi bước trỏ tới bước sau bằng `next`. Model **không** sinh node, edge hay toạ độ; FE tự dựng đồ thị.

```json
{
  "data": {
    "title": "Ngô Quyền kể chuyện Bạch Đằng",
    "startId": "s1",
    "steps": [
      {
        "id": "s1", "type": "line",
        "speaker": "narrator",
        "text": "Năm 938, đất Giao Châu vừa trải qua biến loạn.",
        "expression": "neutral",
        "background": "river-night",
        "sources": ["chunk_3"],
        "next": "s2"
      },
      {
        "id": "s2", "type": "choice",
        "speaker": "char-ngo-quyen",
        "prompt": "Ngươi muốn nghe điều gì trước?",
        "options": [
          { "label": "Kế cắm cọc trên sông", "next": "s3" },
          { "label": "Vì sao quân Nam Hán kéo sang", "next": "s6" }
        ]
      },
      {
        "id": "s7", "type": "quiz",
        "speaker": "char-ngo-quyen",
        "question": "Ta đã dựa vào yếu tố tự nhiên nào để bãi cọc phát huy tác dụng?",
        "answers": ["Thuỷ triều lên xuống", "Gió mùa đông bắc", "Sương mù buổi sớm"],
        "correctIndex": 0,
        "explanation": "Khi triều lên, cọc bị che khuất; khi triều rút, thuyền giặc mắc cạn trên bãi cọc.",
        "sources": ["chunk_12"],
        "next": "s9",
        "wrongNext": "s8"
      },
      {
        "id": "s12", "type": "end",
        "title": "Chiến thắng Bạch Đằng 938",
        "summary": "Ngô Quyền dùng bãi cọc và thuỷ triều đánh tan quân Nam Hán, chấm dứt thời kỳ Bắc thuộc."
      }
    ],
    "warnings": []
  },
  "tokenUsage": { "promptTokens": 5210, "completionTokens": 1830, "totalTokens": 7040 }
}
```

Các trường theo từng loại bước:

| type | Trường | Ràng buộc |
|---|---|---|
| `line` | `speaker`, `text`, `expression`, `background`, `sources`, `next` | `text` ≤ 220 ký tự (khuyến nghị 1–2 câu). `background` là id trong `backgrounds` hoặc `null` (giữ cảnh trước). |
| `choice` | `speaker`, `prompt`, `options[]` (`label`, `next`) | 2–3 lựa chọn, `label` ≤ 60 ký tự. |
| `quiz` | `speaker`, `question`, `answers[]`, `correctIndex`, `explanation`, `sources`, `next`, `wrongNext?` | 2–4 đáp án. `wrongNext` trỏ tới một bước `line` giải thích lại, rồi bước đó quay về `next`. Không có `wrongNext` thì trả lời sai vẫn đi theo `next`. |
| `end` | `title`, `summary` | Đúng 1 bước `end` cho `mode=full`. |

- `speaker`: `"narrator"` hoặc một id trong `characterIds`.
- `expression`: `neutral` | `happy` | `serious` | `sad` | `angry` | `surprised`.
- `id` chỉ cần duy nhất trong response. FE tự đổi sang id riêng khi dựng đồ thị.

Cho `mode=continue`: `steps` là các bước mới, `startId` là bước đầu tiên. Bước cuối có `"next": null`, FE tự nối. Cho `mode=rewrite` / `quiz`: `steps` gồm đúng 1 phần tử.

### A.4 Pydantic gợi ý

```python
Expression = Literal["neutral", "happy", "serious", "sad", "angry", "surprised"]

class ChoiceOption(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    next: str

class LineStep(BaseModel):
    id: str; type: Literal["line"]
    speaker: str
    text: str = Field(min_length=1, max_length=220)
    expression: Expression = "neutral"
    background: str | None = None
    sources: list[str] = []
    next: str | None

class ChoiceStep(BaseModel):
    id: str; type: Literal["choice"]
    speaker: str
    prompt: str = Field(max_length=200)
    options: list[ChoiceOption] = Field(min_length=2, max_length=3)

class QuizStep(BaseModel):
    id: str; type: Literal["quiz"]
    speaker: str
    question: str = Field(min_length=1, max_length=250)
    answers: list[str] = Field(min_length=2, max_length=4)
    correctIndex: int
    explanation: str = Field(max_length=300)
    sources: list[str] = []
    next: str | None
    wrongNext: str | None = None

class EndStep(BaseModel):
    id: str; type: Literal["end"]
    title: str = Field(max_length=80)
    summary: str = Field(max_length=400)

Step = Annotated[LineStep | ChoiceStep | QuizStep | EndStep, Field(discriminator="type")]

class StoryDraft(BaseModel):
    title: str = Field(max_length=100)
    startId: str
    steps: list[Step] = Field(min_length=1, max_length=40)
```

### A.5 Kiểm tra nghiệp vụ (sau khi parse)

Khớp với phần kiểm tra lỗi trong editor FE (`validateStory`), để bản nháp mở ra không bị báo lỗi:

1. `id` không trùng; `startId` tồn tại.
2. Mọi `next`, `wrongNext`, `options[].next` trỏ tới id có thật (trừ `next: null` ở bước cuối khi `mode=continue`).
3. `mode=full`: từ `startId` đi tới được **mọi** bước, và mọi nhánh đều kết thúc ở bước `end`. Cho phép các nhánh gặp lại nhau, không cho vòng lặp vô hạn (không có đường quay lại bước trước).
4. `speaker` thuộc `{"narrator"} ∪ characterIds`; `background` thuộc `backgrounds` hoặc `null`.
5. `0 ≤ correctIndex < len(answers)`; các đáp án không trùng nhau.
6. Số `choice` và `quiz` đúng như `options` yêu cầu (lệch ±1 thì chỉ ghi vào `warnings`).
7. `sources` chỉ chứa id thuộc các đoạn đã truy xuất (lọc bỏ id lạ).

### A.6 Prompt mẫu (`mode=full`)

**System:**

```text
Bạn là biên kịch nội dung giáo dục lịch sử Việt Nam cho ứng dụng HistoryTalk.
Bạn viết kịch bản kể chuyện dạng visual novel: một nhân vật lịch sử trực tiếp kể lại sự kiện cho học sinh.

QUY TẮC BẮT BUỘC
1. Chỉ dùng thông tin có trong phần TÀI LIỆU. Không bịa tên người, địa danh, số liệu, ngày tháng.
   Điều gì tài liệu không nói thì không viết.
2. Mỗi bước "line" và "quiz" phải ghi "sources" là id các đoạn tài liệu đã dùng (ví dụ ["chunk_3"]).
3. Nhân vật kể xưng "ta", gọi học sinh là "ngươi". Người dẫn truyện ("narrator") kể ở ngôi thứ ba.
   Văn phong cổ nhưng dễ hiểu với học sinh {gradeLevel}; tránh từ Hán Việt khó nếu không giải thích.
4. Mỗi lời thoại 1–2 câu, tối đa 200 ký tự. Một ý mỗi bước.
5. Chỉ trả về JSON đúng schema. Không thêm chữ nào ngoài JSON.
```

**User:**

```text
BỐI CẢNH: {contextName} ({yearLabel})
MÔ TẢ: {contextDescription}

NHÂN VẬT KỂ CHÍNH: {narratorName} (id: {narratorId}). {narratorDescription}
NHÂN VẬT ĐƯỢC XUẤT HIỆN (speaker chỉ được là một trong các id sau, hoặc "narrator"):
{- id: tên, mô tả ngắn — mỗi nhân vật một dòng}

CẢNH NỀN ĐƯỢC DÙNG (background chỉ được là một trong các id sau, hoặc null để giữ cảnh trước):
{- id: tên — mỗi cảnh một dòng}

YÊU CẦU KỊCH BẢN
- Thời lượng đọc khoảng {targetMinutes} phút (~{targetMinutes * 12} bước "line").
- Có đúng {choiceCount} bước "choice" (2 lựa chọn). Các nhánh của một lựa chọn phải gặp lại nhau
  trước khi kết thúc; mỗi nhánh dài 2–3 bước.
- Có đúng {quizCount} bước "quiz" hỏi về điều VỪA được kể ở các bước trước. 3 đáp án, 1 đáp án đúng,
  các đáp án sai phải hợp lý (không vô lý). "wrongNext" trỏ tới 1 bước "line" giải thích lại,
  bước đó có "next" trỏ về cùng bước với "next" của quiz.
- Mở đầu bằng 1–2 bước của narrator đặt bối cảnh, sau đó nhân vật kể chính tự giới thiệu.
- Chọn "expression" phù hợp cảm xúc từng câu; đổi "background" khi đổi địa điểm hoặc thời điểm.
- Kết thúc bằng đúng 1 bước "end": "title" ngắn, "summary" 1–2 câu nêu ý chính học sinh cần nhớ.
- Mọi "next" phải trỏ tới id có thật. Không tạo vòng lặp quay lại bước trước.

GHI CHÚ CỦA NGƯỜI SOẠN (nếu có, ưu tiên làm theo nhưng không được trái tài liệu):
{notes}

TÀI LIỆU:
[chunk_3] {nội dung}
[chunk_12] {nội dung}
...
```

### A.7 Prompt sửa lỗi (dùng chung cho Phần A và Phần B)

```text
JSON bạn vừa trả về có các lỗi sau:
{- từng lỗi một dòng, ví dụ: "Bước s5: next trỏ tới 's9' không tồn tại"}

Hãy sửa đúng các lỗi trên, giữ nguyên các phần còn lại, và trả về toàn bộ JSON đã sửa theo đúng schema.
JSON cũ:
{json cũ}
```

### A.8 Prompt cho các mode nhỏ

**`continue`**

```text
Dưới đây là các bước kịch bản đã có (theo thứ tự đã diễn ra):
{previousSteps dạng JSON}

Viết tiếp {count} bước "line" (có thể có tối đa 1 "quiz") nối tiếp mạch chuyện, không lặp lại ý đã kể.
Bước cuối cùng có "next": null. Tuân thủ mọi quy tắc ở trên và chỉ dùng TÀI LIỆU.
```

**`rewrite`**

```text
Viết lại bước sau theo yêu cầu: "{instruction}".
{step dạng JSON}
Giữ nguyên id, type, speaker, next. Chỉ đổi "text" (và "expression" nếu cần). Vẫn đúng với TÀI LIỆU.
```

**`quiz`**

```text
Dựa trên các bước vừa kể:
{previousSteps dạng JSON}
Tạo 1 bước "quiz" kiểm tra ý quan trọng nhất trong đoạn trên, 3 đáp án, có "explanation" và "sources".
Để "next": null và không có "wrongNext"; FE sẽ tự nối.
```

### A.9 Lưu kịch bản (Java BE, ngoài phạm vi AI)

Kịch bản sau khi staff sửa được FE lưu ở dạng đồ thị (khác với `steps` ở trên): `{ id, title, contextId, narratorId, status, nodes[], edges[] }`. Đề xuất (chi tiết sẽ gửi sau):

- Thêm field `storyScript` (JSON, nullable) vào historical context, **hoặc** collection riêng `stories` với `contextId`, `script`, `status` (`draft`/`published`), `version`, `updatedBy`, `updatedAt`.
- Learner chỉ đọc bản `published`. Có bản published thì FE phát kịch bản thay cho `videoUrl`.

---

## Phần B: Lược đồ trận đánh

### B.1 Vì sao không cho AI sinh toạ độ

`battleMap.symbols[]` đặt theo **% toạ độ trên một ảnh bản đồ cụ thể** (xem `battle-map-api-contract.md`). Model chỉ đọc chữ thì không nhìn thấy ảnh, còn model thị giác cho toạ độ không đủ chính xác để vẽ mũi tên hành quân. Vì vậy chia làm hai phần:

| Việc | Ai làm |
|---|---|
| Phe, điểm mốc địa lý cần dùng, các giai đoạn, lời thuyết minh, ký hiệu nào ở giai đoạn nào, đi từ đâu đến đâu | **AI (text)**: `POST /v1/ai/battle-map/plan` |
| Vị trí của từng điểm mốc trên ảnh | **Staff** bấm 5–8 lần lên ảnh. Có thể bấm "AI đoán vị trí" (`POST /v1/ai/battle-map/locate-anchors`, model thị giác) rồi kéo chỉnh lại. |
| Tính `x, y, size, rotation, points` cho từng ký hiệu, camera cho từng giai đoạn | **FE**: hàm `compileBattlePlan(plan, anchors)` |
| Lưu `battleMap` | Theo contract hiện có (`battle-map-api-contract.md`), không đổi |

### B.2 Luồng

```
Staff mở lược đồ trận đánh → "Tạo bằng AI"
  → FE gọi POST /v1/ai/battle-map/plan (async)
  → FE hiện danh sách điểm mốc cần đặt; staff bấm lên ảnh từng điểm
       (tuỳ chọn: FE gọi /battle-map/locate-anchors để đề xuất trước)
  → FE dựng ký hiệu và giai đoạn, cho xem thử phần phát lại
  → "Đưa vào bản đồ": gộp vào bản nháp battleMap hiện tại (có hoàn tác)
```

### B.3 `POST /v1/ai/battle-map/plan`: request

```json
{
  "async": true,
  "contextId": "ctx-bach-dang-938",
  "options": {
    "phaseCount": 5,
    "perspective": "neutral",
    "gradeLevel": "THCS",
    "notes": "Nhấn mạnh việc nhử địch vào lúc triều lên"
  },
  "existingFactions": [
    { "id": "ta", "name": "Quân Ngô Quyền", "color": "#b8321f" }
  ],
  "existingAnchors": [
    { "id": "cua-song", "name": "Cửa sông Bạch Đằng" }
  ],
  "storySummary": null
}
```

| Field | Ghi chú |
|---|---|
| `options.phaseCount` | 3–8, mặc định 5. |
| `options.perspective` | `neutral` \| `<factionId>`: kể theo góc nhìn trung lập hay của một phe. |
| `existingFactions` | Phe staff đã tạo. AI phải dùng lại đúng `id` của các phe này, chỉ thêm phe mới khi thật sự cần. |
| `existingAnchors` | Điểm mốc đã đặt trên ảnh (sinh lại lần hai). AI nên dùng lại để staff không phải đặt lại. |
| `storySummary` | (Tuỳ chọn) Tóm tắt kịch bản kể chuyện của cùng bối cảnh, để lời thuyết minh hai bên khớp nhau. |

### B.4 Response: "kế hoạch trận đánh"

```json
{
  "data": {
    "factions": [
      { "id": "ta", "name": "Quân Ngô Quyền", "side": "ally" },
      { "id": "dich", "name": "Quân Nam Hán", "side": "enemy" }
    ],
    "anchors": [
      { "id": "bien", "name": "Biển (cửa vịnh)", "hint": "Phía đông, nơi thuyền giặc tiến vào", "kind": "area" },
      { "id": "cua-song", "name": "Cửa sông Bạch Đằng", "hint": "Nơi sông đổ ra biển, chỗ cắm bãi cọc", "kind": "point" },
      { "id": "thuong-luu", "name": "Thượng lưu", "hint": "Phía trong sông, nơi quân ta chờ sẵn", "kind": "area" },
      { "id": "bo-bac", "name": "Bờ bắc", "hint": "Hai bên bờ, nơi đặt phục binh", "kind": "area" }
    ],
    "phases": [
      {
        "title": "Bố trí bãi cọc",
        "narration": "Ngô Quyền cho quân đẵn gỗ lim, đẽo nhọn, bịt sắt rồi cắm khắp cửa sông Bạch Đằng.",
        "sources": ["chunk_12"],
        "camera": "auto",
        "symbols": [
          { "type": "stakes", "faction": "ta", "at": "cua-song", "label": "Bãi cọc gỗ lim bịt sắt" },
          { "type": "ambush", "faction": "ta", "at": "bo-bac", "label": "Phục binh hai bên bờ" }
        ]
      },
      {
        "title": "Nhử địch vào sâu",
        "narration": "Khi triều lên, thuyền nhẹ của ta ra khiêu chiến rồi giả thua, nhử thuỷ quân Nam Hán vượt qua bãi cọc.",
        "sources": ["chunk_13"],
        "camera": "auto",
        "symbols": [
          { "type": "navy", "faction": "dich", "at": "bien", "label": "Thuỷ quân Lưu Hoằng Tháo" },
          { "type": "arrow", "faction": "dich", "from": "bien", "to": "cua-song", "label": "Giặc đuổi theo vào sông" },
          { "type": "retreat", "faction": "ta", "from": "cua-song", "to": "thuong-luu", "label": "Thuyền nhẹ giả thua" }
        ]
      },
      {
        "title": "Phản công khi triều rút",
        "narration": "Nước rút, quân ta từ thượng lưu và hai bên bờ đánh ập xuống; thuyền giặc va vào cọc, vỡ tan.",
        "sources": ["chunk_13", "chunk_14"],
        "camera": "auto",
        "symbols": [
          { "type": "arrow", "faction": "ta", "from": "thuong-luu", "to": "cua-song", "label": "Quân ta phản công" },
          { "type": "flank", "faction": "ta", "from": "bo-bac", "to": "cua-song", "label": "Phục binh đánh ra" },
          { "type": "clash", "faction": "ta", "at": "cua-song", "label": "Giao tranh trên bãi cọc" },
          { "type": "destroyed", "faction": "dich", "at": "cua-song", "label": "Hoằng Tháo tử trận" }
        ]
      }
    ],
    "warnings": []
  },
  "tokenUsage": { "promptTokens": 0, "completionTokens": 0, "totalTokens": 0 }
}
```

**Ký hiệu hợp lệ**: dùng đúng các khoá của `SYMBOL_LABELS` ở FE (`battle-map.types.ts`). Mỗi nhóm cần trường vị trí khác nhau:

| Nhóm | `type` | Trường vị trí |
|---|---|---|
| Hướng hành động | `arrow` (tiến công), `flank` (vu hồi/bao vây), `march` (cơ động), `retreat` (rút lui) | **`from` + `to`** (2 điểm mốc khác nhau). Tuỳ chọn `via` là 1 điểm mốc trung gian. |
| Tuyến | `defenseLine` (phòng tuyến), `stakes` (bãi cọc) | `at` (FE vẽ một đoạn cắt ngang qua điểm mốc) |
| Lực lượng | `infantry`, `cavalry`, `archer`, `artillery`, `armor`, `navy`, `airforce` | `at` |
| Trận địa | `headquarters`, `fort`, `camp`, `ambush` | `at` |
| Diễn biến | `clash`, `victory`, `destroyed` | `at` |
| Chú thích | `label` (chữ hiện trên bản đồ, ví dụ tên địa danh) | `at` |

- **AI không dùng `step`**: số thứ tự do FE tự đánh theo giai đoạn.
- Lưu ý thời đại: không dùng `armor`, `airforce`, `artillery` cho trận trước thời có các binh chủng đó.
- `label` là chú thích hiện ở chú giải và khi rê chuột, ≤ 60 ký tự.
- `faction`: id trong `factions`. `side`: `ally` | `enemy` | `neutral` (FE dùng để chọn màu mặc định).
- `anchor.kind`: `point` (một vị trí cụ thể) | `area` (một vùng). FE dùng để chọn kiểu đặt; staff vẫn chỉ bấm 1 điểm.
- `camera`: `auto` (FE zoom vào các ký hiệu của giai đoạn) | `full` (toàn bản đồ). AI không sinh `frame`.
- `narration` ≤ 600 ký tự (FE cho tối đa 2000, nhưng lời thuyết minh nên ngắn), 2–3 câu.

### B.5 Kiểm tra nghiệp vụ

1. `factions`: 2–4 phe, `id` không trùng; phe nào có trong `existingFactions` thì phải giữ nguyên `id`.
2. `anchors`: 3–10 điểm, `id` không trùng; mỗi điểm mốc được ít nhất 1 ký hiệu dùng tới (bỏ điểm mốc thừa).
3. `phases`: đúng `phaseCount` ± 1; mỗi giai đoạn có 1–6 ký hiệu; `title` ≤ 60 ký tự.
4. Mỗi ký hiệu: `type` thuộc bảng trên; có đúng trường vị trí theo nhóm (`from`/`to` cho hướng hành động, `at` cho các nhóm còn lại); `from ≠ to`; mọi `at`/`from`/`to`/`via` trỏ tới anchor có thật; `faction` có thật.
5. Tổng số ký hiệu ≤ 40 (bản đồ quá dày thì khó đọc).
6. Lọc `sources` như mục 0.5.

### B.6 Prompt mẫu `battle-map/plan`

**System:**

```text
Bạn là chuyên gia lịch sử quân sự Việt Nam, soạn lược đồ trận đánh động cho học sinh {gradeLevel}.
Bạn KHÔNG vẽ bản đồ và KHÔNG đưa ra toạ độ. Bạn chỉ lập kế hoạch: các phe, các điểm mốc địa lý cần
đánh dấu, các giai đoạn diễn biến, và trong mỗi giai đoạn có những ký hiệu nào, đặt ở điểm mốc nào,
di chuyển từ điểm mốc nào tới điểm mốc nào.

QUY TẮC BẮT BUỘC
1. Chỉ dùng thông tin có trong TÀI LIỆU. Không bịa quân số, tên tướng, hướng tiến quân.
   Tài liệu không nói rõ hướng di chuyển thì không vẽ mũi tên đó.
2. Mỗi giai đoạn ghi "sources" là id các đoạn tài liệu đã dùng.
3. Điểm mốc là địa danh hoặc vùng địa lý có thể nhận ra trên bản đồ (sông, cửa biển, thành, núi,
   bờ sông...). Đặt tên ngắn, "hint" mô tả vị trí tương đối (phía đông, thượng lưu, hai bên bờ...)
   để người soạn dễ tìm trên ảnh. Dùng càng ít điểm mốc càng tốt (3–8).
4. Chỉ dùng các loại ký hiệu được liệt kê. Hướng hành động (arrow, flank, march, retreat) phải có
   "from" và "to"; mọi loại khác dùng "at". Không dùng loại "step".
5. Diễn biến theo đúng trình tự thời gian; mỗi giai đoạn chỉ thêm những gì MỚI xảy ra.
6. Lời thuyết minh 2–3 câu, rõ ràng, đúng với các ký hiệu của giai đoạn đó.
7. Chỉ trả về JSON đúng schema.
```

**User:**

```text
TRẬN ĐÁNH: {contextName} ({yearLabel}) — {location}
MÔ TẢ: {contextDescription}

CÁC PHE ĐÃ CÓ (giữ nguyên id nếu dùng lại):
{- id: tên}
CÁC ĐIỂM MỐC ĐÃ ĐẶT TRÊN ẢNH (ưu tiên dùng lại):
{- id: tên}

LOẠI KÝ HIỆU ĐƯỢC DÙNG:
- Hướng hành động (cần from, to): arrow = tiến công, flank = vu hồi/bao vây, march = cơ động, retreat = rút lui
- Tuyến (cần at): defenseLine = phòng tuyến, stakes = bãi cọc
- Lực lượng (cần at): infantry = bộ binh, cavalry = kỵ binh, archer = cung nỏ, artillery = pháo binh,
  armor = thiết giáp, navy = thuỷ quân, airforce = không quân
- Trận địa (cần at): headquarters = sở chỉ huy, fort = thành/đồn luỹ, camp = doanh trại, ambush = mai phục
- Diễn biến (cần at): clash = giao tranh, victory = chiến thắng, destroyed = bị tiêu diệt
- label (cần at): chữ chú thích hiện trên bản đồ

YÊU CẦU
- Khoảng {phaseCount} giai đoạn, theo góc nhìn: {perspective}.
- Giai đoạn đầu: bố trí lực lượng ban đầu. Giai đoạn cuối: kết quả trận đánh (victory / destroyed).
- Mỗi giai đoạn 1–6 ký hiệu; toàn bản đồ không quá 40 ký hiệu.

TÓM TẮT KỊCH BẢN KỂ CHUYỆN (nếu có, lời thuyết minh nên khớp):
{storySummary}

GHI CHÚ CỦA NGƯỜI SOẠN:
{notes}

TÀI LIỆU:
[chunk_12] {nội dung}
...
```

### B.7 `POST /v1/ai/battle-map/locate-anchors` (tuỳ chọn, model thị giác)

Đề xuất vị trí điểm mốc trên ảnh, để staff chỉ cần kéo chỉnh. Dùng lại cấu hình thị giác đang có trong `describe_historical_image` (Gemini khi `VISION_PROVIDER=google`, fallback Ollama `qwen2.5vl`).

Request:

```json
{
  "imageUrl": "https://.../bach-dang-blank-map.jpg",
  "imageBase64": null,
  "anchors": [
    { "id": "cua-song", "name": "Cửa sông Bạch Đằng", "hint": "Nơi sông đổ ra biển" },
    { "id": "bien", "name": "Biển (cửa vịnh)", "hint": "Phía đông" }
  ]
}
```

Response (toạ độ **% theo chiều rộng/cao ảnh**, 0–100, cùng hệ toạ độ với `BattleSymbol.x/y`):

```json
{
  "data": {
    "anchors": [
      { "id": "cua-song", "found": true, "x": 61.5, "y": 48.2, "confidence": 0.7 },
      { "id": "bien", "found": true, "x": 85.0, "y": 52.0, "confidence": 0.5 }
    ]
  }
}
```

- `imageBase64` dùng khi ảnh mới upload ở bản nháp (FE cho tối đa 2 MB).
- **BE phải đổi về %**: Gemini trả điểm dạng `[y, x]` chuẩn hoá 0–1000; Qwen2.5-VL trả toạ độ pixel tuyệt đối theo kích thước ảnh sau khi resize, nên cần chia theo kích thước ảnh thực model nhận.
- Không chắc thì trả `found: false`. FE sẽ yêu cầu staff tự đặt. Không ép model đoán.

Prompt mẫu:

```text
Đây là một bản đồ lịch sử. Hãy tìm vị trí của các địa điểm sau trên ảnh.
Ưu tiên chữ địa danh in trên bản đồ; nếu không có chữ, dựa vào đặc điểm địa lý và gợi ý vị trí.
{- id: tên — gợi ý}

Trả về JSON: {"anchors": [{"id": "...", "found": true/false, "point": [y, x], "confidence": 0..1}]}
trong đó [y, x] chuẩn hoá theo thang 0–1000. Nếu không chắc chắn, đặt "found": false và bỏ "point".
```

### B.8 Phần FE tự làm (để BE nắm, không cần triển khai)

- `compileBattlePlan(plan, anchorPositions) → BattleMap`:
  - Hướng hành động: tạo `points` là đường cong từ mốc `from` tới `to` (qua `via` nếu có). Nhiều mũi tên trùng cặp mốc thì đẩy lệch sang hai bên.
  - `at`: đặt ký hiệu quanh điểm mốc, tự giãn cách khi nhiều ký hiệu chung một mốc.
  - `phases[]` → `BattlePhase` (id do FE sinh), ký hiệu gắn `phaseId`; `camera` giữ nguyên.
  - Kết quả qua `isBattleMap()` rồi gộp vào bản nháp hiện có.
- Màu phe: FE chọn theo `side` nếu phe chưa có màu.

---

## Kiểm thử đề xuất cho BE

| Trường hợp | Kỳ vọng |
|---|---|
| Bối cảnh không có tài liệu | `422`, `detail` rõ ràng |
| Kịch bản `full` với `choiceCount=1, quizCount=1` | Qua mục A.5, có đúng 1 `end`, mọi bước đi tới được |
| Model trả `next` trỏ tới id không tồn tại | Bước sửa lỗi chạy; nếu vẫn lỗi thì trả kèm `warnings` |
| `speaker` / `background` ngoài danh sách | Bị bắt ở bước kiểm tra, sửa hoặc ghi vào `warnings` |
| `sources` chứa id lạ | Bị lọc bỏ |
| Lược đồ: `arrow` thiếu `to`, hoặc `from == to` | Bị bắt ở bước kiểm tra (B.5 mục 4) |
| Lược đồ: có `existingFactions` | Giữ đúng `id` phe cũ |
| Lược đồ trận cổ đại | Không xuất hiện `armor` / `airforce` |
| `locate-anchors` với ảnh không có chữ địa danh | Phần lớn trả `found: false`, không đoán bừa |
| Job `async` | `GET /v1/ai/jobs/{id}` đi qua các `stage`, kết thúc `succeeded` kèm `result` |

Ví dụ trận Bạch Đằng 938 dùng trong tài liệu này trùng với dữ liệu giả ở FE (`src/features/story/mock-data.ts`). Khi nối API thật, có thể đối chiếu trực tiếp với dữ liệu giả.
