<template>
  <div id="#app">
    <router-view></router-view>
  </div>
</template>

<script>
  import store from 'renderer/vuex/store'
  export default {
    store
  }
</script>

<style>
body {
  margin: 0;
  line-height: 1.5;
  min-height: 100vh;
  background: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Noto Sans Japanese", "ヒラギノ角ゴ ProN W3", Hiragino Kaku Gothic ProN, Arial, Meiryo, sans-serif;
  font-size: 14px;
}

ul {
  list-style:none;
  margin:0;
  padding:0;
}

a {
  color: inherit;
  text-decoration: none;
  transition: .2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  cursor: pointer;
}

a:hover {
  color: #ee4056;
}

input,
textarea {
  box-sizing: border-box;
  font-size: inherit;
  color: inherit;
}

button {
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
}
</style>
