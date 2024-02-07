import { Address,beginCell, contractAddress, toNano, TonClient4, WalletContractV4,WalletContractV3R2, internal, fromNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "ton-crypto";


import { FanslandContract } from ".././output/FanslandSell_FanslandContract";


import { printSeparator } from ".././utils/print";
import * as dotenv from "dotenv";
dotenv.config();

(async () => {
    //create client for testnet sandboxv4 API - alternative endpoint
    const client4 = new TonClient4({
         endpoint: "https://sandbox-v4.tonhubapi.com",
        //endpoint: "https://mainnet-v4.tonhubapi.com",
    });

    let mnemonics = (process.env.mnemonics_2 || "").toString(); // 🔴 Change to your own, by creating .env file!
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(" "));
    let secretKey = keyPair.secretKey;
    let workchain = 0; //we are working in basechain.
    let deployer_wallet = WalletContractV3R2.create({ workchain, publicKey: keyPair.publicKey });
    console.log(deployer_wallet.address);

   
    let deployer_wallet_contract = client4.open(deployer_wallet);

    const scoreAddr = Address.parse("EQC11I9xPYfweev3IwGOFERseOsN_j6lz8MxjhW-Q6kcxQ1S");
    // Compute init data for deployment
    // NOTICE: the parameters inside the init functions were the input for the contract address
    // which means any changes will change the smart contract address as well
    let init = await FanslandContract.init(BigInt(100), scoreAddr);
    let jettonMaster = contractAddress(workchain, init);


    // send a message on new address contract to deploy it
    let seqno: number = await deployer_wallet_contract.getSeqno();
    console.log("🛠️Preparing new outgoing massage from deployment wallet. \n" + deployer_wallet_contract.address);
    console.log("Seqno: ", seqno + "\n");
    printSeparator();

    // Get deployment wallet balance
    let balance: bigint = await deployer_wallet_contract.getBalance();

    console.log("Current deployment wallet balance = ", fromNano(balance).toString(), "💎TON");

    printSeparator();

    console.log("====== Deployment message sent to =======\n", jettonMaster);
    let deployAmount = toNano("0.15");
    
    let packed_msg = beginCell()
    .endCell();

    await deployer_wallet_contract.sendTransfer({
        seqno,
        secretKey,
        messages: [
            internal({
                to: jettonMaster,
                value: deployAmount,
                init: {
                    code: init.code,
                    data: init.data,
                },
                body: packed_msg,
            }),
        ],
    });
    console.log("====== Deployment message sent to =======\n", jettonMaster);
})();
