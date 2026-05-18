export interface JourneyStory {
  city: string;
  country: string;
  title: string;
  story: string;
}

export const journeyStories: Record<string, JourneyStory> = {
  jiaozhou: {
    city: 'Jiaozhou',
    country: 'Shandong, China',
    title: 'Where this wonderfully absurd life began',
    story: `<a href="https://baike.baidu.com/en/item/Jiaozhou%20City/997960" target="_blank" rel="noopener">Jiaozhou</a> is my real hometown, a place famously known for not being known... Which is why, if someone asks me where I'm from, I always say Qingdao. (Technically, Jiaozhou is part of Qingdao. So it's not entirely a lie.)\n\nOne day in the last century, a person who was bad at English and absolutely terrible at math, even through high school, yet somehow ended up working as a Data Scientist in the USA was born.\n\n<strong>That's me.</strong>\n\n<img src="/images/journey/jiaozhou-baby.webp" alt="Baby Kun with mom in Jiaozhou" class="story-photo" />`,
  },
  shouguang: {
    city: 'Shouguang',
    country: 'Shandong, China',
    title: 'Every Step Counts',
    story: `My college was called "Weifang University of Science and Technology." Still, it is actually located in <a href="https://baike.baidu.com/en/item/Shouguang%20City/1001909" target="_blank" rel="noopener">Shouguang</a>, a small city I'd probably never have heard of if I hadn't gone to school there, as unknown to most people as Jiaozhou.\n\nHowever, it holds a lot of my firsts: first time taking a train alone, first time being so far from home (a two-hour drive, which honestly doesn't seem that far now... it takes similar time to drive from Berkeley to SFO in the morning, due to traffic), first time being away from home for four years, first time living like a "real adult," and the first time I dared to tell my family I was dating someone...`,
  },
  qingdao: {
    city: 'Qingdao',
    country: 'Shandong, China',
    title: 'Qingdao & Tsingtao',
    story: `"I'm from a seaside city known for beer and tourism, but I don't drink, don't like seafood, and don't know how to swim" is one of my classic ice breakers.\n\nThe most famous thing about <a href="https://baike.baidu.com/en/item/Qingdao%20City/985933" target="_blank" rel="noopener">Qingdao</a> is probably Tsingtao Beer, the green bottle that you can find at 99 Ranch and most Asian supermarkets.`,
  },
  madison: {
    city: 'Madison',
    country: 'Wisconsin, USA',
    title: 'Between the lakes',
    story: `Placeholder story about Madison. A city cradled between two lakes, full of ideas and energy.`,
  },
  fairfield: {
    city: 'Fairfield',
    country: 'California, USA',
    title: 'Freedom and Hope',
    story: `Placeholder story about Fairfield. Where the Central Valley meets the coastal hills.`,
  },
  berkeley: {
    city: 'Berkeley',
    country: 'California, USA',
    title: 'Stories here are still unfolding...',
    story: `Come with me to <a href="https://maps.app.goo.gl/AJMEjizHQyYtX2Kw5" target="_blank" rel="noopener"><u>Grizzly Peak</u></a> -- the Bay Area lights up beautifully at night.\n\n<img class="story-photo" src="/images/journey/berkeley-grizzly-peak.webp" alt="Bay Area night view from Grizzly Peak" />`,
  },
};
