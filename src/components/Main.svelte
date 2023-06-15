<script>
    import { Button, Card, CheckboxGroup, Input, Media } from "stwui";
    import { fade } from "svelte/transition";
    import { env } from "../.settings.js";
    import "../styles.css";

    import * as zksync from "zksync-web3";
    import { ethers } from "ethers";
    import { erc20abi } from "../erc20abi.js";
    import Notice from "./Notice.svelte";
    import TxCard from "./TxCard.svelte";

    const PRIVATE_KEY = env.PRIVATE_KEY;
    const ZK_URL = env.ZK_URL;
    const ERC20_ADDR = env.ERC20_ADDR;
    const ERC20_ZK_ADDR = env.ERC20_ZK_ADDR;
    const ERC20_DECIMALS = env.ERC20_DECIMALS;
    const ZK_WITHDRAW_TX_HASH = env.ZK_WITHDRAW_TX_HASH;

    const zkSyncProvider = new zksync.Provider(ZK_URL);
    const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
    const wallet = new zksync.Wallet(
        PRIVATE_KEY,
        zkSyncProvider,
        ethereumProvider
    );

    //button loading indicators
    let connectLoading = false;
    let approveLoading = false;
    let depositLoading = false;
    let withdrawLoading = false;
    let finalizeWithdrawLoading = false;
    let balanceLoading = false;

    let accountInfo = "";

    let depositButtonDisable = false;
    let depositAmountInput;
    let depositTxUrl = "";

    let withdrawButtonDisable = false;
    let withdrawAmountInput;
    let withdrawTxHash;
    let withdrawTxUrl = "";

    let finalizeWithdrawButtonDisable = false;
    let finalizeTx = "";
    let finalizeWithdrawTxUrl = "";

    let messageCheck = false;
    let connectedFlag = false;

    //connects metamask before enabling other buttons
    async function connectMetamaskButton() {
        connectLoading = true;
        if (typeof window.ethereum !== "undefined") {
            try {
                console.log(
                    "Connecting to metamask, Using network:",
                    ethereumProvider._network.name
                );
                console.log(ethereumProvider);
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });

                const account = await accounts[0];
                accountInfo = `Connected: ${account}`;

                // Enable buttons
                connectedFlag = true;

                if (ethereumProvider._network.name === "homestead") {
                    const ethBalanceL1 = await wallet.getBalanceL1();
                    const tokenBalanceL1 = await wallet.getBalanceL1(
                        ERC20_ADDR
                    );
                    const ethBalanceL1Formatted = ethers.utils.formatUnits(
                        ethBalanceL1,
                        18
                    ); // Assuming 18 decimals for Ether
                    const tokenBalanceL1Formatted = ethers.utils.formatUnits(
                        tokenBalanceL1,
                        ERC20_DECIMALS
                    ); // Assuming 18 decimals for the ERC20 token
                    console.log("ETH Balance:", ethBalanceL1Formatted);
                    console.log("Token Balance:", tokenBalanceL1Formatted);
                }
            } catch (error) {
                console.error(error);
            } finally {
                connectLoading = false;
            }
        } else {
            alert("MetaMask is not installed!");
        }
    }

    //2 approve tokens button
    let approvalFlag = false;
    async function approveERC20Button() {
        approveLoading = true;
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
        const tokenContract = new ethers.Contract(ERC20_ADDR, erc20abi, signer);

        var zk_contract = await wallet.getMainContract();

        const txHandle = await tokenContract
            .approve(zk_contract.address, (1000 * 10) ^ ERC20_DECIMALS)
            .catch(() => {
                approvalFlag = false;
                approveLoading = false;
            });

        await txHandle
            .wait()
            .then((_result) => {
                console.log("Approve Token tx sent");
            })
            .finally(() => {
                approvalFlag = false;
                approveLoading = false;
            });
    }

    //3 deposit tokens button
    let depositFlag = false;
    let errorFlag = false;
    async function depositERC20() {
        depositLoading = true;
        depositButtonDisable = true;
        console.log("depositERC20");
        document.querySelector(".showDepositTx").innerHTML = "Sending...";
        if (!window.ethereum.selectedAddress) {
            console.log("Please connect MetaMask first.");
            return;
        }
        if (depositFlag) {
            console.log("Deposit transaction already started");
            return;
        }
        try {
            const depositAmount = ethers.utils.parseUnits(
                depositAmountInput.toLocaleString().trim(),
                ERC20_DECIMALS
            );
            //start deposit
            const ercDepositHandle = await wallet.deposit({
                token: ERC20_ADDR,
                amount: depositAmount,
                approveERC20: false,
            });
            console.log("ercDepositHandle", ercDepositHandle);

            //gas info for console
            let maxFeePerGas = ethers.utils.formatUnits(
                ercDepositHandle.maxFeePerGas,
                "gwei"
            );
            let maxPriorityFeePerGas = ethers.utils.formatUnits(
                ercDepositHandle.maxPriorityFeePerGas,
                "gwei"
            );
            let gasLimit = ethers.utils.formatUnits(
                ercDepositHandle.gasLimit,
                0
            );
            console.log("maxFeePerGas", maxFeePerGas);
            console.log("maxPriorityFeePerGas", maxPriorityFeePerGas);
            console.log("gasLimit", gasLimit);

            console.log("Transaction started");
            document.querySelector(".showDepositTx").innerHTML =
                "Transaction started...";

            //check for deposit
            await ercDepositHandle.waitL1Commit().then((txResponse) => {
                console.log("Transaction sent");
                document.querySelector(".showDepositTx").innerHTML =
                    "Transaction sent!";
                depositFlag = false;
                console.log("Deposit tx response:", txResponse);
                let depositTxHash = txResponse.transactionHash;
                let chainId = zkSyncProvider._network.chainId;
                depositTxUrl = getExplorerTxUrl(depositTxHash, chainId);
                console.log("Deposit tx url:", depositTxUrl);
            });
        } catch (error) {
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
                document.querySelector(".showDepositTx").innerHTML =
                    "An error occurred while processing the transaction.\n" +
                    "Please check the console for more details.\n" +
                    "Is the right layer 1 network connected via metamask?\n";
            }
        } finally {
            depositFlag = false;
            depositLoading = false;
            depositButtonDisable = false;
        }
    }

    //balance button
    async function getBalance() {
        balanceLoading = true;
        let chainId = ethereumProvider._network.chainId;
        console.log("chainId", chainId);
        await wallet.getBalance(ERC20_ZK_ADDR).then((result) => {
            const balance_big = ethers.BigNumber.from(result);
            let balance_regular = ethers.utils.formatUnits(
                balance_big,
                ERC20_DECIMALS
            );
            console.log("Token Balance: ", balance_regular);
            balanceLoading = false;
            document.querySelector(
                ".showBalance"
            ).innerHTML = `Token balance on ZK: ${balance_regular.toLocaleString()}`;
        });
    }

    //withdraw button
    async function withdrawERC20() {
        console.log("WithdrawERC20");
        withdrawLoading = true;
        withdrawButtonDisable = true;
        if (!window.ethereum.selectedAddress) {
            console.log("Please connect MetaMask first.");
            return;
        }
        const withdrawAmount = ethers.utils.parseUnits(
            withdrawAmountInput.toLocaleString().trim(),
            ERC20_DECIMALS
        );
        const ethWalletAddr = wallet.ethWallet().address;
        const transaction = {
            token: ERC20_ZK_ADDR,
            amount: withdrawAmount,
            to: ethWalletAddr,
        };
        console.log(transaction);
        const withdraw = await wallet
            .withdraw(transaction)
            .then((response) => {
                console.log("Withdraw tx response:", response);
                withdrawTxHash = response.hash;
                let chainId = response.chainId;
                document.querySelector(".showWithdrawSent").innerHTML =
                    "Withdraw transaction sent. Save the transaction hash to use in the finalize withdraw step.";
                withdrawTxUrl = getExplorerTxUrl(withdrawTxHash, chainId);
                console.log("Withdraw tx url:", withdrawTxUrl);
            })
            .finally(() => {
                withdrawLoading = false;
                withdrawButtonDisable = false;
            });
    }

    //finalize withdraw button
    async function finalizeWithdrawERC20() {
        console.log("Finalize Withdraw");
        let chainId = ethereumProvider._network.chainId;
        if (
            //zk era testnet
            chainId === 280 ||
            //zk era mainnet
            chainId === 324
        ) {
            document.querySelector(".finalizeWithdrawSent").innerHTML =
                "Wrong network. First, switch to Layer 1 and refresh the page.";
            console.log("Wrong network. First, switch to Layer 1 and refresh");
            return;
        }
        finalizeWithdrawLoading = true;
        finalizeWithdrawButtonDisable = true;

        let inputTx = finalizeTx.toString().trim();
        let finalizeWithdrawTxHash;
        if (inputTx.length > 0) {
            finalizeWithdrawTxHash = inputTx;
        } else {
            finalizeWithdrawTxHash = ZK_WITHDRAW_TX_HASH;
        }

        console.log("Using tx hash:", finalizeWithdrawTxHash);
        const txResponse = await wallet
            .finalizeWithdrawal(finalizeWithdrawTxHash)
            .then((txResponse) => {
                console.log(txResponse);
                document.querySelector(".finalizeWithdrawSent").innerHTML =
                    "Finalize transaction sent. Check layer 1 block explorer to confirm.";
                let finalizeWithdrawTxHash = txResponse.hash;
                let chainId = txResponse.chainId;
                finalizeWithdrawTxUrl = getExplorerTxUrl(
                    finalizeWithdrawTxHash,
                    chainId
                );
                console.log("finalizeWithdraw tx url:", finalizeWithdrawTxUrl);
                return txResponse;
            })
            .catch((error) => {
                document.querySelector(".finalizeWithdrawSent").innerHTML =
                    "Error occured.\n Is the withdraw transaction status: 'verified' on L2 and executed on L1?\n " +
                    "Are you connected to the Layer 1 network you are withdrawing to via Metamask? \n" +
                    "A successful withdrawal is posted as 'Finalize Withdrawal' on the layer 1 block explorer \n";
                console.log(error);
            })
            .finally(() => {
                finalizeWithdrawLoading = false;
                finalizeWithdrawButtonDisable = false;
            });
    }

    function getExplorerTxUrl(txHash, chainId) {
        if (
            //zk era testnet
            chainId === 280
        ) {
            return `https://goerli.explorer.zksync.io/tx/${txHash}`;
        } else if (
            //zk era mainnet
            chainId === 324
        ) {
            return `https://explorer.zksync.io/tx/${txHash}`;
        } else if (
            //ethereum mainnet
            chainId === 1
        ) {
            return `https://goerli.etherscan.io/tx/${txHash}`;
        } else if (
            //ethereum goerli testnet
            chainId === 5
        ) {
            return `https://goerli.etherscan.io/tx/${txHash}`;
        } else return "";
    }
