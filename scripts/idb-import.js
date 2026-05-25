// Run this in Chrome DevTools Console on localhost:3000
// 1. Click the page to ensure focus, then paste
// 2. Select the exported JSON file when prompted
(async () => {
  const DB_NAME = "invoicelygg", DB_VERSION = 1;
  const stores = ["inv_invoices", "inv_images"];

  const file = await new Promise((res, rej) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => res(input.files[0]);
    input.click();
  });

  const text = await file.text();
  const data = JSON.parse(text);

  for (const store of stores) {
    if (!data[store]?.length) { console.log(`Skipping ${store} (empty)`); continue; }
    const items = data[store];

    // Parse string dates back to Date objects
    for (const item of items) {
      if (typeof item.createdAt === "string") item.createdAt = new Date(item.createdAt);
      if (typeof item.updatedAt === "string") item.updatedAt = new Date(item.updatedAt);
      if (item.paidAt && typeof item.paidAt === "string") item.paidAt = new Date(item.paidAt);
    }

    const db = await new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onerror = () => rej(r.error);
      r.onsuccess = () => res(r.result);
    });

    let added = 0, skipped = 0;
    for (const item of items) {
      const t = db.transaction(store, "readwrite");
      const existing = await new Promise((res) => {
        const req = t.objectStore(store).get(item.id);
        req.onsuccess = () => res(req.result);
      });
      if (existing) { skipped++; continue; }
      await new Promise((res, rej) => {
        const req = t.objectStore(store).add(item);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
      added++;
    }
    db.close();
    console.log(`Imported ${added} (skipped ${skipped} duplicates) into ${store}`);
  }
  console.log("Done!");
})();
