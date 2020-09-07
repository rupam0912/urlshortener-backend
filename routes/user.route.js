const express = require('express');
const router = express.Router();

// import controller
const { adminMiddleware } = require('../controllers/auth.controller');
const { readController, updateController, getShortUrl, saveUrl, fetchUrls, deleteUrl, adminData } = require('../controllers/user.controller');

router.get('/user/:id',readController);
router.put('/user/update', updateController);
router.get('/user/:id/url', getShortUrl);
router.get('/user/:id/allurl', fetchUrls);
router.post('/user/:id/url', saveUrl);
router.delete('/user/:id/url', deleteUrl);

router.get('/user/:id/master', adminData)


module.exports = router;