// src/lib/UrlHelper.ts

import { Design } from "@/app/types/design";

// Helper to create design URL based on Caption, AlbumId, and NPage
export function CreateDesignUrl(
 Design: Design
): string {
    const formattedCaption = Design.Caption.replace(/\s+/g, '-');
    return `${formattedCaption}-${Design.AlbumID}-${Design.NPage-1}-Free-Design.aspx`;
}  

// Helper to create image URL based on Caption and DesignId
export function CreateImageUrl(
  Caption: string, 
  DesignId: number, 
): string {
    const formattedCaption = Caption.replace(/\s+/g, '-');
    return `/${formattedCaption}-${DesignId}-S-Free-Design.jpg`;
} 

// Helper to create album URL based on AlbumId
export function CreateAlbumUrl(
  Caption:string)
  : string{
  const formattedCaption = Caption?.replace(/\s+/g, '-');
  return `Free-${formattedCaption}-Charts.aspx`;
}
    