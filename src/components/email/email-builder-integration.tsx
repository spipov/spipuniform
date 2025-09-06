import React, { useState } from 'react';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { EmailPreview } from '@/email/builder/ColumnsRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';

interface EmailBuilderIntegrationProps {
  initialHtml?: string;
  onHtmlChange?: (html: string) => void;
}

export function EmailBuilderIntegration({ initialHtml = '', onHtmlChange }: EmailBuilderIntegrationProps) {
  const [jsonData, setJsonData] = useState<Record<string, unknown> | null>(null);
  const [htmlOutput, setHtmlOutput] = useState(initialHtml);
  const [activeTab, setActiveTab] = useState('html');

  // Sample JSON structure for email template
  const sampleJsonData = {
    root: {
      type: 'Container',
      data: {
        style: {
          backgroundColor: '#ffffff',
          padding: { top: 20, bottom: 20, left: 20, right: 20 }
        },
        props: {
          childrenIds: ['block-1', 'block-2']
        }
      }
    },
    'block-1': {
      type: 'Heading',
      data: {
        style: { textAlign: 'center' },
        props: {
          text: 'Welcome to Our Platform!',
          level: 'h1'
        }
      }
    },
    'block-2': {
      type: 'Text',
      data: {
        style: { textAlign: 'center' },
        props: {
          text: 'Thank you for joining us. We\'re excited to have you on board!'
        }
      }
    }
  };

  const handleJsonChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setJsonData(parsed);
      // Generate HTML from JSON
      const html = renderToStaticMarkup(parsed, { rootBlockId: 'root' });
      setHtmlOutput(html);
      onHtmlChange?.(html);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  const handleHtmlChange = (html: string) => {
    setHtmlOutput(html);
    onHtmlChange?.(html);
  };

  const loadSampleTemplate = () => {
    setJsonData(sampleJsonData);
    const html = renderToStaticMarkup(sampleJsonData, { rootBlockId: 'root' });
    setHtmlOutput(html);
    onHtmlChange?.(html);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Template Builder (Using Waypoint Reader)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="html">HTML Editor</TabsTrigger>
            <TabsTrigger value="json">JSON Data</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="html-editor">HTML Content</Label>
              <Textarea
                id="html-editor"
                value={htmlOutput}
                onChange={(e) => handleHtmlChange(e.target.value)}
                placeholder="Enter your HTML email template here..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-editor">JSON Data (Waypoint Format)</Label>
              <Textarea
                id="json-editor"
                value={jsonData ? JSON.stringify(jsonData, null, 2) : ''}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder="JSON representation of the email template..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={loadSampleTemplate} variant="outline">
              Load Sample Template
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                {jsonData ? (
                  <EmailPreview doc={jsonData} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No template data to preview. Add JSON data or HTML content.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setJsonData(null);
              setHtmlOutput('');
              onHtmlChange?.('');
            }}
          >
            Clear
          </Button>
          <Button
            onClick={() => {
              // Here you could add logic to save the template
              console.log('Saving template:', { jsonData, htmlOutput });
            }}
          >
            Save Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage component
export function EmailTemplateCreator() {
  const [templateHtml, setTemplateHtml] = useState('');

  return (
    <div className="space-y-4">
      <EmailBuilderIntegration
        initialHtml={templateHtml}
        onHtmlChange={setTemplateHtml}
      />

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border rounded p-4 max-w-md mx-auto"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(templateHtml) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}