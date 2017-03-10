<template>
  <div>
    <form class="form">
      <input class="search" type="text" v-model="searchText"/>
    </form>
    <ul class="list">
      <li class="item" v-for="(item,idx) in items">
        <div class="control">
          <button class="button button-trashcan" @click="deleteItem($event, {id: item['item_id'], idx})">
            <Octicon name="trashcan" scale="0.9"/>
          </button>
          <button class="button button-tag" :class="{active: editing === idx}" @click="editTag(idx)">
            <Octicon name="tag" scale="0.9"/>
          </button>
        </div>
        <div class="main" :class="{active: editing === idx}">
          <a class="main-inner link" @click="openURL($item['resolved_url'])">
            <span v-text="item['resolved_title']"></span>
          </a>
          <div class="main-inner tag-editor-form">
            <transition name="tag-editor">
              <div class="tag-editor" v-if="editing === idx">
                <transition name="tag-button-container">
                  <div v-if="openingEditor === idx" class="tag-button-container active">
                    <input class="tag-input" type="text" v-model="newTag">
                    <button :class="{disabled: !newTag}" class="tag-button"
                      @click="updateTag(item, newTag)">
                        <Octicon name="rocket" scale="0.9"/>
                    </button>
                    <button v-if="openingEditor === idx"
                            class="tag-button" @click="closeTagEditer(idx)">
                      <Octicon name="x" scale="0.9"/>
                    </button>
                  </div>
                </transition>
                <transition name="tag-button-container">
                  <div v-if="openingEditor !== idx" class="tag-button-container inactive">
                    <button class="tag-button" @click="openTagEditer(idx)">
                      <Octicon name="plus" scale="0.9"/>
                    </button>
                  </div>
                </transition>
                <div class="tag-list">
                  <button class="tag-item" v-text="tag"  v-for="tag in getTags(item)"></button>
                </div>
              </div>
            </transition>
          </div>
        </div>
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
  // import throttle from 'lodash/throttle';
  import Octicon from 'vue-octicon/components/Octicon';
  import 'vue-octicon/icons/tag';
  import 'vue-octicon/icons/trashcan';
  import 'vue-octicon/icons/plus';
  import 'vue-octicon/icons/rocket';
  import 'vue-octicon/icons/x';
  import Hai from '@nju33/hai';

  Hai.config.theme = 'light';

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
        // scrollHeight: 0,
        deleteHai: new Hai([
          {
            name: 'delete',
            message: 'Delete?',
            button: [
              ['Yes', next => next(Hai.DONE)],
              ['No', next => next(Hai.CANCEL)]
            ]
          }
        ]),

        items: [],
        searchText: '',
        newTag: '',

        editing: false,
        openingEditor: false
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
      editTag(idx) {
        if (this.editing === idx) {
          this.editing = false;
        } else {
          this.editing = idx;
        }
      },
      openTagEditer(idx) {
        if (this.openingEditor === idx) {
          this.openingEditor = false;
        } else {
          this.openingEditor = idx;
        }
      },
      closeTagEditer(idx) {
        this.openingEditor = false;
      },
      updateTag(item, newTag) {
        const tags = newTag.split(' ');
        this.$electron.ipcRenderer.send('add-tags:req', {
          item_id: item['item_id'],
          tags
        });
      },
      getTags(item) {
        const updatedTags = item._tags || []

        if (typeof item.tags === 'undefined') {
          return updatedTags;
        }

        return Object.keys(item.tags).concat(updatedTags);
      },
      deleteItem(ev, data) {
        this.deleteHai.open(ev.currentTarget)
          .then(answers => {
            if (answers.delete) {
              this.$electron.ipcRenderer.send('delete:req', data);
            }
          });
      },

      handleScroll: debounce(function (ev) {
        const maxHeight = document.body.scrollHeight;
        if (100 > maxHeight - (document.body.scrollTop + innerHeight)) {
          this.$electron.ipcRenderer.send('get-all:req', {
            offset: this.items.length
          });
        }
      }, 500)
    },
    mounted() {
      const {ipcRenderer} = this.$electron;

      // ipcRenderer.send('get-info:req');
      // ipcRenderer.on('get-info:res', (ev, pocket) {
      // });
      ipcRenderer.send('get-all:req');
      ipcRenderer.on('get-all:res', (ev, body) => {
        console.log(body.list);
        const items = Object.values(body.list)
        if (items.length === 0) {
          this.stop = true;
        } else {
          this.stop = false;
        }
        this.items = items;
      });

      ipcRenderer.on('get-all:update:res', (ev, body) => {
        console.log(body.list);
        const items = Object.values(body.list)
        if (items.length === 0) {
          this.stop = true;
        } else {
          this.stop = false;
        }
        this.items = this.items.concat(items);
      });

      this.$electron.ipcRenderer.on('get-list:res', (ev, items) => {
        if (items.length === 0) {
          this.stop = true;
        } else {
          this.stop = false;
        }
        console.log(items);
        this.items = items;
      });

      this.$electron.ipcRenderer.on('delete:res', (ev, idx) => {
        this.items.splice(idx, 1);
      });

      this.$electron.ipcRenderer.on('add-tags:res', () => {
        if (this.openingEditor === false) {
          return;
        }

        const tags = this.newTag.split(' ');
        const item = this.items[this.openingEditor];
        if (typeof item._tags === 'undefined') {
          item._tags = [];
        }
        item._tags = item._tags.concat(tags);

        this.newTag = '';
      });
    },
    created() {
      window.addEventListener('scroll', this.handleScroll, false);
    },
    destroyed() {
      window.removeEventListener('scroll', this.handleScroll, false)
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
  align-items: flex-start;
  background: #fff;
  position: relative;
  z-index: 1;
  overflow: hidden;
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
  margin-top: 6px;
}

