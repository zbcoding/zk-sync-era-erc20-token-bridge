/*
Restart the application after changing these values
Rename this file to .settings.js before using the app
*/

export let env = {
//remove from git before adding your private key
PRIVATE_KEY:"0xPrivateKey",
//The ERC20 contract address
ERC20_ADDR:"0xerc20ContractAddress",
//after deposit, you need to add this to attempt balance check and withdrawal:
ERC20_ZK_ADDR:"0xerc20AddressOnZKSyncEra",
ERC20_DECIMALS:18,
//for withdraw, you need the Transaction Hash of the L2 withdraw transaction
ZK_WITHDRAW_TX_HASH:"0x",
ZK_URL:"https://testnet.era.zksync.dev",

//ZK_URL for mainnet:
//"https://mainnet.era.zksync.io"
//Testnet explorer, ZKSync
//https://goerli.explorer.zksync.io/
//Mainnet explorer, ZKSync
//https://explorer.zksync.io/
//Testnet explorer, Ethereum Goerli
//https://goerli.etherscan.io/
//Mainnet explorer, Ethereum
//https://etherscan.io/
}
