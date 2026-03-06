const config = require('config');
const dict = require('dicom-data-dictionary');
const dict2 = require('@iwharris/dicom-data-dictionary');
const fs = require('fs');
const repository = require('./db/repository');

// make sure log directory exists
const logDir = config.get('logDir');
fs.mkdirSync(logDir, { recursive: true });

// create a rolling file logger based on date/time that fires process events
const opts = {
  errorEventName: 'error',
  logDirectory: logDir, // NOTE: folder must exist and be writable...
  fileNamePattern: 'roll-<DATE>.log',
  dateFormat: 'YYYY.MM.DD',
};
const manager = require('simple-node-logger').createLogManager();
// manager.createConsoleAppender();
manager.createRollingFileAppender(opts);
const logger = manager.createLogger();

//------------------------------------------------------------------

const findDicomName = (name) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(dict.standardDataElements)) {
    const value = dict.standardDataElements[key];
    if (value.name === name || name === key) {
      return key;
    }
  }
  return undefined;
};

const findVR = (name) => {
  const dataElement = dict2.get_element(name);
  if (dataElement) {
    return dataElement.vr;
  }
  return '';
};

//------------------------------------------------------------------

const utils = {
  getLogger: () => logger,
  fileExists: (pathname) =>
    new Promise((resolve, reject) => {
      fs.access(pathname, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }),
  studyLevelTags: () => [
    '00080005',
    '00080020',
    '00080030',
    '00080050',
    '00080054',
    '00080056',
    '00080061',
    '00080090',
    '00081190',
    '00100010',
    '00100020',
    '00100030',
    '00100040',
    '0020000D',
    '00200010',
    '00201206',
    '00201208',
  ],
  seriesLevelTags: () => ['00080005', '00080054', '00080056', '00080060', '0008103E', '00081190', '0020000E', '00200011', '00201209'],
  imageLevelTags: () => ['00080016', '00080018'],
  imageMetadataTags: () => [
    '00080016',
    '00080018',
    '00080060',
    '00280002',
    '00280004',
    '00280010',
    '00280011',
    '00280030',
    '00280100',
    '00280101',
    '00280102',
    '00280103',
    '00281050',
    '00281051',
    '00281052',
    '00281053',
    '00200032',
    '00200037',
  ],
  doFindPg: (queryLevel, query, defaults) => {
    const includes = query.includefield;
    let tags = includes ? includes.split(',') : [];
    tags.push(...defaults);

    const conditions = [];
    const minCharsQido = config.get('qidoMinChars');
    let invalidInput = false;

    const skipKeys = new Set(['includefield', 'offset', 'limit']);
    Object.keys(query).forEach((propName) => {
      if (skipKeys.has(propName)) return;
      const tag = findDicomName(propName);
      const vr = findVR(propName);
      if (!tag) return;

      let v = query[propName];
      if (['PN', 'LO', 'LT', 'SH', 'ST'].includes(vr)) {
        v = v.replace(/^[*]/, '').replace(/[*]$/, '');
        if (minCharsQido > v.length) { invalidInput = true; return; }
        if (config.get('qidoAppendWildcard')) v += '%';
      }
      conditions.push({ tag, value: v, vr });
    });

    if (invalidInput) return Promise.resolve([]);

    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    return repository.doFind(queryLevel, conditions, tags, offset);
  },
};
module.exports = utils;
