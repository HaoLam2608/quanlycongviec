"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link as LinkIcon,
    Code,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    FileText,
    X,
    Image as ImageIcon,
    Table as TableIcon,
    Palette,
    MessageSquare,
    Search,
    Plus,
    Trash2,
    Send,
    ChevronRight
} from 'lucide-react';

interface Page {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    content: string;
}

interface Comment {
    id: string;
    text: string;
    author: string;
    timestamp: string;
}

type Theme = 'light' | 'dark' | 'sepia';

const templates: Template[] = [
    {
        id: 'blank',
        name: 'Blank page',
        description: 'Start a page from scratch.',
        icon: '📄',
        content: ''
    },
    {
        id: 'product-requirement',
        name: 'Product requirement',
        description: 'Define, track and scope requirements for your product or feature.',
        icon: '📋',
        content: '<h1>Product Requirements</h1><h2>Overview</h2><p>Brief description of the product or feature.</p><h2>Goals</h2><ul><li>Goal 1</li><li>Goal 2</li></ul><h2>Requirements</h2><ul><li>Requirement 1</li><li>Requirement 2</li></ul>'
    },
    {
        id: 'decision',
        name: 'Decision',
        description: 'Record important project decisions and communicate them with your team.',
        icon: '✅',
        content: '<h1>Decision</h1><h2>Context</h2><p>What is the context for this decision?</p><h2>Options Considered</h2><ul><li>Option 1</li><li>Option 2</li></ul><h2>Decision</h2><p>What was decided and why?</p>'
    },
    {
        id: 'meeting-notes',
        name: 'Meeting notes',
        description: 'Set meeting agendas, take notes, track action items.',
        icon: '🗓️',
        content: '<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li>Topic 1</li><li>Topic 2</li></ul><h2>Notes</h2><p></p><h2>Action Items</h2><ul><li>[ ] Action item 1</li><li>[ ] Action item 2</li></ul>'
    }
];

