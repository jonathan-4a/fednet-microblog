// src/apcore/ports/out/IWebFingerSerializer.ts

export interface WebFingerDocument {
  subject: string;
  links: Array<{
    rel: string;
    type: string;
    href: string;
  }>;
}

export interface IWebFingerSerializer {
  create(
    username: string,
    domain: string,
    protocol?: string,
    port?: string,
  ): WebFingerDocument;
}
