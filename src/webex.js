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

async function getRecipient(token, emailOrRoomId) {
  const isEmail = emailOrRoomId.includes('@');
  if (isEmail) {
    const url = apiUrl + 'people?email=' + emailOrRoomId;
    try {
      const res = await webex(url, token);
      if (res.ok) {
        const list = await res.json();
        if (list.items.length) {
          return {
            name: list.items[0].displayName,
            avatar: list.items[0].avatar?.replace('~1600', '~640'),
          }
        }
        else {
          return false;
        }
      }
      else {
        return false;
      }
    }
    catch(e) {
      console.log(e);
      return false
    }
  }
  else {
    const url = apiUrl + 'rooms/' + toProperId(emailOrRoomId);
    try {
      const res = await webex(url, token);
      if (res.ok) {
        const obj = await res.json();
        return {
          name: obj.title,
        };
      }
      else return false;
    }
    catch(e) {
      console.log(e);
      return false;
    }
  }

}

function toProperId(id) {
  // id as you get it from webex client. assume US location
  return (id.length === 36) ? btoa('ciscospark://us/ROOM/' + id) : id;
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
    const roomId = toProperId(to);
    body.roomId = roomId;
  }

  return webex(url, token, 'POST', JSON.stringify(body));
}
