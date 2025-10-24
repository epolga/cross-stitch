import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The History',
  description: 'The History of Embroidery. How cross stitch evolved over time.',
};

export default function EmbroideryHistory() {
  const s3BucketUrl = 'https://cross-stitch-designs.s3.us-east-1.amazonaws.com';

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 lg:p-10">
      <div className="prose max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">The History of Embroidery</h1>
        <p>
          Embroidery, that is the embellishment of cloth with design made by needle and thread, is an art that stretches back to hoary antiquity.
        </p>
        <p>
          The word &apos;embroidery&apos; is a Middle English word derived from the old French &apos;broder&apos; meaning edge or border.
        </p>
        <p>
          Have you ever wondered when embroidery was born?
        </p>
        <p>
          1000 years ago? 2000 years ago? Don&apos;t believe anyone who tells you: &quot;I know!&quot;
        </p>
        <p>
          Historical roots of the origin of embroidery go deep into the depths of centuries.
          Embroidery is a very gentle thing. It isn&apos;t long-lived. Even in museums special conditions are
          required to preserve it from damage.
        </p>
        <p>
          The first embroidered piece of cloth had no chance to survive for a long time.
        </p>
        <p>
          The appearance of embroidery is closely linked with the appearance of the first stitch in the manufacture of clothing
          (at least 300 centuries ago). The first embroidery supplies could be veins of animals and
          natural hair.
          It is clear that no evidence remains from that period.
        </p>
        <p>
          Egyptian mummies were wrapped in garments embroidered in gold and robes of kings and noblemen were embellished with embroidered designs as were the trappings of their chariots. The design was made with threads of linen and wool, the hair of goats and camel and exceedingly fine strips of gold and silver.
        </p>
        <p>
          <a href="http://www.gutenberg.org/files/17328/17328-h/v8c.htm" target="_blank" rel="noopener noreferrer">Such</a> work has been found on mummy wrappings:
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
          According to the Bible, Moses covered the <a href="http://www.phoenixmasonry.org/historypage.htm" target="_blank" rel="noopener noreferrer">Holly of Hollies</a> with a veil of fine linen embroidered with cherubim of blue, purple and scarlet. The temple built by Solomon in Jerusalem was adorned with an embroidered curtain.
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
          Long before the advent of the Christian era Babylon, Persia and Sidon had achieved great perfection in the art of embroidery.
        </p>
        <p>
          Alexander was dazzled by the specimens of Persian embroidery brought to his notice.
          China and India also had developed the art from early times.
        </p>
        <p>
          The sculptures of <a href="https://www.britannica.com/art/Bharhut-sculpture" target="_blank" rel="noopener noreferrer">Bharhut</a> and <a href="https://www.britannica.com/art/Sanchi-sculpture" target="_blank" rel="noopener noreferrer">Sanchi</a>, dating from the 2nd and 1st centuries B.C., show figures wearing embroidered veils and headbands.
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
       
        <p>
          Where can information about embroidery in later years be found?
          Here we can use written and painted sources.
        </p>
        <p>
          For example, <a href="http://en.wikipedia.org/wiki/Liu_Xiang_(scholar)" target="_blank" rel="noopener noreferrer">Liu Xiang</a>
          (a famous Confucian scholar 79-8 BCE) in his
          <a href="http://www.chinaknowledge.de/Literature/Diverse/shuoyuan.html" target="_blank" rel="noopener noreferrer">Shuoyuan</a>
          (&quot;Garden of Stories&quot;)
          wrote that silk embroidery already had been used in the
          <a href="https://en.wikipedia.org/wiki/Wu_(state)" target="_blank" rel="noopener noreferrer">country of Wu</a>. It means that <a href="http://en.wikipedia.org/wiki/Liu_Xiang_(scholar)" target="_blank" rel="noopener noreferrer">Liu Xiang</a>
          already knew about silk embroidery and even more – the silk embroidery wasn&apos;t something new at his time! (If Liu Xiang would not know about embroidery - how could he write about it?)
          So we can conclude that the silk embroidery is at least 2000 years old.
        </p>
        <p>
          The Middle Ages (476AD – 1492 AD), sometimes called Medieval times, left us much more samples of embroidery.
        </p>
        <p>
          About European Medieval embroidery we can learn a lot from the painted pictures.
        </p>
        <p>
          For example: icon with <a href="http://en.wikipedia.org/wiki/Boris_and_Gleb" target="_blank" rel="noopener noreferrer">Saints Boris and Gleb</a>,
          Moscow, mid-14th century:
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
          (<a href="http://en.wikipedia.org/wiki/State_Russian_Museum" target="_blank" rel="noopener noreferrer">State Russian Museum</a>, Saint Petersburg)
          Here you can clearly realize the details of the embroidered cloth.
        </p>
        <p>
          Another well-known example of embroidered cloth is the
          <a href="http://en.wikipedia.org/wiki/Bayeux_Tapestry" target="_blank" rel="noopener noreferrer">Bayeux Tapestry</a> (1066),
          which explains the events leading up to the 1066
          as well as the events of the conquest itself.
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
          Portion of the tapestry:
          <a href="http://c7.alamy.com/comp/B10RJH/bayeux-tapestry-harold-struck-by-arrow-to-the-eye-france-norman-the-B10RJH.jpg" target="_blank" rel="noopener noreferrer"> Harold is struck in the eye by an arrow and dies</a>.
        </p>
        <p>
          Just take a look at the pictures of famous European painters - you will find a lot of beautiful embroidery designs - ladies dresses, kings&apos; garments, clothing of knights and of peasants ...
          Middle Ages clothing and fashion like everything else were dictated by the Pyramid of Power which was the Middle Ages Feudal System.
        </p>
        <p>
          There are some surviving pieces of medieval eastern embroidery
        </p>
        <p>
          Here are some photos:
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
          <a href="http://www.metmuseum.org/toah/hd/tira/hd_tira.htm" target="_blank" rel="noopener noreferrer">Egyptian Tiraz inscription</a>,
          10th century; Silk embroidery on linen.
        </p>
        <p>
          <a href="http://www.lacma.org/" target="_blank" rel="noopener noreferrer">Los Angeles County Museum of Art</a>, M.73.5.635
        </p>
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/ee-red-flower.gif`}
            alt="Red Flower"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        <p>
          <a href="http://eternalegypt.org/EternalEgyptWebsiteWeb/HomeServlet?ee_website_action_key=action.display.element&story_id=&module_id=&language_id=1&element_id=40755&ee_messages=0001.flashrequired.text" target="_blank" rel="noopener noreferrer">Silk Textile with Six-Petaled Flower</a>
        </p>
        <p>
          <a href="http://en.wikipedia.org/wiki/Bahri_dynasty" target="_blank" rel="noopener noreferrer">Bahri Mamluk</a> period, 13th century
          Red and blue silk embroidery on white silk.
        </p>
        <p>
          <a href="http://en.wikipedia.org/wiki/Museum_of_Islamic_Art,_Cairo" target="_blank" rel="noopener noreferrer">Museum of Islamic Art</a>
        </p>
        <p>
          You can easily recognize that the latter two embroidery pieces were made by Muslim artists.
        </p>
        <p>
          By the way: one popular assumption is that Islamic culture does not tolerate figural imagery.
          This ban can certainly be seen at work in religious contexts. No human or animal figure appears in mosque
          decoration. On the other hand, figural images were common in secular contexts, especially in works of art
          made for the courts of Islamic rulers. Ivory caskets from the courts of Muslim Spain, for example, are
          sometimes carved with images of courtiers and musicians surrounded by birds and animals in a garden setting,
          and many literary manuscripts contain figural illustrations.
        </p>
        <p>
          Many of the surviving Persian textiles contain human figures:
        </p>
        <div className="w-full max-w-[600px] mx-auto my-6 rounded-lg shadow-md overflow-hidden border border-gray-300">
          <Image
            src={`${s3BucketUrl}/images/articles/persian_cloud_collar_early_15thc_detail.png`}
            alt="persian cloud collar"
            width={600}
            height={400}
            unoptimized
            className="w-full h-auto object-contain"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
        <p>
          Detail of <a href="http://medieval.webcon.net.au/loc_middle_east_persian.html" target="_blank" rel="noopener noreferrer"> Persian Cloud Collar, early 15th Century</a>
        </p>
        <p>
          The art of embroidery continues to develop in our days.
        </p>
      </div>
    </div>
  );
}