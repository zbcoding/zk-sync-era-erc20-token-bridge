/// deposit.js

import * as zksync from "zksync-web3";
import { ethers } from "ethers";
import { erc20abi } from "./erc20abi";

///NEVER PUBLISH THE PRIVATE KEY OR LEAVE THE PK IN GIT HISTORY
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ZK_URL = process.env.ZK_URL;
const ERC20_ADDR = process.env.ERC20_ADDR;
const ERC20_ZK_ADDR = process.env.ERC20_ZK_ADDR;
const ERC20_DECIMALS = process.env.ERC20_DECIMALS;
const ERC20_AMOUNT = process.env.ERC20_AMOUNT;

const zkSyncProvider = new zksync
    .Provider(ZK_URL);
const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
const wallet = new zksync.Wallet(PRIVATE_KEY, zkSyncProvider, ethereumProvider);

const errorFlag = false;

//connect metamask first before enabling other buttons
document.querySelector(".enableEthereumButton").addEventListener("click", async () => {
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const account = accounts[0];
            document.querySelector(".showAccount").innerHTML = account;

            // Enable buttons
            document.querySelector(".approveTokenButton").disabled = false;
            document.querySelector(".depositButton").disabled = false;
            document.querySelector(".withdrawButton").disabled = false;
            document.querySelector(".finWithdrawButton").disabled = false;
            

            if (ethereumProvider._network.name === "homestead") {
                const ethBalanceL1 = await wallet.getBalanceL1();
                const tokenBalanceL1 = await wallet.getBalanceL1(ERC20_ADDR);
                const ethBalanceL1Formatted = ethers.utils.formatUnits(ethBalanceL1, 18); // Assuming 18 decimals for Ether
                const tokenBalanceL1Formatted = ethers.utils.formatUnits(tokenBalanceL1, ERC20_DECIMALS); // Assuming 18 decimals for the ERC20 token
                console.log("ETH Balance:", ethBalanceL1Formatted);
                console.log("Token Balance:", tokenBalanceL1Formatted);
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log("MetaMask is not installed!");
    }
});

//2 approve tokens button
document.querySelector(".approveTokenButton")
    .addEventListener("click", approveERC20);

let approvalFlag = false;
async function approveERC20() {
    if (!window.ethereum.selectedAddress) {
        console.log("Please connect MetaMask first.");
        return;
    }

    if (approvalFlag) {
        console.error("Approval already started");
        return;
    }
    approvalFlag = true;

    const signer = ethereumProvider.getSigner();
    const tokenContract =
        new ethers.Contract(ERC20_ADDR, erc20abi, signer);

    var zk_contract = await wallet.getMainContract();

    const txHandle = await tokenContract
        .approve(zk_contract.address, 1000 * 10 ^ ERC20_DECIMALS)

    await txHandle.wait().then((_result) => {
        console.log("Approve Token tx sent");
        approvalFlag = false;
    });
}

//3 deposit tokens button
const depositButton = document.querySelector(".depositButton");
if (depositButton) {
    depositButton.addEventListener(
        "click",
        function () {
            depositERC20();
        },
        false);
}
let depositFlag = false;

async function depositERC20() {
    console.log("depositERC20");
    document.querySelector(".showTransactionSent").innerHTML = "Sending...";
    if (!window.ethereum.selectedAddress) {
        console.log("Please connect MetaMask first.");
        return;
    }
    if (depositFlag) {
        console.log("Deposit transaction already started");
        return;
    }
    try {
        const depositAmount = ethers.utils.parseUnits(ERC20_AMOUNT.toLocaleString().trim(), ERC20_DECIMALS);

        const ercDepositHandle = await wallet.deposit({
            token: ERC20_ADDR,
            amount: depositAmount,
            approveERC20: true,
        });
        console.log(ercDepositHandle);

        console.log("Transaction started");
        document.querySelector(".showTransactionSent").innerHTML = "Transaction started...";

        await ercDepositHandle.waitL1Commit().then((_result) => {
            console.log("Transaction sent");
            document.querySelector(".showTransactionSent").innerHTML = "Transaction sent!";
            depositFlag = false;
        });
    }
    catch (error) {
        if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
            if (errorFlag == false) {
                alert(
                    "Insufficient Ether in your wallet to cover gas fees. " +
                    "Please add Ether to your wallet and try again."
                );
                errorFlag = true;
            }
        } else {
            console.error(error);
            document.querySelector(".showTransactionSent").innerHTML = "An error occurred while processing the transaction.\n" +
                "Please check the console for more details.\n" + "Wait. The transaction may be successful if this is a metamask error";
        }
    }
    finally {
        depositFlag = false;
    }
}

