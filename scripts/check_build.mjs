const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = 'a528ef3a-cff6-40fd-9536-65d06f0a4f56';

async function main() {
  const query = `
    query GetBuild($id: ID!) {
      builds {
        byId(buildId: $id) {
          id
          status
          platform
          createdAt
          updatedAt
          gitCommitHash
          gitCommitMessage
          logFiles
          artifacts {
            buildUrl
            applicationArchiveUrl
          }
          error {
            message
            errorCode
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
    body: JSON.stringify({ query, variables: { id: BUILD_ID } })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
