/**
 * JLLogi AI 客服 — Cloudflare Worker
 * 
 * 部署步骤（任选一种）：
 * 
 * 【方式A：用 Cloudflare Workers 免费部署】
 * 1. 安装 Wrangler: npm install -g wrangler
 * 2. 登录: npx wrangler login
 * 3. 设置密钥:
 *    npx wrangler secret put DOUB AO_API_KEY
 *    → 填入: ark-1425d7ec-2091-4f31-b1e2-9e777aedd369-18f71
 * 4. 修改 wrangler.toml 的 name 和 ALLOWED_ORIGIN
 * 5. 部署: npx wrangler deploy
 *
 * 【方式B：用你自己的服务器（Nginx/Node）】
 * 将 chat.mjs 改写为 Express/Koa 路由即可，逻辑相同
 */

const API_URL   = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const MODEL_ID = "ep-20260505220750-z8mhb";

const SYS_PROMPT = `你是JLLogi捷流物流的在线客服。JLLogi专注国际快递18年，与UPS、FedEx、东航、大韩航空、美森官方合作。服务：国际快递(UPS/FedEx 3-7天)、国际空运(5-10天)、美森海运(15-25天)、专线物流(10-20天)。覆盖220+国家。

报价参考(元/kg)：
- 国际快递: 美国38 英国42 德国40 日本22 韩国18 澳洲35 加拿大40
- 国际空运: 美国25 英国28 德国27 日本15 韩国12 澳洲24 加拿大27
- 美森海运: 美国18 英国20 德国19 日本10 韩国8 澳洲16 加拿大19
- 专线物流: 美国30 英国32 德国30 日本18 韩国14 澳洲26 加拿大30

规则：
1. 回答简洁专业，报价后主动问是否需要提交询价
2. 重量按客户给出的计算，没给就按10kg估算
3. 价格用人民币(¥)
4. 特殊货物(带电/液体/粉末)需加10-30%附加费
5. 禁止编造不在知识库内的信息`;

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response("", {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResp({ error: "Invalid JSON" }, 400);
    }

    const userMessage = body.message;
    if (!userMessage) {
      return jsonResp({ error: "缺少 message 字段" }, 400);
    }

    const apiKey = env.DOUB AO_API_KEY || "";
    if (!apiKey) {
      return jsonResp({ error: "API 未配置" }, 500);
    }

    const payload = {
      model: MODEL_ID,
      messages: [
        { role: "system", content: SYS_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: body.max_tokens || 500,
      temperature: body.temperature || 0.7,
    };

    try {
      const apiResp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await apiResp.json();
      if (!apiResp.ok) {
        console.error("Volcano API error:", data);
        return jsonResp({ error: "上游服务异常，请稍后重试。" }, 502);
      }

      const reply = data.choices?.[0]?.message?.content || "";
      return jsonResp({ reply }, 200);

    } catch (err) {
      console.error("Worker error:", err);
      return jsonResp({ error: "请求失败: " + err.message }, 500);
    }
  },
};

function jsonResp(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
