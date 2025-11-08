// ******************************************************************
// ** Code by EvilAdmiralKivi (https://twitch.tv/EvilAdmiralKivi)  **
// ** Repo: https://github.com/synthie-cat/smw-kaizo-chat-updater  **
// ** Licensed under MIT License								   **
// ******************************************************************

'use strict';

const https = require('https');

async function getRomhackInfo_Async(romhackName)
{
    try {
        let romhackName_Parsed = getParsedRomhackName(romhackName);
        let jsondata = await getHtml_Async(romhackName);
        let info = getRomhackInfo_FromJson(jsondata, romhackName_Parsed);

        const error = info.error || {};
        if (error.type === 'no-results')
        {
            jsondata = await getHtml_Async(romhackName, '&u=1');
            info = getRomhackInfo_FromJson(jsondata, romhackName_Parsed);
        }

        return info;
    } catch (e) {
        return {
            error: {
                type: 'request-error',
                message: e.message,
            },
        };
    }
}
exports.getRomhackInfo_Async = getRomhackInfo_Async;


function getHtml_Async(romhackName, waiting='')
{
    return new Promise((resolve, reject) => {
        let body = '';
        var r = https.request({
            host: 'www.smwcentral.net',
            port: '443',
            path: encodeURI('/ajax.php?a=getsectionlist&s=smwhacks&f[name]=' + romhackName + waiting),
            method: 'GET',
            headers: {},
        }, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(body));
            })
        });
        r.on('error', (err) => {
            reject('RequestError: ' + err.message);
        });
        r.end();
    });
}


function getParsedRomhackName(romhackName_Raw)
{
    romhackName_Raw = romhackName_Raw.toLowerCase();

    let letters_Allowed = '1234567890' +
        'qwertyuiop' +
        'asdfghjkl' +
        'zxcvbnm' +
		'\'' +
        ' ';

    let romhackName_Parsed = '';
    for (let i = 0; i < romhackName_Raw.length; i++) {
        if (letters_Allowed.indexOf(romhackName_Raw[i]) === -1)
            continue;

        romhackName_Parsed += romhackName_Raw[i];
    }

    return romhackName_Parsed;
}


function getRomhackInfo_FromHackJson(hack)
{
  let authors = hack.authors.map(author => author.name);
  return {
    error: null,
    url:  `https://www.smwcentral.net/?p=section&a=details&id=${hack.id}`,
    name: hack.name,
    exits: hack.fields.length,
    type: hack.fields.type,
    author: hack.authors[0].name,
    authors
  };
}


function getRomhackInfo_FromJson(jsondata, romhackName_Parsed)
{
  if (jsondata.total === 0 || !jsondata.data)
    return {error: {type: 'no-results', data: jsondata},};

  let hacks = jsondata.data;

  if (hacks.length === 1)
      return getRomhackInfo_FromHackJson(hacks[0]);

  for (let hack of hacks) {
      let romhackInfo = getRomhackInfo_FromHackJson(hack);
      if (getParsedRomhackName(romhackInfo.name) === romhackName_Parsed)
          return romhackInfo;
  }

  return {
      error: {
          type: 'multiple-results',
      },
  };
}