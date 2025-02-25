import Dexie, { Table } from "dexie";
import { IDocument, DocumentType, DocumentTypeMap } from "./types";
import { configure, BFSRequire } from "browserfs";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import * as pdfjs from "pdfjs-dist";
import { DocumentLoader } from "@langchain/core/document_loaders/base";
import { Buffer } from 'buffer';
import mime from "mime";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();


export class DocumentManager extends Dexie {
  private static instance: DocumentManager;
  fs!: typeof import("fs");
  documents!: Table<IDocument>;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  public static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager();
    }
    return DocumentManager.instance;
  }

  private constructor() {
    super("documents");
    this.version(1).stores({
      documents: "id, name, path, type, createdAt",
    });
    this.initPromise = this.initialize();
  }
  
  private async initialize() {
    if (this.initialized) return;
    
    await new Promise<void>((resolve) => {
      configure({ 
        fs: "IndexedDB",
        options: {} 
      }, () => {
        this.fs = BFSRequire("fs") as unknown as typeof import("fs");
        resolve();
      });
    });
    
    this.initialized = true;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  getDocumentType(mimeType: string): DocumentType {
    const [type, subtype] = mimeType.split("/");

    // Handle common MIME types
    if (type === 'image') return 'image';
    if (type === 'video') return 'video';
    if (type === 'audio') return 'audio';
    
    // Handle specific document types
    const mimeToExtension: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/markdown': 'markdown'
    };

    const extension = mimeToExtension[mimeType] || subtype;

    for (const [docType, extensions] of Object.entries(DocumentTypeMap)) {
      if ((extensions as readonly string[]).includes(extension)) {
        return docType as DocumentType;
      }
    }

    return "txt";
  }

  async uploadDocument(file: File) {
    await this.ensureInitialized();
    
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.${file.type.split("/")[1]}`;
    const filePath = `documents/${fileName}`;
    const buffer = await file.arrayBuffer();
    
    // Ensure the documents directory exists
    await new Promise<void>((resolve, reject) => {
      this.fs.mkdir('documents', { recursive: true }, (err) => {
        if (err && err.code !== 'EEXIST') {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.fs.writeFile(filePath, Buffer.from(buffer), (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    const newDoc: IDocument = {
      id: fileId,
      name: file.name,
      path: filePath,
      type: this.getDocumentType(file.type),
      createdAt: Date.now(),
    }
    await this.documents.add(newDoc);
    return newDoc;
  }

  async uploadUrl(url: string) {
    await this.ensureInitialized();
    
    const fileId = crypto.randomUUID();
    const createdAt = Date.now();
    let newDoc: IDocument;
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      newDoc = {
        id: fileId,
        name: url,
        path: url,
        type: "youtube",
        createdAt,
      };
    } else {
      newDoc = {
        id: fileId,
        name: url,
        path: url,
        type: "url",
        createdAt,
      };
    }
    await this.documents.add(newDoc);
    return newDoc;
  }

  async getDocument(id: string) {
    await this.ensureInitialized();
    
    const file = await this.documents.get(id);
    if (!file) {
      throw new Error("Document not found");
    }
    const filePath = file.path;
    const data = await new Promise<Buffer>((resolve, reject) => {
      this.fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    const mimeType = mime.getType(file.name) || file.type;
    return new File([data], file.name, { type: mimeType });
  }

  async loadDocument(id: string) {
    await this.ensureInitialized();
    
    const file = await this.documents.get(id);
    if (!file) {
      throw new Error("Document not found");
    }
    const type = file.type;
    let loader: DocumentLoader;
    switch (type) {
      case "pdf":
        loader = new WebPDFLoader(await this.getDocument(id), {
          splitPages: false,
          pdfjs: () => Promise.resolve(pdfjs),
        });
        break;
      case "youtube":
        loader = YoutubeLoader.createFromUrl(
          file.path,
          {
            language: "en",
            addVideoInfo: true,
          }
        );
        break;
      case "docx":
        loader = new DocxLoader(await this.getDocument(id));
        break;
      case "doc":
        loader = new DocxLoader(await this.getDocument(id), { type: "doc" });
        break;
      case "txt":
        loader = new TextLoader(await this.getDocument(id));
        break;
      default:
        loader = new TextLoader(await this.getDocument(id));
    }
    const docs = await loader.load();
    // add metadata to each doc
    docs.forEach(doc => {
      doc.metadata = {
        id: file.id,
        name: file.name,
        source: file.path,
        type: file.type,
        createdAt: file.createdAt,
      };
    });
    return docs;
  }
}
