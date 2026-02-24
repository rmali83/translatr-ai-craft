/**
 * HTML Parser for Website Translation
 * Extracts translatable text while preserving structure
 */

export interface TextSegment {
  id: string;
  text: string;
  context: string;
  xpath: string;
  nodeType: 'text' | 'attribute';
  attributeName?: string;
}

const IGNORED_TAGS = ['script', 'style', 'noscript', 'iframe', 'svg'];
const TRANSLATABLE_ATTRIBUTES = ['alt', 'title', 'placeholder', 'aria-label'];

/**
 * Parse HTML and extract translatable segments
 */
export function parseHTML(htmlString: string): { segments: TextSegment[]; structure: any } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const segments: TextSegment[] = [];
  let segmentId = 0;

  function getXPath(element: Node): string {
    if (element.nodeType === Node.DOCUMENT_NODE) return '/';
    
    const parent = element.parentNode;
    if (!parent) return '';
    
    const siblings = Array.from(parent.childNodes).filter(
      n => n.nodeName === element.nodeName
    );
    
    const index = siblings.indexOf(element as ChildNode) + 1;
    const parentPath = getXPath(parent);
    
    return `${parentPath}/${element.nodeName.toLowerCase()}[${index}]`;
  }

  function extractText(node: Node, context: string = '') {
    // Skip ignored tags
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (IGNORED_TAGS.includes(element.tagName.toLowerCase())) {
        return;
      }

      // Extract translatable attributes
      TRANSLATABLE_ATTRIBUTES.forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && value.trim().length > 0) {
          segments.push({
            id: `seg_${segmentId++}`,
            text: value.trim(),
            context: `${element.tagName.toLowerCase()}[${attr}]`,
            xpath: getXPath(element),
            nodeType: 'attribute',
            attributeName: attr,
          });
        }
      });
    }

    // Extract text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        segments.push({
          id: `seg_${segmentId++}`,
          text,
          context: context || 'text',
          xpath: getXPath(node.parentNode!),
          nodeType: 'text',
        });
      }
    }

    // Recursively process children
    node.childNodes.forEach(child => {
      const childContext = child.nodeType === Node.ELEMENT_NODE 
        ? (child as Element).tagName.toLowerCase()
        : context;
      extractText(child, childContext);
    });
  }

  extractText(doc.body, 'body');

  return {
    segments,
    structure: {
      doctype: doc.doctype ? new XMLSerializer().serializeToString(doc.doctype) : '',
      html: doc.documentElement.outerHTML,
    },
  };
}

/**
 * Rebuild HTML with translated segments
 */
export function rebuildHTML(
  originalHTML: string,
  segments: TextSegment[],
  translations: Map<string, string>
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHTML, 'text/html');

  segments.forEach(segment => {
    const translation = translations.get(segment.id);
    if (!translation) return;

    try {
      const result = doc.evaluate(
        segment.xpath,
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );

      const node = result.singleNodeValue;
      if (!node) return;

      if (segment.nodeType === 'attribute' && segment.attributeName) {
        (node as Element).setAttribute(segment.attributeName, translation);
      } else if (segment.nodeType === 'text') {
        // Find the specific text node
        const textNodes = Array.from(node.childNodes).filter(
          n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim() === segment.text
        );
        if (textNodes.length > 0) {
          textNodes[0].textContent = translation;
        }
      }
    } catch (error) {
      console.error('Error applying translation:', error);
    }
  });

  return doc.documentElement.outerHTML;
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}
