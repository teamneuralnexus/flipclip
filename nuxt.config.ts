// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts", "nuxt-icon"],
  nitro: {
    runtimeConfig: {
      auth0Domain: process.env.AUTH0_DOMAIN,
      auth0ClientId: process.env.AUTH0_CLIENT_ID,
      auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET
    }
  }
})