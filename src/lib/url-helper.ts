// src/lib/UrlHelper.ts

// Helper to create design URL based on Caption, AlbumId, and NPage
export function CreateDesignUrl(
  Caption: string, 
  AlbumId: number, 
  NPage: number
): string {
    const formattedCaption = Caption.replace(/\s+/g, '-');
    return `${formattedCaption}-${AlbumId}-${NPage-1}-Free-Design.aspx`;
}  

// Helper to create image URL based on Caption and DesignId
export function CreateImageUrl(
  Caption: string, 
  DesignId: number, 
): string {
    const formattedCaption = Caption.replace(/\s+/g, '-');
    return `/${formattedCaption}-${DesignId}-S-Free-Design.jpg`;
} 