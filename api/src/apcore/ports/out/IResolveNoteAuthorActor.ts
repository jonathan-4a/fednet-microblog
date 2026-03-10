// src/apcore/ports/out/IResolveNoteAuthorActor.ts

export interface IResolveNoteAuthorActor {
  resolve(noteId: string): Promise<string | null>;
}
