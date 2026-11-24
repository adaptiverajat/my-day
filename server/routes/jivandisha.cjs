const express = require('express');
const router = express.Router();

// Mount modular sub-routers
router.use('/', require('./jivandishaLocations.cjs'));
router.use('/', require('./jivandishaInvoices.cjs'));
router.use('/', require('./jivandishaUploads.cjs'));
router.use('/', require('./jivandishaCollections.cjs'));

module.exports = router;
