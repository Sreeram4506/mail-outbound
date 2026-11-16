import OpenAI from "openai";

function createAIClient(apiKey) {
  return new OpenAI({ apiKey });
}

async function gatherContacts(client, { task, count = 20 }) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a research assistant that finds business contact information.
Return ONLY a valid JSON array of objects with these fields:
- "company": company name
- "email": the most likely general/info/contact email address
- "contact_name": contact person name if known, otherwise "Team"
- "industry": brief industry description
- "location": city/region
- "notes": one line about what the company does

If you cannot find a real email, construct a reasonable guess using common patterns (info@, hello@, contact@) based on the company domain.
Return at least ${count} results. Output ONLY the JSON array, no markdown formatting.`,
      },
      {
        role: "user",
        content: task,
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const text = response.choices[0].message.content.trim();
  const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

async function generateEmail(client, { template, contact, senderName, customInstructions }) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert email copywriter for Indraam, a company that offers AI automation, web & app development, and digital marketing services.

Write professional, personalized outreach emails.

Rules:
- Start with "Hi [recipient first name]," using their actual name
- Keep emails concise (100-200 words for the body)
- Personalize based on the company/contact details provided
- Sound human, warm, and professional — never robotic or salesy
- Reference what the recipient's company does and connect it to how Indraam can help
- Include a clear call to action (mention they can book a call)
- Do NOT use excessive exclamation marks
- Do NOT use placeholder brackets like [Your Name] or [Company]
- Do NOT include any sign-off like "Regards" or "Best" — the email template already has "Regards, Team Indraam" built in
- Do NOT include the sender's name at the end
- Return a JSON object with "subject" and "body" fields
- The body should be plain text with paragraph breaks (double newlines), not HTML
- Output ONLY the JSON object, no markdown formatting`,
      },
      {
        role: "user",
        content: `Write an outreach email with these details:

Template/Purpose: ${template}

Recipient company: ${contact.company}
Recipient name: ${contact.contact_name}
Industry: ${contact.industry || "N/A"}
Location: ${contact.location || "N/A"}
Company notes: ${contact.notes || "N/A"}

Sender company: Indraam (AI automation, web & app development, digital marketing)

${customInstructions ? `Additional instructions: ${customInstructions}` : ""}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const text = response.choices[0].message.content.trim();
  const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

async function refineEmail(client, { currentSubject, currentBody, feedback }) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You refine emails based on feedback. Return a JSON object with "subject" and "body" fields. Output ONLY the JSON object, no markdown formatting.`,
      },
      {
        role: "user",
        content: `Current email:
Subject: ${currentSubject}
Body: ${currentBody}

Feedback: ${feedback}

Please refine the email based on this feedback.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1000,
  });

  const text = response.choices[0].message.content.trim();
  const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

export { createAIClient, gatherContacts, generateEmail, refineEmail };
