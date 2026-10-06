const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = process.argv[2] || '87b86a95-6717-45e3-aa77-0d23086b301b';

async function main() {
  const query = `
    query GetBuild($buildId: ID!) {
      builds {
        byId(buildId: $buildId) {
          id
          status
          logFileUrls
        }
      }
    }
  `;

  const res = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({ query, variables: { buildId: BUILD_ID } })
  });

  const data = await res.json();
  const urls = data?.data?.builds?.byId?.logFileUrls || [];
  console.log(`Found ${urls.length} log URLs.`);

  for (let i = 0; i < urls.length; i++) {
    console.log(`\n=== Fetching Log ${i + 1} of ${urls.length} ===`);
    try {
      const logRes = await fetch(urls[i]);
      const text = await logRes.text();
      const lines = text.split('\n');
      console.log(`Total lines: ${lines.length}`);
      // Find lines with error or failure
      const errorIdx = lines.findIndex(l => l.includes('FAILURE:') || l.includes('What went wrong:'));
      if (errorIdx !== -1) {
        console.log('\n--- ERROR CONTEXT ---');
        console.log(lines.slice(Math.max(0, errorIdx - 10), Math.min(lines.length, errorIdx + 60)).join('\n'));
      } else {
        console.log('\n--- LAST 60 LINES ---');
        console.log(lines.slice(-60).join('\n'));
      }
    } catch (e) {
      console.error('Error fetching log:', e.message);
    }
  }
}

main().catch(console.error);
