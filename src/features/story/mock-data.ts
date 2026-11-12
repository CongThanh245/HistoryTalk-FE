/**
 * Fake data for the story feature while the backend has no story API.
 * Stories are kept in localStorage so edits survive a reload.
 */
import { autoLayout, createNode } from "./graph-utils";
import type {
  Expression,
  StoryBackground,
  StoryCharacter,
  StoryDoc,
  StoryFlowEdge,
  StoryFlowNode,
  StoryNodeData,
} from "./types";

export const MOCK_CHARACTERS: StoryCharacter[] = [
  { id: "ngo-quyen", name: "Ngô Quyền", title: "Tiết độ sứ, người thắng trận Bạch Đằng", portraitUrl: "/ngo_quyen.png", accent: "#B8321F" },
  { id: "le-loi", name: "Lê Lợi", title: "Lãnh tụ khởi nghĩa Lam Sơn", portraitUrl: "/le_loi.png", accent: "#9A7426" },
  { id: "ngu-phu", name: "Lão ngư phủ", title: "Người dân làng ven sông", portraitUrl: null, accent: "#3D6B63" },
  { id: "linh-tre", name: "Lính trẻ", title: "Quân sĩ dưới trướng Ngô Quyền", portraitUrl: null, accent: "#2F4A5C" },
];

export const MOCK_BACKGROUNDS: StoryBackground[] = [
  {
    id: "river-dawn",
    name: "Sông lúc bình minh",
    css: "linear-gradient(180deg,#F7C98B 0%,#E58B5A 34%,#9B5A4A 50%,#2F4A5C 64%,#14232E 100%)",
  },
  {
    id: "river-night",
    name: "Sông về đêm",
    css: "radial-gradient(ellipse at 70% 20%,#3B5670 0%,transparent 45%),linear-gradient(180deg,#0E1824 0%,#1B2C3D 55%,#0A121A 100%)",
  },
  {
    id: "camp",
    name: "Doanh trại",
    css: "radial-gradient(ellipse at 50% 85%,#E0844A 0%,#7A3A1E 30%,transparent 62%),linear-gradient(180deg,#1E1612 0%,#3A2418 60%,#140E0B 100%)",
  },
  {
    id: "battle",
    name: "Trận chiến",
    css: "radial-gradient(ellipse at 30% 70%,#C2482F 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,#5A2A1E 0%,transparent 55%),linear-gradient(180deg,#2A1410 0%,#16090A 100%)",
  },
  {
    id: "palace",
    name: "Cung điện",
    css: "radial-gradient(ellipse at 50% 30%,#E8C26A 0%,transparent 55%),linear-gradient(180deg,#7A1F12 0%,#4A120B 70%,#2A0A06 100%)",
  },
  {
    id: "scroll",
    name: "Giấy dó",
    css: "radial-gradient(ellipse at 50% 50%,#F5F2EA 0%,#E2DCCF 70%,#C9BFA8 100%)",
  },
  { id: "banner", name: "Ảnh: Anh hùng dân tộc", css: "url(/banner.png) center/cover no-repeat" },
  { id: "war", name: "Ảnh: Chiến trận", css: "url(/war.jpg) center/cover no-repeat" },
];

export const DEFAULT_BACKGROUND = "scroll";

export function findCharacter(id: string | null | undefined) {
  return id ? MOCK_CHARACTERS.find((c) => c.id === id) ?? null : null;
}

export function findBackground(id: string | null | undefined) {
  return MOCK_BACKGROUNDS.find((b) => b.id === id) ?? MOCK_BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND)!;
}

// ── Story builders ────────────────────────────────────────

function node(id: string, data: StoryNodeData): StoryFlowNode {
  return { id, type: data.kind, position: { x: 0, y: 0 }, data, deletable: data.kind !== "start" };
}
const line = (id: string, speakerId: string | null, text: string, expression: Expression = "neutral", background: string | null = null) =>
  node(id, { kind: "line", speakerId, text, expression, background });
const edge = (source: string, target: string, sourceHandle = "next"): StoryFlowEdge => ({
  id: `e_${source}_${sourceHandle}_${target}`,
  source,
  sourceHandle,
  target,
  targetHandle: "in",
});

