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

  init() {
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
    const json = await (await fetch('./sample.json')).text();
    this.setJson(json);
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
      const res = await whoAmI(token);
      if (!res.ok) {
        this.error = 'Token does not seem to be valid.';
        this.botName = '';
      }
      else {
        const json = await res.json();
        this.botName = json.displayName;
      }
    }
    catch(e) {
      this.error = 'Not able to verify token at the moment.';
      console.log(e);
      this.botName = '';
    }
  },

  restoreValues() {
    this.botToken = localStorage.getItem('lastToken');
    this.currentJson = localStorage.getItem('lastJson');
    this.recipient = localStorage.getItem('lastRecipient');
  },

  rememberData() {
    localStorage.setItem('lastToken', this.botToken);
    localStorage.setItem('lastJson', this.currentJson);
    localStorage.setItem('lastRecipient', this.recipient);
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

  async send() {
    this.error = false;
    this.sending = true;
    this.success = false;
    this.rememberData();

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
      const { version, schema, body, type } = json;
      if (!type) {
        this.error = 'Adaptive card is missing "type" attribute.';
        return false;
      }
      else if (!version) {
        this.error = 'Adaptive card is missing "version" attribute.';
        return false;
      }
      else if (!versions.some(v => v === version)) {
        this.error = 'Adaptve card version not supported. Allowed: ' + versions.join(', ');
        return false;
      }
      return true;
    }
    catch(e) {
      return false;
    }
  },

  get canSend() {
    return this.validJson && this.botToken && this.recipient;
  }
};
