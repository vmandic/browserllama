const config = {
  testDir: "tests/e2e",
  timeout: 30000,
  use: {
    headless: process.env.HEADLESS === "1",
  },
};

module.exports = config;
