require('dotenv').config();
const axios = require('axios');
const snoowrap = require('snoowrap');
const schedule = require('node-schedule');

// Function to get breaking news
async function getBreakingNews(country = 'us') {
  console.log(`Fetching breaking news for country: ${country}...🟡`);
  try {
    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: process.env.NEWS_API_KEY,
        country,
        category: 'top',
        language: 'en',
      },
      timeout: 10000,
    });
    console.log('Breaking news fetched successfully.🟢');
    return response.data.results;
  } catch (error) {
    console.error('Error fetching breaking news:🔴', error.response ? error.response.data : error.message);
    return [];
  }
}

// Function to format Reddit post title and link
function formatRedditPost(article) {
  console.log('Formatting Reddit post...🟡');
  const siteName = new URL(article.link).hostname.replace('www.', '');
  const description = article.description || '';
  const firstTwoWords = description.split(' ').slice(0, 2).join(' ');
  const hashtags = `#${firstTwoWords.replace(/[^a-zA-Z0-9]/g, '')} #${siteName.replace(/[^a-zA-Z0-9]/g, '')}`;
  const title = `${article.title} | ${siteName} ${hashtags}`;
  console.log('Formatted Reddit post:🟡', title);

  return {
    title,
    url: article.link
  };
}

// Function to post to Reddit
async function postToReddit(title, url) {
  console.log('Attempting to post to Reddit:🟡', title);
  try {
    const reddit = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
    });

    const subreddit = reddit.getSubreddit(process.env.SUBREDDIT);
    const post = await subreddit.submitLink({ title, url });
    console.log('Post published successfully on Reddit!🟢');
    
    // Approve the post
    await post.approve();
    console.log('Post approved successfully!🟢');
  } catch (error) {
    console.error('Error posting to Reddit:🟡', error.message || error.response.data);
  }
}

// Main function to fetch and post breaking news
async function fetchAndPostBreakingNews() {
  console.log('Fetching and posting breaking news...🟡');
  const countries = ['us', 'int'];
  for (const country of countries) {
    const news = await getBreakingNews(country);
    for (const article of news) {
      const { title, url } = formatRedditPost(article);
      await postToReddit(title, url);
      return; // Post one article at a time
    }
  }
  console.log('No new breaking news articles available to post.🟡');
}

// Schedule posts every hour
schedule.scheduleJob('0 * * * *', async () => {
  console.log('Scheduled job triggered.🟡');
  await fetchAndPostBreakingNews();
});

console.log('Reddit bot is running and scheduled jobs are set.🟢');

// Initial post when the script starts
fetchAndPostBreakingNews();

// Keep the script running
setInterval(() => {}, 1000);
