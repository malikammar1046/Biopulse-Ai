const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = process.argv[2] || '87b86a95-6717-45e3-aa77-0d23086b301b';

async function main() {
  const query = `
    query GetBuild($buildId: ID!) {
      builds {
        byId(buildId: $buildId) {
          id
          status
          projectMetadataFileUrl
          logFileUrls
          message
          error {
            errorCode
            message
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

  if (data?.data?.builds?.byId?.projectMetadataFileUrl) {
    const metaRes = await fetch(data.data.builds.byId.projectMetadataFileUrl);
    const metaText = await metaRes.text();
    console.log('\n--- Project Metadata ---');
    console.log(metaText);
  }
}

main().catch(console.error);
