const apiUrl = 'https://api.ciscospark.com/v1/';

function webex(url, token, method = "GET", body = null) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json; charset=utf-8");
    headers.append("Authorization", `Bearer ${token}`);
    return fetch(url, { method, headers, body });
}

function whoAmI(token) {
  return webex(apiUrl + 'people/me', token);
}

function sendWebexCard(token, to, text, card) {
  const url = apiUrl + 'messages';
  const body = {
    text,
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: card,
      },
    ]
  };

  if (to.includes('@')) {
    body.toPersonEmail = to;
  }
  else {
    // typically Y2lzY29zcGFyazovL3VzL1JPT00vM2ZlMDgwMTAtZDIxZi0xMWVkLTgyY2MtMGQ2YzgwYTYxMTA1
    // => ciscospark://us/ROOM/3fe08010-d21f-11ed-82cc-0d6c80a61105
    let roomId = to;

    // id as you get it from webex client. assume US location
    if (to.length === 36) {
      roomId = btoa('ciscospark://us/ROOM/' + to);
    }
    body.roomId = roomId;
  }

  return webex(url, token, 'POST', JSON.stringify(body));
}
