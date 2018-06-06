import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import 'highlight.js/styles/default.css';

import Vue from 'vue';
import VueSocketio from 'vue-socket.io';
import VueMaterial from 'vue-material';
import VueHighlightJS from 'vue-highlightjs';

import App from './app.vue';
import router from './router';
import store from './store';

Vue.use(VueMaterial);
Vue.use(VueHighlightJS);
Vue.use(VueSocketio, document.location.origin, store);

window.app = new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
