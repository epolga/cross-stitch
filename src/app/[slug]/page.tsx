import { notFound } from 'next/navigation';
import DesignPage from '../designs/[designId]/page'; // Adjust path if needed
import AlbumDesignsPage from '../albums/[albumId]/page'; // Adjust path if needed
import AlbumsPage from '../albums/page'; // Adjust path if needed
import { getAlbumIdByCaption, getDesignIdByAlbumAndPage } from '@/lib/DataAccess'; // Adjust path if needed

// Helper to parse slug (e.g., 'lion-37-114-Free-Design.aspx')
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
// Helper to parse album caption from slug (e.g., 'nature-45-Charts.aspx')
async function getAlbumCaptionFromSlug(slug: string): Promise<string | null> {
 const parts = slug.split('-');
 if (parts.length < 3 || parts[0] !== 'Free' || parts[parts.length - 1] !== 'Charts.aspx') {
    return null;
  }
  const albumCaption = parts.slice(1, parts.length - 1).join(' ');
  return albumCaption;
}

// Function to map parsed slug to designID using albumID and nPage
async function getDesignIdFromSlug(slug: string): Promise<string | null> {
  const parsed = parseSlugForDesign(slug);
  if (!parsed) {
    return null;
  }

  const designId = await getDesignIdByAlbumAndPage(parsed.albumId, parsed.nPage);
  return designId !== null ? designId.toString() : null;
}

async function GetDesignPageFromSlug(slug: string) {
  const designId = await getDesignIdFromSlug(slug);

    if (!designId) {
      notFound();
    }

    // Render the imported DesignPage component, passing simulated params

    return <DesignPage params={Promise.resolve({ designId: designId })} />;
 }

 async function GetAlbumsPageFromSlug() {
    return <AlbumsPage />;
 }

 async function GetAlbumDesignsPageFromSlug(slug: string, searchParams: Record<string, string | string[] | undefined>) {
  const albumCaption = await getAlbumCaptionFromSlug(slug);

      if (!albumCaption) {
        notFound();
      }

      const albumId = await getAlbumIdByCaption(albumCaption);
      console.log("albumId received:", albumId);

      if (albumId === null) {
        notFound();
      }

      // Render the imported AlbumDesignsPage component, passing simulated params
      return <AlbumDesignsPage params={Promise.resolve({ albumId: albumId.toString() })} searchParams={Promise.resolve(searchParams)} />;
 }

export default async function SlugPage({ params, searchParams }: { 
  params: Promise<{ slug: string }>; 
  searchParams: Promise<Record<string, string | string[] | undefined>>; 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  if(resolvedParams.slug.endsWith('-Free-Design.aspx')) {
    return GetDesignPageFromSlug(resolvedParams.slug);
    } else if(resolvedParams.slug === 'XStitch-Charts.aspx'){
    return GetAlbumsPageFromSlug();
}     else if (resolvedParams.slug.endsWith('-Charts.aspx')) {
    return GetAlbumDesignsPageFromSlug(resolvedParams.slug, resolvedSearchParams);
  } else {
    notFound();
  }
}