//withdraw button
const withdrawButton = document.querySelector(".withdrawButton");
if (withdrawButton) {
    withdrawButton.addEventListener(
        "click",
        function () {
            withdrawERC20();
        },
        false);
}
async function withdrawERC20() {
    console.log("WithdrawERC20");
    // const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    // const account = accounts[0];
    if (!window.ethereum.selectedAddress) {
        console.log("Please connect MetaMask first.");
        return;
    }
    const withdrawAmount = ethers.utils.parseUnits(ERC20_AMOUNT.toLocaleString().trim(), ERC20_DECIMALS);
    const ethWalletAddr = wallet.ethWallet().address;
    const transaction = {
        token: ERC20_ZK_ADDR,
        amount: withdrawAmount,
        to: ethWalletAddr,
    };
    console.log(transaction);
    const withdraw = await wallet.withdraw(transaction).then((response) => {
        console.log(response);
        let txHash = response.hash;
        document.querySelector(".showWithdrawSent").innerHTML = "Withdraw transaction sent. \n" +
            "Wait and check the block explorer for a few minutes after pressing withdraw. \n"
            + "The withdraw should soon be shown in the current balance on ZK, \n"
            + "but there is a 24 hour time delay before the tokens are available on layer 1: \n"
            + "https://era.zksync.io/docs/dev/troubleshooting/withdrawal-delay.html \n"
            + "Save the hash for finalizing the withdraw: " + txHash;
    });
}


//balance button
const balanceButton = document.querySelector(".balanceButton");
if (balanceButton) {
    balanceButton.addEventListener(
        "click",
        function () {
            getBalance();
        },
        false);
}
async function getBalance() {
    const balance = await wallet.getBalance(
        ERC20_ZK_ADDR,
    ).then((result) => {
        const balance_big = ethers.BigNumber.from(result);
        let balance_regular = ethers.utils.formatUnits(balance_big, ERC20_DECIMALS);
        console.log("Token Balance: ", balance_regular);
        document.querySelector(".showBalance").innerHTML = `Token balance on ZK: ${balance_regular.toLocaleString()}`;
    });
}

const finWithdrawButton = document.querySelector(".finWithdrawButton");
if (finWithdrawButton) {
    finWithdrawButton.addEventListener(
        "click",
        function () {
            finWithdrawERC20();
        },
        false);
}

async function finWithdrawERC20() {
    console.log("Finalize Withdraw");
    document.querySelector(".finWithdrawSent")
        .innerHTML = "Finalizing withdraw on Layer 1...";
    let chainId = ethereumProvider._network.chainId;
    if (
        //zk era testnet
        chainId === 280
        //zk era mainnet
        || chainId === 324) {
        document.querySelector(".finWithdrawSent")
            .innerHTML = "Wrong network, still on Layer 2. Need to switch to Layer 1 to finalize withdraw";
        console.log("Wrong network, still on Layer 2. Need to switch to Layer 1 to finalize withdraw");
        return
    }

    let withdrawalHash = process.env.ZK_WITHDRAW_TX_HASH;
    await wallet.finalizeWithdrawal(
        withdrawalHash).then((txResponse) => {
            console.log(txResponse);
            document.querySelector(".finWithdrawSent")
                .innerHTML = "Finalize transaction sent. Check layer 1 block explorer to confirm.";
        })
        .catch((error) => {
            document.querySelector(".finWithdrawSent")
                .innerHTML = "Error occured. Check the browser console and/or retry.\n"
                + "Is the first withdraw transaction verified on L2 and executed on L1?";
            console.error(error);
            });
}
