// content.js — simplified watcher that inserts a button beside Send and shows a modal
(function () {
  const ROW_FLAG = "data-myext-send";
  console.log("my-ext: send-watcher loaded");

  const sendSelectors = [
    'div[role="button"][aria-label*="Send"]',
    'div[role="button"][data-tooltip*="Send"]',
    'button[aria-label*="Send"]',
  ];

  function isNewEmail(sendButton) {
    const composeRoot = sendButton.closest(
      'div[role="dialog"], div[role="main"],form'
    );
    if (!composeRoot) return false;

    const spans = composeRoot.querySelectorAll("span");
    for (const span of spans) {
      if ((span.textContent || "").trim().toLowerCase() === "new message") {
        return true;
      }
    }
    return false;
  }

  function showCustomAlert(message, options = {}) {
    const existing = document.getElementById("my-ext-custom-alert");
    if (existing) existing.remove();

    const alertBox = document.createElement("div");
    alertBox.id = "my-ext-custom-alert";
    Object.assign(alertBox.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#222",
      color: "#fff",
      padding: "14px 28px",
      borderRadius: "10px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      zIndex: "2147483647",
      fontSize: "16px",
      fontWeight: "500",
      maxWidth: "90vw",
      textAlign: "center",
      ...options.style,
    });
    alertBox.textContent = "[Semai] " + message;

    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
    }, options.duration || 2200);
  }
  // create loader element (three animated dots)
  function makeLoader(options = {}) {
    const loader = document.createElement("span");
    loader.className = "myext-loader";
    Object.assign(loader.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      height: "18px",
    });
    for (let i = 0; i < 3; i++) {
      const d = document.createElement("span");
      Object.assign(d.style, {
        width: "6px",
        height: "6px",
        background: options.background || "#fff",
        borderRadius: "50%",
        display: "inline-block",
        transform: "scale(0.6)",
        animation: `myext-pulse-dots 1s infinite ease-in-out`,
        animationDelay: `${i * 0.15}s`,
      });
      loader.appendChild(d);
    }
    return loader;
  }

  function captureLastEmail() {
    const messages = document.querySelectorAll(".adn");
    const lastMessage = messages[messages.length - 1];

    const expandButton = lastMessage.querySelector(".ajR .ajT");
    let text = "";
    if (expandButton) {
      expandButton.click();
      text = lastMessage ? lastMessage.innerText : "";
      expandButton.click();
    }
    return text;
  }

  function getFullName() {
    const accountEl = document.querySelector(
      'a[aria-label^="Google Account:"]'
    );
    if (!accountEl) return null;

    const label = accountEl.getAttribute("aria-label");
    const match = label.match(/^Google Account:\s*(.*?)\s*\(/);
    return match ? match[1].trim() : "user";
  }

  function createSisterTd() {
    const td = document.createElement("td");
    td.style.paddingLeft = "6px";
    const semaiBtn = document.createElement("button");
    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("./icon.png");
    icon.alt = "Semai button";
    Object.assign(icon.style, {
      width: "20px",
      height: "20px",
      display: "block",
    });
    semaiBtn.appendChild(icon);
    Object.assign(semaiBtn.style, {
      padding: "2px",
      borderRadius: "50%",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
    });

    semaiBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const tr = e.target.closest && e.target.closest("tr");

        console.log(tr);

        // locate the compose target (nearest contenteditable or textarea)
        let target = null;
        try {
          target =
            tr && tr.closest && tr.closest("form")
              ? tr.closest("form").querySelector('[contenteditable="true"]') ||
                tr.closest("form").querySelector("textarea")
              : null;
        } catch (err) {
          target = null;
        }
        if (!target)
          target =
            document.querySelector('[contenteditable="true"]') ||
            document.querySelector("textarea");

        // Remove any existing modal
        const prevModal = document.getElementById("my-ext-modal");
        if (prevModal) prevModal.remove();

        // build modal overlay and dashboard
        const overlay = document.createElement("div");
        overlay.id = "my-ext-modal";
        Object.assign(overlay.style, {
          position: "fixed",
          left: "0",
          top: "0",
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "2147483647",
        });

        const modalBox = document.createElement("div");
        Object.assign(modalBox.style, {
          background: "#fff",
          borderRadius: "20px",
          width: "90vw",
          maxWidth: "500px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          padding: "10px",
          boxSizing: "border-box",
        });

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.marginBottom = "8px";
        header.style.padding = "0px 10px";

        const logoContainer = document.createElement("div");
        Object.assign(logoContainer.style, {
          display: "flex",
          alignItems: "center",
        });

        const logo = document.createElement("img");
        logo.src = chrome.runtime.getURL("./logo_hor.png");
        Object.assign(logo.style, {
          width: "70px",
        });
        const title = document.createElement("div");
        title.textContent = "";
        Object.assign(title.style, {
          padding: "10px",
        });

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "×";
        Object.assign(closeBtn.style, {
          fontSize: "20px",
          lineHeight: "20px",
          padding: "4px 8px",
          cursor: "pointer",
          background: "transparent",
          border: "none",
        });
        closeBtn.addEventListener("click", () => overlay.remove());

        logoContainer.appendChild(logo);
        logoContainer.appendChild(title);
        header.appendChild(logoContainer);
        header.appendChild(closeBtn);

        const dashboard = document.createElement("div");
        Object.assign(dashboard.style, {
          height: "65vh",
          width: "100%",
          boxSizing: "border-box",
          overflow: "auto",
        });

        modalBox.appendChild(header);
        modalBox.appendChild(dashboard);
        overlay.appendChild(modalBox);
        document.body.appendChild(overlay);

        dashboard.innerHTML = ""; // Clear dashboard
        const summarizeBtn = document.createElement("button");
        summarizeBtn.id = "summarize-btn";
        summarizeBtn.type = "button";
        summarizeBtn.textContent = "Summarize Conversation";
        Object.assign(summarizeBtn.style, {
          padding: "8px 12px",
          border: "none",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          borderRadius: "16px",
        });

        // Add scoped CSS for the three-dot loader animation
        try {
          const loaderStyle = document.createElement("style");
          loaderStyle.textContent = `
            @keyframes myext-pulse-dots {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.9; }
              40% { transform: scale(1.4); opacity: 1; }
            }
          `;
          // put style inside modalBox so it's scoped to the modal
          modalBox.appendChild(loaderStyle);
        } catch (err) {
          // ignore style injection errors
        }

        let _savedBtnText = summarizeBtn.textContent;
        let _loaderEl = null;
        function showLoaderOnButton() {
          try {
            summarizeBtn.disabled = true;
            // replace text with loader
            _savedBtnText = summarizeBtn.textContent || _savedBtnText;
            summarizeBtn.textContent = "";
            _loaderEl = makeLoader();
            summarizeBtn.appendChild(_loaderEl);
          } catch (err) {
            // fallback: dim button
            summarizeBtn.style.opacity = "0.6";
          }
        }

        function hideLoaderAndRestoreButton() {
          try {
            summarizeBtn.disabled = false;
            if (_loaderEl && _loaderEl.parentNode === summarizeBtn) {
              summarizeBtn.removeChild(_loaderEl);
              _loaderEl = null;
            }
            summarizeBtn.textContent = _savedBtnText || "Summarize";
          } catch (err) {
            summarizeBtn.disabled = false;
            summarizeBtn.style.opacity = "1";
            summarizeBtn.textContent = "Summarize";
          }
        }

        summarizeBtn.addEventListener("click", () => {
          // show animated loader in button
          showLoaderOnButton();
          const lastEmail = captureLastEmail();
          const fullName = getFullName();

          chrome.runtime.sendMessage(
            { type: "summarize", text: lastEmail, user: fullName },
            (resp) => {
              try {
                if (!resp) {
                  showCustomAlert("Summary failed: no response from service", {
                    style: { background: "#d44e4e8b" },
                  });
                  return;
                } else if (resp.ok) {
                  if (summarizeBtn && summarizeBtn.parentNode) {
                    summarizeBtn.parentNode.removeChild(summarizeBtn);
                  }
                  addMessageBubble(resp.summary, "left", true, {
                    skipButtons: true,
                  });
                } else {
                  showCustomAlert(
                    "Summary failed: " + (resp.error || "unknown"),
                    {
                      style: { background: "#d44e4e8b" },
                    }
                  );
                }
              } finally {
                // always restore button state
                hideLoaderAndRestoreButton();
              }
            }
          );
        });

        // Chat interface container
        const chatContainer = document.createElement("div");
        Object.assign(chatContainer.style, {
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          //   border: "1px solid #ccc",
          borderRadius: "5px 5px 18px 18px",
          padding: "3px",
        });

        // Chat messages area
        const messagesArea = document.createElement("div");
        Object.assign(messagesArea.style, {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          minHeight: "120px",
          overflowY: "auto",
          padding: "15px",
          flex: "1 1 auto",
        });
        if (!isNewEmail(semaiBtn)) {
          messagesArea.insertBefore(
            summarizeBtn,
            messagesArea.firstChild || null
          );
        }
        // Chat input area
        const inputArea = document.createElement("div");
        // make input area visually separate and pinned to bottom of chatContainer
        Object.assign(inputArea.style, {
          flex: "0 0 auto",
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
          minHeight: "75px",
        });

        const textArea = document.createElement("textarea");
        textArea.rows = 1;
        textArea.placeholder = "Type your message...";
        Object.assign(textArea.style, {
          resize: "none",
          padding: "8px 30px 8px 12px",
          fontSize: "14px",
          width: "100%",
          minHeight: "35px",
          maxHeight: "150px",
          overflow: "auto",
          fieldSizing: "content",
          border: "none",
          outline: "none",
          position: "absolute",
          bottom: "0",
          background: "#e1e1e1",
          borderRadius: "15px",
          boxSizing: "border-box",
        });

        const sendChatBtn = document.createElement("button");
        sendChatBtn.textContent = "➤";
        Object.assign(sendChatBtn.style, {
          border: "none",
          background: "#232527",
          color: "#fff",
          cursor: "pointer",
          position: "absolute",
          bottom: "7.5px",
          right: "7.5px",
          display: "flex",
          borderRadius: "50%",
          height: "20px",
          width: "20px",
          transform: "rotate(-90deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        });

        inputArea.appendChild(textArea);
        inputArea.appendChild(sendChatBtn);

        // Copy compose content (if any) into the chat input so the user can
        // edit/send it immediately. 'target' was located earlier and may be
        // a contenteditable or textarea element.
        try {
          let composeText = "";
          if (typeof target !== "undefined" && target && target.getAttribute) {
            if (target.getAttribute("contenteditable") === "true") {
              composeText = (
                target.innerText ||
                target.textContent ||
                ""
              ).trim();
            } else if ("value" in target) {
              composeText = (target.value || "").trim();
            }
          }
          if (composeText) {
            textArea.value = composeText;
            // focus so user can edit/send right away
            try {
              textArea.focus();
            } catch (err) {
              /* ignore focus errors */
            }
          }
        } catch (err) {
          console.warn(
            "my-ext: failed to copy compose content to chat input",
            err
          );
        }

        // const topDiv = document.createElement("div");
        // Object.assign(topDiv.style, {
        //   background: "#222",
        //   color: "#fff",
        //   padding: "0px 8px",
        //   height: "25px",
        //   borderRadius: "15px",
        //   display: "flex",
        //   flexDirection: "row",
        //   alignItems: "center",
        //   justifyContent: "space-between",
        // });

        // const replyText = document.createElement("span");
        // replyText.textContent = "Write me a reply";
        // Object.assign(replyText.style, {
        //   fontSize: "11px",
        // });

        // topDiv.appendChild(replyText);

        // chatContainer.appendChild(topDiv);
        chatContainer.appendChild(messagesArea);
        chatContainer.appendChild(inputArea);
        dashboard.appendChild(chatContainer);

        // Helper to add message bubbles
        function addMessageBubble(
          text,
          side = "right",
          prepend = false,
          options = {}
        ) {
          const bubble = document.createElement("div");
          // store raw content on dataset so controls can use it
          bubble.dataset.content = text || "";
          // create text container so we can append controls separately
          const textSpan = document.createElement("div");
          textSpan.textContent = text || "";
          Object.assign(bubble.style, {
            maxWidth: "70%",
            padding: "8px 12px",
            borderRadius: "16px",
            margin: "2px 0",
            alignSelf: side === "right" ? "flex-end" : "flex-start",
            background: side === "right" ? "#e0e0e0" : "#fff",
            color: "#222",
            fontSize: "14px",
          });

          bubble.appendChild(textSpan);

          // Add Insert/Replace buttons for assistant (left) bubbles unless skipped
          const summarizeBubbleId = "my-ext-summarize-bubble";
          if (
            side === "left" &&
            !options.skipButtons &&
            bubble.id !== summarizeBubbleId
          ) {
            try {
              const controls = document.createElement("div");
              controls.style.display = "flex";
              controls.style.gap = "6px";
              controls.style.marginTop = "6px";

              const copyBtn = document.createElement("button");
              copyBtn.textContent = "Copy";
              Object.assign(copyBtn.style, {
                padding: "4px 8px",
                borderRadius: "6px",
                border: "none",
                background: "#222",
                color: "#fff",
                cursor: "pointer",
                fontSize: "12px",
              });

              const replaceBtn = document.createElement("button");
              replaceBtn.textContent = "Replace";
              Object.assign(replaceBtn.style, {
                padding: "4px 8px",
                borderRadius: "6px",
                border: "none",
                background: "#222",
                color: "#fff",
                cursor: "pointer",
                fontSize: "12px",
              });

              function applyToCompose(mode, content) {
                try {
                  let applied = false;
                  if (!target) {
                    try {
                      target =
                        document.querySelector('[contenteditable="true"]') ||
                        document.querySelector("textarea");
                    } catch (err) {
                      target = null;
                    }
                  }
                  if (!target) return false;
                  if (
                    target.getAttribute &&
                    target.getAttribute("contenteditable") === "true"
                  ) {
                    if (mode === "replace") {
                      target.innerText = content;
                    } else {
                      const cur = (target.innerText || "").trim();
                      target.innerText = cur ? cur + "\n" + content : content;
                    }
                    applied = true;
                  } else if ("value" in target) {
                    if (mode === "replace") {
                      target.value = content;
                    } else {
                      const cur = (target.value || "").trim();
                      target.value = cur ? cur + "\n" + content : content;
                    }
                    try {
                      target.dispatchEvent(
                        new InputEvent("input", { bubbles: true })
                      );
                    } catch (err) {}
                    applied = true;
                  }
                  return applied;
                } catch (err) {
                  console.warn("my-ext: applyToCompose error", err);
                  return false;
                }
              }

              copyBtn.addEventListener("click", async (ev) => {
                ev.stopPropagation();
                const content = bubble.dataset.content || "";
                try {
                  await navigator.clipboard.writeText(content);
                  showCustomAlert("Copied to clipboard!", {
                    style: { background: "#57cf9f9c" },
                  });
                } catch (err) {
                  showCustomAlert("Failed to copy!", {
                    style: { background: "#d44e4e8b" },
                  });
                }
              });

              replaceBtn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                const content = bubble.dataset.content || "";
                applyToCompose("replace", content);
                try {
                  overlay.remove();
                } catch (err) {}
              });

              controls.appendChild(copyBtn);
              controls.appendChild(replaceBtn);
              bubble.appendChild(controls);
            } catch (err) {
              console.warn("my-ext: failed to add bubble controls", err);
            }
          }

          if (prepend && messagesArea.firstChild) {
            messagesArea.insertBefore(bubble, messagesArea.firstChild);
          } else {
            messagesArea.appendChild(bubble);
          }
          // If we prepended, keep the scroll at top; otherwise scroll to bottom
          if (prepend) {
            messagesArea.scrollTop = 0;
          } else {
            messagesArea.scrollTop = messagesArea.scrollHeight;
          }
        }

        // Send button handler -> call background 'chatgpt' with full history
        sendChatBtn.addEventListener("click", () => {
          const msg = textArea.value.trim();
          if (!msg) return;

          // show user's message immediately and then capture full history
          addMessageBubble(msg, "right");
          textArea.value = "";

          // Capture conversation bubbles (read all current message bubbles)
          // const extraPrompt =
          //   "Draft me a professional and natural email reply based on the following draft.";
          // const amendPrompt = true;
          const bubbles = Array.from(messagesArea.children).map((b) => {
            const side =
              b.style && b.style.alignSelf === "flex-end"
                ? "user"
                : "assistant";
            // if (side === "user" && amendPrompt && b.textContent) {
            //   b.textContent = `Draft me a professional and natural email reply based on the following draft: "${b.textContent}"`;
            //   amendPrompt = false;
            // }

            return {
              role: side === "user" ? "user" : "assistant",
              content: b.textContent || "",
            };
          });

          // If the first bubble is assistant, treat it as summary
          let summary = null;
          if (bubbles.length && bubbles[0].role === "assistant") {
            summary = bubbles[0].content;
            bubbles.shift(); // remove summary from bubbles
          }

          // loader bubble
          const loaderBubble = document.createElement("div");
          // loaderBubble.textContent = "Thinking...";
          Object.assign(loaderBubble.style, {
            maxWidth: "70%",
            padding: "8px 12px",
          });
          loaderBubble.appendChild(makeLoader({ background: "#222" }));
          messagesArea.appendChild(loaderBubble);
          messagesArea.scrollTop = messagesArea.scrollHeight;

          // Compose messages. If a summary is available, include it as a system prompt.
          const messages = [];

          // include full prior conversation
          for (const b of bubbles) messages.push(b);

          // Ensure the last entry is the user's latest message
          if (
            !messages.length ||
            messages[messages.length - 1].role !== "user"
          ) {
            messages.push({ role: "user", content: msg });
          }
          console.log("my-ext: messages", messages);
          // Send to background
          chrome.runtime.sendMessage(
            { type: "draft", messages, summary },
            (resp) => {
              loaderBubble.remove();
              if (!resp) {
                showCustomAlert("Failed to get response from service", {
                  style: { background: "#d44e4e8b" },
                });
                return;
              }
              if (!resp.ok) {
                showCustomAlert("Error: " + (resp.error || "unknown"), {
                  style: { background: "#d44e4e8b" },
                });
                return;
              }
              addMessageBubble(resp.reply || "(empty response)", "left");
            }
          );
        });

        // Enter key sends message
        textArea.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatBtn.click();
          }
        });
      } catch (err) {
        console.warn("my-ext: modal error", err);
      }
    });

    td.appendChild(semaiBtn);
    return td;
  }

  function insertBesideSend(sendEl) {
    if (!sendEl) return;
    const tr = sendEl.closest("tr");
    if (!tr) return;
    if (tr.hasAttribute(ROW_FLAG)) return;
    try {
      const sendTd = sendEl.closest("td");
      const sister = createSisterTd();
      if (sendTd && sendTd.parentElement === tr) {
        tr.insertBefore(sister, sendTd.nextSibling);
      } else {
        tr.appendChild(sister);
      }
      tr.setAttribute(ROW_FLAG, "true");
      console.log("my-ext: inserted button beside Send");
    } catch (err) {
      console.warn("my-ext: insert error", err);
    }
  }

  function scanForSend(root = document) {
    try {
      for (const sel of sendSelectors) {
        const list = Array.from(root.querySelectorAll(sel));
        for (const el of list)
          if (el && el.closest && el.closest("tr")) insertBesideSend(el);
      }
      const candidates = Array.from(
        root.querySelectorAll('button, div[role="button"]')
      );
      for (const el of candidates) {
        if (/^\s*Send\s*$/i.test(el.textContent || "") && el.closest("tr"))
          insertBesideSend(el);
      }
    } catch (err) {
      console.warn("my-ext: scanForSend error", err);
    }
  }

  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      scanForSend(document);
      timer = null;
    }, 150);
  });

  function start() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      scanForSend(document);
      console.log("my-ext: observer started");
    } else {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    }
  }

  start();
})();
