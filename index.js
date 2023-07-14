const express = require('express');
const fs = require('fs');
const {resolve} = require('path');
const readdir = require('fs/promises').readdir;
const absolutePath = resolve('./posts');
const multer = require('multer');

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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const getDescription = (description, hashtagsList) => `${description}\n.\n.\n.\n.\n.\n.\n.\n.\n ${hashtagsList.join(" ")} #ai #stablediffusion`;

app.post('/saveImage', upload.single("avatar"), async(req, res) => {
  res.json({filename: req.file.originalname});
});

app.post('/post', async(req, res) => {
  var dir = './posts/';

  const getDirectories = async source =>
    (await readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
  }

  const lastDirectory = await getDirectories(absolutePath);
  const postName = parseInt(lastDirectory.slice(-1)[0]) || 0;
  console.log(postName);
  const newDirectoryName = dir + "/" + (postName > 10 ? postName + 1 : "0" + String(postName + 1));

  if (!fs.existsSync(newDirectoryName)) {
    fs.writeFile(
      newDirectoryName + "/description.txt",
      getDescription(req.body.description, req.body.hashtags),
      function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
  });

    fs.mkdirSync(newDirectoryName);
    fs.mkdirSync(newDirectoryName + "/crap");

    for (const image of req.body.images) {
      var oldPath = './uploads/'+image;
      var newPath = newDirectoryName + "/" +image;

      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        console.log('Successfully renamed - AKA moved!')
      });
    }
  }

  res.json({lastDirectory: lastDirectory.slice(-1)[0]});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});