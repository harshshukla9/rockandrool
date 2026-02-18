// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiceMania is ReentrancyGuard, Ownable {

    uint256 public poolId;

    constructor() Ownable(msg.sender) {}

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
        external
        onlyOwner
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
        external
        payable
    {
        DicePool storage p = pools[_poolId];

        require(!p.ended, "POOL CLOSED");
        require(block.timestamp < p.endtime, "BETTING OVER");
        require(target >= 1 && target <= 12, "Pick 1-12");
        require(msg.value == p.baseamount, "Wrong bet amount");

        bets[_poolId].push(
            DiceBet({
                user: msg.sender,
                amount: msg.value,
                targetScore: target
            })
        );

        p.totalamount += msg.value;
    }

    /* ------------------------------------------------------------ */
    /* RESOLVE POOL WITH KECCAK RANDOM */
    /* ------------------------------------------------------------ */

    function resolvePool(uint256 _poolId)
        external
        onlyOwner
        nonReentrant
    {
        DicePool storage p = pools[_poolId];

        require(block.timestamp >= p.endtime, "POOL NOT ENDED");
        require(!p.ended, "ALREADY RESOLVED");

        uint256 random =
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender,
                        p.totalamount,
                        bets[_poolId].length
                    )
                )
            ) % 12 + 1;

        p.result = random;
        p.ended = true;

        _distributeFunds(_poolId, random);
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
            if (poolBets[i].targetScore == result) {
                winners++;
            }
        }

        // No winners → owner gets pool
        if (winners == 0) {
            (bool ok, ) = payable(owner()).call{value: p.totalamount}("");
            require(ok, "Transfer failed");
            return;
        }

        uint256 reward = p.totalamount / winners;

        for (uint256 i = 0; i < poolBets.length; i++) {
            if (poolBets[i].targetScore == result) {
                (bool ok, ) = payable(poolBets[i].user).call{value: reward}("");
                require(ok, "Transfer failed");
            }
        }
    }

    /* ------------------------------------------------------------ */
    /* GETTERS */
    /* ------------------------------------------------------------ */

    function getPool(uint256 _poolId)
        external
        view
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
        external
        view
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
        require(amount <= address(this).balance, "Not enough balance");
        (bool ok, ) = payable(owner()).call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    receive() external payable {}
}
