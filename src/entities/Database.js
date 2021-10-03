const { EventEmitter } = require('events');
const { existsSync } = require('fs');
const { dbDumpFile } = require('../config');
const { writeFile } = require('../utils/fs');
const { prettifyJsonToString } = require('../utils/prettifyJsonToString');
const Image = require('./Image');

class Database extends EventEmitter {
  constructor() {
    super();

    this.idToImage = {};
  }

  async initFromDump() {
    if (existsSync(dbDumpFile) === false) {
      return;
    }

    const dump = require(dbDumpFile);

    if (typeof dump.idToImage === 'object') {
      this.idToImage = {};

      for (let id in dump.idToImage) {
        const img = dump.idToImage[id];
        this.idToImage[id] = new Image(
          img.id,
          img.uploadedAt,
          img.size,
          img.filename
        );
      }
    }
  }

  async insert(img) {
    this.idToImage[img.id] = img;
    this.emit('changed');
  }

  async remove(imgId) {
    const imgRaw = this.idToImage[imgId];
    const img = new Image(
      imgRaw.id,
      imgRaw.uploadedAt,
      imgRaw.size,
      imgRaw.filename
    );
    await img.removeOriginal();
    delete this.idToImage[imgId];
    this.emit('changed');
    return imgId;
  }

  findOne(imgId) {
    const imgRaw = this.idToImage[imgId];

    if (!imgRaw) {
      return null;
    }

    return new Image(
      imgRaw.id,
      imgRaw.uploadedAt,
      imgRaw.size,
      imgRaw.filename
    );
  }

  find() {
    let allImgs = Object.values(this.idToImage);

    allImgs.sort((svgA, svgB) => svgB.uploadedAt - svgA.uploadedAt);

    return allImgs;
  }

  toJSON() {
    return {
      idToImage: this.idToImage,
    };
  }
}

const db = new Database();

db.initFromDump();

db.on('changed', () => {
  writeFile(dbDumpFile, prettifyJsonToString(db.toJSON()));
});

module.exports = db;
