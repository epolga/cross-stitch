// src/types/design.ts
export interface Design {
    DesignID: number;
    AlbumID: number;
    Caption: string;
    Description: string;
    NDownloaded: number;
    Width: number;
    Height: number;
    Notes: string;
    Text: string;
    NPage: number;
    ImageUrl?: string | null;
    PdfUrl?: string | null;
}

export interface DesignsResponse {
    designs: Design[];
    entryCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}