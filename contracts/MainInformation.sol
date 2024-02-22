pragma solidity ^0.8.0;

//本合约主要用于用于用户浏览的数据信息的上传和查询

contract MainInformation{

    struct Outline{
        string productName; //产品名称
        string description; //产品名称
        string provider; //供方
        uint256 price; //价格
        uint256 updateTime; //更新时间
        uint256 popularity; //产品热度
    } //数据产品列表，单独成一个表
    
    struct OutlineStorage{
        uint256 codeName; //产品代码
        Outline outline; //存储信息
    }

    //-----------------------------------------------------
    struct Title{
        string schematicDiagram;    //数据产品示意图
        string providerLogo;        //供方商标
        string description;         //产品描述
    } //页头

    struct BasicInformation{
        uint256 price; //价格*
        string productName; //产品名称 *
        string serisName; //系列名称
        string provider; //供方名称 *
        string applicationSection; //应用板块
        string dataTheme; //数据主题
        string productType; //数据服务
        string description; //产品描述
        string[] keyWords; //关键词
        string dataSize; //数据大小 
        string dataPortrait; //数据画像
        string instructions; //使用说明
    } //基础信息

    struct UseCase{
        string text; //文字
        string[] picture; //图片
    } //使用案例

    struct MainInfo{
        uint256 codeName; //产品代码
        Title title;
        BasicInformation basicInformation;
        UseCase useCase;

    } //主要信息页面提供的信息，成一个表

    
    //--------------------------------------------------------------------
    uint256 public dataNumber = 0;

    //定义三个存储
    mapping(uint256 => OutlineStorage) public outlineStorages;
    mapping(uint256 => MainInfo)  public mainInfos;
    mapping(uint256 => bool) public mainInfoExists;
    mapping(string => uint256[]) public keywordIndex;
    mapping(uint256 => address) public dataOwner;

    //function1: 将用户上传的数据存储到智能合约中***************************************************************
    event DataUploaded(uint256 indexed codeName, string productName);
    
    function uploadData(Outline memory outlineData, Title memory titleData, BasicInformation memory basicInformationData, UseCase memory useCaseData) public{
        //先校验数据
        require(bytes(outlineData.productName).length > 0, "Product name cannot be empty");
        require(bytes(outlineData.provider).length > 0, "Provider cannot be empty");
        require(outlineData.price > 0, "Price cannot be zero or negative");
        require(bytes(titleData.description).length > 0, "Description cannot be empty");
        require(bytes(basicInformationData.productName).length > 0, "Product name cannot be empty");
        require(bytes(basicInformationData.provider).length > 0, "Provider cannot be empty");
        require(bytes(basicInformationData.dataTheme).length > 0, "Data theme cannot be empty");

        //判断是否已经上传过该数据
        require(!mainInfoExists[dataNumber], "data already exists");

        //先把数据存进数据结构里
        OutlineStorage memory outlineStorage1 = OutlineStorage(dataNumber, outlineData);
        MainInfo memory mainInfo1 = MainInfo(dataNumber, titleData, basicInformationData, useCaseData);
    
        //再把数据存储到智能合约的存储中
        outlineStorages[dataNumber] = outlineStorage1;
        mainInfos[dataNumber] = mainInfo1;
        mainInfoExists[dataNumber] = true;
        dataOwner[dataNumber] = msg.sender;

        //将关键词与codeName关联起来
        for(uint256 i = 0; i < basicInformationData.keyWords.length; i++){
            keywordIndex[basicInformationData.keyWords[i]].push(dataNumber);
        }

        emit DataUploaded(dataNumber, outlineData.productName);
        dataNumber = dataNumber + 1;

    }


    //function2：根据关键词匹配搜索outline数据****************************************************************

    function searchByKeyword(string memory keyword, string memory sortType) public view returns (OutlineStorage[] memory){

        //先处理关键词
        keyword = bytes(keyword).length > 0 ? keyword : "";

        //获取关键词相关的codeName数组
        uint256[] memory codeNameList = keywordIndex[keyword];
        uint256 count = codeNameList.length;

        // 根据符合条件的codename的数量创建一个outlineStorage数组
        OutlineStorage[] memory result = new OutlineStorage[](count);

        // 将符合条件的codename对应的outlineStorage加入到result数组中
        for (uint256 i = 0; i < count; i++) {
            result[i] = outlineStorages[codeNameList[i]];
        }

        //排序
        if(keccak256(abi.encodePacked(sortType)) == keccak256(abi.encodePacked("popularity")) && count > 0){
            quickSortPopularity(result, int256(0), int256(count - 1));
        }
        else if(keccak256(abi.encodePacked(sortType)) == keccak256(abi.encodePacked("updateTime")) && count > 0){
            quickSortByUpdateTime(result, int256(0), int256(count - 1));
        }
        
        return result;
    }


    function quickSortPopularity(OutlineStorage[] memory result, int256 left, int256 right) public view {
        int256 i = left;
        int256 j = right;
        if (i == j) return;
        uint256 pivot = result[uint256(left + (right - left) / 2)].outline.popularity;
        while (i <= j) {
            while (result[uint256(i)].outline.popularity > pivot) i++;
            while (pivot > result[uint256(j)].outline.popularity) j--;
            if (i <= j) {
                (result[uint256(i)], result[uint256(j)]) = (result[uint256(j)], result[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j) quickSortPopularity(result, left, j);
        if (i < right) quickSortPopularity(result, i, right);
    }

    function quickSortByUpdateTime(OutlineStorage[] memory result, int256 left, int256 right) public view {
        int256 i = left;
        int256 j = right;
        if (i == j) return;
        uint256 pivot = result[uint256(left + (right - left) / 2)].outline.updateTime;
        while (i <= j) {
            while (result[uint256(i)].outline.updateTime > pivot) i++;
            while (pivot > result[uint256(j)].outline.updateTime) j--;
            if (i <= j) {
                (result[uint256(i)], result[uint256(j)]) = (result[uint256(j)], result[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j) quickSortByUpdateTime(result, left, j);
        if (i < right) quickSortByUpdateTime(result, i, right);
    }

    //function3：根据产品代码匹配搜索outline数据*****************************************************

    function searchByCodeName(uint256 codeName) public view returns (OutlineStorage memory) {
        require(mainInfoExists[codeName], "Main info does not exist"); 

        return outlineStorages[codeName];
    }

    //function4：根据产品描述、数据画像和产品名称匹配搜索outline数据***************************************

    function searchByKeywords(string[] memory keywords, string memory sortType) public view returns (OutlineStorage[] memory) {

        uint256 i;

        //处理关键词
        for(i = 0; i < keywords.length; i++){
            keywords[i] = bytes(keywords[i]).length > 0 ? keywords[i] : "";
        }

        uint256 count = 0;
        
        // 先遍历一遍mainInfos，找到符合条件的codename的数量
        for (i = 0; i < dataNumber; i++) {
            if (containsKeywords(mainInfos[i].basicInformation.description, keywords) ||
                containsKeywords(mainInfos[i].basicInformation.dataPortrait, keywords) ||
                containsKeywords(mainInfos[i].basicInformation.productName, keywords)) {
                count++;
            }
        }
        // 根据符合条件的codename的数量创建一个outlineStorage数组
        OutlineStorage[] memory result = new OutlineStorage[](count);
        count = 0;
        // 再遍历一遍mainInfos，将符合条件的codename对应的outlineStorage加入到result数组中
        for (i = 0; i < dataNumber; i++) {
            if (containsKeywords(mainInfos[i].basicInformation.description, keywords) ||
                containsKeywords(mainInfos[i].basicInformation.dataPortrait, keywords) ||
                containsKeywords(mainInfos[i].basicInformation.productName, keywords)) {
                result[count] = outlineStorages[mainInfos[i].codeName];
                count++;
            }
        }

        if(keccak256(bytes(sortType)) == keccak256(bytes("popularity")) && count > 0){
            quickSortPopularity(result, int256(0), int256(count - 1));
        }
        else if(keccak256(bytes(sortType)) == keccak256(bytes("updateTime"))){
            quickSortByUpdateTime(result, int256(0), int256(count - 1));
        }

        return result;
    }

    function containsKeywords(string memory text, string[] memory keywords) internal pure returns (bool) {
        for (uint256 i = 0; i < keywords.length; i++) {
            if (bytes(text).length >= bytes(keywords[i]).length && 
                keccak256(bytes(text)) != keccak256("") && 
                keccak256(bytes(keywords[i])) == keccak256(bytes(text))) {
                return true;
            }
            if (bytes(text).length > bytes(keywords[i]).length && 
                keccak256(bytes(text)) != keccak256("") && 
                keccak256(bytes(keywords[i])) != keccak256("") && 
                contains(text, keywords[i])) {
                return true;
            }
        }
        return false;
    }

    function contains(string memory text, string memory keyword) internal pure returns (bool) {
        bytes memory textBytes = bytes(text);
        bytes memory keywordBytes = bytes(keyword);
        uint256 j = 0;
        for (uint256 i = 0; i < textBytes.length; i++) {
            if (textBytes[i] == keywordBytes[j]) {
                j++;
                if (j == keywordBytes.length) {
                    return true;
                }
            } else {
                j = 0;
            }
        }
        return false;
    }



    //function4：根据codename返回主要信息页的数据*******************************************************
    //此函数未能内置popularity增加的功能，需要同时调用popularityAdd(uint256 codeName)函数

    function searchMainInfo(uint256 codeName) public view returns (MainInfo memory){

        require(mainInfoExists[codeName], "Main info does not exist"); 

        //outlineStorages[codeName].outline.popularity += 1;

        return mainInfos[codeName];

    }




    //function5：删除数字商品信息*********************************************
    event InfoDeleted(uint256 codeName);

    function infoDelete(uint256 codeName) public{
        require(mainInfoExists[codeName], "Main info does not exist"); 
        require(dataOwner[codeName] == msg.sender, "do not have access");

        //删除关键词与codeName的关联
        for(uint256 i = 0; i < mainInfos[codeName].basicInformation.keyWords.length; i++){
            uint256[] storage codeNameList = keywordIndex[mainInfos[codeName].basicInformation.keyWords[i]];
            for(uint256 j = 0; j < codeNameList.length; j++){
                if(codeNameList[j] == codeName){
                    codeNameList[j] = codeNameList[codeNameList.length - 1];
                    codeNameList.pop();
                    break;
                }
            }
        }

        delete outlineStorages[codeName];
        delete mainInfos[codeName];
        delete dataOwner[codeName];
        mainInfoExists[codeName] = false;

        emit InfoDeleted(codeName);
    }

    //function6:增加产品popularity
    function popularityAdd(uint256 codeName) public{
        require(mainInfoExists[codeName], "outlineStorage does not exist");

        outlineStorages[codeName].outline.popularity += 1;

    }
}