.button {
  flex: auto;
}

.button svg {
  fill: #474747;
  transition: .2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}

.button:hover svg,
.button.active svg {
  fill: #ee4056;
}

.main {
  flex: auto;
  flex-wrap: wrap;
  display: flex;
  transition: 1s cubic-bezier(0.77, 0, 0.175, 1);
  /*overflow: hidden;*/
  height: 2em;
}

.main.active {
  height: 4em;
}

/*.main-enter.main-enter {
  flex: 10 1 100%;
}

.main-enter-to.main-enter-to {

}*/

/*.main-leave-to.main-leave-to {
  flex: 1 10 0%;
}*/

.main-inner {
  flex: auto;
  width: 100%;
  height: 2em;
  box-sizing: border-box;
  overflow: hidden;
  min-width: 0;
  padding: .5em 0;
  line-height: .9;
}

.link {
  display: inline-block;
}

.tag-editor-form {
  background: #ee4056;
  margin-left: -80px;
  width: 100vw;
  display: flex;
  align-items: center;
  padding: 0 .5em;
  overflow: hidden;
}

.tag-editor {
  transition: 1s cubic-bezier(0.77, 0, 0.175, 1);
  opacity: 1;
  display: flex;
  align-items: center;
  overflow: auto;
  padding-bottom: 20px;
  margin-top: 20px;
}

.tag-editor-enter {
  opacity: 0;
}

.tag-editor-enter .tag-input {
  flex: 0 0 0;
  max-width: 0;
}

.tag-editor-leave-to {
  opacity: 1;
}

.tag-button {
  font-size: .8em;
  padding: .2em .3em;
  background: #fde9eb;
  border-radius: 3px;
  color: #474747;
  margin: 0 .3em;
}

.tag-button svg {
  height: 1em;
  width: 1em;
  fill: #474747;
  border-radius: 3px;
}

.tag-button-container {
  background: #fde9eb;
  display: flex;
  border-radius: 3px;
  transition:
    width .3s cubic-bezier(0.77, 0, 0.175, 1),
    opacity .2s cubic-bezier(0.77, 0, 0.175, 1);
  position: relative;
  width: 1.5em;
  height: .9em;
  padding: .2em;
  overflow: hidden;
  flex: 1 0 auto;
  /*width: 10em;*/
}

.tag-button-container.active {
  /*min-width: 10em;*/
  /*min-width: 10em;*/
  width: 10em;
}

.tag-button-container-enter.active {
  width: 0;
  opacity: 0;
}

.tag-button-container-leave-to.active {
  transition:
    /*min-width .2s cubic-bezier(0.77, 0, 0.175, 1),*/
    width .2s cubic-bezier(0.77, 0, 0.175, 1),
    opacity .3s cubic-bezier(0.77, 0, 0.175, 1);
  /*min-width: 0em;*/
  padding: .2em 0;
  width: 0;
  /*flex: 0 0 auto;*/
  opacity: 0;
}

.tag-button-container-enter.inactive {
  transition:
    width .2s cubic-bezier(0.77, 0, 0.175, 1)
    opacity .3s cubic-bezier(0.77, 0, 0.175, 1) .6s;
  width: 0;
  opacity: 0;
}

.tag-button-container-leave-to.inactive {
  transition:
    width .2s cubic-bezier(0.77, 0, 0.175, 1),
    opacity .3s cubic-bezier(0.77, 0, 0.175, 1);
  padding: .2em 0;
  width: 0;
  opacity: 0;
}

.tag-input {
  flex: 0 2 100%;
  margin-right: 0em;
  border: none;
  background: #fde9eb;
  outline: none;
  border-radius: 3px;
  font-size: .8em;
  padding: 0 1em 0 .5em;
  box-sizing: border-box;
  max-width: 100%;
}

.tag-button-container .tag-button {
  margin: 0;
  transition: .2s cubic-bezier(0.77, 0, 0.175, 1);
  opacity: 1;
}

.tag-button-container-enter .tag-button {
  opacity: 0;
}

.tag-button {
  position: absolute;
  bottom: 48%;
  transform: translateY(50%);
}

.tag-button-container.active .tag-button:nth-of-type(1) {
  right: 2em;
}

.tag-button-container.active .tag-button:nth-of-type(2) {
  right: .5em;
}

.tag-button-container.inactive .tag-button:nth-of-type(1) {
  right: 50%;
  transform: translate(50%, 50%);
}

.tag-list {
  display: flex;
}

.tag-item {
  background: #fbe9eb;
  padding: .2em .3em;
  border-radius: 3px;
  margin: 0 .3em;
}

</style>
