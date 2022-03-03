# About:
Hello and welcome to the ShibaBurn burning portal.
  This is a contract that empowers developers to
  create incentive based deflation for all ERC20 tokens!

ShibaBurn allows for an infinite number of burn pools
to be created for any given token. By default, burn pools track the following data:
  - total tokens burnt by each user
  - total tokens burnt by all users

ShibaBurn also allows for ETH to be "zapped" into burn pool ownershib by means of
buying the specified token on ShibaSwap, and burning it in one transaction. This
is only possible if eth-token liquidity is present on ShibaSwap.com


If configured by the ShibaBurn owner wallet, burn pools can optionally:
  - Mint xTokens for users (e.g. burntSHIB in the case of burning SHIB to the default pool)
  - Keep track of the index at which any given address exceeds a burnt amount beyond an admin specified threshold



Note: This is a fork of several pre-existing project repos. <3

# To RUN locally:

```bash
yarn install
yarn fork
```

> in a second terminal window, start the 📱 frontend:

```bash
cd ember-app
ember serve
```

> in a third terminal window, 🛰 deploy the contract:

```bash
yarn deploy --network localhost
```


Message @Ryoshis_Wifey on twitter for questions or concerns




