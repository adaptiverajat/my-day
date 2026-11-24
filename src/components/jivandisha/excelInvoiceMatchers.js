export const locationMatchers = [
  (c) =>
    (c.includes('location') ||
      c.includes('center') ||
      c.includes('centre') ||
      c.includes('temple') ||
      c.includes('mandir') ||
      c.includes('destination') ||
      c.includes('customer') ||
      c.includes('client') ||
      c.includes('party') ||
      c.includes('account') ||
      c.includes('consignee') ||
      c.includes('shipto') ||
      c.includes('billto') ||
      c.includes('place') ||
      c.includes('store') ||
      c === 'name' ||
      c === 'title') &&
    !c.includes('contact') &&
    !c.includes('decision') &&
    !c.includes('phone') &&
    !c.includes('file') &&
    !c.includes('pdf') &&
    !c.includes('mail')
]

export const invoiceNoMatchers = [
  (c) =>
    c.includes('invoice') ||
    c.includes('inv') ||
    c.includes('bill') ||
    c.includes('order') ||
    c.includes('receipt') ||
    c.includes('voucher')
]

export const dateMatchers = [(c) => c.includes('date') || c.includes('dated') || c.includes('day')]

export const booksMatchers = [
  (c) =>
    c.includes('book') ||
    c.includes('qty') ||
    c.includes('quantity') ||
    c.includes('copies') ||
    c.includes('units') ||
    c.includes('count')
]

export const amountMatchers = [
  (c) =>
    c.includes('amount') ||
    c.includes('price') ||
    c.includes('total') ||
    c.includes('cost') ||
    c.includes('value') ||
    c.includes('val') ||
    c.includes('sum') ||
    c.includes('inr') ||
    c.includes('usd')
]

export const paymentMatchers = [
  (c) =>
    c.includes('payment') ||
    c.includes('paid') ||
    c.includes('paystatus') ||
    (c === 'status' && !c.includes('order'))
]

export const contactMatchers = [
  (c) =>
    (c.includes('contact') ||
      c.includes('decision') ||
      c.includes('person') ||
      c.includes('receiver') ||
      c.includes('recipient') ||
      c.includes('attn')) &&
    !c.includes('phone') &&
    !c.includes('mobile') &&
    !c.includes('tel') &&
    !c.includes('mail')
]

export const phoneMatchers = [
  (c) =>
    c.includes('phone') ||
    c.includes('mobile') ||
    c.includes('cell') ||
    c.includes('tel') ||
    c.includes('contactno')
]

export const notesMatchers = [
  (c) =>
    c.includes('note') ||
    c.includes('remark') ||
    c.includes('comment') ||
    c.includes('desc') ||
    c.includes('memo') ||
    c.includes('track')
]
