import type { Classroom, TeacherAccount } from "@/features/saas/types";

/** Teachers of a class: the homeroom teacher first, flagged "Chủ nhiệm". */
export function ClassTeachers({
  classroom,
  teacherById,
  showEmail = true,
}: {
  classroom: Classroom;
  teacherById: Map<string, TeacherAccount>;
  showEmail?: boolean;
}) {
  const ids = Array.from(new Set([classroom.homeroomTeacherId, ...classroom.teacherIds].filter((x): x is string => !!x)));
  const list = ids.map((id) => teacherById.get(id)).filter((t): t is TeacherAccount => !!t);

  if (list.length === 0) return <p className="text-sm text-[var(--status-warning)]">Lớp chưa được phân công giáo viên.</p>;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((t) => {
        const isHomeroom = t.id === classroom.homeroomTeacherId;
        return (
          <li key={t.id} className="flex items-start justify-between gap-3 rounded-[2px] border border-[var(--border-strong)] px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-content-heading">{t.fullName}</p>
              <p className="truncate text-xs text-content-muted">
                {t.subject}
                {showEmail && ` · ${t.email}`}
              </p>
            </div>
            {isHomeroom && (
              <span className="shrink-0 rounded-[2px] bg-[var(--accent-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                Chủ nhiệm
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
