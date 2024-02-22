pragma solidity ^0.8.0;
import "./MainInformation.sol";

//本合约主要用于数据监管信息的更新和删除

contract QualificationInformation{

    struct Qualification{
        string sourceDescription; //来源描述
        bool complianceAassessment; //合规评估报告
        bool qualityAssurance; //质量评估证报告
        bool assetValuation; //资产评估证报告
    } //资质信息，单独成一个表

    struct QualificationStorage{
        uint256 codeName;
        Qualification qualification;
    }

    //--------------------------------------------------------------------
    mapping(uint256 => QualificationStorage) public qualificationStorages;

    //function6：更新监管信息**********************************************
    event QualificationUpdated(uint256 indexed codeName, string updateType, bool reported, address updater);

    function qualificationUpdate(uint256 codeName, string memory updateType, bool reported) public{
        require(bytes(updateType).length > 0, "Update type cannot be empty");

        if (qualificationStorages[codeName].codeName == 0) {
            qualificationStorages[codeName].codeName = codeName;
            qualificationStorages[codeName].qualification = Qualification("", false, false, false);
        }

        if(keccak256(bytes(updateType)) == keccak256(bytes("complianceAassessment"))){
            qualificationStorages[codeName].qualification.complianceAassessment = reported;
        }
        else if(keccak256(bytes(updateType)) == keccak256(bytes("qualityAssurance"))){
            qualificationStorages[codeName].qualification.qualityAssurance = reported;
        }
        else if(keccak256(bytes(updateType)) == keccak256(bytes("assetValuation"))){
            qualificationStorages[codeName].qualification.assetValuation = reported;
        }
        else{
            revert("Invalid update type");
        }

        emit QualificationUpdated(codeName, updateType, reported, msg.sender);
    }

    event qualificationDeleted(uint256 codeName, address deleter);

    function deleteQualificationInfo(uint256 codeName) public{
        require(qualificationStorages[codeName].codeName == codeName, "codeName does not exist");
        delete qualificationStorages[codeName];

        emit qualificationDeleted(codeName, msg.sender);
    }
}