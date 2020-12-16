const sendBtn = document.querySelector('button');
const msgInput = document.querySelector('input');
document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
});

function promptForUsername(message) {
  for (;;) {
    const username = prompt(message);
    if (!username || username === '') continue;
    return username;
  }
}

function fetchOK(url, options) {
  fetch(url, options).then(res => {
    if (res.status < 400) return res;
    else throw new Error(res.statusText);
  });
}

async function pollMessages() {
  let tag;
  for (;;) {
    let response;

    try {
      response = await fetchOK('/messages', {
        headers: tag && { 'If-None-Match': tag, Prefer: 'wait=90' },
      });
    } catch (e) {
      console.log('Request failed: ' + e);
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }

    if (response.status == 304) continue;
    tag = response.headers.get('ETag');
    renderMessage(await res.json());
  }
}

function postMessage() {
  if (msgInput.value === '') {
    alert('Please enter a valid message');
    return;
  }
  fetchOK('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: localStorage.getItem('username'),
      body: msgInput.value,
    }),
  });
  msgInput.value = '';
}

function renderMessage() {}

if (!localStorage.getItem('username')) {
  localStorage.setItem('username', promptForUsername('Enter your username'));
}

sendBtn.addEventListener('click', postMessage);
sendBtn.addEventListener('touchend', postMessage);
msgInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    postMessage();
  }
});
