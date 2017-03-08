<template>
  <div>
    <form>
      <input type="text" v-model="searchText"/>
    </form>
    <ul>
      <li v-for="item in items">
        <a @click="function() {console.log(123)}">
        <!-- <a :href="item['resolved_url']" @click="function() {console.log(123)}"> -->
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

  const fisea = new Fisea(['tag', 'url', 'title'])

  export default {
    components: {
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
      })
    }
  }
</script>

<style scoped>
  img {
    margin-top: -25px;
    width: 450px;
  }
</style>
