# DDG Email Panel

An open source, unofficial panel for DuckDuckGo Email Protection — manages login, multi-account alias generation, and OTP-based authentication.

## Language

**Duck Address**:
A `@duck.com` email address used for DuckDuckGo Email Protection.
_Avoid_: Alias, email alias, forwarding address

**Main Duck Address**:
The user's primary `@duck.com` address, derived from their username.
_Avoid_: Primary alias, main address

**Private Duck Address**:
A generated, private alias that forwards to the user's Main Duck Address. Used to protect the real email from senders.
_Avoid_: Private alias, disposable address, temporary alias

**Access Token**:
An API token from DuckDuckGo that allows programmatic access to generate Private Duck Addresses. Used as an alternative to OTP login.
_Avoid_: API key, auth token, secret

**Account**:
A DuckDuckGo Email Protection user identity, identified by a UUID, with a username and access token. Multiple accounts can be managed simultaneously.

**Alias History**:
A per-account list of recently generated Private Duck Addresses, each recorded with its creation timestamp. Capped at the most recent 10 entries, oldest evicted first.
_Avoid_: History, email history, alias log, recent addresses

**OTP (One-time Passphrase)**:
A time-limited passphrase sent to the user's Duck Address for authentication. The OTP flow is used when the user does not have an Access Token.
_Avoid_: Code, verification code, magic link