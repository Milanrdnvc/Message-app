const sendBtn = document.querySelector('button');
const msgInput = document.querySelector('input');
const msgOutput = document.querySelector('.messages');
const USER_ID = !localStorage.getItem('userId')
  ? generateID()
  : localStorage.getItem('userId');
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

function generateID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function fetchOK(url, options) {
  return fetch(url, options).then(res => {
    if (res.status < 400) return res;
    else throw new Error(res.statusText);
  });
}

async function pollMessages() {
  let tag;
  for (;;) {
    let res;

    try {
      res = await fetchOK('/messages', {
        headers: tag && { 'If-None-Match': tag, Prefer: 'wait=90' },
      });
    } catch (err) {
      console.log('Request failed: ' + err);
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }

    if (res.status === 304) continue;
    tag = res.headers.get('ETag');
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
      id: USER_ID,
    }),
  });
  msgInput.value = '';
}

function renderMessage(messages) {
  msgOutput.innerHTML = '';
  messages.forEach(msg => {
    const isYou = localStorage.getItem('userId') === msg.id;
    const msgP = document.createElement('p');
    msgP.classList.add(`${isYou ? 'your-message' : 'stranger-message'}`);
    msgP.innerText = `${isYou ? 'You:' : msg.username + ':'} ${msg.body}`;
    msgOutput.appendChild(msgP);
  });
}

if (!localStorage.getItem('username')) {
  localStorage.setItem('username', promptForUsername('Enter your username'));
}

if (!localStorage.getItem('userId')) {
  localStorage.setItem('userId', USER_ID);
}

sendBtn.addEventListener('click', postMessage);
sendBtn.addEventListener('touchend', e => {
  e.preventDefault(); // Prevents click from happening
  postMessage();
});
msgInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') {
    postMessage();
  }
});

pollMessages();
