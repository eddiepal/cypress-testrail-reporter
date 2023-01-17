'use strict';
let __assign = (this && this.__assign) || function() {
  __assign = Object.assign || function(t) {
    for (let s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (const p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) {
          t[p] = s[p];
        }
      }
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
Object.defineProperty(exports, '__esModule', {value: true});
exports.TestRail = void 0;
const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const FormData = require('form-data');
const base = process.env.base;
const username = process.env.username;
const pwd = process.env.pwd;
const vName = process.env.vName;
const vFolder = process.env.vFolder;
const resId = process.env.resId;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 1;

process.on('disconnect', function() {
  fs.readdir(vFolder, function(err, files) {
    if (err) {
      return console.log('Unable to scan videos folder: ' + err);
    }
    files.forEach(function(file) {
      if (file.includes(vName) ) {
        try {
          uploadAttachment(resId, vFolder +'/'+ file);
        } catch (err) {
          console.log('Video upload error: ', err);
        }
      }
    });
  });
});
const uploadAttachment = async function(resultId, path) {
  const form = new FormData();
  try {
    const fileHandle = await fsPromises.open(path, 'r');
    await fileHandle.readFile();
    form.append('attachment', fs.createReadStream(path));
    axios({
      method: 'post',
      url: base + '/add_attachment_to_result/' + resultId,
      headers: __assign({}, form.getHeaders()),
      auth: {
        username: username,
        password: pwd,
      },
      data: form,
    }).catch(function(error) {
      return console.error(error);
    });
  } catch (err) {
    console.error(err);
  } finally {
    if (filehandle) {
      await filehandle.close();
    }
  }
};
