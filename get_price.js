const fetch = require('node-fetch');

async function test() {
  const url = 'https://subgiare.net.vn/api/price.aspx';
  const apiKey = 'dzkqnMlAUPMinziCFFKgv210yN6EWFHvtIW0nHi5smHXJEvKRPCNNLgKikomukN1Qv45c1ZM8RM6HxyF';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_token: apiKey })
    });
    
    const data = await response.json();
    console.log('TikTok services configuration:');
    console.log(JSON.stringify(data.data.tiktok, null, 2));
  } catch (e) {
    console.error('Lỗi khi fetch:', e);
  }
}

test();