</script>

<main class="m-2">
    {#if !messageCheck}
        <div in:fade out:fade={{ duration: 100 }} class="noticeSection">
            <Notice />
        </div>
    {/if}
    <div class="checkboxGroup">
        <CheckboxGroup>
            <CheckboxGroup.Checkbox
                name="cb"
                value="cb"
                bind:checked={messageCheck}
                class="border-2 border-grey-200 rounded-sm m-2 p-3"
            >
                <CheckboxGroup.Checkbox.Label slot="label"
                    ><div class="border-4 border-yellow-300 rounded-lg p-4">
                        <p>(1) This application is not tested ⚠️</p>
                        <p>
                            (2) This application will use default gas costs ⛽
                        </p>
                        <p>
                            (3) This application does not ask for metamask
                            confirmation ⚠️
                        </p>
                        Be careful! 😊
                    </div></CheckboxGroup.Checkbox.Label
                >
            </CheckboxGroup.Checkbox>
        </CheckboxGroup>
    </div>

    {#if messageCheck}
        <div class="border-4 border-black-400 rounded-md p-2 m-2" in:fade>
            <Button
                type="link"
                {connectLoading}
                on:click={connectMetamaskButton}
                class="connectMetamask">Connect MetaMask</Button
            >
            {#if accountInfo.length > 0}
                <div style="display: inline-block;" class="showAccount">
                    <p>{accountInfo}</p>
                </div>
            {/if}
        </div>

        {#if connectedFlag}
            <div class="depositAndWithdrawButtons" in:fade>
                <div class="border-4 border-black-400 rounded-md p-2 m-2">
                    <h4 class="m-2">Deposit</h4>
                    <p class="m-2">Approve the token before depositing.</p>
                    <Button
                        type="link"
                        loading={approveLoading}
                        on:click={approveERC20Button}
                        class="approveButton">Approve Token ⛽</Button
                    >
                    <Input
                        name="depositAmountInput"
                        type="text"
                        bind:value={depositAmountInput}
                        placeholder="Number of tokens"
                        class="m-2"
                    >
                        <Input.Label slot="label">Deposit Amount:</Input.Label>
                    </Input>
                    <Button
                        type="link"
                        loading={depositLoading}
                        on:click={depositERC20}
                        class="depositButton"
                        disabled={depositButtonDisable}
                        >Deposit Tokens (no metamask confirmation) ⛽</Button
                    >
                    <div style="display: block;" class="showDepositTx" />
                    {#if depositTxUrl.length > 0}
                        <TxCard {depositTxUrl} />
                    {/if}

                    <Button
                        type="link"
                        loading={balanceLoading}
                        on:click={getBalance}
                        class="balanceButton"
                        >Get Token Balance on ZK Era</Button
                    >
                    <div style="display: inline-block;" class="showBalance" />
                </div>
                <div class="border-4 border-black-400 rounded-md p-2 m-2">
                    <h4 class="m-2">Withdraw</h4>
                    <p class="m-2">Withdrawals are done in two parts:</p>
                    <p class="m-2">
                        1. Withdraw calls Layer 2 and the funds are placed in
                        the ZK contract on Ethereum Layer 1
                    </p>
                    <p class="m-2">
                        2. Finalize withdraw tells the ZK contract on L1 to
                        release the funds to your address on L1.
                    </p>
                    <p />
                    <p class="m-2">You need ETH on ZKSync to pay gas fees.</p>
                    <p />
                    <div style="display: block;" class="withdrawToL1">
                        <p />
                        <Input
                            name="withdrawAmountInput"
                            type="text"
                            bind:value={withdrawAmountInput}
                            placeholder="Number of tokens"
                            class="m-2"
                        >
                            <Input.Label slot="label"
                                >Step 1. Withdraw Amount:</Input.Label
                            >
                        </Input>
                        <Button
                            type="link"
                            loading={withdrawLoading}
                            on:click={withdrawERC20}
                            class="withdrawButton"
                            disabled={withdrawButtonDisable}
                            >Start Withdraw ⛽</Button
                        >
                        <div style="display: block;" class="showWithdrawSent" />
                        {#if withdrawTxUrl.length > 0}
                            <TxCard txUrl={withdrawTxUrl} />
                        {/if}
                        <p class="m-2">
                            (After transaction reaches verified status on L2)
                        </p>
                        <Input
                            name="finalizeWithdrawInput"
                            type="text"
                            bind:value={finalizeTx}
                            placeholder="Default: use the value in settings file"
                            class="m-2"
                        >
                            <Input.Label slot="label"
                                >Step 2: ZKSync Withdraw Tx Hash:</Input.Label
                            >
                        </Input>
                        <Button
                            type="link"
                            loading={finalizeWithdrawLoading}
                            on:click={finalizeWithdrawERC20}
                            class="finalizeWithdrawButton"
                            disabled={finalizeWithdrawButtonDisable}
                            >Finalize Withdraw ⛽</Button
                        >
                        <div
                            style="display: block;"
                            class="finalizeWithdrawSent"
                        />
                        {#if finalizeWithdrawTxUrl.length > 0}
                            <TxCard {finalizeWithdrawTxUrl} />
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</main>
