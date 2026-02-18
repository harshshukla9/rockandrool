// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts@1.5.0/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts@1.5.0/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract DiceMania is ReentrancyGuard, VRFConsumerBaseV2Plus {

    uint256 public poolId;

    uint256 public subscriptionId;
    bytes32 public keyHash;

    uint32 public callbackGasLimit = 800000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    mapping(uint256 => uint256) public requestToPool;

    constructor(
        uint256 _subId,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        subscriptionId = _subId;
        keyHash = _keyHash;
    }

    /* ------------------------------------------------------------ */
    /* STRUCTS */
    /* ------------------------------------------------------------ */

    struct DicePool {
        uint256 id;
        uint256 starttime;
        uint256 endtime;
        uint256 totalamount;
        uint256 result;
        bool ended;
        uint256 baseamount;
    }

    struct DiceBet {
        address user;
        uint256 amount;
        uint256 targetScore;
    }

    mapping(uint256 => DicePool) public pools;
    mapping(uint256 => DiceBet[]) public bets;

    /* ------------------------------------------------------------ */
    /* CREATE POOL */
    /* ------------------------------------------------------------ */

    function createPool(uint256 duration, uint256 baseamount)
        external onlyOwner
    {
        DicePool storage p = pools[poolId];
        p.id = poolId;
        p.starttime = block.timestamp;
        p.endtime = block.timestamp + duration;
        p.baseamount = baseamount;
        poolId++;
    }

    /* ------------------------------------------------------------ */
    /* PLACE BET */
    /* ------------------------------------------------------------ */

    function placeBet(uint256 _poolId, uint256 target)
        external payable
    {
        DicePool storage p = pools[_poolId];

        require(!p.ended, "POOL CLOSED");
        require(block.timestamp < p.endtime, "BETTING OVER");
        require(target >= 1 && target <= 12, "Pick 1-12");
        require(msg.value == p.baseamount, "Wrong bet");

        bets[_poolId].push(DiceBet(msg.sender, msg.value, target));
        p.totalamount += msg.value;
    }

    /* ------------------------------------------------------------ */
    /* RESOLVE POOL (REQUEST VRF RANDOM NUMBER) */
    /* ------------------------------------------------------------ */

    function resolvePool(uint256 _poolId)
        external onlyOwner
    {
        DicePool storage p = pools[_poolId];
        require(block.timestamp >= p.endtime, "POOL NOT ENDED");
        require(!p.ended, "ALREADY RESOLVED");

        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        requestToPool[requestId] = _poolId;
    }

    /* ------------------------------------------------------------ */
    /* VRF CALLBACK */
    /* ------------------------------------------------------------ */

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {

        uint256 _poolId = requestToPool[requestId];
        uint256 result = (randomWords[0] % 12) + 1;

        DicePool storage p = pools[_poolId];
        p.result = result;
        p.ended = true;

        _distributeFunds(_poolId, result);
    }

    /* ------------------------------------------------------------ */
    /* AUTO PAYOUT */
    /* ------------------------------------------------------------ */

    function _distributeFunds(uint256 _poolId, uint256 result)
        internal
    {
        DicePool storage p = pools[_poolId];
        DiceBet[] storage poolBets = bets[_poolId];

        uint256 winners = 0;

        for (uint256 i = 0; i < poolBets.length; i++) {
            if (poolBets[i].targetScore == result) winners++;
        }

        if (winners == 0) {
            payable(owner()).transfer(p.totalamount);
            return;
        }

        uint256 reward = p.totalamount / winners;

        for (uint256 i = 0; i < poolBets.length; i++) {
            if (poolBets[i].targetScore == result) {
                payable(poolBets[i].user).transfer(reward);
            }
        }
    }

    /* ------------------------------------------------------------ */
    /* GETTERS */
    /* ------------------------------------------------------------ */

    function getPool(uint256 _poolId)
        external view
        returns (
            uint256 id,
            uint256 start,
            uint256 end,
            uint256 totalAmount,
            uint256 result,
            bool ended,
            uint256 baseamount,
            uint256 totalBets
        )
    {
        DicePool storage p = pools[_poolId];
        return (
            p.id,
            p.starttime,
            p.endtime,
            p.totalamount,
            p.result,
            p.ended,
            p.baseamount,
            bets[_poolId].length
        );
    }

    function getBets(uint256 _poolId)
        external view
        returns (DiceBet[] memory)
    {
        return bets[_poolId];
    }

    function getTotalPools() external view returns (uint256) {
        return poolId;
    }

    /* ------------------------------------------------------------ */
    /* OWNER WITHDRAW */
    /* ------------------------------------------------------------ */

    function withdraw(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    receive() external payable {}
}
