import { DesignListWrapper } from '@/app/components/DesignListWrapper';
import SearchForm from '@/app/components/SearchForm';
import { fetchFilteredDesigns } from '@/lib/data-access';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import RegisterNewsletterLink from '@/app/components/RegisterNewsletterLink';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const nPage = parseInt(resolvedSearchParams?.nPage?.toString() || '1', 10);
  const pageSize = parseInt(resolvedSearchParams?.pageSize?.toString() || '20', 10);
  const searchText = resolvedSearchParams?.searchText?.toString() || '';

  const filters = {
    widthFrom: parseInt(resolvedSearchParams?.widthFrom?.toString() || '0', 10),
    widthTo: parseInt(resolvedSearchParams?.widthTo?.toString() || '10000', 10),
    heightFrom: parseInt(resolvedSearchParams?.heightFrom?.toString() || '0', 10),
    heightTo: parseInt(resolvedSearchParams?.heightTo?.toString() || '10000', 10),
    ncolorsFrom: parseInt(resolvedSearchParams?.ncolorsFrom?.toString() || '0', 10),
    ncolorsTo: parseInt(resolvedSearchParams?.ncolorsTo?.toString() || '10000', 10),
    nPage,
    pageSize,
    searchText,
  };

  let designs;
  try {
    ({ designs } = await fetchFilteredDesigns(filters));
  } catch (error) {
    console.error('Error fetching designs for metadata:', error);
    return {
      title: 'Cross Stitch Designs',
      description: 'Explore thousands of free cross-stitch designs with downloadable PDF patterns ready for instant download.',
    };
  }

  const ogImage = designs[0]?.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg';
  const canonicalUrl = 'https://cross-stitch-pattern.net/';
  const title = searchText ? `Search Results for "${searchText}" - Cross Stitch Designs` : 'Cross Stitch Designs';
  const description = searchText 
    ? `Search results for "${searchText}". Explore thousands of free cross-stitch PDF patterns with instant downloads.` 
    : 'Explore thousands of free cross-stitch PDF patterns with instant downloads.';

  return {
    title,
    description,
    keywords: 'cross stitch, free designs, free patterns, free PDF embroidery charts',
    alternates: {
      canonical: canonicalUrl,
    },
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      images: ogImage,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage,
    },
    other: {
      'application/ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Cross Stitch Pattern",
        "description": description,
        "url": canonicalUrl,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${canonicalUrl}?searchText={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }),
    },
  };
}

export default async function Home({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const nPage = parseInt(resolvedSearchParams?.nPage?.toString() || '1', 10);
  const pageSize = parseInt(resolvedSearchParams?.pageSize?.toString() || '20', 10);
  const searchText = resolvedSearchParams?.searchText?.toString() || '';

  const filters = {
    widthFrom: parseInt(resolvedSearchParams?.widthFrom?.toString() || '0', 10),
    widthTo: parseInt(resolvedSearchParams?.widthTo?.toString() || '10000', 10),
    heightFrom: parseInt(resolvedSearchParams?.heightFrom?.toString() || '0', 10),
    heightTo: parseInt(resolvedSearchParams?.heightTo?.toString() || '10000', 10),
    ncolorsFrom: parseInt(resolvedSearchParams?.ncolorsFrom?.toString() || '0', 10),
    ncolorsTo: parseInt(resolvedSearchParams?.ncolorsTo?.toString() || '10000', 10),
    nPage,
    pageSize,
    searchText,
  };

  let designs, totalPages;
  try {
    ({ designs, totalPages } = await fetchFilteredDesigns(filters));
  } catch (error) {
    console.error('Error fetching designs:', error);
    return (
      <div className="p-4">
        <p className="text-red-500">
          Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="hidden md:block md:w-48 w-full">
          <SearchForm />
        </div>
        <div className="w-full md:flex-1">
          <Suspense fallback={<div>Loading...</div>}>
            <DesignListWrapper
              designs={designs}
              page={nPage}
              totalPages={totalPages}
              pageSize={pageSize}
              baseUrl="/"
            />
          </Suspense>
          <div className="mt-8 prose max-w-none bg-white p-6 rounded-lg shadow-lg">
            <p>My name is Ann, and I am delighted to welcome you here!</p>

            <h2>Free Cross-Stitch PDF Patterns for Every Stitcher</h2>
            <p>
              For many years, I have been creating counted cross-stitch patterns for myself and others.
              Now, I am thrilled to share these free designs with you. I am confident you will enjoy them
              as much as my friends do. All my patterns, designs, and charts are meticulously crafted to
              simplify your stitching experience.
            </p>

            <h3>Why Counted Cross-Stitch Still Inspires Me</h3>
            <p>
              Counted cross-stitch is one of the world&apos;s most beloved hobbies. It is simple to learn and execute - 
              essentially embroidery using small crosses to form stunning, memorable designs. Often called &quot;counted cross-stitch,&quot;
              this craft requires precise counting of stitches on the fabric to ensure accurate placement. I personally adore cross-stitching
              and view it as a form of meditation; the rhythmic process - stitch by stitch - is incredibly soothing and calming.
            </p>

            <h3>Creative Possibilities</h3>
            <p>
              The possibilities are endless. You can adorn your home, gift your work to loved ones, or simply enjoy the process
              for personal fulfillment. My collection includes seasonal sets, floral themes, animals, landscapes, and beginner-friendly
              mini designs so you can always find the perfect project.
            </p>

            <h3>What You Need to Start Stitching</h3>
            <p>
              Getting started is straightforward. Unlike many crafts, cross-stitch requires minimal supplies: primarily a needle and thread.
              If you are new to cross-stitching, begin with a small, simple design and gradually advance to more complex projects.
            </p>
            <p>
              Online shops today offer an extensive range of fabrics and threads. I favor Aida fabric for its ease of use and maintenance.
              Woven with threads grouped into bundles, Aida features small holes that guide the needle effortlessly. Fabric count determines
              the size and overall look of your project, so ensure your needles match the fabric count.
            </p>
            <p>
              For threads, options abound, including Anchor and Madeira. I prefer DMC floss for its quality. Patterns typically specify colors,
              and I advise following them closely. Subtle shade variations add depth to the design, even if they are not immediately noticeable.
              Essential tools include embroidery hoops and scissors. Hoops keep the fabric taut and flat, easing the stitching process - though
              some stitchers prefer working without them.
            </p>

            <h3>Find Your Next Free Pattern</h3>
            <p>
              My galleries feature hundreds of free cross-stitch designs, with new ones added nearly every day. Newsletter subscribers receive
              fresh free designs every few days. Explore my albums from this page to find the perfect free chart, and use the search box to locate
              free patterns: enter comma-separated terms (e.g., cats, birds, dogs).
            </p>
            <RegisterNewsletterLink />

            <h3>Popular Free Pattern Topics</h3>
            <ul>
              <li>Seasonal cross-stitch PDFs such as Christmas and Halloween motifs</li>
              <li>Animal-themed embroidery charts featuring cats, birds, and woodland creatures</li>
              <li>Landscape scenes with detailed color blends and shading</li>
              <li>Beginner-friendly mini patterns that stitch quickly</li>
              <li>Large-format heirloom charts for experienced stitchers</li>
            </ul>

            <p>Happy stitching!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

