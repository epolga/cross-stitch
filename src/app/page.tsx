import { DesignListWrapper } from '@/app/components/DesignListWrapper';
import SearchForm from '@/app/components/SearchForm';
import { fetchFilteredDesigns } from '@/lib/data-access';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
        <div className="w-full md:w-48">
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
          <br/>
          My name is Ann, and I am delighted to welcome you here! <br/>
        <br/>
    For many years, I have been creating counted cross-stitch patterns for myself and others. Now, I am thrilled to share them with you. I am confident you will enjoy them as much as my friends do. All my patterns, designs, and charts are meticulously crafted to simplify your stitching experience.<br/>
<br/>
    

    So, what exactly are we discussing? Counted cross-stitch, of course! As you likely know, it is one of the world&apos;s most beloved hobbies. It is simple to learn and execute—essentially embroidery using small crosses to form stunning, memorable designs. Often called &quot;counted cross-stitch,&quot; this craft requires precise counting of stitches on the fabric to ensure accurate placement.

    <br/><br/>

    I personally adore cross-stitching; I view it as a form of meditation. The rhythmic process—stitch by stitch—is incredibly soothing and calming.

    <br/><br/>

    What can you create with it? The possibilities are endless. You can adorn your home, gift your work to loved ones, or simply enjoy the process for personal fulfillment.

    <br/><br/>

    Getting started is straightforward. Unlike many crafts, cross-stitch requires minimal supplies: primarily a needle and thread.

    

    If you are new to cross-stitching, begin with a small, simple design and gradually advance to more complex projects.
<br/><br/>
    

    Online shops today offer an extensive range of fabrics and threads. I favor Aida fabric for its ease of use and maintenance. Woven with threads grouped into bundles, Aida features small holes that guide the needle effortlessly. It is the most popular choice for counted cross-stitch, though evenweave and linen are alternatives. In my experience, Aida is the simplest option.

    <br/><br/>

    Aida comes in various colors, which serve as the background for your finished piece and significantly impact its appearance.

    

    Fabric count is also crucial—it determines the size and overall look of your project. Ensure your needles match the fabric count; I recommend purchasing a variety pack.

    <br/>

    For threads, options abound, including Anchor and Madeira. I prefer DMC floss for its quality. Patterns typically specify colors, and I advise following them closely. Subtle shade variations add depth to the design, even if they are not immediately noticeable.
<br/>
    

    Essential tools include embroidery hoops and scissors. Hoops keep the fabric taut and flat, easing the stitching process—though some stitchers prefer working without them.
<br/><br/>
    

    Completing a project brings immense satisfaction—a natural thrill from admiring your creation.

    <br/><br/>

    Happy stitching!

    <br/><br/>

    My galleries feature hundreds of cross-stitch designs, with new ones added nearly every day. Newsletter subscribers receive fresh designs every few days.

    <br/><br/>

    Explore my albums from this page to find the perfect chart.

    <br/><br/>  

    Use the search box to locate patterns: enter comma-separated terms (e.g., cats, birds, dogs).

    <br/><br/>

    Sign up for my newsletter to receive new designs as they are released.
    </div>
        </div>
      </div>
    </div>
  );
}