'use strict';

import {app, protocol, BrowserWindow, ipcMain} from 'electron';
import get from 'lodash/get';
import intersectionBy from 'lodash/intersectionBy';
import pocket from './pocket';
import Fuse from 'fuse.js';

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

ipcMain.on('get-all:req', ({sender}, data = {}) => {
  pocket.getAll(data)
    .then(res => {
      if (data.offset) {
        console.log('get-all:update:res');
        return sender.send('get-all:update:res', JSON.parse(res.body));
      }
      console.log('get-all:res');
      sender.send('get-all:res', JSON.parse(res.body));
    })
    .catch(err => {
      console.log(err);
      sender.send('onerror', err);
    })
});

ipcMain.on('get-list:req', ({sender}, data) => {
  if (data.tag.length > 0) {

    // 最初のだけ検索
    // あとは、それで取得したアイテムを残りのdata.tagでフィルターして
    // 全部持ってるやつだけ返す
    pocket.getBy({tag: data.tag[0]})
      .then(res => {
        const json = JSON.parse(res.body);
        let items = null;

        items = Object.values(get(json, 'list', {}));

        data.tag.slice(1).forEach(tag => {
          items = items.filter(item => {
            const tags = Object.keys(item.tags);
            return tags.includes(tag);
          });
        });

        if (data.title.length > 0) {
          data.title.forEach(text => {
            const fuse = new Fuse(items, {
              keys: ['resolved_title'],
              caseSensitive: true
            });
            const result = fuse.search(text);
            items = result;
          });
        }

        if (data.url.length > 0) {
          data.url.forEach(text => {
            const fuse = new Fuse(items, {
              keys: ['resolved_url'],
              caseSensitive: true
            });
            const result = fuse.search(text);
            items = result;
          });
        }

        sender.send('get-list:res', items);
      })
      .catch(err => {
        console.log(err);
      })
  } else if (data.title.length > 0 || data.url.length > 0) {
    const searches = data.title.concat(data.url);
    const promises = searches.map(search => {
      return pocket.getBy({search});
    });

    Promise.all(promises).then(responses => {
      let items = null;

      items = responses.reduce((result, res = {}) => {
        const json = JSON.parse(res.body);
        result = intersectionBy(
          result.concat(Object.values(get(json, 'list', {}))),
          'item_id'
        );
        return result;
      }, []);

      sender.send('get-list:res', items);
    })
    .catch(err => {
      console.log(err);
    })
  }
});

ipcMain.on('delete:req', ({sender}, {id, idx}) => {
  pocket.delete(id)
    .then(() => {
      sender.send('delete:res', idx);
    })
    .catch(err => {
      console.log(err);
    })
});

ipcMain.on('favorite:req', ({sender}, {idx, isFavorite, data}) => {
  if (isFavorite) {
    pocket.unfavorite(data)
      .then(() => {
        sender.send('unfavorite:res', idx);
      })
      .catch(err => {
        console.log(err);
      })
  } else {
    pocket.favorite(data)
      .then(() => {
        sender.send('favorite:res', idx);
      })
      .catch(err => {
        console.log(err);
      })
  }
});

ipcMain.on('add-tags:req', ({sender}, data) => {
  pocket.addTags(data)
    .then(() => {
      sender.send('add-tags:res')
    })
    .catch(err => {
      console.log(err)
    });
});
