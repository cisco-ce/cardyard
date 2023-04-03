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

function sendWebexCard(token, email, text, card) {
  const url = apiUrl + 'messages';
  const body = {
    text,
    toPersonEmail: email,
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: card,
      },
    ]
  };

  return webex(url, token, 'POST', JSON.stringify(body));
}
