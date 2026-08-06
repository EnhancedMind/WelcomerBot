import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: { js }, extends:
        ["js/recommended"],
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs"
        },
        rules: {
            // highlights assignments that are unnecessary or redundant
            "no-useless-assignment": "warn",

            //
            "no-async-promise-executor": "off",

            "no-empty": [
                "warn",
                { "allowEmptyCatch": true }
            ],


            // Highlights unused requires and destructured variables
            "no-unused-vars": [
                "warn", 
                { 
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_",
                    "caughtErrors": "none",
                    "ignoreRestSiblings": false 
                }
            ],
            // Optional: Warn about variables that are never reassigned
            "prefer-const": "warn"
        }
    },
]);
