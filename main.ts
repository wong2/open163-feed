import { Hono } from "https://deno.land/x/hono@v3.3.1/mod.ts";
import { Podcast } from "https://esm.sh/podcast@2.0.1";

async function fetchCourse(plid: string) {
  const resp = await fetch(`https://c.open.163.com/open/mob/movie/list.do?plid=${plid}`);
  const json = await resp.json();
  return json.data;
}

const app = new Hono();

app.get("/:plid", async (c) => {
  const plid = c.req.param("plid");
  const course = await fetchCourse(plid);

  const feed = new Podcast({
    title: course.title,
    description: course.description,
    siteUrl: course.pageUrl,
    imageUrl: course.imgPath,
    copyright: course.school,
    author: course.director,
  });

  const time = course.ltime; // unix timestamp
  for (const video of course.videoList) {
    feed.addItem({
      title: `【第${video.pNumber}集】${video.title}`,
      description: video.description,
      url: video.webUrl,
      guid: video.mid,
      date: new Date(time + video.pNumber * 1000 * 60 * 60),
      enclosure: {
        url: video.mp4SdUrl,
      },
      itunesImage: video.imgPath,
    });
  }

  const xml = feed.buildXml();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml;charset=UTF-8",
    },
  });
});

Deno.serve(app.fetch);
