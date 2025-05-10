import Head from 'next/head';
import { DesignList } from '@/app/components/DesignList';
import type { DesignsResponse } from '@/app/types/design';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const pageSize = parseInt(resolvedSearchParams.pageSize as string || '10');
  const page = parseInt(resolvedSearchParams.nPage as string || '1');

  let designsResponse: DesignsResponse;
  try {
    const response = await fetch(
      `http://localhost:3000/api/designs?pageSize=${pageSize}&nPage=${page}`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch designs: ${response.statusText}`);
    }
    designsResponse = await response.json();
  } catch (error) {
    console.error('Error fetching designs:', error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Ann Logan Cross-Stitch Designs</h1>
        <p className="text-red-500">
          Error loading designs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const { designs, entryCount, page: currentPage, totalPages } = designsResponse;

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Ann Logan Cross-Stitch Designs</title>
        <meta name="description" content="Explore 6,000 cross-stitch designs with downloadable PDFs" />
        <meta name="keywords" content="cross stitch, designs, patterns, PDFs" />
        <meta property="og:title" content="Ann Logan Cross-Stitch Designs" />
        <meta property="og:description" content="Explore 6,000 cross-stitch designs with downloadable PDFs" />
        <meta property="og:image" content={designs[0]?.ImageUrl || 'https://d2o1uvvg91z7o4.cloudfront.net/images/default.jpg'} />
      </Head>
      <h1 className="text-3xl font-bold mb-6 text-center">Ann Logan Cross-Stitch Designs</h1>
      <h2 className="text-2xl mb-4 text-center">for downloading online ({entryCount} designs)</h2>
      <DesignList
        designs={designs}
        page={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        caption=""
      />
      <div className="mt-8 text-gray-700 w-full mx-auto">
        <p className="mb-4">Hello, I’m Ann, and I’m thrilled to welcome you! For many years, I’ve been crafting counted cross-stitch patterns for myself and others, and now I’m excited to share them with you. I’m confident you’ll enjoy them as much as my other friends do. Each pattern, design, and chart is carefully created to simplify your stitching experience.</p>
        <p className="mb-4"><strong>What is counted cross-stitch?</strong> It’s one of the world’s most beloved hobbies, where small crosses form beautiful, memorable designs. Easy to learn and do, this craft—sometimes called “counting cross-stitch”—involves carefully counting spaces to place stitches accurately. Whether you’re a beginner or a pro, cross-stitch is accessible and rewarding.</p>
        <p className="mb-4">I adore cross-stitching myself; it’s like meditation. Stitch by stitch, it’s incredibly calming. The possibilities are endless—you can decorate your home, gift your creations, or simply enjoy the process for yourself.</p>
        <p className="mb-4"><strong>Getting started is simple.</strong> All you need are basic supplies: a needle, thread, fabric, a hoop, and scissors. I recommend <strong>Aida fabric</strong>, the most popular choice for counted cross-stitch. Its woven threads create small holes for easy stitching, and it’s low-maintenance. Available in various colors, Aida serves as the backdrop for your finished project. Other options like linen exist, but Aida is the easiest to use.</p>
        <p className="mb-4">Choosing the right <strong>fabric count</strong> is key—it affects your project’s size and appearance. Match your needle size to the fabric count for best results; I always keep a pack of needles handy. For threads, I prefer <strong>DMC floss</strong> for its wide color range. Patterns include specific color lists, and I recommend following them closely to achieve the intended design. Subtle color variations add depth, even if they’re hard to notice at first.</p>
        <p className="mb-4">A <strong>hoop</strong> keeps your fabric taut, making stitching easier, though some prefer working without one. Small, sharp <strong>scissors</strong> are essential for clean cuts. Start with a simple design, and you’ll soon be creating intricate masterpieces.</p>
        <p className="mb-4"><strong>Why cross-stitch?</strong> Completing a project brings a thrilling sense of accomplishment. It’s a natural joy, a moment of pride. My Galleries feature hundreds of cross-stitch designs, with <strong>new ones added regularly</strong>. Explore them in my albums on this page to find the perfect pattern.</p>
        <p className="mb-4"><strong>Join my Newsletter</strong> to receive new designs every few days, delivered straight to your inbox. You can also use the <strong>search box</strong> to find patterns by entering terms like “cats, birds, dogs” (comma-separated).</p>
        <p className="mb-4 font-semibold">Happy stitching! I can’t wait for you to discover the joy of cross-stitch with my patterns.</p>
      </div>
    </div>
  );
}