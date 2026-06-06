const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

export async function groqChat(systemPrompt, userMessage) {
  console.log("Calling Groq API...");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });
  const data = await res.json();
  console.log("Groq response:", JSON.stringify(data));
  return data.choices[0].message.content;
}