export default function PagesEditor() {
    const [currentPage, setCurrentPage] = useState<Page | null>(null);
    const [allPages, setAllPages] = useState<Page[]>([]);
    const [title, setTitle] = useState('');
    const [showTemplates, setShowTemplates] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [showPagesList, setShowPagesList] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [theme, setTheme] = useState<Theme>('light');
    const [searchQuery, setSearchQuery] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bgColors = {
        light: 'bg-white',
        dark: 'bg-gray-900',
        sepia: 'bg-[#f4ecd8]'
    };

    const textColors = {
        light: 'text-gray-900',
        dark: 'text-gray-100',
        sepia: 'text-[#5c4a3a]'
    };

    const borderColors = {
        light: 'border-gray-200',
        dark: 'border-gray-700',
        sepia: 'border-[#d4c5b0]'
    };

    const loadAllPages = useCallback(() => {
        const pages: Page[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('page-')) {
                try {
                    const page = JSON.parse(localStorage.getItem(key) || '');
                    pages.push(page);
                } catch (_) { }
            }
        }
        setAllPages(pages.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    }, []);

    const savePage = useCallback(() => {
        if (!currentPage) return;

        setIsSaving(true);
        const content = editorRef.current?.innerHTML || '';
        const updatedPage = {
            ...currentPage,
            title: title || 'Untitled',
            content,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(`page-${currentPage.id}`, JSON.stringify(updatedPage));
        setCurrentPage(updatedPage);
        loadAllPages();

        setTimeout(() => setIsSaving(false), 500);
    }, [currentPage, title, loadAllPages]);

    useEffect(() => {
        loadAllPages();

        const params = new URLSearchParams(window.location.search);
        let pageId = params.get('id');

        if (!pageId) {
            pageId = Math.random().toString(36).substring(2, 10);
            const newUrl = `${window.location.pathname}?id=${pageId}`;
            window.history.replaceState(null, '', newUrl);
        }

        const savedPage = localStorage.getItem(`page-${pageId}`);
        if (savedPage) {
            try {
                const page: Page = JSON.parse(savedPage);
                setCurrentPage(page);
                setTitle(page.title);
                if (editorRef.current) {
                    editorRef.current.innerHTML = page.content;
                }
                setShowTemplates(false);

                const savedComments = localStorage.getItem(`comments-${pageId}`);
                if (savedComments) {
                    setComments(JSON.parse(savedComments));
                }
            } catch (_) { }
        } else {
            const newPage: Page = {
                id: pageId,
                title: 'Untitled',
                content: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setCurrentPage(newPage);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage) {
                savePage();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [title, currentPage, savePage]);

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const applyTemplate = (template: Template) => {
        if (editorRef.current) {
            editorRef.current.innerHTML = template.content;
            setTitle(template.name);
            setShowTemplates(false);
            savePage();
        }
    };

    const handlePublish = () => {
        if (currentPage) {
            const shareUrl = `${window.location.origin}${window.location.pathname}?id=${currentPage.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    };

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgUrl = event.target?.result as string;
                const img = document.createElement('img');
                img.src = imgUrl;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.margin = '1rem 0';
                img.style.borderRadius = '4px';
                editorRef.current?.appendChild(img);
                savePage();
            };
            reader.readAsDataURL(file);
        }
    };

    const insertTable = () => {
        const rows = prompt('Number of rows:', '3');
        const cols = prompt('Number of columns:', '3');
        if (rows && cols) {
            let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb;"><tbody>';
            for (let i = 0; i < parseInt(rows); i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    tableHTML += '<td style="border: 1px solid #e5e7eb; padding: 8px;">Cell</td>';
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</tbody></table>';
            document.execCommand('insertHTML', false, tableHTML);
            savePage();
        }
    };

    const createNewPage = () => {
        const newPageId = Math.random().toString(36).substring(2, 10);
        const newUrl = `${window.location.pathname}?id=${newPageId}`;
        window.location.href = newUrl;
    };

    const switchToPage = (pageId: string) => {
        const newUrl = `${window.location.pathname}?id=${pageId}`;
        window.location.href = newUrl;
    };

    const deletePage = (pageId: string) => {
        if (confirm('Are you sure you want to delete this page?')) {
            localStorage.removeItem(`page-${pageId}`);
            localStorage.removeItem(`comments-${pageId}`);
            loadAllPages();
            if (currentPage?.id === pageId) {
                createNewPage();
            }
        }
    };

    const addComment = () => {
        if (!newComment.trim() || !currentPage) return;

        const comment: Comment = {
            id: Math.random().toString(36).substring(2, 10),
            text: newComment,
            author: 'You',
            timestamp: new Date().toISOString()
        };

        const updatedComments = [...comments, comment];
        setComments(updatedComments);
        localStorage.setItem(`comments-${currentPage.id}`, JSON.stringify(updatedComments));
        setNewComment('');
    };

    const filteredPages = allPages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]}`}>
            {/* Top Bar */}
            <div className={`h-12 flex items-center justify-between px-4 border-b ${borderColors[theme]}`}>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowPagesList(!showPagesList)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                        <ChevronRight className={`w-4 h-4 transition-transform ${showPagesList ? 'rotate-90' : ''}`} />
                    </button>
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm">Pages</span>
                    <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded">
                        TRY
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light')}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="Change theme"
                    >
                        <Palette className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded relative"
                        title="Comments"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {comments.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]">
                                {comments.length}
                            </span>
                        )}
                    </button>

                    {isSaving && (
                        <span className="text-xs text-gray-500">Saving...</span>
                    )}

                    <button
                        onClick={handlePublish}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Publish
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="px-3 py-1 text-sm border hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* Pages Sidebar */}
                {showPagesList && (
                    <div className={`w-60 border-r ${borderColors[theme]} p-3 h-[calc(100vh-3rem)] overflow-y-auto`}>
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">📄 All Pages</span>
                                <button
                                    onClick={createNewPage}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-7 pr-2 py-1.5 text-xs rounded border ${theme === 'dark'
                                            ? 'bg-gray-800 border-gray-700'
                                            : theme === 'sepia'
                                                ? 'bg-[#f9f5ed] border-[#d4c5b0]'
                                                : 'bg-gray-50 border-gray-200'
                                        } focus:outline-none focus:border-blue-500`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            {filteredPages.map((page) => (
                                <div
                                    key={page.id}
                                    className={`group flex items-center justify-between p-2 rounded cursor-pointer text-sm ${currentPage?.id === page.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => switchToPage(page.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{page.title}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(page.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deletePage(page.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Editor */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-8 py-6">
                        {/* Toolbar */}
                        <div className={`flex items-center space-x-1 mb-6 pb-3 border-b ${borderColors[theme]}`}>
                            <button
                                onClick={() => execCommand('bold')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Bold"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => execCommand('italic')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Italic"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => execCommand('underline')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Underline"
                            >
                                <Underline className="w-4 h-4" />
                            </button>

                            <div className={`w-px h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} mx-1`} />

                            <button
                                onClick={() => execCommand('formatBlock', '<h1>')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="H1"
                            >
                                <Heading1 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => execCommand('formatBlock', '<h2>')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="H2"
                            >
                                <Heading2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => execCommand('formatBlock', '<h3>')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="H3"
                            >
                                <Heading3 className="w-4 h-4" />
                            </button>

                            <div className={`w-px h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} mx-1`} />

                            <button
                                onClick={() => execCommand('insertUnorderedList')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="List"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => execCommand('insertOrderedList')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Numbered"
                            >
                                <ListOrdered className="w-4 h-4" />
                            </button>

                            <div className={`w-px h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} mx-1`} />

                            <button
                                onClick={() => {
                                    const url = prompt('Enter URL:');
                                    if (url) execCommand('createLink', url);
                                }}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Link"
                            >
                                <LinkIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleImageUpload}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Image"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={insertTable}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Table"
                            >
                                <TableIcon className="w-4 h-4" />
                            </button>

                            <div className={`w-px h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} mx-1`} />

                            <button
                                onClick={() => execCommand('formatBlock', '<blockquote>')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Quote"
                            >
                                <Quote className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => execCommand('formatBlock', '<pre>')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Code"
                            >
                                <Code className="w-4 h-4" />
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onFileSelected}
                            className="hidden"
                        />

                        {/* Title */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled"
                            className="w-full text-4xl font-bold outline-none mb-4 bg-transparent placeholder-gray-300"
                        />

                        {/* Editor */}
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={savePage}
                            className={`min-h-[500px] outline-none prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''
                                } prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mb-3
              prose-h2:text-2xl prose-h2:mb-2
              prose-h3:text-xl prose-h3:mb-2
              prose-p:text-base prose-p:leading-7
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              focus:outline-none`}
                        />
                    </div>
                </div>

                {/* Templates Panel */}
                {showTemplates && (
                    <div className={`w-80 border-l ${borderColors[theme]} p-4 h-[calc(100vh-3rem)] overflow-y-auto`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold">Preview templates</h3>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">POPULAR WITH TEAMS LIKE YOURS</p>

                        <div className="space-y-2">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className={`w-full text-left p-3 border ${borderColors[theme]} rounded hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10`}
                                >
                                    <div className="flex items-start space-x-2">
                                        <span className="text-xl">{template.icon}</span>
                                        <div>
                                            <h4 className="text-sm font-medium">{template.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className={`mt-6 pt-4 border-t ${borderColors[theme]}`}>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Unlock templates, project pages, and more.
                            </p>
                            <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                Try it now
                            </button>
                        </div>
                    </div>
                )}

                {/* Comments Panel */}
                {showComments && (
                    <div className={`w-80 border-l ${borderColors[theme]} p-4 h-[calc(100vh-3rem)] overflow-y-auto flex flex-col`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold">Comments ({comments.length})</h3>
                            <button
                                onClick={() => setShowComments(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                            {comments.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                                    No comments yet
                                </p>
                            ) : (
                                comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`p-3 rounded border ${borderColors[theme]}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium">{comment.author}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.text}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={`border-t ${borderColors[theme]} pt-4`}>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className={`w-full p-2 text-sm rounded border ${borderColors[theme]} resize-none focus:outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sepia' ? 'bg-[#f9f5ed]' : 'bg-white'
                                    }`}
                                rows={3}
                            />
                            <button
                                onClick={addComment}
                                disabled={!newComment.trim()}
                                className="mt-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
