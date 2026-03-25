import type { Attempt, Question } from '@/types/test';
import { isObjectiveQuestion, isTheoryQuestion } from '@/types/test';
import { theoryAnswerToHtml, theoryAnswerToPlainText } from '@/lib/theory-answer';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function normalizeAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = typeof v === 'string' ? v : String(v ?? '');
  }
  return out;
}

function maxPts(q: Question): number {
  return q.points ?? (isTheoryQuestion(q) ? 5 : 1);
}

function buildHtml(attempt: Attempt, questions: Question[]): string {
  const answers = normalizeAnswers(attempt.answers);
  const meta = attempt.gradingMetadata;
  const totalMax = questions.reduce((s, q) => s + maxPts(q), 0);
  const objectiveQs = questions.filter(isObjectiveQuestion);
  const theoryQs = questions.filter(isTheoryQuestion);

  const score =
    attempt.score != null ? Math.round(attempt.score * 10) / 10 : '—';

  let html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;max-width:640px;margin:0 auto;padding:40px 24px;">

  <!-- Student header (PDF-only) -->
  <div style="margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #e4e4e7;">
    <h1 style="font-size:22px;font-weight:600;margin:0 0 4px;color:#09090b;">${esc(attempt.student.name)}</h1>
    <p style="font-size:13px;color:#71717a;margin:0 0 12px;">
      Submitted ${new Date(attempt.submittedAt).toLocaleString()}${
        attempt.duration != null ? ` · ${attempt.duration} min` : ''
      }
    </p>
    <p style="font-size:15px;margin:0;">
      <strong style="color:#09090b;">${score}</strong>
      <span style="color:#a1a1aa;"> / </span>${totalMax} pts
    </p>
  </div>`;

  if (objectiveQs.length > 0) {
    html += `
  <h2 style="font-size:17px;font-weight:600;color:#09090b;margin:0 0 24px;">Objective questions</h2>`;

    objectiveQs.forEach((q) => {
      const globalIndex = questions.indexOf(q) + 1;
      const chosenId = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      const isCorrect = Boolean(
        correctOpt && chosenId && chosenId === correctOpt.id
      );
      const pts = maxPts(q);
      const earned = isCorrect ? pts : 0;

      html += `
  <div style="margin-bottom:32px;">
    <p style="font-size:14px;font-weight:500;color:#18181b;margin:0 0 12px;">
      <span style="color:#a1a1aa;">${globalIndex}.</span> ${esc(q.question)}
    </p>`;

      q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const chosen = opt.id === chosenId;
        const correct = opt.isCorrect;
        const color = correct ? '#16a34a' : '#3f3f46';
        const weight = correct ? '600' : '400';
        const selectedTag = chosen
          ? ' <span style="display:inline-block;border:1px solid #d4d4d8;border-radius:9999px;padding:1px 8px;font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:#52525b;margin-left:6px;vertical-align:middle;">Selected</span>'
          : '';
        html += `
    <p style="font-size:13px;color:${color};font-weight:${weight};margin:0 0 6px;line-height:1.6;">
      ${letter}. ${esc(opt.text)}${selectedTag}
    </p>`;
      });

      const resultColor = isCorrect ? '#15803d' : '#be123c';
      const resultText = isCorrect
        ? `Correct — ${earned} / ${pts} pts`
        : `Incorrect — 0 / ${pts} pts`;
      html += `
    <p style="font-size:13px;font-weight:500;color:${resultColor};margin:10px 0 0;">${resultText}</p>
  </div>`;
    });
  }

  if (theoryQs.length > 0) {
    html += `
  <h2 style="font-size:17px;font-weight:600;color:#09090b;margin:${objectiveQs.length > 0 ? '48px' : '0'} 0 24px;">Theory questions</h2>`;

    theoryQs.forEach((q) => {
      const globalIndex = questions.indexOf(q) + 1;
      const raw = answers[q.id] ?? '';
      const mark = meta?.theory?.[q.id];
      const max = maxPts(q);
      const answerHtml = theoryAnswerToHtml(raw);
      const hasAnswer = Boolean(theoryAnswerToPlainText(raw));

      html += `
  <div style="margin-bottom:36px;">
    <p style="font-size:14px;font-weight:500;color:#18181b;margin:0 0 2px;">
      <span style="color:#a1a1aa;">${globalIndex}.</span> ${esc(q.question)}
    </p>
    <p style="font-size:11px;color:#a1a1aa;margin:0 0 12px;">Max ${max} pts</p>
    <div style="background:#fafafa;border:1px solid #f4f4f5;border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.65;color:#27272a;margin-bottom:14px;">
      ${hasAnswer ? answerHtml : '<em style="color:#a1a1aa;">No answer submitted.</em>'}
    </div>
    <div style="background:#fff;border:1px solid #f4f4f5;border-radius:8px;padding:12px 14px;">
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#a1a1aa;margin:0 0 4px;">Score</p>
      <p style="font-size:13px;font-weight:600;color:#18181b;margin:0;">
        ${mark ? `${mark.earned} / ${mark.max} pts` : 'Not graded'}
      </p>`;

      if (mark?.comment) {
        html += `
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#a1a1aa;margin:14px 0 4px;">Rationale</p>
      <p style="font-size:13px;line-height:1.6;color:#3f3f46;margin:0;white-space:pre-wrap;">${esc(mark.comment)}</p>`;
      }

      html += `
    </div>
  </div>`;
    });
  }

  html += `
</div>`;

  return html;
}

export async function downloadAttemptPdf(
  attempt: Attempt,
  questions: Question[]
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:800px;background:#fff;z-index:-1;';
  container.innerHTML = buildHtml(attempt, questions);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgWidth = 210; // A4 mm
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');

    let position = 0;
    let remaining = imgHeight;

    while (remaining > 0) {
      if (position > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        -position,
        imgWidth,
        imgHeight
      );
      position += pageHeight;
      remaining -= pageHeight;
    }

    const safeName = attempt.student.name
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    pdf.save(`${safeName}_attempt.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
