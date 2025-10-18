import { notFound } from 'next/navigation';
import DesignPage from '../designs/[designId]/page'; // Adjust path if needed
import AlbumDesignsPage from '../albums/[albumId]/page'; // Adjust path if needed
// Helper to parse slug (e.g., 'lion-37-114-Free-Design')
function parseSlugForDesign(slug: string): { caption: string; albumId: number; nPage: number } | null {
  const parts = slug.split('-');
  if (parts.length < 4 || parts[parts.length - 2] !== 'Free' || parts[parts.length - 1] !== 'Design.aspx') {
    return null;
  }
  const nPage = parseInt(parts[parts.length - 3], 10);
  const albumId = parseInt(parts[parts.length - 4], 10);
  const caption = parts.slice(0, parts.length - 4).join('-');
  if (isNaN(albumId) || isNaN(nPage)) {
    return null;
  }
  return { caption, albumId, nPage };
}

async function getAlbumIDFromSlug(slug: string): Promise<string | null> {
 const parts = slug.split('-');
 if (parts.length < 2 || parts[parts.length - 1] !== 'Charts.aspx') {
    return null;
  }
  const albumCaption = parts.slice(0, parts.length - 1).join('-');
  if(albumCaption.length === 0) {
  return '14'; // Default albumId for empty caption
  }
  return '14';
}




// Function to map parsed slug to designID (replace with actual logic, e.g., database query)
async function getDesignIdFromSlug(slug: string): Promise<string | null> {
  const parsed = parseSlugForDesign(slug);
  if (!parsed) {
    return null;
  }

  // Example mock lookup; implement with your data source
  const reverseMap: Record<string, string> = {
    '37-114': '123', // albumId-nPage -> designID
    '99-0': '456',
    // Expand as needed
  };

  const key = `${parsed.albumId}-${parsed.nPage}`;
  if(key === 'da') {
    return reverseMap[key] || null;
  }
    return '5351';
  //return reverseMap[key] || null;
}

async function GetDesignPageFromSlug(slug: string) {
  const designId = await getDesignIdFromSlug(slug);
  
    if (!designId) {
      notFound();
    }

    // Render the imported DesignPage component, passing simulated params
return <DesignPage params={Promise.resolve({ designId: designId })} />;
/*    return <DesignPage params={Promise.resolve({ designId: designId })} searchParams={Promise.resolve(searchParams)} />;*/
 }

 async function GetAlbumsPageFromSlug(slug: string, searchParams: Record<string, string | string[] | undefined>) {
  const albumId = await getAlbumIDFromSlug(slug);

      if (!albumId) {
        notFound();
      }

      // Render the imported AlbumDesignsPage component, passing simulated params

      return <AlbumDesignsPage params={Promise.resolve({ albumId: albumId })} searchParams={Promise.resolve(searchParams)} />;
 }

export default async function SlugPage({ params, searchParams }: { 
  params: Promise<{ slug: string }>; 
  searchParams: Promise<Record<string, string | string[] | undefined>>; 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  if(resolvedParams.slug.endsWith('-Free-Design.aspx')) {
    return GetDesignPageFromSlug(resolvedParams.slug);
  } else if (resolvedParams.slug.endsWith('-Charts.aspx')) {
    return GetAlbumsPageFromSlug(resolvedParams.slug, resolvedSearchParams);
  }
  else{
    notFound();
  }
  //return <DesignPage params={Promise.resolve({ designId: designId })} />;
}