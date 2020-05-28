<template>
  <div>
    <v-card>
      <v-card-title primary-title>
        Torrents
      </v-card-title>
      <v-card-text>
        <!-- Add torrent dialog -->
        <v-dialog v-model="addTorrent" persistent max-width="600px">
          <template v-slot:activator="{ on }">
            <v-btn block color="primary" v-on="on">Add torrent</v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">Add Torrent</span>
            </v-card-title>
            <v-card-text>
              <v-form>
                <v-text-field
                  v-model="searchterm"
                  flat
                  label="Search movie"
                  prepend-icon="mdi-magnify"
                  solo-inverted
                  clearable
                  autocomplete="false"
                  @keyup="search"
                ></v-text-field>
                <v-list v-if="items_search.length != 0" two-line>
                  <v-list-item
                    v-for="item of items_search"
                    :key="item.id"
                    @click="
                      id = item.id
                      items_search = []
                      searchterm = ''
                    "
                  >
                    <v-list-item-avatar>
                      <v-img
                        v-if="item.poster_path"
                        :src="
                          'https://image.tmdb.org/t/p/w300/' + item.poster_path
                        "
                      ></v-img>
                    </v-list-item-avatar>

                    <v-list-item-content>
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.release_date }}</v-list-item-subtitle
                      >
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
                <!-- <v-select
              v-model="type"
              :items="items"
              label="Type of Content:"
              outlined
              @input="$v.type.$touch()"
              @blur="$v.type.$touch()"
            ></v-select> -->
                <v-text-field
                  v-model="id"
                  disabled
                  label="ID TMDB"
                  readonly
                  prepend-icon="mdi-youtube"
                  @input="$v.id.$touch()"
                  @blur="$v.id.$touch()"
                ></v-text-field>
                <v-textarea
                  v-model="urls"
                  label="URL (MAGNEN, TORRENT FILE)"
                  prepend-icon="mdi-link"
                  outlined
                  @input="$v.urls.$touch()"
                  @blur="$v.urls.$touch()"
                ></v-textarea>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="addTorrent = false"
                >Close</v-btn
              >
              <v-btn
                :disabled="$v.$invalid"
                color="blue darken-1"
                text
                @click="add()"
                >Add</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Tabs type -->
        <v-container>
          <v-tabs v-model="type" grow centered @change="sync">
            <v-tabs-slider></v-tabs-slider>
            <v-tab href="#activated">actives</v-tab>
            <v-tab href="#finished">finished</v-tab>
          </v-tabs>
        </v-container>
        <!-- List torrents -->
        <v-list>
          <v-list-item v-for="torrent of torrents" :key="torrent.hash" two-line>
            <v-list-item-icon>
              <v-icon>mdi-cloud-download-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ torrent.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ torrent.status }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="torrents.length == 0">
            <v-list-item-icon>
              <v-icon>mdi-emoticon-sad-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>No torrents found</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    <!-- Toast -->
    <v-snackbar v-model="toast.show" :color="toast.color">
      {{ toast.message }}
      <v-btn @click.native="toast.show = false">Close</v-btn>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { required } from 'vuelidate/lib/validators'

export default Vue.extend({
  data() {
    return {
      addTorrent: false,
      id: '',
      urls: '',
      /* type: '', */
      /* items: ['Movie', 'Show'], */
      toast: {
        message: '',
        show: false,
        color: 'success'
      },
      torrents: [],
      searchterm: '',
      items_search: [],
      type: 'activated'
    }
  },
  async mounted() {
    await this.sync()
    setInterval(async () => {
      await this.sync()
    }, 20000)
  },
  validations: {
    id: { required },
    urls: { required }
    /* type: { required }, */
  },
  methods: {
    async search() {
      if (this.searchterm !== '') {
        const result = await this.$axios.$get(
          `${this.$store.getters.config.tmdb_baseurl}/search/movie`,
          {
            params: {
              api_key: this.$store.getters.config.tmdb_key,
              query: this.searchterm
            }
          }
        )
        this.items_search = result.results
      }
    },
    async add() {
      try {
        // Get tmdb data
        const tmdb = await this.$axios.$get(
          `${this.$store.getters.config.tmdb_baseurl}/movie/${this.id}`,
          {
            params: {
              api_key: this.$store.getters.config.tmdb_key
            }
          }
        )
        // Add torrent to api
        this.$axios.$post('./api/addTorrent', {
          torrent: this.urls,
          tmdb
        })
        // Reset values
        this.$v.$reset()
        this.id = ''
        this.urls = ''
        /* this.type = '' */
        this.addTorrent = false
        // Show toast
        this.toast = {
          show: true,
          message: 'Successfully added',
          color: 'success'
        }
        // Sync data
        this.sync()
      } catch (error) {
        console.log(error)
      }
    },
    async sync() {
      const torrents = await this.$axios.$get('./api/getTorrents', {
        params: { type: this.type }
      })
      this.torrents = torrents
    }
  },
  head: {
    title: 'Home'
  }
})
</script>
