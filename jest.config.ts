// jest.config.ts

import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	verbose: true,
	coverageDirectory: "coverage",
	collectCoverage: true,
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
	coverageThreshold: {
		global: {
			branches: 50,
			functions: 50,
			lines: 50,
			statements: 50,
		},
	},
	testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
	clearMocks: true,
	resetModules: true,
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{ useESM: true, tsconfig: "tsconfig.jest.json" },
		],
	},
};

module.exports = config;
