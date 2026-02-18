export const contract = {
    address: "0x1Ab513506e5CF746a11d4b5Df457b0536Cb8e224",
    abi: [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            }
          ],
          "name": "OwnableInvalidOwner",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "OwnableUnauthorizedAccount",
          "type": "error"
        },
        {
          "inputs": [],
          "name": "ReentrancyGuardReentrantCall",
          "type": "error"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "OwnershipTransferred",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "bets",
          "outputs": [
            {
              "internalType": "address",
              "name": "user",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "targetScore",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "duration",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "baseamount",
              "type": "uint256"
            }
          ],
          "name": "createPool",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_poolId",
              "type": "uint256"
            }
          ],
          "name": "getBets",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "user",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "targetScore",
                  "type": "uint256"
                }
              ],
              "internalType": "struct DiceMania.DiceBet[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_poolId",
              "type": "uint256"
            }
          ],
          "name": "getPool",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "start",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "end",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "result",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "ended",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "baseamount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalBets",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getTotalPools",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_poolId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "target",
              "type": "uint256"
            }
          ],
          "name": "placeBet",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "poolId",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "pools",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "starttime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "endtime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalamount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "result",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "ended",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "baseamount",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "renounceOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_poolId",
              "type": "uint256"
            }
          ],
          "name": "resolvePool",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "transferOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "withdraw",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "stateMutability": "payable",
          "type": "receive"
        }
      ],
}