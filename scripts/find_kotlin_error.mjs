const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = process.argv[2] || '87b86a95-6717-45e3-aa77-0d23086b301b';

async function main() {
  const query = `
    query GetBuild($buildId: ID!) {
      builds {
        byId(buildId: $buildId) {
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
  const url = data?.data?.builds?.byId?.logFileUrls?.[0];
  if (!url) return;

  const logRes = await fetch(url);
  const text = await logRes.text();
  const lines = text.split('\n');

  // Find lines around compileReleaseKotlin
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('compileReleaseKotlin') || lines[i].includes('e: file:') || lines[i].includes('e: /')) {
      console.log(`Line ${i}: ${lines[i]}`);
      for (let j = Math.max(0, i - 15); j <= Math.min(lines.length - 1, i + 15); j++) {
        console.log(`  [${j}] ${lines[j]}`);
      }
      break;
    }
  }
}

main().catch(console.error);
