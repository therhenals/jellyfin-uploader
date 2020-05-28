import colors from 'vuetify/es5/util/colors'
// Db imports
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

// Db init
const adapter = new FileSync('./api/db.json')
const db = low(adapter)

require('dotenv').config()

// defaults values db
db.defaults({
  torrents: [],
  config: {
    user: 'admin',
    pass: 'admin',
    jellyfin_server: '',
    jellyfin_key: '',
    qbt_server: '',
    qbt_user: '',
    qbt_pass: '',
    tmdb_key: '',
    tmdb_baseurl: '',
    rclone_server: '',
    redis_server: '',
    completed: 'false'
  }
}).write()

const config = db.get('config').value()

export default {
  mode: 'universal',
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: '%s - ' + 'Jellyfin Uploader',
    title: 'Jellyfin Uploader' || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: ['~/plugins/vuelidate'],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: ['@nuxt/typescript-build', '@nuxtjs/vuetify'],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    'nuxt-basic-auth-module'
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    baseURL: process.env.BASE_URL
  },
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        }
      }
    }
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    /* extend(config, ctx) {} */
  },
  basic: {
    name: config.user,
    pass: config.pass,
    enabled: true
  },
  typescript: {
    typeCheck: {
      eslint: true
    }
  },
  serverMiddleware: ['~/api/index'],
  server: {
    port: 3001, // default: 3000
    host: '0.0.0.0' // default: localhost
  },
  router: {
    middleware: ['config']
  }
}
