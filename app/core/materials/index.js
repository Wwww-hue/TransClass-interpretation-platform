const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: '材料API', data: [] });
});

module.exports = router;