'use client'

import * as React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { common, createLowlight } from 'lowlight'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline as UnderlineIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Palette,
  CodeIcon,
  FileCode,
  Eye,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

export interface MinimalTiptapHandle {
  insertText: (text: string) => void
  focus: () => void
  getHTML: () => string
}

interface MinimalTiptapProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

const MinimalTiptapInner = React.forwardRef<MinimalTiptapHandle, MinimalTiptapProps>(
  (
    { content = '', onChange, placeholder = 'Start typing...', editable = true, className },
    ref,
  ) => {
    const [linkUrl, setLinkUrl] = React.useState('')
    const [showLinkInput, setShowLinkInput] = React.useState(false)
    const [showColorPicker, setShowColorPicker] = React.useState(false)
    const [_selectedColor, _setSelectedColor] = React.useState('#000000')
    const [isHtmlMode, setIsHtmlMode] = React.useState(false)
    const [htmlContent, setHtmlContent] = React.useState('')

    const editor = useEditor({
      immediatelyRender: false, // Fix SSR hydration mismatch
      extensions: [
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
          codeBlock: false, // Désactiver le codeBlock de base pour utiliser CodeBlockLowlight
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
          },
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
          HTMLAttributes: {
            class: 'rounded-lg max-w-full h-auto',
          },
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'tiptap-table',
            style: 'border-collapse: collapse; width: 100%; border: 1px solid #e5e7eb;',
          },
        }),
        TableRow.configure({
          HTMLAttributes: {
            class: 'tiptap-table-row',
          },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: 'tiptap-table-header',
            style:
              'border: 1px solid #e5e7eb; background-color: #f3f4f6; font-weight: bold; padding: 8px; text-align: left;',
          },
        }),
        TableCell.configure({
          HTMLAttributes: {
            class: 'tiptap-table-cell',
            style: 'border: 1px solid #e5e7eb; padding: 8px;',
          },
        }),
        Highlight.configure({
          multicolor: true,
          HTMLAttributes: {
            class: 'bg-yellow-200 dark:bg-yellow-900 px-1',
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Underline,
        Subscript,
        Superscript,
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: {
            class: 'bg-muted text-foreground rounded p-4 font-mono text-sm',
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        Typography,
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm dark:prose-invert max-w-none focus:outline-hidden',
            'min-h-[200px] p-4 border-0',
          ),
        },
      },
    })

    React.useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content)
      }
      // Also sync HTML content for HTML mode
      if (content !== htmlContent && !isHtmlMode) {
        setHtmlContent(content)
      }
    }, [content, editor])

    // Expose methods via ref
    React.useImperativeHandle(
      ref,
      () => ({
        insertText: (text: string) => {
          if (editor) {
            editor.chain().focus().insertContent(text).run()
          }
        },
        focus: () => {
          if (editor) {
            editor.chain().focus().run()
          }
        },
        getHTML: () => {
          return editor?.getHTML() || ''
        },
      }),
      [editor],
    )

    const addLink = React.useCallback(() => {
      if (linkUrl && editor) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        setLinkUrl('')
        setShowLinkInput(false)
      }
    }, [editor, linkUrl])

    const addImage = React.useCallback(() => {
      const url = window.prompt("URL de l'image")
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }, [editor])

    const insertTable = React.useCallback(() => {
      if (editor) {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      }
    }, [editor])

    const applyColor = React.useCallback(
      (color: string) => {
        if (editor) {
          editor.chain().focus().setColor(color).run()
          setShowColorPicker(false)
        }
      },
      [editor],
    )

    // Toggle HTML mode
    const toggleHtmlMode = React.useCallback(() => {
      if (isHtmlMode) {
        // Switching from HTML to visual mode - apply HTML to editor
        if (editor) {
          editor.commands.setContent(htmlContent)
          onChange?.(htmlContent)
        }
      } else {
        // Switching from visual to HTML mode - get HTML from editor
        if (editor) {
          setHtmlContent(editor.getHTML())
        }
      }
      setIsHtmlMode(!isHtmlMode)
    }, [isHtmlMode, htmlContent, editor, onChange])

    // Handle HTML textarea change
    const handleHtmlChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newHtml = e.target.value
        setHtmlContent(newHtml)
        onChange?.(newHtml)
      },
      [onChange],
    )

    if (!editor) {
      return null
    }

    const colors = [
      '#000000',
      '#FF0000',
      '#00FF00',
      '#0000FF',
      '#FFFF00',
      '#FF00FF',
      '#00FFFF',
      '#FFA500',
      '#800080',
      '#008000',
    ]

    return (
      <div
        className={cn('border rounded-lg overflow-hidden bg-background flex flex-col', className)}
      >
        <div className="border-b p-2 flex flex-wrap items-center gap-1 bg-muted shrink-0">
          {/* Formatage de texte */}
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            title="Gras (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            title="Italique (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            title="Souligner (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            title="Barré"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            title="Code inline"
          >
            <Code className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('subscript')}
            onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
            title="Indice"
          >
            <SubscriptIcon className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('superscript')}
            onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
            title="Exposant"
          >
            <SuperscriptIcon className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Couleur de texte */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Couleur du texte"
            >
              <Palette className="h-4 w-4" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg z-50">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => applyColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    editor?.chain().focus().unsetColor().run()
                    setShowColorPicker(false)
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>

          <Toggle
            size="sm"
            pressed={editor.isActive('highlight')}
            onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
            title="Surligner"
          >
            <Highlighter className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Titres */}
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Titre 1"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Titre 2"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Titre 3"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignement */}
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            title="Aligner à gauche"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            title="Centrer"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            title="Aligner à droite"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'justify' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justifier"
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Listes */}
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            title="Liste à puces"
          >
            <List className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            title="Liste numérotée"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            title="Citation"
          >
            <Quote className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('codeBlock')}
            onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Bloc de code"
          >
            <CodeIcon className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Liens et Images */}
          <div className="relative">
            {!showLinkInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkInput(true)}
                title="Ajouter un lien"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addLink()
                    } else if (e.key === 'Escape') {
                      setShowLinkInput(false)
                      setLinkUrl('')
                    }
                  }}
                  className="h-8 w-48"
                  autoFocus
                />
                <Button size="sm" onClick={addLink}>
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowLinkInput(false)
                    setLinkUrl('')
                  }}
                >
                  ✕
                </Button>
              </div>
            )}
          </div>

          {editor.isActive('link') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Supprimer le lien"
            >
              Suppr. lien
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={addImage} title="Ajouter une image">
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={insertTable} title="Insérer un tableau">
            <TableIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Séparateur et historique */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Ligne horizontale"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Annuler (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Refaire (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* HTML Mode Toggle */}
          <Button
            variant={isHtmlMode ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleHtmlMode}
            title={isHtmlMode ? 'Mode visuel' : 'Mode HTML'}
            className="gap-1"
          >
            {isHtmlMode ? (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-xs">Visuel</span>
              </>
            ) : (
              <>
                <FileCode className="h-4 w-4" />
                <span className="text-xs">HTML</span>
              </>
            )}
          </Button>
        </div>

        {isHtmlMode ? (
          <Textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            placeholder="<p>Entrez votre HTML ici...</p>"
            className="flex-1 font-mono text-sm border-0 rounded-none focus-visible:ring-0 resize-y bg-background p-4 overflow-auto"
            style={{ minHeight: '400px' }}
          />
        ) : (
          <EditorContent editor={editor} className="tiptap-editor flex-1 overflow-auto" />
        )}

        <style jsx global>{`
          .tiptap-editor .ProseMirror {
            outline: none;
          }
          .tiptap-editor .is-editor-empty:first-child::before {
            color: hsl(var(--muted-foreground));
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          /* Headings */
          .tiptap-editor h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.67em 0;
            line-height: 1.2;
          }
          .tiptap-editor h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.83em 0;
            line-height: 1.3;
          }
          .tiptap-editor h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 1em 0;
            line-height: 1.4;
          }
          /* Horizontal rule */
          .tiptap-editor hr {
            border: none;
            border-top: 2px solid hsl(var(--border));
            margin: 1.5em 0;
          }
          /* Blockquote */
          .tiptap-editor blockquote {
            border-left: 4px solid hsl(var(--primary));
            margin: 1em 0;
            padding-left: 1em;
            color: hsl(var(--muted-foreground));
            font-style: italic;
          }
          /* Lists */
          .tiptap-editor ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .tiptap-editor ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .tiptap-editor li {
            margin: 0.25em 0;
          }
          .tiptap-editor li p {
            margin: 0;
          }
          /* Table */
          .tiptap-editor table,
          .tiptap-editor .tiptap-table {
            border-collapse: collapse !important;
            margin: 1em 0;
            overflow: hidden;
            width: 100%;
            border: 1px solid #d1d5db !important;
          }
          .dark .tiptap-editor table,
          .dark .tiptap-editor .tiptap-table {
            border-color: #4b5563 !important;
          }
          .tiptap-editor table td,
          .tiptap-editor table th,
          .tiptap-editor .tiptap-table-cell,
          .tiptap-editor .tiptap-table-header {
            border: 1px solid #d1d5db !important;
            box-sizing: border-box;
            min-width: 1em;
            padding: 8px !important;
            position: relative;
            vertical-align: top;
          }
          .dark .tiptap-editor table td,
          .dark .tiptap-editor table th,
          .dark .tiptap-editor .tiptap-table-cell,
          .dark .tiptap-editor .tiptap-table-header {
            border-color: #4b5563 !important;
          }
          .tiptap-editor table th,
          .tiptap-editor .tiptap-table-header {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
            text-align: left;
          }
          .dark .tiptap-editor table th,
          .dark .tiptap-editor .tiptap-table-header {
            background-color: #374151 !important;
          }
          .tiptap-editor table tr:nth-child(even) td {
            background-color: #f9fafb;
          }
          .dark .tiptap-editor table tr:nth-child(even) td {
            background-color: #1f2937;
          }
          /* Code */
          .tiptap-editor code {
            background: hsl(var(--muted));
            border-radius: 0.25rem;
            font-family: 'JetBrainsMono', monospace;
            font-size: 0.875em;
            padding: 0.2em 0.4em;
          }
          .tiptap-editor pre {
            background: hsl(var(--muted));
            border-radius: 0.5rem;
            color: hsl(var(--foreground));
            font-family: 'JetBrainsMono', monospace;
            padding: 1rem;
            overflow-x: auto;
            margin: 1em 0;
          }
          .tiptap-editor pre code {
            background: none;
            color: inherit;
            font-size: 0.875rem;
            padding: 0;
            border-radius: 0;
          }
          /* Links */
          .tiptap-editor a {
            color: hsl(var(--primary));
            cursor: pointer;
            text-decoration: underline;
          }
          /* Images */
          .tiptap-editor img {
            border-radius: 0.5rem;
            display: block;
            height: auto;
            max-width: 100%;
            margin: 1em 0;
          }
          /* Mark/Highlight */
          .tiptap-editor mark {
            background-color: #fef08a;
            padding: 0.1em 0.2em;
            border-radius: 0.2em;
          }
          /* Subscript and Superscript */
          .tiptap-editor sub {
            font-size: 0.75em;
            vertical-align: sub;
          }
          .tiptap-editor sup {
            font-size: 0.75em;
            vertical-align: super;
          }
          /* Strikethrough */
          .tiptap-editor s {
            text-decoration: line-through;
          }
          /* Paragraph spacing */
          .tiptap-editor p {
            margin: 0.5em 0;
          }
          /* Text alignment */
          .tiptap-editor [style*='text-align: center'] {
            text-align: center;
          }
          .tiptap-editor [style*='text-align: right'] {
            text-align: right;
          }
          .tiptap-editor [style*='text-align: justify'] {
            text-align: justify;
          }
        `}</style>
      </div>
    )
  },
)

MinimalTiptapInner.displayName = 'MinimalTiptap'

const MinimalTiptap = MinimalTiptapInner

export { MinimalTiptap, type MinimalTiptapProps }
