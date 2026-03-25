'use client';

import { useMemo } from 'react';
import type { Value } from 'platejs';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import { Plate, usePlateEditor } from 'platejs/react';
import type { Descendant } from '@platejs/slate';

import { Editor, EditorContainer } from '@/components/ui/editor';
import { decodeTheoryPlateAnswer, theoryAnswerToPlainText } from '@/lib/theory-answer';

const EMPTY: Descendant[] = [{ type: 'p', children: [{ text: '' }] }];

type TheoryAnswerStaticProps = {
  encoded: string;
  className?: string;
};

export function TheoryAnswerStatic({ encoded, className }: TheoryAnswerStaticProps) {
  const initial = useMemo(
    () => (decodeTheoryPlateAnswer(encoded) ?? EMPTY) as Value,
    [encoded]
  );
  const plain = useMemo(() => theoryAnswerToPlainText(encoded), [encoded]);

  const editor = usePlateEditor(
    {
      plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin],
      value: initial,
    },
    [encoded]
  );

  if (!plain) {
    return (
      <p className="text-sm italic text-zinc-400">No answer submitted.</p>
    );
  }

  return (
    <Plate editor={editor}>
      <EditorContainer className="min-h-0">
        <Editor
          disabled
          variant="none"
          className={
            className ??
            'cursor-default rounded-lg border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-[15px] leading-relaxed text-zinc-800 !opacity-100'
          }
        />
      </EditorContainer>
    </Plate>
  );
}
