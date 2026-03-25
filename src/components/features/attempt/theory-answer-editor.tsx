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
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import {
  decodeTheoryPlateAnswer,
  encodeTheoryPlateAnswer,
} from '@/lib/theory-answer';

const EMPTY_DOC: Descendant[] = [{ type: 'p', children: [{ text: '' }] }];

type TheoryAnswerEditorProps = {
  questionId: string;
  value: string;
  onChange: (encoded: string) => void;
};

export function TheoryAnswerEditor({
  questionId,
  value,
  onChange,
}: TheoryAnswerEditorProps) {
  const initial = useMemo(() => {
    return decodeTheoryPlateAnswer(value) ?? EMPTY_DOC;
  }, [questionId, value]);

  const editor = usePlateEditor(
    {
      plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin],
      value: initial as Value,
    },
    [questionId]
  );

  return (
    <Plate
      editor={editor}
      onValueChange={({ value: next }) => {
        onChange(encodeTheoryPlateAnswer(next as Descendant[]));
      }}
    >
      <div className="flex h-[350px] flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
        <FixedToolbar className="justify-start rounded-t-xl">
          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
            <span className="font-bold">B</span>
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
            <span className="italic">I</span>
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
            <span className="underline">U</span>
          </MarkToolbarButton>
        </FixedToolbar>

        <EditorContainer className="min-h-0 flex-1">
          <Editor
            variant="none"
            className="h-full overflow-y-auto px-3 py-3 text-[15px] leading-relaxed outline-none"
            placeholder="Write your answer here…"
          />
        </EditorContainer>
      </div>
    </Plate>
  );
}
