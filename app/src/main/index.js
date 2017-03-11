'use strict';

import fs from 'fs';
import path from 'path';
import {app, protocol, BrowserWindow, ipcMain, globalShortcut} from 'electron';
import get from 'lodash/get';
import intersectionBy from 'lodash/intersectionBy';
import Fuse from 'fuse.js/src/fuse';
import notifier from 'node-notifier';
import pocket from './pocket';
import createMenu from './menu';

const nc = new notifier.NotificationCenter();
const configFile = path.join(app.getPath('home'), '.pocket-pocket.js');
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../../config').port}`
  : `file://${__dirname}/index.html`

let mainWindow = null;

function createWindow () {
  mainWindow = new BrowserWindow({
    height: 309,
    width: 500,
    minHeight: 300,
    minWidth: 300,
    titleBarStyle: 'hidden-inset'
  });

  // mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  });
}

function prepare(configFile) {
  try {
    fs.accessSync(configFile, fs.constants.F_OK);
    const contents = fs.readFileSync(configFile, 'utf-8');
    const data = JSON.parse(contents);
    pocket.setConsumerKey(data['consumer_key']);
    run();
  } catch (err) {
    const opts = {
      title: 'Pocket Pocketasldkjfsjfsdf',
      message: 'Please specify pocket consumer_key',
      icon: path.join(
        __dirname,
        '../../images/notify.png'
      ),
      reply: true
    };
    nc.notify(opts, (err, res, {
      activationType: type, activationValue: consumerKey
    }) => {
      if (type !== 'replied') {
        return;
      }

      pocket.setConsumerKey(consumerKey);
      const data = JSON.stringify({'consumer_key': consumerKey});
      fs.writeFileSync(configFile, data);
      run();
    });
  }
}

function run() {
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
            if (mainWindow === null) {
              createWindow();
            }
            pocket.createAuthWindow(mainWindow);
          }
        });
    })
    .catch(err => {
      nc.notify({
        title: 'Pocket Pocket',
        message: err.message,
        icon: path.join(
          __dirname,
          '../../images/notify.png'
        ),
        timeout: 8
      }, () => {
        fs.unlinkSync(configFile);
        prepare(configFile);
      });
    })
}

protocol.registerStandardSchemes(['pocket-pocket']);
app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    if (mainWindow === null) {
      prepare(configFile);
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
      return;
    }

    mainWindow.focus();
  });

  protocol.registerHttpProtocol('pocket-pocket', handler => {
    if (handler.url !== pocket.redirectURI) {
      return;
    }

    pocket.auth()
      .then(res => {
        const matches = res.body.match(/access_token=([^&]+)&username=(.+)$/);
        if (matches) {
          pocket.accessToken = matches[1];
          pocket.username = matches[2];
        }

        mainWindow.loadURL(winURL);
      })
      .catch(err => {
        if (err.statusCode === pocket.errorCode.FORBIDDEN) {
          if (mainWindow === null) {
            createWindow();
          }
          pocket.createAuthWindow(mainWindow);
        }
      });
  });

  prepare(configFile);

  createMenu();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    prepare(configFile);
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
    return;
  }

  mainWindow.focus();
})

app.on('will-quit', () => {
  globalShortcut.unregister('CommandOrControl+Alt+P');
});

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
