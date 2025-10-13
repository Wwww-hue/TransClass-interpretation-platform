const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: '学习记录API', data: [] });
});

module.exports = router;