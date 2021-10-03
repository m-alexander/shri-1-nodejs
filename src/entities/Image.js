const path = require('path');
const { imagesFolder } = require('../config');
const { removeFile } = require('../utils/fs');
const { generateId } = require('../utils/generateId');

module.exports = class Image {
  constructor(id, uploadedAt, size, filename) {
    this.id = id || generateId();
    this.size = size || 0;
    this.uploadedAt = uploadedAt || Date.now();
    this.filename = filename || '';
  }

  getFullImagePath() {
    return path.resolve(imagesFolder, this.filename);
  }

  async removeOriginal() {
    await removeFile(this.getFullImagePath());
  }

  toPublicJSON() {
    return {
      id: this.id,
      size: this.size,
      uploadedAt: this.uploadedAt,
    };
  }

  toJSON() {
    return {
      id: this.id,
      size: this.size,
      uploadedAt: this.uploadedAt,
      filename: this.filename,
    };
  }
};
