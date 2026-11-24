const { CITIES_REF } = require('./invoiceCitiesRef.cjs');

function normalizeDate(raw) {
  if (!raw) return '';
  const str = raw.trim().replace(/,/g, '');

  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const p1 = parseInt(dmy[1], 10);
    const p2 = parseInt(dmy[2], 10);
    return `${dmy[3]}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function extractInvoiceNumber(lines) {
  for (const line of lines) {
    const invMatch = line.match(/\b(?:INVOICE\s*(?:NO\.?|#|NUM(?:BER)?)?|INV\s*(?:NO\.?|#)?)\s*[:#\s-]*\s*([A-Za-z0-9][A-Za-z0-9\-_/]{2,})/i);
    if (invMatch && invMatch[1]) {
      const val = invMatch[1].trim();
      if (!/^(date|total|tax|bill|due|reverse|charge)/i.test(val)) {
        return val;
      }
    }
  }

  for (const line of lines) {
    if (/e-way\s*bill/i.test(line)) continue;
    const m = line.match(/\b(?:Bill\s*(?:No\.?|#)|Ref\s*(?:No\.?|#))[:\s#]+([A-Za-z0-9\-_/]{3,})/i);
    if (m && m[1] && !/^(reverse|date|total)/i.test(m[1])) {
      return m[1].trim();
    }
  }
  return '';
}

function extractInvoiceDate(lines) {
  for (const line of lines) {
    const dateMatch = line.match(/\b(?:Dated|Date\s*of\s*issue|Invoice\s*Date|Bill\s*Date|Date)\s*[:\s]+(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
    if (dateMatch && dateMatch[1]) {
      const norm = normalizeDate(dateMatch[1]);
      if (norm) return norm;
    }
  }
  return '';
}

function extractBilledTo(lines) {
  const billedToRegex = /\b(?:billed\s*to|bill\s*to|sold\s*to|customer|buyer|consignee|ship\s*to|invoice\s*to|deliver\s*to|to|m\/s\.?)\s*[:\s]*/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (billedToRegex.test(line)) {
      const remainder = line.replace(billedToRegex, '').trim().replace(/[,.]+$/, '');
      if (remainder && remainder.length > 2 && !/^(address|name|attn)/i.test(remainder)) {
        return { title: remainder, address: '' };
      }
      if (i + 1 < lines.length) {
        const title = lines[i + 1].trim().replace(/[,.]+$/, '');
        const address = (i + 2 < lines.length) ? lines[i + 2].trim().replace(/[,.]+$/, '') : '';
        return { title, address };
      }
      break;
    }
  }
  return { title: '', address: '' };
}

function detectCityState(text) {
  const customerText = text.replace(/Jivan\s*Disha\s*Proprietorship[\s\S]*?Undri,\s*Pune/i, '');
  for (const ref of CITIES_REF) {
    if (new RegExp(`\\b${ref.city}\\b`, 'i').test(customerText)) {
      return ref;
    }
  }
  for (const ref of CITIES_REF) {
    if (ref.city === 'Pune') continue;
    if (new RegExp(`\\b${ref.city}\\b`, 'i').test(text)) {
      return ref;
    }
  }
  return null;
}

function extractBooksSent(lines, text) {
  for (const line of lines) {
    const qtyMatch = line.match(/\b(?:Grand\s*Total|Total\s*Qty|Total\s*Items)?\s*(\d+)\s*(?:Pcs|Books|Units|Copies|Nos)\b/i);
    if (qtyMatch && qtyMatch[1]) {
      return parseInt(qtyMatch[1], 10);
    }
  }
  const pcsMatch = text.match(/\b(\d+)\s*(?:Pcs|Books|Units|Copies|Nos)\b/i);
  return pcsMatch ? parseInt(pcsMatch[1], 10) : 0;
}

function extractAmount(lines, text) {
  for (const line of lines) {
    if (/Grand\s*Total/i.test(line)) {
      const nums = [...line.matchAll(/\b([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\b/g)];
      if (nums.length > 0) {
        const lastNum = parseFloat(nums[nums.length - 1][1].replace(/,/g, ''));
        if (!isNaN(lastNum) && lastNum > 100) return lastNum;
      }
    }
  }
  const amtMatch = text.match(/(?:Total|Amount|Net\s*Payable)[:\s]*(?:₹|\$|usd|inr|rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  return amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null;
}

module.exports = {
  normalizeDate,
  extractInvoiceNumber,
  extractInvoiceDate,
  extractBilledTo,
  detectCityState,
  extractBooksSent,
  extractAmount
};
