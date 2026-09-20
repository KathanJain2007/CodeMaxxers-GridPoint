// SHELVO — Enterprise Autonomous Operations AI Copilot
// Swiss Editorial Dark Glassmorphism Aesthetic with Live Logistics Telemetry

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

(function() {
  // ShelVO Copper Brand Glyph SVG
  function ShelvoGlyph({ size = 20, color = "#090B0E" }) {
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
      React.createElement("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
      React.createElement("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
      React.createElement("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })
    );
  }

  // Header Brand Badge
  function ShelvoHeaderBadge({ size = 32 }) {
    return React.createElement("div", {
      className: "relative flex-none rounded-lg flex items-center justify-center select-none shadow-md",
      style: {
        width: size + "px",
        height: size + "px",
        background: "linear-gradient(135deg, #D4A373 0%, #B88252 100%)",
        boxShadow: "0 2px 10px rgba(212, 163, 115, 0.35)"
      }
    },
      React.createElement(ShelvoGlyph, { size: Math.round(size * 0.58), color: "#090B0E" })
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
    const isDemoData = React.useMemo(() => {
      if (!neighborhoods || neighborhoods.length !== 28) return false;
      return neighborhoods.some(n => (n.neighborhood === "Koramangala" || n.name === "Koramangala"));
    }, [neighborhoods]);

    const topAreaChips = React.useMemo(() => {
      if (!neighborhoods || neighborhoods.length === 0) {
        return [
          { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
          { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
          { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
          { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" }
        ];
      }
      if (isDemoData) {
        return [
          { label: "📍 Koramangala", action: "CHAT_LOCATION_Koramangala" },
          { label: "📍 Whitefield", action: "CHAT_LOCATION_Whitefield" },
          { label: "📍 Indiranagar", action: "CHAT_LOCATION_Indiranagar" },
          { label: "📍 Electronic City", action: "CHAT_LOCATION_Electronic City" },
          { label: "📍 HSR Layout", action: "CHAT_LOCATION_HSR Layout" }
        ];
      }
      const sorted = [...neighborhoods].sort((a, b) => (b.dailyOrders || b.daily_orders || 0) - (a.dailyOrders || a.daily_orders || 0));
      return sorted.slice(0, 5).map(n => {
        const name = n.neighborhood || n.name || "Zone";
        return { label: `📍 ${name}`, action: `CHAT_LOCATION_${name}` };
      });
    }, [neighborhoods, isDemoData]);

    const welcomeRegion = isDemoData
      ? "Welcome to the Bengaluru fulfillment intelligence console."
      : `Welcome to the Regional Logistics AI Copilot (${neighborhoods ? neighborhoods.length : 0} uploaded delivery zones).`;

    const [messages, setMessages] = React.useState([
      {
        id: "msg_init",
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `${welcomeRegion}\nLogistics intelligence for hub proximity, multi-hub SKU inventory, facility capacity & cost trade-offs.\n\n**Select a workflow or enter an operational query:**`,
        suggestedActions: [
          { label: "📍 Nearest Hub", action: "CHAT_ASK_LOCATION" },
          { label: "🏢 Hub Capacity", action: "CHAT_CAPACITY" },
          { label: "📦 Stock Inventory", action: "OPEN_INVENTORY_TABLE" },
          { label: "🔄 Rebalance Stock", action: "CHAT_REBALANCE" },
          { label: "⚡ Demand Shock", action: "OPEN_DEMAND_SHOCK" },
          { label: "💰 Cost & Savings", action: "CHAT_COST" },
          { label: "⭐ Rate & Review", action: "FEEDBACK_CAT_REVIEW" },
          { label: "🐛 Report Issue", action: "FEEDBACK_CAT_BUG" }
        ],
        feedbackState: null
      }
    ]);

    const [inputVal, setInputVal] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    const [copiedId, setCopiedId] = React.useState(null);
    const [starHover, setStarHover] = React.useState(0);
    const [submittedFeedbackId, setSubmittedFeedbackId] = React.useState(null);
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
            neighborhoods: (neighborhoods || []).slice(0, 60).map(n => ({
              name: n.neighborhood || n.name || "Zone",
              latitude: Number(n.latitude !== undefined ? n.latitude : n.lat),
              longitude: Number(n.longitude !== undefined ? n.longitude : (n.lon !== undefined ? n.lon : n.lng)),
              dailyOrders: Number(n.dailyOrders || n.daily_orders || n.dailyDemand || 100)
            })),
            isCustomUpload: !isDemoData,
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
          text: data.reply || "I've processed your telemetry request.",
          source: data.source || "ShelVO Operations AI",
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
            text: "### ⚠️ Operational Disconnect\nCould not communicate with the logistics server. Ensure the backend engine is running on port 3000.",
            suggestedActions: [
              { label: "🔄 Retry Nearest Hub", action: "CHAT_ASK_LOCATION" },
              { label: "📦 View Local Inventory", action: "OPEN_INVENTORY_TABLE" },
              { label: "🐛 Report Connection Bug", action: "FEEDBACK_CAT_BUG" }
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
            feedbackText: `Micro-feedback (${vote === "up" ? "👍 Positive" : "👎 Negative"}) on telemetry snippet: "${snippet}..."`
          })
        });
      } catch (e) {
        console.warn("Failed to record micro-feedback:", e);
      }
    };

    const handleStarRating = async (rating) => {
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "General Review",
            rating: rating,
            feedbackText: `User rated ShelVO AI ${rating} / 5 stars via in-chat rating console.`
          })
        });
        const data = await res.json();
        setSubmittedFeedbackId(data.id || "OK");
        sendMessage(`Rated ${rating} out of 5 stars. Thank you!`);
      } catch (e) {
        console.warn("Feedback rating error:", e);
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
            text: "Browser GPS geolocation is not supported in this environment. Please choose your delivery zone below:",
            suggestedActions: [
              { label: "📍 Retry GPS", action: "REQUEST_GEOLOCATION" },
              ...topAreaChips
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
                area: `GPS Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`
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
              text: "Location access was not granted. Please select your target delivery zone or type coordinates:",
              suggestedActions: [
                { label: "📍 Retry GPS", action: "REQUEST_GEOLOCATION" },
                ...topAreaChips
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
      } else if (action === "TRIGGER_OPTIMIZE" && onTriggerOptimization) {
        onTriggerOptimization();
      } else if (action === "REQUEST_GEOLOCATION") {
        requestUserGeolocation();
      } else if (action === "CHAT_ASK_LOCATION") {
        sendMessage("Which warehouse is nearest to me?");
      } else if (action && action.startsWith("CHAT_LOCATION_")) {
        const area = action.replace("CHAT_LOCATION_", "");
        sendMessage(`Find the closest warehouse to ${area}`);
      } else if (action === "FEEDBACK_CAT_BUG") {
        sendMessage("Report an issue: I noticed an unexpected behavior.");
      } else if (action === "FEEDBACK_CAT_FEATURE") {
        sendMessage("Suggest a feature: I would like to propose an enhancement.");
      } else if (action === "FEEDBACK_CAT_REVIEW") {
        sendMessage("Submit review: Share general feedback and ratings for ShelVO.");
      } else if (action === "CHAT_CAPACITY") {
        sendMessage("What is the current capacity and utilization of our fulfillment warehouses?");
      } else if (action === "CHAT_REBALANCE") {
        sendMessage("How can we rebalance stock between warehouses to prevent stockouts?");
      } else if (action === "CHAT_COST") {
        sendMessage("What are our daily delivery costs and savings compared to baseline?");
      } else {
        sendMessage(action);
      }
    };

    // Helper to format inline markdown formatting
    const formatInlineMarkdown = (text) => {
      if (!text) return text;
      const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return React.createElement("strong", { key: i, className: "text-[#F4F4F6] font-semibold" }, part.slice(2, -2));
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return React.createElement("em", { key: i, className: "text-white/60 italic" }, part.slice(1, -1));
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return React.createElement("code", { key: i, className: "px-1.5 py-0.5 bg-white/[0.08] text-[#D4A373] font-mono text-[11px] rounded border border-white/10" }, part.slice(1, -1));
        }
        return part;
      });
    };

    // Formatted markdown renderer with Swiss Editorial dark aesthetic
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
            React.createElement("div", {
              key: `tbl_${key}`,
              className: "my-2 overflow-x-auto rounded-lg border border-white/10 bg-[#090B0E]/80"
            },
              React.createElement("table", { className: "w-full text-left font-mono text-[11px]" },
                React.createElement("thead", { className: "bg-white/[0.04] border-b border-white/10 text-white/60 tracking-wider text-[10px] uppercase" },
                  React.createElement("tr", null,
                    tableHeader.map((th, i) => React.createElement("th", { key: i, className: "py-1.5 px-3 font-semibold text-white/70" }, th))
                  )
                ),
                React.createElement("tbody", { className: "divide-y divide-white/5" },
                  tableRows.map((row, rIdx) =>
                    React.createElement("tr", { key: rIdx, className: "hover:bg-white/[0.02] transition-colors" },
                      row.map((col, cIdx) => React.createElement("td", { key: cIdx, className: "py-1.5 px-3 text-white/90" }, formatInlineMarkdown(col)))
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
            tableRows.push(parts);
          }
          return;
        } else if (inTable) {
          flushTable(idx);
        }

        if (trimmed.startsWith("### ")) {
          elements.push(React.createElement("h4", {
            key: idx,
            className: "font-mono font-bold text-white text-xs uppercase tracking-wider mt-2 mb-1 flex items-center space-x-1.5 text-[#D4A373]"
          }, trimmed.replace("### ", "")));
        } else if (trimmed.startsWith("#### ")) {
          elements.push(React.createElement("h5", {
            key: idx,
            className: "font-mono text-white/80 text-[11px] uppercase tracking-wide mt-1.5 mb-0.5"
          }, trimmed.replace("#### ", "")));
        } else if (trimmed.startsWith("> [!")) {
          const isWarning = trimmed.includes("WARNING") || trimmed.includes("CAUTION");
          const alertColor = isWarning
            ? "border-[#EF4444] bg-[#EF4444]/10 text-red-200"
            : "border-[#D4A373] bg-[#D4A373]/10 text-[#FAEDCD]";
          elements.push(
            React.createElement("div", { key: idx, className: `p-2 my-1.5 rounded-r-lg border-l-2 text-xs font-mono ${alertColor}` },
              React.createElement("span", { className: "font-bold uppercase text-[9px] tracking-wider block opacity-75 mb-0.5" }, isWarning ? "ALERT" : "NOTE"),
              lines[idx + 1] ? lines[idx + 1].replace(/^>\s*/, "") : ""
            )
          );
        } else if (trimmed.startsWith("> ")) {
          if (lines[idx - 1] && lines[idx - 1].trim().startsWith("> [!")) return;
          elements.push(React.createElement("blockquote", {
            key: idx,
            className: "border-l-2 border-[#D4A373]/50 pl-2.5 my-1.5 text-xs text-white/60 italic bg-white/[0.02] py-0.5 rounded-r"
          }, trimmed.replace(/^>\s*/, "")));
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const textContent = trimmed.slice(2);
          elements.push(
            React.createElement("div", { key: idx, className: "flex items-start space-x-2 my-0.5 text-xs text-white/85" },
              React.createElement("span", { className: "text-[#D4A373] font-mono text-[10px] mt-0.5 flex-none" }, "◈"),
              React.createElement("span", { className: "flex-1 leading-relaxed" }, formatInlineMarkdown(textContent))
            )
          );
        } else if (/^\d+\.\s/.test(trimmed)) {
          elements.push(
            React.createElement("div", { key: idx, className: "flex items-start space-x-2 my-0.5 text-xs text-white/85" },
              React.createElement("span", { className: "font-mono font-bold text-[#D4A373] text-[11px] flex-none" }, trimmed.match(/^\d+\./)[0]),
              React.createElement("span", { className: "flex-1 leading-relaxed" }, formatInlineMarkdown(trimmed.replace(/^\d+\.\s*/, "")))
            )
          );
        } else if (trimmed.length > 0) {
          elements.push(React.createElement("p", {
            key: idx,
            className: "my-0.5 text-xs text-white/80 leading-relaxed font-sans"
          }, formatInlineMarkdown(trimmed)));
        }
      });

      if (inTable) flushTable(lines.length);
      return elements;
    };

    return React.createElement("div", {
      className: "fixed bottom-6 right-6 z-[99999] flex flex-col items-end pointer-events-auto select-none"
    },
      React.createElement("div", {
        className: "w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-48px)] bg-[#0F1218]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white font-sans transition-all duration-300 animate-in fade-in zoom-in-95",
        style: { boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(212, 163, 115, 0.1)" }
      },
        
        /*  1. Enterprise Header Bar with Glowing Indicator Pill & Star Rating  */
        React.createElement("div", {
          className: "px-3.5 py-3 border-b border-white/10 bg-[#161B22]/95 flex items-center justify-between flex-none backdrop-blur-md"
        },
          /* Brand Badge & Glowing Status Pill */
          React.createElement("div", { className: "flex items-center space-x-2.5 min-w-0" },
            React.createElement(ShelvoHeaderBadge, { size: 32 }),
            React.createElement("div", { className: "flex flex-col min-w-0" },
              React.createElement("div", { className: "flex items-center space-x-2" },
                React.createElement("span", { className: "font-mono font-bold text-xs tracking-wider uppercase text-white truncate" }, "SHELVO AI"),
                /* Glowing Indicator Pill */
                React.createElement("div", {
                  className: "inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono tracking-wider text-emerald-300 font-semibold select-none shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                },
                  React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]" }),
                  React.createElement("span", null, "COPILOT ACTIVE")
                )
              ),
              React.createElement("span", { className: "text-[10px] font-mono text-white/40 tracking-wider truncate mt-0.5" },
                isDemoData ? "BENGALURU LOGISTICS MESH" : ("REGIONAL MESH (" + (neighborhoods ? neighborhoods.length : 0) + " NODES)")
              )
            )
          ),

          /* Star Rating & Window Controls */
          React.createElement("div", { className: "flex items-center space-x-1 flex-none" },
            /* Streamlined Star Rating Bar in Header */
            React.createElement("div", {
              className: "flex items-center space-x-0.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#D4A373]/30 transition-colors mr-1",
              title: submittedFeedbackId ? "Feedback recorded ✓" : "Rate ShelVO Copilot"
            },
              [1, 2, 3, 4, 5].map((star) =>
                React.createElement("button", {
                  key: star,
                  type: "button",
                  onMouseEnter: () => setStarHover(star),
                  onMouseLeave: () => setStarHover(0),
                  onClick: () => handleStarRating(star),
                  className: "hover:scale-125 transition-transform text-xs cursor-pointer leading-none",
                  style: { color: (starHover >= star || (submittedFeedbackId && star <= 5)) ? "#D4A373" : "rgba(255,255,255,0.25)" },
                  title: `Rate ${star} Star${star > 1 ? 's' : ''}`
                }, "★")
              )
            ),
            onOpenInventory && React.createElement("button", {
              onClick: onOpenInventory,
              className: "px-2 py-1 text-[10px] font-mono text-white/60 hover:text-white hover:bg-white/[0.08] rounded border border-white/10 transition-colors mr-0.5",
              title: "Open Full Inventory Dossier"
            }, "DOSSIER"),
            React.createElement("button", {
              onClick: onClose,
              className: "w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors font-mono text-xs",
              title: "Minimize"
            }, "−"),
            React.createElement("button", {
              onClick: onClose,
              className: "w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors font-mono text-xs",
              title: "Close"
            }, "✕")
          )
        ),

        /*  2. Chat Stream Area  */
        React.createElement("div", {
          className: "flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#090B0E]/60 scroll-smooth"
        },
          messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return React.createElement("div", {
                key: msg.id,
                className: "flex justify-end ml-auto max-w-[85%]"
              },
                React.createElement("div", {
                  className: "px-3.5 py-2 bg-[#D4A373]/15 border border-[#D4A373]/35 text-[#FAEDCD] rounded-2xl rounded-br-xs text-xs leading-relaxed shadow-sm font-sans"
                },
                  renderFormattedText(msg.text)
                )
              );
            }

            // Assistant Message Bubble
            return React.createElement("div", {
              key: msg.id,
              className: "flex flex-col items-start max-w-[96%] space-y-1 w-full"
            },
              React.createElement("div", {
                className: "px-3.5 py-2.5 bg-[#161B22]/90 text-white/90 border border-white/10 rounded-2xl rounded-bl-xs text-xs leading-relaxed shadow-lg w-full"
              },
                renderFormattedText(msg.text),

                /*  Embedded Warehouse Capacity Telemetry Cards  */
                msg.capacityCards && msg.capacityCards.length > 0 && React.createElement("div", {
                  className: "mt-2.5 pt-2 border-t border-white/10 space-y-2"
                },
                  React.createElement("div", { className: "text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center justify-between" },
                    React.createElement("span", null, "FACILITY CAPACITY TELEMETRY"),
                    React.createElement("span", { className: "text-[#D4A373]" }, "REAL-TIME")
                  ),
                  msg.capacityCards.map((card, cIdx) =>
                    React.createElement("div", {
                      key: cIdx,
                      className: "p-2.5 bg-black/40 border border-white/10 rounded-lg space-y-1.5 font-mono text-[11px]"
                    },
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "font-bold text-white tracking-wide" }, `${card.code} • ${card.name}`),
                        React.createElement("span", {
                          className: "px-1.5 py-0.5 text-[9px] font-bold rounded uppercase",
                          style: {
                            color: card.statusColor || '#D4A373',
                            backgroundColor: `${card.statusColor || '#D4A373'}20`,
                            border: `1px solid ${card.statusColor || '#D4A373'}40`
                          }
                        }, card.status)
                      ),
                      React.createElement("div", { className: "flex justify-between text-[10px] text-white/50" },
                        React.createElement("span", null, `Throughput: ${card.dailyAssigned?.toLocaleString()} / ${card.dailyCapacity?.toLocaleString()} ord/day`),
                        React.createElement("span", { className: "font-bold text-[#D4A373]" }, `${card.utilizationPercent}%`)
                      ),
                      React.createElement("div", { className: "w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5" },
                        React.createElement("div", {
                          className: "h-full rounded-full transition-all duration-500",
                          style: {
                            width: `${Math.min(100, card.utilizationPercent)}%`,
                            backgroundColor: card.statusColor || '#D4A373'
                          }
                        })
                      )
                    )
                  )
                ),

                /*  1. Quick-Action Chip Matrix: Symmetrical 2-Column Responsive Grid  */
                msg.suggestedActions && msg.suggestedActions.length > 0 && React.createElement("div", {
                  className: "mt-2.5 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 w-full"
                },
                  msg.suggestedActions.map((act, actIdx) =>
                    React.createElement("button", {
                      key: actIdx,
                      onClick: () => handleActionClick(act.action),
                      className: `h-8 px-2.5 rounded-lg text-[11px] font-mono transition-all border flex items-center justify-start text-left truncate cursor-pointer group shadow-sm ${
                        act.label.includes("Bug") || act.label.includes("Issue")
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/25 hover:border-red-500/50"
                          : act.label.includes("Feature") || act.label.includes("Suggest")
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/25 hover:border-amber-500/50"
                          : act.label.includes("Review") || act.label.includes("Rate")
                          ? "bg-[#D4A373]/15 hover:bg-[#D4A373]/25 text-[#FAEDCD] border-[#D4A373]/30 hover:border-[#D4A373]/60"
                          : act.label.includes("Nearest") || act.label.includes("GPS")
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/25 hover:border-emerald-500/50"
                          : "bg-white/[0.03] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10 hover:border-[#D4A373]/40"
                      }`,
                      title: act.label
                    },
                      React.createElement("span", { className: "truncate" }, act.label)
                    )
                  )
                ),

                /*  3. Compact Action Bar: Micro-Feedback & Timestamp in Single Low-Opacity Row  */
                React.createElement("div", {
                  className: "flex items-center justify-end space-x-2 pt-2 mt-2 border-t border-white/5 text-[10px] font-mono text-white/40 opacity-50 hover:opacity-100 transition-opacity select-none"
                },
                  React.createElement("span", { className: "text-white/30 mr-auto text-[9px]" }, msg.timestamp),
                  React.createElement("button", {
                    onClick: () => handleCopy(msg.id, msg.text),
                    className: "hover:text-white transition-colors flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-white/[0.06] cursor-pointer",
                    title: "Copy analysis text"
                  },
                    React.createElement("span", null, copiedId === msg.id ? "✓" : "📋"),
                    React.createElement("span", { className: "text-[9px]" }, copiedId === msg.id ? "Copied" : "Copy")
                  ),
                  React.createElement("button", {
                    onClick: () => handleMicroFeedback(msg.id, "up"),
                    className: `hover:text-emerald-400 transition-colors flex items-center space-x-0.5 px-1 py-0.5 rounded hover:bg-white/[0.06] cursor-pointer ${msg.feedbackState === 'up' ? 'text-emerald-400 font-bold' : ''}`,
                    title: "Helpful response"
                  },
                    React.createElement("span", null, "👍")
                  ),
                  React.createElement("button", {
                    onClick: () => handleMicroFeedback(msg.id, "down"),
                    className: `hover:text-red-400 transition-colors flex items-center space-x-0.5 px-1 py-0.5 rounded hover:bg-white/[0.06] cursor-pointer ${msg.feedbackState === 'down' ? 'text-red-400 font-bold' : ''}`,
                    title: "Needs improvement"
                  },
                    React.createElement("span", null, "👎")
                  )
                )
              )
            );
          }),

          /*  Typing Telemetry Pulse  */
          isTyping && React.createElement("div", {
            className: "px-3.5 py-2 bg-[#161B22]/80 border border-white/10 rounded-2xl rounded-bl-xs text-xs text-white/50 inline-flex items-center space-x-2 font-mono"
          },
            React.createElement("span", null, "ShelVO is computing"),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#D4A373] animate-bounce", style: { animationDelay: "0ms" } }),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#D4A373] animate-bounce", style: { animationDelay: "150ms" } }),
            React.createElement("div", { className: "w-1 h-1 rounded-full bg-[#D4A373] animate-bounce", style: { animationDelay: "300ms" } })
          ),

          React.createElement("div", { ref: messagesEndRef })
        ),

        /*  4. Streamlined Input Bar: Sleek Unified Field & Submit Button  */
        React.createElement("div", {
          className: "p-3 border-t border-white/10 bg-[#0F1218]/95 flex-none backdrop-blur-md"
        },
          React.createElement("form", {
            onSubmit: (e) => {
              e.preventDefault();
              sendMessage();
            },
            className: "flex items-center space-x-2"
          },
            React.createElement("div", {
              className: "flex-1 flex items-center rounded-xl bg-slate-900/80 border border-slate-700/60 focus-within:border-[#D4A373]/80 focus-within:ring-1 focus-within:ring-[#D4A373]/20 px-3 py-2 transition-all shadow-inner"
            },
              React.createElement("button", {
                type: "button",
                onClick: () => handleActionClick("REQUEST_GEOLOCATION"),
                className: "text-white/40 hover:text-[#D4A373] transition-colors mr-2.5 text-xs flex-none cursor-pointer",
                title: "Share live device GPS location"
              }, "📍"),
              React.createElement("input", {
                ref: inputRef,
                type: "text",
                value: inputVal,
                onChange: (e) => setInputVal(e.target.value),
                placeholder: "Ask nearest hub, inventory, capacity, or feedback...",
                className: "flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/35 font-sans"
              })
            ),
            React.createElement("button", {
              type: "submit",
              disabled: !inputVal.trim() || isTyping,
              className: "h-9 px-3 rounded-xl bg-gradient-to-r from-[#D4A373] to-[#B88252] hover:from-[#E29578] hover:to-[#C69060] disabled:opacity-30 disabled:cursor-not-allowed text-[#090B0E] flex items-center justify-center space-x-1.5 transition-all flex-none font-mono text-xs font-semibold shadow-md cursor-pointer border border-[#D4A373]/40",
              title: "Transmit Query"
            },
              React.createElement("span", { className: "text-xs font-bold leading-none" }, "Send"),
              React.createElement("span", { className: "text-[10px] leading-none" }, "➤")
            )
          )
        )
      )
    );
  };

  // Luxury Circular Floating Launcher Button (Copper gradient with pulsing emerald status badge)
  window.GRIDPOINT_COMPONENTS.ChatbotFloatingButton = function({ isOpen, onClick }) {
    if (isOpen) return null;

    return React.createElement("button", {
      onClick: onClick,
      className: "group fixed bottom-6 right-6 z-[99999] w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 select-none cursor-pointer focus:outline-none border border-white/15",
      style: {
        background: "linear-gradient(135deg, #D4A373 0%, #B88252 100%)",
        boxShadow: "0 10px 30px -3px rgba(212, 163, 115, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.5)"
      },
      title: "Open ShelVO Operations AI Copilot"
    },
      React.createElement("div", { className: "relative flex items-center justify-center" },
        React.createElement(ShelvoGlyph, { size: 26, color: "#090B0E" }),
        React.createElement("span", {
          className: "absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#090B0E] shadow-sm animate-pulse"
        })
      )
    );
  };
})();
