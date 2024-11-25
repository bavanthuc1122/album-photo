import multer from 'multer';
import { join } from 'path';

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, join(process.cwd(), 'storage/dataclient'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
});

export default upload; 
