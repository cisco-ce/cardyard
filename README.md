# The Card Yard

Simple web app that let's you test and send adaptive card to a Webex client.
Simply provide a bot token, a card JSON and a recipient and send the card.

The app is hosted on Github pages and can be used there for free without any user etc.

<a href="https://cisco-ce.github.io/cardyard/">Try it now</a>

Features:

* Validates the card JSON
* Checks that the size of the card does not exeed the maximum
* Remembers the last used token in your browser's local storage
* Verifies the bot token when entering it
* Gives warning on common errors such as missing id field for input elements in the card