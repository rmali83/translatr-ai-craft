import { useState } from 'react';
import { Globe, Link as LinkIcon, Loader2, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExtractedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ alt: string; src: string }>;
}

interface TranslatedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
}

export default function WebsiteTranslation() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Urdu');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [progress, setProgress] = useState(0);

  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Urdu', 'Turkish', 'Dutch', 'Polish', 'Swedish', 'Norwegian',
  ];

  const extractWebsiteContent = async (websiteUrl: string): Promise<ExtractedContent> => {
    // Use a CORS proxy to fetch the website
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(websiteUrl)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('Failed to fetch website content');
    }

    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    // Extract content
    const title = doc.querySelector('title')?.textContent || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => h.textContent?.trim())
      .filter(Boolean) as string[];
    
    const paragraphs = Array.from(doc.querySelectorAll('p'))
      .map(p => p.textContent?.trim())
      .filter(text => text && text.length > 20) as string[];
    
    const links = Array.from(doc.querySelectorAll('a'))
      .map(a => ({
        text: a.textContent?.trim() || '',
        href: a.getAttribute('href') || '',
      }))
      .filter(link => link.text && link.text.length > 0)
      .slice(0, 20); // Limit to 20 links
    
    const images = Array.from(doc.querySelectorAll('img'))
      .map(img => ({
        alt: img.getAttribute('alt') || '',
        src: img.getAttribute('src') || '',
      }))
      .filter(img => img.alt)
      .slice(0, 10); // Limit to 10 images

    return {
      title,
      description,
      headings,
      paragraphs,
      links,
      images,
    };
  };

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a website URL',
        variant: 'destructive',
      });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL (e.g., https://example.com)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setExtractedContent(null);
    setTranslatedContent(null);

    try {
      const content = await extractWebsiteContent(url);
      setExtractedContent(content);
      
      toast({
        title: 'Success',
        description: `Extracted ${content.paragraphs.length} paragraphs and ${content.headings.length} headings`,
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract website content. The website may be blocking access.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!extractedContent) return;

    setTranslating(true);
    setProgress(0);

    try {
      const allTexts = [
        extractedContent.title,
        extractedContent.description,
        ...extractedContent.headings,
        ...extractedContent.paragraphs,
      ].filter(Boolean);

      const totalItems = allTexts.length;
      const translated: string[] = [];

      // Translate in batches
      for (let i = 0; i < allTexts.length; i++) {
        const text = allTexts[i];
        
        try {
          const response = await api.translate({
            source_text: text,
            source_lang: sourceLang,
            target_lang: targetLang,
            use_glossary: false,
          });

          if (response.success) {
            translated.push(response.data.translated_text);
          } else {
            translated.push(text); // Keep original if translation fails
          }
        } catch {
          translated.push(text); // Keep original if translation fails
        }

        setProgress(Math.round(((i + 1) / totalItems) * 100));
      }

      // Organize translated content
      let index = 0;
      const translatedTitle = translated[index++];
      const translatedDescription = translated[index++];
      const translatedHeadings = translated.slice(index, index + extractedContent.headings.length);
      index += extractedContent.headings.length;
      const translatedParagraphs = translated.slice(index);

      setTranslatedContent({
        title: translatedTitle,
        description: translatedDescription,
        headings: translatedHeadings,
        paragraphs: translatedParagraphs,
      });

      toast({
        title: 'Success',
        description: `Translated ${totalItems} text elements`,
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to translate content',
        variant: 'destructive',
      });
    } finally {
      setTranslating(false);
      setProgress(0);
    }
  };

  const handleExport = () => {
    if (!translatedContent || !extractedContent) return;

    const exportData = {
      original: {
        url,
        title: extractedContent.title,
        description: extractedContent.description,
        headings: extractedContent.headings,
        paragraphs: extractedContent.paragraphs,
      },
      translated: {
        title: translatedContent.title,
        description: translatedContent.description,
        headings: translatedContent.headings,
        paragraphs: translatedContent.paragraphs,
      },
      languages: {
        source: sourceLang,
        target: targetLang,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `website_translation_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    toast({
      title: 'Success',
      description: 'Translation exported successfully',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-accent opacity-5 rounded-3xl blur-3xl"></div>
        <div className="relative glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                Website Translation
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Extract and translate entire websites instantly
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center shadow-2xl">
                <Globe className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="website-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={loading || translating}
              />
            </div>
            <Button onClick={handleExtract} disabled={loading || translating}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Content'
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-lang">Source Language</Label>
            <Select value={sourceLang} onValueChange={setSourceLang} disabled={loading || translating}>
              <SelectTrigger id="source-lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-lang">Target Language</Label>
            <Select value={targetLang} onValueChange={setTargetLang} disabled={loading || translating}>
              <SelectTrigger id="target-lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {extractedContent && !translating && (
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleTranslate} className="gap-2">
              <Globe className="w-4 h-4" />
              Translate Website
            </Button>
          </div>
        )}

        {translating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Translating content...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Warning */}
      {extractedContent && (
        <div className="glass-card p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Note about AI Translation</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI translation is currently using mock data. To enable real translations, please add credits to OpenAI or configure Gemini API key.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {extractedContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Content */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Original Content</h2>
              <span className="text-sm text-muted-foreground">{sourceLang}</span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {extractedContent.title && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Title</p>
                  <p className="text-sm text-foreground">{extractedContent.title}</p>
                </div>
              )}

              {extractedContent.description && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground">{extractedContent.description}</p>
                </div>
              )}

              {extractedContent.headings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Headings ({extractedContent.headings.length})
                  </p>
                  <div className="space-y-2">
                    {extractedContent.headings.slice(0, 10).map((heading, idx) => (
                      <p key={idx} className="text-sm text-foreground bg-secondary/50 p-2 rounded">
                        {heading}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {extractedContent.paragraphs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Paragraphs ({extractedContent.paragraphs.length})
                  </p>
                  <div className="space-y-2">
                    {extractedContent.paragraphs.slice(0, 5).map((para, idx) => (
                      <p key={idx} className="text-sm text-foreground bg-secondary/50 p-2 rounded">
                        {para.substring(0, 200)}
                        {para.length > 200 && '...'}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Translated Content */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Translated Content</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{targetLang}</span>
                {translatedContent && (
                  <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
                    <Download className="w-3 h-3" />
                    Export
                  </Button>
                )}
              </div>
            </div>

            {!translatedContent ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <p className="text-sm">Click "Translate Website" to see translations</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {translatedContent.title && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Title</p>
                    <p className="text-sm text-foreground">{translatedContent.title}</p>
                  </div>
                )}

                {translatedContent.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground">{translatedContent.description}</p>
                  </div>
                )}

                {translatedContent.headings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Headings ({translatedContent.headings.length})
                    </p>
                    <div className="space-y-2">
                      {translatedContent.headings.slice(0, 10).map((heading, idx) => (
                        <p key={idx} className="text-sm text-foreground bg-accent/10 p-2 rounded">
                          {heading}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {translatedContent.paragraphs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Paragraphs ({translatedContent.paragraphs.length})
                    </p>
                    <div className="space-y-2">
                      {translatedContent.paragraphs.slice(0, 5).map((para, idx) => (
                        <p key={idx} className="text-sm text-foreground bg-accent/10 p-2 rounded">
                          {para.substring(0, 200)}
                          {para.length > 200 && '...'}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
