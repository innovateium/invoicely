// Run this in Chrome DevTools Console on invoicely.gg
(async () => {
  const DB_NAME = "invoicelygg", DB_VERSION = 1;
  const stores = ["inv_invoices", "inv_images"];

  const db = await new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onerror = () => rej(r.error);
    r.onsuccess = () => res(r.result);
  });

  const data = {};
  for (const store of stores) {
    data[store] = await new Promise((res, rej) => {
      const t = db.transaction(store, "readonly");
      const req = t.objectStore(store).getAll();
      req.onerror = () => rej(req.error);
      req.onsuccess = () => res(req.result);
    });
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `invoicely-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  console.log("Exported:", data.inv_invoices.length, "invoices,", data.inv_images.length, "images");
})();
