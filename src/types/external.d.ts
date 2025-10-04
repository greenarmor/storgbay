declare module "html-docx-js/dist/html-docx" {
  interface HtmlDocx {
    asBlob(html: string): Blob;
  }
  const htmlDocx: HtmlDocx;
  export default htmlDocx;
}

declare module "mammoth/mammoth.browser" {
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
  const mammoth: { convertToHtml: typeof convertToHtml };
  export default mammoth;
}

declare module "file-saver" {
  export function saveAs(data: Blob | File | string, filename?: string, options?: unknown): void;
}
