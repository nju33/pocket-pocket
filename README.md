<h1><img src="https://github.com/nju33/pocket-pocket/blob/master/app/icons/icon.iconset/icon_128x128.png?raw=true" width=30>&nbsp;Pocket Pocket</h1>

📖 Unofficial pocket app for searching and accessing.

![Screenshot](https://github.com/nju33/pocket-pocket/blob/master/readme/screenshot.png?raw=true)

## Usage

### Get the consumer_key

Access [Pocket: Developer API](https://getpocket.com/developer/apps/) and register the application.

![create app](https://github.com/nju33/pocket-pocket/blob/master/readme/create-pocket-app.png?raw=true)

Please fill in all forms and press Create button.

![input form](https://github.com/nju33/pocket-pocket/blob/master/readme/copy-consumer-key.png?raw=true)

Copy the consumer key of the application you just made.

![copy consumer_key](https://github.com/nju33/pocket-pocket/blob/master/readme/input-form.png?raw=true)

### Open Pocket Pocket

First you will be asked for the consumer key so paste it. (This is the first time, or only when `~/.pocket-pocket.js` is missing or wrong. `~/.pocket-pocket.js` is the configuration file and the contents are JSON of this feeling (`{consumer_key:  ...}`).)

![notify1](https://github.com/nju33/pocket-pocket/blob/master/readme/notify1.png?raw=true)

![notify2](https://github.com/nju33/pocket-pocket/blob/master/readme/notify2.png?raw=true)

Then, you should probably go to the certification page.
Log in with your Pocket account.

![authorize](https://github.com/nju33/pocket-pocket/blob/master/readme/authorize.png?raw=true)

You are now ready 💯

### Shortcut

- `CommandOrControl+Alt+P`: You can open, restore and focus the Window

## Download

From the [release page](https://github.com/nju33/pocket-pocket/releases/latest)

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron app for production
npm run build

# run webpack in production
npm run pack
```
More information can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/docs/npm_scripts.html).

---

This project was generated from [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about this project can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).

## License

Copyright (c) 2017 nju33 nju33.ki@gmail.com