function bachDang(): StoryDoc {
  const nodes: StoryFlowNode[] = [
    node("start", { kind: "start", note: "Mở đầu khi học sinh mở bối cảnh Trận Bạch Đằng 938" }),
    line("l1", null, "Năm 938. Đất Giao Châu vừa trải qua biến loạn: Kiều Công Tiễn giết Dương Đình Nghệ để đoạt quyền.", "neutral", "river-night"),
    line("l2", "ngo-quyen", "Ta là Ngô Quyền, con rể của Dương Đình Nghệ. Kẻ phản chủ ấy lại còn cầu cứu giặc phương Bắc.", "serious", "camp"),
    line("l3", "ngo-quyen", "Ngồi xuống đây. Ta sẽ kể ngươi nghe trận đánh trên sông Bạch Đằng.", "happy"),
    node("c1", {
      kind: "choice",
      speakerId: "ngo-quyen",
      prompt: "Ngươi muốn nghe điều gì trước?",
      options: [
        { id: "opt_coc", label: "Kế cắm cọc trên sông" },
        { id: "opt_vi_sao", label: "Vì sao quân Nam Hán kéo sang" },
      ],
    }),
    line("l6", "ngo-quyen", "Vua Nam Hán thấy nước ta rối ren, liền sai con là Lưu Hoằng Tháo đem thủy quân sang, danh nghĩa là giúp Công Tiễn.", "serious", "river-night"),
    line("l7", "ngo-quyen", "Chúng tưởng vào nước ta dễ như vào chỗ không người. Nhưng ta đã giết Công Tiễn trước khi chúng tới.", "angry"),
    line("l4", "ngo-quyen", "Ta sai quân vào rừng đẵn gỗ lim, đẽo nhọn, bịt sắt, đem cắm khắp cửa sông Bạch Đằng.", "serious", "river-dawn"),
    line("l5", "ngu-phu", "Lúc triều lên, nước phủ kín hết đầu cọc. Thuyền giặc đi qua chẳng hề hay biết gì!", "surprised"),
    node("q1", {
      kind: "quiz",
      speakerId: "ngo-quyen",
      question: "Ta đã dựa vào yếu tố tự nhiên nào để bãi cọc phát huy tác dụng?",
      answers: [
        { id: "a_trieu", label: "Thủy triều lên xuống" },
        { id: "a_gio", label: "Gió mùa đông bắc" },
        { id: "a_suong", label: "Sương mù buổi sớm" },
      ],
      correctId: "a_trieu",
      explanation: "Khi triều lên, bãi cọc bị nước che khuất. Khi triều rút, thuyền giặc mắc lại và vỡ trên đầu cọc.",
    }),
    line("l9", "ngo-quyen", "Chưa đúng. Nước sông Bạch Đằng lên xuống theo con nước thủy triều mỗi ngày, ta đã tính đúng giờ nước rút.", "neutral"),
    line("l8", "ngo-quyen", "Ta cho thuyền nhẹ ra khiêu chiến rồi giả thua, nhử Hoằng Tháo đuổi vào sâu khi nước đang lên.", "serious", "battle"),
    line("l10", "linh-tre", "Nước rút rồi! Thuyền giặc đâm vào cọc, vỡ tan cả. Hoằng Tháo tử trận rồi!", "surprised"),
    line("l11", "ngo-quyen", "Mùa xuân năm 939, ta xưng vương, đóng đô ở Cổ Loa. Hơn một nghìn năm Bắc thuộc đã khép lại từ đây.", "happy", "palace"),
    node("end", {
      kind: "end",
      title: "Chiến thắng Bạch Đằng 938",
      summary: "Ngô Quyền dùng bãi cọc và thủy triều đánh tan quân Nam Hán, chấm dứt thời kỳ Bắc thuộc, mở ra thời kỳ độc lập lâu dài.",
      xp: 50,
      unlockCharacters: true,
    }),
  ];
  const edges = [
    edge("start", "l1"),
    edge("l1", "l2"),
    edge("l2", "l3"),
    edge("l3", "c1"),
    edge("c1", "l4", "opt_coc"),
    edge("c1", "l6", "opt_vi_sao"),
    edge("l6", "l7"),
    edge("l7", "l4"),
    edge("l4", "l5"),
    edge("l5", "q1"),
    edge("q1", "l8", "correct"),
    edge("q1", "l9", "wrong"),
    edge("l9", "l8"),
    edge("l8", "l10"),
    edge("l10", "l11"),
    edge("l11", "end"),
  ];
  return {
    id: "story-bach-dang-938",
    title: "Ngô Quyền kể chuyện Bạch Đằng",
    contextId: "ctx-bach-dang-938",
    contextName: "Trận Bạch Đằng năm 938",
    narratorId: "ngo-quyen",
    status: "published",
    updatedAt: "2026-11-10T09:30:00.000Z",
    nodes: autoLayout(nodes, edges),
    edges,
  };
}

