'use strict'

import {app, protocol, BrowserWindow, ipcMain} from 'electron'
import get from 'lodash/get';
import pocket from './pocket';

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../../config').port}`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */

  mainWindow = new BrowserWindow({
    height: 309,
    width: 500,
    titleBarStyle: 'hidden-inset'
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // eslint-disable-next-line no-console
  // console.log('mainWindow opened')
}

protocol.registerStandardSchemes(['pocket-pocket']);
app.on('ready', () => {
  // handler = {
  //  method: 'GET',
  //  referrer: '',
  //  url: 'pocket-pocket://redirect/'
  // }
  protocol.registerHttpProtocol('pocket-pocket', handler => {
    if (handler.url !== pocket.redirectURI) {
      return;
    }

    pocket.closeWindow();

    pocket.auth()
      .then(res => {
        const matches = res.body.match(/access_token=([^&]+)&username=(.+)$/);
        if (matches) {
          pocket.accessToken = matches[1];
          pocket.username = decodeURIComponent(matches[2]);
        }
        createWindow();
      })
      .catch(err => {
        console.log(err);
      })
  });
  pocket.getRequestToken()
    .then(res => {
      const code = res.body.replace('code=', '');
      pocket.code = code;
      pocket.auth()
        .then(res => {
          const matches = res.body.match(/access_token=([^&]+)&username=(.+)$/);
          if (matches) {
            pocket.accessToken = matches[1];
            pocket.username = matches[2];
          }
          createWindow();
        })
        .catch(err => {
          if (err.statusCode === pocket.errorCode.FORBIDDEN) {
            pocket.createAuthWindow()
          }
        });
    })
    .catch(err => {
      console.log(err);
    })
  // createWindow();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
//
// ipcMain.on('get-info:req', ({sender}) => {
//   sender.send('get-info:res', pocket);
// });

ipcMain.on('get-all:req', ({sender}) => {
  pocket.getAll()
    .then(res => {
      sender.send('get-all:res', JSON.parse(res.body));
    })
    .catch(err => {
      sender.send('onerror', err);
    })
});

ipcMain.on('get-list:req', ({sender}, obj) => {
  console.log(obj);
  if (!obj.tag) {
    return;
  }

  const promises = obj.tag.map(tag => {
    return pocket.getByTag(tag);
  });

  Promise.all(promises).then(responses => {
    const items = responses.reduce((result, res = {}) => {
      const json = JSON.parse(res.body);
      // console.log(res);
      // console.log(res.body);
      // console.log('---');
      // console.log(res.body.list);
      // console.log(Object.keys(res.body));
      console.log('---');
      result = result.concat(Object.values(get(json, 'list', {})));
      console.log(result);
      return result;
    }, []);

    sender.send('get-list:res', items);
  })
  .catch(err => {
    console.log(err);
  })
});
