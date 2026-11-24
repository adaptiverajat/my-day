const pdfParsePkg = require('pdf-parse');

// Comprehensive city-state reference for auto-detection in invoices
const CITIES_REF = [
  // India
  { city: 'Chennai', state: 'Tamil Nadu', country: 'IN' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'IN' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'IN' },
  { city: 'Bangalore', state: 'Karnataka', country: 'IN' },
  { city: 'New Delhi', state: 'Delhi', country: 'IN' },
  { city: 'Delhi', state: 'Delhi', country: 'IN' },
  { city: 'Hyderabad', state: 'Telangana', country: 'IN' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'IN' },
  { city: 'Kolkata', state: 'West Bengal', country: 'IN' },
  { city: 'Surat', state: 'Gujarat', country: 'IN' },
  { city: 'Pune', state: 'Maharashtra', country: 'IN' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'IN' },
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Kanpur', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Nagpur', state: 'Maharashtra', country: 'IN' },
  { city: 'Indore', state: 'Madhya Pradesh', country: 'IN' },
  { city: 'Thane', state: 'Maharashtra', country: 'IN' },
  { city: 'Bhopal', state: 'Madhya Pradesh', country: 'IN' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'IN' },
  { city: 'Patna', state: 'Bihar', country: 'IN' },
  { city: 'Vadodara', state: 'Gujarat', country: 'IN' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Ludhiana', state: 'Punjab', country: 'IN' },
  { city: 'Agra', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Nashik', state: 'Maharashtra', country: 'IN' },
  { city: 'Faridabad', state: 'Haryana', country: 'IN' },
  { city: 'Meerut', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Rajkot', state: 'Gujarat', country: 'IN' },
  { city: 'Varanasi', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Amritsar', state: 'Punjab', country: 'IN' },
  { city: 'Navi Mumbai', state: 'Maharashtra', country: 'IN' },
  { city: 'Prayagraj', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Allahabad', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Ranchi', state: 'Jharkhand', country: 'IN' },
  { city: 'Coimbatore', state: 'Tamil Nadu', country: 'IN' },
  { city: 'Chandigarh', state: 'Chandigarh', country: 'IN' },
  { city: 'Mysuru', state: 'Karnataka', country: 'IN' },
  { city: 'Mysore', state: 'Karnataka', country: 'IN' },
  { city: 'Gurugram', state: 'Haryana', country: 'IN' },
  { city: 'Gurgaon', state: 'Haryana', country: 'IN' },
  { city: 'Noida', state: 'Uttar Pradesh', country: 'IN' },
  { city: 'Kochi', state: 'Kerala', country: 'IN' },
  { city: 'Cochin', state: 'Kerala', country: 'IN' },
  { city: 'Dehradun', state: 'Uttarakhand', country: 'IN' },
  { city: 'Panaji', state: 'Goa', country: 'IN' },
  { city: 'Guwahati', state: 'Assam', country: 'IN' },
  { city: 'Bhubaneswar', state: 'Odisha', country: 'IN' },
  { city: 'Madurai', state: 'Tamil Nadu', country: 'IN' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'IN' },
  { city: 'Salem', state: 'Tamil Nadu', country: 'IN' },

  // USA
  { city: 'New York', state: 'New York', country: 'US' },
  { city: 'Los Angeles', state: 'California', country: 'US' },
  { city: 'Chicago', state: 'Illinois', country: 'US' },
  { city: 'Houston', state: 'Texas', country: 'US' },
  { city: 'Phoenix', state: 'Arizona', country: 'US' },
  { city: 'Philadelphia', state: 'Pennsylvania', country: 'US' },
  { city: 'San Antonio', state: 'Texas', country: 'US' },
  { city: 'San Diego', state: 'California', country: 'US' },
  { city: 'Dallas', state: 'Texas', country: 'US' },
  { city: 'San Jose', state: 'California', country: 'US' },
  { city: 'Austin', state: 'Texas', country: 'US' },
  { city: 'Jacksonville', state: 'Florida', country: 'US' },
  { city: 'San Francisco', state: 'California', country: 'US' },
  { city: 'Columbus', state: 'Ohio', country: 'US' },
  { city: 'Seattle', state: 'Washington', country: 'US' },
  { city: 'Denver', state: 'Colorado', country: 'US' },
  { city: 'Boston', state: 'Massachusetts', country: 'US' },
  { city: 'Nashville', state: 'Tennessee', country: 'US' },
  { city: 'Las Vegas', state: 'Nevada', country: 'US' },
  { city: 'Atlanta', state: 'Georgia', country: 'US' },
  { city: 'Miami', state: 'Florida', country: 'US' }
];

function normalizeDate(raw) {
  if (!raw) return '';
  const str = raw.trim().replace(/,/g, '');

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const p1 = parseInt(dmy[1], 10);
    const p2 = parseInt(dmy[2], 10);
    if (p1 > 12) {
      return `${dmy[3]}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    return `${dmy[3]}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
  }

  // Try parsing textual date like "15 Nov 2026" or "November 15 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function parseInvoiceText(text, defaultCountry = 'IN') {
  const result = {
    title: '',
    country: defaultCountry,
    city: '',
    state: '',
    address: '',
    books_sent: 0,
    invoice_date: '',
    invoice_number: '',
    amount: null,
    payment_received: false,
    decision_maker_name: '',
    decision_maker_phone: '',
    inventory_keeper_name: '',
    inventory_keeper_phone: '',
    contact_email: '',
    notes: ''
  };

  if (!text) return result;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Invoice Number (Priority: "INVOICE NO : JD20260611002", "INVOICE #INV-2026-999")
  for (const line of lines) {
    const invMatch = line.match(/\b(?:INVOICE\s*(?:NO\.?|#|NUM(?:BER)?)?|INV\s*(?:NO\.?|#)?)\s*[:#\s-]*\s*([A-Za-z0-9][A-Za-z0-9\-_/]{2,})/i);
    if (invMatch && invMatch[1]) {
      const val = invMatch[1].trim();
      if (!/^(date|total|tax|bill|due|reverse|charge)/i.test(val)) {
        result.invoice_number = val;
        break;
      }
    }
  }

  // Fallback Invoice Number
  if (!result.invoice_number) {
    for (const line of lines) {
      if (/e-way\s*bill/i.test(line)) continue;
      const m = line.match(/\b(?:Bill\s*(?:No\.?|#)|Ref\s*(?:No\.?|#))[:\s#]+([A-Za-z0-9\-_/]{3,})/i);
      if (m && m[1] && !/^(reverse|date|total)/i.test(m[1])) {
        result.invoice_number = m[1].trim();
        break;
      }
    }
  }

  // 2. Invoice Date (e.g. "Dated : 06-11-2026")
  for (const line of lines) {
    const dateMatch = line.match(/\b(?:Dated|Date\s*of\s*issue|Invoice\s*Date|Bill\s*Date|Date)\s*[:\s]+(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
    if (dateMatch && dateMatch[1]) {
      const norm = normalizeDate(dateMatch[1]);
      if (norm) {
        result.invoice_date = norm;
        break;
      }
    }
  }

  // 3. Customer / Destination Title (e.g. "Billed to : \n ISKCON Chennai,", "To: Hare Krishna Temple")
  const billedToRegex = /\b(?:billed\s*to|bill\s*to|sold\s*to|customer|buyer|consignee|ship\s*to|invoice\s*to|deliver\s*to|to|m\/s\.?)\s*[:\s]*/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (billedToRegex.test(line)) {
      const remainder = line.replace(billedToRegex, '').trim().replace(/[,.]+$/, '');
      if (remainder && remainder.length > 2 && !/^(address|name|attn)/i.test(remainder)) {
        result.title = remainder;
      } else if (i + 1 < lines.length) {
        result.title = lines[i + 1].trim().replace(/[,.]+$/, '');
        // Address line is next
        if (i + 2 < lines.length) {
          result.address = lines[i + 2].trim().replace(/[,.]+$/, '');
        }
      }
      break;
    }
  }

  // 4. City and State Detection via Reference Dictionary
  const customerText = text.replace(/Jivan\s*Disha\s*Proprietorship[\s\S]*?Undri,\s*Pune/i, '');
  for (const ref of CITIES_REF) {
    const cityWordRegex = new RegExp(`\\b${ref.city}\\b`, 'i');
    if (cityWordRegex.test(customerText)) {
      result.city = ref.city;
      result.state = ref.state;
      result.country = ref.country;
      break;
    }
  }
  // Fallback city check
  if (!result.city) {
    for (const ref of CITIES_REF) {
      if (ref.city === 'Pune') continue;
      const cityWordRegex = new RegExp(`\\b${ref.city}\\b`, 'i');
      if (cityWordRegex.test(text)) {
        result.city = ref.city;
        result.state = ref.state;
        result.country = ref.country;
        break;
      }
    }
  }

  // 5. Books Sent (Quantity)
  for (const line of lines) {
    const qtyMatch = line.match(/\b(?:Grand\s*Total|Total\s*Qty|Total\s*Items)?\s*(\d+)\s*(?:Pcs|Books|Units|Copies|Nos)\b/i);
    if (qtyMatch && qtyMatch[1]) {
      result.books_sent = parseInt(qtyMatch[1], 10);
      if (line.toLowerCase().includes('grand total')) break;
    }
  }
  if (!result.books_sent) {
    const pcsMatch = text.match(/\b(\d+)\s*(?:Pcs|Books|Units|Copies|Nos)\b/i);
    if (pcsMatch) result.books_sent = parseInt(pcsMatch[1], 10);
  }

  // 6. Net Amount / Grand Total
  let foundAmount = null;
  for (const line of lines) {
    if (/Grand\s*Total/i.test(line)) {
      const nums = [...line.matchAll(/\b([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\b/g)];
      if (nums.length > 0) {
        const lastNum = parseFloat(nums[nums.length - 1][1].replace(/,/g, ''));
        if (!isNaN(lastNum) && lastNum > 100) {
          foundAmount = lastNum;
        }
      }
    }
  }
  if (!foundAmount) {
    const amtMatch = text.match(/(?:Total|Amount|Net\s*Payable)[:\s]*(?:₹|\$|usd|inr|rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
    if (amtMatch) foundAmount = parseFloat(amtMatch[1].replace(/,/g, ''));
  }
  result.amount = foundAmount;

  // 7. Payment Status
  if (/\b(?:paid|payment\s*received|cleared|settled)\b/i.test(text) && !/\b(?:unpaid|due|pending)\b/i.test(text)) {
    result.payment_received = true;
  }

  // 8. Book description & Author / Decision Maker
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bookMatch = line.match(/BOOK[-:\s]+([A-Za-z0-9\s]+?)(?:\s+\d{4}|\s+\d+\s+Pcs|$)/i);
    if (bookMatch && bookMatch[1]) {
      const bookName = bookMatch[1].trim();
      let author = '';
      if (i + 1 < lines.length && !lines[i + 1].includes('Grand Total') && !lines[i + 1].includes('Wholesale')) {
        author = lines[i + 1].trim();
        result.decision_maker_name = author;
      }
      result.notes = `Book: ${bookName}${author ? ' (' + author + ')' : ''}${result.invoice_number ? ' | Inv #' + result.invoice_number : ''}${result.amount ? ' | ₹ ' + result.amount : ''}`;
      break;
    }
  }

  // 9. Attn / Decision Maker / Contact person if not set
  if (!result.decision_maker_name) {
    const attnRegex = /(?:attn|attention|kind\s*attn|decision\s*maker|contact(?:\s*person)?|owner)[:\s]+([^\n\r,(]+)/i;
    for (const line of lines) {
      if (/owner\.jivandisha/i.test(line)) continue;
      const m = line.match(attnRegex);
      if (m && m[1]) {
        result.decision_maker_name = m[1].trim();
        break;
      }
    }
  }

  // 10. Phone number extraction
  if (!result.decision_maker_phone) {
    const phoneMatch = text.match(/(?:phone|mobile|tel|cell|call)[:\s]*([+0-9()\s-]{7,20})/i) ||
                       text.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    if (phoneMatch) {
      const cleanPhone = phoneMatch[1] ? phoneMatch[1].trim() : phoneMatch[0].trim();
      if (cleanPhone.length >= 7 && !/undri|pune/i.test(cleanPhone)) {
        result.decision_maker_phone = cleanPhone;
      }
    }
  }

  // Fallback notes if not set
  if (!result.notes) {
    const notesParts = [];
    if (result.invoice_number) notesParts.push(`Invoice #${result.invoice_number}`);
    if (result.amount) notesParts.push(`Amount: ₹ ${result.amount}`);
    result.notes = notesParts.join(' | ');
  }

  return result;
}

async function extractFromPdfBuffer(pdfBuffer, defaultCountry = 'IN') {
  try {
    let text = '';
    // Support pdf-parse v2 class API
    if (pdfParsePkg && typeof pdfParsePkg.PDFParse === 'function') {
      const parser = new pdfParsePkg.PDFParse(new Uint8Array(pdfBuffer));
      const res = await parser.getText();
      text = res.text || String(res);
    } else if (typeof pdfParsePkg === 'function') {
      const data = await pdfParsePkg(pdfBuffer);
      text = data.text || String(data);
    } else if (pdfParsePkg && typeof pdfParsePkg.default === 'function') {
      const data = await pdfParsePkg.default(pdfBuffer);
      text = data.text || String(data);
    } else {
      throw new Error('Unsupported pdf-parse version API');
    }

    const parsed = parseInvoiceText(text, defaultCountry);
    return {
      success: true,
      data: parsed,
      rawText: text.slice(0, 500)
    };
  } catch (err) {
    console.error('pdf-parse error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  extractFromPdfBuffer,
  parseInvoiceText
};
