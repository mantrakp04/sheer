export const codeLanguages = {
  cpp: ["cpp"],
  go: ["go"],
  java: ["java"],
  js: ["js", "jsx", "ts", "tsx"],
  php: ["php"],
  proto: ["proto"],
  python: ["py", "ipynb"],
  rst: ["rst"],
  ruby: ["rb"],
  rust: ["rs"],
  scala: ["scala"],
  swift: ["swift"],
  markdown: ["md", "mdx"],
  latex: ["tex"],
  html: ["html"],
  sol: ["sol"]
} as const;

export type CodeLanguages = keyof typeof codeLanguages;

export const DocumentTypeMap = {
  // Document types
  pdf: ["pdf"],
  docx: ["docx"],
  doc: ["doc"],
  txt: ["txt"],
  url: ["url"],
  image: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "ico", "webp"],
  video: ["mp4", "mov", "avi", "wmv", "flv", "mpeg", "mpg", "m4v", "webm"],
  audio: ["mp3", "wav", "ogg", "m4a", "wma", "aac", "flac", "m4b", "m4p"],
  youtube: ["youtube"],

  // Code languages
  ...codeLanguages,
} as const;

export type DocumentType = keyof typeof DocumentTypeMap;

export interface IDocument {
  id: string;
  name: string;
  path: string;
  type: DocumentType;
  createdAt: number;
}
