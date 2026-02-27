import { Text } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { Editor, useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Link from '@tiptap/extension-link';
import { useState } from 'react';
import LinkModal from './LinkModal';

interface RichTextEditorFieldProps {
  label?: string;
  editor?: Editor | null;
  required?: boolean;
  error?: string;
  minHeight?: number;
  maxHeight?: number;
  stickyOffset?: number;
  value?: string;
  onChange?: (value: string) => void;
}

export default function RichTextEditorField({
  label,
  editor: externalEditor,
  required,
  error,
  minHeight = 200,
  maxHeight = 400,
  stickyOffset = 60,
  value,
  onChange,
}: RichTextEditorFieldProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const internalEditor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ 
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const editor = externalEditor ?? internalEditor;

  const handleSetLink = () => {
    if (!editor) return;
    setLinkModalOpen(true);
  };

  const handleLinkSave = (url: string, openInNewTab: boolean) => {
    if (!editor) return;

    const existingAttrs = editor.getAttributes('link');

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: url,
        target: openInNewTab ? '_blank' : existingAttrs.target || null,
        rel: openInNewTab ? 'noopener noreferrer nofollow' : existingAttrs.rel || null,
      })
      .run();
  };

  const handleUnlink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div>
      {label && (
        <Text size="sm" fw={400} mb={4}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Text>
      )}

      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar sticky stickyOffset={stickyOffset}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
            <RichTextEditor.H5 />
            <RichTextEditor.H6 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Control
              onClick={handleSetLink}
              active={editor?.isActive('link')}
              title="Вставить/изменить ссылку"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
                />
              </svg>
            </RichTextEditor.Control>
            <RichTextEditor.Control
              onClick={handleUnlink}
              disabled={!editor?.isActive('link')}
              title="Убрать ссылку"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="red" strokeWidth={2}>
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
                />
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            </RichTextEditor.Control>
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '12px',
          }}
        />
      </RichTextEditor>

      {error && (
        <Text size="xs" color="red" mt={4}>
          {error}
        </Text>
      )}

      <LinkModal
        show={linkModalOpen}
        onHide={() => {
          setLinkModalOpen(false);
        }}
        onSetLink={handleLinkSave}
        existingUrl={editor?.getAttributes('link').href || ''}
      />
    </div>
  );
}

