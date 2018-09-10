<template>
  <div
    :style="`font-size: ${fontSize}px;`"
    class="stream-content">
    <md-toolbar
      class="md-dense">
      <md-button
        class="md-icon-button"
        @click="showTimestamp = !showTimestamp">
        <md-icon>{{ showTimestamp ? 'timer_off' : 'timer' }}</md-icon>
      </md-button>
      <span class="md-caption">{{ streamId }}</span>
      <div class="md-toolbar-section-end stream-content__header-buttons">
        <md-field
          class="stream-content__filter"
          md-clearable>
          <label>Stream filter</label>
          <md-input v-model="streamLineFilter"/>
        </md-field>
        <md-button
          v-if="!activeStreamIsLast(streamId)"
          class="md-icon-button"
          @click="streamMoveDown(streamId)">
          <md-icon>keyboard_arrow_down</md-icon>
        </md-button>
        <md-button
          v-if="!activeStreamIsFirst(streamId)"
          class="md-icon-button"
          @click="streamMoveUp(streamId)">
          <md-icon>keyboard_arrow_up</md-icon>
        </md-button>
        <md-button
          v-if="!activeStreamIsFirst(streamId) || !activeStreamIsLast(streamId)"
          class="md-icon-button"
          @click="streamClose(streamId)">
          <md-icon>clear</md-icon>
        </md-button>
      </div>
    </md-toolbar>
    <md-content class="backlog">
      <md-empty-state
        v-if="!orderedBacklog.length"
        :md-label="`Nothing for: ${streamId}`"
        class="md-accent"
        md-icon="remove_circle_outline"
        md-description="Select other stream or check your r-tail client" />
      <vue-scroll
        v-if="orderedBacklog.length"
        ref="scrollContent"
        :ops="scrollbarOpts"
        class="backlog__wrapper"
        @handle-scroll="scrollHandle"
        @handle-resize="scrollResize">
        <transition-group
          name="backlog__line-transition"
          tag="div">
          <div
            v-for="line in backlogFilter(orderedBacklog)"
            :key="line.uid"
            class="backlog__line-container hljs">
            <div
              v-if="showTimestamp"
              class="backlog__line-timestamp">
              {{ line.dateString }}
            </div>
            <div
              v-highlightjs="line.html"
              v-if="line.isJSON"
              class="backlog__line-content backlog__line-content-highlight">
              <pre><code class="json"/></pre>
            </div>
            <div
              v-if="!line.isJSON"
              class="backlog__line-content backlog__line-content-text"
              v-html="line.html"/>
          </div>
        </transition-group>
      </vue-scroll>
      <span
        v-if="showResumeButton"
        class="backlog-resume-btn"
        @click="scrollResume()">
        Resume
      </span>
    </md-content>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  components: {},
  props: {
    streamId: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    showTimestamp: true,
    showResumeButton: false,
    streamLineFilter: '',
    scrollbarOpts: {
      bar: { onlyShowBarOnScroll: false, keepShow: true },
    },
  }),
  computed: {
    ...mapGetters([
      'activeStreamIsLast',
      'activeStreamIsFirst',
    ]),
    ...mapState({
      isloadingComplete: state => state.isStreamsLoaded,
      fontSize: state => state.settings.fontSize,
      isDescOrder: state => state.settings.sorting === 'desc',
    }),
    orderedBacklog(state) {
      return this.$store.getters.backlogDESC(this.streamId);
    },
  },
  mounted() {
    this.$nextTick(function () {
      this.$socket.emit('streamSubscribe', this.$props.streamId);
    });
  },
  beforeDestroy() {
    this.$socket.emit('streamUnsubscribe', this.$props.streamId);
  },
  methods: {
    streamMoveUp(streamId) {
      this.$store.commit('activeStreamMove', { streamId, direction: 1 });
    },
    streamMoveDown(streamId) {
      this.$store.commit('activeStreamMove', { streamId, direction: -1 });
    },
    streamClose(streamId) {
      this.$store.commit('activeStreamClose', { streamId });
    },
    backlogFilter(backlog = []) {
      const filter = (this.streamLineFilter || '').trim();
      if (!filter) return backlog;

      const regExp = new RegExp(this.streamLineFilter);
      return backlog.filter(line => regExp.test(line.content));
    },
    scrollHandle(vertical) {
      this.showResumeButton = this.isDescOrder ? vertical.process > 0 : vertical.process < 1;
    },
    scrollResize(vertical) {
      if (this.showResumeButton) {
        this.showResumeButton = this.isDescOrder ? vertical.process > 0 : vertical.process < 1;
      }

      if (!this.showResumeButton && !this.isDescOrder) {
        const doms = this.$refs.scrollContent.getCurrentviewDom();
        this.$refs.scrollContent.scrollTo({ y: doms[0].clientHeight }, false);
      }
    },
    scrollResume() {
      let scrollToY = 0;
      if (!this.isDescOrder) {
        const doms = this.$refs.scrollContent.getCurrentviewDom();
        scrollToY = doms[0].clientHeight;
      }

      this.$refs.scrollContent.scrollTo({ y: scrollToY });
    },
  },
};
</script>

<style>
.backlog {
  max-height: calc(100% - 64px);
  height: 100%;
}
.backlog__line-container.hljs {
  padding: 5px 0;
}
.backlog__line-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}
.backlog__line-transition-enter-active {
  transition: background-color 1s;
}
.backlog__line-transition-enter {
  background-color: #98f598;
}
.backlog__line-timestamp {
  width: 115px;
  font-size: 0.8em;
  padding-left: 5px;
  flex-shrink: 0;
}
.backlog__line-container {
  line-height: 1.1em;

  pre {
    margin: 0;
  }
}
.backlog__line-content {
  padding-left: 5px;
  word-break: break-word;
}
.stream-content__filter {
  max-width: 200px;
}
.backlog__line-content-highlight .hljs {
  background-color: inherit;
}
.backlog-resume-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    padding: 5px 20px;
    border-radius: 15px;
    background-color: #a0fba0;
    cursor: pointer;
}
</style>
