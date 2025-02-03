// // background.js

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);
    try {
      let username = "";
      let password = "";

      switch (url.origin) {
        case "http://192.168.4.77:9000":
          username = url.searchParams.get("username");
          password = url.searchParams.get("password");
          const hashedData = await handleCredentials(username, password);
          if (hashedData) {
            setTimeout(async () => {
              await chrome.scripting.executeScript({
                target: { tabId },
                func: autofillGrayForm,
                args: [hashedData.username, hashedData.password],
              });
            }, 5000);
          }
          break;
        case "http://192.168.4.81":
          username = url.searchParams.get("username");
          password = url.searchParams.get("password");
          const hashedrapidMISPData = await handleCredentials(
            username,
            password
          );
          if (username && password) {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: autofillFormMISP,
              args: [
                hashedrapidMISPData.username,
                hashedrapidMISPData.password,
              ],
            });
          }
          break;
        case "https://192.168.4.76":
          // console.log("Attempting Wazuh login");
          const nextUrl = url.searchParams.get("nextUrl");
          if (nextUrl) {
            const parsedNextUrl = new URL(
              "https://placeholder.com" + decodeURIComponent(nextUrl)
            );
            username = parsedNextUrl.searchParams.get("username");
            password = parsedNextUrl.searchParams.get("password");
          } else {
            username = url.searchParams.get("username");
            password = url.searchParams.get("password");
          }
          const hashwazuData = await handleCredentials(username, password);
          if (username && password) {
            setTimeout(async () => {
              await chrome.scripting.executeScript({
                target: { tabId },
                func: secureAutofillFormWazuh,
                args: [hashwazuData.username, hashwazuData.password],
              });
            }, 8000);
          }
          break;
        case "https://insight.rapid7.com":
          username = url.searchParams.get("username");
          password = url.searchParams.get("password");
          const hashedrapidData = await handleCredentials(username, password);
          if (username && password) {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: autofillForm,
              args: [hashedrapidData.username, hashedrapidData.password],
            });
          }
          break;

        case "http://192.168.4.102:8005":
          console.log("INTERIN ARKIMDATTA2");
          username = url.searchParams.get("username");
          password = url.searchParams.get("password");
          const hashedArkimeData = await handleCredentials(username, password);
            if (changeInfo.status === "complete" && tab.url.includes("192.168.4.102:8005")) {
              chrome.tabs.update(tabId, { url: `http://${hashedArkimeData.username}:${hashedArkimeData.password}@192.168.4.102:8005` });
            }
          break;

        default:
          console.log("No matching URL for automation:", url.href);
          return;
      }
    } catch (error) {
      console.error("Error in automation process:", error);
    }
  }
});

const handleCredentials = (username, password) => {
  const secretKey = "3columns";
  const encryptedPassword = decryptString(password, secretKey);
  const encryptedUsername = decryptString(username, secretKey);
  return {
    username: encryptedUsername,
    password: encryptedPassword,
  };
};

const decryptString = (encryptedStr, key) => {
  let decryptedStr = "";
  for (let i = 0; i < encryptedStr.length; i += 3) {
    const encryptedCharCode = parseInt(encryptedStr.substr(i, 3));
    const decryptedChar = String.fromCharCode(
      encryptedCharCode ^ key.charCodeAt(decryptedStr.length % key.length)
    );
    decryptedStr += decryptedChar;
  }
  return decryptedStr;
};

const autofillForm = async (email, password) => {
  const emailField = document.querySelector(
    `input[type="text"],input[name*="${email}"]`
  );
  const passwordField = document.querySelector(
    `input[type="password"],input[name*="${password}"]`
  );
  const submitButton = document.querySelector(
    "button[type='submit'], input[type='submit']"
  );

  if (emailField && passwordField) {
    emailField.value = email;
    emailField.dispatchEvent(new Event("input", { bubbles: true }));

    passwordField.value = password;
    passwordField.dispatchEvent(new Event("input", { bubbles: true }));
    if (submitButton) {
      submitButton.click();
    }
  } else {
    console.error("Email or password fields not found.");
  }
};
const autofillGrayForm = async (email, password) => {
  const emailField = document.querySelector(
    `input[type="text"],input[name*="username"]`
  );
  const passwordField = document.querySelector(
    `input[type="password"],input[name*="password"]`
  );
  const submitButton = document.querySelector("button[type='submit']");

  if (emailField && passwordField && submitButton) {
    emailField.focus();
    emailField.value = email;
    emailField.dispatchEvent(new Event("input", { bubbles: true }));
    emailField.dispatchEvent(new Event("change", { bubbles: true }));

    passwordField.focus();
    passwordField.value = password;
    passwordField.dispatchEvent(new Event("input", { bubbles: true }));
    passwordField.dispatchEvent(new Event("change", { bubbles: true }));

    submitButton.click();
  } else {
    console.error("Email or password fields not found.", email, password);
  }
};

const autofillFormMISP = (email, password) => {
  const emailField = document.querySelector("#UserEmail");
  const passwordField = document.querySelector("#UserPassword");
  const submitButton = document.querySelector("button[type='submit']");

  if (emailField && passwordField && submitButton) {
    emailField.value = email;
    emailField.dispatchEvent(new Event("input", { bubbles: true }));
    emailField.dispatchEvent(new Event("change", { bubbles: true }));

    passwordField.value = password;
    passwordField.dispatchEvent(new Event("input", { bubbles: true }));
    passwordField.dispatchEvent(new Event("change", { bubbles: true }));
    submitButton.click();
  } else {
    console.error("Form elements not found:");
    if (!emailField) console.error("Email field not found");
    if (!passwordField) console.error("Password field not found");
    if (!submitButton) console.error("Submit button not found");
  }
};


const secureAutofillFormWazuh = (username, password) => {
  const emailField = document.querySelector(
    'input[data-test-subj="user-name"]'
  );
  const passwordField = document.querySelector(
    'input[data-test-subj="password"]'
  );
  const submitButton = document.querySelector(
    'button[data-test-subj="submit"]'
  );
  if (emailField && passwordField && submitButton) {
    emailField.focus();
    emailField.value = username;
    emailField.dispatchEvent(new Event("input", { bubbles: true }));
    emailField.dispatchEvent(new Event("change", { bubbles: true }));

    passwordField.focus();
    passwordField.value = password;
    passwordField.dispatchEvent(new Event("input", { bubbles: true }));
    passwordField.dispatchEvent(new Event("change", { bubbles: true }));

    submitButton.click();
  } else {
    console.error("Email or password fields not found.", email, password);
  }
};
