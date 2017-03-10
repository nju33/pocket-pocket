import {BrowserWindow} from 'electron';
import querystring from 'querystring';
import got from 'got';
import qs from 'qs';

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
    this.code = null;
    this.window = null;
  }

  log() {
    console.log(JSON.stringify({
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken
    }));
  }

  getAll({offset = null}) {
    console.log('offset ' + offset);

    const data = {
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
      detailType: 'complete',
      state: 'all',
      sort: 'newest',
      count: 200
    };

    if (offset !== null) {
      Object.assign(data, {offset});
    }
    console.log(data);

    const query = querystring.stringify(data);
    return got.get(api`get` + `?${query}`);
  }

  getByTag(tag) {
    const query = querystring.stringify({
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
      detailType: 'complete',
      tag
    });
    return got.get(api`get` + `?${query}`);
  }

  getRequestToken() {
    return got.post(api`oauth/request`, {
      body: {
        'consumer_key': '64406-4c7a024e50c8098e804dcf84',
        'redirect_uri': 'pocket-pocket://redirect'
      }
    });
  }

  createAuthWindow() {
    this.window = new BrowserWindow({
      webPreferences: {
        nodeIntegration: false
      },
      width: 971,
      height: 600
    });
    this.window.loadURL([
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
    return got.post(api`oauth/authorize`, {
      body: {
        'consumer_key': '64406-4c7a024e50c8098e804dcf84',
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
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
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
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
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
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
      actions: JSON.stringify([Object.assign(data, {
        action: 'tags_add'
      })])
    }));
  }
}

export default new Pocket();
