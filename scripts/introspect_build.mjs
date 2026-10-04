const TOKEN = 'lZHhBkZQVfCFeprWDYL5dEo1Ul_-GK6cHHTJx48V';

async function main() {
  const query = `
    query {
      __type(name: "TurtleBuild") {
        fields {
          name
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
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  console.log(data.data.__type.fields.map(f => f.name).join(', '));
}

main().catch(console.error);
