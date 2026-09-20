// GRIDPOINT — ShelVO AI Floating Widget with In-Chat Feedback & Review System
// Clean, Premium SaaS Aesthetic (Light Mode with Glassmorphism)

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

(function() {
  // ShelVO Indigo Icon SVG
  function ShelvoIcon({ size = 20, color = "#FFFFFF" }) {
    return React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
      React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }),
      React.createElement("path", { d: "M8 10h.01" }),
      React.createElement("path", { d: "M12 10h.01" }),
      React.createElement("path", { d: "M16 10h.01" })
    );
  }

  // ShelVO Header Brand Badge
  function ShelvoBadge({ size = 32 }) {
    return React.createElement("div", {
      className: "relative flex-none rounded-full flex items-center justify-center select-none shadow-sm",
      style: {
        width: size + "px",
        height: size + "px",
        background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
        boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"
      }
    },
      React.createElement(ShelvoIcon, { size: Math.round(size * 0.55), color: "#FFFFFF" })
    );
  }

  window.GRIDPOINT_COMPONENTS.ChatbotModal = function({
    neighborhoods,
    optimizationResult,
    baselineMetrics,
    user,
    onClose,
    onTriggerOptimization,
    onOpenComparison,
    onOpenScenarios,
    onOpenDemandShock,
    onOpenInventory
  }) {
    const [messages, setMessages] = React.useState([
      {
        id: "msg_init",
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Hi! I'm **ShelVO AI**, your intelligent assistant.

I can help you monitor warehouse capacities, find nearby fulfillment centers, inspect stock inventory, or assist with anything on the site.

Feel free to ask a question, or share your thoughts to help us improve!`,
        suggestedActions: [
          { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
          { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
          { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
          { label: "🐛 Bug / Issue", action: "FEEDBACK_CAT_BUG" },
          { label: "💡 Feature Request", action: "FEEDBACK_CAT_FEATURE" },
          { label: "⭐ General Review", action: "FEEDBACK_CAT_REVIEW" }
        ],
        feedbackState: null
      }
    ]);

    const [inputVal, setInputVal] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    const [copiedId, setCopiedId] = React.useState(null);
    const messagesEndRef = React.useRef(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    React.useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const sendMessage = async (textToSend, extraContext) => {
      const query = (textToSend || inputVal).trim();
      if (!query || isTyping) return;

      const userMsg = {
        id: "msg_" + Date.now(),
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: query
      };

      setMessages(prev => [...prev, userMsg]);
      setInputVal("");
      setIsTyping(true);

      try {
        const payload = {
          message: query,
          context: Object.assign({
            warehouses: optimizationResult ? optimizationResult.warehouses : null,
            metrics: optimizationResult ? optimizationResult.metrics : baselineMetrics,
            neighborhoodCount: neighborhoods ? neighborhoods.length : 28,
            geminiApiKey: localStorage.getItem("gridpoint_gemini_api_key") || null
          }, extraContext || {})
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("API status " + res.status);
        const data = await res.json();

        const assistantMsg = {
          id: "msg_bot_" + Date.now(),
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: data.reply || "I've processed your request.",
          source: data.source || "ShelVO AI",
          capacityCards: data.capacityCards || [],
          inventoryAlerts: data.inventoryAlerts || [],
          suggestedActions: data.suggestedActions || [],
          feedbackState: null
        };

        setMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Chat error:", err);
        setMessages(prev => [
          ...prev,
          {
            id: "msg_err_" + Date.now(),
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "I ran into a connection issue with the server. Please ensure the backend is running.\n\n*Was this helpful? Feel free to share feedback!*",
            suggestedActions: [
              { label: "🐛 Report Connection Bug", action: "FEEDBACK_CAT_BUG" },
              { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" }
            ],
            feedbackState: null
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    };

    const handleMicroFeedback = async (msgId, vote) => {
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? Object.assign({}, m, { feedbackState: vote }) : m))
      );

      const targetMsg = messages.find(m => m.id === msgId);
      const snippet = targetMsg ? targetMsg.text.slice(0, 80) : "";

      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: vote === "up" ? "Helpful Response" : "Unhelpful Response",
            rating: vote === "up" ? 5 : 1,
            feedbackText: `Micro-feedback (${vote === "up" ? "👍 Thumbs Up" : "👎 Thumbs Down"}) on answer snippet: "${snippet}..."`
          })
        });
      } catch (e) {
        console.warn("Failed to record micro-feedback:", e);
      }
    };

    const handleCopy = (msgId, text) => {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    };

    const requestUserGeolocation = () => {
      if (!navigator.geolocation) {
        setMessages(prev => [
          ...prev,
          {
            id: "msg_geo_err_" + Date.now(),
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "Your browser doesn't have GPS access enabled. Please type your neighborhood name or pick from the options below:",
            suggestedActions: [
              { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
              { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
              { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
              { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" }
            ],
            feedbackState: null
          }
        ]);
        return;
      }

      setIsTyping(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsTyping(false);
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          sendMessage(
            `Find closest warehouse to my location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            {
              userLocation: {
                latitude: lat,
                longitude: lon,
                accuracy: pos.coords.accuracy,
                area: `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
              }
            }
          );
        },
        (err) => {
          setIsTyping(false);
          console.warn("Geolocation permission error:", err);
          setMessages(prev => [
            ...prev,
            {
              id: "msg_geo_denied_" + Date.now(),
              sender: "assistant",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: "Could not access device GPS coordinates. You can type your delivery area directly or choose one of the popular zones below:",
              suggestedActions: [
                { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
                { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
                { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
                { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" }
              ],
              feedbackState: null
            }
          ]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    const handleActionClick = (action) => {
      if (action === "OPEN_INVENTORY_TABLE" && onOpenInventory) {
        onOpenInventory();
      } else if (action === "OPEN_DEMAND_SHOCK" && onOpenDemandShock) {
        onOpenDemandShock();
      } else if (action === "OPEN_SCENARIOS" && onOpenScenarios) {
        onOpenScenarios();
      } else if (action === "OPEN_BEFORE_AFTER" && onOpenComparison) {
        onOpenComparison();
      } else if (action === "REQUEST_GEOLOCATION") {
        requestUserGeolocation();
      } else if (action === "CHAT_ASK_LOCATION") {
        sendMessage("Which warehouse is nearest to me?");
      } else if (action && action.startsWith("CHAT_LOCATION_")) {
        const area = action.replace("CHAT_LOCATION_", "");
        sendMessage(`Find the closest warehouse to ${area}`);
      } else if (action === "FEEDBACK_CAT_BUG") {
        sendMessage("feedback_cat_bug");
      } else if (action === "FEEDBACK_CAT_FEATURE") {
        sendMessage("feedback_cat_feature");
      } else if (action === "FEEDBACK_CAT_REVIEW") {
        sendMessage("feedback_cat_review");
      } else if (action === "CHAT_CAPACITY") {
        sendMessage("What is the capacity and utilization of our warehouses?");
      } else if (action === "CHAT_REBALANCE") {
        sendMessage("How can we rebalance stock between warehouses to prevent stockouts?");
      } else if (action === "CHAT_COST") {
        sendMessage("What are our daily delivery costs and savings compared to baseline?");
      } else {
        sendMessage(action);
      }
    };

    // Helper to render formatted markdown
    const renderFormattedText = (rawText) => {
      if (!rawText) return null;
      const lines = rawText.split("\n");
      const elements = [];
      let inTable = false;
      let tableHeader = [];
      let tableRows = [];

      const flushTable = (key) => {
        if (tableHeader.length > 0 || tableRows.length > 0) {
          elements.push(
            React.createElement("div", { key: `tbl_${key}`, className: "my-2 overflow-x-auto rounded-lg border border-gray-200 bg-white" },
              React.createElement("table", { className: "w-full text-left font-sans text-[11px]" },
                React.createElement("thead", { className: "bg-gray-50 border-b border-gray-200 text-gray-700" },
                  React.createElement("tr", null,
                    tableHeader.map((th, i) => React.createElement("th", { key: i, className: "py-1.5 px-2.5 font-semibold text-[10px]" }, th))
                  )
                ),
                React.createElement("tbody", { className: "divide-y divide-gray-100" },
                  tableRows.map((row, rIdx) =>
                    React.createElement("tr", { key: rIdx, className: "hover:bg-gray-50/50" },
                      row.map((col, cIdx) => React.createElement("td", { key: cIdx, className: "py-1.5 px-2.5 text-gray-800" }, col))
                    )
                  )
                )
              )
            )
          );
          tableHeader = [];
          tableRows = [];
          inTable = false;
        }
      };

      lines.forEach((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          const parts = trimmed.split("|").slice(1, -1).map(p => p.trim());
          if (parts.every(p => /^:?-+:?$/.test(p))) return;
          if (!inTable) {
            inTable = true;
            tableHeader = parts.map(p => p.replace(/\*\*/g, ""));
          } else {
            tableRows.push(parts.map(p => p.replace(/\*\*/g, "")));
          }
          return;
        } else if (inTable) {
          flushTable(idx);
        }

        if (trimmed.startsWith("### ")) {
          elements.push(React.createElement("h4", { key: idx, className: "font-semibold text-gray-900 text-[13px] mt-2 mb-1" }, trimmed.replace("### ", "")));
        } else if (trimmed.startsWith("#### ")) {
          elements.push(React.createElement("h5", { key: idx, className: "font-medium text-gray-800 text-xs mt-1.5 mb-0.5" }, trimmed.replace("#### ", "")));
        } else if (trimmed.startsWith("> [!")) {
          const alertType = trimmed.includes("WARNING") ? "warning" : trimmed.includes("CAUTION") ? "caution" : "tip";
          const alertColor = alertType === "caution" ? "border-red-500 bg-red-50 text-red-800" : alertType === "warning" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-indigo-500 bg-indigo-50 text-indigo-800";
          elements.push(
            React.createElement("div", { key: idx, className: `p-2 my-1.5 rounded border-l-2 text-xs ${alertColor}` },
              React.createElement("span", { className: "font-bold uppercase text-[9px] block" }, alertType),
              lines[idx + 1] ? lines[idx + 1].replace(/^>\s*/, "") : ""
            )
          );
        } else if (trimmed.startsWith("> ")) {
          if (lines[idx - 1] && lines[idx - 1].trim().startsWith("> [!")) return;
          elements.push(React.createElement("blockquote", { key: idx, className: "border-l-2 border-indigo-400 pl-2.5 my-1.5 text-xs text-gray-600 italic" }, trimmed.replace(/^>\s*/, "")));
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const textContent = trimmed.slice(2);
          elements.push(
            React.createElement("div", { key: idx, className: "flex items-start space-x-1.5 my-0.5 text-xs text-gray-700" },
              React.createElement("span", { className: "text-[#4F46E5] font-bold" }, "•"),
              React.createElement("span", { className: "flex-1 leading-normal" }, formatInlineMarkdown(textContent))
            )
          );
        } else if (/^\d+\.\s/.test(trimmed)) {
          elements.push(
            React.createElement("div", { key: idx, className: "flex items-start space-x-1.5 my-0.5 text-xs text-gray-700" },
              React.createElement("span", { className: "font-bold text-[#4F46E5] text-[11px]" }, trimmed.match(/^\d+\./)[0]),
              React.createElement("span", { className: "flex-1 leading-normal" }, formatInlineMarkdown(trimmed.replace(/^\d+\.\s*/, "")))
            )
          );
        } else if (trimmed.length > 0) {
          elements.push(React.createElement("p", { key: idx, className: "my-1 text-xs text-gray-700 leading-relaxed" }, formatInlineMarkdown(trimmed)));
        }
      });

      if (inTable) flushTable(lines.length);
      return elements;
    };

    const formatInlineMarkdown = (text) => {
      const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return React.createElement("strong", { key: i, className: "text-gray-900 font-semibold" }, part.slice(2, -2));
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return React.createElement("em", { key: i, className: "text-gray-500 italic" }, part.slice(1, -1));
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return React.createElement("code", { key: i, className: "px-1.5 py-0.5 bg-gray-200/70 text-indigo-700 font-mono text-[11px] rounded" }, part.slice(1, -1));
        }
        return part;
      });
    };

    return React.createElement("div", {
      className: "fixed bottom-6 right-6 z-[99999] flex flex-col items-end pointer-events-auto"
    },
      React.createElement("div", {
        className: "w-[370px] h-[540px] max-h-[calc(100vh-48px)] bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden text-[#1F2937] font-sans transition-all duration-300 animate-in fade-in zoom-in-95"
      },
        
        /*  Header Bar  */
        React.createElement("div", {
          className: "px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between select-none flex-none bg-white/90 backdrop-blur-md"
        },
          React.createElement("div", { className: "flex items-center space-x-2.5" },
            React.createElement(ShelvoBadge, { size: 32 }),
            React.createElement("div", { className: "flex flex-col" },
              React.createElement("span", { className: "font-semibold text-sm text-[#1F2937] leading-tight" }, "ShelVO AI"),
              React.createElement("div", { className: "flex items-center space-x-1.5" },
                React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" }),
                React.createElement("span", { className: "text-[11px] text-[#6B7280]" }, "Online • AI Assistant")
              )
            )
          ),

          /*  Minimal Window Controls  */
          React.createElement("div", { className: "flex items-center space-x-1" },
            React.createElement("button", {
              onClick: onClose,
              className: "w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium",
              title: "Minimize"
            }, "−"),
            React.createElement("button", {
              onClick: onClose,
              className: "w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm",
              title: "Close"
            }, "✕")
          )
        ),

        /*  Chat Stream Area  */
        React.createElement("div", {
          className: "flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F9FAFB] scroll-smooth"
        },
          messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return React.createElement("div", {
                key: msg.id,
                className: "flex justify-end ml-auto max-w-[85%]"
              },
                React.createElement("div", {
                  className: "px-3.5 py-2.5 bg-[#4F46E5] text-white rounded-[16px] rounded-br-[4px] text-xs leading-relaxed shadow-sm"
                },
                  renderFormattedText(msg.text)
                )
              );
            }

            // Bot Message
            return React.createElement("div", {
              key: msg.id,
              className: "flex flex-col items-start max-w-[92%]"
            },
              React.createElement("div", {
                className: "px-3.5 py-2.5 bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB] rounded-[16px] rounded-bl-[4px] text-xs leading-relaxed shadow-sm w-full"
              },
                renderFormattedText(msg.text),

                /*  Warehouse Capacity Cards (if included)  */
                msg.capacityCards && msg.capacityCards.length > 0 && React.createElement("div", {
                  className: "mt-2 pt-2 border-t border-gray-200 space-y-1.5"
                },
                  msg.capacityCards.map((card, cIdx) =>
                    React.createElement("div", {
                      key: cIdx,
                      className: "p-2 bg-white border border-gray-200 rounded-lg space-y-1 text-[11px]"
                    },
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "font-semibold text-gray-900" }, `${card.code} - ${card.name}`),
                        React.createElement("span", {
                          className: "px-1.5 py-0.2 text-[9px] font-bold rounded",
                          style: { color: card.statusColor, backgroundColor: `${card.statusColor}18` }
                        }, card.status)
                      ),
                      React.createElement("div", { className: "flex justify-between text-[10px] text-gray-500" },
                        React.createElement("span", null, `Load: ${card.dailyAssigned?.toLocaleString()} / ${card.dailyCapacity?.toLocaleString()} ord/day`),
                        React.createElement("span", { className: "font-bold text-gray-800" }, `${card.utilizationPercent}%`)
                      ),
                      React.createElement("div", { className: "w-full h-1 bg-gray-100 rounded-full overflow-hidden" },
                        React.createElement("div", {
                          className: "h-full rounded-full transition-all duration-500",
                          style: {
                            width: `${Math.min(100, card.utilizationPercent)}%`,
                            backgroundColor: card.statusColor || '#4F46E5'
                          }
                        })
                      )
                    )
                  )
                ),

                /*  Feedback Card / Action Chips  */
                msg.suggestedActions && msg.suggestedActions.length > 0 && React.createElement("div", {
                  className: "mt-2.5 pt-2 border-t border-gray-200 flex flex-wrap gap-1.5"
                },
                  msg.suggestedActions.map((act, actIdx) =>
                    React.createElement("button", {
                      key: actIdx,
                      onClick: () => handleActionClick(act.action),
                      className: `px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        act.label.includes("Bug")
                          ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                          : act.label.includes("Feature")
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                          : act.label.includes("Review") || act.label.includes("Star")
                          ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                          : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                      }`
                    }, act.label)
                  )
                )
              ),

              /*  Micro-Feedback Toolbar Directly Under Bot Answer  */
              React.createElement("div", {
                className: "flex items-center space-x-2 mt-1 px-1 text-gray-400 text-[11px]"
              },
                React.createElement("button", {
                  onClick: () => handleMicroFeedback(msg.id, "up"),
                  className: `hover:text-indigo-600 transition-colors ${msg.feedbackState === 'up' ? 'text-indigo-600 font-bold' : ''}`,
                  title: "Helpful answer"
                }, msg.feedbackState === 'up' ? "👍 Liked" : "👍"),
                React.createElement("button", {
                  onClick: () => handleMicroFeedback(msg.id, "down"),
                  className: `hover:text-red-600 transition-colors ${msg.feedbackState === 'down' ? 'text-red-600 font-bold' : ''}`,
                  title: "Not helpful"
                }, msg.feedbackState === 'down' ? "👎 Disliked" : "👎"),
                React.createElement("button", {
                  onClick: () => handleCopy(msg.id, msg.text),
                  className: "hover:text-gray-700 transition-colors",
                  title: "Copy answer"
                }, copiedId === msg.id ? "✓ Copied" : "📋"),
                React.createElement("span", { className: "text-[10px] text-gray-300 ml-1" }, msg.timestamp)
              )
            );
          }),

          /*  Typing State  */
          isTyping && React.createElement("div", {
            className: "px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[16px] rounded-bl-[4px] text-xs text-gray-500 inline-flex items-center space-x-1.5"
          },
            React.createElement("span", null, "ShelVO is typing"),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#4F46E5] animate-bounce", style: { animationDelay: "0ms" } }),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#4F46E5] animate-bounce", style: { animationDelay: "150ms" } }),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#4F46E5] animate-bounce", style: { animationDelay: "300ms" } })
          ),

          React.createElement("div", { ref: messagesEndRef })
        ),

        /*  Input Footer  */
        React.createElement("div", {
          className: "p-3 border-t border-[#E5E7EB] bg-white flex-none"
        },
          React.createElement("form", {
            onSubmit: (e) => {
              e.preventDefault();
              sendMessage();
            },
            className: "flex items-center space-x-2"
          },
            React.createElement("div", {
              className: "flex-1 flex items-center bg-[#F9FAFB] border border-[#E5E7EB] focus-within:border-[#4F46E5] rounded-full px-3 py-1.5 transition-all"
            },
              React.createElement("button", {
                type: "button",
                onClick: () => handleActionClick("REQUEST_GEOLOCATION"),
                className: "text-gray-400 hover:text-indigo-600 transition-colors mr-2 text-sm flex-none",
                title: "Share your location / attach context"
              }, "📍"),
              React.createElement("input", {
                ref: inputRef,
                type: "text",
                value: inputVal,
                onChange: (e) => setInputVal(e.target.value),
                placeholder: "Type a message or give feedback...",
                className: "flex-1 bg-transparent text-xs text-[#1F2937] outline-none placeholder:text-gray-400 font-sans"
              })
            ),
            React.createElement("button", {
              type: "submit",
              disabled: !inputVal.trim() || isTyping,
              className: "w-8 h-8 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-35 text-white flex items-center justify-center transition-all flex-none shadow-sm cursor-pointer",
              title: "Send message"
            },
              React.createElement("span", { className: "text-xs -mr-0.5" }, "➤")
            )
          )
        )
      )
    );
  };

  // Compact Circular Floating Launcher Button (56px x 56px with indigo gradient and 8px green dot badge)
  window.GRIDPOINT_COMPONENTS.ChatbotFloatingButton = function({ isOpen, onClick }) {
    if (isOpen) return null;

    return React.createElement("button", {
      onClick: onClick,
      className: "group fixed bottom-6 right-6 z-[99999] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 select-none cursor-pointer focus:outline-none",
      style: {
        background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
        boxShadow: "0 10px 25px -3px rgba(79, 70, 229, 0.45), 0 4px 6px -4px rgba(79, 70, 229, 0.2)"
      },
      title: "Chat with ShelVO AI"
    },
      React.createElement("div", { className: "relative flex items-center justify-center" },
        React.createElement(ShelvoIcon, { size: 26, color: "#FFFFFF" }),
        React.createElement("span", {
          className: "absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white",
          style: { width: "8px", height: "8px" }
        })
      )
    );
  };
})();
