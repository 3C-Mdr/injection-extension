
const CONFIG = {
  GRAYLOG: "http://192.168.4.77:9000", // done
  MISP:" http://192.168.4.81",  // done
  WAZUH:"https://192.168.4.76",  // done
  RAPID7:"https://insight.rapid7.com",  // done
  ARKIME:"http://192.168.4.102:8005", //done
  SUBLIME:"http://192.168.4.106:3000", // done 
  GRAYLOG2:"http://192.168.5.118:9000", // done
  BASE_URL_LOCAL:"http://192.168.4.42:5500/v1/soc/api/",
  BASE_URL_TEST:"http://192.168.4.202:5500/v1/soc/api/" ,
  BASE_URL_PROD:"http://192.168.5.192:5500/v1/soc/api"
};

const checkUrl = async (id,url) => {
  try {
    console.log(id,url,'id,url')
    const res = await fetch(`${CONFIG.BASE_URL_LOCAL}url-link-extensions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, url }),
    });
    const data = await res.json();
    return data;
   
  } catch (error) {
    console.log("Error:", error);
    }
};
let tempCredentials = null;

// More defensive implementation
if (chrome.webNavigation) {
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
        try {
            if (details && details.url) {
                const urlObj = new URL(details.url);
                
                if (urlObj.origin.toLowerCase().includes(CONFIG.RAPID7.toLowerCase())) {
                    const username = urlObj.searchParams.get("username");
                    const password = urlObj.searchParams.get("password");
                    
                    if (username && password) {
                        tempCredentials = { username, password };
                        console.log("Credentials captured");
                    }
                }
            }
        } catch (error) {
            console.error("Navigation listener error:", error);
        }
    },{ urls: [`*://${new URL(CONFIG.RAPID7).host}/*`] });
}
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);
    // const id = url.searchParams.get("id");
    let id;
    const nextUrl = url.searchParams.get("nextUrl");
    if (nextUrl) {
        const parsedNextUrl = new URL(
            "https://placeholder.com" + decodeURIComponent(nextUrl)
        );      
        id = parsedNextUrl.searchParams.get("id");
       
    } else {
        id = url.searchParams.get("id");
      
    }
    const res = await checkUrl(id,url.origin)

    try {
      let username = "";
      let password = "";

      if (res?.platForm?.toLowerCase()?.includes("graylog".toLowerCase())) {
        console.log(res.matchedUrl, 'GRAYLOG2');
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
    } else if ((res?.platForm?.toLowerCase().includes("misp".toLowerCase()))) { // MISP
        console.log(res.matchedUrl, 'MISP');
        username = url.searchParams.get("username");
        password = url.searchParams.get("password");
        const hashedrapidMISPData = await handleCredentials(username, password);
        if (username && password) {
            await chrome.scripting.executeScript({
                target: { tabId },
                func: autofillFormMISP,
                args: [hashedrapidMISPData.username, hashedrapidMISPData.password],
            });
        }
    } else if (res?.platForm?.toLowerCase()?.includes("wazuh".toLowerCase())) { // WAZUH
      console.log('Wazuh')
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
    } else if (url?.origin?.toLowerCase()?.includes(CONFIG.RAPID7.toLowerCase())) { // RAPID7
      
      if (tempCredentials) {
          const { username, password } = tempCredentials;
          
          const hashedrapidData = await handleCredentials(username, password);
          
          setTimeout(async () => {
              await chrome.scripting.executeScript({
                  target: { tabId },
                  func: autofillForm,
                  args: [hashedrapidData.username, hashedrapidData.password],
              });
              // Clear credentials after use
              tempCredentials = null;
          }, 2000);
      }
  } else if (res?.platForm?.toLowerCase()?.includes("arkime".toLowerCase())) { // ARKIME
        console.log(res.matchedUrl, "ARKIME");
        username = url.searchParams.get("username");
        password = url.searchParams.get("password");
        const hashedArkimeData = await handleCredentials(username, password);
        if (changeInfo.status === "complete" ) {  //&& tab.url.includes("192.168.4.102:8005") 192.168.4.102:8005
            chrome.tabs.update(tabId, { url: `http://${hashedArkimeData.username}:${hashedArkimeData.password}@${url.host}` });
        }
    } else if (res?.platForm?.toLowerCase()?.includes("sublime".toLowerCase())) { // SUBLIME
        console.log(res.matchedUrl, "SUBLIME");
        username = url.searchParams.get("username");
        password = url.searchParams.get("password");
        const hashedSublime = await handleCredentials(username, password);
        if (username && password) {
            setTimeout(async () => {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    func: autofillSublimeForm,
                    args: [hashedSublime.username, hashedSublime.password],
                });
            }, 2000);
        }
    } else {
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
  console.log(encryptedPassword,encryptedUsername,username,password,'111111111111111111111111')
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


const autofillSublimeForm =(email,password)=>{
  const emailField = document.querySelector('input[type="email"]');
  const passwordField = document.querySelector('input[type="password"]');
  const submitButton = document.querySelector('button[data-testid="login-with-email-cta"]');
  const secondsubmitButton = document.querySelector('button[data-testid="login-with-email-cta"]');
  if (emailField && passwordField && submitButton) {
    emailField.focus();
    emailField.value = email;
    emailField.dispatchEvent(new Event("input", { bubbles: true }));
    emailField.dispatchEvent(new Event("change", { bubbles: true }));
    submitButton.click();
    passwordField.focus();
    passwordField.value = password;
    passwordField.dispatchEvent(new Event("input", { bubbles: true }));
    passwordField.dispatchEvent(new Event("change", { bubbles: true }));
    setTimeout(()=>{
      secondsubmitButton.click();
    },1000)
  } else {
    console.error("Email or password fields not found.", email, password);
  }
}