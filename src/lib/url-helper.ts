// src/lib/UrlHelper.ts

import { Design } from "@/app/types/design";
import { getAlbumCaption } from "./data-access";

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
export async function CreateAlbumUrl(
  AlbumId: number
): Promise<string> {
  const albumCaption: string | undefined = await getAlbumCaption(AlbumId); // Fetch album caption based on AlbumId
  const formattedCaption = albumCaption?.replace(/\s+/g, '-');
  return `/Free-${formattedCaption}-Charts.aspx`;
}
    