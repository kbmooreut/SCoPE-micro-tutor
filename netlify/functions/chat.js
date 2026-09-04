exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Basic origin check — replace with your actual Netlify domain once deployed
const allowedOrigins = [
    "http://localhost:8888",
    "https://essentialspharmtutor.netlify.app"
];
  const origin = event.headers.origin || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[1];

  try {
    const body = JSON.parse(event.body);

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": corsOrigin },
        body: JSON.stringify({ error: "Invalid request: messages array required" })
      };
    }

    // Cap messages to last 30 to control token usage
    const trimmedMessages = body.messages.slice(-30);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, // stored safely in Netlify dashboard
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        system: body.system,
        messages: trimmedMessages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": corsOrigin },
        body: JSON.stringify({ error: "API request failed", detail: err })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": corsOrigin },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
