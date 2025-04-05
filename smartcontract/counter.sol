/**
 *Submitted for verification at amoy.polygonscan.com on 2025-04-05
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    // State variable to store the count, initialized to 0
    uint256 private count = 0;
    
    // Event that is emitted when the count changes
    event CountUpdated(uint256 newCount);
    
    // Function to get the current count
    function getCount() public view returns (uint256) {
        return count;
    }
    
    // Function to increment the count
    function increment() public {
        count += 1;
        emit CountUpdated(count);
    }
    
    // Function to decrement the count
    function decrement() public {
        // Check to prevent underflow
        require(count > 0, "Counter: cannot decrement below zero");
        count -= 1;
        emit CountUpdated(count);
    }
    
    // Function to reset the count to zero
    function reset() public {
        count = 0;
        emit CountUpdated(count);
    }
    
    // Function to set count to a specific value
    function setCount(uint256 newCount) public {
        count = newCount;
        emit CountUpdated(count);
    }
}