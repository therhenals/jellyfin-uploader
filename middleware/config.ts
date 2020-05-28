import { Middleware } from '@nuxt/types'

const config: Middleware = (context) => {
  if (context.store.getters.config.completed === 'false') {
    context.redirect('/config')
  }
}

export default config
