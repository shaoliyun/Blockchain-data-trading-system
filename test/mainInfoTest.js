const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const assert  = require("assert");

//测试用例**************************************
const outlineData = {
    productName: "Test Product",
    description: "Test Description",
    provider: "Test Provider",
    price: 100,
    updateTime: Date.now(),
    popularity: 0
};

const titleData = {
    schematicDiagram: "Test Schematic Diagram",
    providerLogo: "Test Provider Logo",
    description: "Test Title Description"
};

const basicInformationData = {
    price: 100,
    productName: "Test Product",
    serisName: "Test Series",
    provider: "Test Provider",
    applicationSection: "Test Application Section",
    dataTheme: "Test Data Theme",
    productType: "Test Product Type",
    description: "Test Basic Information Description",
    keyWords: ["test", "product"],
    dataSize: "Test Data Size",
    dataPortrait: "Test Data Portrait",
    instructions: "Test Instructions"
};

const useCaseData = {
    text: "Test Use Case Text",
    picture: ["Test Picture 1", "Test Picture 2"]
};

const outlineData1 = {
    productName: "Product A",
    description: "Description A",
    provider: "Provider A",
    price: 100,
    updateTime: Date.now(),
    popularity: 10
};
  
const outlineData2 = {
    productName: "Product B",
    description: "Description B",
    provider: "Provider B",
    price: 200,
    updateTime: Date.now(),
    popularity: 5
};
  
const outlineData3 = {
    productName: "Product C",
    description: "Description C",
    provider: "Provider C",
    price: 300,
    updateTime: Date.now(),
    popularity: 20
};
  
  
const basicInformationData1 = {
    price: 100,
    productName: "Product A",
    serisName: "Series A",
    provider: "Provider A",
    applicationSection: "Application Section A",
    dataTheme: "Data Theme A",
    productType: "Product Type A",
    description: "Basic Information Description A",
    keyWords: ["product", "A"],
    dataSize: "Data Size A",
    dataPortrait: "Data Portrait A",
    instructions: "Instructions A"
};
  
const basicInformationData2 = {
    price: 200,
    productName: "Product B",
    serisName: "Series B",
    provider: "Provider B",
    applicationSection: "Application Section B",
    dataTheme: "Data Theme B",
    productType: "Product Type B",
    description: "Basic Information Description B",
    keyWords: ["product", "B"],
    dataSize: "Data Size B",
    dataPortrait: "Data Portrait B",
    instructions: "Instructions B"
};
  
const basicInformationData3 = {
    price: 300,
    productName: "Product C",
    serisName: "Series C",
    provider: "Provider C",
    applicationSection: "Application Section C",
    dataTheme: "Data Theme C",
    productType: "Product Type C",
    description: "Basic Information Description C",
    keyWords: ["product", "C"],
    dataSize: "Data Size C",
    dataPortrait: "Data Portrait C",
    instructions: "Instructions C"
};
  
const useCaseData1 = {
    text: "Use Case Text A",
    picture: ["Picture A1", "Picture A2"]
};
  
const useCaseData2 = {
    text: "Use Case Text B",
    picture: ["Picture B1", "Picture B2"]
};
  
const useCaseData3 = {
    text: "Use Case Text C",
    picture: ["Picture C1", "Picture C2"]
};

