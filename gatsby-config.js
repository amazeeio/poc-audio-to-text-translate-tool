require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

const { createProxyMiddleware } = require("http-proxy-middleware")

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  developMiddleware: app => {
    app.use(
      "/v1",
      createProxyMiddleware({
        target: process.env.GATSBY_LITELLM_API_URL || "https://llm.us104.amazee.ai",
        secure: false, // Ignore self-signed certificate errors
        changeOrigin: true,
      })
    )
  },
  siteMetadata: {
    title: `Audio to Text Translate Tool`,
    description: `A simple proof of concept for converting audio to text and translating it`,
    author: `amazeeio`,
    siteUrl: `https://poc.audio-to-text-translate-tool.amazee.io/`,
  },
  plugins: [
    `gatsby-plugin-postcss`,
  ],
}
