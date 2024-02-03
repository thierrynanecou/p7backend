const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require ('../middleware/multer');

const bookCtrl = require('../controllers/bookController');

router.get('/',  bookCtrl.getAllBook);
router.post('/', auth, multer, bookCtrl.createBook);
router.get('/:id',  bookCtrl.getOneBook);
router.get('/bestrating',bookCtrl.getBestrating);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth,  bookCtrl.deleteBook);

module.exports = router;