function lamSon(): StoryDoc {
  const nodes: StoryFlowNode[] = [
    node("start", { kind: "start", note: "" }),
    line("l1", "le-loi", "Ta là Lê Lợi. Năm 1418, ta dựng cờ khởi nghĩa ở Lam Sơn, xưng là Bình Định Vương.", "serious", "camp"),
    node("c1", {
      kind: "choice",
      speakerId: "le-loi",
      prompt: "Ngươi muốn biết về giai đoạn nào?",
      options: [
        { id: "o_kho", label: "Những năm gian khổ ở núi Chí Linh" },
        { id: "o_thang", label: "Trận Chi Lăng – Xương Giang" },
      ],
    }),
    line("l2", "le-loi", "", "sad", "river-night"),
  ];
  const edges = [edge("start", "l1"), edge("l1", "c1"), edge("c1", "l2", "o_kho")];
  return {
    id: "story-lam-son",
    title: "Lê Lợi và khởi nghĩa Lam Sơn",
    contextId: "ctx-lam-son",
    contextName: "Khởi nghĩa Lam Sơn (1418–1427)",
    narratorId: "le-loi",
    status: "draft",
    updatedAt: "2026-11-11T14:05:00.000Z",
    nodes: autoLayout(nodes, edges),
    edges,
  };
}

export const MOCK_CONTEXTS = [
  { id: "ctx-bach-dang-938", name: "Trận Bạch Đằng năm 938" },
  { id: "ctx-lam-son", name: "Khởi nghĩa Lam Sơn (1418–1427)" },
  { id: "ctx-nhu-nguyet", name: "Trận Như Nguyệt năm 1077" },
  { id: "ctx-dong-da", name: "Chiến thắng Ngọc Hồi – Đống Đa 1789" },
];

// ── Fake repository (localStorage) ────────────────────────

// v2: the "ask" step was removed; older saved stories are reseeded.
const KEY = "historytalk.stories.v2";

function seed(): StoryDoc[] {
  return [bachDang(), lamSon()];
}

function readAll(): StoryDoc[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StoryDoc[];
  } catch {
    /* storage blocked or corrupted: fall back to the seed */
  }
  return seed();
}

function writeAll(stories: StoryDoc[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stories));
  } catch {
    /* storage unavailable: edits live only for this page */
  }
}

export const storyRepo = {
  list(): StoryDoc[] {
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string): StoryDoc | null {
    return readAll().find((s) => s.id === id) ?? null;
  },
  save(doc: StoryDoc): StoryDoc {
    const saved = { ...doc, updatedAt: new Date().toISOString() };
    const all = readAll();
    const i = all.findIndex((s) => s.id === doc.id);
    if (i >= 0) all[i] = saved;
    else all.push(saved);
    writeAll(all);
    return saved;
  },
  create(contextId: string): StoryDoc {
    const ctx = MOCK_CONTEXTS.find((c) => c.id === contextId) ?? MOCK_CONTEXTS[0];
    const start = createNode("start", { x: 0, y: 0 });
    const first = createNode("line", { x: 0, y: 0 });
    const end = createNode("end", { x: 0, y: 0 });
    const edges = [
      { id: `e_${start.id}_${first.id}`, source: start.id, sourceHandle: "next", target: first.id, targetHandle: "in" },
      { id: `e_${first.id}_${end.id}`, source: first.id, sourceHandle: "next", target: end.id, targetHandle: "in" },
    ];
    const doc: StoryDoc = {
      id: `story-${Date.now().toString(36)}`,
      title: `Kịch bản: ${ctx.name}`,
      contextId: ctx.id,
      contextName: ctx.name,
      narratorId: null,
      status: "draft",
      updatedAt: new Date().toISOString(),
      nodes: autoLayout([start, first, end], edges),
      edges,
    };
    return this.save(doc);
  },
  remove(id: string) {
    writeAll(readAll().filter((s) => s.id !== id));
  },
  reset() {
    writeAll(seed());
  },
};
