
const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://saving-memory-drain-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function scrapePornhubVideos() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://www.pornhub.com/video/search?search=new', { waitUntil: 'networkidle2' });

  const videos = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.videoPreviewBg, .phimage'));
    return items.slice(0, 10).map(el => {
      const titleEl = el.querySelector('a.title');
      const title = titleEl?.innerText || "Untitled";
      const url = titleEl?.href || "";
      return { title, url };
    });
  });

  const ref = db.ref('videos');
  for (const video of videos) {
    if (video.url) {
      ref.push(video);
    }
  }

  await browser.close();
  console.log(`✅ Saved ${videos.length} videos to Firebase.`);
}

scrapePornhubVideos().catch(console.error);
