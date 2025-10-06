// background.js - service worker to call AI summarization
apiURL = "https://openrouter.ai/api/v1/chat/completions";
model = "openai/gpt-oss-20b:free";
apiKey =
  "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";

async function summarizeText(text, user) {
  try {
    const body = {
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes chat conversations concisely.",
        },
        {
          role: "user",
          content: `The text below contains the full email conversation from Gmail. 
The most recent message appears first, with older emails below it. 
Each email may include a date and time stamp indicating when it was sent.

Read through the entire conversation in chronological order and write a concise, 
one-paragraph summary that captures the main points, the flow of the discussion, 
and any important outcomes or next steps.

You are my personal assistant summarizing this conversation **for me**. 
Write the summary as if you are directly updating me — do not refer to me in the third person. 
Use “you” when referring to me, and make the summary sound natural, clear, and informative.

I am ${user}, and here is the email thread:

${text}`,
        },
      ],
    };

    const resp = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    console.log("background: summarizeText body & response ", body, resp);
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`API error: ${resp.status} ${txt}`);
    }

    const data = await resp.json();
    const out =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    return out || null;
  } catch (err) {
    console.error("background: summarizeText error", err);
    throw err;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "summarize") {
    if (!message.text) {
      sendResponse({ ok: false, error: "No text to summarize" });
      return;
    }
    summarizeText(message.text, message.user)
      .then((summary) => sendResponse({ ok: true, summary }))
      .catch((err) =>
        sendResponse({ ok: false, error: err.message || String(err) })
      );
    // indicate we'll sendResponse asynchronously
    return true;
  }

  // Chat with AI
  if (message && message.type === "draft" && Array.isArray(message.messages)) {
    (async () => {
      try {
        // Remove index 0 of messages and save it
        const removedMessage = message.messages.shift();
        const body = {
          model: model,
          messages: [
            {
              role: "system",
              content: `You are an assistant specialized in drafting professional and natural email replies. 
              your draft email should not have a subject or any signature at the end.
              Always output only the final email text, with no explanations, notes, or extra formatting. 
              Your response should be ready to copy and send as-is. Whenever the user asks you to draft a reply, use the latest conversation summary 
(from the assistant's previous message) as full context, and write the email 
in the user's voice as if they are replying directly to the last message. 
Never produce generic responses without considering the provided context.`,
            },
            {
              role: "assistant",
              content: "SUMMARY:" + (message.summary || ""),
            },
            {
              role: "user",
              content: `Using the SUMMARY above as context, rewrite "${removedMessage.content}", into a professional, natural, ready-to-send reply in my voice. Keep it concise and do not change the meaning."
  }`,
            },
            ...message.messages,
          ],
        };
        console.log("background: chatgpt body", body);
        const resp = await fetch(apiURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          sendResponse({
            ok: false,
            error: `API error: ${resp.status} ${txt}`,
          });
          return;
        }

        const data = await resp.json();
        const out =
          data &&
          data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content;
        sendResponse({ ok: true, reply: out || "" });
      } catch (err) {
        console.error("background: chatgpt handler error", err);
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }
});
