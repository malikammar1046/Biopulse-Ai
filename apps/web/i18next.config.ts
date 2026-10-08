export default {
  locales: [
    "en",
    "ur"
  ],
  extract: {
    input: "src/**/*.{ts,tsx}",
    output: "src/i18n/locales/{{language}}/{{namespace}}.json"
  }
}