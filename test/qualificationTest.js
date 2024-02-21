const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QualificationInformation contract", function(){
    let qualificationInformation, owner, user1, user2;
    const codeName = 12345;

    beforeEach(async function(){
        [owner, user1, user2] = await ethers.getSigners();

        const QualificationInformation = await ethers.getContractFactory("QualificationInformation");
        qualificationInformation = await QualificationInformation.connect(owner).deploy();

        await qualificationInformation.connect(owner).qualificationUpdate(codeName, "complianceAassessment", true);
        await qualificationInformation.connect(owner).qualificationUpdate(codeName, "qualityAssurance", false);
        await qualificationInformation.connect(owner).qualificationUpdate(codeName, "assetValuation", true);
    });

    describe("qualificationUpdate function", function(){
        it("should update complianceAassessment", async function(){
            await qualificationInformation.connect(owner).qualificationUpdate(codeName, "complianceAassessment", false);
            const qualificationStorage = await qualificationInformation.connect(owner).qualificationStorages(codeName);
            expect(qualificationStorage.qualification.complianceAassessment).to.be.false;
        });

        it("should update qualityAssurance", async function(){
            await qualificationInformation.connect(owner).qualificationUpdate(codeName, "qualityAssurance", true);
            const qualificationStorage = await qualificationInformation.connect(owner).qualificationStorages(codeName);
            expect(qualificationStorage.qualification.qualityAssurance).to.be.true;
        });

        it("should update assetValuation", async function(){
            await qualificationInformation.connect(owner).qualificationUpdate(codeName, "assetValuation", false);
            const qualificationStorage = await qualificationInformation.connect(owner).qualificationStorages(codeName);
            expect(qualificationStorage.qualification.assetValuation).to.be.false;
        });

        it("should emit QualificationUpdated event", async function(){
            await expect(qualificationInformation.connect(owner).qualificationUpdate(codeName, "complianceAassessment", false))
                .to.emit(qualificationInformation, "QualificationUpdated")
                .withArgs(codeName, "complianceAassessment", false);
        });

        it("should revert if updateType is invalid", async function(){
            await expect(qualificationInformation.connect(owner).qualificationUpdate(codeName, "invalidType", false)).to.be.revertedWith("Invalid update type");
        });
    });

    describe("deleteQualificationInfo function", function(){
        it("should delete qualification information", async function(){
            await qualificationInformation.connect(owner).deleteQualificationInfo(codeName);
            const qualificationStorage = await qualificationInformation.connect(owner).qualificationStorages(codeName);
            expect(qualificationStorage.codeName).to.be.equal(0);
        });

        it("should emit qualificationDeleted event", async function(){
            await expect(qualificationInformation.connect(owner).deleteQualificationInfo(codeName))
                .to.emit(qualificationInformation, "qualificationDeleted")
                .withArgs(codeName);
        });

        it("should revert if codeName does not exist", async function(){
            await expect(qualificationInformation.connect(owner).deleteQualificationInfo(99999)).to.be.revertedWith("codeName does not exist");
        });
    });
});