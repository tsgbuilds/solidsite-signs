import { openQuoteStore } from '../lib/quotes.mjs';
const store = openQuoteStore(process.env.DATA_DIR || './data');
try { console.log(JSON.stringify(store.list(1000), null, 2)); }
finally { store.close(); }
