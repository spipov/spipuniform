import React from 'react';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';

// Custom renderer for Columns blocks that compiles to email-safe HTML
export function renderColumnsToHtml(doc: any, rootBlockId: string): string {
  const block = doc[rootBlockId];
  if (!block) return '';

  if (block.type === 'Columns') {
    const columnIds = block.data?.props?.columnIds || [];
    const gap = block.data?.style?.gap || 16;

    // Render each column's content using Reader over the full document
    const columnHtmls = columnIds.map((cid: string) => {
      return renderToStaticMarkup(doc, { rootBlockId: cid });
    });

    // Create email-safe table layout
    const colCount = columnIds.length;
    const cellWidth = Math.floor(100 / colCount);
    
    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          ${columnHtmls.map((html, idx) => `
            <td width="${cellWidth}%" valign="top" style="padding-right: ${idx < colCount - 1 ? gap : 0}px;">
              ${html}
            </td>
          `).join('')}
        </tr>
      </table>
    `;
  }

  // For non-Columns blocks, use standard Reader
  return renderToStaticMarkup({ root: block }, { rootBlockId: 'root' });
}

// React component for live preview of Columns
export function ColumnsPreview({ doc, rootBlockId }: { doc: any; rootBlockId: string }) {
  const block = doc[rootBlockId];
  if (!block) return null;

  if (block.type === 'Columns') {
    const columnIds = block.data?.props?.columnIds || [];
    const gap = block.data?.style?.gap || 16;

    return (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnIds.length}, minmax(0, 1fr))`,
          gap: `${gap}px`
        }}
      >
        {columnIds.map((cid: string) => (
          <div key={cid}>
            <Reader document={doc} rootBlockId={cid} />
          </div>
        ))}
      </div>
    );
  }

  return <Reader document={doc} rootBlockId={rootBlockId} />;
}

// Top-level preview that can render a root document that may contain Columns among other blocks
export function EmailPreview({ doc }: { doc: any }) {
  const children: string[] = doc.root?.data?.props?.childrenIds || [];
  if (!children.length) return null;
  const gap = doc.root?.data?.style?.sectionGap ?? 0;
  return (
    <div>
      {children.map((id, idx) => {
        const child = doc[id];
        const childGap = typeof child?.data?.style?.marginBottom === 'number' ? child.data.style.marginBottom : undefined;
        const mb = childGap !== undefined ? childGap : (idx < children.length - 1 ? gap : 0);
        return (
          <div key={id} style={{ marginBottom: mb }}>
            {child?.type === 'Columns' ? (
              <ColumnsPreview doc={doc} rootBlockId={id} />
            ) : (
              <Reader document={doc} rootBlockId={id} />
            )}
          </div>
        );
      })}
    </div>
  );
}
