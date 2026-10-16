// pdf-parse's index.js runs a debug self-test when imported; we import the library file directly.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface TextItem { str: string }
  interface PageData { getTextContent(): Promise<{ items: TextItem[] }> }
  interface Result { numpages: number; text: string; info: Record<string, unknown> }
  function pdf(data: Buffer, options?: { pagerender?: (page: PageData) => Promise<string>; max?: number }): Promise<Result>;
  export default pdf;
}
