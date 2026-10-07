import fs from 'fs';

const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';
const BUILD_ID = '019d15c3-1718-4f8c-bc89-18cc538652f6';

async function main() {
  const query = `
    query GetBuild($id: ID!) {
      builds {
        byId(buildId: $id) {
          id
          logFiles
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
  const logUrls = data.data.builds.byId.logFiles;
  console.log('Log files count:', logUrls.length);
  if (logUrls.length > 0) {
    const logRes = await fetch(logUrls[0]);
    const text = await logRes.text();
    fs.writeFileSync('eas_build_log.txt', text, 'utf8');
    const lines = text.split('\n');
    console.log('Total lines:', lines.length);
    console.log('--- LAST 40 LINES ---');
    console.log(lines.slice(-40).join('\n'));
  }
}

main().catch(console.error);
