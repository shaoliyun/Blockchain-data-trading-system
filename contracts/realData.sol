pragma solidity ^0.8.0;


//该合约用于双方密钥管理和数据交易中信息存证
//需要辅助线下的密钥生成（公私钥）算法及对应公钥加解密、对称加密算法、差分隐私算法、数据上传下载途径来组成完整的数据交易功能

contract realData{
    mapping(address => bytes32) public publicKeys;
    mapping(address => bytes32) private privateKeys;
    mapping(address => bool) public keyExist;


    //将密钥上传至智能合约中
    function uploadKeyPair(bytes32 privateKey, bytes32 publicKey) public returns (bytes32, bytes32){
        publicKeys[msg.sender] = publicKey;
        privateKeys[msg.sender] = privateKey;
        keyExist[msg.sender] = true;

        return (privateKey, publicKey);
    }
    

    //发起交易请求
    event TransactionRequest(address sender, address receiver, uint256 codeNumber, uint256 amount, bytes signature);

    function requestTransaction(address receiver, uint256 codeNumber, uint256 amount, bytes memory signature) public {

        emit TransactionRequest(msg.sender, receiver, codeNumber, amount, signature);
    }
    

    //交易请求确认
    //这里数据加密使用对称加密，先发送各种值、加密数据哈希值和签名，并同步发送加密后数据
    //发送数据考虑使用ISPF文件（？）存储,不在智能合约上操作
    event TransactionConfirmation(address sender, address receiver, uint256 codeNumber, uint256 amount, bytes32 dataHash, bytes signature);

    //考虑将签名、签名验证步骤也放到链下解决，此函数被数据拥有者调用时，需要数据拥有者已经验证完交易请求的签名，并对自己的验证信息和数据计算完签名
    function confirmTransaction(address requestSender, address requestReceiver, uint256 codeNumber, uint256 amount, bytes memory signature, bytes32 dataHash) public {
        require(requestReceiver == msg.sender, "not the receiver");

        emit TransactionConfirmation(requestSender, requestReceiver, codeNumber, amount, dataHash, signature);
    }


    //确认收到加密后数据,此函数需要与付款同时发起
    //付款预计使用web3.js实现，不在智能合约上操作
    event ReceiveDataConfirmation(address requestSender, address requestReceiver, uint256 codeNumber, bytes signature);

    //数据请求者需要在线下验证完数据，并计算完自己确认信息的签名
    function confirmDataReceived(address requestSender, address requestReceiver, uint256 codeNumber, bytes memory signature) public{
        require(requestSender == msg.sender, "not the requestSender");

        emit ReceiveDataConfirmation(requestSender, requestReceiver, codeNumber, signature);
    }

    //传输用于解密数据的密钥，该密钥使用接收方的公钥进行加密
    event dataKeySent(address requestSender, address requestReceiver, uint256 codeNumber, string encryptedDataKey, bytes signature);

    function sendDataKey(address requestSender, address requestReceiver, uint256 codeNumber, string memory encryptedDataKey, bytes memory signature) public {
        require(requestReceiver == msg.sender, "not the data provider");

        emit dataKeySent(requestSender, requestReceiver, codeNumber, encryptedDataKey, signature);
    }

    //查询公钥
    function publicKeySearch(address addressAsk) public view returns(bytes32){
        require(keyExist[addressAsk], "no key exist");

        return publicKeys[addressAsk];
    }

    //查询私钥
    function privateKeyAsk() public view returns(bytes32){
        require(keyExist[msg.sender], "no key exist");
        
        return privateKeys[msg.sender];
    }

    //数据接收者对数据打分
    event Evaluation(address requestSender, address requestReceiver, uint8 score, bytes signature);

    function evaluate(address requestSender, address requestReceiver, uint8 score, bytes memory signature) public {
        require(score >= 1 && score <= 5, "Invalid score");
        require(requestSender == msg.sender, "not the requestSender");

        emit Evaluation(requestSender, requestReceiver, score, signature);
    }
    
}