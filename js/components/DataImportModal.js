// SHELVO — Data Input & CSV Import Modal
// Supports Drag & Drop CSV upload, Manual neighborhood entry, Demo dataset loading, and live preview.

window.GRIDPOINT_COMPONENTS = window.GRIDPOINT_COMPONENTS || {};

window.GRIDPOINT_COMPONENTS.DataImportModal = function({
  currentData,
  onSaveData,
  onLoadDemo,
  onClose
}) {
  const [activeTab, setActiveTab] = React.useState('upload'); // 'upload' | 'manual' | 'demo'
  const [previewData, setPreviewData] = React.useState(currentData || []);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [warningMessage, setWarningMessage] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Manual entry form state
  const [manualRows, setManualRows] = React.useState(
    currentData && currentData.length > 0
      ? currentData
      : [
          { neighborhood: "Koramangala", latitude: 12.9352, longitude: 77.6245, dailyOrders: 450 },
          { neighborhood: "Indiranagar", latitude: 12.9719, longitude: 77.6412, dailyOrders: 300 },
          { neighborhood: "HSR Layout", latitude: 12.9116, longitude: 77.6741, dailyOrders: 250 }
        ]
  );

  // Handle CSV file
  const handleFile = (file) => {
    if (!file) return;
    setErrorMessage(null);
    setWarningMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = window.GRIDPOINT_DATA.parseDemandCSV(text);
      if (parsed.success) {
        setPreviewData(parsed.data);
        setManualRows(parsed.data);
        if (parsed.warnings && parsed.warnings.length > 0) {
          setWarningMessage(parsed.warnings.join('; '));
        }
      } else {
        setErrorMessage(parsed.error);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read file from disk.");
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Add row to manual table
  const addManualRow = () => {
    setManualRows([
      ...manualRows,
      { neighborhood: `Zone ${manualRows.length + 1}`, latitude: 12.95, longitude: 77.60, dailyOrders: 300 }
    ]);
  };

  // Update manual row
  const updateManualRow = (index, field, value) => {
    const updated = [...manualRows];
    updated[index] = {
      ...updated[index],
      [field]: field === 'neighborhood' ? value : parseFloat(value) || 0
    };
    setManualRows(updated);
    setPreviewData(updated);
  };

  // Remove manual row
  const removeManualRow = (index) => {
    const updated = manualRows.filter((_, i) => i !== index);
    setManualRows(updated);
    setPreviewData(updated);
  };

  // Download Sample CSV
  const downloadSampleCSV = () => {
    const sample = window.GRIDPOINT_DATA.exportCSV(window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA);
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_demand_bengaluru.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commit and save data
  const handleApply = () => {
    const targetData = activeTab === 'manual' ? manualRows : previewData;
    if (!targetData || targetData.length === 0) {
      setErrorMessage("No valid demand records to apply.");
      return;
    }
    onSaveData(targetData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08090C]/95 backdrop-blur-xl flex flex-col overflow-y-auto text-[#F4F4F6]">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B0D11]/80 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-2.5 h-2.5 bg-[#D4A373] rotate-45"></div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-white font-semibold">
            IMPORT DEMAND DATASET
          </span>
          <span className="text-white/20 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#8E96A4]">
            SPATIAL VECTOR INGESTION
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white font-mono text-xs border border-white/10 hover:border-white/30"
        >
          ESC ✕
        </button>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 space-y-8">
        
        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-[#D4A373] text-[#090B0E] font-semibold'
                : 'text-white/60 hover:text-white bg-white/[0.02]'
            }`}
          >
            1. UPLOAD CSV FILE
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setPreviewData(manualRows);
            }}
            className={`px-4 py-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-[#D4A373] text-[#090B0E] font-semibold'
                : 'text-white/60 hover:text-white bg-white/[0.02]'
            }`}
          >
            2. ENTER MANUALLY
          </button>
          <button
            onClick={() => {
              setActiveTab('demo');
              setPreviewData(window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA);
              setManualRows(window.GRIDPOINT_DATA.BENGALURU_DEMO_DATA);
            }}
            className={`px-4 py-2 transition-all ${
              activeTab === 'demo'
                ? 'bg-[#D4A373] text-[#090B0E] font-semibold'
                : 'text-white/60 hover:text-white bg-white/[0.02]'
            }`}
          >
            3. LOAD BENGALURU DEMO
          </button>
        </div>

        {/* Error / Warning Alert */}
        {errorMessage && (
          <div className="p-4 bg-[#EF4444]/15 border border-[#EF4444]/40 font-mono text-xs text-[#EF4444]">
            ⚠️ ERROR: {errorMessage}
          </div>
        )}
        {warningMessage && (
          <div className="p-4 bg-[#F59E0B]/15 border border-[#F59E0B]/40 font-mono text-xs text-[#F59E0B]">
            ⚠️ WARNING: {warningMessage}
          </div>
        )}

        {/* TAB 1: CSV Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[#D4A373] bg-[#D4A373]/10'
                  : 'border-white/15 hover:border-white/30 bg-white/[0.01]'
              }`}
              onClick={() => document.getElementById('csvFileInput').click()}
            >
              <input
                id="csvFileInput"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              
              <div className="w-12 h-12 mx-auto mb-4 border border-white/20 bg-white/[0.03] flex items-center justify-center rotate-45">
                <span className="font-mono text-lg text-[#D4A373] -rotate-45">↑</span>
              </div>

              <div className="font-serif text-2xl text-white mb-1">
                Drop CSV Demand File Here
              </div>
              <p className="text-xs text-[#8E96A4] font-mono mb-4">
                Required Columns: Neighborhood, Latitude, Longitude, Daily Orders
              </p>

              <button
                type="button"
                className="px-4 py-2 border border-white/20 text-xs font-mono text-white/80 hover:text-white bg-white/[0.03]"
              >
                BROWSE FILES
              </button>
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-white/50">
              <span>Need a reference format?</span>
              <button
                onClick={downloadSampleCSV}
                className="text-[#D4A373] hover:underline flex items-center space-x-1"
              >
                <span>↓ Download sample_demand_bengaluru.csv</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Manual Entry */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-white/60">
                EDIT NEIGHBORHOOD COORDINATES & VOLUMES
              </span>
              <button
                onClick={addManualRow}
                className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 font-mono text-xs text-white"
              >
                + ADD NEIGHBORHOOD
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto border border-white/10">
              <table className="w-full text-left swiss-table">
                <thead>
                  <tr>
                    <th>NEIGHBORHOOD NAME</th>
                    <th>LATITUDE</th>
                    <th>LONGITUDE</th>
                    <th>DAILY ORDERS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          value={row.neighborhood}
                          onChange={(e) => updateManualRow(idx, 'neighborhood', e.target.value)}
                          className="bg-transparent border-b border-white/20 text-white font-mono text-xs px-1 py-0.5 focus:border-[#D4A373] outline-none w-full"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          value={row.latitude}
                          onChange={(e) => updateManualRow(idx, 'latitude', e.target.value)}
                          className="bg-transparent border-b border-white/20 text-white font-mono text-xs px-1 py-0.5 focus:border-[#D4A373] outline-none w-24"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          value={row.longitude}
                          onChange={(e) => updateManualRow(idx, 'longitude', e.target.value)}
                          className="bg-transparent border-b border-white/20 text-white font-mono text-xs px-1 py-0.5 focus:border-[#D4A373] outline-none w-24"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.dailyOrders}
                          onChange={(e) => updateManualRow(idx, 'dailyOrders', e.target.value)}
                          className="bg-transparent border-b border-white/20 text-white font-mono text-xs px-1 py-0.5 focus:border-[#D4A373] outline-none w-24"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => removeManualRow(idx)}
                          className="text-[#EF4444] font-mono text-xs hover:underline"
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Demo Dataset Previews */}
        {activeTab === 'demo' && (
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-[#D4A373] tracking-wider uppercase">
                  READY-TO-RUN DATASET
                </div>
                <h4 className="font-serif text-2xl text-white mt-1">
                  Bengaluru Metropolitan Demand (28 Micro-Markets)
                </h4>
              </div>
              <span className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] font-mono text-xs">
                VERIFIED HIGH-FIDELITY
              </span>
            </div>

            <p className="text-xs text-[#8E96A4] leading-relaxed">
              Spans major e-commerce demand drivers including Koramangala (580 orders), Whitefield (640 orders), Indiranagar (520 orders), Electronic City (510 orders), and residential hubs from Yelahanka to Kengeri. Total daily demand: ~11,200 orders.
            </p>
          </div>
        )}

        {/* Dataset Preview Section */}
        {previewData && previewData.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex justify-between items-baseline font-mono text-xs">
              <span className="text-white/60 uppercase">
                DATASET PREVIEW ({previewData.length} LOCATIONS LOADED)
              </span>
              <span className="text-[#D4A373]">
                TOTAL DEMAND: {previewData.reduce((acc, d) => acc + (parseFloat(d.dailyOrders) || 0), 0).toLocaleString()} ORDERS/DAY
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto border border-white/10">
              <table className="w-full text-left swiss-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>NEIGHBORHOOD</th>
                    <th>COORDINATES</th>
                    <th>DAILY ORDERS</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-white/40">{idx + 1}</td>
                      <td className="font-medium text-white">{row.neighborhood}</td>
                      <td className="font-mono text-white/70">
                        {parseFloat(row.latitude).toFixed(4)}°, {parseFloat(row.longitude).toFixed(4)}°
                      </td>
                      <td className="font-mono text-[#D4A373] font-semibold">
                        {parseInt(row.dailyOrders, 10).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 10 && (
              <div className="text-[11px] font-mono text-white/40 text-center">
                + {previewData.length - 10} additional neighborhoods loaded in buffer
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-white/15 text-white/70 hover:text-white font-mono text-xs uppercase"
          >
            CANCEL
          </button>

          <button
            onClick={handleApply}
            className="px-8 py-3.5 bg-[#D4A373] hover:bg-[#E29578] text-[#090B0E] font-medium font-mono text-xs tracking-widest uppercase transition-all shadow-lg"
          >
            SAVE & APPLY DEMAND DATA
          </button>
        </div>

      </div>

    </div>
  );
};