describe("MainInformation contract", function(){

    async function deployTokenFixture() {
        // Get the ContractFactory and Signers here.
        const mainInformation = await ethers.getContractFactory("MainInformation");
        const hardhatMainInfo = await mainInformation.deploy();
    
        // Fixtures can return anything you consider useful for your tests
        return {mainInformation, hardhatMainInfo};
    }

    describe("upload", function(){
        it("should correctly update user information", async function(){
            const {hardhatMainInfo} = await loadFixture(deployTokenFixture);
            await hardhatMainInfo.uploadData(outlineData, titleData, basicInformationData, useCaseData);
            const dataNumber = await hardhatMainInfo.dataNumber();
            const outlineStorage = await hardhatMainInfo.outlineStorages(0);

            assert.equal(outlineStorage.outline.productName, "Test Product");
            assert.equal(outlineStorage.outline.description, "Test Description");
            assert.equal(outlineStorage.outline.provider, "Test Provider");
            assert.equal(outlineStorage.outline.price, 100);
            assert.equal(outlineStorage.outline.popularity, 0);

            const mainInformation1 = await hardhatMainInfo.mainInfos(0);
            assert.equal(mainInformation1.title.description, "Test Title Description");
        });
    })

    describe("search", function(){
        it("Should search by keyword and sort successfully", async function () {
            const {hardhatMainInfo} = await loadFixture(deployTokenFixture);

            await hardhatMainInfo.uploadData(outlineData1, titleData, basicInformationData1, useCaseData1);
            await hardhatMainInfo.uploadData(outlineData2, titleData, basicInformationData2, useCaseData2);
            await hardhatMainInfo.uploadData(outlineData3, titleData, basicInformationData3, useCaseData3);

            const result1 = await hardhatMainInfo.searchByKeyword("product", "popularity");
            assert.equal(result1.length, 3);
            assert.equal(result1[0].outline.productName, "Product C");
            assert.equal(result1[1].outline.productName, "Product A");
            assert.equal(result1[2].outline.productName, "Product B");
            
            const result2 = await hardhatMainInfo.searchByKeyword("A", "updateTime");
            assert.equal(result2.length, 1);
            assert.equal(result2[0].outline.productName, "Product A");
            
            const result3 = await hardhatMainInfo.searchByKeyword("D", "popularity");
            assert.equal(result3.length, 0);
        });
            
        it("Should search by code name successfully", async function(){
            const {hardhatMainInfo} = await loadFixture(deployTokenFixture);

            await hardhatMainInfo.uploadData(outlineData1, titleData, basicInformationData1, useCaseData1);
            await hardhatMainInfo.uploadData(outlineData2, titleData, basicInformationData2, useCaseData2);
            await hardhatMainInfo.uploadData(outlineData3, titleData, basicInformationData3, useCaseData3);

            const result1 = await hardhatMainInfo.searchByCodeName(0);
            console.log(result1.outline.productName);
            assert.equal(result1.outline.productName, "Product A");
            
            
            const result2 = await hardhatMainInfo.searchByCodeName(2);
            console.log(result2.outline.productName);
            assert.equal(result2.outline.productName, "Product C");
        
        });

        it("Should get main info successfully", async function () {
            const {hardhatMainInfo} = await loadFixture(deployTokenFixture);

            await hardhatMainInfo.uploadData(outlineData1, titleData, basicInformationData1, useCaseData1);
            await hardhatMainInfo.uploadData(outlineData2, titleData, basicInformationData2, useCaseData2);

            const dataNumber = await hardhatMainInfo.dataNumber();
            console.log(dataNumber);

            const result = await hardhatMainInfo.searchMainInfo(1);
            console.log(result);

            assert.equal(result.basicInformation.price, basicInformationData2.price);
        });
    })

    describe("delete", function(){
        it("Should delete info successfully", async function(){
            const {hardhatMainInfo} = await loadFixture(deployTokenFixture);

            await hardhatMainInfo.uploadData(outlineData1, titleData, basicInformationData1, useCaseData1);
            await hardhatMainInfo.uploadData(outlineData2, titleData, basicInformationData2, useCaseData2);

            await hardhatMainInfo.infoDelete(1);
            
            const exist1 = await hardhatMainInfo.mainInfoExists(1);
            console.log(await hardhatMainInfo.mainInfoExists(1));
            assert.equal(exist1, false);

        });
    })

    describe("add popularity", function(){
        it("should add correctly", async function(){
            const {hardhatMainInfo} = await loadFixture(deployTokenFixture);

            await hardhatMainInfo.uploadData(outlineData1, titleData, basicInformationData1, useCaseData1);
            
            const data1 = await hardhatMainInfo.searchByCodeName(0);
            console.log(data1.outline.popularity);

            await hardhatMainInfo.popularityAdd(0);

            const data2 = await hardhatMainInfo.searchByCodeName(0);
            console.log(data2.outline.popularity);

            assert.equal(Number(data1.outline.popularity), Number(data2.outline.popularity)-1);

        })
    })
})

    
      
      
      
    
