fetch('http://localhost:3002/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Show me free weather APIs' }],
    threadId: 'test'
  })
}).then(res => {
  console.log('Status:', res.status);
  return res.text();
}).then(text => console.log('Response:', text.substring(0, 500)))
.catch(err => console.error(err));
