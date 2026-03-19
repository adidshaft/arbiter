export const EVM_TEST_TOKEN_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArbiterTestUsdt {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    address public immutable owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed tokenOwner, address indexed spender, uint256 value);

    error Unauthorized();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address initialRecipient,
        uint256 initialSupply
    ) {
        if (initialRecipient == address(0)) revert ZeroAddress();

        owner = msg.sender;
        name = tokenName;
        symbol = tokenSymbol;
        _mint(initialRecipient, initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < value) revert InsufficientAllowance();

        allowance[from][msg.sender] = allowed - value;
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) external returns (bool) {
        if (msg.sender != owner) revert Unauthorized();
        _mint(to, value);
        return true;
    }

    function _mint(address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();

        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        if (balanceOf[from] < value) revert InsufficientBalance();

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
`
