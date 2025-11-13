declare module 'html-to-text' {
  export interface HtmlToTextOptions {
    wordwrap?: number | false;
    selectors?: Array<{
      selector: string;
      format?: 'inline' | 'block' | 'skip';
      options?: Record<string, any>;
    }>;
    [key: string]: any;
  }

  export function convert(html: string, options?: HtmlToTextOptions): string;
}
