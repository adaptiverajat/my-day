const pdfParsePkg = require('pdf-parse');
const {
  extractInvoiceNumber,
  extractInvoiceDate,
  extractBilledTo,
  detectCityState,
  extractBooksSent,
  extractAmount
} = require('./invoiceExtractionHelper.cjs');

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

  result.invoice_number = extractInvoiceNumber(lines);
  result.invoice_date = extractInvoiceDate(lines);

  const billedTo = extractBilledTo(lines);
  result.title = billedTo.title;
  if (billedTo.address) result.address = billedTo.address;

  const detectedCity = detectCityState(text);
  if (detectedCity) {
    result.city = detectedCity.city;
    result.state = detectedCity.state;
    result.country = detectedCity.country;
  }

  result.books_sent = extractBooksSent(lines, text);
  result.amount = extractAmount(lines, text);

  if (/\b(?:paid|payment\s*received|cleared|settled)\b/i.test(text) && !/\b(?:unpaid|due|pending)\b/i.test(text)) {
    result.payment_received = true;
  }

  for (let i = 0; i < lines.length; i++) {
    const bookMatch = lines[i].match(/BOOK[-:\s]+([A-Za-z0-9\s]+?)(?:\s+\d{4}|\s+\d+\s+Pcs|$)/i);
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
