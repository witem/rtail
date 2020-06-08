import Vue from 'vue';
import Vuex from 'vuex';
import orderBy from 'lodash/orderBy';
import createPersistedState from 'vuex-persistedstate';

import { formatLine } from '../tools/common';

Vue.use(Vuex);

const MAX_ACTIVE_STREAMS = 5;

const defaultState = {
  isConnected: false,
  isStreamsLoaded: false,
  routeParams: {},
  streams: {},
  activeStreams: [],
  favoriteStreams: [],
  backlogByStream: {},
  settings: {
    sorting: 'desc',
    theme: 'dark',
    fontSize: 14,
  },
};

const filterFavoriteStreams = function filterFavoriteStreams(streams, isFavorite = false) {
  return Object.keys(streams).reduce((result, streamId) => {
    const stream = streams[streamId];
    if (stream.childs) {
      result[streamId] = { ...stream, childs: {} };
      result[streamId].childs = filterFavoriteStreams(stream.childs, isFavorite);
    }

    if (stream.isFavorite === isFavorite) {
      result[streamId] = stream;
    }

    return result;
  }, {});
};

const getters = {
  backlogDESC: (state) => (streamId) => {
    if (!state.backlogByStream[streamId]) {
      Vue.set(state.backlogByStream, streamId, { backlog: [], backlogDESC: [] });
    }

    if (state.settings.sorting === 'desc') {
      return state.backlogByStream[streamId].backlogDESC;
    }

    return state.backlogByStream[streamId].backlog;
  },
  streamsFavorites: (state) => filterFavoriteStreams(state.streams, true),
  streamsNotFavorites: (state) => filterFavoriteStreams(state.streams, false),
  activeStreamIs: (state) => (streamId) => state.activeStreams.includes(streamId),
  activeStreamIsLast: (state) => (streamId) => state.activeStreams.indexOf(streamId) === (state.activeStreams.length - 1),
  activeStreamIsFirst: (state) => (streamId) => state.activeStreams.indexOf(streamId) === 0,
  settingIsActive: (state) => (key, value) => (state.settings[key] == null ? false : state.settings[key] === value),
};

const mutations = {
  SOCKET_connect(state, status) {
    state.isConnected = true;
  },

  SOCKET_disconnect(state) {
    state.isConnected = false;
  },

  SOCKET_reconnect(state) {
    state.activeStreams.forEach((streamId) => window.app.$socket.emit('streamSubscribe', streamId));
  },

  SOCKET_streams(state, data) {
    state.isStreamsLoaded = true;
    state.streams = data.reduce((result, stream) => {
      if (!stream.group) {
        result[stream.id] = {
          name: stream.id,
          title: stream.name,
          isFavorite: state.favoriteStreams.includes(stream.id),
        };
        return result;
      }

      if (!result[stream.group]) {
        result[stream.group] = {
          title: stream.group,
          childs: {},
        };
      }

      result[stream.group].childs[stream.id] = {
        name: stream.id,
        title: stream.name,
        isFavorite: state.favoriteStreams.includes(stream.id),
      };

      return result;
    }, {});
  },

  SOCKET_backlog(state, data) {
    if (!state.backlogByStream[data.id]) {
      Vue.set(state.backlogByStream, data.id, { backlog: [], backlogDESC: [] });
    }

    const stream = state.backlogByStream[data.id];
    Vue.set(stream, 'name', data.name);
    Vue.set(stream, 'group', data.group);
    Vue.set(stream, 'backlogLimit', data.backlogLimit);
    stream.backlog.splice(0);
    stream.backlogDESC.splice(0);
    orderBy(data.backlog, 'timestamp', ['asc'])
      .forEach((line) => state.backlogByStream[data.id].backlog.splice(Infinity, 0, formatLine(line)));
    orderBy(data.backlog, 'timestamp', ['desc'])
      .forEach((line) => state.backlogByStream[data.id].backlogDESC.splice(Infinity, 0, formatLine(line)));
  },

  SOCKET_line(state, data) {
    if (!state.backlogByStream[data.id]) return;

    const { backlog, backlogDESC } = state.backlogByStream[data.id];
    // backlog.splice(backlog.length, 0, formatLine(data));
    const formatedLine = formatLine(data);
    backlog.push(formatedLine);
    if (backlog.length > state.backlogByStream[data.id].backlogLimit) backlog.shift();

    backlogDESC.unshift(formatedLine);
    if (backlogDESC.length > state.backlogByStream[data.id].backlogLimit) backlogDESC.pop();
  },

  toggleFavorite(state, { streamId, group }) {
    let { streams } = state;
    if (group) {
      streams = state.streams[group].childs;
    }

    streams[streamId].isFavorite = !streams[streamId].isFavorite;
    if (!streams[streamId].isFavorite) {
      const idx = state.favoriteStreams.indexOf(streamId);
      state.favoriteStreams.splice(idx, 1);
    } else {
      state.favoriteStreams.splice(Infinity, 0, streamId);
    }
  },

  activeStreamAdd(state, { streamId, rewriteStreamId, replaceLastStream }) {
    if (state.activeStreams.includes(streamId) || state.activeStreams.length >= MAX_ACTIVE_STREAMS) {
      return;
    }

    let rewriteStream = rewriteStreamId;
    if (replaceLastStream && state.activeStreams.length) {
      rewriteStream = state.activeStreams[state.activeStreams.length - 1];
    }

    if (rewriteStream && state.activeStreams.includes(rewriteStream)) {
      const idx = state.activeStreams.indexOf(rewriteStream);
      state.activeStreams.splice(idx, 1, streamId);
    } else {
      state.activeStreams.splice(Infinity, 0, streamId);
    }
  },

  activeStreamClose(state, { streamId }) {
    const idx = state.activeStreams.indexOf(streamId);
    if (idx < 0) {
      return;
    }

    state.activeStreams.splice(idx, 1);
  },

  activeStreamMove(state, { streamId, direction }) {
    const idx = state.activeStreams.indexOf(streamId);
    if (idx < 0) {
      return;
    }

    state.activeStreams.splice(idx, 1);
    state.activeStreams.splice(Math.max(idx - direction, 0), 0, streamId);
  },

  activeStreamsReplace(state, { streamList }) {
    if (!streamList || !streamList.length) return;

    state.activeStreams.splice(0, state.activeStreams.length, ...streamList);
  },

  updateSettings(state, newParams) {
    if (!newParams) return;

    Object.keys(newParams).forEach((key) => {
      if (state.settings[key] == null) return;

      Vue.set(state.settings, key, newParams[key]);
    });
  },
};

const actions = {};
const persistedOptions = {
  paths: ['activeStreams', 'favoriteStreams', 'settings'],
};

const store = new Vuex.Store({
  state: defaultState,
  getters,
  mutations,
  actions,
  plugins: [createPersistedState(persistedOptions)],
});

export default store;
