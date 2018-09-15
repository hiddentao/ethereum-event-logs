pragma solidity ^0.4.24;

contract Events {
    event Event1(string indexed stringVar1, string stringVar2);
    event Event2(bytes32 indexed bytes32Var, bool indexed boolVar, string stringVar);
    event Event3(address indexed addressVar, uint uintVar, uint64[] indexed uint64Var1, uint64[] uint64Var2);
    event Event4(bytes bytesVar) anonymous;

    constructor () public {}

    function emit() public {
        emit Event1('test1', 'test2');
        emit Event2(keccak256('test1'), false, 'test2');
        uint64[] memory numbers = new uint64[](3);
        numbers[0] = 100;
        numbers[1] = 101;
        numbers[2] = 102;
        emit Event3(address(this), 2342, numbers, numbers);
        emit Event4('0x123');
    }
}
