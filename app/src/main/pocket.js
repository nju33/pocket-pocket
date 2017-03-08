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
    this.code = null;
    this.window = null;
  }

  log() {
    console.log(JSON.stringify({
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken
    }));
  }

  getAll() {
    const query = querystring.stringify({
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
      state: 'all'
    });
    return got.get(api`get` + `?${query}`);
  }

  getByTag(tag) {
    const query = querystring.stringify({
      'consumer_key': '64406-4c7a024e50c8098e804dcf84',
      'access_token': this.accessToken,
      tag
    });
    console.log(query);
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
}

export default new Pocket();
