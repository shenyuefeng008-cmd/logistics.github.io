/**
 * 火山引擎云函数 - AI 客服后端
 * 部署后设置环境变量：DOUBAO_API_KEY
 */

const API_KEY = process.env.DOUBAO_API_KEY || 'your-api-key-here';
const BASE_URL = 'https://ark.cn-beijing.volces.com';

exports.handler = async (ctx) => {
  const { request } = ctx;
  
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Only POST allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(request.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const userMessage = body.message || body.content || '';

  if (!userMessage) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing message' })
    };
  }

  // 调用火山引擎 Doubao API
  const response = await fetch(`${BASE_URL}/v3/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'Doubao-seed-2.0-pro',
      messages: [
        {
          role: 'system',
          content: '你是 JLLogi 捷流物流的智能客服，请用专业、友好的语气回答用户关于物流查询、运费、时效等问题。'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: data.error || 'API error', details: data })
    };
  }

  const reply = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答这个问题。';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply })
  };
};
