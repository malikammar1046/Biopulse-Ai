const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const PROJECT_ID = '660129db-931e-4e55-83ed-e35467aee42b';

async function main() {
  const query = `
    query GetProjectBuilds($appId: String!) {
      app {
        byId(appId: $appId) {
          id
          name
          slug
          builds(offset: 0, limit: 5) {
            id
            status
            platform
            createdAt
            updatedAt
            artifacts {
              buildUrl
              applicationArchiveUrl
            }
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
    body: JSON.stringify({ query, variables: { appId: PROJECT_ID } })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
