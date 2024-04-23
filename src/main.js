const jsonHint = `Copy and paste your card JSON here.

{
  "type": "AdaptiveCard",
  "body": [...]
}
`;
const maxSize = 22740; // that's the entire message including text, markdown and attachment
const versions = ['1.0', '1.1', '1.2', '1.3'];

const model = {

  currentJson: '',
  botToken: '',
  recipient: '',
  sending: false,
  error: '',
  success: false,
  botName: '',
  botAvatar: '',
  recentTokens: [],

  init() {
    this.setupKeys();
    this.restoreValues();
    if (this.botToken) {
      this.checkToken();
    }
    const params = new URLSearchParams(location.search);
    if (params.has('sample')) {
      this.loadSample();
    }
  },

  async loadSample() {
    const json = await (await fetch('./src/sample.json')).text();
    this.setJson(json);
  },

  setupKeys() {
    window.onkeyup = (e) => {
      if ((e.key === 'Enter' || e.key === 'Return') && e.ctrlKey) {
        this.pasteAndSend();
      }
    }
  },

  async pasteAndSend() {
    await this.paste();
    if (this.validJson) {
      this.send();
    }
    else {
      alert('Pasted card, but didn\'t send since it is not valid.');
    }
  },

  setJson(json) {
    this.currentJson = json;
  },

  reformat() {
    try {
      const formatted = JSON.stringify(JSON.parse(this.currentJson), null, 2);
      this.currentJson = formatted;
    }
    catch(e) {
    }
  },

  async checkToken() {
    this.error = false;
    const token = this.botToken.trim();
    try {
      this.botName = '';
      this.botAvatar = '';
      const res = await whoAmI(token);
      if (!res.ok) {
        this.error = 'Token does not seem to be valid.';
        this.botName = '';
      }
      else {
        const json = await res.json();
        this.botName = json.displayName;
        this.botAvatar = json.avatar?.replace('~1600', '~640');
      }
    }
    catch(e) {
      this.error = 'Not able to verify token at the moment.';
      console.log(e);
      this.botName = '';
    }
  },

  tokenName(entry) {
    const start = entry.token.slice(0, 6);
    const end = entry.token.slice(-6)
    return `${entry.name} (${start}...${end})`;
  },

  setToken(token) {
    this.botToken = token;
    this.checkToken();
  },

  restoreValues() {
    const data = localStorage.getItem('card-yard');
    if (!data) return;
    try {
      const { tokens, json, recipient } = JSON.parse(data);
      this.recentTokens = tokens;
      this.botToken = tokens.at(-1).token;
      this.currentJson = json;
      this.recipient = recipient;
    }
    catch(e) {
      console.log('not able to parse data', e);
    }
  },

  rememberData() {
    const token = this.botToken;
    const tokens = this.recentTokens.filter(t => t.token !== token);
    tokens.push({ token, name: this.botName });
    const data = {
      tokens,
      json: this.currentJson,
      recipient: this.recipient,
    };
    localStorage.setItem('card-yard', JSON.stringify(data, null, 2));
  },

  async paste() {
    try {
      const json = await navigator.clipboard.readText();
      this.setJson(json);
      this.reformat();
    }
    catch(e) {
      console.log('not able to paste from clipboard', e);
    }
  },

  get messageSize() {
    // TODO count the rest of the metadata too
    return this.currentJson?.length || 0;
  },

  setRecipient(recipient) {
    // pasting Space Details straight from webex client:
    const roomIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
    const match = recipient.match(roomIdPattern);
    if (match) {
      this.recipient = match[0];
    }
    else {
      this.recipient = recipient;
    }
  },

  async send() {
    this.error = false;
    this.sending = true;
    this.success = false;

    try {
      const text = 'Testing card from The Card Yard.'
      const token = this.botToken;
      const to = this.recipient;
      const json = JSON.parse(this.currentJson);
      const res = await sendWebexCard(token, to, text, json);
      this.success = res.ok;
      if (!res.ok) {
        const json = await res.json();
        console.log(res, json);
        this.error = res.status + ': ' + json.message;
      }
      else {
        this.rememberData();
        alert('Card sent succesfully to ' + to);
      }
    }
    catch(e) {
      console.log(e);
      this.error = e.reason;
    }
    this.sending = false;
  },

  get validJson() {
    this.error = false;
    try {
      const json = JSON.parse(this.currentJson);
      const { version, type } = json;
      if (this.currentJson.length > maxSize) {
        this.error = `Card size is too large. Max: ${maxSize} characters.`;
        return false;
      }
      else if (!type) {
        this.error = 'Adaptive card is missing "type" attribute.';
        return false;
      }
      else if (!version) {
        this.error = 'Adaptive card is missing "version" attribute.';
        return false;
      }
      else if (!versions.some(v => v === version)) {
        this.error = 'Adaptive card version not supported. Allowed: ' + versions.join(', ');
        return false;
      }
      else {
        const invalid = findInvalidNodes(json);
        if (invalid) {
          this.error = `A node of type ${invalid.type} is missing an 'id' attribute.`;
          return false;
        }
      }
      return true;
    }
    catch(e) {
      this.error = 'Card data is not valid JSON.';
      return false;
    }
  },

  get canSend() {
    return this.validJson && this.botToken && this.recipient;
  }
};
