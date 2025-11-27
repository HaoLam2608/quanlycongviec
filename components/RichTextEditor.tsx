import React, { useRef, useState } from 'react';
import './RichTextEditor.css';

/**
 * A lightweight rich‑text editor using the native `contenteditable` API.
 * It provides basic formatting tools (bold, italic, underline, lists, links)
 * and returns the edited HTML via `onChange`.
 *
 * The component is deliberately simple – no external dependencies –
 * making it easy to integrate into a Next.js app without additional
 * package installations.
 */
export default function RichTextEditor({
    initialContent = '',
    onChange,
}: {
    initialContent?: string;
    onChange?: (html: string) => void;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState(initialContent);

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        // Update state after the command runs
        const html = editorRef.current?.innerHTML ?? '';
        setContent(html);
        onChange?.(html);
    };

    const handleInput = () => {
        const html = editorRef.current?.innerHTML ?? '';
        setContent(html);
        onChange?.(html);
    };

    return (
        <div className="rich-text-editor">
            <div className="toolbar">
                <button type="button" title="Bold" onClick={() => execCommand('bold')}>
                    <b>B</b>
                </button>
                <button type="button" title="Italic" onClick={() => execCommand('italic')}>
                    <i>I</i>
                </button>
                <button type="button" title="Underline" onClick={() => execCommand('underline')}>
                    <u>U</u>
                </button>
                <button type="button" title="Bullet List" onClick={() => execCommand('insertUnorderedList')}>
                    • List
                </button>
                <button type="button" title="Numbered List" onClick={() => execCommand('insertOrderedList')}>
                    1. List
                </button>
                <button
                    type="button"
                    title="Insert Link"
                    onClick={() => {
                        const url = prompt('Enter URL');
                        if (url) execCommand('createLink', url);
                    }}
                >
                    🔗
                </button>
            </div>
            <div
                ref={editorRef}
                className="editor"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: initialContent }}
            ></div>
        </div>
    );
}
