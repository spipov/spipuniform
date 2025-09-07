import * as React from 'react';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';
import { renderColumnsToHtml, EmailPreview } from './ColumnsRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Columns as ColumnsIcon, Heading as HeadingIcon, Text as TextIcon, Image as ImageIcon, Square, Copy, Plus, Minus, MoveVertical, MousePointerClick } from 'lucide-react';

// Lightweight self‑hosted visual builder (no iframe). Purposefully minimal and isolated
// under src/email. We model a linear stack of blocks inside a root Container.
// Future: columns, drag reordering, custom blocks, asset picker.

export type BuilderProps = {
  initialDocument?: any | null;
  initialHtml?: string;
  onExport?: (html: string, document: any) => void;
};

const makeId = () => `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;

function createInitialDoc(): any {
  const headingId = makeId();
  const textId = makeId();
  return {
    root: {
      type: 'Container',
      data: {
        style: {
          backgroundColor: '#ffffff',
          padding: { top: 24, bottom: 24, left: 24, right: 24 },
          sectionGap: 16,
        },
        props: { childrenIds: [headingId, textId] },
      },
    },
    [headingId]: {
      type: 'Heading',
      data: {
        style: { textAlign: 'center' },
        props: { text: 'Welcome!', level: 'h1' },
      },
    },
    [textId]: {
      type: 'Text',
      data: {
        style: { textAlign: 'center' },
        props: { text: 'Start editing this email in the visual builder.' },
      },
    },
  };
}

type BlockType = 'Columns2' | 'Columns3' | 'Section' | 'Heading' | 'Text' | 'Button' | 'Image' | 'Divider' | 'Spacer';

const blockDefaults: Record<BlockType, any> = {
  Section: {
    // Modeled as a Container block with its own children
    type: 'Container',
    data: {
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 0,
        borderRadius: 8,
        padding: { top: 24, bottom: 24, left: 24, right: 24 },
      },
      props: { childrenIds: [] },
    },
  },
  Heading: {
    type: 'Heading',
    data: { style: { textAlign: 'left' }, props: { text: 'Heading', level: 'h2' } },
  },
  Text: {
    type: 'Text',
    data: { style: { textAlign: 'left' }, props: { text: 'Lorem ipsum dolor sit amet.' } },
  },
  Button: {
    type: 'Button',
    data: { style: { textAlign: 'center' }, props: { text: 'Click me', url: '#' } },
  },
  Image: {
    type: 'Image',
    data: { style: { textAlign: 'center' }, props: { src: 'https://via.placeholder.com/600x200', alt: 'Image' } },
  },
  Divider: {
    type: 'Divider',
    data: { style: { marginTop: 12, marginBottom: 12 }, props: {} },
  },
  Spacer: {
    type: 'Spacer',
    data: { style: { height: 16 }, props: {} },
  },
};

function cloneDefault(bt: BlockType) {
  const id = makeId();
  // Special handling for Columns: create inner column containers
  if (bt === 'Columns2' || bt === 'Columns3') {
    const count = bt === 'Columns2' ? 2 : 3;
    const columnIds: string[] = Array.from({ length: count }, () => makeId());
    const extras: Record<string, any> = {};
    for (const cid of columnIds) {
      extras[cid] = {
        type: 'Container',
        data: {
          style: {
            backgroundColor: '#ffffff',
            padding: { top: 16, right: 16, bottom: 16, left: 16 },
          },
          props: { childrenIds: [] },
        },
      };
    }
    const block = {
      type: 'Columns',
      data: {
        style: { gap: 16 },
        props: { columnIds },
      },
    };
    return [id, block, extras] as const;
  }
  return [id, { ...blockDefaults[bt], data: JSON.parse(JSON.stringify(blockDefaults[bt].data)) }] as const;
}

function useCompiledHtml(doc: any) {
  const [html, setHtml] = React.useState('');
  React.useEffect(() => {
    try {
      // Compile each root child with optional section gap and per-section override
      const rootChildren = doc.root?.data?.props?.childrenIds || [];
      const gap = doc.root?.data?.style?.sectionGap ?? 0;
      let compiled = '';

      for (let i = 0; i < rootChildren.length; i++) {
        const childId = rootChildren[i];
        const child = doc[childId];
        const inner = child?.type === 'Columns'
          ? renderColumnsToHtml(doc, childId)
          : renderToStaticMarkup({ root: child }, { rootBlockId: 'root' });
        const override = typeof child?.data?.style?.marginBottom === 'number' ? child.data.style.marginBottom : undefined;
        const mbNum = i < rootChildren.length - 1 ? (override !== undefined ? override : gap) : 0;
        const style = mbNum ? `margin-bottom:${mbNum}px;` : '';
        compiled += `<div style="${style}">${inner}</div>`;
      }

      // Wrap in basic email structure with page background color
      const pageBg = doc.root?.data?.style?.pageBackgroundColor || '#ffffff';
      setHtml(`
        <div style="max-width: 640px; margin: 0 auto; font-family: system-ui, sans-serif; background:${pageBg};">
          ${compiled}
        </div>
      `);
    } catch (e) {
      console.error('Failed to compile email:', e);
      setHtml('<p>Preview error</p>');
    }
  }, [doc]);
  return html;
}

export function EmailBuilderClient({ initialDocument, initialHtml, onExport }: BuilderProps) {
  const [doc, setDoc] = React.useState<any>(initialDocument || createInitialDoc());
  // Make document globally accessible so EmailManagement can include jsonContent on save without plumbing more props
  React.useEffect(() => { (window as any).__emailBuilderDoc = doc; }, [doc]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [viewport, setViewport] = React.useState<'mobile'|'tablet'|'desktop'>('desktop');
  const [zoom, setZoom] = React.useState<75 | 100 | 125>(100);
  const [brandingVars, setBrandingVars] = React.useState<Record<string, string>>({});
  const activeInputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [focusedEditor, setFocusedEditor] = React.useState<null | { blockId: string; field: 'headingText'|'textText'|'buttonText' }>(null);
  const [insertTarget, setInsertTarget] = React.useState<string>('root');
  const [applyTarget, setApplyTarget] = React.useState<'auto'|'background'|'text'|'border'>('auto');

  function blockLabel(b: BlockType): string {
    if (b === 'Columns2') return '2 Columns';
    if (b === 'Columns3') return '3 Columns';
    return b;
  }
  function viewportClass(v: 'mobile'|'tablet'|'desktop'): string {
    switch (v) {
      case 'mobile': return 'w-[360px]';
      case 'tablet': return 'w-[720px]';
      default: return 'w-[640px]';
    }
  }
  function colorPalette(): string[] {
    const base = [brandingVars.primaryColor, brandingVars.secondaryColor, brandingVars.accentColor].filter(Boolean) as string[];
    const neutrals = ['#111827','#374151','#6B7280','#9CA3AF','#D1D5DB','#E5E7EB','#F3F4F6','#FFFFFF'];
    return Array.from(new Set([...base, ...neutrals]));
  }

  function applyColor(hex: string) {
    if (!selectedId) {
      // Apply to page when nothing selected
      setDoc((prev:any)=> ({ ...prev, root: { ...prev.root, data: { ...prev.root.data, style: { ...prev.root.data.style, pageBackgroundColor: hex } } } }));
      return;
    }
    const sel = doc[selectedId];
    const target = applyTarget === 'auto'
      ? (sel?.type === 'Heading' || sel?.type === 'Text' ? 'text' : sel?.type === 'Button' ? 'background' : 'background')
      : applyTarget;

    if (target === 'background') updateSelected((b)=> ({ ...b, data: { ...b.data, style: { ...b.data.style, backgroundColor: hex } } }));
    if (target === 'text') updateSelected((b)=> ({ ...b, data: { ...b.data, style: { ...b.data.style, color: hex } } }));
    if (target === 'border') updateSelected((b)=> ({ ...b, data: { ...b.data, style: { ...b.data.style, borderColor: hex, borderWidth: b.data?.style?.borderWidth ?? 1 } } }));
  }

  function targetOptions(): Array<{id: string; label: string}> {
    const opts: Array<{id: string; label: string}> = [{ id: 'root', label: 'Root' }];
    if (selectedId) {
      const sel = doc[selectedId];
      if (sel?.type === 'Container') opts.push({ id: selectedId, label: 'Selected Section' });
      if (sel?.type === 'Columns') {
        const columnIds = sel.data?.props?.columnIds || [];
        columnIds.forEach((cid: string, idx: number) => opts.push({ id: cid, label: `Column ${idx + 1}` }));
      }
    }
    if (!opts.find(o => o.id === insertTarget)) {
      return [{ id: 'root', label: 'Root' }, ...opts.slice(1)];
    }
    return opts;
  }

  const AddZone: React.FC<{ parentId: string; options?: BlockType[]; className?: string }> = ({ parentId, options, className }) => {
    const opts = options || (['Heading','Text','Button','Image','Divider','Spacer'] as BlockType[]);
    return (
      <div className={`border-2 border-dashed border-muted-foreground/30 rounded p-2 flex flex-wrap gap-1 hover:bg-muted/30 transition ${className || ''}`}>
        {opts.map((b) => (
          <Button key={b} size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); addBlock(b, parentId); }}>+ {blockLabel(b)}</Button>
        ))}
      </div>
    );
  };

  // Subcomponents to reduce nesting and satisfy lints
  const ColumnItemCard: React.FC<{ parentId: string; id: string; index: number }> = ({ parentId, id, index }) => (
    <div
      className="border rounded p-2 mb-2 cursor-pointer"
      role="button"
      tabIndex={0}
      onPointerDownCapture={() => setSelectedId(id)}
      onMouseDown={() => setSelectedId(id)}
      onClick={() => setSelectedId(id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(id); } }}
      draggable
      onDragStart={(e)=>onColDragStart(e, parentId, id, index)}
      onDragOver={(e)=>onColDragOver(e, parentId, index)}
      onDrop={(e)=>onColDrop(e, parentId, index)}
      onDragEnd={onRootDragEnd}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-muted-foreground">Item • {id.slice(0,8)}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="px-1 py-0.5 text-xs border rounded"
            aria-label="Reorder item"
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); moveWithinParent(parentId, index, index - 1); }
              if (e.key === 'ArrowDown') { e.preventDefault(); moveWithinParent(parentId, index, index + 1); }
            }}
          >⇕</button>
        </div>
      </div>
      <div className="pointer-events-none"><Reader document={doc} rootBlockId={id} /></div>
    </div>
  );

  const RootItemCard: React.FC<{ id: string; index: number }> = ({ id, index }) => (
    <div
      className={`border rounded p-2 cursor-pointer ${selectedId===id? 'ring-2 ring-blue-500':''} ${hoverIndex===index ? 'ring-2 ring-amber-500' : ''}`}
      role="button"
      tabIndex={0}
      onPointerDownCapture={() => setSelectedId(id)}
      onMouseDown={() => setSelectedId(id)}
      onClick={() => setSelectedId(id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(id); } }}
      draggable
      onDragStart={(e) => onRootDragStart(e, id, index)}
      onDragOver={(e) => onRootDragOver(e, index)}
      onDrop={(e) => onRootDrop(e, index)}
      onDragEnd={onRootDragEnd}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono">{doc[id]?.type || 'Block'} • {id.slice(0,10)}</div>
        <div className="flex gap-1 items-center">
          <button
            type="button"
            className="px-1 py-0.5 text-xs border rounded"
            aria-label="Reorder block"
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); onRootDrop(new KeyboardEvent(''), index - 1 as any); moveWithinParent('root', index, index - 1); }
              if (e.key === 'ArrowDown') { e.preventDefault(); moveWithinParent('root', index, index + 1); }
            }}
          >⇕</button>
          <Button size="sm" variant="destructive" onClick={() => removeBlock(id)}>Delete</Button>
        </div>
      </div>
      {renderCardContent(id)}
    </div>
  );


  function renderCardContent(blockId: string) {
    const t = doc[blockId]?.type;
    if (t === 'Columns') {
      const cols: string[] = doc[blockId]?.data?.props?.columnIds || [];
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length || 2}, minmax(0, 1fr))` }}>
          {cols.map((cid: string) => (
            <div
              key={cid}
              className="border rounded p-2"
              onDragOver={(e)=>onColDragOver(e, cid, (doc[cid]?.data?.props?.childrenIds||[]).length)}
              onDrop={(e)=>onColContainerDrop(e, cid)}
            >
              <AddZone parentId={cid} options={['Heading','Text','Button'] as BlockType[]} className="mb-2" />
              {(doc[cid]?.data?.props?.childrenIds||[]).map((bid: string, bindex: number) => (
                <ColumnItemCard key={bid} parentId={cid} id={bid} index={bindex} />
              ))}
              <AddZone parentId={cid} options={['Heading','Text','Button'] as BlockType[]} className="mt-2" />
            </div>
          ))}
        </div>
      );
    }
    if (t === 'Container') {
      const childIds: string[] = doc[blockId]?.data?.props?.childrenIds || [];
      return (
        <div
          className="space-y-2"
          onDragOver={(e)=>onColDragOver(e, blockId, childIds.length)}
          onDrop={(e)=>onColContainerDrop(e, blockId)}
        >
          <AddZone parentId={blockId} />
          {childIds.map((bid: string, bindex: number) => (
            <ColumnItemCard key={bid} parentId={blockId} id={bid} index={bindex} />
          ))}
          <AddZone parentId={blockId} />
        </div>
      );
    }
    return <div className="pointer-events-none"><Reader document={doc} rootBlockId={blockId} /></div>;
  }


  const html = useCompiledHtml(doc);

  React.useEffect(() => {
    if (initialHtml && !initialDocument) {
      // no reverse parse; we just ignore initialHtml for now
    }
  }, [initialHtml, initialDocument]);

  // Fetch branding for variables (siteName, siteUrl, supportEmail, logoUrl, colors)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/branding/active');
        const json = await res.json();
        const b = json?.data || {};
        const now = new Date();
        const vars: Record<string, string> = {
          siteName: b.siteName || 'Your Site',
          siteUrl: b.siteUrl || 'https://example.com',
          supportEmail: b.supportEmail || 'support@example.com',
          logoUrl: b.logoUrl || 'https://via.placeholder.com/120x40',
          primaryColor: b.primaryColor || '#3b82f6',
          secondaryColor: b.secondaryColor || '#64748b',
          accentColor: b.accentColor || '#f59e0b',
          currentYear: String(now.getFullYear()),
          company_name: b.siteName || 'Your Company',
        };
        if (!cancelled) setBrandingVars(vars);
      } catch {
        const now = new Date();
        if (!cancelled) setBrandingVars({ currentYear: String(now.getFullYear()) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function onFieldFocus(field: 'headingText'|'textText'|'buttonText', blockId: string) {
    return (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      activeInputRef.current = e.currentTarget;
      setFocusedEditor({ blockId, field });
    };
  }

  function insertVariableToken(token: string) {
    const el = (activeInputRef.current || (document.activeElement as any)) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!selectedId) return;

    const helperInsert = (original: string) => {
      if (!el || typeof el.selectionStart !== 'number' || typeof el.selectionEnd !== 'number') {
        return (original || '') + token;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      return (original || '').slice(0, start) + token + (original || '').slice(end);
    };

    const kind = focusedEditor?.field;
    if (!kind) {
      // Fallback: try to append to text prop if it exists
      updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: helperInsert(b.data.props?.text || '') } } }));
      return;
    }

    if (kind === 'headingText' || kind === 'textText' || kind === 'buttonText') {
      updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: helperInsert(b.data.props?.text || '') } } }));
      // restore caret after state update
      setTimeout(() => {
        if (el && typeof el.selectionStart === 'number') {
          const pos = (el.selectionStart ?? 0) + token.length;
          try { el.setSelectionRange(pos, pos); } catch {}
          el.focus();
        }
      }, 0);
    }
  }


  const children: string[] = doc.root?.data?.props?.childrenIds ?? [];

  // DnD state for root-level blocks
  const dragInfo = React.useRef<null | { parentId: string; id: string; index: number }>(null);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  function onRootDragStart(e: React.DragEvent, id: string, index: number) {
    dragInfo.current = { parentId: 'root', id, index };
    try { e.dataTransfer.effectAllowed = 'move'; } catch {}
  }
  function onRootDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setHoverIndex(index);
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
  }
  function onRootDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    const info = dragInfo.current;
    setHoverIndex(null);
    if (!info) return;
    if (info.parentId === 'root') {
      moveWithinParent('root', info.index, index);
    }
    dragInfo.current = null;
  }
  function onRootDragEnd() {
    dragInfo.current = null;
    setHoverIndex(null);
  }

  function addBlock(bt: BlockType, parentId: string = 'root') {
    const created = cloneDefault(bt);
    const id = created[0];
    const block = created[1];
    const extras = (created as any)[2] || {};
    setDoc((prev: any) => {
      const next = { ...prev, [id]: block, ...extras };
      const parent = next[parentId];
      const childIds = parent?.data?.props?.childrenIds ?? [];
      next[parentId] = {
        ...parent,
        data: { ...parent.data, props: { ...parent.data.props, childrenIds: [...childIds, id] } },
      };
      return next;
    });
    setSelectedId(id);
  }

  function removeBlock(id: string) {
    const idx = children.indexOf(id);
    if (idx === -1) return;
    const next = { ...doc };
    delete next[id];
    const newChildren = [...children.slice(0, idx), ...children.slice(idx + 1)];
    next.root = { ...next.root, data: { ...next.root.data, props: { ...next.root.data.props, childrenIds: newChildren } } };
    setDoc(next);
    if (selectedId === id) setSelectedId(null);
  }

  function move(id: string, dir: -1 | 1) {
    const idx = children.indexOf(id);
    if (idx === -1) return;
    const j = idx + dir;
    if (j < 0 || j >= children.length) return;
    const newChildren = [...children];
    const tmp = newChildren[idx];
    newChildren[idx] = newChildren[j];
    newChildren[j] = tmp;
    setDoc((prev: any) => ({
      ...prev,
      root: { ...prev.root, data: { ...prev.root.data, props: { ...prev.root.data.props, childrenIds: newChildren } } },
    }));
  }

  function moveWithinParent(parentId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setDoc((prev: any) => {
      const p = prev[parentId];
      const list: string[] = p?.data?.props?.childrenIds ? [...p.data.props.childrenIds] : [];
      const id = list[fromIndex];
      if (id === undefined) return prev;
      list.splice(fromIndex, 1);
      list.splice(toIndex, 0, id);
      return {
        ...prev,
        [parentId]: { ...p, data: { ...p.data, props: { ...p.data.props, childrenIds: list } } },
      };
    });
  }

  function moveBetweenParents(fromParentId: string, fromIndex: number, toParentId: string, toIndex: number) {
    setDoc((prev: any) => {
      const fromP = prev[fromParentId];
      const toP = prev[toParentId];
      const fromList: string[] = fromP?.data?.props?.childrenIds ? [...fromP.data.props.childrenIds] : [];
      const toList: string[] = toP?.data?.props?.childrenIds ? [...toP.data.props.childrenIds] : [];
      const id = fromList[fromIndex];
      if (id === undefined) return prev;
      fromList.splice(fromIndex, 1);
      toList.splice(toIndex, 0, id);
      return {
        ...prev,
        [fromParentId]: { ...fromP, data: { ...fromP.data, props: { ...fromP.data.props, childrenIds: fromList } } },
        [toParentId]: { ...toP, data: { ...toP.data, props: { ...toP.data.props, childrenIds: toList } } },
      };
    });
  }

  function onColDragStart(e: React.DragEvent, parentId: string, id: string, index: number) {
    dragInfo.current = { parentId, id, index };
    try { e.dataTransfer.effectAllowed = 'move'; } catch {}
  }
  function onColDragOver(e: React.DragEvent, parentId: string, index: number) {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
  }
  function onColDrop(e: React.DragEvent, parentId: string, index: number) {
    e.preventDefault();
    const info = dragInfo.current;
    if (!info) return;
    if (info.parentId === parentId) {
      moveWithinParent(parentId, info.index, index);
    } else {
      moveBetweenParents(info.parentId, info.index, parentId, index);
    }
    dragInfo.current = null;
  }
  function onColContainerDrop(e: React.DragEvent, parentId: string) {
    e.preventDefault();
    const info = dragInfo.current;
    if (!info) return;
    const toIndex = doc[parentId]?.data?.props?.childrenIds?.length || 0;
    if (info.parentId === parentId) {
      moveWithinParent(parentId, info.index, toIndex);
    } else {
      moveBetweenParents(info.parentId, info.index, parentId, toIndex);
    }
    dragInfo.current = null;
  }


  function updateSelected(updater: (b: any) => any) {
    if (!selectedId) return;
    setDoc((prev: any) => ({ ...prev, [selectedId]: updater(prev[selectedId]) }));
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Visual Email Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-4">
          {/* Left rail: Blocks + Variables + Actions */}
          <div className="col-span-12 md:col-span-2 space-y-3">

            <div className="space-y-2">
              <div className="text-sm font-medium">Blocks</div>
              <div className="grid grid-cols-4 gap-1">
                {(['Columns2','Columns3','Section','Heading','Text','Button','Image','Divider','Spacer'] as BlockType[]).map((b) => (
                  <Tooltip key={b}>
                    <TooltipTrigger asChild>
                      <button type="button" className="h-7 w-7 flex items-center justify-center border rounded" onClick={() => addBlock(b, insertTarget)} aria-label={`Add ${blockLabel(b)}`}>
                        {b==='Columns2' || b==='Columns3' ? <ColumnsIcon className="h-3 w-3"/>
                          : b==='Section' ? <Square className="h-3 w-3"/>
                          : b==='Heading' ? <HeadingIcon className="h-3 w-3"/>
                          : b==='Text' ? <TextIcon className="h-3 w-3"/>
                          : b==='Button' ? <MousePointerClick className="h-3 w-3"/>
                          : b==='Image' ? <ImageIcon className="h-3 w-3"/>
                          : b==='Divider' ? <Minus className="h-3 w-3"/>
                          : b==='Spacer' ? <MoveVertical className="h-3 w-3"/>
                          : <Square className="h-3 w-3"/>}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Add {blockLabel(b)}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <label className="text-xs" htmlFor="insertTarget">Insert into</label>
                  <select id="insertTarget" className="w-full border rounded p-1 text-xs" value={insertTarget} onChange={(e)=>setInsertTarget(e.target.value)}>
                    {targetOptions().map((o)=> (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs" htmlFor="applyTarget">Color target</label>
                  <select id="applyTarget" className="w-full border rounded p-1 text-xs" value={applyTarget} onChange={(e)=>setApplyTarget(e.target.value as any)}>
                    <option value="auto">Auto</option>
                    <option value="background">Background</option>
                    <option value="text">Text</option>
                    <option value="border">Border</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Swatches</div>
                <div className="grid grid-cols-8 gap-1">
                  {(['primary','secondary','accent'] as const).filter(k=>brandingVars[`${k}Color`]).map((k)=>{
                    const hex = (brandingVars as any)[`${k}Color`];
                    return (
                      <Tooltip key={k}>
                        <TooltipTrigger asChild>
                          <button type="button" className="h-6 rounded border" style={{ backgroundColor: hex }} aria-label={`${k} ${hex}`} onClick={()=>applyColor(hex)} />
                        </TooltipTrigger>
                        <TooltipContent>{`${k[0].toUpperCase()+k.slice(1)} • ${hex}`}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {colorPalette().map((hex)=> (
                    <Tooltip key={hex}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="h-6 rounded border"
                          style={{ backgroundColor: hex }}
                          aria-label={`Apply ${hex}`}
                          onClick={()=>applyColor(hex)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>{hex}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Variables</div>
              <div className="space-y-1 text-xs max-h-60 overflow-auto pr-1">
                {Object.keys(brandingVars).length === 0 && (
                  <div className="text-muted-foreground">Loading…</div>
                )}
                {Object.keys(brandingVars).map((v) => (
                  <div key={v} className="flex items-center justify-between gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono truncate max-w-[96px] block">{`{{${v}}}`}</span>
                      </TooltipTrigger>
                      <TooltipContent>{`{{${v}}}`}</TooltipContent>
                    </Tooltip>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="p-1 border rounded" onClick={async () => { await navigator.clipboard.writeText(`{{${v}}}`); }} aria-label="Copy">
                            <Copy className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="p-1 border rounded" onClick={() => insertVariableToken(`{{${v}}}`)} aria-label="Insert">
                            <Plus className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Insert</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" className="w-full" onClick={() => onExport?.(html, doc)}>Save to HTML</Button>
                </TooltipTrigger>
                <TooltipContent>Compile and save the current HTML</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="w-full" onClick={() => {
                    const raw = window.prompt('Paste EmailBuilder JSON');
                    if (!raw) return;
                    try { const parsed = JSON.parse(raw); setDoc(parsed); }
                    catch { alert('Invalid JSON'); }
                  }}>Import JSON</Button>
                </TooltipTrigger>
                <TooltipContent>Replace the current document with pasted JSON</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="w-full" onClick={async () => {
                    await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
                  }}>Copy JSON</Button>
                </TooltipTrigger>
                <TooltipContent>Copy the current document JSON to the clipboard</TooltipContent>
              </Tooltip>
              {/* Removed Download JSON per request; keep Download HTML */}
              <a
                className="inline-block w-full"
                href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`}
                download="email.html"
              >
                <Button variant="outline" className="w-full">Download HTML</Button>
              </a>
            </div>
          </div>

          {/* Canvas */}
          <div className="col-span-12 md:col-span-6">
            <div className="border rounded-lg bg-white p-4 min-h-[420px]">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-muted-foreground">Canvas</div>
                <div className="text-xs text-muted-foreground">Click a block to edit</div>
              </div>
              <div className="flex flex-col" style={{ gap: doc.root?.data?.style?.sectionGap ?? 16 }}>
                {children.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">Add blocks from the left to start</div>
                )}
                {/* Outline view with simple controls */}
                {children.map((id, index) => (
                  <RootItemCard key={id} id={id} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* Right pane: Inspector */}
          <div className="col-span-12 md:col-span-4 space-y-3">
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-sm font-medium mb-2">Inspector</div>
              {!selectedId && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Canvas</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs" htmlFor="pagebg">Page background</label>
                      <Input id="pagebg" type="color"
                        value={doc.root?.data?.style?.pageBackgroundColor || '#ffffff'}
                        onChange={(e) => setDoc((prev:any)=> ({
                          ...prev,
                          root: { ...prev.root, data: { ...prev.root.data, style: { ...prev.root.data.style, pageBackgroundColor: e.target.value } } }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs" htmlFor="secgap_root">Section gap</label>
                      <Input id="secgap_root" type="number"
                        value={doc.root?.data?.style?.sectionGap ?? 16}
                        onChange={(e) => setDoc((prev:any)=> ({
                          ...prev,
                          root: { ...prev.root, data: { ...prev.root.data, style: { ...prev.root.data.style, sectionGap: Number(e.target.value) } } }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Tip: Select a section or element on the canvas to edit its styles here.</div>
                </div>
              )}
              {selectedId && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">Block: {doc[selectedId]?.type}</div>

                  {/* Columns styles */}
                  {doc[selectedId]?.type === 'Columns' && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Columns Settings</div>
                      <label className="text-xs" htmlFor="cgap">Gap between columns</label>
                      <Input id="cgap" type="number"
                        value={doc[selectedId].data.style?.gap ?? 16}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, gap: Number(e.target.value) } } }))}
                      />
                      <div className="text-xs font-medium mt-3">Per-Column Controls</div>
                      {doc[selectedId]?.data?.props?.columnIds?.map((cid: string, idx: number) => (
                        <div key={cid} className="border rounded p-2 space-y-2">
                          <div className="text-xs font-medium">Column {idx + 1}</div>
                          <label className="text-xs" htmlFor={`cbg-${idx}`}>Background</label>
                          <Input id={`cbg-${idx}`} type="color"
                            value={doc[cid]?.data?.style?.backgroundColor || '#ffffff'}
                            onChange={(e) => setDoc((prev: any) => ({
                              ...prev,
                              [cid]: {
                                ...prev[cid],
                                data: {
                                  ...prev[cid].data,
                                  style: { ...prev[cid].data.style, backgroundColor: e.target.value },
                                },
                              },
                            }))}
                          />
                      <label className="text-xs" htmlFor="mb">Bottom spacing</label>
                      <Input id="mb" type="number"
                        value={doc[selectedId].data.style?.marginBottom ?? 0}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, marginBottom: Number(e.target.value) } } }))}
                      />

                          <label className="text-xs" htmlFor={`cpad-${idx}`}>Padding (all sides)</label>
                          <Input id={`cpad-${idx}`} type="number"
                            value={doc[cid]?.data?.style?.padding?.top ?? 16}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDoc((prev: any) => ({
                                ...prev,
                                [cid]: {
                                  ...prev[cid],
                                  data: {
                                    ...prev[cid].data,
                                    style: {
                                      ...prev[cid].data.style,
                                      padding: { top: val, right: val, bottom: val, left: val },
                                    },
                                  },
                                },
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section styles */}
                  {doc[selectedId]?.type === 'Container' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="bg">Background</label>
                      <Input id="bg" type="color"
                        value={doc[selectedId].data.style?.backgroundColor || '#ffffff'}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, backgroundColor: e.target.value } } }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="pad">Padding (top/right/bottom/left)</label>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="secgap">Section gap</label>
                          <Input id="secgap" type="number"
                            value={doc.root?.data?.style?.sectionGap ?? 16}
                            onChange={(e) => setDoc((prev:any)=> ({
                              ...prev,
                              root: { ...prev.root, data: { ...prev.root.data, style: { ...prev.root.data.style, sectionGap: Number(e.target.value) } } }
                            }))}
                          />
                        </div>
                      <label className="text-xs" htmlFor="mb">Bottom spacing</label>
                      <Input id="mb" type="number"
                        value={doc[selectedId].data.style?.marginBottom ?? 0}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, marginBottom: Number(e.target.value) } } }))}
                      />

                      </div>
                      <label className="text-xs" htmlFor="pad">Padding (top/right/bottom/left)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['top','right','bottom','left'] as const).map((edge) => (
                          <Input key={edge} type="number" value={doc[selectedId].data.style?.padding?.[edge] ?? 24}
                            onChange={(e) =>
                              updateSelected((b) => ({
                                ...b,
                                data: {
                                  ...b.data,
                                  style: {
                                    ...b.data.style,
                                    padding: {
                                      ...(b.data.style?.padding || {}),
                                      [edge]: Number(e.target.value),
                                    },
                                  },
                                },
                              }))
                            }
                          />
                        ))}
                      </div>
                      <label className="text-xs" htmlFor="br">Border radius</label>
                      <Input id="br" type="number"
                        value={doc[selectedId].data.style?.borderRadius ?? 8}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, borderRadius: Number(e.target.value) } } }))}
                      />
                      <label className="text-xs" htmlFor="bw">Border width</label>
                      <Input id="bw" type="number"
                        value={doc[selectedId].data.style?.borderWidth ?? 0}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, borderWidth: Number(e.target.value) } } }))}
                      />
                      <label className="text-xs" htmlFor="bc">Border color</label>
                      <Input id="bc" type="color"
                        value={doc[selectedId].data.style?.borderColor ?? '#e5e7eb'}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, borderColor: e.target.value } } }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="maxw">Max width</label>
                          <Input id="maxw" type="number"
                            value={doc[selectedId].data.style?.maxWidth ?? 640}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, maxWidth: Number(e.target.value) } } }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="salign">Align</label>
                          <select id="salign" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.align || 'center'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, align: e.target.value } } }))}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Common props by block type */}
                  {doc[selectedId]?.type === 'Heading' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="htext">Text</label>
                      <Input id="htext"
                        value={doc[selectedId].data.props.text || ''}
                        onFocus={onFieldFocus('headingText', selectedId)}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: e.target.value } } }))}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="hlevel">Level</label>
                          <select id="hlevel" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.props.level || 'h2'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, level: e.target.value } } }))}
                          >
                            {['h1','h2','h3','h4'].map((lv) => (
                              <option key={lv} value={lv}>{lv.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="hstyle">Heading style</label>
                          <select id="hstyle" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.preset || 'h2'}
                            onChange={(e)=> {
                              const preset = e.target.value;
                              const map: Record<string, { level: string; fontSize: number; lineHeight: number }> = {
                                h1: { level: 'h1', fontSize: 32, lineHeight: 38 },
                                h2: { level: 'h2', fontSize: 24, lineHeight: 30 },
                                h3: { level: 'h3', fontSize: 20, lineHeight: 26 },
                                h4: { level: 'h4', fontSize: 18, lineHeight: 24 },
                              };
                              const s = map[preset] || map.h2;
                              updateSelected((b) => ({
                                ...b,
                                data: {
                                  ...b.data,
                                  props: { ...b.data.props, level: s.level },
                                  style: { ...b.data.style, preset, fontSize: s.fontSize, lineHeight: s.lineHeight },
                                },
                              }));
                            }}
                          >
                            <option value="h1">H1</option>
                            <option value="h2">H2</option>
                            <option value="h3">H3</option>
                            <option value="h4">H4</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="halign">Align</label>
                          <select id="halign" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.textAlign || 'left'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, textAlign: e.target.value } } }))}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="hmt">Margin top</label>
                          <Input id="hmt" type="number"
                            value={doc[selectedId].data.style?.marginTop ?? 0}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, marginTop: Number(e.target.value) } } }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="hmb">Margin bottom</label>
                          <Input id="hmb" type="number"
                            value={doc[selectedId].data.style?.marginBottom ?? 8}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, marginBottom: Number(e.target.value) } } }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="hsize">Font size</label>
                          <div className="flex gap-2">
                            <Input id="hsize" type="number" className="w-24"
                              value={doc[selectedId].data.style?.fontSize ?? 24}
                              onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, fontSize: Number(e.target.value) } } }))}
                            />
                            <select className="w-full border rounded p-1 text-xs" value={doc[selectedId].data.style?.fontSize ?? 24}
                              onChange={(e)=> updateSelected((b)=> ({ ...b, data: { ...b.data, style: { ...b.data.style, fontSize: Number(e.target.value) } } }))}
                            >
                              {[10,12,14,18,22,24,32].map(sz => (
                                <option key={sz} value={sz}>{sz}px</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="hweight">Weight</label>
                          <select id="hweight" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.fontWeight || '600'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, fontWeight: e.target.value } } }))}
                          >
                            <option value="400">Normal</option>
                            <option value="500">Medium</option>
                            <option value="600">Semibold</option>
                            <option value="700">Bold</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="hline">Line height</label>
                          <Input id="hline" type="number"
                            value={doc[selectedId].data.style?.lineHeight ?? 30}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, lineHeight: Number(e.target.value) } } }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs" htmlFor="hcolor">Color</label>
                        <Input id="hcolor" type="color"
                          value={doc[selectedId].data.style?.color || '#111827'}
                          onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, color: e.target.value } } }))}
                        />
                      </div>
                    </div>
                  )}

                  {doc[selectedId]?.type === 'Text' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="ttext">Text</label>
                      <Textarea id="ttext"
                        rows={5}
                        value={doc[selectedId].data.props.text || ''}
                        onFocus={onFieldFocus('textText', selectedId)}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: e.target.value } } }))}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="talign">Align</label>
                          <select id="talign" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.textAlign || 'left'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, textAlign: e.target.value } } }))}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="tmt">Margin top</label>
                          <Input id="tmt" type="number"
                            value={doc[selectedId].data.style?.marginTop ?? 0}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, marginTop: Number(e.target.value) } } }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="tmb">Margin bottom</label>
                          <Input id="tmb" type="number"
                            value={doc[selectedId].data.style?.marginBottom ?? 8}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, marginBottom: Number(e.target.value) } } }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="tsize">Font size</label>
                          <div className="flex gap-2">
                            <Input id="tsize" type="number" className="w-24"
                              value={doc[selectedId].data.style?.fontSize ?? 14}
                              onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, fontSize: Number(e.target.value) } } }))}
                            />
                            <select className="w-full border rounded p-1 text-xs" value={doc[selectedId].data.style?.fontSize ?? 14}
                              onChange={(e)=> updateSelected((b)=> ({ ...b, data: { ...b.data, style: { ...b.data.style, fontSize: Number(e.target.value) } } }))}
                            >
                              {[10,12,14,18,22,24,32].map(sz => (
                                <option key={sz} value={sz}>{sz}px</option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-1">
                            <label className="text-xs" htmlFor="tstyle">Text styles</label>
                            <select id="tstyle" className="w-full border rounded p-1 text-xs" value={doc[selectedId].data.style?.preset || 'body'}
                              onChange={(e)=> {
                                const preset = e.target.value;
                                const map: Record<string, { fontSize: number; lineHeight: number }> = {
                                  small: { fontSize: 12, lineHeight: 18 },
                                  body: { fontSize: 14, lineHeight: 20 },
                                  lead: { fontSize: 18, lineHeight: 26 },
                                  h3: { fontSize: 20, lineHeight: 26 },
                                  h2: { fontSize: 24, lineHeight: 30 },
                                  h1: { fontSize: 32, lineHeight: 38 },
                                };
                                const sizes = map[preset] || map.body;
                                updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, preset, ...sizes } } }));
                              }}
                            >
                              <option value="small">Small</option>
                              <option value="body">Body</option>
                              <option value="lead">Lead</option>
                              <option value="h3">H3</option>
                              <option value="h2">H2</option>
                              <option value="h1">H1</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="tweight">Weight</label>
                          <select id="tweight" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.fontWeight || '400'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, fontWeight: e.target.value } } }))}
                          >
                            <option value="400">Normal</option>
                            <option value="500">Medium</option>
                            <option value="600">Semibold</option>
                            <option value="700">Bold</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="tline">Line height</label>
                          <Input id="tline" type="number"
                            value={doc[selectedId].data.style?.lineHeight ?? 20}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, lineHeight: Number(e.target.value) } } }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="tletter">Letter spacing</label>
                          <Input id="tletter" type="number"
                            value={doc[selectedId].data.style?.letterSpacing ?? 0}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, letterSpacing: Number(e.target.value) } } }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="ttransform">Transform</label>
                          <select id="ttransform" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.textTransform || 'none'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, textTransform: e.target.value } } }))}
                          >
                            <option value="none">None</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="capitalize">Capitalize</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="tcolor">Color</label>
                          <Input id="tcolor" type="color"
                            value={doc[selectedId].data.style?.color || '#374151'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, color: e.target.value } } }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {doc[selectedId]?.type === 'Button' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="blabel">Label</label>
                      <Input id="blabel"
                        value={doc[selectedId].data.props.text || ''}
                        onFocus={onFieldFocus('buttonText', selectedId)}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: e.target.value } } }))}
                      />
                      <label className="text-xs" htmlFor="burl">URL</label>
                      <Input id="burl"
                        value={doc[selectedId].data.props.url || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, url: e.target.value } } }))}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="balign">Align</label>
                          <select id="balign" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.textAlign || 'center'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, textAlign: e.target.value } } }))}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="bvariant">Variant</label>
                          <select id="bvariant" className="w-full border rounded p-1 text-xs"
                            value={doc[selectedId].data.style?.variant || 'primary'}
                            onChange={(e) => {
                              const v = e.target.value;
                              const colors = brandingVars;
                              const styles = v === 'primary' ? { backgroundColor: colors.primaryColor || '#3b82f6', color: '#ffffff', borderWidth: 0, borderColor: 'transparent' }
                                : v === 'secondary' ? { backgroundColor: colors.secondaryColor || '#64748b', color: '#ffffff', borderWidth: 0, borderColor: 'transparent' }
                                : v === 'accent' ? { backgroundColor: colors.accentColor || '#f59e0b', color: '#111827', borderWidth: 0, borderColor: 'transparent' }
                                : { backgroundColor: 'transparent', color: colors.primaryColor || '#3b82f6', borderWidth: 1, borderColor: colors.primaryColor || '#3b82f6' };
                              updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, variant: v, ...styles } } }));
                            }}
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="accent">Accent</option>
                            <option value="outline">Outline</option>
                          </select>
                        </div>
                        {(doc[selectedId].data.style?.variant === 'accent' || doc[selectedId].data.style?.variant === 'outline') && (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs" htmlFor="boverride">Override color</label>
                              <Input id="boverride" type="color"
                                value={doc[selectedId].data.style?.overrideColor || (doc[selectedId].data.style?.variant === 'accent' ? (brandingVars.accentColor || '#f59e0b') : (brandingVars.primaryColor || '#3b82f6'))}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (doc[selectedId].data.style?.variant === 'accent') {
                                    updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, overrideColor: v, backgroundColor: v, color: '#111827', borderWidth: 0, borderColor: 'transparent' } } }));
                                  } else {
                                    updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, overrideColor: v, backgroundColor: 'transparent', color: v, borderWidth: 1, borderColor: v } } }));
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs" htmlFor="bcolor">Text Color</label>
                              <Input id="bcolor" type="color"
                                value={doc[selectedId].data.style?.color || (doc[selectedId].data.style?.variant === 'accent' ? '#111827' : (brandingVars.primaryColor || '#3b82f6'))}
                                onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, color: e.target.value } } }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs" htmlFor="bborder">Border Color</label>
                              <Input id="bborder" type="color"
                                value={doc[selectedId].data.style?.borderColor || (doc[selectedId].data.style?.variant === 'outline' ? (doc[selectedId].data.style?.overrideColor || brandingVars.primaryColor || '#3b82f6') : '#000000')}
                                onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, borderColor: e.target.value } } }))}
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-xs" htmlFor="brad">Radius</label>
                          <Input id="brad" type="number"
                            value={doc[selectedId].data.style?.borderRadius ?? 6}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, borderRadius: Number(e.target.value) } } }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="bpx">Padding X</label>
                          <Input id="bpx" type="number"
                            value={doc[selectedId].data.style?.paddingX ?? 16}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, paddingX: Number(e.target.value) } } }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="bpy">Padding Y</label>
                          <Input id="bpy" type="number"
                            value={doc[selectedId].data.style?.paddingY ?? 10}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, paddingY: Number(e.target.value) } } }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="bcolor">Text Color</label>
                          <Input id="bcolor" type="color"
                            value={doc[selectedId].data.style?.color || '#ffffff'}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, color: e.target.value } } }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs" htmlFor="bbg">Background</label>
                        <Input id="bbg" type="color"
                          value={doc[selectedId].data.style?.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, backgroundColor: e.target.value } } }))}
                        />
                      </div>
                    </div>
                  )}

                  {doc[selectedId]?.type === 'Image' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="isrc">Image URL</label>
                      <Input id="isrc"
                        value={doc[selectedId].data.props.src || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, src: e.target.value } } }))}
                      />
                      <label className="text-xs" htmlFor="ialt">Alt</label>
                      <Input id="ialt"
                        value={doc[selectedId].data.props.alt || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, alt: e.target.value } } }))}
                      />
                    </div>
                  )}

                  {doc[selectedId]?.type === 'Spacer' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="sheight">Height (px)</label>
                      <Input id="sheight" type="number"
                        value={doc[selectedId].data.style?.height || 16}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, height: Number(e.target.value) } } }))}
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <Button onClick={() => onExport?.(html, doc)} className="w-full">Save to HTML</Button>
                  </div>
                </div>
              )}
            </div>


            </div>
          </div>


            {/* Responsive preview moved below - this panel is removed intentionally */}

        {/* Full-width Live Preview below builder */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Live Preview</div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['mobile','tablet','desktop'] as const).map((bp) => (
                  <Button key={bp} size="sm" variant="outline" onClick={() => setViewport(bp)}>
                    {bp}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Zoom</span>
                <input
                  type="range"
                  min={75}
                  max={125}
                  step={25}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value) as 75 | 100 | 125)}
                />
                <span>{zoom}%</span>
              </div>
            </div>
          </div>
          <div className="w-full flex justify-center">
            {(() => {
              const cls = viewportClass(viewport);
              return (
                <div className={cls} style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top center', backgroundColor: doc.root?.data?.style?.pageBackgroundColor || '#ffffff', padding: 16, borderRadius: 8 }}>
                  <EmailPreview doc={doc} />
                </div>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailBuilderClient;

