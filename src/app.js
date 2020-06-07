import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import 'highlight.js/styles/default.css';
import 'vuescroll/dist/vuescroll.css';

import Vue from 'vue';
import VueScroll from 'vuescroll';
import VueSocketIO from 'vue-socket.io';
import VueMaterial from 'vue-material';

import App from './app.vue';
import router from './router';
import store from './store';
import VueHighlightJS from './plugins/vue-highlightjs';

Vue.use(VueScroll);
Vue.use(VueMaterial);
Vue.use(VueHighlightJS);
Vue.use(new VueSocketIO({
  debug: true,
  // connection: document.location.origin,
  connection: 'http://localhost:8888',
  vuex: {
    store,
    actionPrefix: 'SOCKET_',
    mutationPrefix: 'SOCKET_',
  },
  // options: { path: "/my-app/" } //Optional options
}));

window.app = new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
