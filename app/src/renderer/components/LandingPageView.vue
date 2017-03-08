<template>
  <div>
    <form class="form">
      <input class="search" type="text" v-model="searchText"/>
    </form>
    <ul class="list">
      <li class="item" v-for="(item,idx) in items">
        <div class="control">
          <button class="button button-tag">
            <Octicon name="tag" scale="0.9"/>
          </button>
          <button class="button button-trashcan" @click="deleteItem({id: item['item_id'], idx})">
            <Octicon name="trashcan" scale="0.9"/>
          </button>
        </div>
        <a class="link" @click="openURL(item['resolved_url'])">
          <span v-text="item['resolved_title']"></span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
  import CurrentPage from './LandingPageView/CurrentPage'
  import Links from './LandingPageView/Links'
  import Versions from './LandingPageView/Versions'
  import got from 'got';
  import Fuse from 'fuse.js';
  import Fisea from 'fisea';
  import debounce from 'lodash/debounce';
  import Octicon from 'vue-octicon/components/Octicon';
  import 'vue-octicon/icons/tag'
  import 'vue-octicon/icons/trashcan'

  const fisea = new Fisea(['tag', 'url', 'title'])

  export default {
    components: {
      Octicon,
      CurrentPage,
      Links,
      Versions
    },
    name: 'landing-page',
    data() {
      return {
        items: [],
        searchText: ''
      };
    },
    watch: {
      searchText: debounce(function (val) {
        if (val === '') {
          return;
        }

        const parsed = fisea.parse(val);

        this.$electron.ipcRenderer.send('get-list:req', {
          _: parsed._,
          title: parsed.title,
          url: parsed.url,
          tag: parsed.tag
        });
      }, 300)
    },
    methods: {
      openURL(url) {
        this.$electron.remote.shell.openExternal(url);
      },
      deleteItem(id) {
        this.$electron.ipcRenderer.send('delete:req', id);
      }
    },
    mounted() {
      const {ipcRenderer} = this.$electron;

      // ipcRenderer.send('get-info:req');
      // ipcRenderer.on('get-info:res', (ev, pocket) {
      // });
      ipcRenderer.send('get-all:req');
      ipcRenderer.on('get-all:res', (ev, body) => {
        this.items = Object.values(body.list);
      });

      this.$electron.ipcRenderer.on('get-list:res', (ev, items) => {
        this.items = items;
      });

      this.$electron.ipcRenderer.on('delete:res', (ev, idx) => {
        this.items.splice(idx, 1);
      });
    }
  }
</script>

<style scoped>
.form {
  -webkit-app-region: drag;
  padding-left: 80px;
  height: 38px;
  border-bottom: 1px solid #e3e3e3;
}

.search {
  height: 39px;
  border: none;
  padding: .3em .5em;
  outline: none;
  width: 100%;
  border-left: 1px solid #e3e3e3;
  border-bottom: 1px solid #e3e3e3;
  transition: .2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}

.search:focus {
  border-color: #ee4056;
}

.list {
  /*margin: 1em 0;*/
  /*background-image: linear-gradient(to right, #fff 80px, transparent 80px);*/
  /*min-height: calc(100vh - 40px);*/
}

.item {
  display: flex;
}

.item:nth-child(n+2) {
  border-top: 1px solid #e3e3e3;
}

.control {
  flex: auto;
  max-width: 80px;
  min-width: 80px;
  display: flex;
  align-items: center;
  padding: 0 .5em;
  box-sizing: border-box;
}

.button {
  flex: auto;
}

.button svg {
  fill: #474747;
  transition: .2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}

.button:hover svg {
  fill: #ee4056;
}

.link {
  flex: auto;
  display: inline-block;
  padding: .2em 0;
}
</style>
