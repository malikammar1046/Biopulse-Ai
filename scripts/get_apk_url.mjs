const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = process.argv[2] || 'b09b5df9-faca-48ff-9411-3e7cbcebb28d';

async function main() {
  const query = `
    query GetBuild($buildId: ID!) {
      builds {
        byId(buildId: $buildId) {
          id
          status
          artifacts {
            buildUrl
            applicationArchiveUrl
          }
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
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
