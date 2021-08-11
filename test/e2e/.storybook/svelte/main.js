const TsconfigPathsPlugin  = require("tsconfig-paths-webpack-plugin");

module.exports = {
  stories: [
    "../../**/*.svelte.stories.mdx",
    "../../**/svelte.stories.@(js|jsx|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  typescript: {
    check: false,
    reactDocgen: false
  },
  webpackFinal: async (config) => {
    config.resolve.plugins.push(new TsconfigPathsPlugin({
      silent: true,
      configFile: "./tsconfig.json"
    }));

    return config;
  }
}
