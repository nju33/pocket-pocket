import {BrowserWindow} from 'electron';
import querystring from 'querystring';
import got from 'got';

function api([string]) {
  return `https://getpocket.com/v3/${string}`;
}

class Pocket {
  constructor() {
    this.errorCode = {
      FORBIDDEN: 403
    };
    this.redirectURI = 'pocket-pocket://regirect/';
    // this.redirectURI = 'https://google.com';
    this.consumerKey = null;
    this.code = null;
    this.window = null;
  }

  get requiredParams() {
    return {
      'consumer_key': this.consumerKey,
      'access_token': this.accessToken
    };
  }


  setConsumerKey(consumerKey) {
    this.consumerKey = consumerKey;
  }

  log() {
    console.log(JSON.stringify({
      ...this.requiredParams,
    }));
  }

  getAll({offset = null}) {
    console.log('offset ' + offset);

    const data = {
      ...this.requiredParams,
      detailType: 'complete',
      state: 'all',
      count: 200
    };

    if (offset !== null) {
      Object.assign(data, {offset});
    }
    console.log(data);

    const query = querystring.stringify(data);
    return got.get(api`get` + `?${query}`);
  }

  getBy(data) {
    const query = querystring.stringify({
      ...this.requiredParams,
      detailType: 'complete',
      ...data
    });
    return got.get(api`get` + `?${query}`);
  }

  getByTag(tag) {
    const query = querystring.stringify({
      ...this.requiredParams,
      detailType: 'complete',
      tag
    });
    return got.get(api`get` + `?${query}`);
  }

  getRequestToken() {
    return got.post(api`oauth/request`, {
      body: {
        'consumer_key': this.consumerKey,
        'redirect_uri': 'pocket-pocket://redirect'
      }
    });
  }

  createAuthWindow(win) {
    // this.window = new BrowserWindow({
      // webPreferences: {
      //   nodeIntegration: false
      // },
    //   width: 971,
    //   height: 600
    // });
    // this.window.loadURL([
    win.loadURL([
      'https://getpocket.com/auth/authorize',
      `?request_token=${this.code}&`,
      `redirect_uri=${encodeURIComponent(this.redirectURI)}`
    ].join(''));
  }

  closeWindow() {
    if (this.window === null) {
      return;
    }

    this.window.destroy();
    this.window = null;
  }

  auth() {
    console.log({
      body: {
        'consumer_key': this.consumerKey,
        code: this.code
      }
    });
    return got.post(api`oauth/authorize`, {
      body: {
        'consumer_key': this.consumerKey,
        code: this.code
      }
    });
  }

  delete(id) {
    return got.get(api`send?` + querystring.stringify({
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
      actions: JSON.stringify([
        {
          action: 'delete',
          'item_id': id
        }
      ])
    }));
  }

  favorite(data) {
    return got.get(api`send?` + querystring.stringify({
      ...this.requiredParams,
      actions: JSON.stringify([
        {
          action: 'favorite',
          ...data
        }
      ])
    }))
  }

  unfavorite(data) {
    return got.get(api`send?` + querystring.stringify({
      ...this.requiredParams,
      actions: JSON.stringify([
        {
          action: 'unfavorite',
          ...data
        }
      ])
    }));
  }

  addTags(data) {
    return got.get(api`send?` + querystring.stringify({
      ...this.requiredParams,
      actions: JSON.stringify([Object.assign(data, {
        action: 'tags_add'
      })])
    }));
  }
}

export default new Pocket();
