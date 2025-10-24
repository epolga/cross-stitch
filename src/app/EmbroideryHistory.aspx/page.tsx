import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The History of Embroidery and Cross-Stitch',
  description: 'Explore the rich history of embroidery and the evolution of cross-stitch over time.',
};

export default function EmbroideryHistory() {
  const s3BucketUrl = 'https://cross-stitch-designs.s3.us-east-1.amazonaws.com';

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 lg:p-10">
      <div className="prose max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">The History of Embroidery and Cross-Stitch</h1>
        
        <p>
          Embroidery, the art of embellishing cloth with designs created using needle and thread, has roots that extend back to ancient times. This timeless craft has evolved over millennia, influencing cultures worldwide and giving rise to specific techniques like cross-stitch.
        </p>
        
        <p>
          The term &apos;embroidery&apos; originates from Middle English, derived from the Old French word &apos;broder,&apos; meaning edge or border. It encompasses a wide range of stitches and styles, with cross-stitch being one of the most recognizable forms due to its simple X-shaped stitches.
        </p>
        
        <p>
          Have you ever wondered about the origins of embroidery?
        </p>
        
        <p>
          Was it 1,000 years ago? 2,000 years ago? Beware of anyone claiming definitive knowledge, as the precise beginnings are shrouded in history.
        </p>
        
        <p>
          The historical origins of embroidery delve deep into the centuries. As a delicate craft, embroidered pieces are not long-lasting; even in museums, they require special conditions to prevent deterioration.
        </p>
        
        <p>
          The earliest embroidered fabrics had little chance of surviving through the ages.
        </p>
        
        <p>
          Embroidery&apos;s emergence is closely tied to the invention of the first stitch in clothing production, dating back at least 30,000 years. Early supplies might have included animal veins and natural fibers like hair. Naturally, no direct evidence from that era remains, but archaeological finds, such as fossilized hand-stitched garments from around 30,000 B.C., support this timeline.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Ancient Embroidery in Civilizations</h2>
        
        <p>
          In ancient Egypt, mummies were often wrapped in garments embroidered with gold thread, and the robes of kings and nobles featured intricate designs, as did the trappings of their chariots. These designs utilized threads of linen and wool, goat and camel hair, and fine strips of gold and silver.
        </p>
        
        <p>
          Such exquisite work has been discovered on mummy wrappings:
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/ann.png`}
            alt="mummy wrappings"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          According to the Bible, Moses adorned the Holy of Holies with a veil of fine linen embroidered with cherubim in blue, purple, and scarlet. Similarly, the temple built by Solomon in Jerusalem featured an embroidered curtain.
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/KSTtheMostHolyPlace.png`}
            alt="Holy of Holies"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          Long before the Christian era, civilizations like Babylon, Persia, and Sidon had perfected embroidery. Alexander the Great was reportedly dazzled by Persian embroidered specimens. Meanwhile, China and India developed the art early on, with evidence from the Han Dynasty (206 BCE – 220 CE) showing intricate silk embroideries.
        </p>
        
        <p>
          Sculptures from Bharhut and Sanchi, dating to the 2nd and 1st centuries B.C., depict figures adorned with embroidered veils and headbands.
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/Bharhut01.png`}
            alt="Bharhut Stupa"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Historical Records and Sources</h2>
        
        <p>
          For later periods, information on embroidery comes from written and artistic sources.
        </p>
        
        <p>
          For instance, Liu Xiang, a renowned Confucian scholar (79-8 BCE), mentioned in his work Shuoyuan (&quot;Garden of Stories&quot;) that silk embroidery was already in use in the state of Wu. This indicates that silk embroidery was well-established by his time, suggesting it is at least 2,000 years old.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Medieval Embroidery</h2>
        
        <p>
          The Middle Ages (476 AD – 1492 AD), also known as the Medieval period, have bequeathed us numerous embroidery samples. Professional embroiderers&apos; guilds existed in Europe from at least the Middle Ages, producing high-quality work.
        </p>
        
        <p>
          Much can be learned about European Medieval embroidery from painted artworks.
        </p>
        
        <p>
          An example is the icon depicting Saints Boris and Gleb from Moscow, mid-14th century:
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/byzant2.png`}
            alt="Saints Boris and Gleb"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          (State Russian Museum, Saint Petersburg) This piece vividly illustrates the intricate details of embroidered fabrics.
        </p>
        
        <p>
          Another famous example is the Bayeux Tapestry (circa 1066), which narrates the events leading to the Norman Conquest of England, including the Battle of Hastings.
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/BayeuxTapestry.png`}
            alt="Bayeux Tapestry"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          A notable portion of the tapestry shows Harold struck in the eye by an arrow.
        </p>
        
        <p>
          Examining works by renowned European painters reveals abundant embroidery designs in ladies&apos; dresses, kings&apos; garments, knights&apos; attire, and even peasants&apos; clothing. During the Middle Ages, fashion, like society, was influenced by the feudal system&apos;s hierarchy.
        </p>
        
        <p>
          Surviving pieces of medieval Eastern embroidery also exist.
        </p>
        
        <p>
          Here are some examples:
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/M73_5_635.png`}
            alt="Egyptian Tiraz inscription"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          Egyptian Tiraz inscription, 10th century; silk embroidery on linen (Los Angeles County Museum of Art, M.73.5.635).
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/ee-red-flower.gif`}
            alt="Silk Textile with Six-Petaled Flower"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          Silk Textile with Six-Petaled Flower, Bahri Mamluk period, 13th century; red and blue silk embroidery on white silk (Museum of Islamic Art, Cairo).
        </p>
        
        <p>
          These pieces are clearly the work of Muslim artists.
        </p>
        
        <p>
          A common misconception is that Islamic culture prohibits figural imagery entirely. While this holds in religious contexts—such as mosque decorations—figural images were prevalent in secular art, particularly at Islamic courts. For example, ivory caskets from Muslim Spain feature carved scenes of courtiers, musicians, birds, and animals.
        </p>
        
        <p>
          Many surviving Persian textiles include human figures:
        </p>
        
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/persian_cloud_collar_early_15thc_detail.png`}
            alt="Persian Cloud Collar"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        
        <p>
          Detail of a Persian Cloud Collar, early 15th century.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">The Evolution of Cross-Stitch</h2>
        
        <p>
          Cross-stitch, a specific form of embroidery using X-shaped stitches to form patterns, has its own fascinating evolution. Its roots trace back to around 500 AD in Egypt, with preserved linens from tombs showing early examples. It flourished during China&apos;s Tang Dynasty (618-906 AD), likely spreading westward via trade routes like the Silk Road.
        </p>
        
        <p>
          In Europe, cross-stitch gained prominence in the Middle Ages and Renaissance, often associated with upper-class women as a symbol of leisure and skill. The first printed cross-stitch patterns appeared in the late 1500s, following the invention of the printing press, which democratized the craft.
        </p>
        
        <p>
          By the Anglo-Saxon period in the UK (around the 7th century), intricate examples emerged, and samplers—practice pieces showcasing various stitches—became common from the 1400s onward, with collections like those at the Victoria and Albert Museum holding over 700 examples up to the 20th century.
        </p>
        
        <p>
          In the modern era, cross-stitch transformed into a popular hobby in the 1960s, with easier pattern production. The 21st century saw innovations like subversive cross-stitch, pioneered by Julie Jackson in 2003, blending traditional techniques with contemporary, often humorous or edgy themes.
        </p>
        
        <p>
          The art of embroidery, including cross-stitch, continues to thrive and evolve in contemporary times, blending ancient traditions with modern creativity.
        </p>
      </div>
    </div>
  );
}