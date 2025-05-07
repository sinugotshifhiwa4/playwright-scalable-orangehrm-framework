# 🧪 Orange HRM Test Automation Framework

This repository contains the **Orange HRM Test Automation Framework**, built with **Playwright** and **TypeScript**. The framework emphasizes **scalability**, **security**, and **maintainability**, making it ideal for both **UI** and **API** testing.

---

## 📚 Table of Contents

* [Installation](#-installation)
* [Environment Setup](#-environment-setup)
* [Encryption](#-encryption)
* [Authentication & Test Context](#-authentication--test-context)
* [Running Tests](#-running-tests)
* [Available Additional Commands](#available-additional-commands)
* [Running Tests by Tag](#-running-tests-by-tag)
* [Reporting](#reporting)
* [Notes](#-notes)

---

## 🔧 Installation

Ensure **Node.js** is installed on your system. Then, install the project dependencies:

```bash
npm install
```

---

## ⚙️ Environment Setup

Before running tests, configure the appropriate environment and encryption settings.

### 1. Environment Configuration

Navigate to the `envs/` directory and use the provided example file to set up your environment:

```bash
cp envs/.env.uat.example envs/.env.uat
```

Update the new `.env.uat` file with your UAT credentials:

```env
PORTAL_USERNAME=your.username
PORTAL_PASSWORD=your.password
```

> ℹ️ The root `.env` file is automatically managed and does not require manual editing.

---

## 🔐 Encryption

Sensitive credentials are protected using **AES encryption** and **Argon2 hashing** to ensure security during test execution.

### 🔢 Command Line Utilities

#### Generate a Secret Key

```bash
npx cross-env PLAYWRIGHT_GREP=@generate-key npm run test:encryption:uat
```

#### Encrypt Environment Credentials

```bash
npx cross-env PLAYWRIGHT_GREP=@encrypt npm run test:encryption:uat
```

> 💡 Replace `uat` with `dev`, `prod`, or another configured environment. Ensure the corresponding `.env` file (e.g., `.env.dev`) exists.

**Example:**

```bash
npx cross-env PLAYWRIGHT_GREP=@generate-key npm run test:encryption:dev
```

> ⚠️ **You must generate the secret key before running the encryption command.**

---

## 🔐 Authentication & Test Context

Authentication and session handling are powered by **Playwright fixtures**, providing flexible and reusable test contexts.

### ✅ Login Configuration

Authentication can be customized per test:

```ts
test.use({
  requireAuthentication: false,
  requireAuthenticationState: false,
});
```

You can also configure login behavior dynamically:

```ts
test('Verify login with valid credentials', async ({ authenticationTestContext }) => {
  await authenticationTestContext.configureLoginState(true, false);
  // Your assertions here...
});
```

**Parameters:**

* `requireAuthentication`: Whether to perform login.
* `requireAuthenticationState`: Whether to persist login state.

**Examples:**

* Valid login: `true, false`
* Invalid login: `false, false`

### 🔄 Reusable Test Context

`AuthenticationTestContext` handles:

* Portal navigation
* Login using environment variables
* Auth state management (reuse or regeneration)

---

## 🧪 Running Tests

Use the following commands to run tests in different environments:

| Command                 | Description                                   |
| ----------------------- | --------------------------------------------- |
| `npm run test:auth:uat` | Run the **auth flow** and generate auth state |
| `npm run test:uat`      | Run **all tests** in the UAT environment      |

> 💡 Replace `uat` with `dev`, `prod`, etc., as needed.

**Example:**

```bash
npm run test:dev
```

---

## 📦 Available Additional Commands

Boost productivity and maintain code quality with the following utilities:

| Command          | Description                                |
| ---------------- | ------------------------------------------ |
| `npm run ui`     | Launch the **Playwright Test Runner UI**   |
| `npm run record` | Open the **Playwright Code Generator**     |
| `npm run report` | Open the **HTML report** from the last run |
| `npm run format` | Format code using **Prettier**             |

---

## 🏷️ Running Tests by Tag

Use the `PLAYWRIGHT_GREP` environment variable to filter tests by tag (e.g., `@sanity`, `@regression`).

### Example Commands

| Command                                                     | Description                         |
| ----------------------------------------------------------- | ----------------------------------- |
| `npx cross-env PLAYWRIGHT_GREP=sanity npm run test:uat`     | Run all **sanity** tests in UAT     |
| `npx cross-env PLAYWRIGHT_GREP=regression npm run test:uat` | Run all **regression** tests in UAT |

> 💡 Replace `uat` with `dev`, `prod`, or other supported environments.

---

## 📊 Reporting

### 🧾 Ortoni Report

The Ortoni report is configured to open automatically unless in a CI environment:

```ts
open: process.env.CI ? 'never' : 'always'
```

### 📈 Allure Report

To open and serve the Allure report:

```bash
npx allure serve allure-results
```

---

## 📝 Notes

* ❌ **Do NOT commit** `.env` or environment-specific files like `.env.uat`.
* 🔁 Regenerate encryption keys whenever credentials are updated.
* 📦 Always run `npm install` after switching branches or pulling changes.
* ⚡ Authentication state is reused to speed up test execution and reduce flakiness.
* 🔐 Secrets are managed securely through encrypted environment variables.
* 🤖 This framework is CI-ready and built for long-term scalability and reliability.

---