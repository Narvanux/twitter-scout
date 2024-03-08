var styles = `
    article[scout-stored] {
      border: dashed 1px red
    }

    button.scout-btn[in-db="true"] {
      background-color: green
    }
    button.scout-btn[in-db="false"] {
      background-color: red
    }

    button.scout-btn {
      margin-left: 4px
      color: white
      font-weight: bold
    }
`

import { startObserving } from "./start-observing";

//div[data-testid="cellInnerDiv"] li svg
//section[aria-labelledby="accessible-list-12"]

export let localDatabase = {}

var styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender == true) {
        checkUploaded()
    }
});

function checkUploaded() {
  browser.runtime.sendMessage({ type: "getDB" })
  .then(response => {
    // Log the variable value received from the background script
    if (response.status == true) {
      localDatabase = response.database
      checkExistance()
    } else {
      window.setTimeout(checkUploaded, 1000);
    }
  })
  .catch(error => {
    console.error("Error receiving variable from background:", error);
    window.setTimeout(checkUploaded, 1000);
  });
}

function checkExistance() {
  var element = document.querySelector('article')
  if(element === null) {
    window.setTimeout(checkExistance, 1500);
  } else {
    startObserving()
  }
}

checkUploaded()
