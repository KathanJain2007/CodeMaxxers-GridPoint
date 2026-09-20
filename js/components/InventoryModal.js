// GRIDPOINT — Enterprise Stock Inventory Dossier Modal
// Real-Time SKU Levels, Warehouse Buffer Distribution & Health Diagnostics

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.InventoryModal = function({
  warehouses,
  onClose,
  onOpenChatbot
}) {
  const [items, setItems] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setStats(data.stats || null);
        }
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const categories = React.useMemo(() => {
    const set = new Set();
    items.forEach(i => set.add(i.category));
    return ["ALL", ...Array.from(set)];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      const matchSearch = (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const exportCSV = () => {
    if (!items || items.length === 0) return;
    let csv = "SKU,Product Name,Category,Unit Cost (INR),Total On Hand,WH-01 Stock,WH-02 Stock,WH-03 Stock,Reorder Level,Status\n";
    items.forEach(i => {
      const wh1 = i.warehouseStock && i.warehouseStock["WH-01"] ? i.warehouseStock["WH-01"].onHand : 0;
      const wh2 = i.warehouseStock && i.warehouseStock["WH-02"] ? i.warehouseStock["WH-02"].onHand : 0;
      const wh3 = i.warehouseStock && i.warehouseStock["WH-03"] ? i.warehouseStock["WH-03"].onHand : 0;
      csv += `"${i.sku}","${i.name.replace(/"/g, '""')}","${i.category}",${i.unitCostInr},${i.totalOnHand},${wh1},${wh2},${wh3},${i.minReorderLevel},"${i.status}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GRIDPOINT_Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return React.createElement("div", {
    className: "fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
  },
    React.createElement("div", {
      className: "w-full max-w-5xl h-[88vh] bg-[#090B0E]/95 border border-white/20 shadow-2xl rounded-lg flex flex-col overflow-hidden text-white font-sans",
      style: { boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(212, 163, 115, 0.12)" }
    },
      
      /*  Top Header  */
      React.createElement("div", {
        className: "flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F1218]/90 select-none flex-none"
      },
        React.createElement("div", { className: "flex items-center space-x-3" },
          React.createElement("div", { className: "w-3 h-3 bg-[#D4A373] rotate-45" }),
          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center space-x-2" },
              React.createElement("span", { className: "font-mono text-sm tracking-[0.2em] uppercase font-bold text-white" }, "STOCK INVENTORY DOSSIER"),
              React.createElement("span", { className: "px-2 py-0.5 text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 rounded font-semibold uppercase" }, "LIVE REPOSITORY")
            ),
            React.createElement("span", { className: "text-[11px] font-mono text-white/40 tracking-wider block" }, "MULTI-HUB SKU ALLOCATION, SAFETY BUFFERS & BUFFER DIAGNOSTICS")
          )
        ),

        React.createElement("div", { className: "flex items-center space-x-3" },
          onOpenChatbot && React.createElement("button", {
            onClick: onOpenChatbot,
            className: "px-3 py-1.5 text-xs font-mono tracking-wider border border-[#D4A373]/50 hover:border-[#D4A373] text-[#D4A373] hover:text-white bg-[#D4A373]/10 hover:bg-[#D4A373]/20 rounded transition-all",
            title: "Ask ShelVO AI to analyze inventory"
          }, "◈ ASK ShelVO AI"),

          React.createElement("button", {
            onClick: exportCSV,
            className: "px-3 py-1.5 text-xs font-mono tracking-wider border border-white/20 hover:border-white/40 text-white bg-white/[0.04] hover:bg-white/[0.08] rounded transition-all"
          }, "↓ EXPORT CSV"),

          React.createElement("button", {
            onClick: onClose,
            className: "p-1.5 text-white/40 hover:text-white hover:bg-white/[0.08] rounded transition-all text-base font-mono",
            title: "Close"
          }, "✕")
        )
      ),

      /*  KPI Stats Bar  */
      stats ? React.createElement("div", {
        className: "grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-black/40 border-b border-white/5 flex-none text-xs font-mono"
      },
        React.createElement("div", { className: "p-2.5 bg-white/[0.02] border border-white/5 rounded" },
          React.createElement("span", { className: "text-white/40 uppercase text-[10px] block" }, "TOTAL CATALOG SKUS"),
          React.createElement("span", { className: "font-serif text-xl text-white font-bold" }, stats.totalSkus),
          React.createElement("span", { className: "text-white/30 text-[10px] block" }, "across 7 categories")
        ),
        React.createElement("div", { className: "p-2.5 bg-white/[0.02] border border-white/5 rounded" },
          React.createElement("span", { className: "text-white/40 uppercase text-[10px] block" }, "TOTAL UNITS ON HAND"),
          React.createElement("span", { className: "font-serif text-xl text-white font-bold" }, `${stats.totalUnitsOnHand?.toLocaleString()} units`),
          React.createElement("span", { className: "text-white/30 text-[10px] block" }, "3 fulfillment hubs")
        ),
        React.createElement("div", { className: "p-2.5 bg-white/[0.02] border border-white/5 rounded" },
          React.createElement("span", { className: "text-white/40 uppercase text-[10px] block" }, "TOTAL INVENTORY VALUE"),
          React.createElement("span", { className: "font-serif text-xl text-[#D4A373] font-bold" }, `₹${(stats.totalValuationInr / 10000000).toFixed(2)} Cr`),
          React.createElement("span", { className: "text-white/30 text-[10px] block" }, `₹${stats.totalValuationInr?.toLocaleString()}`)
        ),
        React.createElement("div", { className: "p-2.5 bg-white/[0.02] border border-white/5 rounded" },
          React.createElement("span", { className: "text-white/40 uppercase text-[10px] block" }, "ATTENTION ALERTS"),
          React.createElement("div", { className: "flex items-center space-x-2 mt-0.5" },
            React.createElement("span", { className: "px-1.5 py-0.5 bg-[#EF4444]/20 text-[#EF4444] rounded text-[11px] font-bold" }, `${stats.criticalStockCount} Critical`),
            React.createElement("span", { className: "px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded text-[11px] font-bold" }, `${stats.lowStockCount} Low Stock`)
          ),
          React.createElement("span", { className: "text-white/30 text-[10px] block mt-1" }, `${stats.healthyStockCount} SKUs Healthy`)
        )
      ) : null,

      /*  Filters & Search Control Row  */
      React.createElement("div", {
        className: "p-4 border-b border-white/10 bg-[#090B0E] flex flex-wrap items-center justify-between gap-3 flex-none text-xs font-mono"
      },
        React.createElement("div", { className: "flex-1 min-w-[240px]" },
          React.createElement("input", {
            type: "text",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: "Search by SKU, product name, or category...",
            className: "w-full px-3.5 py-2 bg-black/60 border border-white/15 focus:border-[#D4A373] text-white rounded outline-none placeholder:text-white/30 transition-all"
          })
        ),

        React.createElement("div", { className: "flex items-center space-x-2" },
          React.createElement("span", { className: "text-white/40 uppercase text-[10px]" }, "CATEGORY:"),
          React.createElement("select", {
            value: selectedCategory,
            onChange: (e) => setSelectedCategory(e.target.value),
            className: "px-3 py-2 bg-black/60 border border-white/15 focus:border-[#D4A373] text-white rounded outline-none transition-all"
          },
            categories.map(c => React.createElement("option", { key: c, value: c, className: "bg-[#0F1218]" }, c))
          )
        ),

        React.createElement("div", { className: "flex items-center space-x-2" },
          React.createElement("span", { className: "text-white/40 uppercase text-[10px]" }, "STATUS:"),
          React.createElement("select", {
            value: selectedStatus,
            onChange: (e) => setSelectedStatus(e.target.value),
            className: "px-3 py-2 bg-black/60 border border-white/15 focus:border-[#D4A373] text-white rounded outline-none transition-all"
          },
            ["ALL", "CRITICAL", "LOW STOCK", "OPTIMAL"].map(s => React.createElement("option", { key: s, value: s, className: "bg-[#0F1218]" }, s))
          )
        )
      ),

      /*  Main Inventory Table Viewport  */
      React.createElement("div", { className: "flex-1 overflow-auto font-mono text-xs" },
        loading ? React.createElement("div", { className: "flex items-center justify-center h-48 text-white/40 space-x-2" },
          React.createElement("div", { className: "w-2 h-2 rounded-full bg-[#D4A373] animate-ping" }),
          React.createElement("span", null, "Loading real-time SKU catalog...")
        ) : filteredItems.length === 0 ? React.createElement("div", { className: "flex flex-col items-center justify-center h-48 text-white/40 space-x-2" },
          React.createElement("span", { className: "text-lg" }, "📦"),
          React.createElement("span", { className: "mt-2" }, "No inventory items matching filter criteria.")
        ) : React.createElement("table", { className: "w-full text-left divide-y divide-white/10" },
          React.createElement("thead", { className: "bg-white/[0.04] text-[10px] uppercase text-white/60 tracking-wider sticky top-0 backdrop-blur-md" },
            React.createElement("tr", null,
              React.createElement("th", { className: "py-3 px-4" }, "SKU / Item Description"),
              React.createElement("th", { className: "py-3 px-3" }, "Category & Storage"),
              React.createElement("th", { className: "py-3 px-3 text-right" }, "Unit Cost"),
              React.createElement("th", { className: "py-3 px-3 text-center" }, "WH-01 (North)"),
              React.createElement("th", { className: "py-3 px-3 text-center" }, "WH-02 (East)"),
              React.createElement("th", { className: "py-3 px-3 text-center" }, "WH-03 (South)"),
              React.createElement("th", { className: "py-3 px-3 text-right" }, "Total Stock"),
              React.createElement("th", { className: "py-3 px-3 text-center" }, "Safety Level"),
              React.createElement("th", { className: "py-3 px-4 text-center" }, "Status")
            )
          ),
          React.createElement("tbody", { className: "divide-y divide-white/5" },
            filteredItems.map(item => {
              const wh1 = item.warehouseStock && item.warehouseStock["WH-01"];
              const wh2 = item.warehouseStock && item.warehouseStock["WH-02"];
              const wh3 = item.warehouseStock && item.warehouseStock["WH-03"];

              const statusBadgeClass = item.status === "CRITICAL"
                ? "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40"
                : item.status === "LOW STOCK"
                ? "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40"
                : "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40";

              return React.createElement("tr", { key: item.sku, className: "hover:bg-white/[0.02] transition-colors" },
                React.createElement("td", { className: "py-3 px-4 font-sans" },
                  React.createElement("div", { className: "font-mono font-bold text-[#D4A373] text-xs" }, item.sku),
                  React.createElement("div", { className: "text-white font-medium" }, item.name),
                  React.createElement("div", { className: "text-[10px] text-white/40 font-mono" }, `Valuation: ₹${item.totalValuationInr?.toLocaleString()}`)
                ),
                React.createElement("td", { className: "py-3 px-3 text-[11px]" },
                  React.createElement("div", { className: "text-white/80" }, item.category),
                  React.createElement("div", { className: "text-[10px] text-white/40" }, item.storageType)
                ),
                React.createElement("td", { className: "py-3 px-3 text-right text-white font-medium" },
                  `₹${item.unitCostInr?.toLocaleString()}`
                ),
                React.createElement("td", { className: "py-3 px-3 text-center text-[11px]" },
                  wh1 ? React.createElement("div", null,
                    React.createElement("span", { className: `font-bold ${wh1.onHand < item.minReorderLevel ? 'text-[#F59E0B]' : 'text-white'}` }, wh1.onHand),
                    React.createElement("span", { className: "text-white/30 text-[10px] block" }, wh1.bay)
                  ) : "—"
                ),
                React.createElement("td", { className: "py-3 px-3 text-center text-[11px]" },
                  wh2 ? React.createElement("div", null,
                    React.createElement("span", { className: `font-bold ${wh2.onHand < item.minReorderLevel ? 'text-[#F59E0B]' : 'text-white'}` }, wh2.onHand),
                    React.createElement("span", { className: "text-white/30 text-[10px] block" }, wh2.bay)
                  ) : "—"
                ),
                React.createElement("td", { className: "py-3 px-3 text-center text-[11px]" },
                  wh3 ? React.createElement("div", null,
                    React.createElement("span", { className: `font-bold ${wh3.onHand < item.minReorderLevel ? 'text-[#F59E0B]' : 'text-white'}` }, wh3.onHand),
                    React.createElement("span", { className: "text-white/30 text-[10px] block" }, wh3.bay)
                  ) : "—"
                ),
                React.createElement("td", { className: "py-3 px-3 text-right font-bold text-white" },
                  `${item.totalOnHand?.toLocaleString()} u`
                ),
                React.createElement("td", { className: "py-3 px-3 text-center text-white/50 text-[11px]" },
                  `${item.minReorderLevel} min`
                ),
                React.createElement("td", { className: "py-3 px-4 text-center" },
                  React.createElement("span", {
                    className: `px-2 py-0.5 text-[9px] font-bold border rounded uppercase ${statusBadgeClass}`
                  }, item.status)
                )
              );
            })
          )
        )
      ),

      /*  Bottom Status & Quick Action Bar  */
      React.createElement("div", {
        className: "px-6 py-3 border-t border-white/10 bg-[#0F1218]/90 flex items-center justify-between flex-none text-xs font-mono"
      },
        React.createElement("div", { className: "text-white/40 text-[11px]" },
          `Displaying ${filteredItems.length} of ${items.length} SKUs • Total Units: ${filteredItems.reduce((a, b) => a + b.totalOnHand, 0).toLocaleString()}`
        ),
        onOpenChatbot && React.createElement("button", {
          onClick: onOpenChatbot,
          className: "px-4 py-1.5 bg-[#D4A373] hover:bg-[#E29578] text-[#08090C] font-bold rounded transition-all flex items-center space-x-1.5"
        },
          React.createElement("span", null, "◈ REBALANCE STOCK VIA ShelVO AI"),
          React.createElement("span", null, "→")
        )
      )
    )
  );
};

