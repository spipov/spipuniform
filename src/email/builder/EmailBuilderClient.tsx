import * as React from 'react';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

type BlockType = 'Section' | 'Heading' | 'Text' | 'Button' | 'Image' | 'Divider' | 'Spacer';

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
  return [id, { ...blockDefaults[bt], data: JSON.parse(JSON.stringify(blockDefaults[bt].data)) }] as const;
}

function useCompiledHtml(doc: any) {
  const [html, setHtml] = React.useState('');
  React.useEffect(() => {
    try {
      setHtml(renderToStaticMarkup(doc, { rootBlockId: 'root' }));
    } catch (e) {
      console.error('compile failed', e);
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

  const html = useCompiledHtml(doc);

  React.useEffect(() => {
    if (initialHtml && !initialDocument) {
      // no reverse parse; we just ignore initialHtml for now
    }
  }, [initialHtml, initialDocument]);

  const children: string[] = doc.root?.data?.props?.childrenIds ?? [];

  function addBlock(bt: BlockType, parentId: string = 'root') {
    const [id, block] = cloneDefault(bt);
    setDoc((prev: any) => {
      const next = { ...prev, [id]: block } as any;
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
            <div>
              <div className="text-sm font-medium mb-1">Blocks</div>
              {(['Section','Heading','Text','Button','Image','Divider','Spacer'] as BlockType[]).map((b) => (
                <Button key={b} variant="outline" className="w-full justify-start" onClick={() => addBlock(b)}>
                  + {b}
                </Button>
              ))}
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Variables</div>
              <div className="space-y-1 text-xs">
                {['siteName','supportEmail','siteUrl','currentYear'].map((v) => (
                  <div key={v} className="flex items-center justify-between gap-2">
                    <span className="font-mono">{`{{${v}}}`}</span>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      await navigator.clipboard.writeText(`{{${v}}}`);
                    }}>Copy</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => onExport?.(html, doc)}>
                Save to HTML
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                const raw = window.prompt('Paste EmailBuilder JSON');
                if (!raw) return;
                try { const parsed = JSON.parse(raw); setDoc(parsed); }
                catch { alert('Invalid JSON'); }
              }}>
                Import JSON
              </Button>
              <Button variant="outline" className="w-full" onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
              }}>
                Copy JSON
              </Button>
              <a
                className="inline-block w-full"
                href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(doc, null, 2))}`}
                download="email.json"
              >
                <Button variant="outline" className="w-full">Download JSON</Button>
              </a>
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
              <div className="space-y-3">
                {children.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">Add blocks from the left to start</div>
                )}
                {/* Outline view with simple controls */}
                {children.map((id) => (
                  <div key={id} className={`border rounded p-2 ${selectedId===id? 'ring-2 ring-blue-500':''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-mono">{doc[id]?.type || 'Block'} • {id.slice(0,10)}</div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => move(id, -1)}>↑</Button>
                        <Button size="sm" variant="outline" onClick={() => move(id, 1)}>↓</Button>
                        <Button size="sm" variant="destructive" onClick={() => removeBlock(id)}>Delete</Button>
                      </div>
                    </div>
                    <button onClick={() => setSelectedId(id)} className="cursor-pointer w-full text-left">
                      <Reader document={{ root: doc[id] }} rootBlockId="root" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right pane: Inspector + Responsive Preview */}
          <div className="col-span-12 md:col-span-4 space-y-3">
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-sm font-medium mb-2">Inspector</div>
              {!selectedId && (
                <div className="text-sm text-muted-foreground">Select a block to edit its content and styles.</div>
              )}
              {selectedId && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">Block: {doc[selectedId]?.type}</div>

                  {/* Section styles */}
                  {doc[selectedId]?.type === 'Container' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="bg">Background</label>
                      <Input id="bg" type="color"
                        value={doc[selectedId].data.style?.backgroundColor || '#ffffff'}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, backgroundColor: e.target.value } } }))}
                      />
                      <label className="text-xs" htmlFor="pad">Padding (top/right/bottom/left)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['top','right','bottom','left'] as const).map((edge) => (
                          <Input key={edge} type="number" value={doc[selectedId].data.style?.padding?.[edge] ?? 24}
                            onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, style: { ...b.data.style, padding: { ...(b.data.style?.padding||{}), [edge]: Number(e.target.value) } } }))})}
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
                    </div>
                  )}

                  {/* Common props by block type */}
                  {doc[selectedId]?.type === 'Heading' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="htext">Text</label>
                      <Input id="htext"
                        value={doc[selectedId].data.props.text || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: e.target.value } } }))}
                      />
                      <label className="text-xs" htmlFor="hlevel">Level (h1..h4)</label>
                      <Input id="hlevel"
                        value={doc[selectedId].data.props.level || 'h2'}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, level: e.target.value } } }))}
                      />
                    </div>
                  )}

                  {doc[selectedId]?.type === 'Text' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="ttext">Text</label>
                      <Textarea id="ttext"
                        rows={5}
                        value={doc[selectedId].data.props.text || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: e.target.value } } }))}
                      />
                    </div>
                  )}

                  {doc[selectedId]?.type === 'Button' && (
                    <div className="space-y-2">
                      <label className="text-xs" htmlFor="blabel">Label</label>
                      <Input id="blabel"
                        value={doc[selectedId].data.props.text || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, text: e.target.value } } }))}
                      />
                      <label className="text-xs" htmlFor="burl">URL</label>
                      <Input id="burl"
                        value={doc[selectedId].data.props.url || ''}
                        onChange={(e) => updateSelected((b) => ({ ...b, data: { ...b.data, props: { ...b.data.props, url: e.target.value } } }))}
                      />
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

            {/* Responsive preview */}
            <div className="border rounded bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Live Preview</div>
                <div className="flex gap-1">
                  {(['mobile','tablet','desktop'] as const).map((bp) => (
                    <Button key={bp} size="sm" variant="outline" onClick={() => setViewport(bp)}>
                      {bp}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="w-full flex justify-center">
                <div className={
                  viewport==='mobile' ? 'w-[360px]' : viewport==='tablet' ? 'w-[720px]' : 'w-[640px]'
                }>
                  <Reader document={doc} rootBlockId="root" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailBuilderClient;

