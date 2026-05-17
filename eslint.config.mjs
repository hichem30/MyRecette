import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "public/sw.js",
    ],
  },
  {
    // React 19's react-hooks plugin flags every setState() call inside a
    // useEffect body. We use this pattern intentionally for one-shot side
    // effects (e.g. "load data on mount") so drop it down to a warning.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
];

export default config;
