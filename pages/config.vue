<template>
  <div>
    <v-card>
      <v-card-title primary-title>
        Config
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="config.user"
          outlined
          label="User"
          prepend-icon="mdi-account"
          @input="$v.config.user.$touch()"
          @blur="$v.config.user.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.pass"
          outlined
          label="Password"
          type="password"
          prepend-icon="mdi-key"
          @input="$v.config.pass.$touch()"
          @blur="$v.config.pass.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.jellyfin_server"
          outlined
          label="Jellyfin server"
          type="text"
          prepend-icon="mdi-filmstrip"
          @input="$v.config.jellyfin_server.$touch()"
          @blur="$v.config.jellyfin_server.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.jellyfin_key"
          outlined
          label="Jellyfin APIKEY"
          prepend-icon="mdi-key"
          @input="$v.config.jellyfin_key.$touch()"
          @blur="$v.config.jellyfin_key.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.qbt_server"
          outlined
          label="QBT server"
          prepend-icon="mdi-cloud-download-outline"
          @input="$v.config.qbt_server.$touch()"
          @blur="$v.config.qbt_server.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.qbt_user"
          outlined
          label="QBT user"
          prepend-icon="mdi-account"
          @input="$v.config.qbt_user.$touch()"
          @blur="$v.config.qbt_user.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.qbt_pass"
          outlined
          label="QBT password"
          type="password"
          prepend-icon="mdi-key"
          @input="$v.config.qbt_pass.$touch()"
          @blur="$v.config.qbt_pass.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.tmdb_key"
          outlined
          label="TMDB APIKEY"
          prepend-icon="mdi-key"
          @input="$v.config.tmdb_key.$touch()"
          @blur="$v.config.tmdb_key.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.tmdb_baseurl"
          outlined
          label="TMDB baseurl"
          prepend-icon="mdi-link"
          @input="$v.config.tmdb_baseurl.$touch()"
          @blur="$v.config.tmdb_baseurl.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.rclone_server"
          outlined
          label="RCLONE server"
          prepend-icon="mdi-cloud-upload"
          @input="$v.config.rclone_server.$touch()"
          @blur="$v.config.rclone_server.$touch()"
        ></v-text-field>
        <v-text-field
          v-model="config.redis_server"
          outlined
          label="REDIS server"
          prepend-icon="mdi-cloud-upload"
          @input="$v.config.redis_server.$touch()"
          @blur="$v.config.redis_server.$touch()"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn
          :disabled="$v.config.$invalid"
          color="blue darken-1"
          @click="save()"
          >Save</v-btn
        >
      </v-card-actions>
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
  async asyncData({ $axios }) {
    const config = await $axios.$get('/api/config')
    return { config }
  },
  data() {
    return {
      toast: {
        message: '',
        show: false,
        color: 'success'
      },
      config: {
        user: '',
        pass: '',
        jellyfin_server: '',
        jellyfin_key: '',
        qbt_server: '',
        qbt_user: '',
        qbt_pass: '',
        tmdb_key: '',
        tmdb_baseurl: '',
        rclone_server: '',
        redis_server: ''
      }
    }
  },
  validations: {
    config: {
      user: { required },
      pass: { required },
      jellyfin_server: { required },
      jellyfin_key: { required },
      qbt_server: { required },
      qbt_user: { required },
      qbt_pass: { required },
      tmdb_key: { required },
      tmdb_baseurl: { required },
      rclone_server: { required },
      redis_server: { required }
    }
  },
  methods: {
    async save() {
      await this.$axios.$post('/api/config', this.config)
      this.toast.show = true
      this.toast.message = 'Save ok'
      window.location.reload(true)
    }
  }
})
</script>
