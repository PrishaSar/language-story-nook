import Link from "next/link";
import { CEFR_LABELS } from "@/lib/constants/languages";
import type { UserLanguage } from "@/lib/types";

type LanguageCardProps = {
  language: UserLanguage;
  storiesCreated: number;
};

export function LanguageCard({ language, storiesCreated }: LanguageCardProps) {
  const levelLabel = CEFR_LABELS[language.level];

  return (
    <li className="card-nook flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-ink">{language.languageName}</h3>
            {language.isActive && <span className="badge-gold">Active</span>}
          </div>
          <p className="text-sm text-ink-muted">
            {language.level} · {levelLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="stat-gold">{storiesCreated}</p>
          <p className="text-xs text-ink-muted">
            {storiesCreated === 1 ? "story created" : "stories created"}
          </p>
        </div>
      </div>

      {language.reasonForLearning && (
        <p className="text-sm leading-relaxed text-ink-muted italic">
          &ldquo;{language.reasonForLearning}&rdquo;
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Link href="/stories/new" className="btn-primary">
          Create story
        </Link>
        <Link href="/library" className="btn-secondary">
          Bookshelf
        </Link>
      </div>
    </li>
  );
}
