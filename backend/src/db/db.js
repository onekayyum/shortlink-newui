const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this._init();
  }

  _init() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  _write(data) {
    const tempPath = this.filePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, this.filePath);
  }

  find(query = {}) {
    const data = this._read();
    return data.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  findOne(query = {}) {
    const data = this._read();
    return data.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  create(doc) {
    const data = this._read();
    const newDoc = { id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...doc };
    data.push(newDoc);
    this._write(data);
    return newDoc;
  }

  updateOne(query, update) {
    const data = this._read();
    const index = data.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) return null;

    data[index] = { ...data[index], ...update, updatedAt: new Date().toISOString() };
    this._write(data);
    return data[index];
  }

  deleteOne(query) {
    const data = this._read();
    const index = data.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) return false;

    data.splice(index, 1);
    this._write(data);
    return true;
  }

  deleteMany(query) {
    const data = this._read();
    const initialLength = data.length;
    const newData = data.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) return false; // Filter out matching ones
      }
      return true;
    });
    this._write(newData);
    return initialLength - newData.length;
  }
}

module.exports = {
  Users: new Collection('users'),
  Links: new Collection('links'),
  ClickLogs: new Collection('clickLogs'),
  Settings: new Collection('settings')
};
