const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PORT, imagesFolder } = require('./config');
const { replaceBackground } = require('backrem');
const db = require('./entities/Database');
const Image = require('./entities/Image');

const app = express();
const upload = multer({ dest: imagesFolder });

// POST /upload  — загрузка изображения (сохраняет его на диск и возвращает идентификатор сохраненного изображения)
app.post('/upload', upload.single('image'), async (req, res, next) => {
  try {
    const imageFile = new Image(null, null, req.file.size, req.file.filename);
    await db.insert(imageFile);
    return res.json(imageFile.toPublicJSON());
  } catch (err) {
    res.statusCode = 400;
    return next(err);
  }
});

// GET /list  - получить список изображений в формате json (должен содержать их id, размер, дата загрузки)
app.get('/list', (req, res) => {
  const list = db.find().map((img) => img.toJSON());
  return res.json(list);
});

// GET /image/:id  — скачать изображение с заданным id
app.get('/image/:id', (req, res, next) => {
  const imgId = req.params.id;
  const img = db.findOne(imgId);

  if (!img) {
    res.statusCode = 404;
    return next(new Error('Not found'));
  }

  res.setHeader('Content-type', 'image/jpeg');
  return res.download(img.getFullImagePath(), img.id + '.jpg');
});

// DELETE /image/:id  — удалить изображение
app.delete('/image/:id', async (req, res) => {
  const imgId = req.params.id;
  const id = await db.remove(imgId);
  return res.json({ id });
});

// GET /merge?front=<id>&back=<id>&color=145,54,32&threshold=5  — замена фона у изображения
app.get('/merge', (req, res, next) => {
  const targetImg = db.findOne(req.query.front);
  if (!targetImg) {
    res.statusCode = 404;
    return next(new Error('Front image not found'));
  }
  const target = fs.createReadStream(targetImg.getFullImagePath());

  const backgroundImg = db.findOne(req.query.back);
  if (!backgroundImg) {
    res.statusCode = 404;
    return next(new Error('Back image not found'));
  }
  const background = fs.createReadStream(backgroundImg.getFullImagePath());

  const colorToReplace = (req.query.color &&
    req.query.color.split(',').map((n) => parseInt(n, 10))) || [200, 50, 52];
  const threshold =
    (req.query.threshold && parseInt(req.query.threshold, 10)) || 0;

  console.log(colorToReplace, threshold);

  res.setHeader('Content-type', 'image/jpeg');

  replaceBackground(target, background, colorToReplace, threshold).then(
    (readableStream) => {
      readableStream.pipe(res);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
