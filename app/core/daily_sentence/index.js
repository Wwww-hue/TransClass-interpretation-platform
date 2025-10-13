const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: '每日句子API', data: [] });
});

module.exports = router;