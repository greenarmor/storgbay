declare module "html-to-docx" {
  export interface HtmlToDocxOptions {
    title?: string;
    lang?: string;
    description?: string;
    creator?: string;
    keywords?: string[];
    [key: string]: unknown;
  }

  export default function htmlToDocx(
    html: string,
    header?: string | null,
    options?: HtmlToDocxOptions | null,
    footer?: string | null,
  ): Promise<Blob | ArrayBuffer | ArrayBufferView>;
}
