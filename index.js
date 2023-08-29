const express = require('express');
const fs = require('fs');
const {resolve} = require('path');
const readdir = require('fs/promises').readdir;
const absolutePath = resolve('./posts');
const multer = require('multer');
const path = require('path');
const configuration = require('./public/configurations.json');

var storage = multer.diskStorage({
  destination: function (_, _, cb) {
    cb(null, 'uploads/');
  },
  filename: function (_, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ dest: './uploads/', storage: storage });
const app = express();
const port = 3000;

app.use(express.static(__dirname + '/public/'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var uploadDir = './uploads/';
var dir = './posts/';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const getDirectories = async source =>
    (await readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

const getDescription = (description, hashtagsList, postName) => `${description}\n.\n.\n.\n.\n.\n.\n.\n.\nPost n°${postName}\n${hashtagsList.join(" ")} #ai #stablediffusion`;

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.post('/countPosts', upload.single("avatar"), async(req, res) => {
  const lastDirectory = await getDirectories(absolutePath);
  const postName = parseInt(lastDirectory.slice(-1)[0]) || 0;

  const lastPostName = (postName > 10 ? postName : "0" + String(postName));

  res.json({lastPost: lastPostName, configuration: configuration});
});

app.post('/saveImage', upload.single("avatar"), async(req, res) => {
  res.json({filename: req.file.originalname});
});

app.post('/post', async(req, res) => {
  let newPostName = '';

  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
  }

  const lastDirectory = await getDirectories(absolutePath);
  const postName = parseInt(lastDirectory.slice(-1)[0]) || 0;

  newPostName = (postName > 10 ? postName + 1 : "0" + String(postName + 1));
  const newDirectoryName = dir + "/" + newPostName;

  if (!fs.existsSync(newDirectoryName)) {
    const writeStream = fs.createWriteStream(newDirectoryName + "/description.txt");
    writeStream.write(getDescription(req.body.description, req.body.hashtags, newPostName));
    writeStream.end();

    fs.mkdirSync(newDirectoryName);
    fs.mkdirSync(newDirectoryName + "/crap");

    for (const image of req.body.images) {
      var oldPath = './uploads/'+image;
      var newPath = newDirectoryName + "/" +image;

      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
      });
    }
  }

  res.json({lastDirectory: newPostName});
});

app.listen(port, () => {
  console.log(`System running on port ${port}`);
});